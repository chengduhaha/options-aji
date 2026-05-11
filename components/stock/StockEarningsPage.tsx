"use client";

import { useEffect, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type HistRow = {
  date?: string;
  eps?: number | null;
  epsEstimated?: number | null;
  revenue?: number | null;
  priceWindowMovePct?: number | null;
  ivCrushPct?: number | null;
  source?: string;
};

export default function StockEarningsPage({ symbol }: { symbol: string }) {
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/earnings`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || c) return;
      setPayload((await res.json()) as Record<string, unknown>);
    })();
    return () => {
      c = true;
    };
  }, [symbol]);

  const history = (payload?.history as HistRow[] | undefined) ?? [];
  const summary = payload?.summary as Record<string, unknown> | undefined;

  return (
    <div className="p-5 space-y-4">
      <h2 className="text-lg font-semibold">财报分析</h2>
      <div className="bg-panel border border-border2 rounded-[10px] p-4 text-[13px] text-muted">
        下次财报：
        <span className="text-gold font-mono ml-2">
          {String(payload?.nextEarningsDate ?? "—")}
        </span>
        {summary?.eventCount != null && (
          <span className="ml-4">
            样本 <span className="font-mono text-text">{String(summary.eventCount)}</span> 期
            {summary.avgAbsPriceWindowMovePct != null && (
              <>
                ，|漂移|% 均值{" "}
                <span className="font-mono text-gold">
                  {String(summary.avgAbsPriceWindowMovePct)}
                </span>
              </>
            )}
          </span>
        )}
      </div>
      <p className="text-[12px] text-muted">{String(payload?.note ?? "")}</p>
      {history.length > 0 && (
        <div className="overflow-x-auto border border-border2 rounded-[10px]">
          <table className="w-full text-left text-[12px] text-text">
            <thead className="bg-panel2 text-muted uppercase tracking-wide text-[10px]">
              <tr>
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2">EPS</th>
                <th className="px-3 py-2">预期</th>
                <th className="px-3 py-2">窗口涨跌%</th>
                <th className="px-3 py-2">IV crush</th>
                <th className="px-3 py-2">源</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={`${row.date}-${row.source}`} className="border-t border-border2">
                  <td className="px-3 py-2 font-mono">{row.date ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">{row.eps ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">{row.epsEstimated ?? "—"}</td>
                  <td
                    className={`px-3 py-2 font-mono ${
                      (row.priceWindowMovePct ?? 0) >= 0 ? "text-green" : "text-red"
                    }`}
                  >
                    {row.priceWindowMovePct != null ? row.priceWindowMovePct.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-muted">
                    {row.ivCrushPct != null ? row.ivCrushPct : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted">{row.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
