import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface PitchChartProps {
  data: { t: number; f0: number | null }[]
  className?: string
}

export function PitchChart({ data, className }: PitchChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="flex h-40 items-center justify-center text-xs text-gray-500">
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
            stroke="#4b5563"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: "#232a3d" }}
          />
          <YAxis
            dataKey="f0"
            domain={["dataMin - 20", "dataMax + 20"]}
            stroke="#4b5563"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${Math.round(v)}`}
          />
          <Tooltip
            contentStyle={{
              background: "#0b0f1a",
              border: "1px solid #232a3d",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => `t=${Number(v).toFixed(2)}s`}
            formatter={(value) => [`${typeof value === "number" ? value.toFixed(1) : "—"} Hz`, "F0"]}
          />
          <Line
            type="monotone"
            dataKey="f0"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
