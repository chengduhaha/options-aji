"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface PulseRow {
  symbol: string;
  yahooSymbol?: string;
  price: number | null;
  changePct: number | null;
  invertColors?: boolean;
  error?: string;
}

interface MarketOverview {
  generatedAt: string;
  marketSessionLabel: string;
  pulse: PulseRow[];
  volatility: {
    vix: number | null;
    vixChangePct: number | null;
    band: string;
    vixSeries: number[];
    termStructure: Record<string, unknown>;
  };
  liquidity: {
    putCallRatioVolumeApprox: number | null;
    methodology?: string;
    symbolsSampled?: string[];
  };
  unusual: Array<{
    symbol: string;
    type: string;
    strike: number;
    expiration: string;
    volOiRatio: number;
    sentiment?: string;
  }>;
  earnings: Array<{ symbol: string; date: string; note?: string }>;
  gexQuick: Array<{ symbol: string; netGex?: number; gammaFlip?: number; regime?: string }>;
}

export default function DashboardHome() {
  const [data, setData] = useState<MarketOverview | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/market/overview", {
      headers: { "X-API-Key": API_KEY },
      cache: "no-store",
    });
    if (!res.ok) {
      setErr(`概览加载失败 (${res.status})`);
      setData(null);
      return;
    }
    const json = (await res.json()) as MarketOverview;
    setData(json);
  }, []);

  const loadAi = useCallback(async () => {
    const res = await fetch("/api/market/ai-summary", {
      headers: { "X-API-Key": API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return;
    const j = (await res.json()) as { text?: string };
    if (j.text) setAiText(j.text);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      void load();
    }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    void loadAi();
  }, [loadAi]);

  const refresh = () => {
    setRefreshing(true);
    Promise.all([load(), loadAi()]).finally(() => {
      setTimeout(() => setRefreshing(false), 400);
    });
  };

  const vixPts =
    data?.volatility.vixSeries?.map((y, i) => ({ i: String(i + 1), y })) ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border2 bg-panel2 flex-shrink-0">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-widest">Dashboard</div>
          <h1 className="text-lg font-semibold text-text">市场总览</h1>
          <div className="text-[11px] text-muted mt-0.5">
            市场状态：
            <span className="text-gold font-medium"> {data?.marketSessionLabel ?? "—"}</span>
            <span className="mx-2">·</span>
            <span>更新 {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-2 text-[12px] text-muted border border-border2 rounded-[8px] px-3 py-1.5 hover:border-border hover:text-text"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", refreshing && "animate-spin")} />
          刷新
        </button>
      </header>

      <div className="p-5 space-y-5">
        {err && (
          <div className="text-red text-[13px] border border-red/30 bg-red/5 rounded-[10px] px-4 py-3">
            {err}
          </div>
        )}

        {/* Market pulse */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(data?.pulse ?? []).map((p) => {
            const invert = Boolean(p.invertColors);
            const ch = p.changePct;
            const color =
              ch === null || ch === undefined
                ? "text-muted"
                : ch === 0
                  ? "text-muted"
                  : invert
                    ? ch > 0
                      ? "text-red"
                      : "text-green"
                    : ch > 0
                      ? "text-green"
                      : "text-red";
            return (
              <div
                key={p.symbol}
                className="bg-panel border border-border2 rounded-[10px] px-4 py-3"
              >
                <div className="text-[10px] text-muted uppercase tracking-widest mb-1">
                  {p.symbol}
                </div>
                <div className="text-[20px] font-mono font-bold text-text leading-none">
                  {typeof p.price === "number" ? p.price.toFixed(2) : "—"}
                </div>
                <div className={clsx("text-[12px] font-mono mt-1", color)}>
                  {ch === null || ch === undefined ? "—" : `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`}
                </div>
              </div>
            );
          })}
          {loading && !data && (
            <div className="col-span-5 text-muted text-[13px] py-6 text-center border border-dashed border-border2 rounded-[10px]">
              正在连接数据源…
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-[12px] font-semibold text-text mb-2">波动率环境</div>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <div className="text-[10px] text-muted">VIX</div>
                <div className="text-[22px] font-mono text-gold">
                  {data?.volatility.vix?.toFixed(2) ?? "—"}
                </div>
                <div
                  className={clsx(
                    "text-[12px] font-mono",
                    (() => {
                      const ch = data?.volatility.vixChangePct;
                      if (ch === null || ch === undefined) return "text-muted";
                      if (ch === 0) return "text-muted";
                      return ch > 0 ? "text-red" : "text-green";
                    })(),
                  )}
                >
                  {data?.volatility.vixChangePct === null ||
                  data?.volatility.vixChangePct === undefined
                    ? "—"
                    : `${data.volatility.vixChangePct >= 0 ? "+" : ""}${data.volatility.vixChangePct.toFixed(2)}%`}
                </div>
              </div>
              <div className="text-[11px] text-muted">
                状态：<span className="text-text">{data?.volatility.band ?? "—"}</span>
                <div className="mt-1">
                  期限结构：
                  <span className="text-text">
                    {(data?.volatility.termStructure?.structure as string) ?? "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-28 mt-3">
              {vixPts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vixPts}>
                    <XAxis dataKey="i" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#111D2E", border: "1px solid rgba(212,175,55,0.2)" }}
                      labelStyle={{ color: "#8B8D97" }}
                    />
                    <Line type="monotone" dataKey="y" stroke="#D4AF37" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-[11px] text-muted h-full flex items-center">暂无迷你序列</div>
              )}
            </div>
          </div>

          <div className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-[12px] font-semibold text-text mb-2">期权流动性（近似）</div>
            <div className="text-[26px] font-mono text-text">
              {data?.liquidity.putCallRatioVolumeApprox !== null &&
              data?.liquidity.putCallRatioVolumeApprox !== undefined
                ? data.liquidity.putCallRatioVolumeApprox.toFixed(2)
                : "—"}
            </div>
            <p className="text-[11px] text-muted mt-2 leading-relaxed">
              {data?.liquidity.methodology ??
                "通过 watchlist 估算全市场 P/C，非交易所官方口径。"}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-[12px] font-semibold text-text mb-3">异动 Top 5（Watchlist）</div>
            <div className="space-y-2">
              {(data?.unusual ?? []).map((u) => (
                <Link
                  key={`${u.symbol}-${u.type}-${u.strike}-${u.expiration}`}
                  href={`/stock/${u.symbol}/unusual`}
                  className="flex items-center justify-between text-[12px] border border-border2 rounded-[8px] px-3 py-2 hover:border-border"
                >
                  <div>
                    <span className="font-mono text-gold">{u.symbol}</span>{" "}
                    <span className="text-muted">{u.type}</span>{" "}
                    <span className="font-mono text-text">{u.strike}</span>
                  </div>
                  <div className="font-mono text-text">Vol/OI {u.volOiRatio.toFixed(2)}</div>
                </Link>
              ))}
              {!loading && (data?.unusual?.length ?? 0) === 0 && (
                <div className="text-muted text-[12px]">暂无异动样本</div>
              )}
            </div>
          </div>

          <div className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-[12px] font-semibold text-text mb-3">近期财报（Watchlist）</div>
            <div className="space-y-2">
              {(data?.earnings ?? []).map((e) => (
                <Link
                  key={`${e.symbol}-${e.date}`}
                  href={`/stock/${e.symbol}/earnings`}
                  className="flex items-center justify-between text-[12px] border border-border2 rounded-[8px] px-3 py-2 hover:border-border"
                >
                  <span className="font-mono text-gold">{e.symbol}</span>
                  <span className="text-muted">{e.date}</span>
                </Link>
              ))}
              {!loading && (data?.earnings?.length ?? 0) === 0 && (
                <div className="text-muted text-[12px]">暂无即将到来的财报（或数据源未返回）</div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] font-semibold text-text">GEX 快览</div>
            <Link href="/stock/SPY/gex" className="text-[11px] text-blue hover:underline">
              查看完整 GEX →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(data?.gexQuick ?? []).map((g) => (
              <div key={g.symbol} className="border border-border2 rounded-[8px] px-3 py-2">
                <div className="font-mono text-gold">{g.symbol}</div>
                <div className="text-[11px] text-muted mt-1">
                  Net GEX{" "}
                  <span className="text-text font-mono">{g.netGex?.toFixed?.(2) ?? "—"}B</span>
                  <span className="mx-2">·</span>
                  γ Flip{" "}
                  <span className="text-text font-mono">{g.gammaFlip?.toFixed?.(2) ?? "—"}</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5">{g.regime}</div>
              </div>
            ))}
            {!loading && (data?.gexQuick?.length ?? 0) === 0 && (
              <div className="text-muted text-[12px]">GEX 数据暂不可用</div>
            )}
          </div>
        </section>

        <section className="bg-panel border border-border rounded-[10px] p-4">
          <div className="text-[11px] text-gold font-semibold mb-2">AI 市场摘要</div>
          <p className="text-[13px] text-muted leading-relaxed whitespace-pre-wrap">
            {aiText ?? "正在生成或等待模型配置…"}
          </p>
        </section>

        <p className="text-[10px] text-muted text-center pb-6">
          本平台仅提供数据分析与教育内容，不构成投资建议。
        </p>
      </div>
    </div>
  );
}
