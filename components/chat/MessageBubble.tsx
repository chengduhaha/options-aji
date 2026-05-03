"use client";

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
        <div className="max-w-[75%] bg-panel border border-border2 text-text text-[13.5px] px-3.5 py-2.5 rounded-[12px] rounded-tr-[4px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Thinking — show real SSE trace (no canned “pull market data” bullets).
  if (message.thinking) {
    return (
      <div className="flex gap-3 animate-fade-up">
        <AvatarOA />
        <div className="flex flex-col gap-2 pt-1 min-w-0 flex-1">
          <div className="text-[11px] text-gold font-semibold uppercase tracking-wide">
            Agent 执行轨迹 · SSE
          </div>
          <div className="max-h-48 overflow-y-auto rounded-[8px] border border-border2/70 bg-black/25 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-muted space-y-1">
            {(message.thinkingLines ?? []).length === 0 ? (
              <span className="text-muted animate-blink">等待后端推送事件…</span>
            ) : (
              message.thinkingLines?.map((row, idx) => (
                <div key={`${idx}-${row.slice(0, 48)}`} className="text-text/90 whitespace-pre-wrap break-words">
                  <span className="text-muted/60">{idx + 1}. </span>
                  {row}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-3.5 h-3.5 rounded-full border border-gold text-gold flex items-center justify-center text-[8px] animate-pulse-dot">
              ●
            </span>
            正在生成回复…
          </div>
        </div>
      </div>
    );
  }

  // AI response
  return (
    <div className="flex gap-3 animate-fade-up">
      <AvatarOA />
      <div className="flex-1 min-w-0 border border-border2/60 rounded-[12px] rounded-tl-[4px] bg-panel/50 px-3.5 py-3">
        <div className="text-[11px] text-gold font-semibold mb-2 font-mono">
          OA · OptionsAji AI
        </div>
        <div className="text-[13.5px] text-text leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}

function AvatarOA() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-[#a8832a] flex items-center justify-center text-[10px] font-bold text-bg flex-shrink-0 mt-0.5">
      OA
    </div>
  );
}
