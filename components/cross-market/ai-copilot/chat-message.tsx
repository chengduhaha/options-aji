"use client"

import { cn } from "@/lib/utils"
import { User, Bot, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { ReasoningStep, type ReasoningStepData } from "./reasoning-step"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  reasoningSteps?: ReasoningStepData[]
  patternMatch?: {
    pattern: string
    estimatedTime: string
    tokenBudget: string
    actionCount: number
  }
  finalAnswer?: {
    title: string
    sections: {
      title: string
      icon: string
      content: React.ReactNode
    }[]
    nextActions?: {
      id: string
      label: string
    }[]
  }
}

export function ChatMessage({ role, content, reasoningSteps, patternMatch, finalAnswer }: ChatMessageProps) {
  const [showReasoning, setShowReasoning] = useState(true)
  const isUser = role === "user"

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        isUser ? "bg-muted" : "bg-gradient-to-br from-primary to-primary/70"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      {/* Message content */}
      <div className={cn(
        "flex-1 min-w-0",
        isUser ? "text-right" : "text-left"
      )}>
        {/* User message */}
        {isUser && (
          <div className="inline-block max-w-[85%] p-3 rounded-lg bg-muted text-foreground text-sm">
            {content}
          </div>
        )}

        {/* Assistant message with reasoning */}
        {!isUser && (
          <div className="space-y-4">
            {/* Pattern match badge */}
            {patternMatch && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-0">
                  🟣 已匹配推理模板
                </Badge>
                <code className="text-xs font-mono text-purple-300">{patternMatch.pattern}</code>
                <div className="w-full mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span>⏱️ 预计推理时间: {patternMatch.estimatedTime}</span>
                  <span>Token 预算: {patternMatch.tokenBudget}</span>
                  <span>调用 Action: {patternMatch.actionCount} 个</span>
                </div>
              </div>
            )}

            {/* Reasoning trace */}
            {reasoningSteps && reasoningSteps.length > 0 && (
              <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
                <button 
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                    <span className="text-xs font-medium text-foreground">推理追踪</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({reasoningSteps.filter(s => s.status === "done").length}/{reasoningSteps.length} 步骤完成)
                    </span>
                  </div>
                  {showReasoning ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {showReasoning && (
                  <div className="p-3 pt-0 space-y-3">
                    {reasoningSteps.map((step, idx) => (
                      <ReasoningStep 
                        key={step.id} 
                        step={step} 
                        isLast={idx === reasoningSteps.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Final answer card */}
            {finalAnswer && (
              <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
                {/* Gold accent line */}
                <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />
                
                <div className="p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {finalAnswer.title}
                  </h3>

                  {finalAnswer.sections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span>{section.icon}</span>
                        {section.title}
                      </h4>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </div>
                    </div>
                  ))}

                  {/* Next actions */}
                  {finalAnswer.nextActions && (
                    <div className="pt-3 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-3">
                        🔄 你想要我下一步做什么?
                      </h4>
                      <div className="space-y-2">
                        {finalAnswer.nextActions.map((action) => (
                          <label 
                            key={action.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Checkbox id={action.id} />
                            <span className="text-sm text-foreground">{action.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
