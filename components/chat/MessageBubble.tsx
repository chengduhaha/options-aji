"use client";

import { Brain, Sparkles, User } from "lucide-react";
import StructuredOutput, { parseStructuredData } from "./StructuredOutput";
import MarkdownRender from "./MarkdownRender";

export type Message = {
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
    const traceRows = message.thinkingLines ?? [];
    const parsedRows = traceRows.map((row, idx) => {
      const [label, ...rest] = row.split("｜");
      const body = rest.join("｜").trim();
      return { id: `${idx}-${row.slice(0, 24)}`, label: label.trim(), body };
    });
    const planningCount = parsedRows.filter((row) => row.label.includes("规划")).length;
    const subagentStartCount = parsedRows.filter((row) => row.label.includes("子代理启动")).length;
    const subagentDoneCount = parsedRows.filter((row) => row.label.includes("子代理完成")).length;
    const errorCount = parsedRows.filter((row) => row.label.includes("错误")).length;
    const durationByAgentMs: Record<string, number> = {};
    for (const row of parsedRows) {
      if (!row.label.includes("子代理完成")) continue;
      const msMatch = row.body.match(/耗时\s+(\d+(?:\.\d+)?)ms/);
      const secMatch = row.body.match(/耗时\s+(\d+(?:\.\d+)?)s/);
      const agentMatch = row.body.match(/^([a-z_]+)\s+/);
      if (!agentMatch) continue;
      const agent = agentMatch[1];
      const elapsedMs = msMatch
        ? Number(msMatch[1])
        : secMatch
          ? Number(secMatch[1]) * 1000
          : 0;
      if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) continue;
      durationByAgentMs[agent] = elapsedMs;
    }
    const totalAgentMs = Object.values(durationByAgentMs).reduce((sum, value) => sum + value, 0);
    const stageDurationRows = Object.entries(durationByAgentMs).sort((a, b) => b[1] - a[1]);
    const plannedTotal = subagentStartCount > 0 ? subagentStartCount : Math.max(subagentDoneCount, 1);
    const progressRatio = Math.max(0, Math.min(1, subagentDoneCount / plannedTotal));
    const successRatePct = Math.max(
      0,
      Math.min(100, Math.round((subagentDoneCount / Math.max(subagentStartCount, 1)) * 100)),
    );
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
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>阶段进度</span>
                <span className="font-mono">
                  {subagentDoneCount}/{plannedTotal} 已完成
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-glass-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${Math.round(progressRatio * 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted">
                <span>规划 {planningCount}</span>
                <span>启动 {subagentStartCount}</span>
                <span>完成 {subagentDoneCount}</span>
                <span className={errorCount > 0 ? "text-red" : ""}>错误 {errorCount}</span>
                <span className={successRatePct < 100 ? "text-gold" : ""}>
                  成功率 {successRatePct}%
                </span>
              </div>
              {totalAgentMs > 0 && (
                <div className="text-[10px] text-muted space-y-1">
                  <div className="font-mono">总耗时 {totalAgentMs >= 1000 ? `${(totalAgentMs / 1000).toFixed(1)}s` : `${Math.round(totalAgentMs)}ms`}</div>
                  <div className="flex flex-wrap gap-2">
                    {stageDurationRows.map(([agent, ms]) => (
                      <span key={agent} className="px-1.5 py-0.5 rounded bg-glass-subtle border border-glass-border font-mono">
                        {agent}: {ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {errorCount > 0 && (
                <div className="text-[10px] text-red bg-red/10 border border-red/20 rounded px-2 py-1.5">
                  检测到执行错误，建议：先切换到快速问答模式重试；若仍失败，缩小问题范围并指定单一标的。
                </div>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2">
              {parsedRows.length === 0 ? (
                <div className="flex items-center gap-2 text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span>等待后端推送事件...</span>
                </div>
              ) : (
                parsedRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="rounded-md border border-glass-border bg-glass-subtle px-2.5 py-2 text-muted-foreground whitespace-pre-wrap break-words"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary/50">{String(idx + 1).padStart(2, "0")}.</span>
                      <span
                        className={
                          row.label.includes("子代理完成")
                            ? "text-green text-[10px] px-1.5 py-0.5 rounded bg-green/10"
                            : row.label.includes("子代理启动")
                              ? "text-blue text-[10px] px-1.5 py-0.5 rounded bg-blue/10"
                              : row.label.includes("规划")
                                ? "text-gold text-[10px] px-1.5 py-0.5 rounded bg-gold/10"
                                : row.label.includes("错误")
                                  ? "text-red text-[10px] px-1.5 py-0.5 rounded bg-red/10"
                                  : "text-primary text-[10px] px-1.5 py-0.5 rounded bg-primary/10"
                        }
                      >
                        {row.label}
                      </span>
                    </div>
                    <div>{row.body || row.label}</div>
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

  // AI response with structured output support
  const { cleanText, data } = parseStructuredData(message.content);

  return (
    <div className="flex gap-3 animate-fade-up">
      <AvatarOA />
      <div className="flex-1 min-w-0 max-w-[80%]">
        <div className="glass rounded-2xl rounded-tl-md p-4 border border-glass-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-semibold text-primary">OptionsAji AI</span>
          </div>
          {cleanText && (
            <div className="mb-2 break-words">
              <MarkdownRender content={cleanText} />
            </div>
          )}
          {data && <StructuredOutput data={data} />}
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