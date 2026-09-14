import { AudioLines, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { cn, formatDuration } from "@/lib/utils"
import type { ClipState } from "@/types/clip"

export function ClipListItem({
  clip,
  selected,
  onSelect,
}: {
  clip: ClipState
  selected: boolean
  onSelect: () => void
}) {
  const risk = clip.result?.risk_score
  const verdict = clip.result?.verdict

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
        selected ? "border-cyan-500/40 bg-cyan-500/5" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          verdict === "cloned"
            ? "bg-rose-500/15 text-rose-400"
            : verdict === "real"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-white/5 text-gray-400"
        )}
      >
        <AudioLines className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-200">{clip.file.name}</p>
        <p className="text-[11px] text-gray-500">
          {(clip.file.size / 1024).toFixed(0)} KB
          {clip.result ? ` · ${formatDuration(clip.result.duration_seconds)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {clip.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
        {(clip.status === "analyzing" || clip.status === "modeling") && (
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        )}
        {clip.status === "error" && <XCircle className="h-4 w-4 text-rose-400" />}
        {clip.status === "done" && risk !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              verdict === "cloned" ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"
            )}
          >
            {risk.toFixed(0)}
          </span>
        )}
        {clip.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-gray-600" />}
      </div>
    </button>
  )
}
