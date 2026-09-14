"""Signal-processing feature extraction for the voice-forensics heuristic.

Every feature here is computed directly from the waveform with librosa/numpy/
scipy — nothing is faked or randomly generated. The features are the same
family used in classic speaker-forensics and anti-spoofing literature
(pitch/F0 jitter, amplitude shimmer, harmonics-to-noise ratio, spectral
flatness/flux, zero-crossing rate dynamics, MFCC temporal dynamics, formant
bandwidth stability). See docs/README.md for calibration notes and caveats.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import librosa
import numpy as np

EPS = 1e-10


@dataclass
class ChunkFeatures:
    start_time: float
    end_time: float
    f0_mean: float
    f0_jitter_pct: float
    shimmer_pct: float
    hnr_db: float
    spectral_flatness: float
    spectral_flux: float
    zcr_var: float
    mfcc_delta_var: float
    formant_bw_var: float


@dataclass
class ClipFeatures:
    duration_seconds: float
    sample_rate: int
    chunks: list[ChunkFeatures]
    aggregate: ChunkFeatures
    waveform_preview: list[float] = field(default_factory=list)
    pitch_contour: list[dict] = field(default_factory=list)
    spectrogram: list[list[float]] = field(default_factory=list)


def _safe(value: float, default: float = 0.0) -> float:
    if value is None or not np.isfinite(value):
        return default
    return float(value)


def _pitch_series(y: np.ndarray, sr: int, frame_length: int, hop_length: int) -> np.ndarray:
    fmin = librosa.note_to_hz("C2")
    fmax = librosa.note_to_hz("C6")
    if len(y) < frame_length:
        return np.array([])
    f0, voiced_flag, _ = librosa.pyin(
        y, fmin=fmin, fmax=fmax, sr=sr, frame_length=frame_length, hop_length=hop_length
    )
    if f0 is None:
        return np.array([])
    voiced = f0[voiced_flag.astype(bool)] if voiced_flag is not None else f0[~np.isnan(f0)]
    voiced = voiced[np.isfinite(voiced)]
    return voiced


def _formant_bandwidth_variance(y: np.ndarray, sr: int, frame_len: int, hop: int) -> float:
    """Approximate F1/F2 bandwidth stability via per-frame LPC root analysis.

    Lower bandwidth variance across frames indicates unnaturally regular
    resonances, a known artifact of some neural vocoders.
    """
    order = 2 + sr // 1000
    bandwidths: list[float] = []

    window = np.hanning(frame_len)
    for start in range(0, max(len(y) - frame_len, 1), hop):
        seg = y[start : start + frame_len]
        if len(seg) < frame_len:
            break
        seg = seg * window
        if np.allclose(seg, 0):
            continue
        try:
            a = librosa.lpc(seg.astype(np.float64), order=order)
        except Exception:
            continue
        roots = np.roots(a)
        roots = roots[np.imag(roots) >= 0]
        for r in roots:
            if abs(r) < 1e-6:
                continue
            angle = np.angle(r)
            freq = angle * (sr / (2 * np.pi))
            if 200 < freq < 3500:
                radius = min(abs(r), 0.999999)
                bw = -(sr / np.pi) * np.log(radius)
                if np.isfinite(bw) and 0 < bw < 5000:
                    bandwidths.append(bw)

    if len(bandwidths) < 3:
        return float("nan")
    return float(np.var(bandwidths))


def _extract_segment_features(y: np.ndarray, sr: int) -> dict:
    frame_length = 1024 if sr >= 16000 else 512
    hop_length = frame_length // 4

    # --- Pitch (F0) + jitter ---
    voiced_f0 = _pitch_series(y, sr, frame_length, hop_length)
    if voiced_f0.size >= 2:
        f0_mean = float(np.mean(voiced_f0))
        f0_diffs = np.abs(np.diff(voiced_f0))
        f0_jitter_pct = float(np.mean(f0_diffs) / (f0_mean + EPS) * 100)
    else:
        f0_mean = float("nan")
        f0_jitter_pct = float("nan")

    # --- Amplitude shimmer (frame-to-frame RMS perturbation) ---
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    if rms.size >= 2 and np.mean(rms) > EPS:
        shimmer_pct = float(np.mean(np.abs(np.diff(rms))) / (np.mean(rms) + EPS) * 100)
    else:
        shimmer_pct = float("nan")

    # --- Harmonic-to-noise proxy via harmonic/percussive energy split ---
    try:
        y_harm, y_perc = librosa.effects.hpss(y)
        harm_energy = float(np.sum(y_harm**2))
        noise_energy = float(np.sum(y_perc**2)) + EPS
        hnr_db = 10 * np.log10((harm_energy + EPS) / noise_energy)
    except Exception:
        hnr_db = float("nan")

    # --- Spectral flatness ---
    flatness = librosa.feature.spectral_flatness(y=y, hop_length=hop_length)[0]
    spectral_flatness = float(np.mean(flatness)) if flatness.size else float("nan")

    # --- Spectral flux (scale-normalized) ---
    S = np.abs(librosa.stft(y, hop_length=hop_length))
    if S.shape[1] >= 2:
        flux = np.sqrt(np.sum(np.diff(S, axis=1) ** 2, axis=0))
        mean_mag = np.mean(S) + EPS
        spectral_flux = float(np.mean(flux) / mean_mag)
    else:
        spectral_flux = float("nan")

    # --- Zero-crossing rate variance ---
    zcr = librosa.feature.zero_crossing_rate(y, frame_length=frame_length, hop_length=hop_length)[0]
    zcr_var = float(np.var(zcr)) if zcr.size else float("nan")

    # --- MFCC delta (temporal dynamics) variance ---
    if len(y) >= frame_length:
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=hop_length)
        if mfcc.shape[1] >= 2:
            delta = librosa.feature.delta(mfcc)
            mfcc_delta_var = float(np.var(delta))
        else:
            mfcc_delta_var = float("nan")
    else:
        mfcc_delta_var = float("nan")

    # --- Formant bandwidth variance ---
    formant_bw_var = _formant_bandwidth_variance(y, sr, frame_length, hop_length * 2)

    return {
        "f0_mean": f0_mean,
        "f0_jitter_pct": f0_jitter_pct,
        "shimmer_pct": shimmer_pct,
        "hnr_db": hnr_db,
        "spectral_flatness": spectral_flatness,
        "spectral_flux": spectral_flux,
        "zcr_var": zcr_var,
        "mfcc_delta_var": mfcc_delta_var,
        "formant_bw_var": formant_bw_var,
    }


def _make_waveform_preview(y: np.ndarray, points: int = 600) -> list[float]:
    if y.size == 0:
        return []
    chunks = np.array_split(np.abs(y), min(points, y.size))
    return [float(np.max(c)) if c.size else 0.0 for c in chunks]


def _make_pitch_contour(y: np.ndarray, sr: int, max_points: int = 250) -> list[dict]:
    frame_length = 2048 if len(y) >= 2048 else max(256, len(y) // 2)
    hop_length = max(1, len(y) // max_points) if len(y) > 0 else 512
    if len(y) < frame_length:
        return []
    try:
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C6"),
            sr=sr,
            frame_length=frame_length,
            hop_length=hop_length,
        )
    except Exception:
        return []
    times = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=hop_length)
    out = []
    for t, freq, voiced in zip(times, f0, voiced_flag):
        out.append({"t": round(float(t), 3), "f0": round(float(freq), 1) if voiced and np.isfinite(freq) else None})
    return out


def _make_spectrogram(y: np.ndarray, sr: int, time_bins: int = 160, freq_bins: int = 48) -> list[list[float]]:
    if y.size < 512:
        return []
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=freq_bins, fmax=sr / 2)
    db = librosa.power_to_db(mel, ref=np.max)
    # Downsample the time axis to a fixed number of bins for a small JSON payload.
    if db.shape[1] > time_bins:
        splits = np.array_split(db, time_bins, axis=1)
        db = np.stack([np.mean(s, axis=1) for s in splits], axis=1)
    # Normalize to 0..1 for easy frontend color-mapping.
    d_min, d_max = np.min(db), np.max(db)
    norm = (db - d_min) / (d_max - d_min + EPS)
    return [[round(float(v), 3) for v in row] for row in norm.tolist()]


def extract_clip_features(y: np.ndarray, sr: int, chunk_seconds: float) -> ClipFeatures:
    duration = len(y) / sr
    chunk_len = int(chunk_seconds * sr)
    chunks: list[ChunkFeatures] = []

    if chunk_len > 0:
        for start in range(0, len(y), chunk_len):
            seg = y[start : start + chunk_len]
            if len(seg) < sr * 0.25:  # skip tiny trailing scraps
                continue
            feats = _extract_segment_features(seg, sr)
            chunks.append(
                ChunkFeatures(
                    start_time=round(start / sr, 2),
                    end_time=round(min(start + chunk_len, len(y)) / sr, 2),
                    f0_mean=_safe(feats["f0_mean"]),
                    f0_jitter_pct=_safe(feats["f0_jitter_pct"]),
                    shimmer_pct=_safe(feats["shimmer_pct"]),
                    hnr_db=_safe(feats["hnr_db"]),
                    spectral_flatness=_safe(feats["spectral_flatness"]),
                    spectral_flux=_safe(feats["spectral_flux"]),
                    zcr_var=_safe(feats["zcr_var"]),
                    mfcc_delta_var=_safe(feats["mfcc_delta_var"]),
                    formant_bw_var=_safe(feats["formant_bw_var"]),
                )
            )

    agg_raw = _extract_segment_features(y, sr)
    aggregate = ChunkFeatures(
        start_time=0.0,
        end_time=round(duration, 2),
        f0_mean=_safe(agg_raw["f0_mean"]),
        f0_jitter_pct=_safe(agg_raw["f0_jitter_pct"]),
        shimmer_pct=_safe(agg_raw["shimmer_pct"]),
        hnr_db=_safe(agg_raw["hnr_db"]),
        spectral_flatness=_safe(agg_raw["spectral_flatness"]),
        spectral_flux=_safe(agg_raw["spectral_flux"]),
        zcr_var=_safe(agg_raw["zcr_var"]),
        mfcc_delta_var=_safe(agg_raw["mfcc_delta_var"]),
        formant_bw_var=_safe(agg_raw["formant_bw_var"]),
    )

    return ClipFeatures(
        duration_seconds=round(duration, 3),
        sample_rate=sr,
        chunks=chunks,
        aggregate=aggregate,
        waveform_preview=_make_waveform_preview(y),
        pitch_contour=_make_pitch_contour(y, sr),
        spectrogram=_make_spectrogram(y, sr),
    )
