/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const EMPTY_HINT =
  "后端返回空列表：请确认 FastAPI 已设置 FMP_API_KEY，并已触发同步任务（scheduler），以便写入缓存或实时请求 FMP。";
const PROXY_HINT =
  "无法连接后端 API：若在 Vercel 部署，请在项目环境变量中设置 OPTIONS_AJI_BACKEND_URL 为公网可达的 FastAPI 地址（不能使用本机 localhost）。";

export default function IndicesPage() {
  const [indices, setIndices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    api.market
      .indices()
      .then((d: any) => setIndices(d.indices || []))
      .catch((err: unknown) => {
        setIndices([]);
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-text">指数行情</h1>

      {loading ? (
        <div className="text-center text-muted py-16">加载中...</div>
      ) : loadError ? (
        <div className="bg-panel2 border border-border2 rounded-xl p-6 text-muted text-sm space-y-2">
          <p className="text-red-400 font-medium">加载失败</p>
          <p className="font-mono text-[11px] break-all">{loadError}</p>
          <p className="text-[12px] text-muted pt-1">{PROXY_HINT}</p>
        </div>
      ) : indices.length === 0 ? (
        <div className="bg-panel2 border border-border2 rounded-xl p-6 text-muted text-sm">{EMPTY_HINT}</div>
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
