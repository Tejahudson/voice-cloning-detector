import { useEffect, useRef, useState } from "react"

/**
 * 3D voiceprint sculpture for the hero.
 *
 * Bars sit on concentric rings in 3D space, projected with a rotation matrix
 * and a perspective divide onto a plain 2D canvas — no WebGL, no Three.js.
 *
 * The sculpture loops between two states so the hero demonstrates the product
 * rather than just decorating it:
 *   human     — irregular heights, breathing amplitude, per-bar jitter
 *   synthetic — mechanically uniform heights, no jitter, flat envelope
 * A scan ring sweeps the structure continuously, brightening what it crosses.
 */

interface Bar {
  angle: number
  radius: number
  ring: number
  seed: number
}

const RINGS = [
  { radius: 58, count: 40 },
  { radius: 92, count: 58 },
  { radius: 126, count: 76 },
]

const PHASE_MS = 5200 // dwell in each state
const MORPH_MS = 1600 // cross-fade between them

export function VoiceprintRing({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<"human" | "synthetic">("human")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

    const bars: Bar[] = []
    RINGS.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        bars.push({
          angle: (i / ring.count) * Math.PI * 2,
          radius: ring.radius,
          ring: ringIndex,
          seed: Math.random() * Math.PI * 2,
        })
      }
    })

    let width = 0
    let height = 0
    let raf = 0
    let t = 0
    const start = performance.now()

    // Pointer steers the tilt with inertia rather than snapping.
    const pointer = { x: 0.5, y: 0.5, active: false }
    let tiltX = 0.44
    let spinOffset = 0

    const toRgb = (hex: string): [number, number, number] => {
      const h = hex.trim().replace("#", "")
      const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
      const n = parseInt(full, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }

    function palette() {
      const s = getComputedStyle(document.documentElement)
      return {
        accent: toRgb(s.getPropertyValue("--c-accent") || "#3d5a80"),
        ink: toRgb(s.getPropertyValue("--c-ink") || "#1a1a18"),
        authentic: toRgb(s.getPropertyValue("--c-authentic") || "#4a7c59"),
        cloned: toRgb(s.getPropertyValue("--c-cloned") || "#a4453a"),
        hairline: (s.getPropertyValue("--c-hairline") || "#dad7d1").trim(),
      }
    }

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      canvas!.width = width * devicePixelRatio
      canvas!.height = height * devicePixelRatio
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    /** 0 = fully human, 1 = fully synthetic, eased across the transition. */
    function morphFactor(elapsed: number) {
      const cycle = (PHASE_MS + MORPH_MS) * 2
      const p = elapsed % cycle
      if (p < PHASE_MS) return 0
      if (p < PHASE_MS + MORPH_MS) {
        const k = (p - PHASE_MS) / MORPH_MS
        return k * k * (3 - 2 * k)
      }
      if (p < PHASE_MS * 2 + MORPH_MS) return 1
      const k = (p - (PHASE_MS * 2 + MORPH_MS)) / MORPH_MS
      return 1 - k * k * (3 - 2 * k)
    }

    let lastMode: "human" | "synthetic" = "human"

    function draw(now: number) {
      const { accent, ink, authentic, cloned, hairline } = palette()
      const elapsed = now - start
      const m = reduced ? 0 : morphFactor(elapsed)

      const nextMode = m > 0.5 ? "synthetic" : "human"
      if (nextMode !== lastMode) {
        lastMode = nextMode
        setMode(nextMode)
      }

      ctx!.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const scale = Math.min(width, height) / 330

      // Ease tilt toward the pointer; drift back to rest when it leaves.
      const targetTilt = 0.44 + (pointer.active ? (pointer.y - 0.5) * 0.45 : 0)
      tiltX += (targetTilt - tiltX) * 0.06
      const targetSpin = pointer.active ? (pointer.x - 0.5) * 0.8 : 0
      spinOffset += (targetSpin - spinOffset) * 0.06

      const rotY = t * 0.0048 + spinOffset
      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const cosX = Math.cos(tiltX)
      const sinX = Math.sin(tiltX)

      // Scan plane travelling up and down the sculpture.
      const scanY = Math.sin(t * 0.012) * 26

      type P = { x: number; y: number; x2: number; y2: number; depth: number; ring: number; lit: number }
      const projected: P[] = []

      for (const bar of bars) {
        // Human: layered irregular motion with per-bar jitter and breathing.
        const organic =
          Math.sin(t * 0.026 + bar.seed) * 0.5 +
          Math.sin(t * 0.011 + bar.angle * 2.3) * 0.32 +
          Math.sin(bar.seed * 3.1 + t * 0.05) * 0.18
        const breathing = 0.75 + Math.sin(t * 0.008) * 0.25
        const humanH = (7 + (organic * 0.5 + 0.5) * 21 * breathing) * (1 - bar.ring * 0.15)

        // Synthetic: one clean periodic wave, identical for every bar. No jitter.
        const machine = Math.sin(t * 0.03 + bar.angle * 4)
        const synthH = (11 + (machine * 0.5 + 0.5) * 13) * (1 - bar.ring * 0.15)

        const h = humanH + (synthH - humanH) * m

        const bx = Math.cos(bar.angle) * bar.radius
        const bz = Math.sin(bar.angle) * bar.radius
        const rx = bx * cosY - bz * sinY
        const rz = bx * sinY + bz * cosY

        const project = (yVal: number) => {
          const ry = yVal * cosX - rz * sinX
          const rzz = yVal * sinX + rz * cosX
          const persp = 420 / (420 + rzz)
          return { x: cx + rx * persp * scale, y: cy + ry * persp * scale, depth: rzz }
        }

        const bottom = project(0)
        const top = project(-h)

        // How close this bar's tip is to the travelling scan plane.
        const lit = Math.max(0, 1 - Math.abs(-h - scanY) / 16)

        projected.push({
          x: bottom.x,
          y: bottom.y,
          x2: top.x,
          y2: top.y,
          depth: bottom.depth,
          ring: bar.ring,
          lit,
        })
      }

      // Painter's algorithm — far bars drawn first.
      projected.sort((a, b) => a.depth - b.depth)

      // Wireframe connecting each ring's tips, for structure.
      for (let r = 0; r < RINGS.length; r++) {
        const ringBars = projected.filter((p) => p.ring === r)
        if (ringBars.length < 2) continue
        ctx!.strokeStyle = hairline
        ctx!.lineWidth = 0.6
        ctx!.globalAlpha = 0.5
        ctx!.beginPath()
        ringBars.forEach((p, i) => (i === 0 ? ctx!.moveTo(p.x2, p.y2) : ctx!.lineTo(p.x2, p.y2)))
        ctx!.stroke()
        ctx!.globalAlpha = 1
      }

      const stateTone: [number, number, number] = [
        authentic[0] + (cloned[0] - authentic[0]) * m,
        authentic[1] + (cloned[1] - authentic[1]) * m,
        authentic[2] + (cloned[2] - authentic[2]) * m,
      ]

      for (const p of projected) {
        const near = Math.max(0, Math.min(1, (p.depth + 140) / 280))
        const alpha = 0.16 + near * 0.6
        // Middle ring carries the state colour; scan-lit tips brighten to it too.
        const base = p.ring === 1 ? accent : ink
        const mix = Math.max(p.lit, p.ring === 1 ? 0.55 : 0)
        const r = base[0] + (stateTone[0] - base[0]) * mix
        const g = base[1] + (stateTone[1] - base[1]) * mix
        const b = base[2] + (stateTone[2] - base[2]) * mix

        ctx!.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${(alpha + p.lit * 0.3).toFixed(3)})`
        ctx!.lineWidth = (p.ring === 2 ? 1.1 : 1.7) + p.lit * 0.9
        ctx!.lineCap = "round"
        ctx!.beginPath()
        ctx!.moveTo(p.x, p.y)
        ctx!.lineTo(p.x2, p.y2)
        ctx!.stroke()
      }

      // Grounding ellipse
      ctx!.strokeStyle = hairline
      ctx!.lineWidth = 1
      ctx!.globalAlpha = 0.8
      ctx!.beginPath()
      ctx!.ellipse(cx, cy, 126 * scale, 126 * scale * Math.sin(tiltX), 0, 0, Math.PI * 2)
      ctx!.stroke()
      ctx!.globalAlpha = 1

      if (!reduced) t += 1
      raf = requestAnimationFrame(draw)
    }

    function onPointer(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect()
      pointer.x = (e.clientX - r.left) / r.width
      pointer.y = (e.clientY - r.top) / r.height
      pointer.active = true
    }
    const onLeave = () => (pointer.active = false)

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener("resize", resize)
    canvas.addEventListener("pointermove", onPointer)
    canvas.addEventListener("pointerleave", onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("pointermove", onPointer)
      canvas.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <div className={`relative ${className ?? ""}`}>
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full transition-colors duration-700"
            style={{ background: mode === "synthetic" ? "var(--c-cloned)" : "var(--c-authentic)" }}
          />
          <span className="text-[11px] tracking-[0.06em] text-muted uppercase">
            {mode === "synthetic" ? "Synthetic voiceprint" : "Human voiceprint"}
          </span>
        </div>
      </div>
    </div>
  )
}
