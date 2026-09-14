import { useEffect, useRef } from "react"

interface WaveformProps {
  data: number[]
  progress: number // 0-1, playhead position
  onSeek?: (progress: number) => void
  className?: string
}

export function Waveform({ data, progress, onSeek, className }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const parent = canvas.parentElement
    const width = parent?.clientWidth ?? 600
    const height = 96
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, width, height)

    const barCount = Math.min(data.length, Math.floor(width / 3))
    const step = data.length / barCount
    const barWidth = width / barCount
    const mid = height / 2
    const playhead = progress * barCount

    for (let i = 0; i < barCount; i++) {
      const amp = data[Math.floor(i * step)] ?? 0
      const barHeight = Math.max(2, amp * (height - 8))
      const x = i * barWidth
      ctx.fillStyle = i < playhead ? "#22d3ee" : "rgba(148,163,184,0.35)"
      ctx.fillRect(x, mid - barHeight / 2, Math.max(1, barWidth - 1), barHeight)
    }
  }, [data, progress])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }

  return (
    <div className={className}>
      <canvas ref={canvasRef} onClick={handleClick} className="w-full cursor-pointer" />
    </div>
  )
}
