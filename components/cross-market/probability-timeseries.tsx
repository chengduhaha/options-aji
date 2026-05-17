"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeSeriesRow } from "@/lib/crossMarket";

const SERIES = [
  { key: "options" as const, label: "期权市场", color: "#4A8FD4" },
  { key: "polymarket" as const, label: "Polymarket", color: "#D4AF37" },
  { key: "social" as const, label: "社交情绪", color: "#E8842A" },
  { key: "institutional" as const, label: "机构信号", color: "#D44A4A" },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-[#1E2D4A] bg-[#131E35]/95 backdrop-blur-sm p-3 shadow-xl">
      <div className="font-terminal text-[10px] text-[#7A8BA8] mb-2">{label}</div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] text-[#B8C8DC]">{entry.name}</span>
            </div>
            <span className="font-terminal text-[11px] font-bold" style={{ color: entry.color }}>
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ProbabilityTimeSeriesProps {
  data: TimeSeriesRow[];
}

export function ProbabilityTimeSeries({ data }: ProbabilityTimeSeriesProps) {
  const refIdx = Math.max(0, Math.floor(data.length * 0.65));
  const refLabel = data[refIdx]?.date ?? "";

  return (
    <div className="rounded-xl border border-[#1E2D4A] bg-[#131E35] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-[#4A8FD4]" />
          <div>
            <div className="text-sm font-semibold text-foreground">概率时序追踪</div>
            <div className="font-terminal text-[10px] text-[#7A8BA8] mt-0.5">过去 {data.length} 天 · 分歧演变（终端点锁定实时四源）</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-terminal text-[10px]" style={{ color: s.color }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />

            {refLabel ? (
              <ReferenceLine
                x={refLabel}
                stroke="#D4AF37"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: "分歧扩大",
                  fill: "#D4AF3780",
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              />
            ) : null}

            <XAxis
              dataKey="date"
              tick={{ fill: "#4A5A73", fontSize: 9, fontFamily: "monospace" }}
              axisLine={{ stroke: "#1E2D4A" }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#4A5A73", fontSize: 9, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: "#1E2D4A" }} />

            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
