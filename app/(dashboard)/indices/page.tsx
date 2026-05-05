"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function IndicesPage() {
  const [indices, setIndices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.market.indices()
      .then((d: any) => setIndices(d.indices || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-text">指数行情</h1>

      {loading ? (
        <div className="text-center text-muted py-16">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {indices.map((idx: any, i: number) => {
            const pct = idx.changesPercentage ?? idx.changePercent ?? 0;
            const positive = Number(pct) >= 0;
            const Icon = Number(pct) > 0 ? TrendingUp : Number(pct) < 0 ? TrendingDown : Minus;
            return (
              <div key={i} className="bg-panel2 border border-border2 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] text-muted truncate">{idx.name || idx.symbol}</div>
                    <div className="text-lg font-bold text-text mt-0.5">
                      {idx.price != null ? Number(idx.price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </div>
                  </div>
                  <Icon className={`w-4 h-4 mt-1 ${positive ? "text-green-400" : "text-red-400"}`} />
                </div>
                <div className={`text-[12px] font-semibold mt-1 ${positive ? "text-green-400" : "text-red-400"}`}>
                  {positive ? "+" : ""}{Number(pct).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
