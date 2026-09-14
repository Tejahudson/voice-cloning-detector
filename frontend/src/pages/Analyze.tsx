import { useCallback, useState } from "react"
import { IconInbox, IconMic, IconRoute, IconUpload } from "@/components/icons"
import { UploadDropzone } from "@/components/upload/UploadDropzone"
import { MicRecorder } from "@/components/upload/MicRecorder"
import { ClipListItem } from "@/components/analysis/ClipListItem"
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel"
import { AnalystPanel } from "@/components/analysis/AnalystPanel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, ApiError, analysisSocketUrl } from "@/lib/api"
import { openAnalysisSocket } from "@/lib/ws"
import { startTour } from "@/lib/tour"
import type { ClipState } from "@/types/clip"

let idCounter = 0

export default function Analyze() {
  const [clips, setClips] = useState<ClipState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const updateClip = useCallback(
    (localId: string, patch: Partial<ClipState> | ((c: ClipState) => Partial<ClipState>)) => {
      setClips((prev) =>
        prev.map((c) =>
          c.localId === localId ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c
        )
      )
    },
    []
  )

  const analyzeClip = useCallback(
    async (localId: string, file: File) => {
      try {
        const { analysis_id } = await api.uploadForAnalysis(file)
        updateClip(localId, { status: "analyzing", analysisId: analysis_id })

        openAnalysisSocket(analysisSocketUrl(analysis_id), {
          onMessage: (msg) => {
            if (msg.type === "start") updateClip(localId, { start: msg })
            else if (msg.type === "chunk") updateClip(localId, (c) => ({ chunks: [...c.chunks, msg] }))
            else if (msg.type === "model_start") updateClip(localId, { status: "modeling" })
            else if (msg.type === "complete") updateClip(localId, { status: "done", result: msg.result })
            else if (msg.type === "error")
              updateClip(localId, { status: "error", errorMessage: msg.message })
          },
          onError: () =>
            updateClip(localId, { status: "error", errorMessage: "Connection lost during analysis." }),
        })
      } catch (err) {
        updateClip(localId, {
          status: "error",
          errorMessage: err instanceof ApiError ? err.message : "Upload failed.",
        })
      }
    },
    [updateClip]
  )

  const handleFiles = useCallback(
    (files: File[]) => {
      const created: ClipState[] = files.map((file) => ({
        localId: `clip-${idCounter++}`,
        file,
        objectUrl: URL.createObjectURL(file),
        status: "uploading",
        chunks: [],
      }))
      setClips((prev) => [...created, ...prev])
      setSelectedId(created[0].localId)
      created.forEach((c) => analyzeClip(c.localId, c.file))
    },
    [analyzeClip]
  )

  const selected = clips.find((c) => c.localId === selectedId) ?? clips[0]

  return (
    <div className="mx-auto max-w-6xl px-6 py-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Analyse voice samples</h1>
          <p className="mt-1 text-[13px] text-muted">
            Upload recordings or capture one live. Each clip gets a verdict and the reasoning behind it.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={startTour}>
          <IconRoute className="text-sm" />
          Take the tour
        </Button>
      </div>

      <div className="mb-6" data-tour="source">
        <Tabs defaultValue="upload">
          <TabsList className="mb-3">
            <TabsTrigger value="upload">
              <IconUpload className="text-sm" />
              Upload file
            </TabsTrigger>
            <TabsTrigger value="mic">
              <IconMic className="text-sm" />
              Record from mic
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <UploadDropzone onFiles={handleFiles} />
          </TabsContent>
          <TabsContent value="mic">
            <MicRecorder onRecorded={(file) => handleFiles([file])} />
          </TabsContent>
        </Tabs>
      </div>

      {clips.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <IconInbox className="text-xl text-faint" />
          <p className="text-[13px] text-muted">No clips analysed yet — add one above to begin.</p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="space-y-2" data-tour="clips">
            {clips.map((clip) => (
              <ClipListItem
                key={clip.localId}
                clip={clip}
                selected={clip.localId === selected?.localId}
                onSelect={() => setSelectedId(clip.localId)}
              />
            ))}
          </div>

          <div className="min-w-0 space-y-4">
            {selected && <AnalysisPanel key={selected.localId} clip={selected} />}

            <Card className="h-[380px] overflow-hidden p-0" data-tour="analyst">
              <AnalystPanel key={selected?.localId ?? "none"} result={selected?.result} />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
