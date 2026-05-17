"use client";

import { useRef, useState } from "react";
import { ReasoningPatternsSidebar } from "@/components/cross-market/ai-copilot/reasoning-patterns-sidebar";
import { OntologyInspector } from "@/components/cross-market/ai-copilot/ontology-inspector";
import { ChatMessage } from "@/components/cross-market/ai-copilot/chat-message";
import { ChatInput } from "@/components/cross-market/ai-copilot/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReasoningStepData } from "@/components/cross-market/ai-copilot/reasoning-step";
import { queryCopilot } from "@/lib/crossMarket";

type Turn = {
  id: string;
  role: "user" | "assistant";
  userContent?: string;
  reasoningSteps?: ReasoningStepData[];
  finalText?: string;
  error?: string;
};

const NEXT_ACTIONS = [
  { id: "1", label: "扫描今日最强背离" },
  { id: "2", label: "解释当前 Ontology Pattern" },
  { id: "3", label: "总结风险与监控清单" },
  { id: "4", label: "给出组合对冲思路（示意）" },
];

export function CopilotClient() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleSend = async (message: string) => {
    const turnId = `t-${Date.now()}`;
    setTurns((prev) => [...prev, { id: turnId, role: "user", userContent: message }]);
    setBusy(true);
    const t0 = performance.now();

    try {
      const res = await queryCopilot(message);
      const t1 = performance.now();
      const prepMs = Math.max(80, Math.min(800, (t1 - t0) * 0.15));
      const modelMs = Math.max(100, t1 - t0 - prepMs);

      const steps: ReasoningStepData[] = [
        {
          id: `${turnId}-1`,
          stepNumber: 1,
          title: "接收查询并路由 Agent",
          duration: `${(prepMs / 1000).toFixed(1)}s`,
          status: "done",
          details: [
            `query=${message.slice(0, 200)}${message.length > 200 ? "…" : ""}`,
            "POST /api/copilot/query（Next → FastAPI）",
          ],
        },
        {
          id: `${turnId}-2`,
          stepNumber: 2,
          title: "Supervisor · 生成回复",
          duration: `${(modelMs / 1000).toFixed(1)}s`,
          status: "done",
          isSubAgent: true,
          subAgentName: "OptionsAji Supervisor",
          details: ["模型输出已返回（纯文本，无结构化 trace）"],
        },
      ];

      setTurns((prev) => [
        ...prev,
        {
          id: `${turnId}-a`,
          role: "assistant",
          reasoningSteps: steps,
          finalText: res.error ? `（服务返回错误）${res.error}` : res.response,
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "请求失败";
      setTurns((prev) => [
        ...prev,
        {
          id: `${turnId}-a`,
          role: "assistant",
          error: msg,
          reasoningSteps: [
            {
              id: `${turnId}-e`,
              stepNumber: 1,
              title: "请求失败",
              duration: "—",
              status: "done",
              details: [msg],
            },
          ],
        },
      ]);
    } finally {
      setBusy(false);
      queueMicrotask(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <div className="flex h-[calc(100vh-52px)] bg-background">
      <ReasoningPatternsSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex-shrink-0 h-14 border-b border-border flex items-center justify-between px-4 bg-card/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">AI</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">本体 Copilot</h1>
              <p className="text-[10px] text-muted-foreground">
                JSON Agent（/api/copilot/query），与「AI 分析师」SSE 分流
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-green-400">{busy ? "思考中" : "在线"}</span>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {turns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                输入问题开始对话 · 推理步骤与耗时由前端根据真实请求计量生成
              </p>
            ) : null}
            {turns.map((t) => {
              if (t.role === "user") {
                return <ChatMessage key={t.id} role="user" content={t.userContent ?? ""} />;
              }
              return (
                <ChatMessage
                  key={t.id}
                  role="assistant"
                  content=""
                  patternMatch={{
                    pattern: "LiveQuery · Supervisor",
                    estimatedTime: "10–60s",
                    tokenBudget: "N/A",
                    actionCount: 1,
                  }}
                  reasoningSteps={t.reasoningSteps}
                  finalAnswer={
                    t.finalText
                      ? {
                          title: "分析结果",
                          sections: [
                            {
                              icon: "📋",
                              title: "模型输出",
                              content: (
                                <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed">
                                  {t.finalText}
                                </pre>
                              ),
                            },
                          ],
                          nextActions: NEXT_ACTIONS,
                        }
                      : t.error
                        ? {
                            title: "错误",
                            sections: [
                              {
                                icon: "⚠️",
                                title: "请求失败",
                                content: (
                                  <p className="text-destructive text-sm">{t.error}</p>
                                ),
                              },
                            ],
                            nextActions: NEXT_ACTIONS,
                          }
                        : undefined
                  }
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <ChatInput onSend={handleSend} />
      </main>

      <OntologyInspector />
    </div>
  );
}
