"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import type {
  OptionsGexProfileContract,
  StockChainAnalysisContract,
  StockChainAnalysisStrikeRowContract,
  StockChainLegAnalysisContract,
} from "@/lib/contracts";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

const HEATMAP_MAX_STRIKES = 48;

type GreekCaps = {
  absDelta: number;
  gamma: number;
  absTheta: number;
  vega: number;
};

type OiWallMeta = { callStrike: number | null; putStrike: number | null };

function sampleStrikesAroundSpot(
  rows: StockChainAnalysisStrikeRowContract[],
  spot: number,
  maxRows: number,
): StockChainAnalysisStrikeRowContract[] {
  if (rows.length <= maxRows) return rows;
  if (spot <= 0) return rows.slice(0, maxRows);
  const sorted = [...rows].sort((a, b) => a.strike - b.strike);
  let bestIdx = 0;
  let bestDist = Infinity;
  sorted.forEach((r, i) => {
    const d = Math.abs(r.strike - spot);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  });
  const half = Math.floor(maxRows / 2);
  const start = Math.max(0, Math.min(bestIdx - half, sorted.length - maxRows));
  return sorted.slice(start, start + maxRows);
}

function computeOiWalls(rows: StockChainAnalysisStrikeRowContract[]): OiWallMeta {
  let callStrike: number | null = null;
  let putStrike: number | null = null;
  let bestCallOi = -1;
  let bestPutOi = -1;
  for (const r of rows) {
    const coi = r.call?.openInterest;
    if (typeof coi === "number" && coi > 0 && coi > bestCallOi) {
      bestCallOi = coi;
      callStrike = r.strike;
    }
    const poi = r.put?.openInterest;
    if (typeof poi === "number" && poi > 0 && poi > bestPutOi) {
      bestPutOi = poi;
      putStrike = r.strike;
    }
  }
  if (bestCallOi < 0) callStrike = null;
  if (bestPutOi < 0) putStrike = null;
  return { callStrike, putStrike };
}

function nearestAtmDistance(rows: StockChainAnalysisStrikeRowContract[], spot: number): number {
  if (rows.length === 0 || spot <= 0) return Infinity;
  return rows.reduce((m, r) => Math.min(m, Math.abs(r.strike - spot)), Infinity);
}

export default function StockChainPage({ symbol }: { symbol: string }) {
  const [exp, setExp] = useState<string | null>(null);
  const [data, setData] = useState<StockChainAnalysisContract | null>(null);
  const [gex, setGex] = useState<OptionsGexProfileContract | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qs = exp ? `?expiration=${encodeURIComponent(exp)}` : "";
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/chain-analysis${qs}`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as StockChainAnalysisContract;
      if (cancelled) return;
      setData(j);
      if (!exp && j.expirations?.length) setExp(j.expirations[0]);
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, exp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/options/gex/${encodeURIComponent(symbol)}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as OptionsGexProfileContract;
        if (!cancelled) setGex(j);
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const spot = data?.underlyingPrice ?? 0;

  const strikesSorted = useMemo(
    () => [...(data?.strikes ?? [])].sort((a, b) => a.strike - b.strike),
    [data?.strikes],
  );

  const oiWalls = useMemo(() => computeOiWalls(strikesSorted), [strikesSorted]);

  const atmBandDist = useMemo(() => nearestAtmDistance(strikesSorted, spot), [strikesSorted, spot]);

  const heatStripRows = useMemo(
    () => sampleStrikesAroundSpot(strikesSorted, spot, HEATMAP_MAX_STRIKES),
    [strikesSorted, spot],
  );

  const greekCaps = useMemo((): GreekCaps => {
    let absDelta = 1e-9;
    let gamma = 1e-9;
    let absTheta = 1e-9;
    let vega = 1e-9;
    for (const row of strikesSorted) {
      for (const raw of [row.call, row.put]) {
        if (!raw) continue;
        const d = typeof raw.delta === "number" ? raw.delta : 0;
        const g = typeof raw.gamma === "number" ? Math.abs(raw.gamma) : 0;
        const t = typeof raw.theta === "number" ? Math.abs(raw.theta) : 0;
        const v = typeof raw.vega === "number" ? Math.abs(raw.vega) : 0;
        absDelta = Math.max(absDelta, Math.abs(d));
        gamma = Math.max(gamma, g + 1e-12);
        absTheta = Math.max(absTheta, t + 1e-12);
        vega = Math.max(vega, v + 1e-12);
      }
    }
    return { absDelta, gamma, absTheta, vega };
  }, [strikesSorted]);

  const iconFor = (kind: string) => {
    if (kind === "parity") return "💰";
    if (kind === "oi_spike") return "🔥";
    if (kind === "iv_skew") return "⚡";
    return "•";
  };

  const legLiquidityTone = (liq?: string): string => {
    if (liq === "high") return "text-green font-medium";
    if (liq === "low") return "text-red/90";
    return "";
  };

  const stratHref = (row: StockChainAnalysisStrikeRowContract, ot: "call" | "put"): string => {
    const leg = ot === "call" ? row.call : row.put;
    const expiry = exp ?? data?.expiration ?? "";
    const qs = new URLSearchParams();
    if (expiry) qs.set("expiry", expiry.slice(0, 10));
    qs.set("type", ot);
    qs.set("strike", String(row.strike));
    if (spot > 0) qs.set("spot", spot.toFixed(4));

    let midNum: number | null = null;
    if (leg) {
      if (typeof leg.midpoint === "number" && leg.midpoint > 0) midNum = leg.midpoint;
      else if (
        typeof leg.bid === "number" &&
        typeof leg.ask === "number" &&
        leg.ask > 0 &&
        leg.ask >= leg.bid
      ) {
        midNum = (leg.bid + leg.ask) / 2;
      }
      if (typeof leg.impliedVolatilityPct === "number" && leg.impliedVolatilityPct > 0) {
        qs.set("ivpct", leg.impliedVolatilityPct.toFixed(4));
      }
    }
    if (midNum !== null && midNum > 0) qs.set("premium", midNum.toFixed(4));

    return `/stock/${encodeURIComponent(symbol)}/strategy?${qs.toString()}`;
  };

  if (data?.error) {
    return (
      <div className="p-5 text-red text-[13px] space-y-1">
        <div>链上分析不可用：{String(data.error)}</div>
        <div className="text-muted">
          （若暂无 Massive DB 快照，会使用 Yahoo 链路；仍会尝试平价与流动性估算。）
        </div>
      </div>
    );
  }

  const expMismatchGex =
    gex &&
    !gex.error &&
    gex.expiration &&
    exp &&
    String(gex.expiration).slice(0, 10) !== String(exp).slice(0, 10);

  return (
    <div className="p-5 space-y-4">
      <header className="flex flex-wrap gap-3 items-end">
        <div>
          <span className="text-[11px] text-muted block mb-1">到期日</span>
          <select
            value={exp ?? ""}
            onChange={(e) => setExp(e.target.value || null)}
            className="bg-panel border border-border2 text-text text-[12px] px-2 py-1.5 rounded-[6px] min-w-[140px]"
          >
            {(data?.expirations ?? []).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        {spot > 0 && (
          <div className="text-[11px] text-muted">
            现货参考 <span className="font-mono text-text">{spot.toFixed(2)}</span>
          </div>
        )}
        {data?.ivMedian != null && (
          <div className="text-[11px] text-muted">
            IV 中位 <span className="font-mono text-gold">{Number(data.ivMedian).toFixed(2)}%</span>
          </div>
        )}
        <div className="text-[11px] text-muted">
          数据源{" "}
          {data?.source === "database_snapshots" ? "DB Snapshots (Massive 同步)" : "Yahoo Chain"}
        </div>
      </header>

      <section className="bg-panel border border-border2 rounded-[10px] p-3 space-y-2 text-[11px] text-muted">
        <div className="text-[12px] font-semibold text-gold">行权分布 · 墙位参考</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
          {oiWalls.callStrike != null && (
            <span>
              OI Call wall{" "}
              <span className="text-green">{oiWalls.callStrike.toFixed(0)}</span>（当前到期链）
            </span>
          )}
          {oiWalls.putStrike != null && (
            <span>
              OI Put wall{" "}
              <span className="text-red">{oiWalls.putStrike.toFixed(0)}</span>（当前到期链）
            </span>
          )}
          {gex && !gex.error && typeof gex.callWall === "number" && typeof gex.putWall === "number" && (
            <span className="text-text/90">
              GEX Call/Put wall{" "}
              <span className="text-green">{gex.callWall.toFixed(0)}</span> /{" "}
              <span className="text-red">{gex.putWall.toFixed(0)}</span>
              {gex.expiration ? (
                <span className="text-muted"> · 近月 {String(gex.expiration).slice(0, 10)}</span>
              ) : null}
            </span>
          )}
          {gex?.error ? <span className="text-muted">GEX 暂不可用（{gex.error}）</span> : null}
        </div>
        {expMismatchGex ? (
          <div className="text-[10px] text-amber-300/90">
            提示：下方表格到期日与 GEX 近月不一致时，墙位仅作参考，请以当前到期 OI 墙为主。
          </div>
        ) : null}
        <div className="text-[10px] leading-relaxed">
          ATM 行高亮：最接近现价的行权 + ±2% 价格带；Wall 行左侧金边标示（OI 墙 / GEX 墙）。
        </div>
      </section>

      {strikesSorted.length > 0 && (
        <ChainLiquidityHeatmap rows={heatStripRows} totalStrikes={strikesSorted.length} spot={spot} />
      )}

      {data?.summary ? (
        <div className="flex flex-wrap gap-4 text-[11px] text-muted bg-panel border border-border2 rounded-[8px] px-3 py-2 font-mono">
          <span>Call OI {fmtNum(data.summary.totalCallOi)}</span>
          <span>Put OI {fmtNum(data.summary.totalPutOi)}</span>
          {typeof data.summary.putCallOiRatio === "number" && (
            <span>PCR(OI) {data.summary.putCallOiRatio.toFixed(3)}</span>
          )}
        </div>
      ) : null}

      {data?.highlights && data.highlights.length > 0 ? (
        <section className="bg-panel border border-border2 rounded-[10px] p-3 space-y-1.5">
          <div className="text-[12px] font-semibold text-gold">链上分析</div>
          <ul className="space-y-1 max-h-40 overflow-y-auto text-[12px] text-text/95">
            {data.highlights.map((h, i) => (
              <li key={`${h.type}-${h.strike}-${i}`} className="flex gap-2">
                <span className="flex-shrink-0">{iconFor(h.type)}</span>
                <span>
                  {symbol} @{h.strike} {h.side ? `${h.side} · ` : ""}
                  {h.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="text-[11px] text-muted space-y-0.5">
        <div>平价：💰；🔥 OI 环比突出；⚡ IV 偏离中位数。</div>
        <div>Greeks 色条：<span className="font-mono">Δ</span> 居中绿/红；Γ/Θ/ν 相对本表最大值缩放。</div>
        <div>
          行权旁 <span className="text-gold">C/P</span> 链入本地策略构建器（预填 Mid / IV）。
        </div>
      </div>

      <div className="overflow-x-auto border border-border2 rounded-[10px]">
        <table className="w-full text-[10px] min-w-[1320px]">
          <thead>
            <tr className="text-muted uppercase tracking-wider border-b border-border2">
              <th className="text-right py-2 px-1">Vol</th>
              <th className="text-right py-2 px-1">OI</th>
              <th className="text-right py-2 px-1">IV%</th>
              <th className="text-center py-2 px-1 w-[88px]" title="Greeks visualization">
                Call ΔΓΘν
              </th>
              <th className="text-center py-2 px-2 text-gold">Strike · 策略</th>
              <th className="text-center py-2 px-1 w-[88px]">Put ΔΓΘν</th>
              <th className="text-right py-2 px-1">IV%</th>
              <th className="text-right py-2 px-1">OI</th>
              <th className="text-right py-2 px-1">Vol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2 font-mono">
            {strikesSorted.map((row) => {
              const c = row.call;
              const p = row.put;
              const dist = spot > 0 ? Math.abs(row.strike - spot) : Infinity;
              const atmNear =
                spot > 0 && (dist <= spot * 0.02 || (atmBandDist < Infinity && dist <= atmBandDist + 1e-6));
              const parityRow = row.parity.flag;
              const gexCall =
                gex && !gex.error && typeof gex.callWall === "number"
                  ? Math.abs(row.strike - gex.callWall) < 0.51
                  : false;
              const gexPut =
                gex && !gex.error && typeof gex.putWall === "number"
                  ? Math.abs(row.strike - gex.putWall) < 0.51
                  : false;
              const oiCallWallRow = oiWalls.callStrike != null && row.strike === oiWalls.callStrike;
              const oiPutWallRow = oiWalls.putStrike != null && row.strike === oiWalls.putStrike;
              const wallRow = oiCallWallRow || oiPutWallRow || gexCall || gexPut;
              return (
                <tr
                  key={row.strike}
                  className={clsx(
                    atmNear && "bg-[rgba(212,175,55,0.12)]",
                    parityRow && "ring-1 ring-gold/25",
                    wallRow && "border-l-2 border-l-gold",
                  )}
                >
                  <td className={clsx("text-right py-1 px-1", legLiquidityTone(c?.liquidity))}>
                    {fmtNum(c?.dayVolume)}
                    {markersForLeg(c)}
                  </td>
                  <td className="text-right py-1 px-1">
                    {fmtNum(c?.openInterest)}
                    {c?.oiSpike ? " 🔥" : ""}
                  </td>
                  <td className="text-right py-1 px-1">{fmtPctCol(c?.impliedVolatilityPct)}</td>
                  <td className="py-1 px-1 align-middle">
                    <GreekBars leg={c} caps={greekCaps} />
                  </td>
                  <td className="text-center py-1 px-2 align-middle">
                    <div className="font-bold text-[11px] text-text">{row.strike.toFixed(0)}</div>
                    {parityRow ? <span className="text-[9px] text-gold">💰</span> : null}
                    <div className="flex justify-center gap-1 flex-wrap mt-0.5">
                      {oiCallWallRow ? (
                        <span className="text-[8px] px-1 rounded bg-green/15 text-green">OI C</span>
                      ) : null}
                      {oiPutWallRow ? (
                        <span className="text-[8px] px-1 rounded bg-red/15 text-red">OI P</span>
                      ) : null}
                      {gexCall ? (
                        <span className="text-[8px] px-1 rounded border border-gold/40 text-gold">
                          GEX C
                        </span>
                      ) : null}
                      {gexPut ? (
                        <span className="text-[8px] px-1 rounded border border-gold/40 text-gold">
                          GEX P
                        </span>
                      ) : null}
                    </div>
                    <div className="flex justify-center gap-1.5 mt-1">
                      <Link
                        href={stratHref(row, "call")}
                        prefetch={false}
                        className="px-1.5 py-0.5 rounded border border-green/35 text-green text-[9px] uppercase hover:bg-green/10"
                      >
                        C
                      </Link>
                      <Link
                        href={stratHref(row, "put")}
                        prefetch={false}
                        className="px-1.5 py-0.5 rounded border border-red/35 text-red text-[9px] uppercase hover:bg-red/10"
                      >
                        P
                      </Link>
                    </div>
                  </td>
                  <td className="py-1 px-1 align-middle">
                    <GreekBars leg={p} caps={greekCaps} />
                  </td>
                  <td className="text-right py-1 px-1">{fmtPctCol(p?.impliedVolatilityPct)}</td>
                  <td className="text-right py-1 px-1">
                    {fmtNum(p?.openInterest)}
                    {p?.oiSpike ? " 🔥" : ""}
                  </td>
                  <td className={clsx("text-right py-1 px-1", legLiquidityTone(p?.liquidity))}>
                    {fmtNum(p?.dayVolume)}
                    {markersForLeg(p)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChainLiquidityHeatmap({
  rows,
  totalStrikes,
  spot,
}: {
  rows: StockChainAnalysisStrikeRowContract[];
  totalStrikes: number;
  spot: number;
}) {
  const maxCallVol = rows.reduce(
    (m, r) => Math.max(m, typeof r.call?.dayVolume === "number" ? r.call.dayVolume : 0),
    0,
  );
  const maxPutVol = rows.reduce(
    (m, r) => Math.max(m, typeof r.put?.dayVolume === "number" ? r.put.dayVolume : 0),
    0,
  );
  const maxCallOi = rows.reduce(
    (m, r) => Math.max(m, typeof r.call?.openInterest === "number" ? r.call.openInterest : 0),
    0,
  );
  const maxPutOi = rows.reduce(
    (m, r) => Math.max(m, typeof r.put?.openInterest === "number" ? r.put.openInterest : 0),
    0,
  );

  const labels: Array<{ key: string; label: string; tone: "call" | "put"; max: number; getter: (row: StockChainAnalysisStrikeRowContract) => number }> = [
    {
      key: "cv",
      label: "Call Vol",
      tone: "call",
      max: maxCallVol,
      getter: (row) => (typeof row.call?.dayVolume === "number" ? row.call.dayVolume : 0),
    },
    {
      key: "pv",
      label: "Put Vol",
      tone: "put",
      max: maxPutVol,
      getter: (row) => (typeof row.put?.dayVolume === "number" ? row.put.dayVolume : 0),
    },
    {
      key: "coi",
      label: "Call OI",
      tone: "call",
      max: maxCallOi,
      getter: (row) => (typeof row.call?.openInterest === "number" ? row.call.openInterest : 0),
    },
    {
      key: "poi",
      label: "Put OI",
      tone: "put",
      max: maxPutOi,
      getter: (row) => (typeof row.put?.openInterest === "number" ? row.put.openInterest : 0),
    },
  ];

  const truncated = totalStrikes > HEATMAP_MAX_STRIKES;

  return (
    <section className="bg-panel border border-border2 rounded-[10px] p-3 space-y-2 overflow-x-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[12px] font-semibold text-gold">成交 / 持仓热力（相对本带内最大值）</div>
        <div className="text-[10px] text-muted font-mono">
          采样 {rows.length} / {totalStrikes} 行权
          {truncated ? `（ATM ± 窗口，上限 ${HEATMAP_MAX_STRIKES}）` : ""}
        </div>
      </div>
      <div className="min-w-[320px] space-y-1">
        {labels.map((rowDef) => (
          <div key={rowDef.key} className="flex items-center gap-2">
            <span
              className={clsx(
                "w-[56px] flex-shrink-0 text-[9px] uppercase text-right font-mono",
                rowDef.tone === "call" ? "text-green/90" : "text-red/90",
              )}
            >
              {rowDef.label}
            </span>
            <div className="flex flex-1 gap-px rounded overflow-hidden border border-border2/80 bg-panel2">
              {rows.map((r) => {
                const v = rowDef.getter(r);
                const frac = rowDef.max > 0 ? Math.min(1, v / rowDef.max) : 0;
                const alpha = 0.12 + frac * 0.78;
                const isAtm = spot > 0 && Math.abs(r.strike - spot) <= spot * 0.02;
                const bg =
                  rowDef.tone === "call"
                    ? `rgba(0, 212, 170, ${alpha})`
                    : `rgba(255, 107, 107, ${alpha})`;
                return (
                  <div
                    key={`${rowDef.key}-${r.strike}`}
                    className="flex-1 min-w-0 h-[14px] relative group"
                    style={{ backgroundColor: bg }}
                    title={`K ${r.strike} · ${rowDef.label} ${v.toLocaleString()}`}
                  >
                    {isAtm ? (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gold/90 pointer-events-none" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[9px] text-muted font-mono">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 bg-green/60 rounded-sm" /> Call
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 bg-red/60 rounded-sm" /> Put
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 h-0.5 bg-gold" /> ATM 带 (~±2%)
        </span>
      </div>
    </section>
  );
}

function GreekBars({
  leg,
  caps,
}: {
  leg: StockChainLegAnalysisContract | null | undefined;
  caps: GreekCaps;
}) {
  if (!leg) return <span className="text-muted">—</span>;

  const d = typeof leg.delta === "number" ? leg.delta : null;
  const g = typeof leg.gamma === "number" ? leg.gamma : null;
  const th = typeof leg.theta === "number" ? leg.theta : null;
  const v = typeof leg.vega === "number" ? leg.vega : null;

  const deltaFrac = d === null ? 0 : Math.min(1, Math.abs(d) / (caps.absDelta * 2 || 1e-9));
  const gammaFrac = g === null ? 0 : Math.min(1, Math.abs(g) / caps.gamma);
  const thetaFrac = th === null ? 0 : Math.min(1, Math.abs(th) / caps.absTheta);
  const vegaFrac = v === null ? 0 : Math.min(1, Math.abs(v) / caps.vega);

  return (
    <div className="space-y-[3px]" title={tooltipGreeks(leg)}>
      <Bipolar label="Δ" frac={deltaFrac} positive={typeof d === "number" ? d >= 0 : true} />
      <MonoBar label="Γ" frac={gammaFrac} tone="purple" />
      <MonoBar label="Θ" frac={thetaFrac} tone="amber" />
      <MonoBar label="ν" frac={vegaFrac} tone="blue" />
    </div>
  );
}

function tooltipGreeks(l: StockChainLegAnalysisContract): string {
  const parts: string[] = [];
  const pick = (lab: string, x: number | null | undefined, d: number): void => {
    if (typeof x !== "number" || Number.isNaN(x)) return;
    parts.push(`${lab}:${x.toFixed(d)}`);
  };
  pick("Δ", l.delta ?? null, 3);
  pick("Γ", l.gamma ?? null, 6);
  pick("Θ", l.theta ?? null, 4);
  pick("ν", l.vega ?? null, 4);
  return parts.join(" ") || "无 Greeks";
}

function Bipolar({
  label,
  frac,
  positive,
}: {
  label: string;
  frac: number;
  positive: boolean;
}) {
  const hue = positive ? "#00D4AA" : "#FF6B6B";
  const w = `${Math.round(frac * 50)}%`;
  return (
    <div className="flex items-center gap-0.5">
      <span className="w-2 text-[8px] text-muted flex-shrink-0">{label}</span>
      <div className="flex-1 h-[5px] bg-panel2 rounded-sm relative overflow-hidden border border-border2/40">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-text/20 z-10" />
        <div
          className="absolute top-0 bottom-0 rounded-sm"
          style={{
            ...(positive ? { left: "50%", width: w } : { right: "50%", width: w }),
            backgroundColor: hue,
            opacity: 0.82,
          }}
        />
      </div>
    </div>
  );
}

function MonoBar({
  label,
  frac,
  tone,
}: {
  label: string;
  frac: number;
  tone: "purple" | "amber" | "blue";
}) {
  const colors = {
    purple: "#C084FC",
    amber: "#FBBF24",
    blue: "#4A9EFF",
  } as const;
  return (
    <div className="flex items-center gap-0.5">
      <span className="w-2 text-[8px] text-muted flex-shrink-0">{label}</span>
      <div className="flex-1 h-[5px] bg-panel2 rounded-sm overflow-hidden border border-border2/40">
        <div
          className="h-full rounded-sm transition-all duration-150"
          style={{
            width: `${Math.round(frac * 100)}%`,
            backgroundColor: colors[tone],
            opacity: 0.82,
          }}
        />
      </div>
    </div>
  );
}

function markersForLeg(leg?: StockChainLegAnalysisContract | null): string {
  if (!leg) return "";
  let s = "";
  if (leg.ivSkewOutlier) s += " ⚡";
  return s;
}

function fmtPctCol(v?: number | null): string {
  if (typeof v !== "number") return "—";
  return `${v.toFixed(1)}%`;
}

function fmtNum(v?: number | null): string {
  if (typeof v !== "number") return "—";
  return v.toLocaleString();
}
