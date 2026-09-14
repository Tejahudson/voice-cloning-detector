import { useEffect, useRef } from "react"
import { useThemeStore } from "@/store/theme"

export function Waveform({
  data,
  progress,
  onSeek,
  className,
}: {
  data: number[]
  progress: number
  onSeek?: (progress: number) => void
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const styles = getComputedStyle(document.documentElement)
    const played = styles.getPropertyValue("--c-accent").trim()
    const pending = styles.getPropertyValue("--c-hairline").trim()

    const parent = canvas.parentElement
    const width = parent?.clientWidth ?? 600
    const height = 92
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const barCount = Math.min(data.length, Math.floor(width / 3))
    const step = data.length / barCount
    const barWidth = width / barCount
    const mid = height / 2
    const playhead = progress * barCount

    for (let i = 0; i < barCount; i++) {
      const amp = data[Math.floor(i * step)] ?? 0
      const barHeight = Math.max(2, amp * (height - 10))
      ctx.fillStyle = i < playhead ? played : pending
      ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - 1), barHeight)
    }
  }, [data, progress, theme])

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
