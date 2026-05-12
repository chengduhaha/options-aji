"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type HistRow = {
  date: string;
  net?: number;
  flip?: number;
  close?: number;
};

export default function GexTrendChart(props: {
  merged: HistRow[];
  symbol: string;
}) {
  const { merged, symbol } = props;
  if (!merged.length) {
    return (
      <div className="text-muted text-[12px] py-8 text-center leading-relaxed">
        暂无 GEX 趋势数据。多次载入本页后会将每日 Net / Flip 快照写入后端 Redis；收盘价来自 Yahoo
        日线。首次部署或冷启动时曲线可能稀疏。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="min-h-[240px]" data-testid={`gex-trend-net-${symbol}`}>
        <div className="text-[11px] text-muted mb-1">Net GEX vs 收盘价</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={merged} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8B8D97" }} minTickGap={24} />
            <YAxis yAxisId="gx" tick={{ fontSize: 9, fill: "#8B8D97" }} width={44} domain={["auto", "auto"]} />
            <YAxis yAxisId="px" orientation="right" tick={{ fontSize: 9, fill: "#D4AF37" }} width={36} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111D2E",
                borderColor: "rgba(212,175,55,0.2)",
                fontSize: 11,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              yAxisId="gx"
              type="monotone"
              dataKey="net"
              name="Net GEX (Bn)"
              stroke="#00D4AA"
              dot={false}
              strokeWidth={1.8}
              connectNulls
            />
            <Line
              yAxisId="px"
              type="monotone"
              dataKey="close"
              name="Underlying"
              stroke="#D4AF37"
              dot={false}
              strokeWidth={1.2}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="min-h-[240px]">
        <div className="text-[11px] text-muted mb-1">Gamma Flip 估算</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={merged} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8B8D97" }} minTickGap={24} />
            <YAxis tick={{ fontSize: 9, fill: "#8B8D97" }} width={44} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111D2E",
                borderColor: "rgba(212,175,55,0.2)",
                fontSize: 11,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="flip"
              name="Gamma flip"
              stroke="#FF6B6B"
              dot={false}
              strokeWidth={1.7}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
