"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info, Send, TrendingDown } from "lucide-react";
import type { StrategyLegRow } from "@/lib/crossMarket";

export interface StrategyExecutionCardProps {
  legs: StrategyLegRow[];
  summary: {
    tagline: string;
    maxProfit: string;
    maxRisk: string;
    evAnnual: string;
  };
}

export function StrategyExecutionCard({ legs, summary }: StrategyExecutionCardProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-[#1E2D4A] bg-[#131E35] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2D4A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3DBF7A]/15 border border-[#3DBF7A]/30 flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4 text-[#3DBF7A]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">执行建议</div>
              <div className="font-terminal text-[10px] text-[#7A8BA8] mt-0.5">跨市场组合 · 请结合账户与合规</div>
            </div>
          </div>
          <Button
            size="sm"
            type="button"
            className="font-terminal text-xs bg-[#3DBF7A] text-[#0F1729] hover:bg-[#3DBF7A]/90 font-semibold gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            一键执行
          </Button>
        </div>

        <div className="hidden md:grid grid-cols-[80px_120px_80px_1fr_100px_180px] gap-3 px-5 py-2.5 text-[10px] font-terminal text-[#4A5A73] uppercase tracking-wider border-b border-[#1E2D4A]/50">
          <span>腿</span>
          <span>市场</span>
          <span>操作</span>
          <span>工具</span>
          <span>仓位</span>
          <span>预期 P/L</span>
        </div>

        <div className="divide-y divide-[#1E2D4A]/50">
          {legs.map((leg) => (
            <div
              key={leg.leg}
              className="grid grid-cols-1 md:grid-cols-[80px_120px_80px_1fr_100px_180px] gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge className="font-terminal text-[10px] bg-[#1A2640] text-[#7A8BA8] border-[#1E2D4A]">
                  {leg.leg}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: leg.marketColor }} />
                <span className="text-sm font-medium" style={{ color: leg.marketColor }}>
                  {leg.market}
                </span>
              </div>

              <div>
                <Badge
                  className="font-terminal text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${leg.actionColor}20`,
                    color: leg.actionColor,
                    borderColor: `${leg.actionColor}40`,
                  }}
                >
                  {leg.action}
                </Badge>
              </div>

              <div className="font-terminal text-xs text-foreground/90">{leg.instrument}</div>

              <div className="font-terminal text-sm font-bold text-foreground">{leg.position}</div>

              <div className="flex items-center gap-2">
                <span className="font-terminal text-sm font-bold" style={{ color: leg.plColor }}>
                  {leg.maxPL}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="p-0.5 rounded hover:bg-white/5">
                      <Info className="w-3 h-3 text-[#4A5A73]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A2640] border-[#1E2D4A] text-xs text-[#7A8BA8] max-w-[160px]">
                    {leg.risk}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 border-t border-[#1E2D4A] bg-[#0F1729]/40">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs text-[#7A8BA8]">
              <span className="font-semibold text-[#D4AF37]">组合特点:</span> {summary.tagline}
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-center">
              <div className="font-terminal text-[10px] text-[#4A5A73] uppercase tracking-wider">最大收益</div>
              <div className="font-terminal text-sm font-bold text-[#3DBF7A]">{summary.maxProfit}</div>
            </div>
            <div className="w-px h-8 bg-[#1E2D4A]" />
            <div className="text-center">
              <div className="font-terminal text-[10px] text-[#4A5A73] uppercase tracking-wider">最大风险</div>
              <div className="font-terminal text-sm font-bold text-[#D44A4A]">{summary.maxRisk}</div>
            </div>
            <div className="w-px h-8 bg-[#1E2D4A]" />
            <div className="text-center">
              <div className="font-terminal text-[10px] text-[#4A5A73] uppercase tracking-wider">期望年化</div>
              <div className="font-terminal text-sm font-bold text-[#D4AF37]">{summary.evAnnual}</div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
