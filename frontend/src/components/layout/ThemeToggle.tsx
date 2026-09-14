import { IconMoon, IconSun } from "@/components/icons"
import { useThemeStore } from "@/store/theme"
import { cn } from "@/lib/utils"

/** Sun/moon cross-fade on a 3D flip — the two faces sit back to back. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "scene inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-muted transition-colors hover:bg-surface hover:text-ink",
        className
      )}
    >
      <span
        className="relative inline-flex h-4 w-4 items-center justify-center transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: isDark ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <IconSun className="absolute text-base" style={{ backfaceVisibility: "hidden" }} />
        <IconMoon
          className="absolute text-base"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        />
      </span>
    </button>
  )
}
