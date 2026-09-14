"""Quick smoke test: run the feature extraction + scoring pipeline on a
synthetic sine wave (stands in for a very robotic "cloned-like" signal) and
on shaped noise (stands in for a "real-like" noisy signal), just to prove the
pipeline runs end-to-end without crashing and produces sane output shapes.
This is not a claim about detection accuracy — see docs/README.md.
"""

import numpy as np

from app.services.feature_extraction import extract_clip_features
from app.services.risk_scoring import score_features

SR = 16000


def make_tone(duration=3.0, freq=180.0, sr=SR):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    y = 0.4 * np.sin(2 * np.pi * freq * t)
    return y.astype(np.float32)


def make_noisy_speech_like(duration=3.0, sr=SR):
    rng = np.random.default_rng(42)
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    f0 = 150 + 8 * np.sin(2 * np.pi * 0.7 * t) + rng.normal(0, 3, size=t.shape)
    phase = 2 * np.pi * np.cumsum(f0) / sr
    y = 0.3 * np.sin(phase) + 0.05 * rng.normal(0, 1, size=t.shape)
    envelope = 0.5 + 0.5 * np.sin(2 * np.pi * 2 * t) ** 2
    return (y * envelope).astype(np.float32)


def run_case(name, y):
    clip = extract_clip_features(y, SR, chunk_seconds=1.0)
    result = score_features(clip.aggregate)
    print(f"\n=== {name} ===")
    print("duration:", clip.duration_seconds, "chunks:", len(clip.chunks))
    print("waveform_preview points:", len(clip.waveform_preview))
    print("pitch_contour points:", len(clip.pitch_contour))
    print("spectrogram shape:", len(clip.spectrogram), "x", len(clip.spectrogram[0]) if clip.spectrogram else 0)
    print("risk_score:", result.risk_score, "verdict:", result.verdict, "confidence:", result.confidence)
    for c in result.contributions[:4]:
        print(f"  {c.feature:18s} suspicion={c.suspicion:.2f} weight={c.weight:.2f} contrib={c.contribution:.3f}")
    assert 0 <= result.risk_score <= 100
    assert result.verdict in ("real", "cloned")
    assert len(clip.chunks) >= 2
    assert len(clip.waveform_preview) > 0


if __name__ == "__main__":
    run_case("pure tone (robotic)", make_tone())
    run_case("jittery noisy speech-like", make_noisy_speech_like())
    print("\nSMOKE TEST PASSED")
