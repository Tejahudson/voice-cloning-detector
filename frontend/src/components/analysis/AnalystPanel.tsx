import { useMemo } from "react"
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react"
import { IconMessage, IconSend } from "@/components/icons"
import { answer, SUGGESTIONS } from "@/lib/analystRuntime"
import type { CompleteMessage } from "@/lib/ws"

type Result = CompleteMessage["result"]

/**
 * "Ask the Analyst" — assistant-ui primitives driven by a local runtime.
 *
 * The adapter is deterministic: it reads the real analysis payload and
 * explains it. There is no model call here, so nothing can be hallucinated
 * and no API key is needed.
 */
export function AnalystPanel({ result }: { result: Result | undefined }) {
  const adapter = useMemo<ChatModelAdapter>(
    () => ({
      async run({ messages }) {
        const last = messages[messages.length - 1]
        const question =
          last?.content
            ?.map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
            .join(" ")
            .trim() ?? ""

        // Brief pause so the reply doesn't snap in instantly and read as canned.
        await new Promise((r) => setTimeout(r, 220))

        return { content: [{ type: "text" as const, text: answer(question, result) }] }
      },
    }),
    [result]
  )

  const runtime = useLocalRuntime(adapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <IconMessage className="text-base text-accent" />
          <p className="text-[13px] font-semibold text-ink">Ask the analyst</p>
          <span className="ml-auto text-[10px] tracking-[0.08em] text-faint uppercase">
            reads this result
          </span>
        </div>

        <ThreadPrimitive.Viewport className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <ThreadPrimitive.Empty>
            <div className="space-y-3">
              <p className="text-[12px] leading-relaxed text-muted">
                {result
                  ? "Ask about this clip and I'll answer from the analysis data itself."
                  : "Analyse a clip first, then ask me about the result."}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <ThreadPrimitive.Suggestion
                    key={s.key}
                    prompt={s.label}
                    method="replace"
                    autoSend
                    className="rounded border border-hairline px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:bg-raised hover:text-ink"
                  >
                    {s.label}
                  </ThreadPrimitive.Suggestion>
                ))}
              </div>
            </div>
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.Messages
            components={{
              UserMessage: () => (
                <MessagePrimitive.Root className="flex justify-end">
                  <div className="max-w-[85%] rounded-md bg-accent px-3 py-2 text-[12px] leading-relaxed text-[var(--c-accent-ink)]">
                    <MessagePrimitive.Parts />
                  </div>
                </MessagePrimitive.Root>
              ),
              AssistantMessage: () => (
                <MessagePrimitive.Root className="flex justify-start">
                  <div className="max-w-[92%] rounded-md border border-hairline bg-canvas px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line text-ink">
                    <MessagePrimitive.Parts />
                  </div>
                </MessagePrimitive.Root>
              ),
            }}
          />
        </ThreadPrimitive.Viewport>

        <ComposerPrimitive.Root className="flex items-center gap-2 border-t border-hairline px-3 py-2.5">
          <ComposerPrimitive.Input
            rows={1}
            placeholder={result ? "Why was this flagged?" : "Waiting for an analysis…"}
            className="max-h-24 flex-1 resize-none bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
          />
          <ComposerPrimitive.Send
            className="press inline-flex h-8 w-8 items-center justify-center rounded bg-accent text-[var(--c-accent-ink)] transition hover:brightness-110 disabled:opacity-50"
            aria-label="Send"
          >
            <IconSend className="text-sm" />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}
