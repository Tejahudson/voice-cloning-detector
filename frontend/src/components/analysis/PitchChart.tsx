import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export function PitchChart({
  data,
  className,
}: {
  data: { t: number; f0: number | null }[]
  className?: string
}) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="flex h-40 items-center justify-center text-[12px] text-faint">
          Not enough voiced audio to trace a pitch contour.
        </p>
      </div>
    )
  }

  return (
    <div className={className} style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="t"
            tickFormatter={(v: number) => `${v.toFixed(1)}s`}
            stroke="var(--c-faint)"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "var(--c-hairline)" }}
          />
          <YAxis
            dataKey="f0"
            domain={["dataMin - 20", "dataMax + 20"]}
            stroke="var(--c-faint)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-hairline)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--c-ink)",
            }}
            labelFormatter={(v) => `t=${Number(v).toFixed(2)}s`}
            formatter={(value) => [`${typeof value === "number" ? value.toFixed(1) : "—"} Hz`, "F0"]}
          />
          <Line
            type="monotone"
            dataKey="f0"
            stroke="var(--c-accent)"
            strokeWidth={1.8}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
