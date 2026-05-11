"use client";

import { clsx } from "clsx";
import { Info } from "lucide-react";
import { useState } from "react";

interface DataLabelProps {
  label: string;
  value: string;
  interpretation?: string;
  color?: string;
  /** "bull" | "bear" | "neutral" — adds icon and color hint */
  sentiment?: "bull" | "bear" | "neutral" | null;
  /** If set, always shows the interpretation below the value */
  showHint?: boolean;
}

export default function DataLabel({ label, value, interpretation, color, sentiment, showHint }: DataLabelProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative group">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[10px] text-muted uppercase tracking-wider">{label}</span>
        {interpretation && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-muted/50 hover:text-primary transition-colors"
          >
            <Info className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {sentiment === "bull" && <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />}
        {sentiment === "bear" && <span className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />}
        {sentiment === "neutral" && <span className="w-1.5 h-1.5 rounded-full bg-muted flex-shrink-0" />}
        <div className={clsx("text-[15px] font-mono font-bold", color ?? "text-foreground")}>{value}</div>
      </div>
      {(showHint || show) && interpretation && (
        <div className="mt-1 text-[10px] text-muted leading-tight bg-glass border border-glass-border rounded-md px-2 py-1">
          {interpretation}
        </div>
      )}
    </div>
  );
}

/** Interpretation rules engine — pure functions */
export function interpretIVRank(rank: number): { interpretation: string; sentiment: "bull" | "bear" | "neutral" } {
  if (rank >= 70) return { interpretation: "IV 处于历史高位，期权偏贵，适合卖方策略（卖 Call/Put、Iron Condor）", sentiment: "bear" };
  if (rank >= 50) return { interpretation: "IV 中等偏高，期权定价合理偏贵", sentiment: "neutral" };
  if (rank >= 30) return { interpretation: "IV 中等偏低，期权定价合理", sentiment: "neutral" };
  return { interpretation: "IV 处于历史低位，期权便宜，适合买方策略（买 Call/Put、Straddle）", sentiment: "bull" };
}

export function interpretNetGex(gexBn: number): { interpretation: string; sentiment: "bull" | "bear" | "neutral" } {
  if (gexBn > 1) return { interpretation: `正 Gamma ${gexBn.toFixed(1)}B → 做市商低买高卖抑制波动，适合震荡策略`, sentiment: "bull" };
  if (gexBn > 0) return { interpretation: `正 Gamma ${gexBn.toFixed(2)}B → 做市商温和抑制波动`, sentiment: "bull" };
  if (gexBn > -1) return { interpretation: `负 Gamma ${gexBn.toFixed(2)}B → 做市商温和放大波动`, sentiment: "bear" };
  return { interpretation: `负 Gamma ${gexBn.toFixed(1)}B → 做市商追涨杀跌放大波动，适合趋势策略`, sentiment: "bear" };
}

export function interpretPCR(pcr: number): { interpretation: string; sentiment: "bull" | "bear" | "neutral" } {
  if (pcr > 1.2) return { interpretation: "Put 异常活跃 → 市场极度看跌，可能是反向买入信号", sentiment: "bull" };
  if (pcr > 1) return { interpretation: "Put 比 Call 活跃 → 市场偏谨慎", sentiment: "bear" };
  if (pcr < 0.5) return { interpretation: "Call 异常活跃 → 市场极度看涨，需警惕回调风险", sentiment: "bear" };
  if (pcr < 0.7) return { interpretation: "Call 比 Put 活跃 → 市场偏乐观", sentiment: "bull" };
  return { interpretation: "Put/Call 成交量均衡，市场无极端情绪", sentiment: "neutral" };
}

export function interpretVix(vix: number): { interpretation: string; sentiment: "bull" | "bear" | "neutral" } {
  if (vix > 30) return { interpretation: `VIX ${vix.toFixed(1)} → 恐慌区域，避免裸卖期权，关注对冲`, sentiment: "bear" };
  if (vix > 20) return { interpretation: `VIX ${vix.toFixed(1)} → 波动偏高，期权溢价明显`, sentiment: "neutral" };
  if (vix < 13) return { interpretation: `VIX ${vix.toFixed(1)} → 极度低波动，注意波动率回归风险`, sentiment: "neutral" };
  return { interpretation: `VIX ${vix.toFixed(1)} → 正常波动区间`, sentiment: "neutral" };
}

export function interpretGammaRegime(regime: string): { interpretation: string; sentiment: "bull" | "bear" | "neutral" } {
  if (regime === "Positive Gamma") return { interpretation: "正 Gamma → 做市商抑制波动，市场更平滑，适合区间策略", sentiment: "bull" };
  return { interpretation: "负 Gamma → 做市商放大波动，市场更易失控，适合趋势策略", sentiment: "bear" };
}

export function interpretTheta(theta: number): string {
  if (theta > 0) return `每天收取 $${theta.toFixed(1)} 时间价值（卖方有利）`;
  return `每天损失 $${Math.abs(theta).toFixed(1)} 时间价值（买方注意持仓时间）`;
}

export function interpretTermStructure(structure: string): { interpretation: string; sentiment: "bull" | "bear" | "neutral" } {
  if (structure === "Contango") return { interpretation: "VIX 期货升水 → 正常状态，适合做空波动率", sentiment: "bull" };
  return { interpretation: "VIX 期货贴水 → 市场恐慌，做多波动率信号", sentiment: "bear" };
}