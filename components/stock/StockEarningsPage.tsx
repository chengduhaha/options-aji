"use client";

import { useEffect, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

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

  return (
    <div className="p-5 space-y-4">
      <h2 className="text-lg font-semibold">财报分析</h2>
      <div className="bg-panel border border-border2 rounded-[10px] p-4 text-[13px] text-muted">
        下次财报：
        <span className="text-gold font-mono ml-2">
          {String(payload?.nextEarningsDate ?? "—")}
        </span>
      </div>
      <p className="text-[12px] text-muted">{String(payload?.note ?? "")}</p>
    </div>
  );
}
