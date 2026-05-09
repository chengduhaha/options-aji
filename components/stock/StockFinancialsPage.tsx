"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type StmtType = "income" | "balance" | "cashflow";
type PeriodType = "quarter" | "annual";

interface FinRow {
  date: string;
  [key: string]: unknown;
}

interface MetricsPayload {
  symbol: string;
  metrics: FinRow[];
  metrics_ttm: Record<string, unknown> | null;
  ratios_ttm: Record<string, unknown> | null;
  scores: Record<string, unknown> | null;
}

const STMT_TABS: { key: StmtType; label: string }[] = [
  { key: "income", label: "利润表" },
  { key: "balance", label: "资产负债表" },
  { key: "cashflow", label: "现金流" },
];

const LABEL_MAP: Record<string, string> = {
  date: "报告期",
  revenue: "营收",
  costOfRevenue: "营业成本",
  grossProfit: "毛利润",
  grossProfitRatio: "毛利率",
  researchAndDevelopmentExpenses: "研发费用",
  sellingGeneralAndAdministrativeExpenses: "销售管理费用",
  operatingExpenses: "营业费用",
  operatingIncome: "营业利润",
  operatingIncomeRatio: "营业利润率",
  netIncome: "净利润",
  netIncomeRatio: "净利润率",
  eps: "每股收益",
  epsdiluted: "摊薄每股收益",
  weightedAverageShsOut: "加权平均股数",
  ebitda: "EBITDA",
  ebitdaratio: "EBITDA率",
  totalAssets: "总资产",
  totalLiabilities: "总负债",
  totalEquity: "总权益",
  cashAndCashEquivalents: "现金及等价物",
  shortTermInvestments: "短期投资",
  longTermInvestments: "长期投资",
  netReceivables: "应收账款",
  inventory: "存货",
  propertyPlantEquipmentNet: "固定资产",
  goodwill: "商誉",
  intangibleAssets: "无形资产",
  longTermDebt: "长期负债",
  shortTermDebt: "短期负债",
  totalDebt: "总负债",
  netDebt: "净负债",
  stockholdersEquity: "股东权益",
  operatingCashFlow: "经营活动现金流",
  investingCashFlow: "投资活动现金流",
  financingCashFlow: "筹资活动现金流",
  freeCashFlow: "自由现金流",
  capitalExpenditure: "资本支出",
  dividendsPaid: "股息支付",
  stockBasedCompensation: "股权激励",
};

const METRICS_CARDS = [
  { key: "marketCap", label: "市值", fmt: (v: number) => `$${(v / 1e9).toFixed(1)}B` },
  { key: "enterpriseValueTTM", label: "企业价值(EV)", fmt: (v: number) => `$${(v / 1e9).toFixed(1)}B` },
  { key: "peRatioTTM", label: "PE(TTM)", fmt: (v: number) => `${v.toFixed(1)}` },
  { key: "priceToSalesRatioTTM", label: "PS(TTM)", fmt: (v: number) => `${v.toFixed(1)}` },
  { key: "priceToBookRatioTTM", label: "PB(TTM)", fmt: (v: number) => `${v.toFixed(1)}` },
  { key: "evToSalesTTM", label: "EV/营收", fmt: (v: number) => `${v.toFixed(1)}` },
  { key: "evToEBITDATTM", label: "EV/EBITDA", fmt: (v: number) => `${v.toFixed(1)}` },
  { key: "netDebtToEBITDATTM", label: "净负债/EBITDA", fmt: (v: number) => `${v.toFixed(1)}` },
  { key: "currentRatioTTM", label: "流动比率", fmt: (v: number) => `${v.toFixed(2)}` },
  { key: "returnOnEquityTTM", label: "ROE", fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: "returnOnAssetsTTM", label: "ROA", fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: "dividendYieldTTM", label: "股息率", fmt: (v: number) => `${(v * 100).toFixed(2)}%` },
  { key: "debtToEquityTTM", label: "负债权益比", fmt: (v: number) => `${v.toFixed(2)}` },
  { key: "grahamNumberTTM", label: "格雷厄姆数", fmt: (v: number) => `${v.toFixed(1)}` },
];

function fmoney(v: unknown): string {
  if (typeof v !== "number") return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(2);
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

function skipKey(k: string): boolean {
  return k === "date" || k === "symbol" || k === "acceptedDate" || k === "period" || k === "cik" || k === "fillingDate" || k === "calendarYear" || k === "finalLink" || k === "link" || k === "reportedCurrency" || k.endsWith("Url");
}

function sortFinancialKeys(data: FinRow[]): string[] {
  if (!data.length) return [];
  const priority = ["revenue", "netIncome", "totalAssets", "totalLiabilities", "totalEquity", "operatingCashFlow", "freeCashFlow", "eps", "ebitda"];
  const keys = Object.keys(data[0]).filter(k => !skipKey(k));
  return keys.sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function renderVal(k: string, v: unknown): string {
  if (k === "eps" || k === "epsdiluted") {
    return isNum(v) ? `$${v.toFixed(2)}` : "—";
  }
  if (k.endsWith("Ratio") || k.endsWith("ratio") || k === "grossProfitRatio" || k === "operatingIncomeRatio" || k === "netIncomeRatio") {
    return isNum(v) ? `${(v * 100).toFixed(1)}%` : "—";
  }
  return fmoney(v);
}

export default function StockFinancialsPage({ symbol }: { symbol: string }) {
  const [stmt, setStmt] = useState<StmtType>("income");
  const [period, setPeriod] = useState<PeriodType>("quarter");
  const [finData, setFinData] = useState<FinRow[]>([]);
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [finRes, metRes] = await Promise.all([
      fetch(`/api/stock/${encodeURIComponent(symbol)}/financials?statement=${stmt}&period=${period}&limit=8`, {
        headers: { "X-API-Key": API_KEY }, cache: "no-store",
      }),
      fetch(`/api/stock/${encodeURIComponent(symbol)}/metrics?period=${period}`, {
        headers: { "X-API-Key": API_KEY }, cache: "no-store",
      }),
    ]);
    if (finRes.ok) {
      const j = await finRes.json();
      setFinData(j.data ?? []);
    }
    if (metRes.ok) {
      setMetrics(await metRes.json());
    }
    setLoading(false);
  }, [symbol, stmt, period]);

  useEffect(() => { void load(); }, [load]);

  const ttm = metrics?.metrics_ttm ?? {};
  const stmtKeys = sortFinancialKeys(finData);

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STMT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStmt(t.key)}
              className={clsx(
                "text-[12px] px-2.5 py-1 rounded-[6px] border",
                stmt === t.key
                  ? "border-gold text-gold bg-gold-dim"
                  : "border-border2 text-muted hover:text-text"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-2">
          {(["quarter", "annual"] as PeriodType[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={clsx(
                "text-[11px] px-2 py-0.5 rounded-[6px] border",
                period === p
                  ? "border-gold text-gold"
                  : "border-border2 text-muted hover:text-text"
              )}
            >
              {p === "quarter" ? "季度" : "年度"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted text-[13px] py-16">加载财务数据…</div>
      ) : finData.length === 0 ? (
        <div className="bg-panel border border-border2 rounded-[10px] p-6 text-center text-muted text-[13px]">
          暂无财务数据，请确认 FMP_API_KEY 配置正确。
        </div>
      ) : (
        <div className="bg-panel border border-border2 rounded-[10px] overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border2 text-muted">
                <th className="text-left px-3 py-2 w-48">指标</th>
                {finData.slice(0, 6).map((r) => (
                  <th key={String(r.date)} className="text-right px-3 py-2 font-mono min-w-[90px]">
                    {String(r.date).slice(0, 10)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border2">
              {stmtKeys.map((k) => {
                const label = LABEL_MAP[k] || k.replace(/([A-Z])/g, " $1").trim();
                const vals = finData.slice(0, 6).map((r) => renderVal(k, r[k]));
                const allDash = vals.every((v) => v === "—");
                if (allDash) return null;
                return (
                  <tr key={k} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2 text-muted">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right font-mono text-text">{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Key Metrics Section */}
      {ttm && Object.keys(ttm).length > 0 && (
        <div>
          <h3 className="text-[13px] font-semibold text-text mb-3">核心估值指标 (TTM)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {METRICS_CARDS.map(({ key, label, fmt }) => {
              const v = ttm[key];
              const num = typeof v === "number" ? v : null;
              return (
                <div key={key} className="bg-panel border border-border2 rounded-[8px] px-3 py-2">
                  <div className="text-[10px] text-muted">{label}</div>
                  <div className="text-[14px] font-mono text-text mt-0.5">
                    {num !== null ? fmt(num) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {metrics?.scores && (
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <h3 className="text-[12px] font-semibold text-text mb-2">财务评分</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(metrics.scores).map(([k, v]) => {
              if (typeof v !== "number" && typeof v !== "string") return null;
              const label = k.replace(/([A-Z])/g, " $1").trim();
              return (
                <div key={k} className="text-[12px]">
                  <span className="text-muted">{label}：</span>
                  <span className="font-mono text-text">{String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted text-center pb-4">
        数据来源：Financial Modeling Prep。非实时数据，仅供参考。
      </p>
    </div>
  );
}
