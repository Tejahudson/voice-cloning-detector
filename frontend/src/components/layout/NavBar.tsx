import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShieldCheck, LogOut, Upload, History, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"

const links = [
  { to: "/analyze", label: "Analyze", icon: Upload },
  { to: "/history", label: "History", icon: History },
]

export function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, email, logout } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070d]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500">
            <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.4} />
          </span>
          VoiceGuard<span className="text-cyan-400">-AI</span>
        </Link>

        {token && (
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  location.pathname === to
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {token ? (
            <>
              <span className="hidden text-xs text-gray-500 sm:inline">{email}</span>
              <button
                onClick={() => {
                  logout()
                  navigate("/")
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-gray-300 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-gray-950 transition hover:bg-gray-200"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Try the demo
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
