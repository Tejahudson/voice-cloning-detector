import { useEffect, useState } from "react"
import { AudioLines, Loader2, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react"
import { MagicCard } from "@/components/magicui/magic-card"
import { api, type HistoryItem } from "@/lib/api"
import { cn, formatDuration, formatTimestamp } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"

export default function History() {
  const token = useAuthStore((s) => s.token)
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api
      .history(token)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
  }, [token])

  async function handleDelete(id: number) {
    if (!token) return
    await api.deleteHistoryItem(id, token)
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analysis history</h1>
        <p className="mt-1 text-sm text-gray-500">
          Every clip you've analyzed this account. Raw audio was never stored — only the verdict summary.
        </p>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {items === null && !error && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {items?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.015] py-16 text-center text-gray-500">
          <AudioLines className="h-6 w-6" />
          <p className="text-sm">No analyses yet.</p>
        </div>
      )}

      <div className="space-y-2.5">
        {items?.map((item) => (
          <MagicCard key={item.id} className="flex items-center gap-4 px-4 py-3.5">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                item.verdict === "cloned" ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"
              )}
            >
              {item.verdict === "cloned" ? <ShieldAlert className="h-4.5 w-4.5" /> : <ShieldCheck className="h-4.5 w-4.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-200">{item.filename}</p>
              <p className="text-[11px] text-gray-500">
                {formatDuration(item.duration_seconds)} · {formatTimestamp(item.created_at)} ·{" "}
                <span className={item.detector === "trained_model" ? "text-cyan-400/80" : "text-amber-400/80"}>
                  {item.detector === "trained_model" ? "trained model" : "heuristic fallback"}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  item.verdict === "cloned" ? "text-rose-300" : "text-emerald-300"
                )}
              >
                {item.risk_score.toFixed(0)}
              </p>
              <p className="text-[11px] text-gray-500">{item.confidence.toFixed(0)}% confidence</p>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-white/5 hover:text-rose-400"
              title="Delete record"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </MagicCard>
        ))}
      </div>
    </div>
  )
}
