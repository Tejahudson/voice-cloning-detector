import { useEffect, useRef } from "react"
import { useThemeStore } from "@/store/theme"

/**
 * Single-hue tonal ramp rather than the usual rainbow colour map — the brief
 * rules out rainbow colouring. Intensity reads as density from canvas tone up
 * to the accent, which keeps it legible in both themes.
 */
export function Spectrogram({
  data,
  progress,
  className,
}: {
  data: number[][]
  progress?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const freqBins = data.length
    const timeBins = data[0]?.length ?? 0
    if (timeBins === 0) return

    const styles = getComputedStyle(document.documentElement)
    const toRgb = (v: string): [number, number, number] => {
      const h = v.trim().replace("#", "")
      const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
      const n = parseInt(full, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const low = toRgb(styles.getPropertyValue("--c-canvas"))
    const mid = toRgb(styles.getPropertyValue("--c-accent"))
    const high = toRgb(styles.getPropertyValue("--c-ink"))

    const off = document.createElement("canvas")
    off.width = timeBins
    off.height = freqBins
    const offCtx = off.getContext("2d")!
    const img = offCtx.createImageData(timeBins, freqBins)

    for (let f = 0; f < freqBins; f++) {
      const rowFromTop = freqBins - 1 - f
      for (let t = 0; t < timeBins; t++) {
        const v = Math.max(0, Math.min(1, data[f][t]))
        let r: number, g: number, b: number
        if (v < 0.6) {
          const k = v / 0.6
          r = low[0] + (mid[0] - low[0]) * k
          g = low[1] + (mid[1] - low[1]) * k
          b = low[2] + (mid[2] - low[2]) * k
        } else {
          const k = (v - 0.6) / 0.4
          r = mid[0] + (high[0] - mid[0]) * k
          g = mid[1] + (high[1] - mid[1]) * k
          b = mid[2] + (high[2] - mid[2]) * k
        }
        const idx = (rowFromTop * timeBins + t) * 4
        img.data[idx] = r
        img.data[idx + 1] = g
        img.data[idx + 2] = b
        img.data[idx + 3] = 255
      }
    }
    offCtx.putImageData(img, 0, 0)

    const parent = canvas.parentElement
    const width = parent?.clientWidth ?? 600
    const height = 140
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(off, 0, 0, timeBins, freqBins, 0, 0, width, height)

    if (progress !== undefined) {
      ctx.strokeStyle = styles.getPropertyValue("--c-ink").trim()
      ctx.lineWidth = 1
      const x = progress * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }, [data, progress, theme])

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full rounded border border-hairline" />
    </div>
  )
}
