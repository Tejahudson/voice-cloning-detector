import { IconSpinner, IconWaveform } from "@/components/icons"
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
  const busy = clip.status === "uploading" || clip.status === "analyzing" || clip.status === "modeling"

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
        selected ? "border-accent bg-surface" : "border-hairline bg-canvas hover:bg-surface"
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-hairline text-base"
        style={{
          color: verdict ? (verdict === "cloned" ? "var(--c-cloned)" : "var(--c-authentic)") : "var(--c-faint)",
        }}
      >
        <IconWaveform />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{clip.file.name}</span>
        <span className="block text-[11px] text-faint">
          {(clip.file.size / 1024).toFixed(0)} KB
          {clip.result ? ` · ${formatDuration(clip.result.duration_seconds)}` : ""}
        </span>
      </span>

      <span className="flex shrink-0 items-center">
        {busy && <IconSpinner className="text-sm text-muted" />}
        {clip.status === "error" && <span className="text-[11px] text-cloned">failed</span>}
        {clip.status === "done" && risk !== undefined && (
          <span
            className="rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              color: verdict === "cloned" ? "var(--c-cloned)" : "var(--c-authentic)",
              backgroundColor: `color-mix(in srgb, ${
                verdict === "cloned" ? "var(--c-cloned)" : "var(--c-authentic)"
              } 12%, transparent)`,
            }}
          >
            {risk.toFixed(0)}
          </span>
        )}
      </span>
    </button>
  )
}
