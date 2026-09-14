import { useEffect, useRef, useState } from "react"
import { animate } from "framer-motion"

export function NumberTicker({
  value,
  decimals = 0,
  className,
  suffix = "",
  duration = 0.9,
}: {
  value: number
  decimals?: number
  className?: string
  suffix?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration])

  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
