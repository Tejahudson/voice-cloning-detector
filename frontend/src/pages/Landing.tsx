import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { IconChevronRight, IconChip, IconMic, IconWaveform } from "@/components/icons"
import { VoiceprintRing } from "@/components/landing/VoiceprintRing"
import { TiltCard } from "@/components/ui/card"

const STAGES = [
  {
    n: "01",
    title: "Capture",
    body: "Upload a recording or record straight from your microphone. Audio is normalised to 16 kHz mono in the browser before it ever leaves the page.",
  },
  {
    n: "02",
    title: "Analyse",
    body: "A Wav2Vec2 classifier trained on human speech and synthetic clones scores the clip in overlapping windows, streaming a result roughly once a second.",
  },
  {
    n: "03",
    title: "Explain",
    body: "Alongside the verdict you get the signal-level forensics — pitch jitter, shimmer, harmonics-to-noise ratio — so the decision is inspectable, not opaque.",
  },
]

const FACTS = [
  { value: "₹22,000 Cr", label: "lost annually in India to telephonic cyber-fraud" },
  { value: "3 seconds", label: "of reference audio is enough to clone a voice" },
  { value: "2 layers", label: "trained model for the verdict, forensics for the reasoning" },
]

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
}

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-5 text-[11px] font-medium uppercase tracking-[0.16em] text-faint"
            >
              Voice integrity for calls that matter
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl leading-[1.08] font-semibold text-ink sm:text-5xl"
            >
              Is It All AI You're
              <br />
              Listening To?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted"
            >
              A cloned voice needs only a few seconds of source audio, and caller ID cannot tell you
              the difference. VoiceGuard-AI analyses the waveform itself and tells you what you are
              actually listening to — with the evidence to back it up.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/analyze"
                className="press inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-[var(--c-accent-ink)] transition hover:brightness-110"
              >
                Analyse a recording
                <IconChevronRight className="text-sm" />
              </Link>
              <Link
                to="/history"
                className="press inline-flex items-center gap-2 rounded-md border border-hairline px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface"
              >
                View past results
              </Link>
            </motion.div>
          </div>

          <div className="relative h-[320px] sm:h-[400px]">
            <VoiceprintRing className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="border-b border-hairline bg-surface">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-3">
          {FACTS.map((f, i) => (
            <motion.div key={f.value} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }}>
              <p className="text-2xl font-semibold tracking-tight text-ink">{f.value}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.div {...fade} className="mb-10 max-w-xl">
          <h2 className="text-2xl font-semibold text-ink">How the detection works</h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
            Three stages, each one inspectable. Nothing about the verdict is hidden behind a score.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {STAGES.map((s, i) => (
            <motion.div key={s.n} {...fade} transition={{ ...fade.transition, delay: i * 0.09 }}>
              <TiltCard className="h-full p-6">
                <p className="text-[11px] font-medium tracking-[0.14em] text-accent">{s.n}</p>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.body}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Two-layer engine */}
      <section className="border-y border-hairline bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <motion.div {...fade} className="mb-10 max-w-xl">
            <h2 className="text-2xl font-semibold text-ink">A verdict, and the reasoning behind it</h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
              The two layers are kept deliberately separate so you can see when they disagree.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            <motion.div {...fade}>
              <TiltCard className="h-full p-6">
                <IconChip className="text-xl text-accent" />
                <h3 className="mt-3.5 text-[15px] font-semibold text-ink">Trained model — primary</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  A Wav2Vec2-XLSR classifier fine-tuned on human recordings alongside output from
                  ElevenLabs, Amazon Polly, Kokoro, Hume AI and Speechify. This is what decides real
                  versus cloned.
                </p>
              </TiltCard>
            </motion.div>

            <motion.div {...fade} transition={{ ...fade.transition, delay: 0.09 }}>
              <TiltCard className="h-full p-6">
                <IconWaveform className="text-xl text-accent" />
                <h3 className="mt-3.5 text-[15px] font-semibold text-ink">Signal forensics — secondary</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Pitch jitter, amplitude shimmer, harmonics-to-noise ratio, spectral flux and formant
                  stability, computed from the waveform. Shown for explanation — never used to
                  override the model.
                </p>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Limitations — honest, no inflated claims */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.div {...fade} className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-ink">What this prototype does not do</h2>
          <div className="mt-6 divide-y divide-hairline border-y border-hairline">
            {[
              "It analyses uploaded or recorded clips, not a live telephony stream.",
              "Accuracy is bounded by the pretrained checkpoint and has not been benchmarked against an independent labelled set here.",
              "There are no accounts — analysis history is shared by anyone using this instance.",
              "Inference runs on CPU at roughly two to six seconds per clip.",
            ].map((line) => (
              <p key={line} className="py-3.5 text-[13px] leading-relaxed text-muted">
                {line}
              </p>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="border-t border-hairline bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <motion.div {...fade}>
            <IconMic className="mx-auto text-2xl text-accent" />
            <h2 className="mt-4 text-2xl font-semibold text-ink">Test it with your own audio</h2>
            <p className="mx-auto mt-2.5 max-w-md text-[14px] leading-relaxed text-muted">
              Bring a genuine recording and a cloned one, and compare how they score.
            </p>
            <Link
              to="/analyze"
              className="press mt-7 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-[var(--c-accent-ink)] transition hover:brightness-110"
            >
              Open the analyzer
              <IconChevronRight className="text-sm" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
