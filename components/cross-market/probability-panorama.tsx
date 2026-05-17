"use client";

import { AlertTriangle, Brain, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProbabilitySourceCard } from "./probability-source-card";
import type { ProbabilityPanoramaSource } from "@/lib/crossMarket";

export interface ProbabilityPanoramaProps {
  sources: ProbabilityPanoramaSource[];
  aiConsensusPercent: number;
  disagreementPp: number;
  arbitrationHeadline: string;
  arbitrationDetail: string;
  arbitrationStrengthLabel: string;
}

export function ProbabilityPanorama({
  sources,
  aiConsensusPercent,
  disagreementPp,
  arbitrationHeadline,
  arbitrationDetail,
  arbitrationStrengthLabel,
}: ProbabilityPanoramaProps) {
  const maxProb = Math.max(...sources.map((s) => s.probability));
  const minProb = Math.min(...sources.map((s) => s.probability));

  return (
    <TooltipProvider delayDuration={200}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-[#D4AF37]" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">四源概率全景</h2>
            <Badge className="font-terminal text-[10px] bg-[#1A2640] text-[#7A8BA8] border-[#1E2D4A]">实时更新</Badge>
          </div>
          <span className="font-terminal text-[10px] text-[#4A5A73]">最大分歧: {maxProb - minProb} 个百分点</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {sources.map((source) => (
            <ProbabilitySourceCard key={source.labelEn} {...source} />
          ))}
        </div>

        <div className="rounded-xl border border-[#1E2D4A] bg-[#131E35] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#7A8BA8] uppercase tracking-wider">概率位置对比 (0–100%)</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-[#4A5A73] hover:text-[#7A8BA8] transition-colors"
                >
                  <span className="text-[10px] font-terminal">分歧可视化</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] bg-[#1A2640] border-[#1E2D4A] text-xs text-[#7A8BA8]">
                各来源在同一坐标轴上的概率位置。竖线间距越大代表跨市场分歧越显著。
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="relative">
            <div className="flex justify-between mb-1.5">
              {[0, 25, 50, 75, 100].map((tick) => (
                <span key={tick} className="font-terminal text-[9px] text-[#4A5A73]">
                  {tick}%
                </span>
              ))}
            </div>

            <div className="relative h-10 rounded-lg bg-[#0F1729] border border-[#1E2D4A] overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[30%] bg-[#D44A4A]/5" />
              <div className="absolute inset-y-0 left-[30%] w-[30%] bg-[#D4AF37]/5" />
              <div className="absolute inset-y-0 left-[60%] w-[40%] bg-[#3DBF7A]/5" />

              <div
                className="absolute inset-y-0 w-0.5 bg-white/20"
                style={{ left: `${aiConsensusPercent}%` }}
              >
                <div className="absolute -top-0 left-1 font-terminal text-[9px] text-white/40">AI</div>
              </div>

              {sources.map((source) => (
                <Tooltip key={source.labelEn}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute inset-y-1 w-0.5 cursor-pointer group"
                      style={{
                        left: `${source.probability}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div
                        className="w-0.5 h-full rounded-full transition-all group-hover:w-1"
                        style={{ backgroundColor: source.color }}
                      />
                      <div
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-terminal text-[9px]"
                        style={{ color: source.color }}
                      >
                        {source.label.slice(0, 2)}
                      </div>
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2"
                        style={{
                          backgroundColor: `${source.color}40`,
                          borderColor: source.color,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1A2640] border-[#1E2D4A] text-xs">
                    <span style={{ color: source.color }}>
                      {source.label}: {source.probability}%
                    </span>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex mt-8 gap-4 flex-wrap">
              {sources.map((source) => (
                <div key={source.labelEn} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="font-terminal text-[10px]" style={{ color: source.color }}>
                    {source.label} {source.probability}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1A1A0A] to-[#131E35] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">AI 融合概率</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-terminal text-4xl font-bold text-[#D4AF37]">{aiConsensusPercent}</span>
              <span className="font-terminal text-xl font-bold text-[#D4AF37] mb-1">%</span>
            </div>
            <div className="font-terminal text-[10px] text-[#7A8BA8] mt-1">加权融合 · 跨源一致性与背离</div>
          </div>

          <div className="rounded-xl border border-[#D44A4A]/30 bg-gradient-to-br from-[#1A0F0F] to-[#131E35] p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#D44A4A]" />
              <span className="text-xs font-semibold text-[#D44A4A] uppercase tracking-wider">分歧评分</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-terminal text-4xl font-bold text-[#D44A4A]">{disagreementPp.toFixed(1)}</span>
              <Badge className="mb-2 font-terminal text-[10px] bg-[#D44A4A]/20 text-[#D44A4A] border-[#D44A4A]/30">
                {disagreementPp >= 25 ? "HIGH" : disagreementPp >= 15 ? "MID" : "LOW"}
              </Badge>
            </div>
            <div className="font-terminal text-[10px] text-[#7A8BA8] mt-1">四源 span（百分点）· 越大越需警惕叙事偏离</div>
          </div>

          <div className="rounded-xl border border-[#E8842A]/30 bg-gradient-to-br from-[#1A1208] to-[#131E35] p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-[#E8842A]" />
              <span className="text-xs font-semibold text-[#E8842A] uppercase tracking-wider">套利机会</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-terminal text-xs font-medium text-[#E8842A]/95 leading-snug">{arbitrationHeadline}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-terminal text-2xl font-bold text-[#E8842A]">⚠️ {arbitrationStrengthLabel}</span>
            </div>
            <div className="font-terminal text-[10px] text-[#7A8BA8]">{arbitrationDetail}</div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
