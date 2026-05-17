"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface ProbabilitySourceCardProps {
  label: string
  labelEn: string
  probability: number
  color: string
  bgColor: string
  borderColor: string
  subLabel: string
  detail: string
  tooltip: string
  rank: number
}

function getProbabilityColor(prob: number) {
  if (prob < 30) return "#D44A4A"
  if (prob <= 60) return "#D4AF37"
  return "#3DBF7A"
}

export function ProbabilitySourceCard({
  label,
  labelEn,
  probability,
  color,
  bgColor,
  borderColor,
  subLabel,
  detail,
  tooltip,
}: ProbabilitySourceCardProps) {
  const probColor = getProbabilityColor(probability)

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="relative flex flex-col rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: bgColor,
          borderColor: borderColor,
        }}
      >
        {/* Source label */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-foreground leading-none">{label}</div>
            <div
              className="font-terminal text-[10px] mt-1 uppercase tracking-wider"
              style={{ color }}
            >
              {labelEn}
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 rounded-md hover:bg-white/5 transition-colors">
                <Info className="w-3.5 h-3.5 text-[#4A5A73]" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[220px] bg-[#1A2640] border-[#1E2D4A] text-xs text-[#7A8BA8]"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Big probability number */}
        <div className="flex items-end gap-1 mb-1">
          <span
            className="font-terminal text-5xl font-bold leading-none tabular-nums"
            style={{ color: probColor }}
          >
            {probability}
          </span>
          <span
            className="font-terminal text-xl font-bold leading-none mb-1"
            style={{ color: probColor }}
          >
            %
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-1 rounded-full bg-white/5 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${probability}%`,
              background: `linear-gradient(90deg, ${color}80, ${probColor})`,
            }}
          />
        </div>

        {/* Sub label */}
        <div className="text-[11px] text-[#7A8BA8] leading-relaxed mb-2">{subLabel}</div>

        {/* Detail */}
        <div
          className="font-terminal text-[10px] px-2 py-1 rounded-md"
          style={{
            background: `${color}12`,
            color: color,
            borderLeft: `2px solid ${color}40`,
          }}
        >
          {detail}
        </div>
      </div>
    </TooltipProvider>
  )
}
