"use client";

import { useState, useEffect } from "react";

/** 经 Next `/api/market/*` 代理到 `OPTIONS_AJI_BACKEND_URL`（避免 HTTPS 页直连 HTTP VPS 混合内容阻断）。 */
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
    <aside className="w-[290px] flex-shrink-0 border-l border-border2 flex flex-col bg-panel2 overflow-y-auto">
      {/* Price */}
      <div className="px-4 pt-4 pb-3 border-b border-border2">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[13px] font-semibold font-mono text-text">{ticker}</span>
          <span className={`text-[11px] font-mono ${isUp ? "text-green" : "text-red"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
          </span>
        </div>
        <div className="text-[26px] font-bold font-mono text-text leading-none">
          ${price.toFixed(2)}
        </div>

        {/* Sparkline placeholder */}
        <svg className="w-full h-12 mt-3" viewBox="0 0 200 48">
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "#00D4AA" : "#FF6B6B"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? "#00D4AA" : "#FF6B6B"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={isUp
              ? "M0 36 L40 30 L80 20 L120 24 L160 14 L200 8"
              : "M0 12 L40 18 L80 28 L120 24 L160 34 L200 40"}
            fill="none"
            stroke={isUp ? "#00D4AA" : "#FF6B6B"}
            strokeWidth="1.5"
          />
          <path
            d={isUp
              ? "M0 36 L40 30 L80 20 L120 24 L160 14 L200 8 L200 48 L0 48Z"
              : "M0 12 L40 18 L80 28 L120 24 L160 34 L200 40 L200 48 L0 48Z"}
            fill="url(#sg)"
          />
        </svg>

        {/* IV / PCR */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "ATM IV", value: `${iv.toFixed(1)}%` },
            { label: "IV Rank", value: `${ivRank}%` },
            { label: "P/C Ratio", value: pcr.toFixed(2) },
          ].map((item) => (
            <div key={item.label} className="bg-bg/60 rounded-[6px] px-2 py-1.5 text-center">
              <div className="text-[9.5px] text-muted mb-0.5">{item.label}</div>
              <div className="text-[12px] font-mono font-semibold text-text">{item.value}</div>
            </div>
          ))}
        </div>
        {loading && <div className="text-[10px] text-muted mt-1 text-center">加载中...</div>}
      </div>

      {/* News */}
      <div className="flex-1 px-4 pt-3">
        <div className="text-[10px] text-muted uppercase tracking-widest mb-2">相关资讯</div>
        <div className="space-y-3">
          {NEWS.map((n, i) => (
            <div key={i} className="cursor-pointer group">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted">{n.source}</span>
                <span className="text-[9px] text-muted/50">{n.time} ago</span>
                <span
                  className={`ml-auto text-[9.5px] font-semibold ${
                    n.sentiment === "bull" ? "text-green" : n.sentiment === "bear" ? "text-red" : "text-muted"
                  }`}
                >
                  {n.sentiment === "bull" ? "● 看涨" : n.sentiment === "bear" ? "● 看跌" : "● 中性"}
                </span>
              </div>
              <p className="text-[12px] text-text leading-snug group-hover:text-gold transition-colors">
                {n.headline}
              </p>
            </div>
          ))}
        </div>
        <button className="mt-4 text-[11px] text-muted hover:text-gold transition-colors">
          查看全部新闻 →
        </button>
      </div>
    </aside>
  );
}
