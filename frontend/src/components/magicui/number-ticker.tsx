import { useEffect, useRef, useState } from "react"
import { animate } from "framer-motion"

interface NumberTickerProps {
  value: number
  decimals?: number
  className?: string
  suffix?: string
  duration?: number
}

export function NumberTicker({ value, decimals = 0, className, suffix = "", duration = 0.8 }: NumberTickerProps) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value, duration])

  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
