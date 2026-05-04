"use client";

import { useEffect, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export default function StockUnusualPage({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<
    Array<{
      type: string;
      strike: number;
      expiration: string;
      volume: number;
      openInterest: number;
      volOiRatio: number;
      sentiment?: string;
    }>
  >([]);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await fetch(
        `/api/stock/${encodeURIComponent(symbol)}/unusual?vol_oi_min=2&volume_min=100`,
        { headers: { "X-API-Key": API_KEY }, cache: "no-store" },
      );
      if (!res.ok || c) return;
      const j = (await res.json()) as { items?: typeof items };
      if (!c && j.items) setItems(j.items);
    })();
    return () => {
      c = true;
    };
  }, [symbol]);

  return (
    <div className="p-5">
      <div className="text-[12px] font-semibold mb-3">异动检测（Vol/OI）</div>
      <div className="overflow-x-auto border border-border2 rounded-[10px]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted text-left border-b border-border2">
              <th className="py-2 px-2">类型</th>
              <th className="py-2 px-2">Strike</th>
              <th className="py-2 px-2">到期</th>
              <th className="py-2 px-2">Vol</th>
              <th className="py-2 px-2">OI</th>
              <th className="py-2 px-2">Vol/OI</th>
              <th className="py-2 px-2">情绪</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2 font-mono">
            {items.map((r, i) => (
              <tr key={i}>
                <td className="py-1.5 px-2">{r.type}</td>
                <td className="py-1.5 px-2">{r.strike}</td>
                <td className="py-1.5 px-2 text-muted">{r.expiration}</td>
                <td className="py-1.5 px-2">{r.volume}</td>
                <td className="py-1.5 px-2">{r.openInterest}</td>
                <td className="py-1.5 px-2">{r.volOiRatio.toFixed(2)}</td>
                <td className="py-1.5 px-2">{r.sentiment}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center text-muted text-[12px] py-8">暂无满足阈值的异动</div>
        )}
      </div>
    </div>
  );
}
