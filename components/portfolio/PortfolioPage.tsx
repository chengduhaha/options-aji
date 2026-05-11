"use client";

import { useState } from "react";
import { Briefcase, Plus, Trash2, TrendingUp, Activity, Zap, Clock } from "lucide-react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface PositionInput {
  ticker: string;
  quantity: number;
}

interface PositionResult {
  ticker: string;
  quantity: number;
  underlying: string;
  type: string;
  strike: number | null;
  expiration: string | null;
  delta_exposure: number;
  gamma_exposure: number;
  theta_exposure: number;
  vega_exposure: number;
  contract_delta: number | null;
  contract_gamma: number | null;
  contract_theta: number | null;
  contract_vega: number | null;
}

interface GreeksResult {
  total_delta: number;
  total_gamma: number;
  total_theta: number;
  total_vega: number;
  positions: PositionResult[];
  errors: string[];
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<PositionInput[]>([
    { ticker: "O:SPY260515C00550000", quantity: 1 },
  ]);
  const [result, setResult] = useState<GreeksResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePosition = (i: number, field: keyof PositionInput, value: string | number) => {
    setPositions(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const addPosition = () => {
    setPositions(prev => [...prev, { ticker: "O:", quantity: 1 }]);
  };

  const removePosition = (i: number) => {
    setPositions(prev => prev.filter((_, idx) => idx !== i));
  };

  const calculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/greeks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify(positions.map(p => ({ ticker: p.ticker, quantity: p.quantity }))),
      });
      if (!res.ok) { setError(`请求失败: ${res.status}`); return; }
      setResult(await res.json() as GreeksResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-5 py-4 border-b border-glass-border glass flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">投资组合 Greeks</h1>
            <p className="text-[11px] text-muted">输入期权持仓，计算总 Greeks 暴露</p>
          </div>
        </div>

        <div className="space-y-2">
          {positions.map((pos, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <input
                value={pos.ticker}
                onChange={e => updatePosition(i, "ticker", e.target.value)}
                placeholder="O:SPY260515C00550000"
                className="flex-1 bg-glass border border-glass-border rounded-lg px-3 py-1.5 font-mono text-foreground focus:outline-none focus:border-primary/30 placeholder:text-muted"
              />
              <input
                type="number"
                value={pos.quantity}
                onChange={e => updatePosition(i, "quantity", parseInt(e.target.value) || 0)}
                className="w-20 bg-glass border border-glass-border rounded-lg px-3 py-1.5 font-mono text-foreground text-right focus:outline-none focus:border-primary/30"
                placeholder="数量"
              />
              {positions.length > 1 && (
                <button type="button" onClick={() => removePosition(i)} className="p-1.5 text-muted hover:text-red transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={addPosition} className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg glass border border-glass-border text-muted hover:text-foreground transition-all">
              <Plus className="w-3 h-3" /> 添加合约
            </button>
            <button
              type="button"
              onClick={calculate}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 text-[12px] bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50 transition-all"
            >
              {loading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              计算 Greeks
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {error && (
          <div className="bg-red/10 border border-red/30 rounded-xl px-4 py-3 text-[12px] text-red">{error}</div>
        )}

        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "总 Delta", value: result.total_delta, icon: TrendingUp, color: result.total_delta > 0 ? "text-green" : "text-red", desc: "方向暴露 (股数等价)" },
                { label: "总 Gamma", value: result.total_gamma, icon: Activity, color: result.total_gamma > 0 ? "text-green" : "text-red", desc: "Delta 变化速度" },
                { label: "总 Theta", value: result.total_theta, icon: Clock, color: result.total_theta < 0 ? "text-red" : "text-green", desc: "每日时间衰减" },
                { label: "总 Vega", value: result.total_vega, icon: Zap, color: result.total_vega > 0 ? "text-accent" : "text-muted", desc: "IV 变化 1% 的影响" },
              ].map(c => (
                <div key={c.label} className="bg-glass border border-glass-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                    <span className="text-[11px] text-muted">{c.label}</span>
                  </div>
                  <div className={`text-[24px] font-mono font-bold ${c.color}`}>
                    {c.value.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-muted mt-1">{c.desc}</div>
                </div>
              ))}
            </div>

            {/* Positions Table */}
            {result.positions.length > 0 && (
              <div className="bg-glass border border-glass-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-glass-border">
                  <h3 className="text-[12px] font-semibold text-foreground">持仓明细</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-glass-border text-muted">
                        <th className="text-left px-3 py-2">合约</th>
                        <th className="text-right px-3 py-2">数量</th>
                        <th className="text-right px-3 py-2">类型</th>
                        <th className="text-right px-3 py-2">行权价</th>
                        <th className="text-right px-3 py-2">到期</th>
                        <th className="text-right px-3 py-2">Delta</th>
                        <th className="text-right px-3 py-2">Gamma</th>
                        <th className="text-right px-3 py-2">Theta</th>
                        <th className="text-right px-3 py-2">Vega</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {result.positions.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-2 font-mono text-primary text-[10px]">{p.ticker}</td>
                          <td className={clsx("px-3 py-2 text-right font-mono", p.quantity > 0 ? "text-green" : "text-red")}>
                            {p.quantity > 0 ? "+" : ""}{p.quantity}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={clsx("text-[9px] font-bold px-1 py-0.5 rounded", p.type === "call" ? "bg-green/20 text-green" : "bg-red/20 text-red")}>
                              {p.type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{p.strike != null ? `$${p.strike}` : "—"}</td>
                          <td className="px-3 py-2 text-right text-muted">{p.expiration ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.delta_exposure.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.gamma_exposure.toFixed(4)}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.theta_exposure.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.vega_exposure.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-red/10 border border-red/30 rounded-xl px-4 py-3">
                <div className="text-[11px] font-semibold text-red mb-1">处理错误</div>
                {result.errors.map((e, i) => (
                  <div key={i} className="text-[11px] text-red/80 font-mono">{e}</div>
                ))}
              </div>
            )}

            {/* Greeks Interpretation */}
            <div className="bg-glass border border-glass-border rounded-xl p-4">
              <h3 className="text-[12px] font-semibold text-foreground mb-2">Greeks 解读</h3>
              <div className="space-y-1.5 text-[11px] text-muted leading-relaxed">
                <p>• <span className="text-green font-medium">Delta {result.total_delta.toFixed(0)}</span>：标的每涨 $1，组合盈亏变化 ${Math.abs(result.total_delta).toFixed(0)}（{result.total_delta > 0 ? "偏多" : "偏空"}）</p>
                <p>• <span className={result.total_gamma > 0 ? "text-green" : "text-red"}>Gamma {result.total_gamma.toFixed(4)}</span>：标的每涨 $1，Delta 变化 {result.total_gamma.toFixed(4)}（{result.total_gamma > 0 ? "Gamma 正 → 低买高卖" : "Gamma 负 → 追涨杀跌"}）</p>
                <p>• <span className={result.total_theta < 0 ? "text-red" : "text-green"}>Theta {result.total_theta.toFixed(1)}</span>：{result.total_theta < 0 ? "每天损失" : "每天收入"} ${Math.abs(result.total_theta).toFixed(0)}（{result.total_theta < 0 ? "买方" : "卖方"}）</p>
                <p>• <span className={result.total_vega > 0 ? "text-accent" : "text-muted"}>Vega {result.total_vega.toFixed(1)}</span>：IV 升 1% 组合{' '}{result.total_vega > 0 ? "盈利" : "亏损"} ${Math.abs(result.total_vega).toFixed(0)}</p>
              </div>
            </div>
          </>
        )}

        {!result && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-muted gap-3">
            <Briefcase className="w-12 h-12 opacity-20" />
            <p className="text-[13px]">输入期权合约代码和数量，点击「计算 Greeks」</p>
            <p className="text-[10px]">数据来源：PostgreSQL options_snapshots（每 15 分钟同步）</p>
          </div>
        )}
      </div>
    </div>
  );
}