import { useCallback, useRef, useState } from "react"
import { IconUpload } from "@/components/icons"
import { cn } from "@/lib/utils"

const ACCEPTED = ".wav,.wave,.mp3,.m4a,.flac,.ogg"

export function UploadDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return
      onFiles(Array.from(list))
    },
    [onFiles]
  )

  return (
    <div className="scene">
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
          "tilt flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center",
          dragging ? "border-accent bg-surface" : "border-hairline hover:bg-surface"
        )}
        style={dragging ? { transform: "translateZ(10px) rotateX(2deg)" } : undefined}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-md border border-hairline text-lg text-accent">
          <IconUpload />
        </span>
        <div>
          <p className="text-[14px] font-medium text-ink">
            Drop audio here, or <span className="text-accent">browse</span>
          </p>
          <p className="mt-1 text-[12px] text-faint">
            WAV recommended · MP3, M4A, FLAC, OGG accepted · up to 25 MB · multiple files at once
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
    </div>
  )
}
