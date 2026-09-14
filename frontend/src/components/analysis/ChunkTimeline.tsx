import { motion } from "framer-motion"
import type { ChunkMessage } from "@/lib/ws"

export function ChunkTimeline({
  chunks,
  totalChunks,
}: {
  chunks: ChunkMessage[]
  totalChunks: number
}) {
  const placeholders = Math.max(0, totalChunks - chunks.length)

  return (
    <div className="flex items-end gap-[3px]">
      {chunks.map((c, i) => (
        <motion.div
          key={i}
          initial={{ height: 4, opacity: 0 }}
          animate={{ height: Math.max(6, (c.risk_score / 100) * 38), opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-2.5 rounded-[2px]"
          style={{ backgroundColor: c.risk_score >= 50 ? "var(--c-cloned)" : "var(--c-authentic)" }}
          title={`${c.start_time.toFixed(1)}s–${c.end_time.toFixed(1)}s · risk ${c.risk_score}`}
        />
      ))}
      {Array.from({ length: placeholders }).map((_, i) => (
        <div key={`ph-${i}`} className="h-1.5 w-2.5 rounded-[2px] bg-raised" />
      ))}
    </div>
  )
}
