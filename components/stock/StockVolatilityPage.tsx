"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export default function StockVolatilityPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/volatility`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || c) return;
      setData((await res.json()) as Record<string, unknown>);
    })();
    return () => {
      c = true;
    };
  }, [symbol]);

  const ivVsHv = (data?.ivVsHv as { points?: { date: string; hv20: number }[] }) ?? {
    points: [],
  };
  const term = (data?.termStructure as { expiration: string; atmIvPct: number | null }[]) ?? [];
  const skew = (data?.skew as { strike: number; ivPct: number }[]) ?? [];
  const gauges = (data?.gauges ?? {}) as Record<string, unknown>;

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["ATM IV", gauges.atmIvPct],
          ["IV Rank¹", gauges.ivRankProxy],
          ["IV %ile¹", gauges.ivPercentileProxy],
          ["方法", gauges.methodology],
        ].map(([k, v]) => (
          <div key={String(k)} className="bg-panel border border-border2 rounded-[8px] px-3 py-2">
            <div className="text-[10px] text-muted">{String(k)}</div>
            <div className="text-[13px] font-mono text-text break-all">
              {typeof v === "number" ? v.toFixed(1) : String(v ?? "—")}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4 h-72">
        <div className="text-[12px] font-semibold mb-2">HV20 历史轨迹（代理）</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={ivVsHv.points ?? []}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#8B8D97" }} />
            <YAxis tick={{ fontSize: 9, fill: "#8B8D97" }} width={40} />
            <Tooltip
              contentStyle={{ background: "#111D2E", border: "1px solid rgba(212,175,55,0.2)" }}
            />
            <Line type="monotone" dataKey="hv20" stroke="#4A9EFF" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="text-[12px] font-semibold mb-2">ATM IV Term Structure</div>
          <div className="space-y-1 max-h-56 overflow-y-auto text-[11px] font-mono">
            {term.map((t) => (
              <div key={t.expiration} className="flex justify-between border-b border-border2 py-1">
                <span className="text-muted">{t.expiration}</span>
                <span>{t.atmIvPct === null ? "—" : `${t.atmIvPct.toFixed(1)}%`}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="text-[12px] font-semibold mb-2">IV Skew（近月 Calls 截面）</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={skew}>
                <XAxis dataKey="strike" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey="ivPct" stroke="#D4AF37" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
