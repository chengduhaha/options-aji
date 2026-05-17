"use client";

import { Clock, Target, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface EventHeaderProps {
  badgeLabel: string;
  titleText: string;
  metaTicker?: string;
  eventTimeDisplay: string;
  settlementNote: string;
  countdownPrimary: string;
  countdownSub: string;
  showArbitragePill: boolean;
}

export function EventHeader({
  badgeLabel,
  titleText,
  metaTicker,
  eventTimeDisplay,
  settlementNote,
  countdownPrimary,
  countdownSub,
  showArbitragePill,
}: EventHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1E2D4A] bg-[#0F1729]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-2 border-b border-[#1E2D4A]/60">
        <div className="flex items-center gap-3">
          <span className="font-terminal text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
            OptionsAji
          </span>
          <span className="text-[#4A5A73] text-xs">|</span>
          <span className="text-[#7A8BA8] text-xs font-terminal">事件概率全景</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#3DBF7A] inline-block" />
          <span className="font-terminal text-[10px] text-[#3DBF7A] uppercase tracking-wider">实时数据</span>
        </div>
      </div>

      <div className="px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Badge className="font-terminal text-[10px] px-2 py-0.5 bg-[#1E2D4A] text-[#D4AF37] border-[#D4AF37]/30 uppercase tracking-wider">
                {badgeLabel}
              </Badge>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight text-balance">{titleText}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {metaTicker ? (
                  <>
                    <span className="flex items-center gap-1 text-[#7A8BA8] text-xs font-terminal">
                      <Target className="w-3 h-3" />
                      涉及标的: <span className="text-[#4A8FD4]">{metaTicker}</span>
                    </span>
                    <span className="text-[#4A5A73] text-xs">·</span>
                  </>
                ) : null}
                <span className="text-[#7A8BA8] text-xs font-terminal">
                  事件时间: <span className="text-foreground/80">{eventTimeDisplay}</span>
                </span>
                <span className="text-[#4A5A73] text-xs">·</span>
                <span className="flex items-center gap-1 text-[#7A8BA8] text-xs font-terminal">
                  <CheckCircle2 className="w-3 h-3 text-[#3DBF7A]" />
                  结算: {settlementNote}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#1A2640] border border-[#D4AF37]/20 rounded-lg px-4 py-2.5">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <div className="flex flex-col">
                <span className="font-terminal text-[10px] text-[#7A8BA8] uppercase tracking-wider leading-none mb-0.5">
                  {countdownSub}
                </span>
                <span className="font-terminal text-base font-bold text-[#D4AF37] leading-none">⏰ {countdownPrimary}</span>
              </div>
            </div>
            {showArbitragePill ? (
              <div className="flex items-center gap-1.5 bg-[#D44A4A]/10 border border-[#D44A4A]/30 rounded-lg px-3 py-2.5">
                <Zap className="w-3.5 h-3.5 text-[#D44A4A]" />
                <span className="font-terminal text-xs font-semibold text-[#D44A4A] uppercase tracking-wider">
                  套利信号
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
