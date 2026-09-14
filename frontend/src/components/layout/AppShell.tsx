import type { ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { IconHistory, IconWaveform } from "@/components/icons"
import { Logo } from "@/components/layout/Logo"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { cn } from "@/lib/utils"

const NAV = [
  { to: "/analyze", label: "Analyze", icon: IconWaveform },
  { to: "/history", label: "History", icon: IconHistory },
]

/** Dashboard shell: slim sidebar (shadcn-admin pattern) + content column. */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-hairline bg-surface px-3 py-5 md:flex">
        <Link to="/" className="mb-7 px-2">
          <Logo size="sm" />
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  active ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
                )}
              >
                <Icon className="text-base" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex items-center gap-2 border-t border-hairline pt-4">
          <ThemeToggle />
          <span className="text-[11px] text-faint">Appearance</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-hairline bg-surface px-4 py-3 md:hidden">
          <Link to="/">
            <Logo size="sm" showWord={false} />
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "rounded px-2.5 py-1.5 text-[12px] font-medium",
                  location.pathname === to ? "bg-raised text-ink" : "text-muted"
                )}
              >
                {label}
              </Link>
            ))}
            <ThemeToggle className="ml-1" />
          </nav>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

/** Marketing shell: centered top bar, no sidebar. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/analyze"
              className="press rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-[var(--c-accent-ink)] transition hover:brightness-110"
            >
              Open analyzer
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-[12px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <Logo size="sm" />
          <p>Smart India Hackathon 2026 · Problem Statement SIH26104 · Team Victrix</p>
        </div>
      </footer>
    </div>
  )
}
