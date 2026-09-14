import { useEffect, useState } from "react"
import { IconChip, IconSpinner } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { checkHealth, getApiBase, setApiBase } from "@/lib/api"
import { cn } from "@/lib/utils"

type State = "checking" | "online" | "offline"

/**
 * Shows whether the analyzer can reach its backend, and lets you point it at a
 * different one.
 *
 * Needed because the demo backend runs behind a free Cloudflare quick-tunnel,
 * which issues a fresh hostname every restart. Pasting the new URL here beats
 * rebuilding and redeploying the frontend each time.
 */
export function BackendLink() {
  const [state, setState] = useState<State>("checking")
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(getApiBase())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function probe() {
    setState("checking")
    setState((await checkHealth()) ? "online" : "offline")
  }

  useEffect(() => {
    // State already starts as "checking", so only the resolved result is set —
    // and not at all if the component unmounted while the probe was in flight.
    let cancelled = false
    checkHealth().then((ok) => {
      if (!cancelled) setState(ok ? "online" : "offline")
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    const candidate = value.trim()
    const ok = await checkHealth(candidate)
    if (!ok) {
      setError("Couldn't reach that address. Check the URL and that the backend is running.")
      setSaving(false)
      return
    }
    setApiBase(candidate)
    setSaving(false)
    setEditing(false)
    probe()
  }

  // Connected and configured — stay out of the way.
  if (state === "online" && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:bg-surface hover:text-ink"
        title={getApiBase() || "same origin"}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-authentic" />
        Backend connected
      </button>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
          state === "checking"
            ? "border-hairline text-muted"
            : "border-cloned text-cloned hover:bg-cloned/10"
        )}
      >
        {state === "checking" ? (
          <>
            <IconSpinner className="text-xs" /> Checking backend
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-cloned" /> Backend unreachable
          </>
        )}
      </button>
    )
  }

  return (
    <div className="w-full max-w-md rounded-md border border-hairline bg-surface p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <IconChip className="text-sm text-accent" />
        <p className="text-[12px] font-medium text-ink">Backend address</p>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-muted">
        Paste the analyzer's public URL — for example the https://…trycloudflare.com address
        printed when the tunnel starts. Leave blank to use this site's own origin.
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="https://example.trycloudflare.com"
          className="h-9 flex-1 rounded-md border border-hairline bg-canvas px-2.5 text-[12px] text-ink outline-none focus:border-accent"
        />
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <IconSpinner className="text-sm" /> : null}
          {saving ? "Testing" : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="mt-2 text-[11px] text-cloned">{error}</p>}
    </div>
  )
}
