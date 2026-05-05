"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Newspaper, ExternalLink, BarChart3 } from "lucide-react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-key-change-me";

type MarketData = {
  symbol: string;
  price: number;
  changePct: number;
  atmIv: number;
  ivRank: number;
  pcr: number;
  volume: number;
  timestamp: string;
};

const NEWS = [
  { headline: "Trump 关税令推动 SPY Put 需求激增", sentiment: "bear", source: "@DeItaone", time: "3m" },
  { headline: "Fed Waller：还需几个月好数据才考虑降息", sentiment: "bear", source: "Bloomberg", time: "22m" },
  { headline: "NVDA 异常大单：5000 张 $140C 5/9", sentiment: "bull", source: "@unusual_whales", time: "35m" },
];

export default function RightPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/market/${encodeURIComponent(ticker)}`, {
      headers: { "X-API-Key": API_KEY },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [ticker]);

  const price = data?.price ?? 548.32;
  const chg = data?.changePct ?? 0.0;
  const iv = data?.atmIv ?? 18.5;
  const ivRank = data?.ivRank ?? 35;
  const pcr = data?.pcr ?? 0.85;
  const isUp = chg >= 0;

  return (
    <aside className="w-[300px] flex-shrink-0 border-l border-glass-border flex flex-col glass overflow-y-auto">
      {/* Price Header */}
      <div className="p-5 border-b border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="font-mono font-bold text-primary text-[12px]">{ticker.slice(0, 2)}</span>
            </div>
            <div>
              <span className="text-[15px] font-bold font-mono text-foreground">{ticker}</span>
              <div className="flex items-center gap-1">
                {isUp ? (
                  <TrendingUp className="w-3 h-3 text-green" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red" />
                )}
                <span className={clsx(
                  "text-[11px] font-mono font-medium",
                  isUp ? "text-green" : "text-red"
                )}>
                  {isUp ? "+" : ""}{chg.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          {loading && <Activity className="w-4 h-4 text-primary animate-pulse" />}
        </div>
        
        <div className="text-[32px] font-bold font-mono text-foreground leading-none number-display mb-4">
          ${price.toFixed(2)}
        </div>

        {/* Sparkline */}
        <div className="relative h-16 mb-4">
          <svg className="w-full h-full" viewBox="0 0 200 64" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={isUp
                ? "M0 48 L40 40 L80 28 L120 32 L160 18 L200 10"
                : "M0 16 L40 24 L80 36 L120 32 L160 46 L200 54"}
              fill="none"
              stroke={isUp ? "#10b981" : "#ef4444"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={isUp
                ? "M0 48 L40 40 L80 28 L120 32 L160 18 L200 10 L200 64 L0 64Z"
                : "M0 16 L40 24 L80 36 L120 32 L160 46 L200 54 L200 64 L0 64Z"}
              fill="url(#sparkGradient)"
            />
          </svg>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "ATM IV", value: `${iv.toFixed(1)}%`, color: "text-accent" },
            { label: "IV Rank", value: `${ivRank}%`, color: ivRank > 50 ? "text-red" : "text-green" },
            { label: "P/C Ratio", value: pcr.toFixed(2), color: pcr > 1 ? "text-red" : "text-green" },
          ].map((item) => (
            <div key={item.label} className="glass-subtle rounded-lg px-3 py-2.5 text-center">
              <div className="text-[9px] text-muted uppercase tracking-wider mb-1">{item.label}</div>
              <div className={clsx("text-[14px] font-mono font-bold", item.color)}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-5 border-b border-glass-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">关键指标</span>
        </div>
        <div className="space-y-2">
          {[
            { label: "Gamma 环境", value: "正Gamma", status: "positive" },
            { label: "GEX净值", value: "$2.4B", status: "neutral" },
            { label: "Put Wall", value: "$540", status: "neutral" },
            { label: "Call Wall", value: "$560", status: "neutral" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-muted">{item.label}</span>
              <span className={clsx(
                "text-[12px] font-mono font-medium",
                item.status === "positive" ? "text-green" : 
                item.status === "negative" ? "text-red" : "text-foreground"
              )}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      <div className="flex-1 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">相关资讯</span>
        </div>
        <div className="space-y-3">
          {NEWS.map((n, i) => (
            <div 
              key={i} 
              className="group p-3 rounded-lg glass-subtle hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-muted">{n.source}</span>
                <span className="text-[9px] text-muted/50">{n.time}</span>
                <span
                  className={clsx(
                    "ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold",
                    n.sentiment === "bull" ? "bg-green/20 text-green" : 
                    n.sentiment === "bear" ? "bg-red/20 text-red" : "bg-muted/20 text-muted"
                  )}
                >
                  {n.sentiment === "bull" ? "看涨" : n.sentiment === "bear" ? "看跌" : "中性"}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                {n.headline}
              </p>
            </div>
          ))}
        </div>
        <button className="mt-4 flex items-center gap-1.5 text-[11px] text-primary hover:underline">
          查看全部新闻 <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}
