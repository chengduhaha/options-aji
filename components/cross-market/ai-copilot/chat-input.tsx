"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles } from "lucide-react"

const suggestions = [
  "扫描今日最强背离",
  "我的持仓有威胁吗",
  "Trump 最新推文影响哪些股",
  "给我一个本周作业 plan",
]

interface ChatInputProps {
  onSend?: (message: string) => void
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
  }

  return (
    <div className="border-t border-border bg-card/50 p-4 space-y-3">
      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(suggestion)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-xs text-foreground transition-colors border border-border hover:border-primary/30"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问 AI 任何关于事件、概率、组合的问题..."
            className="min-h-[52px] max-h-[200px] resize-none bg-input border-border focus:border-primary pr-4 text-sm"
            rows={1}
          />
        </div>
        <Button 
          onClick={handleSend}
          disabled={!message.trim()}
          className="h-[52px] px-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-muted-foreground">
        AI 建议仅供参考,不构成投资建议。请结合自身情况独立判断。
      </p>
    </div>
  )
}
