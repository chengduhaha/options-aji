"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { 
  RefreshCw, TrendingUp, TrendingDown, Activity, 
  Zap, AlertTriangle, Calendar, ArrowUpRight,
  BarChart3, Brain, Signal, ChevronRight
} from "lucide-react";
import { clsx } from "clsx";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
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

// AI Signal mock data for demo
const AI_SIGNALS = [
  { id: 1, symbol: "NVDA", type: "CALL", confidence: 87, signal: "看涨", reason: "GEX支撑 + 机构增持" },
  { id: 2, symbol: "AAPL", type: "PUT", confidence: 72, signal: "看跌", reason: "IV偏高 + 财报前波动" },
  { id: 3, symbol: "SPY", type: "CALL", confidence: 65, signal: "中性偏多", reason: "Gamma正转 + 支撑位有效" },
];

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

  const vixPts = data?.volatility.vixSeries?.map((y, i) => ({ i: String(i + 1), y })) ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-glass-border glass flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-foreground">市场总览</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green/10 border border-green/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <span className="text-[10px] font-medium text-green">{data?.marketSessionLabel ?? "连接中"}</span>
            </div>
          </div>
          <div className="text-[12px] text-muted flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>更新于 {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-2 text-[12px] text-muted-foreground glass-subtle rounded-lg px-4 py-2 hover:text-foreground hover:border-primary/30 transition-all"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          刷新数据
        </button>
      </header>

      <div className="p-6 space-y-6">
        {err && (
          <div className="flex items-center gap-3 text-red text-[13px] glass rounded-xl px-4 py-3 border border-red/20">
            <AlertTriangle className="w-4 h-4" />
            {err}
          </div>
        )}

        {/* Market Pulse Cards */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(data?.pulse ?? []).map((p, idx) => {
            const invert = Boolean(p.invertColors);
            const ch = p.changePct;
            const isUp = ch !== null && ch !== undefined && (invert ? ch < 0 : ch > 0);
            const isDown = ch !== null && ch !== undefined && (invert ? ch > 0 : ch < 0);
            const color = ch === null || ch === undefined || ch === 0 
              ? "text-muted" 
              : isUp ? "text-green" : "text-red";
            
            return (
              <div
                key={p.symbol}
                className={clsx(
                  "glass rounded-xl p-4 card-interactive opacity-0 animate-fade-up",
                  `stagger-${Math.min(idx + 1, 5)}`
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    {p.symbol}
                  </span>
                  {isUp && <TrendingUp className="w-4 h-4 text-green" />}
                  {isDown && <TrendingDown className="w-4 h-4 text-red" />}
                </div>
                <div className="text-[24px] font-mono font-bold text-foreground leading-none number-display">
                  {typeof p.price === "number" ? p.price.toFixed(2) : "—"}
                </div>
                <div className={clsx("text-[13px] font-mono mt-1.5 flex items-center gap-1", color)}>
                  {ch === null || ch === undefined ? "—" : (
                    <>
                      <span>{ch >= 0 ? "+" : ""}{ch.toFixed(2)}%</span>
                      {isUp && <ArrowUpRight className="w-3 h-3" />}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {loading && !data && (
            <div className="col-span-5 glass rounded-xl py-12 text-center">
              <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-primary/20 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              </div>
              <p className="text-muted text-[13px]">正在连接数据源...</p>
            </div>
          )}
        </section>

        {/* AI Signals Banner */}
        <section className="glass rounded-xl p-4 border border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">AI 实时信号</h3>
                <p className="text-[11px] text-muted">基于 GEX + 机构流向 + IV 分析</p>
              </div>
            </div>
            <Link 
              href="/ai" 
              className="flex items-center gap-1 text-[12px] text-primary hover:underline"
            >
              查看全部 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3">
            {AI_SIGNALS.map((sig) => (
              <div 
                key={sig.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-glass border border-glass-border hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className={clsx(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-[12px] font-bold",
                  sig.type === "CALL" ? "bg-green/20 text-green" : "bg-red/20 text-red"
                )}>
                  {sig.type === "CALL" ? "C" : "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground">{sig.symbol}</span>
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold",
                      sig.confidence >= 80 ? "bg-green/20 text-green" : 
                      sig.confidence >= 60 ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted"
                    )}>
                      {sig.confidence}%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted truncate">{sig.reason}</p>
                </div>
                <Signal className={clsx(
                  "w-4 h-4 flex-shrink-0",
                  sig.type === "CALL" ? "text-green" : "text-red"
                )} />
              </div>
            ))}
          </div>
        </section>

        {/* Main Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* VIX Chart */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">波动率环境</h3>
                  <p className="text-[11px] text-muted">VIX 恐慌指数</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[28px] font-mono font-bold text-primary number-display">
                  {data?.volatility.vix?.toFixed(2) ?? "—"}
                </div>
                <div className={clsx(
                  "text-[12px] font-mono",
                  (() => {
                    const ch = data?.volatility.vixChangePct;
                    if (ch === null || ch === undefined || ch === 0) return "text-muted";
                    return ch > 0 ? "text-red" : "text-green";
                  })()
                )}>
                  {data?.volatility.vixChangePct === null || data?.volatility.vixChangePct === undefined
                    ? "—"
                    : `${data.volatility.vixChangePct >= 0 ? "+" : ""}${data.volatility.vixChangePct.toFixed(2)}%`}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="px-3 py-1.5 rounded-lg bg-glass border border-glass-border">
                <span className="text-[10px] text-muted">状态</span>
                <p className="text-[12px] font-medium text-foreground">{data?.volatility.band ?? "—"}</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-glass border border-glass-border">
                <span className="text-[10px] text-muted">期限结构</span>
                <p className="text-[12px] font-medium text-foreground">
                  {(data?.volatility.termStructure?.structure as string) ?? "—"}
                </p>
              </div>
            </div>

            <div className="h-32">
              {vixPts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vixPts}>
                    <defs>
                      <linearGradient id="vixGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f0b429" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f0b429" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="i" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ 
                        background: "rgba(15, 28, 48, 0.95)", 
                        border: "1px solid rgba(240, 180, 41, 0.2)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                      }}
                      labelStyle={{ color: "#64748b" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="y" 
                      stroke="#f0b429" 
                      strokeWidth={2} 
                      fill="url(#vixGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[12px] text-muted">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          {/* P/C Ratio */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">期权流动性</h3>
                <p className="text-[11px] text-muted">Put/Call 成交量比</p>
              </div>
            </div>
            
            <div className="text-[48px] font-mono font-bold text-foreground number-display mb-2">
              {data?.liquidity.putCallRatioVolumeApprox !== null &&
              data?.liquidity.putCallRatioVolumeApprox !== undefined
                ? data.liquidity.putCallRatioVolumeApprox.toFixed(2)
                : "—"}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className={clsx(
                "px-2 py-1 rounded-lg text-[11px] font-medium",
                (data?.liquidity.putCallRatioVolumeApprox ?? 1) > 1 
                  ? "bg-red/20 text-red" 
                  : "bg-green/20 text-green"
              )}>
                {(data?.liquidity.putCallRatioVolumeApprox ?? 1) > 1 ? "偏看跌" : "偏看涨"}
              </div>
            </div>
            
            <p className="text-[11px] text-muted leading-relaxed">
              {data?.liquidity.methodology ?? "通过 watchlist 估算全市场 P/C，非交易所官方口径。"}
            </p>
          </div>
        </section>

        {/* Unusual Activity & Earnings */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unusual Activity */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">异动追踪</h3>
                  <p className="text-[11px] text-muted">Vol/OI 异常活动</p>
                </div>
              </div>
              <Link href="/options/unusual" className="text-[11px] text-primary hover:underline">
                查看全部
              </Link>
            </div>
            
            <div className="space-y-2">
              {(data?.unusual ?? []).map((u) => (
                <Link
                  key={`${u.symbol}-${u.type}-${u.strike}-${u.expiration}`}
                  href={`/stock/${u.symbol}/unusual`}
                  className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold",
                      u.type === "CALL" ? "bg-green/20 text-green" : "bg-red/20 text-red"
                    )}>
                      {u.type === "CALL" ? "C" : "P"}
                    </span>
                    <div>
                      <span className="font-mono font-semibold text-foreground">{u.symbol}</span>
                      <span className="text-muted text-[12px] ml-2">${u.strike}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-foreground text-[13px]">
                      {u.volOiRatio.toFixed(1)}x
                    </div>
                    <div className="text-[10px] text-muted">Vol/OI</div>
                  </div>
                </Link>
              ))}
              {!loading && (data?.unusual?.length ?? 0) === 0 && (
                <div className="text-center py-8 text-muted text-[12px]">
                  暂无异动数据
                </div>
              )}
            </div>
          </div>

          {/* Earnings Calendar */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">财报日历</h3>
                  <p className="text-[11px] text-muted">近期财报发布</p>
                </div>
              </div>
              <Link href="/earnings" className="text-[11px] text-primary hover:underline">
                查看全部
              </Link>
            </div>
            
            <div className="space-y-2">
              {(data?.earnings ?? []).map((e) => (
                <Link
                  key={`${e.symbol}-${e.date}`}
                  href={`/stock/${e.symbol}/earnings`}
                  className="flex items-center justify-between p-3 rounded-lg bg-glass border border-glass-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
                      <span className="font-mono text-[11px] font-bold text-purple">
                        {e.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-foreground">{e.symbol}</span>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-glass text-[11px] text-muted">
                    {e.date}
                  </div>
                </Link>
              ))}
              {!loading && (data?.earnings?.length ?? 0) === 0 && (
                <div className="text-center py-8 text-muted text-[12px]">
                  暂无即将到来的财报
                </div>
              )}
            </div>
          </div>
        </section>

        {/* GEX Overview */}
        <section className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">GEX 快览</h3>
                <p className="text-[11px] text-muted">Gamma Exposure 分析</p>
              </div>
            </div>
            <Link href="/gex" className="flex items-center gap-1 text-[12px] text-primary hover:underline">
              完整分析 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(data?.gexQuick ?? []).map((g) => (
              <div 
                key={g.symbol} 
                className="p-4 rounded-lg bg-glass border border-glass-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-primary">{g.symbol}</span>
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                    g.regime?.includes("正") ? "bg-green/20 text-green" : "bg-red/20 text-red"
                  )}>
                    {g.regime?.includes("正") ? "正Gamma" : "负Gamma"}
                  </span>
                </div>
                <div className="space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">Net GEX</span>
                    <span className="font-mono text-foreground">{g.netGex?.toFixed?.(2) ?? "—"}B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Gamma Flip</span>
                    <span className="font-mono text-foreground">${g.gammaFlip?.toFixed?.(0) ?? "—"}</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && (data?.gexQuick?.length ?? 0) === 0 && (
              <div className="col-span-4 text-center py-8 text-muted text-[12px]">
                GEX 数据暂不可用
              </div>
            )}
          </div>
        </section>

        {/* AI Summary */}
        <section className="glass rounded-xl p-5 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">AI 市场摘要</h3>
              <p className="text-[11px] text-muted">基于实时数据的智能分析</p>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {aiText ?? "正在生成智能分析..."}
          </p>
        </section>

        {/* Footer */}
        <p className="text-[10px] text-muted text-center pb-6">
          本平台仅提供数据分析与教育内容，不构成投资建议。交易有风险，入市需谨慎。
        </p>
      </div>
    </div>
  );
}
