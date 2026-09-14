import type { ChunkMessage, CompleteMessage, StartMessage } from "@/lib/ws"

export type ClipStatus = "uploading" | "analyzing" | "modeling" | "done" | "error"

export interface ClipState {
  localId: string
  file: File
  objectUrl: string
  status: ClipStatus
  errorMessage?: string
  analysisId?: string
  start?: StartMessage
  chunks: ChunkMessage[]
  result?: CompleteMessage["result"]
}
