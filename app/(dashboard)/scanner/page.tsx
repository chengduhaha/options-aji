"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ScanLine, Activity, Zap } from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api";
import type { ScannerRunPayload, ScannerTemplateContract } from "@/lib/contracts";

type ScanRow = {
  symbol: string;
  option_type: string;
  strike: number;
  expiration: string;
  dte: number | null;
  volume: number;
  openInterest: number;
  volOiRatio: number;
  ivRankProxy: number | null;
  iv: number | null;
  delta: number | null;
};

type SortField = "volOiRatio" | "iv" | "dte" | "delta";
type SortDirection = "asc" | "desc";

type ScannerTemplate = {
  id: number;
  name: string;
  preset: string;
  queryText: string;
  symbolScope: string;
  dteMin: string;
  dteMax: string;
  deltaMin: string;
  deltaMax: string;
  ivMin: string;
  ivMax: string;
  expirationScope: "all" | "front" | "next_three";
  sortField: SortField;
  sortDirection: SortDirection;
};
const API_KEY_LS = "optionsaji_api_key";

const PRESETS = [
  ["high_vol_oi", "高 Vol/OI", "成交量远超 OI 的异动合约"],
  ["high_iv_rank", "高 IV Rank", "IV 处于历史高位，适合卖方"],
  ["low_iv_rank", "低 IV Rank", "IV 处于历史低位，适合买方"],
  ["otp", "OTP 近 ATM", "Delta 0.2~0.35 的近月合约"],
] as const;

export default function ScannerPage() {
  const [preset, setPreset] = useState("high_vol_oi");
  const [queryText, setQueryText] = useState("");
  const [symbolScope, setSymbolScope] = useState("SPY,QQQ,AAPL,NVDA,TSLA");
  const [dteMin, setDteMin] = useState("0");
  const [dteMax, setDteMax] = useState("45");
  const [deltaMin, setDeltaMin] = useState("0.2");
  const [deltaMax, setDeltaMax] = useState("0.6");
  const [ivMin, setIvMin] = useState("20");
  const [ivMax, setIvMax] = useState("120");
  const [expirationScope, setExpirationScope] = useState<"all" | "front" | "next_three">("next_three");
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [meta, setMeta] = useState<{ ms: number; count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("volOiRatio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [templateName, setTemplateName] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<ScannerTemplate[]>([]);
  const [templateMsg, setTemplateMsg] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(API_KEY_LS);
      if (saved) setApiKey(saved);
    } catch {
      setApiKey("");
    }
  }, []);

  useEffect(() => {
    const key = apiKey.trim();
    if (key.length < 8) {
      setTemplates([]);
      return;
    }
    let cancelled = false;
    api.profile
      .listScannerTemplates(key)
      .then((payload) => {
        if (cancelled) return;
        const mapped: ScannerTemplate[] = payload.data.map((item: ScannerTemplateContract) => ({
          id: item.id,
          name: item.name,
          preset: item.config.preset,
          queryText: item.config.query_text,
          symbolScope: item.config.symbol_scope,
          dteMin: item.config.dte_min,
          dteMax: item.config.dte_max,
          deltaMin: item.config.delta_min,
          deltaMax: item.config.delta_max,
          ivMin: item.config.iv_min,
          ivMax: item.config.iv_max,
          expirationScope: item.config.expiration_scope,
          sortField: item.config.sort_field,
          sortDirection: item.config.sort_direction,
        }));
        setTemplates(mapped);
      })
      .catch(() => {
        if (!cancelled) setTemplateMsg("模板读取失败。");
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const parseOptionalNumber = (input: string): number | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const run = async () => {
    setLoading(true);
    try {
      const parsedSymbols = symbolScope
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const payload: ScannerRunPayload = {
        preset,
        min_volume: 300,
        vol_oi_ratio: 3,
        symbols: parsedSymbols,
        expiration_scope: expirationScope,
        dte_min: parseOptionalNumber(dteMin),
        dte_max: parseOptionalNumber(dteMax),
        delta_min: parseOptionalNumber(deltaMin),
        delta_max: parseOptionalNumber(deltaMax),
        iv_min: parseOptionalNumber(ivMin),
        iv_max: parseOptionalNumber(ivMax),
      };
      if (queryText.trim()) payload.query_text = queryText.trim();
      const j = await api.scanner.run(payload);
      setRows((j.results as ScanRow[]) ?? []);
      setMeta({ ms: j.duration_ms ?? 0, count: j.count ?? 0 });
    } finally {
      setLoading(false);
    }
  };

  const sortedRows = useMemo(() => {
    const copied = [...rows];
    copied.sort((left, right) => {
      const getMetric = (row: ScanRow): number => {
        if (sortField === "volOiRatio") return row.volOiRatio;
        if (sortField === "iv") return row.iv ?? -1;
        if (sortField === "dte") return row.dte ?? 99999;
        return Math.abs(row.delta ?? 0);
      };
      const lv = getMetric(left);
      const rv = getMetric(right);
      if (sortDirection === "asc") return lv - rv;
      return rv - lv;
    });
    return copied;
  }, [rows, sortDirection, sortField]);

  const saveTemplate = async (forceCreate = false) => {
    const name = templateName.trim();
    if (!name) {
      setTemplateMsg("请先输入模板名称。");
      return;
    }
    const key = apiKey.trim();
    if (key.length < 8) {
      setTemplateMsg("请先在设置页保存 API 密钥。");
      return;
    }
    try {
      const payload = await api.profile.upsertScannerTemplate({
        api_key: key,
        template_id: !forceCreate ? (activeTemplateId ?? undefined) : undefined,
        name,
        config: {
          preset,
          query_text: queryText,
          symbol_scope: symbolScope,
          dte_min: dteMin,
          dte_max: dteMax,
          delta_min: deltaMin,
          delta_max: deltaMax,
          iv_min: ivMin,
          iv_max: ivMax,
          expiration_scope: expirationScope,
          sort_field: sortField,
          sort_direction: sortDirection,
        },
      });
      const item = payload.data;
      const mapped: ScannerTemplate = {
        id: item.id,
        name: item.name,
        preset: item.config.preset,
        queryText: item.config.query_text,
        symbolScope: item.config.symbol_scope,
        dteMin: item.config.dte_min,
        dteMax: item.config.dte_max,
        deltaMin: item.config.delta_min,
        deltaMax: item.config.delta_max,
        ivMin: item.config.iv_min,
        ivMax: item.config.iv_max,
        expirationScope: item.config.expiration_scope,
        sortField: item.config.sort_field,
        sortDirection: item.config.sort_direction,
      };
      setTemplates((prev) => [mapped, ...prev.filter((row) => row.id !== mapped.id)].slice(0, 12));
      setActiveTemplateId(mapped.id);
      setTemplateName("");
      setTemplateMsg(
        !forceCreate && activeTemplateId
          ? `模板「${name}」已覆盖保存。`
          : `模板「${name}」已保存。`,
      );
    } catch {
      setTemplateMsg("模板保存失败。");
    }
  };

  const applyTemplate = (item: ScannerTemplate) => {
    setActiveTemplateId(item.id);
    setTemplateName(item.name);
    setPreset(item.preset);
    setQueryText(item.queryText);
    setSymbolScope(item.symbolScope);
    setDteMin(item.dteMin);
    setDteMax(item.dteMax);
    setDeltaMin(item.deltaMin);
    setDeltaMax(item.deltaMax);
    setIvMin(item.ivMin);
    setIvMax(item.ivMax);
    setExpirationScope(item.expirationScope);
    setSortField(item.sortField);
    setSortDirection(item.sortDirection);
    setTemplateMsg(`已套用模板「${item.name}」。`);
  };

  const removeTemplate = async (id: number) => {
    const key = apiKey.trim();
    if (key.length < 8) {
      setTemplateMsg("请先在设置页保存 API 密钥。");
      return;
    }
    try {
      await api.profile.deleteScannerTemplate(key, id);
      setTemplates((prev) => prev.filter((item) => item.id !== id));
      if (activeTemplateId === id) {
        setActiveTemplateId(null);
        setTemplateName("");
      }
    } catch {
      setTemplateMsg("模板删除失败。");
    }
  };

  const resetTemplateSelection = () => {
    setActiveTemplateId(null);
    setTemplateName("");
    setTemplateMsg("已切换为新建模板模式。");
  };

  const exportCsv = () => {
    if (rows.length === 0) return;
    const header = ["symbol", "option_type", "strike", "expiration", "dte", "volume", "openInterest", "volOiRatio", "delta", "iv", "ivRankProxy"];
    const lines = rows.map((row) =>
      [
        row.symbol,
        row.option_type,
        row.strike.toFixed(2),
        row.expiration,
        String(row.dte ?? ""),
        String(row.volume),
        String(row.openInterest),
        row.volOiRatio.toFixed(4),
        row.delta == null ? "" : row.delta.toFixed(4),
        row.iv == null ? "" : row.iv.toFixed(2),
        row.ivRankProxy == null ? "" : String(row.ivRankProxy),
      ].join(","),
    );
    const content = [header.join(","), ...lines].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `scanner-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(href);
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
            <p className="text-[11px] text-muted">监控自选股列表的异常合约活动</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="AI 扫描描述（例如：高 IV 的科技股）"
            className="bg-panel border border-border2 text-[11px] px-2.5 py-1.5 rounded-[8px] min-w-[220px]"
          />
          <input
            value={symbolScope}
            onChange={(e) => setSymbolScope(e.target.value.toUpperCase())}
            placeholder="自定义标的范围（逗号分隔）"
            className="bg-panel border border-border2 text-[11px] px-2.5 py-1.5 rounded-[8px] min-w-[260px] font-mono"
          />
          <input
            value={dteMin}
            onChange={(e) => setDteMin(e.target.value)}
            placeholder="DTE最小"
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px] w-20 font-mono"
          />
          <input
            value={dteMax}
            onChange={(e) => setDteMax(e.target.value)}
            placeholder="DTE最大"
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px] w-20 font-mono"
          />
          <input
            value={deltaMin}
            onChange={(e) => setDeltaMin(e.target.value)}
            placeholder="|Δ|最小"
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px] w-24 font-mono"
          />
          <input
            value={deltaMax}
            onChange={(e) => setDeltaMax(e.target.value)}
            placeholder="|Δ|最大"
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px] w-24 font-mono"
          />
          <input
            value={ivMin}
            onChange={(e) => setIvMin(e.target.value)}
            placeholder="IV最小%"
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px] w-24 font-mono"
          />
          <input
            value={ivMax}
            onChange={(e) => setIvMax(e.target.value)}
            placeholder="IV最大%"
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px] w-24 font-mono"
          />
          <select
            value={expirationScope}
            onChange={(e) => setExpirationScope(e.target.value as "all" | "front" | "next_three")}
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px]"
          >
            <option value="next_three">到期精选(近3个)</option>
            <option value="front">仅最近到期</option>
            <option value="all">全部到期</option>
          </select>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="bg-panel border border-border2 text-[11px] px-2 py-1.5 rounded-[8px]"
          >
            <option value="volOiRatio">排序: Vol/OI</option>
            <option value="iv">排序: IV%</option>
            <option value="dte">排序: DTE</option>
            <option value="delta">排序: |Delta|</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="text-[11px] px-2.5 py-1.5 rounded-[8px] border border-border2 text-muted hover:text-foreground"
          >
            {sortDirection === "desc" ? "降序" : "升序"}
          </button>
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
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="text-[11px] px-3 py-1.5 rounded-[8px] border border-border2 text-muted disabled:opacity-40 hover:text-foreground"
          >
            导出 CSV
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="保存筛选模板名称"
            className="bg-panel border border-border2 text-[11px] px-2.5 py-1.5 rounded-[8px] min-w-[220px]"
          />
          <button
            type="button"
            onClick={() => saveTemplate(false)}
            className="text-[11px] px-3 py-1.5 rounded-[8px] border border-gold text-gold hover:bg-gold/10"
          >
            {activeTemplateId ? "覆盖保存" : "保存模板"}
          </button>
          <button
            type="button"
            onClick={() => saveTemplate(true)}
            className="text-[11px] px-3 py-1.5 rounded-[8px] border border-border2 text-muted hover:text-foreground"
          >
            另存为新模板
          </button>
          <button
            type="button"
            onClick={resetTemplateSelection}
            className="text-[11px] px-3 py-1.5 rounded-[8px] border border-border2 text-muted hover:text-foreground"
          >
            新建模式
          </button>
          {templateMsg ? <span className="text-[10px] text-gold">{templateMsg}</span> : null}
          {templates.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-1 border border-border2 rounded-[8px] px-2 py-1">
              <button
                type="button"
                onClick={() => applyTemplate(item)}
                className="text-[10px] text-muted hover:text-foreground"
              >
                {item.name}
              </button>
              <button
                type="button"
                onClick={() => removeTemplate(item.id)}
                className="text-[10px] text-red"
                aria-label={`删除模板-${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
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

        {sortedRows.length > 0 && (
          <div className="p-5">
            <div className="bg-glass border border-glass-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-glass-border text-muted">
                    <th className="text-left px-4 py-2.5 font-semibold">标的</th>
                    <th className="text-left px-4 py-2.5 font-semibold">类型</th>
                    <th className="text-right px-4 py-2.5 font-semibold">行权价</th>
                    <th className="text-left px-4 py-2.5 font-semibold">到期</th>
                    <th className="text-right px-4 py-2.5 font-semibold">DTE</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Vol</th>
                    <th className="text-right px-4 py-2.5 font-semibold">OI</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Vol/OI</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Delta</th>
                    <th className="text-right px-4 py-2.5 font-semibold">IV%</th>
                    <th className="text-right px-4 py-2.5 font-semibold">IV Rank¹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {sortedRows.map((r, i) => (
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
                      <td className="px-4 py-2 text-right font-mono">{r.dte ?? "—"}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.volume.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono">{r.openInterest.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-text">
                        {r.volOiRatio.toFixed(1)}x
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-blue">
                        {r.delta != null ? r.delta.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-text">
                        {r.iv != null ? `${r.iv.toFixed(1)}%` : "—"}
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