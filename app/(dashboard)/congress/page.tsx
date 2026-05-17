"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, RefreshCw, Search, TrendingDown, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

interface CongressTrade {
  id: number;
  member_name: string;
  chamber: string;
  symbol: string;
  trade_date: string;
  transaction_type: string;
  amount_range: string;
}

interface LeaderboardEntry {
  member_name: string;
  chamber: string;
  trade_count: number;
  hypothetical_roi_pct: number;
  best_trade_symbol: string;
}

interface BacktestTrade {
  symbol: string;
  buy_date: string;
  buy_price: number;
  current_price: number;
  pnl: number;
  pnl_pct: number;
}

interface BacktestResult {
  initial_capital: number;
  final_value: number;
  total_return_pct: number;
  trade_count: number;
  winning_trades: number;
  trades: BacktestTrade[];
}

type Tab = "trades" | "leaderboard" | "backtest";

export default function CongressPage() {
  const [tab, setTab] = useState<Tab>("trades");
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [chamber, setChamber] = useState("all");
  const [symbolQ, setSymbolQ] = useState("");
  const [lb, setLb] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbFetched, setLbFetched] = useState(false);
  const [btMember, setBtMember] = useState("");
  const [btChamber, setBtChamber] = useState("senate");
  const [btCapital, setBtCapital] = useState("100000");
  const [btLoading, setBtLoading] = useState(false);
  const [btResult, setBtResult] = useState<BacktestResult | null>(null);
  const [btError, setBtError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setTradesLoading(true);
    setTradesError(null);
    try {
      const p = new URLSearchParams();
      if (chamber !== "all") p.set("chamber", chamber);
      if (symbolQ) p.set("symbol", symbolQ);
      const res = await fetch(`/api/congress/trades?${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTrades(data.trades ?? data ?? []);
    } catch (e) {
      setTradesError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setTradesLoading(false);
    }
  }, [chamber, symbolQ]);

  const fetchLeaderboard = useCallback(async () => {
    if (lbFetched) return;
    setLbLoading(true);
    try {
      const res = await fetch("/api/congress/leaderboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLb(data.leaderboard ?? data ?? []);
      setLbFetched(true);
    } catch { } finally {
      setLbLoading(false);
    }
  }, [lbFetched]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);
  useEffect(() => { if (tab === "leaderboard") fetchLeaderboard(); }, [tab, fetchLeaderboard]);

  async function runBacktest() {
    if (!btMember.trim()) { setBtError("请输入议员姓名"); return; }
    setBtLoading(true); setBtError(null); setBtResult(null);
    try {
      const res = await fetch("/api/congress/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member: btMember, chamber: btChamber, capital: parseFloat(btCapital) || 100_000 }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err?.detail ?? `HTTP ${res.status}`); }
      setBtResult(await res.json());
    } catch (e) {
      setBtError(e instanceof Error ? e.message : "回测失败");
    } finally {
      setBtLoading(false);
    }
  }

  function TxBadge({ type }: { type: string }) {
    const t = type?.toLowerCase();
    if (t?.includes("purchase") || t?.includes("buy")) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">买入</span>;
    if (t?.includes("sale") || t?.includes("sell")) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">卖出</span>;
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-glass text-muted-foreground border border-glass-border">{type}</span>;
  }

  function ChamberBadge({ c }: { c: string }) {
    return <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold", c === "senate" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{c === "senate" ? "参" : "众"}</span>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">国会山追踪</h1>
          <p className="text-sm text-muted-foreground">参众两院议员交易申报与策略回测</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-glass border border-glass-border w-fit">
        {([
          ["trades", "交易记录"],
          ["leaderboard", "领袖榜"],
          ["backtest", "回测工具"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === id ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground")}>{label}</button>
        ))}
      </div>

      {tab === "trades" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 p-1 rounded-lg bg-glass border border-glass-border">
              {([
                ["all", "全部"],
                ["senate", "参议院"],
                ["house", "众议院"],
              ] as [string, string][]).map(([c, label]) => (
                <button key={c} onClick={() => setChamber(c)} className={clsx("px-3 py-1.5 rounded text-[12px] font-medium transition-all", chamber === c ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-glass border border-glass-border">
              <Search className="w-3.5 h-3.5 text-muted" />
              <input type="text" placeholder="股票代码筛选" value={symbolQ} onChange={e => setSymbolQ(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && fetchTrades()} className="bg-transparent text-sm text-foreground placeholder:text-muted outline-none w-28" />
            </div>
            <button onClick={fetchTrades} disabled={tradesLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-glass border border-glass-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
              <RefreshCw className={clsx("w-3.5 h-3.5", tradesLoading && "animate-spin")} />搜索
            </button>
          </div>
          <div className="rounded-xl border border-glass-border bg-glass/40 overflow-hidden">
            {tradesError && <div className="p-4 text-center text-red-400 text-sm">{tradesError}</div>}
            {tradesLoading && <div className="p-8 text-center text-muted-foreground text-sm">加载中…</div>}
            {!tradesLoading && !tradesError && trades.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">暂无交易记录</div>}
            {!tradesLoading && !tradesError && trades.length > 0 && (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-glass-border bg-glass/60">
                  {[["议员","text-left"],["院","text-left"],["股票","text-left"],["类型","text-left"],["金额范围","text-left"],["日期","text-left"]].map(([l,a])=>(
                    <th key={l} className={clsx("px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide",a)}>{l}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {trades.map(trade => (
                    <tr key={trade.id} className="border-b border-glass-border/50 hover:bg-glass/60 transition-colors">
                      <td className="px-4 py-3 text-foreground font-medium text-[12px]">{trade.member_name}</td>
                      <td className="px-4 py-3"><ChamberBadge c={trade.chamber} /></td>
                      <td className="px-4 py-3 font-bold text-foreground font-mono">{trade.symbol}</td>
                      <td className="px-4 py-3"><TxBadge type={trade.transaction_type} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-[12px]">{trade.amount_range}</td>
                      <td className="px-4 py-3 text-muted-foreground text-[12px]">{trade.trade_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="rounded-xl border border-glass-border bg-glass/40 overflow-hidden">
          {lbLoading && <div className="p-8 text-center text-muted-foreground text-sm">加载中…</div>}
          {!lbLoading && lb.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">暂无数据</div>}
          {!lbLoading && lb.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-glass-border bg-glass/60">
                {[["排名","text-left"],["议员","text-left"],["院","text-left"],["假设收益率","text-right"],["交易次数","text-right"],["最佳标的","text-left"]].map(([l,a])=>(
                  <th key={l} className={clsx("px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide",a)}>{l}</th>
                ))}
              </tr></thead>
              <tbody>
                {lb.map((entry, idx) => (
                  <tr key={entry.member_name} className="border-b border-glass-border/50 hover:bg-glass/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className={clsx("inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold", idx===0?"bg-yellow-500/20 text-yellow-400":idx===1?"bg-gray-500/20 text-gray-300":idx===2?"bg-orange-500/20 text-orange-400":"bg-glass text-muted-foreground")}>{idx+1}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium text-[12px]">{entry.member_name}</td>
                    <td className="px-4 py-3"><ChamberBadge c={entry.chamber} /></td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx("flex items-center justify-end gap-1 font-bold", entry.hypothetical_roi_pct>=0?"text-green-400":"text-red-400")}>
                        {entry.hypothetical_roi_pct>=0?<TrendingUp className="w-3 h-3" />:<TrendingDown className="w-3 h-3" />}
                        {entry.hypothetical_roi_pct>=0?"+":""}{entry.hypothetical_roi_pct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{entry.trade_count}</td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground text-[12px]">{entry.best_trade_symbol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "backtest" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-glass-border bg-glass/40 p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">回测参数</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[11px] text-muted uppercase tracking-wide mb-1.5">议员姓名</label>
                <input type="text" placeholder="例如: Nancy Pelosi" value={btMember} onChange={e => setBtMember(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-glass border border-glass-border text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[11px] text-muted uppercase tracking-wide mb-1.5">议院</label>
                <select value={btChamber} onChange={e => setBtChamber(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-glass border border-glass-border text-sm text-foreground outline-none focus:border-primary/50">
                  <option value="senate">参议院</option>
                  <option value="house">众议院</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-muted uppercase tracking-wide mb-1.5">初始资金 (USD)</label>
                <input type="number" placeholder="100000" value={btCapital} onChange={e => setBtCapital(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-glass border border-glass-border text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/50" />
              </div>
            </div>
            {btError && <p className="text-red-400 text-sm mb-3">{btError}</p>}
            <button onClick={runBacktest} disabled={btLoading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary font-medium text-sm hover:bg-primary/30 transition-all disabled:opacity-50">
              {btLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              {btLoading ? "回测中…" : "运行回测"}
            </button>
          </div>
          {btResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label:"初始资金", value:`$${btResult.initial_capital.toLocaleString()}`, color:"text-foreground" },
                  { label:"最终价値", value:`$${btResult.final_value.toLocaleString()}`, color:"text-foreground" },
                  { label:"总收益率", value:(btResult.total_return_pct>=0?"+":"")+btResult.total_return_pct?.toFixed(2)+"%", color:btResult.total_return_pct>=0?"text-green-400":"text-red-400" },
                  { label:"胜率", value:btResult.trade_count>0?`${((btResult.winning_trades/btResult.trade_count)*100).toFixed(0)}%`:"N/A", color:"text-foreground" },
                ].map(({label,value,color})=>(
                  <div key={label} className="rounded-xl border border-glass-border bg-glass/40 p-4">
                    <div className="text-[10px] text-muted uppercase tracking-wide mb-1">{label}</div>
                    <div className={clsx("text-lg font-bold",color)}>{value}</div>
                  </div>
                ))}
              </div>
              {btResult.trades?.length > 0 && (
                <div className="rounded-xl border border-glass-border bg-glass/40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-glass-border bg-glass/60"><h3 className="text-sm font-semibold text-foreground">持仓明细</h3></div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-glass-border">
                      {[["股票","text-left"],["买入日","text-left"],["买入价","text-right"],["当前价","text-right"],["盈亏","text-right"],["收益率","text-right"]].map(([l,a])=>(
                        <th key={l} className={clsx("px-4 py-2 text-[10px] font-semibold text-muted uppercase",a)}>{l}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {btResult.trades.map((t,i)=>(
                        <tr key={i} className="border-b border-glass-border/50 hover:bg-glass/60">
                          <td className="px-4 py-2 font-mono font-bold text-foreground">{t.symbol}</td>
                          <td className="px-4 py-2 text-muted-foreground text-[12px]">{t.buy_date}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">${t.buy_price?.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">${t.current_price?.toFixed(2)}</td>
                          <td className={clsx("px-4 py-2 text-right font-medium",t.pnl>=0?"text-green-400":"text-red-400")}>{t.pnl>=0?"+":""}${t.pnl?.toFixed(0)}</td>
                          <td className={clsx("px-4 py-2 text-right font-bold",t.pnl_pct>=0?"text-green-400":"text-red-400")}>{t.pnl_pct>=0?"+":""}{t.pnl_pct?.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
