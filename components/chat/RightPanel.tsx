"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Newspaper, ExternalLink, BarChart3 } from "lucide-react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-key-change-me";

type OverviewData = {
  bar?: { price?: number; changePct?: number };
  keyStats?: Record<string, unknown>;
  optionLiquidity?: Record<string, unknown>;
  earnings?: { nextDate?: string | null };
};

type GexData = {
  netGex?: number;
  regime?: string;
  gammaFlip?: number;
  maxPain?: number;
  putWall?: number;
  callWall?: number;
};

type NewsItem = {
  title?: string;
  source?: string;
  published_at?: string;
  url?: string;
  summary_zh?: string;
};

export default function RightPanel({ ticker }: { ticker: string }) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [gex, setGex] = useState<GexData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch(`/api/stock/${encodeURIComponent(ticker)}/overview`, {
        headers: { "X-API-Key": API_KEY }, cache: "no-store",
      }).then(r => r.ok ? r.json() : null),
      fetch(`/api/stock/${encodeURIComponent(ticker)}/gex`, {
        headers: { "X-API-Key": API_KEY }, cache: "no-store",
      }).then(r => r.ok ? r.json() : null),
      fetch(`/api/news/stock?tickers=${encodeURIComponent(ticker)}&limit=5`, {
        headers: { "X-API-Key": API_KEY }, cache: "no-store",
      }).then(r => r.ok ? r.json() : null),
    ])
      .then(([ov, gx, nw]) => {
        if (cancelled) return;
        const newsList = Array.isArray(nw) ? nw : (nw as { news?: NewsItem[] })?.news ?? [];
        setOverview(ov as OverviewData | null);
        setGex(gx as GexData | null);
        setNews(newsList);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [ticker]);

  const price = overview?.bar?.price;
  const chg = overview?.bar?.changePct;
  const isUp = chg != null && chg >= 0;
  const iv = overview?.keyStats?.atmIv as number | undefined;
  const ivRank = overview?.keyStats?.ivRank as number | undefined;
  const pcr = overview?.optionLiquidity?.pcrVolume as number | undefined;

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
              {chg != null && (
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
              )}
            </div>
          </div>
          {loading && <Activity className="w-4 h-4 text-primary animate-pulse" />}
        </div>

        <div className="text-[32px] font-bold font-mono text-foreground leading-none number-display mb-4">
          {price != null ? `$${price.toFixed(2)}` : "—"}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "ATM IV", value: iv != null ? `${iv.toFixed(1)}%` : "—", color: "text-accent" },
            { label: "IV Rank", value: ivRank != null ? `${ivRank.toFixed(0)}%` : "—", color: ivRank != null && ivRank > 50 ? "text-red" : "text-green" },
            { label: "P/C Ratio", value: pcr != null ? pcr.toFixed(2) : "—", color: pcr != null && pcr > 1 ? "text-red" : "text-green" },
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

      {/* GEX Quick Stats */}
      {gex && (
        <div className="p-5 border-b border-glass-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">GEX 快览</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Gamma 环境", value: gex.regime === "Positive Gamma" ? "正Gamma" : "负Gamma", status: gex.regime === "Positive Gamma" ? "positive" : "negative" },
              { label: "Net GEX", value: gex.netGex != null ? `${(gex.netGex / 1e9).toFixed(2)}B` : "—", status: "neutral" },
              { label: "Gamma Flip", value: gex.gammaFlip != null ? `$${gex.gammaFlip.toFixed(0)}` : "—", status: "neutral" },
              { label: "Max Pain", value: gex.maxPain != null ? `$${gex.maxPain.toFixed(0)}` : "—", status: "neutral" },
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
      )}

      {/* Real News */}
      <div className="flex-1 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">相关资讯</span>
        </div>
        {news.length === 0 ? (
          <div className="text-center text-muted text-[11px] py-6">
            {loading ? "加载中..." : "暂无相关新闻"}
          </div>
        ) : (
          <div className="space-y-3">
            {news.slice(0, 5).map((n, i) => (
              <a
                key={i}
                href={n.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-3 rounded-lg glass-subtle hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-muted truncate max-w-[100px]">{n.source ?? "—"}</span>
                  {n.published_at && (
                    <span className="text-[9px] text-muted/50">
                      {new Date(n.published_at).toLocaleDateString()}
                    </span>
                  )}
                  <ExternalLink className="w-3 h-3 text-muted ml-auto opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors line-clamp-2">
                  {n.summary_zh ?? n.title}
                </p>
              </a>
            ))}
          </div>
        )}
        <a
          href={`/news?ticker=${ticker}`}
          className="mt-4 flex items-center gap-1.5 text-[11px] text-primary hover:underline"
        >
          查看全部新闻 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}