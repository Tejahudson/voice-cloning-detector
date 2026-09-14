import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Mic, Square } from "lucide-react"
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

      // Live input level meter, so it's obvious the mic is actually picking up audio.
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
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
          const file = await blobToWavFile(blob, `mic-recording-${stamp}.wav`)
          onRecorded(file)
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

  function stopRecording() {
    recorderRef.current?.stop()
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <button
        onClick={state === "recording" ? stopRecording : startRecording}
        disabled={state === "processing"}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full transition disabled:opacity-60",
          state === "recording"
            ? "bg-rose-500 text-white"
            : "bg-gradient-to-br from-cyan-500 to-violet-500 text-white hover:brightness-110"
        )}
      >
        {state === "recording" && (
          <span
            className="absolute inset-0 rounded-full bg-rose-500/40"
            style={{ transform: `scale(${1 + level * 0.9})`, transition: "transform 80ms linear" }}
          />
        )}
        <span className="relative z-10">
          {state === "processing" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : state === "recording" ? (
            <Square className="h-5 w-5" fill="currentColor" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </span>
      </button>

      <div>
        <p className="font-medium text-gray-200">
          {state === "recording"
            ? `Recording… ${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`
            : state === "processing"
              ? "Processing recording…"
              : "Record live from your microphone"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {state === "recording"
            ? "Click the square to stop and analyze."
            : "Play a suspected cloned voice out loud, or speak yourself — aim for 3+ seconds."}
        </p>
      </div>

      {state === "recording" && (
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
            style={{ width: `${Math.min(100, level * 140)}%`, transition: "width 80ms linear" }}
          />
        </div>
      )}

      {error && <p className="max-w-xs text-xs text-rose-400">{error}</p>}
    </div>
  )
}
