"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, MessageSquare, ChevronRight, Zap, Search, Crosshair, BarChart3 } from "lucide-react"

interface ReasoningPattern {
  id: string
  type: "reactive" | "investigative" | "crossover" | "analytical"
  name: string
  active?: boolean
}

interface ConversationHistory {
  id: string
  title: string
  timestamp: string
}

const patterns: ReasoningPattern[] = [
  { id: "1", type: "reactive", name: "KOL Tweet Reaction", active: true },
  { id: "2", type: "reactive", name: "Earnings Pre-Move", active: true },
  { id: "3", type: "investigative", name: "Geopolitical Cascade", active: true },
  { id: "4", type: "investigative", name: "Multi-Asset Catalyst Chain", active: true },
  { id: "5", type: "crossover", name: "4-Source Probability Fusion", active: true },
  { id: "6", type: "crossover", name: "Insider vs Retail Divergence", active: true },
  { id: "7", type: "analytical", name: "Position Threat Assessment", active: true },
  { id: "8", type: "analytical", name: "Strategy Recommendation", active: true },
]

const conversations: ConversationHistory[] = [
  { id: "1", title: "霍尔木兹海峡再开放怎么布局", timestamp: "2小时前" },
  { id: "2", title: "NVDA 财报前我该做什么", timestamp: "昨天" },
  { id: "3", title: "Trump 刚发推影响哪些股票", timestamp: "2天前" },
  { id: "4", title: "我的 TSLA Iron Condor 现在危险吗", timestamp: "3天前" },
]

const patternTypeConfig = {
  reactive: { color: "bg-blue-500", icon: Zap, label: "Reactive" },
  investigative: { color: "bg-purple-500", icon: Search, label: "Investigative" },
  crossover: { color: "bg-yellow-500", icon: Crosshair, label: "Crossover" },
  analytical: { color: "bg-green-500", icon: BarChart3, label: "Analytical" },
}

export function ReasoningPatternsSidebar() {
  const [selectedConversation, setSelectedConversation] = useState<string>("1")

  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Reasoning Patterns Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">推理模板</h2>
        </div>
        
        <ScrollArea className="h-[280px]">
          <div className="space-y-1.5 pr-3">
            {patterns.map((pattern) => {
              const config = patternTypeConfig[pattern.type]
              return (
                <div
                  key={pattern.id}
                  className="group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className={cn("w-2 h-2 rounded-full", config.color)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {config.label}
                    </span>
                    <p className="text-xs text-foreground truncate">{pattern.name}</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation History Section */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">对话历史</h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-md transition-all",
                  selectedConversation === conversation.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                )}
              >
                <p className={cn(
                  "text-xs truncate mb-1",
                  selectedConversation === conversation.id ? "text-primary" : "text-foreground"
                )}>
                  {conversation.title}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {conversation.timestamp}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Brand Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">OA</span>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">OptionsAji</p>
            <p className="text-[10px] text-muted-foreground">AI Copilot v2.1</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
