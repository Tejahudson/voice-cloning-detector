import { useCallback, useRef, useState } from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCEPTED = ".wav,.wave,.mp3,.m4a,.flac,.ogg"

export function UploadDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      onFiles(Array.from(fileList))
    },
    [onFiles]
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
        dragging ? "border-cyan-400 bg-cyan-500/5" : "border-white/15 hover:border-white/25 hover:bg-white/[0.02]"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
        <UploadCloud className="h-5.5 w-5.5 text-cyan-400" />
      </div>
      <div>
        <p className="font-medium text-gray-200">
          Drop real or cloned voice clips here, or <span className="text-cyan-400">browse</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          WAV recommended · MP3 / M4A / FLAC / OGG also accepted · up to 25MB · multiple files at once
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
