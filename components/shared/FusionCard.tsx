"use client";

import { useEffect, useState } from "react";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface FusionAnalysis {
  regime: string;
  signal: string;
  confidence: string;
  summary_zh: string;
  strategy_bias: string[];
  risk_factors: string[];
}

const REGIME_COLORS: Record<string, string> = {
  "震荡": "text-gold",
  "趋势": "text-blue",
  "高波动": "text-red",
  "低波动": "text-green",
  "财报前": "text-purple",
  "中性": "text-muted",
};

const SIGNAL_ICONS: Record<string, typeof Lightbulb> = {
  "适合卖方": TrendingDown,
  "适合买方": TrendingUp,
  "中性偏多": TrendingUp,
  "中性偏空": TrendingDown,
  "中性": Activity,
};

const SIGNAL_COLORS: Record<string, string> = {
  "适合卖方": "text-green border-green/30 bg-green/10",
  "适合买方": "text-accent border-accent/30 bg-accent/10",
  "中性偏多": "text-gold border-gold/30 bg-gold-dim",
  "中性偏空": "text-red border-red/30 bg-red/10",
  "中性": "text-muted border-muted/30 bg-glass",
};

export default function FusionCard({ symbol, endpoint }: { symbol?: string; endpoint: "market" | "stock" }) {
  const [data, setData] = useState<FusionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url =
      endpoint === "market"
        ? "/api/fusion/market"
        : `/api/fusion/stock/${encodeURIComponent(symbol ?? "SPY")}`;

    (async () => {
      try {
        const res = await fetch(url, { headers: { "X-API-Key": API_KEY }, cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const j = await res.json();
        if (!cancelled) {
          setData(j.analysis ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [symbol, endpoint]);

  if (loading) {
    return (
      <div className="glass rounded-xl p-4 border border-primary/20 animate-pulse">
        <div className="h-4 w-32 bg-primary/10 rounded mb-3" />
        <div className="h-3 w-full bg-primary/10 rounded mb-2" />
        <div className="h-3 w-3/4 bg-primary/10 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const regimeColor = REGIME_COLORS[data.regime] ?? "text-foreground";
  const SignalIcon = SIGNAL_ICONS[data.signal] ?? Activity;

  return (
    <div className="glass rounded-xl p-4 border border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-semibold text-foreground">
            {endpoint === "market" ? "市场画像" : `${symbol} 画像`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border font-medium", SIGNAL_COLORS[data.signal] ?? "text-muted")}>
            <SignalIcon className="w-3 h-3 inline mr-0.5" />
            {data.signal}
          </span>
          <span className={clsx("text-[10px] font-mono", regimeColor)}>
            {data.regime}
          </span>
        </div>
      </div>

      {data.summary_zh && (
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{data.summary_zh}</p>
      )}

      {data.strategy_bias.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Lightbulb className="w-3 h-3 text-gold" />
            <span className="text-[10px] text-muted font-medium">策略参考</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.strategy_bias.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gold-dim border border-gold/20 text-gold">{s}</span>
            ))}
          </div>
        </div>
      )}

      {data.risk_factors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-glass-border">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-red" />
            <span className="text-[10px] text-red font-medium">风险关注</span>
          </div>
          <div className="space-y-0.5">
            {data.risk_factors.map((r, i) => (
              <p key={i} className="text-[10px] text-red/80 leading-tight">⚠ {r}</p>
            ))}
          </div>
        </div>
      )}

      {data.confidence && (
        <div className="mt-2 pt-2 border-t border-glass-border text-right">
          <span className="text-[9px] text-muted">置信度: {data.confidence}</span>
        </div>
      )}
    </div>
  );
}
