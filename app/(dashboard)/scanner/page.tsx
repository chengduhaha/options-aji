"use client";

import Link from "next/link";
import { useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type ScanRow = {
  symbol: string;
  option_type: string;
  strike: number;
  expiration: string;
  volume: number;
  openInterest: number;
  volOiRatio: number;
  ivRankProxy: number | null;
};

export default function ScannerPage() {
  const [preset, setPreset] = useState("high_vol_oi");
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [meta, setMeta] = useState<{ ms: number; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scanner/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({ preset, min_volume: 300, vol_oi_ratio: 3 }),
      });
      if (!res.ok) return;
      const j = (await res.json()) as { results?: ScanRow[]; duration_ms?: number; count?: number };
      setRows(j.results ?? []);
      setMeta({ ms: j.duration_ms ?? 0, count: j.count ?? 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-5 py-3 border-b border-border2 bg-panel2 flex-shrink-0 space-y-3">
        <h1 className="text-lg font-semibold">期权扫描器</h1>
        <div className="flex flex-wrap gap-2 items-center">
          {[
            ["high_vol_oi", "高 Vol/OI"],
            ["high_iv_rank", "高 IV Rank"],
            ["low_iv_rank", "低 IV Rank"],
            ["otp", "高 Gamma 近 ATM (启发式)"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreset(id)}
              className={`text-[11px] px-2 py-1 rounded-[6px] border ${
                preset === id ? "border-gold text-gold" : "border-border2 text-muted"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={run}
            className="ml-2 text-[12px] bg-gold text-bg font-semibold px-3 py-1.5 rounded-[8px] disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "扫描中…" : "运行扫描"}
          </button>
          {meta && (
            <span className="text-[11px] text-muted">
              {meta.count} 条 · {meta.ms.toFixed(0)} ms
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-auto p-5">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="text-left text-muted border-b border-border2">
              <th className="py-2">标的</th>
              <th className="py-2">类型</th>
              <th className="py-2">Strike</th>
              <th className="py-2">到期</th>
              <th className="py-2">Vol</th>
              <th className="py-2">OI</th>
              <th className="py-2">Vol/OI</th>
              <th className="py-2">IV Rank¹</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2">
            {rows.map((r, i) => (
              <tr key={`${r.symbol}-${i}`}>
                <td className="py-1">
                  <Link href={`/stock/${r.symbol}`} className="text-gold hover:underline">
                    {r.symbol}
                  </Link>
                </td>
                <td>{r.option_type}</td>
                <td>{r.strike}</td>
                <td className="text-muted">{r.expiration}</td>
                <td>{r.volume}</td>
                <td>{r.openInterest}</td>
                <td>{r.volOiRatio.toFixed(2)}</td>
                <td>{r.ivRankProxy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !loading && (
          <div className="text-center text-muted py-12">点击「运行扫描」获取结果</div>
        )}
        <p className="text-[10px] text-muted mt-4">¹ IV Rank 为 HV 代理，与交易所口径可能不同。</p>
      </div>
    </div>
  );
}
