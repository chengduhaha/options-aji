"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface OverviewPayload {
  symbol: string;
  priceSeries: Array<{ date: string; close: number | null }>;
  keyStats: Record<string, unknown>;
  optionLiquidity: Record<string, unknown>;
  expectedMoves: Array<{ bucket: string; pct: number; straddleUsd: number; expiration: string }>;
  earnings: { nextDate: string | null; daysTo: number | null };
  bar?: { price?: number; changePct?: number };
}

export default function StockOverviewPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [range, setRange] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/overview`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as OverviewPayload;
      if (!cancelled) setData(j);
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const series = (data?.priceSeries ?? []).map((p) => ({ d: p.date, c: p.close }));
  const sliced = (() => {
    if (range === "1M") return series.slice(-22);
    if (range === "3M") return series.slice(-66);
    if (range === "6M") return series.slice(-132);
    return series.slice(-252);
  })();

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-widest">Overview</div>
          <h2 className="text-xl font-semibold text-text font-mono">{symbol}</h2>
          <div className="text-[13px] text-muted mt-1">
            价格{" "}
            <span className="text-text font-mono">
              {typeof data?.bar?.price === "number" ? data.bar.price.toFixed(2) : "—"}
            </span>
            <span className="mx-2">·</span>
            涨跌{" "}
            <span className="font-mono">
              {typeof data?.bar?.changePct === "number"
                ? `${data.bar.changePct >= 0 ? "+" : ""}${data.bar.changePct.toFixed(2)}%`
                : "—"}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["1M", "3M", "6M", "1Y"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`text-[11px] px-2 py-1 rounded-[6px] border ${
                range === r ? "border-gold text-gold" : "border-border2 text-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4 h-64">
        {sliced.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sliced}>
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#8B8D97" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#8B8D97" }} width={48} />
              <Tooltip
                contentStyle={{ background: "#111D2E", border: "1px solid rgba(212,175,55,0.2)" }}
              />
              <Line type="monotone" dataKey="c" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted text-[13px] h-full flex items-center justify-center">加载 K 线…</div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["ATM IV", data?.keyStats?.atmIv],
          ["IV Rank¹", data?.keyStats?.ivRank],
          ["IV %ile¹", data?.keyStats?.ivPercentile],
          ["HV20", data?.keyStats?.hv20],
          ["HV60", data?.keyStats?.hv60],
          ["IV/HV", data?.keyStats?.ivHvRatio],
          ["PCR (Vol)", data?.optionLiquidity?.pcrVolume],
          ["PCR (OI)", data?.optionLiquidity?.pcrOpenInterest],
        ].map(([k, v]) => (
          <div key={String(k)} className="bg-panel border border-border2 rounded-[8px] px-3 py-2">
            <div className="text-[10px] text-muted">{String(k)}</div>
            <div className="text-[15px] font-mono text-text">
              {typeof v === "number" ? (Math.abs(v) > 20 ? v.toFixed(1) : v.toFixed(2)) : "—"}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted">
        ¹ IV Rank / Percentile 基于 HV 波动代理，详见接口返回 methodology。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="text-[12px] font-semibold text-text mb-2">Expected Move（Straddle）</div>
          <div className="space-y-2">
            {(data?.expectedMoves ?? []).map((m) => (
              <div key={m.bucket} className="flex justify-between text-[12px] border-b border-border2 pb-2">
                <span className="text-muted">{m.bucket}</span>
                <span className="font-mono text-text">
                  ±{m.pct.toFixed(2)}% · ${m.straddleUsd.toFixed(2)}
                </span>
              </div>
            ))}
            {(data?.expectedMoves?.length ?? 0) === 0 && (
              <div className="text-muted text-[12px]">暂无法计算 Expected Move</div>
            )}
          </div>
        </div>
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="text-[12px] font-semibold text-text mb-2">财报</div>
          <div className="text-[13px] text-text">
            下次：{" "}
            <span className="font-mono text-gold">{data?.earnings?.nextDate ?? "—"}</span>
          </div>
          <div className="text-[12px] text-muted mt-2">
            距财报约 {data?.earnings?.daysTo ?? "—"} 天
          </div>
          <Link
            href={`/stock/${symbol}/earnings`}
            className="inline-block mt-3 text-[11px] text-blue hover:underline"
          >
            财报详情 →
          </Link>
        </div>
      </div>

      <p className="text-[10px] text-muted text-center pb-4">
        本平台仅提供数据分析与教育内容，不构成投资建议。
      </p>
    </div>
  );
}
