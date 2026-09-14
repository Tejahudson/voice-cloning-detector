import { useCallback, useState } from "react"
import { Inbox, Mic, UploadCloud } from "lucide-react"
import { UploadDropzone } from "@/components/upload/UploadDropzone"
import { MicRecorder } from "@/components/upload/MicRecorder"
import { cn } from "@/lib/utils"
import { ClipListItem } from "@/components/analysis/ClipListItem"
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel"
import { api, ApiError, analysisSocketUrl } from "@/lib/api"
import { openAnalysisSocket } from "@/lib/ws"
import { useAuthStore } from "@/store/auth"
import type { ClipState } from "@/types/clip"

let idCounter = 0

export default function Analyze() {
  const token = useAuthStore((s) => s.token)
  const [clips, setClips] = useState<ClipState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [source, setSource] = useState<"upload" | "mic">("upload")

  const updateClip = useCallback((localId: string, patch: Partial<ClipState> | ((c: ClipState) => Partial<ClipState>)) => {
    setClips((prev) =>
      prev.map((c) => (c.localId === localId ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c))
    )
  }, [])

  const analyzeClip = useCallback(
    async (localId: string, file: File) => {
      if (!token) return
      try {
        const { analysis_id } = await api.uploadForAnalysis(file, token)
        updateClip(localId, { status: "analyzing", analysisId: analysis_id })

        openAnalysisSocket(analysisSocketUrl(analysis_id, token), {
          onMessage: (msg) => {
            if (msg.type === "start") {
              updateClip(localId, { start: msg })
            } else if (msg.type === "chunk") {
              updateClip(localId, (c) => ({ chunks: [...c.chunks, msg] }))
            } else if (msg.type === "model_start") {
              updateClip(localId, { status: "modeling" })
            } else if (msg.type === "complete") {
              updateClip(localId, { status: "done", result: msg.result })
            } else if (msg.type === "error") {
              updateClip(localId, { status: "error", errorMessage: msg.message })
            }
          },
          onError: () => updateClip(localId, { status: "error", errorMessage: "Connection lost during analysis." }),
        })
      } catch (err) {
        updateClip(localId, {
          status: "error",
          errorMessage: err instanceof ApiError ? err.message : "Upload failed.",
        })
      }
    },
    [token, updateClip]
  )

  const handleFiles = useCallback(
    (files: File[]) => {
      const newClips: ClipState[] = files.map((file) => ({
        localId: `clip-${idCounter++}`,
        file,
        objectUrl: URL.createObjectURL(file),
        status: "uploading",
        chunks: [],
      }))
      setClips((prev) => [...newClips, ...prev])
      setSelectedId(newClips[0].localId)
      newClips.forEach((c) => analyzeClip(c.localId, c.file))
    },
    [analyzeClip]
  )

  const selected = clips.find((c) => c.localId === selectedId) ?? clips[0]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analyze voice samples</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload your own real and cloned clips — each gets a live, explainable risk analysis.
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          {(
            [
              { key: "upload", label: "Upload file", icon: UploadCloud },
              { key: "mic", label: "Record from mic", icon: Mic },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSource(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
                source === key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {source === "upload" ? (
          <UploadDropzone onFiles={handleFiles} />
        ) : (
          <MicRecorder onRecorded={(file) => handleFiles([file])} />
        )}
      </div>

      {clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.015] py-16 text-center text-gray-500">
          <Inbox className="h-6 w-6" />
          <p className="text-sm">No clips analyzed yet — upload one above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {clips.map((clip) => (
              <ClipListItem
                key={clip.localId}
                clip={clip}
                selected={clip.localId === selected?.localId}
                onSelect={() => setSelectedId(clip.localId)}
              />
            ))}
          </div>
          <div>{selected && <AnalysisPanel key={selected.localId} clip={selected} />}</div>
        </div>
      )}
    </div>
  )
}
