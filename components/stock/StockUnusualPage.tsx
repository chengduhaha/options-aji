"use client";

import { useEffect, useState } from "react";
import TourOverlay from "@/components/ui/TourOverlay";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type UnusualRow = {
  score: number;
  reasons: string[];
  volOiRatio?: number;
  estimatedFlowUsd?: number;
  oiChangePct?: number | null;
  contract_type?: string;
  strike_price?: number;
  expiration_date?: string;
  volume?: number | null;
  open_interest?: number | null;
};

type PagePayload = {
  items?: UnusualRow[];
  total?: number;
  page?: number;
  sort_by?: string;
  order?: string;
};

export default function StockUnusualPage({ symbol }: { symbol: string }) {
  const [rows, setRows] = useState<UnusualRow[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number }>({ total: 0, page: 1 });
  const [sortBy, setSortBy] = useState<"score" | "estimated_flow" | "volume" | "strike">("score");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let c = false;
    (async () => {
      const qs = new URLSearchParams({
        page: String(page),
        page_size: "40",
        sort_by: sortBy,
        order,
        min_score: "60",
      });
      const res = await fetch(
        `/api/stock/${encodeURIComponent(symbol)}/unusual-v2?${qs.toString()}`,
        { headers: { "X-API-Key": API_KEY }, cache: "no-store" },
      );
      if (!res.ok || c) return;
      const j = (await res.json()) as PagePayload;
      if (c) return;
      setRows(Array.isArray(j.items) ? j.items : []);
      setMeta({ total: j.total ?? 0, page: j.page ?? page });
    })();
    return () => {
      c = true;
    };
  }, [symbol, page, sortBy, order]);

  return (
    <div className="p-5 space-y-4" id="unusual-root">
      <TourOverlay
        pageKey={`stock-unusual-${symbol}`}
        steps={[
          { title: "异常评分", content: "≥60（可调）为多因子合成：OI 变化、Vol/OI、IV 偏离、资金流估计、价差。" },
          { title: "筛选与排序", content: "使用列头语义按钮切换排序字段；资金流为 mid×volume×|delta|×100 的粗略估计。" },
          { title: "分页", content: "分页浏览更长列表；数据来源为后端定期同步的期权快照。" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3" id="filters">
        <h2 className="text-[13px] font-semibold">异常期权活动 v2</h2>
        <span className="text-[11px] text-muted">共 {meta.total} 条（当前页）</span>
      </div>
      <p className="text-[11px] text-muted bg-panel border border-border2 rounded-[8px] px-3 py-2 leading-relaxed">
        阈值说明：后端默认 min_score≥60。首次访问 Redis 可能没有 OI 环比，可多刷新几次以获得 🔥 OI 突增信号。
      </p>
      <div className="flex flex-wrap gap-2 text-[11px]" id="sort-bar">
        {(
          [
            ["score", "评分"],
            ["estimated_flow", "资金流"],
            ["volume", "成交量"],
            ["strike", "行权价"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setPage(1);
              if (sortBy === k) setOrder((o) => (o === "desc" ? "asc" : "desc"));
              else {
                setSortBy(k);
                setOrder("desc");
              }
            }}
            className={`px-2 py-1 rounded-[6px] border ${
              sortBy === k ? "border-gold text-gold" : "border-border2 text-muted"
            }`}
          >
            {label}
            {sortBy === k ? (order === "desc" ? " ↓" : " ↑") : ""}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto border border-border2 rounded-[10px]" id="table">
        <table className="w-full text-[11px] min-w-[820px]">
          <thead>
            <tr className="text-muted text-left border-b border-border2">
              <th className="py-2 px-2">评分</th>
              <th className="py-2 px-2">类型</th>
              <th className="py-2 px-2">Strike</th>
              <th className="py-2 px-2">到期</th>
              <th className="py-2 px-2">Vol</th>
              <th className="py-2 px-2">OI</th>
              <th className="py-2 px-2">Vol/OI</th>
              <th className="py-2 px-2">OI Δ%</th>
              <th className="py-2 px-2">资金流$</th>
              <th className="py-2 px-2">原因</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2 font-mono">
            {rows.map((r, i) => (
              <tr key={`${r.strike_price}-${r.expiration_date}-${i}`}>
                <td className="py-1.5 px-2 text-gold font-semibold">{r.score}</td>
                <td className="py-1.5 px-2 uppercase">{r.contract_type}</td>
                <td className="py-1.5 px-2">{r.strike_price}</td>
                <td className="py-1.5 px-2 text-muted">{r.expiration_date}</td>
                <td className="py-1.5 px-2">{r.volume ?? "—"}</td>
                <td className="py-1.5 px-2">{r.open_interest ?? "—"}</td>
                <td className="py-1.5 px-2">{r.volOiRatio?.toFixed(2) ?? "—"}</td>
                <td className="py-1.5 px-2">
                  {typeof r.oiChangePct === "number" ? `${(r.oiChangePct * 100).toFixed(0)}%` : "—"}
                </td>
                <td className="py-1.5 px-2">
                  {typeof r.estimatedFlowUsd === "number"
                    ? r.estimatedFlowUsd >= 1_000_000
                      ? `${(r.estimatedFlowUsd / 1_000_000).toFixed(2)}M`
                      : `${(r.estimatedFlowUsd / 1000).toFixed(0)}K`
                    : "—"}
                </td>
                <td className="py-1.5 px-2 text-[10px] text-muted leading-snug max-w-[220px]">
                  {r.reasons.join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center text-muted text-[12px] py-8">暂无达到阈值的异常合约</div>
        )}
      </div>
      <div className="flex items-center gap-3 text-[12px]" id="pagination">
        <button
          type="button"
          className="px-2 py-1 border border-border2 rounded-md disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          上一页
        </button>
        <span className="text-muted">第 {page} 页</span>
        <button
          type="button"
          className="px-2 py-1 border border-border2 rounded-md disabled:opacity-40"
          disabled={rows.length < 40}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
