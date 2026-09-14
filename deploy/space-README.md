---
title: VoiceGuard AI
emoji: 🛡️
colorFrom: blue
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
short_description: Detect AI-cloned voices in audio, with explainable forensics
---

# VoiceGuard-AI

Real-time detection of AI-cloned voices. Upload a recording or capture one from
your microphone and get a verdict — real or cloned — with the signal-level
forensics behind it.

Built for **Smart India Hackathon 2026 · Problem Statement SIH26104** by Team
Victrix. Source: https://github.com/Tejahudson/voice-cloning-detector

## How it works

**Primary — trained model.** `garystafford/wav2vec2-deepfake-voice-detector`, a
Wav2Vec2-XLSR classifier fine-tuned for synthetic-speech detection on human
recordings plus clips from ElevenLabs, Amazon Polly, Kokoro, Hume AI, Speechify
and Luvvoice. This produces the verdict.

**Secondary — signal forensics.** Pitch jitter, amplitude shimmer,
harmonics-to-noise ratio, spectral flux and formant stability, computed with
librosa. Shown to explain the result, never to override the model.

## Notes

- There is no authentication — anyone with the link can analyse audio, and the
  history list is shared by everyone using this Space.
- Uploaded audio is held in memory and discarded after analysis. Only the
  verdict summary is stored.
- Inference runs on CPU at roughly 2–6 seconds per clip. Clips under 2.5s are
  flagged as less reliable.
- Storage is ephemeral on the free tier, so the history list resets whenever the
  Space restarts or rebuilds.
- Accuracy is bounded by the pretrained checkpoint and has not been benchmarked
  against an independent labelled set.
