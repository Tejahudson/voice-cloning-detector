import { useEffect, useRef } from "react"

interface SpectrogramProps {
  data: number[][] // [freqBin][timeBin], values 0..1, freq index 0 = lowest frequency
  progress?: number
  className?: string
}

const STOPS: [number, number, number, number][] = [
  [0.0, 5, 8, 20],
  [0.3, 20, 40, 90],
  [0.55, 34, 140, 190],
  [0.75, 34, 211, 238],
  [0.9, 167, 139, 250],
  [1.0, 251, 207, 232],
]

function colorAt(t: number): [number, number, number] {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, r0, g0, b0] = STOPS[i]
    const [t1, r1, g1, b1] = STOPS[i + 1]
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0 || 1)
      return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f]
    }
  }
  return [251, 207, 232]
}

export function Spectrogram({ data, progress, className }: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const freqBins = data.length
    const timeBins = data[0]?.length ?? 0
    if (timeBins === 0) return

    // Render at native resolution to an offscreen buffer, then upscale.
    const off = document.createElement("canvas")
    off.width = timeBins
    off.height = freqBins
    const offCtx = off.getContext("2d")!
    const imgData = offCtx.createImageData(timeBins, freqBins)

    for (let f = 0; f < freqBins; f++) {
      const rowFromTop = freqBins - 1 - f // low freq at bottom
      for (let t = 0; t < timeBins; t++) {
        const v = Math.max(0, Math.min(1, data[f][t]))
        const [r, g, b] = colorAt(v)
        const idx = (rowFromTop * timeBins + t) * 4
        imgData.data[idx] = r
        imgData.data[idx + 1] = g
        imgData.data[idx + 2] = b
        imgData.data[idx + 3] = 255
      }
    }
    offCtx.putImageData(imgData, 0, 0)

    const parent = canvas.parentElement
    const width = parent?.clientWidth ?? 600
    const height = 140
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.imageSmoothingEnabled = true
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(off, 0, 0, timeBins, freqBins, 0, 0, width, height)

    if (progress !== undefined) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)"
      ctx.lineWidth = 1.5
      const x = progress * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }, [data, progress])

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  )
}
