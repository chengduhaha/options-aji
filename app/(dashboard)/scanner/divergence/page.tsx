"use client";

import { Fragment, useState, useEffect } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { clsx } from "clsx";

interface DivergenceItem {
  symbol: string;
  social_score: number;
  mention_growth_pct: number;
  insider_sell_usd: number;
  divergence_score: number;
  alert_level: string;
  ai_narrative: string;
}

type SortKey = keyof DivergenceItem;

export default function DivergenceScannerPage() {
  const [items, setItems] = useState<DivergenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("divergence_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/divergence/scan");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...items].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-0.5" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-0.5" />
    );
  }

  function AlertBadge({ level }: { level: string }) {
    const up = level?.toUpperCase();
    if (up === "HIGH")
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          高风险
        </span>
      );
    if (up === "MEDIUM")
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          中风险
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
        低风险
      </span>
    );
  }

  const highCount = items.filter((i) => i.alert_level?.toUpperCase() === "HIGH").length;
  const midCount = items.filter((i) => i.alert_level?.toUpperCase() === "MEDIUM").length;

  const thClass =
    "px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-foreground select-none";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">散户背离扫描</h1>
            <p className="text-sm text-muted-foreground">
              社交媒体热度与内部人士抛售的背离信号
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-glass border border-glass-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-glass-border bg-glass/40 p-4">
          <div className="text-[11px] text-muted uppercase tracking-wide mb-1">扫描标的</div>
          <div className="text-2xl font-bold text-foreground">{items.length}</div>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass/40 p-4">
          <div className="text-[11px] text-muted uppercase tracking-wide mb-1">高风险信号</div>
          <div className="text-2xl font-bold text-red-400">{highCount}</div>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass/40 p-4">
          <div className="text-[11px] text-muted uppercase tracking-wide mb-1">中风险信号</div>
          <div className="text-2xl font-bold text-yellow-400">{midCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-glass-border bg-glass/40 overflow-hidden">
        {error && (
          <div className="p-4 text-center text-red-400 text-sm">{error}</div>
        )}
        {loading && !error && (
          <div className="p-8 text-center text-muted-foreground text-sm">加载中…</div>
        )}
        {!loading && !error && sorted.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">暂无背离信号</div>
        )}
        {!loading && !error && sorted.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border bg-glass/60">
                <th className={clsx(thClass, "text-left")} onClick={() => handleSort("symbol")}>
                  股票 <SortIcon k="symbol" />
                </th>
                <th className={clsx(thClass, "text-right")} onClick={() => handleSort("social_score")}>
                  社交热度 <SortIcon k="social_score" />
                </th>
                <th className={clsx(thClass, "text-right")} onClick={() => handleSort("mention_growth_pct")}>
                  提及增长 <SortIcon k="mention_growth_pct" />
                </th>
                <th className={clsx(thClass, "text-right")} onClick={() => handleSort("insider_sell_usd")}>
                  内部抛售额 <SortIcon k="insider_sell_usd" />
                </th>
                <th className={clsx(thClass, "text-right")} onClick={() => handleSort("divergence_score")}>
                  背离分 <SortIcon k="divergence_score" />
                </th>
                <th className={clsx(thClass, "text-center")}>风险等级</th>
                <th className={clsx(thClass, "text-center")}>AI 解读</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <Fragment key={item.symbol}>
                  <tr
                    className="border-b border-glass-border/50 hover:bg-glass/60 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpanded(expanded === item.symbol ? null : item.symbol)
                    }
                  >
                    <td className="px-4 py-3 font-bold text-foreground font-mono">
                      {item.symbol}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-green-400 font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {item.social_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      +{item.mention_growth_pct?.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-red-400 font-medium">
                        <TrendingDown className="w-3 h-3" />
                        ${(item.insider_sell_usd / 1_000_000).toFixed(1)}M
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 bg-glass rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full"
                            style={{
                              width: `${Math.min(item.divergence_score, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-foreground font-bold w-6 text-right">
                          {item.divergence_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AlertBadge level={item.alert_level} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-primary text-[11px] hover:underline">
                        {expanded === item.symbol ? "收起" : "展开"}
                      </button>
                    </td>
                  </tr>
                  {expanded === item.symbol && (
                    <tr className="bg-glass/20">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                          <div className="text-[11px] text-primary uppercase tracking-wide mb-2 font-semibold">
                            AI 智能分析
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {item.ai_narrative || "暂无分析"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
