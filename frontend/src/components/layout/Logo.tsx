import { cn } from "@/lib/utils"

const WORD = "VoiceGuard"
const CYCLE = 7 // seconds — matches mark-spin so mark and wordmark stay in phase

/**
 * Logo lockup with a continuous loop: the mark rotates a full turn on the Y
 * axis in real 3D, while the wordmark re-reveals letter by letter each cycle.
 */
export function Logo({
  size = "md",
  showWord = true,
  className,
}: {
  size?: "sm" | "md" | "lg"
  showWord?: boolean
  className?: string
}) {
  const dims = { sm: 22, md: 28, lg: 40 }[size]
  const text = { sm: "text-[15px]", md: "text-[17px]", lg: "text-[22px]" }[size]

  return (
    <span className={cn("flex items-center gap-2.5 select-none", className)}>
      <span className="scene inline-flex" style={{ width: dims, height: dims }}>
        <span className="animate-mark-spin inline-flex h-full w-full items-center justify-center">
          <svg viewBox="0 0 40 40" width={dims} height={dims} aria-hidden="true">
            {/* shield silhouette */}
            <path
              d="M20 3.5 33.5 8.6v10.2c0 7.9-5.5 15.2-13.5 18-8-2.8-13.5-10.1-13.5-18V8.6z"
              fill="none"
              stroke="var(--c-accent)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* waveform bars inside the shield */}
            <g stroke="var(--c-ink)" strokeWidth="1.9" strokeLinecap="round">
              <path d="M13 17v6" />
              <path d="M17 13.5v13" />
              <path d="M20 16v8" />
              <path d="M23 12.5v15" />
              <path d="M27 17v6" />
            </g>
          </svg>
        </span>
      </span>

      {showWord && (
        <span className={cn("font-semibold tracking-tight text-ink", text)} aria-label={WORD}>
          {WORD.split("").map((ch, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                animation: `letter-in ${CYCLE}s ease-out infinite`,
                animationDelay: `${i * 0.045}s`,
              }}
            >
              {ch}
            </span>
          ))}
          <span className="text-accent">-AI</span>
        </span>
      )}
    </span>
  )
}
