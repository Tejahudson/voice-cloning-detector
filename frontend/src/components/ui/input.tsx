import type { InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  hint?: string
  invalid?: boolean
}

export function Field({ label, icon, hint, invalid, className, id, ...props }: FieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[12px] font-medium text-muted">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-canvas px-3 transition-colors focus-within:border-accent",
          invalid ? "border-cloned" : "border-hairline"
        )}
      >
        {icon && <span className="text-base text-faint">{icon}</span>}
        <input
          id={inputId}
          className={cn(
            "h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint",
            className
          )}
          {...props}
        />
      </div>
      {hint && <p className={cn("text-[11px]", invalid ? "text-cloned" : "text-faint")}>{hint}</p>}
    </div>
  )
}
