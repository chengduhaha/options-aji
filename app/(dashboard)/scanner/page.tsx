"use client";

import Link from "next/link";
import { useState } from "react";
import { ScanLine, Activity, Zap } from "lucide-react";
import { clsx } from "clsx";

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
  delta: number | null;
};

const PRESETS = [
  ["high_vol_oi", "高 Vol/OI", "成交量远超 OI 的异动合约"],
  ["high_iv_rank", "高 IV Rank", "IV 处于历史高位，适合卖方"],
  ["low_iv_rank", "低 IV Rank", "IV 处于历史低位，适合买方"],
  ["otp", "OTP 近 ATM", "Delta 0.2~0.35 的近月合约"],
] as const;

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
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
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
      <header className="px-5 py-4 border-b border-glass-border glass flex-shrink-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">期权扫描器</h1>
            <p className="text-[11px] text-muted">监���自选股列表的异常合约活动</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(([id, label, desc]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreset(id)}
              className={clsx(
                "text-[11px] px-3 py-1.5 rounded-[8px] border transition-all",
                preset === id
                  ? "border-primary text-primary bg-primary/10 shadow-sm"
                  : "border-border2 text-muted hover:text-foreground hover:border-primary/30",
              )}
              title={desc}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-[12px] bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold px-4 py-1.5 rounded-[8px] disabled:opacity-50 hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            {loading ? (
              <><Activity className="w-3.5 h-3.5 animate-spin" /> 扫描中...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> 运行扫描</>
            )}
          </button>
          {meta && (
            <span className="text-[10px] text-muted font-mono">
              {meta.count} 条结果 · {meta.ms.toFixed(0)}ms
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {rows.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted gap-3">
            <ScanLine className="w-10 h-10 opacity-30" />
            <p className="text-[13px]">点击上方「运行扫描」获取结果</p>
            <p className="text-[10px]">扫描范围为 {meta ? "已加载" : "SPY/QQQ/AAPL/NVDA/TSLA/AMZN/MSFT/META/GOOGL/AMD"} 等自选股</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="p-5">
            <div className="bg-glass border border-glass-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-glass-border text-muted">
                    <th className="text-left px-4 py-2.5 font-semibold">标的</th>
                    <th className="text-left px-4 py-2.5 font-semibold">类型</th>
                    <th className="text-right px-4 py-2.5 font-semibold">行权价</th>
                    <th className="text-left px-4 py-2.5 font-semibold">到期</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Vol</th>
                    <th className="text-right px-4 py-2.5 font-semibold">OI</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Vol/OI</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Delta</th>
                    <th className="text-right px-4 py-2.5 font-semibold">IV Rank¹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {rows.map((r, i) => (
                    <tr key={`${r.symbol}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2">
                        <Link href={`/stock/${r.symbol}`} className="font-mono font-semibold text-primary hover:underline">
                          {r.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        <span className={clsx(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          r.option_type === "call" ? "bg-green/20 text-green" : "bg-red/20 text-red",
                        )}>
                          {r.option_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">${r.strike.toFixed(1)}</td>
                      <td className="px-4 py-2 text-muted font-mono">{r.expiration}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.volume.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.openInterest.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-text">
                        {r.volOiRatio.toFixed(1)}x
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-blue">
                        {r.delta != null ? r.delta.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {r.ivRankProxy != null ? (
                          <span className={r.ivRankProxy >= 60 ? "text-red" : r.ivRankProxy <= 30 ? "text-green" : "text-text"}>
                            {r.ivRankProxy}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted mt-3">
              ¹ IV Rank 基于 HV 波动代理，与交易所口径可能不同。数据刷新约 15 分钟。
            </p>
          </div>
        )}

        {loading && rows.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted text-[13px]">
            <Activity className="w-4 h-4 animate-spin mr-2" /> 扫描中...
          </div>
        )}
      </div>
    </div>
  );
}