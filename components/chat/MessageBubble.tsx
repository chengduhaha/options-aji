"use client";

import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: boolean;
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

  // Thinking state
  if (message.thinking) {
    return (
      <div className="flex gap-3 animate-fade-up">
        <AvatarOA />
        <div className="flex flex-col gap-2 pt-1">
          <ThinkingSteps />
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

const THINKING_STEPS = ["拉取市场数据", "分析 GEX 环境", "生成策略建议"];

function ThinkingSteps() {
  return (
    <div className="flex flex-col gap-1.5">
      {THINKING_STEPS.map((step, i) => (
        <div
          key={step}
          className="flex items-center gap-2 text-[12px] text-muted"
          style={{ animationDelay: `${i * 0.5}s` }}
        >
          <span
            className={clsx(
              "w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] flex-shrink-0",
              i === 0
                ? "border-gold text-gold animate-pulse-dot"
                : "border-border2"
            )}
          >
            {i === 0 ? "●" : "○"}
          </span>
          <span className={i === 0 ? "text-text" : "text-muted/50"}>
            {step}
            {i === 0 && (
              <span className="ml-1 animate-blink">...</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
