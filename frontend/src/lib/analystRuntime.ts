/**
 * Deterministic analyst responses derived from the real analysis result.
 *
 * Every number quoted here comes from the actual backend payload — the model's
 * fake probability, the real feature contributions, the heuristic's own score.
 * Nothing is generated or invented, which is why this needs no LLM.
 */

import type { CompleteMessage } from "@/lib/ws"

type Result = CompleteMessage["result"]

const FEATURE_LABELS: Record<string, string> = {
  f0_jitter_pct: "pitch jitter",
  shimmer_pct: "amplitude shimmer",
  mfcc_delta_var: "timbre dynamics",
  spectral_flux: "spectral flux",
  zcr_var: "zero-crossing variance",
  formant_bw_var: "formant stability",
  hnr_db: "harmonics-to-noise ratio",
}

export interface Suggestion {
  label: string
  key: string
}

export const SUGGESTIONS: Suggestion[] = [
  { label: "Why this verdict?", key: "why" },
  { label: "How confident is it?", key: "confidence" },
  { label: "What do the features mean?", key: "features" },
  { label: "Can I trust this?", key: "trust" },
]

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export function answer(question: string, result: Result | undefined): string {
  if (!result) {
    return "Analyse a clip first and I'll walk you through the result — what drove the verdict, how confident the model is, and what each signal feature means."
  }

  const q = question.toLowerCase()
  const cloned = result.verdict === "cloned"
  const m = result.model

  const asks = (...terms: string[]) => terms.some((t) => q.includes(t))

  if (asks("why", "verdict", "reason", "decide", "flagged")) {
    if (m.available) {
      const windows = m.windows_scored > 1 ? ` across ${m.windows_scored} windows of the clip` : ""
      const spread =
        m.window_probabilities.length > 1
          ? ` Individual windows scored ${m.window_probabilities.map(pct).join(", ")}, so the result is ${
              Math.max(...m.window_probabilities) - Math.min(...m.window_probabilities) < 0.2
                ? "consistent throughout"
                : "uneven — worth listening to the clip for edits or splices"
            }.`
          : ""
      return `The verdict came from the trained classifier, not the signal heuristics. It put the probability of synthetic speech at ${pct(
        m.fake_probability
      )}${windows}, which crosses the 50% decision boundary${cloned ? "" : " on the authentic side"}.${spread}`
    }
    return `The trained model was unavailable for this clip, so the fallback heuristic decided it — scoring ${result.heuristic.risk_score}/100. Treat that with caution; the heuristic is unreliable against high-quality clones.`
  }

  if (asks("confident", "confidence", "sure", "certain")) {
    const band =
      result.confidence >= 80 ? "a strong call" : result.confidence >= 40 ? "a moderate call" : "a borderline call"
    const short = m.short_clip_warning
      ? " The clip is under 2.5 seconds, which is below the model's reliable range — a longer sample would firm this up."
      : ""
    return `Confidence is ${result.confidence.toFixed(
      0
    )}%, which makes this ${band}. That figure is the distance from the 50% decision boundary, so it reflects how decisive the model was rather than how often it is right in general.${short}`
  }

  if (asks("feature", "jitter", "shimmer", "hnr", "harmonic", "spectral", "formant", "signal")) {
    const top = result.contributions.slice(0, 3)
    const lines = top
      .map((c) => `• ${FEATURE_LABELS[c.feature] ?? c.feature} — ${Math.round(c.suspicion * 100)}% suspicion`)
      .join("\n")
    return `These are forensic measurements taken straight from the waveform. The three that read most unusual here:\n\n${lines}\n\nThey are shown for explanation only. They did not set the verdict — the heuristic that combines them scored this clip ${result.heuristic.risk_score}/100 (${result.heuristic.verdict}).`
  }

  if (asks("trust", "accurate", "reliable", "wrong", "mistake")) {
    const disagrees = result.heuristic.verdict !== result.verdict
    const note = disagrees
      ? ` Worth knowing: the signal heuristic disagreed here, calling it ${result.heuristic.verdict}. That happens often and is expected — modern cloning reproduces natural jitter and shimmer well enough to fool threshold rules.`
      : ` In this case the signal heuristic independently agreed, which is mildly reassuring though not proof.`
    return `Treat it as a strong signal, not evidence. The model was trained on human speech plus output from several commercial cloning tools, but it has not been benchmarked against an independent labelled set in this prototype, and very short or noisy clips degrade it.${note}`
  }

  if (asks("heuristic", "disagree", "second")) {
    return `The heuristic scored ${result.heuristic.risk_score}/100 (${result.heuristic.verdict}) while the model scored ${pct(
      m.fake_probability
    )} synthetic. The model takes precedence by design — during development the heuristic rated a synthetic sample "real" at 97% confidence, which is exactly why it was demoted to an explanatory role.`
  }

  if (asks("model", "which", "wav2vec", "trained on")) {
    return `It is ${m.name} — a Wav2Vec2-XLSR classifier fine-tuned for synthetic speech detection on human recordings plus clips from ElevenLabs, Amazon Polly, Kokoro, Hume AI, Speechify and Luvvoice. It expects 16 kHz mono and scores longest clips in windows.`
  }

  return `I can explain this result from the actual analysis data. Try asking why it reached this verdict, how confident it is, what the signal features mean, or whether you can trust it. For reference: verdict ${result.verdict}, risk ${result.risk_score}/100, model probability ${pct(
    m.fake_probability
  )} synthetic.`
}
