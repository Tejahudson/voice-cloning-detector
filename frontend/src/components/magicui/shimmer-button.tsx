import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "ghost"
}

export function ShimmerButton({ children, className, variant = "primary", ...props }: ShimmerButtonProps) {
  if (variant === "ghost") {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
      <span
        className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent,45%,rgba(255,255,255,0.35),55%,transparent)] bg-[length:200%_100%] opacity-70"
        aria-hidden
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
