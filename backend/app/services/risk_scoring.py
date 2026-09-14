"""Explainable heuristic risk-scoring engine.

Combines the acoustic/spectral/prosody features from feature_extraction.py
into a single 0-100 "cloned voice" risk score, plus a ranked breakdown of
which features drove that score.

IMPORTANT — prototype-grade, not a trained classifier: the reference means
and standard deviations below are illustrative baselines assembled from
general speech-science literature on conversational speech (jitter, shimmer,
etc.), used only to calibrate this demo. They are not fitted to a labeled
dataset. `docs/README.md` explains how to recalibrate them against your own
labeled real/cloned samples, and `detect()` is the single seam where a
trained model (e.g. AASIST/RawNet2, as proposed in the PS26104 submission)
can later replace this heuristic without changing the API contract.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.services.feature_extraction import ChunkFeatures

# (label, direction, natural_mean, natural_std, weight, explanation)
#   direction "low"  -> unusually LOW values are suspicious (too smooth/regular)
#   direction "high" -> unusually HIGH values are suspicious (too clean)
FEATURE_SPECS = [
    (
        "f0_jitter_pct",
        "low",
        1.0,
        0.5,
        0.20,
        "Pitch (F0) jitter — natural voices wobble cycle-to-cycle; unnaturally steady pitch is a synthesis tell.",
    ),
    (
        "shimmer_pct",
        "low",
        5.0,
        2.0,
        0.15,
        "Amplitude shimmer — natural loudness varies slightly frame-to-frame; overly even loudness suggests synthesis.",
    ),
    (
        "mfcc_delta_var",
        "low",
        None,  # scale varies a lot by clip; handled via relative z against a fixed floor below
        None,
        0.20,
        "Timbre dynamics (MFCC deltas) — natural speech has more frame-to-frame micro-variation in timbre.",
    ),
    (
        "spectral_flux",
        "low",
        0.35,
        0.15,
        0.15,
        "Spectral flux — how much the spectrum shifts frame-to-frame; vocoders often over-smooth this.",
    ),
    (
        "zcr_var",
        "low",
        0.002,
        0.0015,
        0.10,
        "Zero-crossing rate variance — captures noise/turbulence irregularity typical of a real mic signal.",
    ),
    (
        "formant_bw_var",
        "low",
        4000.0,
        2500.0,
        0.10,
        "Formant bandwidth stability — unnaturally regular vocal-tract resonances can indicate a vocoder.",
    ),
    (
        "hnr_db",
        "high",
        8.0,
        6.0,
        0.10,
        "Harmonics-to-noise ratio — an unusually clean, noise-free signal can indicate synthetic generation.",
    ),
]

# Fixed floor/scale for mfcc_delta_var since its natural scale depends heavily
# on MFCC magnitude conventions; calibrated empirically as an illustrative default.
MFCC_DELTA_MEAN = 6.0
MFCC_DELTA_STD = 4.0


def _sigmoid(x: float) -> float:
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


def _suspicion(feature: str, direction: str, value: float, mean: float, std: float) -> float:
    if value is None or math.isnan(value) or std in (None, 0):
        return 0.5  # unknown -> neutral, don't let missing data swing the verdict
    z = (mean - value) / std if direction == "low" else (value - mean) / std
    return _sigmoid(z)


@dataclass
class FeatureContribution:
    feature: str
    suspicion: float
    weight: float
    contribution: float
    explanation: str


@dataclass
class RiskResult:
    risk_score: float
    verdict: str
    confidence: float
    contributions: list[FeatureContribution]


def score_features(feats: ChunkFeatures) -> RiskResult:
    contributions: list[FeatureContribution] = []
    total = 0.0

    for name, direction, mean, std, weight, explanation in FEATURE_SPECS:
        value = getattr(feats, name)
        if name == "mfcc_delta_var":
            mean, std = MFCC_DELTA_MEAN, MFCC_DELTA_STD
        suspicion = _suspicion(name, direction, value, mean, std)
        contribution = suspicion * weight
        total += contribution
        contributions.append(
            FeatureContribution(
                feature=name,
                suspicion=round(suspicion, 3),
                weight=weight,
                contribution=round(contribution, 4),
                explanation=explanation,
            )
        )

    risk_score = round(total * 100, 1)
    verdict = "cloned" if risk_score >= 50 else "real"
    confidence = round(min(100.0, abs(risk_score - 50) * 2), 1)
    contributions.sort(key=lambda c: c.contribution, reverse=True)

    return RiskResult(risk_score=risk_score, verdict=verdict, confidence=confidence, contributions=contributions)
