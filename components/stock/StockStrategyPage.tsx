"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type Idea = { id: string; title: string; note: string };

type StrategyLegUi = {
  side: "buy" | "sell";
  option_type: "call" | "put";
  strike: string;
  premium: string;
  contracts: string;
  days_to_expiry: string;
  iv: string;
};

function blankLeg(): StrategyLegUi {
  return {
    side: "buy",
    option_type: "call",
    strike: "",
    premium: "",
    contracts: "1",
    days_to_expiry: "30",
    iv: "35",
  };
}

function dteFromExpiry(isoYmd: string): number {
  const t = Date.parse(isoYmd.slice(0, 10));
  if (Number.isNaN(t)) return 30;
  const days = Math.ceil((t - Date.now()) / 86400000);
  return Math.max(1, days);
}

type EvaluateOut = {
  pnlBySpotPct?: Array<{ spotMovePct: number; spot: number; pnlAtExpiry: number }>;
  maxProfitScan?: number;
  maxLossScan?: number;
  breakevensApprox?: number[];
  netPremiumFlow?: number;
  greeksAtSpot?: { delta: number; gamma: number; vega: number; theta: number };
  disclaimer?: string;
};

export default function StockStrategyPage({ symbol }: { symbol: string }) {
  return (
    <Suspense
      fallback={
        <div className="p-5 text-muted text-[13px]">加载策略构建器…</div>
      }
    >
      <StrategyInner symbol={symbol} />
    </Suspense>
  );
}

function StrategyInner({ symbol }: { symbol: string }) {
  const sp = useSearchParams();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [spot, setSpot] = useState("");
  const [riskFreePct, setRiskFreePct] = useState("5.25");
  const [legs, setLegs] = useState<StrategyLegUi[]>([blankLeg()]);
  const [result, setResult] = useState<EvaluateOut | null>(null);
  const [evalErr, setEvalErr] = useState<string | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/strategy-ideas`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || c) return;
      const j = (await res.json()) as { ideas?: Idea[] };
      if (!c && Array.isArray(j.ideas)) setIdeas(j.ideas);
    })();
    return () => {
      c = true;
    };
  }, [symbol]);

  const urlAppliedRef = useRef(false);

  const loadQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/quote`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok) return;
      const j = (await res.json()) as { price?: number };
      if (typeof j.price === "number" && j.price > 0) setSpot(j.price.toFixed(2));
    } catch {
      /* ignore */
    }
  }, [symbol]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const spKey = useMemo(() => sp.toString(), [sp]);

  useEffect(() => {
    urlAppliedRef.current = false;
  }, [spKey]);

  useEffect(() => {
    if (urlAppliedRef.current) return;
    const ex = sp.get("expiry");
    const stk = parseFloat(sp.get("strike") || "");
    const typ = sp.get("type") === "put" ? "put" : "call";
    const premRaw = parseFloat(sp.get("premium") || "");
    const ivPct = parseFloat(sp.get("ivpct") || "");
    const spo = parseFloat(sp.get("spot") || "");

    if (!(ex && stk > 0)) return;

    if (spo > 0) setSpot(spo.toFixed(2));

    const dte = dteFromExpiry(ex);
    const premDefault = Math.max(0.05, stk * 0.001);
    const prem =
      Number.isFinite(premRaw) && premRaw > 0 ? premRaw : premDefault;
    const ivUi =
      Number.isFinite(ivPct) && ivPct > 0 ? ivPct.toFixed(2) : "35";

    setLegs([
      {
        side: "buy",
        option_type: typ,
        strike: stk.toFixed(2),
        premium: prem.toFixed(3),
        contracts: "1",
        days_to_expiry: String(dte),
        iv: ivUi,
      },
    ]);
    urlAppliedRef.current = true;
  }, [sp]);

  const parseIvToDecimal = (s: string): number => {
    const x = parseFloat(s.replace(",", "."));
    if (!Number.isFinite(x) || x <= 0) return 0.35;
    /* UI 通常为 IV% ，若误填小数则按小数处理 */
    if (x <= 1.05) return Math.max(0.05, Math.min(3.0, x));
    return Math.min(2.7, x / 100.0);
  };

  const runEvaluate = async () => {
    setEvalErr(null);
    setResult(null);
    const sNum = parseFloat(spot.replace(",", "."));
    if (!(sNum > 0)) {
      setEvalErr("请先填写现价 Spot（或等待行情载入）");
      return;
    }
    const rf = parseFloat(riskFreePct.replace(",", ".")) / 100.0;

    const bodyLegs = legs
      .map((lg) => {
        const strike = parseFloat(lg.strike.replace(",", "."));
        const prem = parseFloat(lg.premium.replace(",", "."));
        const ctr = parseInt(lg.contracts.replace(",", "."), 10);
        const dteDays = parseFloat(lg.days_to_expiry.replace(",", "."));
        if (!(strike > 0) || !(prem >= 0) || !(ctr > 0) || !(dteDays > 0)) return null;
        return {
          side: lg.side,
          option_type: lg.option_type,
          strike,
          premium: prem,
          contracts: ctr,
          days_to_expiry: dteDays,
          iv: parseIvToDecimal(lg.iv),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (!bodyLegs.length) {
      setEvalErr("请至少填写一条完整腿（行权价、权利金…）");
      return;
    }

    setLoadingEval(true);
    try {
      const res = await fetch("/api/strategy/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        cache: "no-store",
        body: JSON.stringify({
          symbol,
          spot: sNum,
          risk_free_rate: rf,
          legs: bodyLegs,
        }),
      });
      const j = (await res.json()) as EvaluateOut & { detail?: unknown };
      if (!res.ok) {
        throw new Error(typeof j.detail === "string" ? j.detail : "评估失败");
      }
      setResult(j as EvaluateOut);
    } catch (e: unknown) {
      setEvalErr(e instanceof Error ? e.message : "评估出错");
    } finally {
      setLoadingEval(false);
    }
  };

  const updateLeg = (idx: number, patch: Partial<StrategyLegUi>) => {
    setLegs((rows) =>
      rows.map((r, i) => {
        if (i !== idx) return r;
        return { ...r, ...patch };
      }),
    );
  };

  return (
    <div className="p-5 space-y-6">
      <h2 className="text-lg font-semibold text-text">策略构建与评估 · {symbol}</h2>

      <p className="text-[11px] text-muted leading-relaxed">
        可从「期权链」行权列的 <span className="text-gold">C/P</span> 链入本页自动预填单腿。<br />
        评估使用后端 Black–Scholes 近似（到期内在价值）；教育用途不构成投资建议。
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-panel border border-border2 rounded-[10px] p-4 space-y-3">
          <div className="text-[12px] font-semibold text-gold">参数</div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <label className="text-muted flex flex-col gap-1">
              现价 Spot
              <input
                value={spot}
                onChange={(e) => setSpot(e.target.value)}
                className="bg-panel2 border border-border2 rounded-[6px] px-2 py-1 font-mono text-text"
              />
            </label>
            <label className="text-muted flex flex-col gap-1">
              无风险利率 %
              <input
                value={riskFreePct}
                onChange={(e) => setRiskFreePct(e.target.value)}
                className="bg-panel2 border border-border2 rounded-[6px] px-2 py-1 font-mono text-text"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => loadQuote()}
            className="text-[11px] px-2 py-1 rounded-md border border-border2 text-muted"
          >
            重新拉行情
          </button>
        </div>

        <div className="bg-panel border border-border2 rounded-[10px] p-4 space-y-2">
          <div className="text-[12px] font-semibold text-gold">策略想法</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {ideas.map((x) => (
              <div key={x.id} className="rounded-[8px] border border-border2/70 px-2 py-1.5">
                <div className="text-gold text-[13px] font-medium">{x.title}</div>
                <p className="text-[12px] text-muted mt-0.5">{x.note}</p>
              </div>
            ))}
            {ideas.length === 0 && <div className="text-muted text-[12px]">暂无服务端建议条目</div>}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-gold flex-1">期权腿（多腿垂直价差）</div>
          <button
            type="button"
            onClick={() => setLegs([...legs, blankLeg()])}
            className="text-[11px] px-2 py-1 border border-border2 rounded-[6px] text-muted"
          >
            + 腿
          </button>
        </div>

        <div className="space-y-3">
          {legs.map((lg, idx) => (
            <div
              key={`leg-${idx}`}
              className="grid lg:grid-cols-12 gap-2 items-end border border-border2/60 rounded-[8px] p-3"
            >
              <select
                className="lg:col-span-1 bg-panel2 border border-border2 rounded-[6px] text-[11px] px-1 py-1.5 text-text"
                value={lg.side}
                onChange={(e) => updateLeg(idx, { side: e.target.value as "buy" | "sell" })}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <select
                className="lg:col-span-1 bg-panel2 border border-border2 rounded-[6px] text-[11px] px-1 py-1.5 text-text"
                value={lg.option_type}
                onChange={(e) =>
                  updateLeg(idx, { option_type: e.target.value as "call" | "put" })
                }
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
              {(
                [
                  ["Strike", lg.strike, (v: string) => updateLeg(idx, { strike: v })],
                  ["Premium ", lg.premium, (v: string) => updateLeg(idx, { premium: v })],
                  ["Contracts", lg.contracts, (v: string) => updateLeg(idx, { contracts: v })],
                  ["DTE 天", lg.days_to_expiry, (v: string) => updateLeg(idx, { days_to_expiry: v })],
                  ["IV %", lg.iv, (v: string) => updateLeg(idx, { iv: v })],
                ] as const
              ).map(([label, val, setter]) => (
                <label
                  key={`${idx}-${label}`}
                  className="lg:col-span-2 text-[10px] text-muted flex flex-col gap-0.5"
                >
                  {label}
                  <input
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    className="bg-panel2 border border-border2 rounded-[6px] px-2 py-1 font-mono text-[11px] text-text"
                  />
                </label>
              ))}
              <div className="lg:col-span-1 flex justify-end">
                {legs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLegs(legs.filter((_, j) => j !== idx))}
                    className="text-[11px] text-red px-2"
                  >
                    删
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => runEvaluate()}
          disabled={loadingEval}
          className="w-full mt-2 py-2 rounded-[8px] bg-gold/20 border border-gold/40 text-gold text-[13px] font-semibold disabled:opacity-45"
        >
          {loadingEval ? "评估中…" : "评估策略（后端 /api/strategy/evaluate）"}
        </button>

        {evalErr && (
          <div className="text-[12px] text-red border border-red/30 rounded-[8px] px-3 py-2">{evalErr}</div>
        )}
      </div>

      {result?.pnlBySpotPct && (
        <div className="bg-panel border border-border2 rounded-[10px] p-4 space-y-3 overflow-x-auto">
          <div className="text-[12px] font-semibold text-gold">到期 P/L 扫描摘要</div>
          <table className="w-full text-[11px] font-mono whitespace-nowrap">
            <thead>
              <tr className="text-muted border-b border-border2">
                <th className="text-left py-1 pr-3">Δ价%</th>
                <th className="text-right py-1 pr-3">假定标的价格</th>
                <th className="text-right py-1">PnL USD</th>
              </tr>
            </thead>
            <tbody>
              {result.pnlBySpotPct.map((row) => (
                <tr key={`${row.spotMovePct}`}>
                  <td className="py-0.5 pr-3">{row.spotMovePct}%</td>
                  <td className="py-0.5 pr-3 text-right">{row.spot.toFixed(2)}</td>
                  <td
                    className={
                      row.pnlAtExpiry >= 0 ? "text-right text-green" : "text-right text-red"
                    }
                  >
                    {row.pnlAtExpiry.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid sm:grid-cols-3 gap-2 text-[12px] text-muted">
            <div>
              Scan Max Profit≈{" "}
              <span className="text-green font-mono">{result.maxProfitScan?.toFixed(2)}</span>
            </div>
            <div>
              Scan Max Loss≈{" "}
              <span className="text-red font-mono">{result.maxLossScan?.toFixed(2)}</span>
            </div>
            <div className="font-mono">
              Net Premium Flow {result.netPremiumFlow?.toFixed(2)} USD (sign 卖方视角)
            </div>
          </div>

          {result.greeksAtSpot ? (
            <div className="text-[11px] text-muted font-mono pt-2 border-t border-border2 grid sm:grid-cols-4 gap-1">
              <span>Δ {result.greeksAtSpot.delta.toFixed(4)}</span>
              <span>Γ {result.greeksAtSpot.gamma.toFixed(5)}</span>
              <span>ν {result.greeksAtSpot.vega.toFixed(4)}</span>
              <span>Θ/day {result.greeksAtSpot.theta.toFixed(4)}</span>
            </div>
          ) : null}

          {!!result.breakevensApprox?.length && (
            <div className="text-[11px] text-muted">
              Break-even (~)：<span className="font-mono text-text">{result.breakevensApprox.join(", ")}</span>
            </div>
          )}

          {result.disclaimer && (
            <p className="text-[10px] text-muted italic pt-2">{result.disclaimer}</p>
          )}
        </div>
      )}
    </div>
  );
}
