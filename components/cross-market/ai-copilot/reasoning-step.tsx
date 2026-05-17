"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Loader2, Clock, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

export type StepStatus = "pending" | "running" | "done"

export interface ReasoningStepData {
  id: string
  stepNumber: number
  title: string
  duration?: string
  details: string[]
  status: StepStatus
  isSubAgent?: boolean
  subAgentName?: string
}

interface ReasoningStepProps {
  step: ReasoningStepData
  isLast?: boolean
}

export function ReasoningStep({ step, isLast }: ReasoningStepProps) {
  const [expanded, setExpanded] = useState(step.status === "running")

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted",
    },
    running: {
      icon: Loader2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    done: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  }

  const config = statusConfig[step.status]
  const StatusIcon = config.icon

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div 
          className={cn(
            "absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-16px)]",
            step.status === "done" ? "bg-green-500/30" : "bg-border"
          )}
        />
      )}

      <div 
        className={cn(
          "relative rounded-lg border p-3 transition-all cursor-pointer",
          config.bgColor,
          config.borderColor,
          step.status === "running" && "animate-shimmer"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            step.status === "done" ? "bg-green-500/20" : step.status === "running" ? "bg-primary/20" : "bg-muted"
          )}>
            <StatusIcon 
              className={cn(
                "w-4 h-4", 
                config.color,
                step.status === "running" && "animate-spin"
              )} 
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                Step {step.stepNumber}:
              </span>
              <h4 className="text-sm font-medium text-foreground truncate">
                {step.title}
              </h4>
              {step.duration && (
                <span className="text-[10px] text-muted-foreground font-mono ml-auto flex-shrink-0">
                  {step.duration}
                </span>
              )}
            </div>

            {/* Sub-agent badge */}
            {step.isSubAgent && step.subAgentName && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] mb-2">
                <span>Sub-agent:</span>
                <span className="font-mono">{step.subAgentName}</span>
              </div>
            )}

            {/* Expandable details */}
            <div className={cn(
              "overflow-hidden transition-all",
              expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="mt-2 space-y-1.5">
                {step.details.map((detail, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground font-mono leading-relaxed">
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Expand toggle */}
          <button className="flex-shrink-0 p-1 hover:bg-muted/50 rounded">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
