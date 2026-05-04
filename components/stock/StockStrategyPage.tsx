"use client";

import { useEffect, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export default function StockStrategyPage({ symbol }: { symbol: string }) {
  const [ideas, setIdeas] = useState<Array<{ id: string; title: string; note: string }>>([]);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/strategy-ideas`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || c) return;
      const j = (await res.json()) as { ideas?: typeof ideas };
      if (j.ideas) setIdeas(j.ideas);
    })();
    return () => {
      c = true;
    };
  }, [symbol]);

  return (
    <div className="p-5 space-y-4">
      <h2 className="text-lg font-semibold text-text">策略建议</h2>
      <div className="grid gap-3">
        {ideas.map((x) => (
          <div key={x.id} className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-gold font-semibold">{x.title}</div>
            <p className="text-[13px] text-muted mt-2">{x.note}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted">教育用途，不构成投资建议。</p>
    </div>
  );
}
