"use client";

import { Brain, Sparkles, User } from "lucide-react";
import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: boolean;
  thinkingLines?: string[];
};

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-slide-down">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="glass rounded-2xl rounded-tr-md px-4 py-3 text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-secondary" />
          </div>
        </div>
      </div>
    );
  }

  // Thinking state - show real SSE trace
  if (message.thinking) {
    return (
      <div className="flex gap-3 animate-fade-up">
        <AvatarOA />
        <div className="flex flex-col gap-3 pt-1 min-w-0 flex-1 max-w-[80%]">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[12px] text-primary font-semibold">
              Agent 执行轨迹
            </span>
            <span className="text-[10px] text-muted">SSE 实时推送</span>
          </div>
          
          <div className="glass rounded-xl p-4 border border-primary/20">
            <div className="max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5">
              {(message.thinkingLines ?? []).length === 0 ? (
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span>等待后端推送事件...</span>
                </div>
              ) : (
                message.thinkingLines?.map((row, idx) => (
                  <div 
                    key={`${idx}-${row.slice(0, 48)}`} 
                    className="flex items-start gap-2 text-muted-foreground whitespace-pre-wrap break-words"
                  >
                    <span className="text-primary/50 flex-shrink-0">{String(idx + 1).padStart(2, "0")}.</span>
                    <span>{row}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse stagger-1" />
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse stagger-2" />
            </div>
            <span>正在生成回复...</span>
          </div>
        </div>
      </div>
    );
  }

  // AI response
  return (
    <div className="flex gap-3 animate-fade-up">
      <AvatarOA />
      <div className="flex-1 min-w-0 max-w-[80%]">
        <div className="glass rounded-2xl rounded-tl-md p-4 border border-glass-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-semibold text-primary">OptionsAji AI</span>
          </div>
          <div className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarOA() {
  return (
    <div className="relative flex-shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/20">
        OA
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green rounded-full border-2 border-background" />
    </div>
  );
}
