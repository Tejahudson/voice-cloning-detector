import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ActivitySquare,
  AudioLines,
  Fingerprint,
  Gauge,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react"
import { Particles } from "@/components/magicui/particles"
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { MagicCard } from "@/components/magicui/magic-card"
import { Marquee } from "@/components/magicui/marquee"

const FEATURES = [
  {
    icon: Waves,
    title: "Multi-layer voice forensics",
    desc: "Pitch jitter, amplitude shimmer, harmonics-to-noise ratio, spectral flux, and formant stability — computed directly from the waveform.",
  },
  {
    icon: Gauge,
    title: "Live risk scoring",
    desc: "A 0–100 risk score streams in roughly once a second while the clip plays, mirroring how the system would score a live call.",
  },
  {
    icon: Fingerprint,
    title: "Explainable verdicts",
    desc: "Every verdict ships with a ranked breakdown of exactly which acoustic features drove the score — no black box.",
  },
  {
    icon: Lock,
    title: "Privacy-preserving",
    desc: "Uploaded audio is analyzed in memory and discarded — never written to disk. Only the verdict summary is saved to your history.",
  },
]

const BADGES = [
  "ASVspoof-inspired features",
  "HTTPS / WSS transport",
  "JWT-gated dashboard",
  "Audio never persisted",
  "Rate-limited API",
  "Explainable scoring",
]

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative border-b border-white/5">
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
          <Particles className="absolute inset-0 -z-10" quantity={70} />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,211,238,0.12),transparent)]" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-gray-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            SIH26104 · AI-Powered Real-Time Voice Cloning Detection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
          >
            Is that really them calling?{" "}
            <AnimatedGradientText>Find out before you approve anything.</AnimatedGradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-xl text-sm text-gray-400 sm:text-base"
          >
            Upload any real or AI-cloned voice recording and watch VoiceGuard-AI break it down live — waveform,
            spectrogram, pitch contour, and an explainable risk score — powered by genuine signal-processing
            forensics, not a fake demo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/signup">
              <ShimmerButton>
                <AudioLines className="h-4 w-4" />
                Analyze a voice sample
              </ShimmerButton>
            </Link>
            <Link to="/login">
              <ShimmerButton variant="ghost">I already have an account</ShimmerButton>
            </Link>
          </motion.div>
        </div>

        <div className="border-t border-white/5 bg-white/[0.015] py-4">
          <Marquee>
            {BADGES.map((b) => (
              <span
                key={b}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1 text-xs text-gray-400"
              >
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                {b}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold text-white">How the detection engine works</h2>
          <p className="mt-2 text-sm text-gray-500">
            A feature-based heuristic scorer — explainable today, built to slot in a trained AASIST/RawNet2 model
            tomorrow.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <MagicCard key={title} className="p-5">
              <Icon className="h-5 w-5 text-cyan-400" />
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{desc}</p>
            </MagicCard>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-10 text-center">
          <Radar className="mx-auto mb-4 h-7 w-7 text-violet-400" />
          <h3 className="text-xl font-semibold text-white">Bring your own real and cloned clips</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Try it with several samples of each — a real recording, a TTS/voice-clone output — and compare how the
            risk score separates them.
          </p>
          <Link to="/signup" className="mt-6 inline-block">
            <ShimmerButton>
              <ActivitySquare className="h-4 w-4" />
              Get started
            </ShimmerButton>
          </Link>
        </div>
      </section>
    </div>
  )
}
