import { useEffect, useState } from "react"
import { IconInbox, IconShieldAlert, IconShieldCheck, IconSpinner, IconTrash } from "@/components/icons"
import { Card } from "@/components/ui/card"
import { api, type HistoryItem } from "@/lib/api"
import { formatDuration, formatTimestamp } from "@/lib/utils"

export default function History() {
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .history()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
  }, [])

  async function handleDelete(id: number) {
    await api.deleteHistoryItem(id)
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-9">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Analysis history</h1>
        <p className="mt-1 text-[13px] text-muted">
          Every clip analysed on this account. Raw audio was never stored — only the verdict summary.
        </p>
      </div>

      {error && <p className="text-[13px] text-cloned">{error}</p>}

      {items === null && !error && (
        <div className="flex items-center gap-2 py-16 text-[13px] text-muted">
          <IconSpinner className="text-base" />
          Loading
        </div>
      )}

      {items?.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <IconInbox className="text-xl text-faint" />
          <p className="text-[13px] text-muted">No analyses yet.</p>
        </Card>
      )}

      <div className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline">
        {items?.map((item) => {
          const cloned = item.verdict === "cloned"
          const tone = cloned ? "var(--c-cloned)" : "var(--c-authentic)"
          return (
            <div key={item.id} className="flex items-center gap-4 bg-surface px-4 py-3.5">
              <span className="text-lg" style={{ color: tone }}>
                {cloned ? <IconShieldAlert /> : <IconShieldCheck />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{item.filename}</p>
                <p className="text-[11px] text-faint">
                  {formatDuration(item.duration_seconds)} · {formatTimestamp(item.created_at)} ·{" "}
                  <span className={item.detector === "trained_model" ? "text-muted" : "text-caution"}>
                    {item.detector === "trained_model" ? "trained model" : "heuristic fallback"}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-[17px] font-semibold tabular-nums" style={{ color: tone }}>
                  {item.risk_score.toFixed(0)}
                </p>
                <p className="text-[11px] text-faint">{item.confidence.toFixed(0)}% conf.</p>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="rounded p-2 text-faint transition-colors hover:bg-raised hover:text-cloned"
                aria-label={`Delete ${item.filename}`}
                title="Delete record"
              >
                <IconTrash className="text-base" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
