import io

import numpy as np
import soundfile as sf
from fastapi import HTTPException, status


def load_audio(raw_bytes: bytes, filename: str, target_sr: int) -> tuple[np.ndarray, int]:
    """Decode uploaded audio bytes into a mono float32 waveform at target_sr.

    Tries soundfile first (robust for wav/flac/ogg), then falls back to
    librosa/audioread (covers mp3/m4a when an ffmpeg backend is present on
    the host). Raises a clear HTTP error if neither can decode the file.
    """
    buffer = io.BytesIO(raw_bytes)
    try:
        y, sr = sf.read(buffer, dtype="float32", always_2d=False)
    except Exception:
        try:
            import librosa

            y, sr = librosa.load(io.BytesIO(raw_bytes), sr=None, mono=False)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Could not decode '{filename}'. Please upload a WAV file, "
                    "or an MP3/M4A if an audio codec backend is available on the server."
                ),
            ) from exc

    if y.ndim > 1:
        y = np.mean(y, axis=0 if y.shape[0] < y.shape[1] else 1)

    y = y.astype(np.float32)

    if sr != target_sr:
        import librosa

        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    peak = np.max(np.abs(y)) if y.size else 0.0
    if peak > 1e-6:
        y = y / peak * 0.98

    if y.size == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"'{filename}' contains no audio samples.",
        )

    return y, sr
