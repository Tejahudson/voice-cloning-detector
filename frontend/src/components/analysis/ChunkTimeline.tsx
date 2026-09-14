import { motion } from "framer-motion"
import type { ChunkMessage } from "@/lib/ws"

function colorFor(score: number) {
  if (score < 40) return "#34d399"
  if (score < 65) return "#fbbf24"
  return "#fb7185"
}

export function ChunkTimeline({ chunks, totalChunks }: { chunks: ChunkMessage[]; totalChunks: number }) {
  const placeholders = Math.max(0, totalChunks - chunks.length)

  return (
    <div className="flex items-end gap-1">
      {chunks.map((c, i) => (
        <motion.div
          key={i}
          initial={{ height: 4, opacity: 0 }}
          animate={{ height: Math.max(6, (c.risk_score / 100) * 40), opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-2.5 rounded-sm"
          style={{ backgroundColor: colorFor(c.risk_score) }}
          title={`${c.start_time.toFixed(1)}s–${c.end_time.toFixed(1)}s · risk ${c.risk_score}`}
        />
      ))}
      {Array.from({ length: placeholders }).map((_, i) => (
        <div key={`ph-${i}`} className="h-1.5 w-2.5 animate-pulse rounded-sm bg-white/10" />
      ))}
    </div>
  )
}
