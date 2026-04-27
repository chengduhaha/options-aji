import { openrouter, routeModel, SYSTEM_PROMPT } from "@/lib/openrouter";
import { TOOLS, executeTool } from "@/lib/tools";
import type { NextRequest } from "next/server";
import type OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const encoder = new TextEncoder();
const sse = (obj: object) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

const TOOL_STATUS: Record<string, string> = {
  get_gex_data:      "拉取 GEX 数据",
  get_market_data:   "获取市场行情",
  get_recent_news:   "扫描实时新闻",
  evaluate_strategy: "评估期权策略",
};

export async function POST(req: NextRequest) {
  const { messages, symbol = "SPY", tier = "free" } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const model = routeModel(messages[messages.length - 1]?.content ?? "", tier);
  const history: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + `\n\n当前关注标的：${symbol}` },
    ...messages,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      let iterations = 0;
      let usedTools = false;

      try {
        // Phase 1: Tool-call loop (non-streaming; sends status events to client)
        while (iterations < 5) {
          iterations++;

          const resp = await openrouter.chat.completions.create({
            model,
            messages: history,
            tools: TOOLS,
            tool_choice: "auto",
            max_tokens: 2048,
          });

          const choice = resp.choices[0];

          // No more tool calls — determine how to respond
          if (!choice.message.tool_calls?.length || choice.finish_reason === "stop") {
            if (!usedTools) {
              // Simple Q&A, no tools — send full content as a single delta
              controller.enqueue(sse({ meta: { model, iterations } }));
              controller.enqueue(sse({ delta: choice.message.content ?? "" }));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            // Tools were used; break to Phase 2 (streaming synthesis)
            break;
          }

          // Notify client which tools are being called
          for (const tc of choice.message.tool_calls) {
            controller.enqueue(sse({ status: TOOL_STATUS[tc.function.name] ?? "分析数据" }));
          }

          usedTools = true;
          history.push(choice.message);

          const results = await Promise.all(
            choice.message.tool_calls.map(async (tc) => {
              const args = JSON.parse(tc.function.arguments || "{}");
              const result = await executeTool(tc.function.name, args);
              return { role: "tool" as const, tool_call_id: tc.id, content: result };
            })
          );
          history.push(...results);
        }

        // Phase 2: Stream the final synthesis response
        controller.enqueue(sse({ meta: { model, iterations } }));

        const streamResp = await openrouter.chat.completions.create({
          model,
          messages: history,
          stream: true,
          max_tokens: 2048,
        });

        for await (const chunk of streamResp) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(sse({ delta }));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(sse({ error: msg }));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
