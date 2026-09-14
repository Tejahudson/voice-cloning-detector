import { useCallback, useEffect, useRef, useState } from "react"
import { IconMic, IconSpinner, IconStop } from "@/components/icons"
import { blobToWavFile } from "@/lib/audio"
import { cn } from "@/lib/utils"

type RecorderState = "idle" | "recording" | "processing"

export function MicRecorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [state, setState] = useState<RecorderState>("idle")
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close()
    rafRef.current = null
    timerRef.current = null
    streamRef.current = null
    audioCtxRef.current = null
    setLevel(0)
  }, [])

  useEffect(() => cleanup, [cleanup])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let peak = 0
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128)
        setLevel(peak)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()

      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        setState("processing")
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
          const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19)
          onRecorded(await blobToWavFile(blob, `mic-recording-${stamp}.wav`))
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not process the recording.")
        } finally {
          cleanup()
          setState("idle")
          setElapsed(0)
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setState("recording")
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } catch (err) {
      cleanup()
      setState("idle")
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission denied. Allow mic access in your browser and try again."
          : "Could not start recording. Is a microphone connected?"
      )
    }
  }

  const bars = 5

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-hairline bg-canvas px-6 py-12 text-center">
      <button
        onClick={state === "recording" ? () => recorderRef.current?.stop() : startRecording}
        disabled={state === "processing"}
        className={cn(
          "press relative inline-flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
          state === "recording"
            ? "border-cloned text-cloned"
            : "border-accent bg-accent text-[var(--c-accent-ink)] hover:brightness-110"
        )}
        aria-label={state === "recording" ? "Stop recording" : "Start recording"}
      >
        {state === "recording" && (
          <span
            className="absolute inset-0 rounded-full border border-cloned"
            style={{ transform: `scale(${1 + level * 0.5})`, opacity: 0.4, transition: "transform 80ms linear" }}
          />
        )}
        <span className="relative text-lg">
          {state === "processing" ? <IconSpinner /> : state === "recording" ? <IconStop /> : <IconMic />}
        </span>
      </button>

      <div>
        <p className="text-[14px] font-medium text-ink">
          {state === "recording"
            ? `Recording · ${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`
            : state === "processing"
              ? "Processing recording"
              : "Record from your microphone"}
        </p>
        <p className="mt-1 text-[12px] text-faint">
          {state === "recording"
            ? "Press stop when you're done and it will analyse the take."
            : "Speak yourself, or play a suspected cloned voice aloud. Aim for 3 seconds or more."}
        </p>
      </div>

      {state === "recording" && (
        <div className="flex h-6 items-end gap-1">
          {Array.from({ length: bars }).map((_, i) => {
            const spread = 1 - Math.abs(i - (bars - 1) / 2) / bars
            return (
              <span
                key={i}
                className="w-1 rounded-full bg-accent"
                style={{
                  height: `${Math.max(4, level * 24 * spread + 4)}px`,
                  transition: "height 80ms linear",
                }}
              />
            )
          })}
        </div>
      )}

      {error && <p className="max-w-xs text-[12px] text-cloned">{error}</p>}
    </div>
  )
}
