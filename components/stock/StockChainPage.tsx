"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface ChainPayload {
  symbol: string;
  expiration?: string;
  expirations?: string[];
  underlyingPrice?: number | null;
  calls?: Record<string, unknown>[];
  puts?: Record<string, unknown>[];
  error?: string;
}

export default function StockChainPage({ symbol }: { symbol: string }) {
  const [exp, setExp] = useState<string | null>(null);
  const [data, setData] = useState<ChainPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qs = exp ? `?expiration=${encodeURIComponent(exp)}` : "";
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/chain${qs}`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as ChainPayload;
      if (!cancelled) {
        setData(j);
        if (!exp && j.expirations?.length) setExp(j.expirations[0]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, exp]);

  const spot = data?.underlyingPrice ?? 0;

  const strikes = useMemo(() => {
    const c = data?.calls ?? [];
    const p = data?.puts ?? [];
    const strikeSet = new Set<number>();
    for (const row of c) {
      const k = row.strike;
      if (typeof k === "number") strikeSet.add(k);
    }
    for (const row of p) {
      const k = row.strike;
      if (typeof k === "number") strikeSet.add(k);
    }
    return Array.from(strikeSet).sort((a, b) => a - b);
  }, [data]);

  const byStrike = (rows: Record<string, unknown>[]) => {
    const m = new Map<number, Record<string, unknown>>();
    for (const r of rows) {
      const k = r.strike;
      if (typeof k === "number") m.set(k, r);
    }
    return m;
  };

  const callsMap = useMemo(() => byStrike(data?.calls ?? []), [data]);
  const putsMap = useMemo(() => byStrike(data?.puts ?? []), [data]);

  if (data?.error) {
    return (
      <div className="p-5 text-red text-[13px]">期权链加载失败：{String(data.error)}</div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[12px] text-muted">到期日</span>
        <select
          value={exp ?? ""}
          onChange={(e) => setExp(e.target.value || null)}
          className="bg-panel border border-border2 text-text text-[12px] px-2 py-1.5 rounded-[6px]"
        >
          {(data?.expirations ?? []).map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        {spot > 0 && (
          <span className="text-[12px] text-muted font-mono">现货 ~ {spot.toFixed(2)}</span>
        )}
      </div>

      <div className="overflow-x-auto border border-border2 rounded-[10px]">
        <table className="w-full text-[11px] min-w-[720px]">
          <thead>
            <tr className="text-muted uppercase tracking-wider border-b border-border2">
              <th className="text-right py-2 px-2">Call Vol</th>
              <th className="text-right py-2 px-2">Call OI</th>
              <th className="text-right py-2 px-2">Call IV</th>
              <th className="text-center py-2 px-2 text-gold">Strike</th>
              <th className="text-right py-2 px-2">Put IV</th>
              <th className="text-right py-2 px-2">Put OI</th>
              <th className="text-right py-2 px-2">Put Vol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2 font-mono">
            {strikes.map((k) => {
              const c = callsMap.get(k);
              const p = putsMap.get(k);
              const atm = spot > 0 && Math.abs(k - spot) < spot * 0.02;
              return (
                <tr key={k} className={clsx(atm && "bg-gold-dim/40")}>
                  <td className="text-right text-green py-1 px-2">{fmtNum(c?.volume)}</td>
                  <td className="text-right py-1 px-2">{fmtNum(c?.openInterest)}</td>
                  <td className="text-right py-1 px-2">{fmtIv(c?.impliedVolatility)}</td>
                  <td className="text-center text-text font-bold py-1 px-2">{k.toFixed(0)}</td>
                  <td className="text-right py-1 px-2">{fmtIv(p?.impliedVolatility)}</td>
                  <td className="text-right py-1 px-2">{fmtNum(p?.openInterest)}</td>
                  <td className="text-right text-red py-1 px-2">{fmtNum(p?.volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtNum(v: unknown): string {
  if (typeof v !== "number") return "—";
  return v.toLocaleString();
}

function fmtIv(v: unknown): string {
  if (typeof v !== "number") return "—";
  return `${(v * 100).toFixed(1)}%`;
}
