import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Lock, Mail, ShieldCheck } from "lucide-react"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { useAuthStore } from "@/store/auth"

export default function Login() {
  const navigate = useNavigate()
  const { login, status, error } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      navigate("/analyze")
    } catch {
      // error surfaced via store
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500">
          <ShieldCheck className="h-5.5 w-5.5" />
        </div>
        <h1 className="text-xl font-semibold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to analyze voice samples</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
            <Mail className="h-4 w-4 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
            <Lock className="h-4 w-4 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <ShimmerButton type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? "Signing in…" : "Sign in"}
        </ShimmerButton>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        No account?{" "}
        <Link to="/signup" className="text-cyan-400 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
