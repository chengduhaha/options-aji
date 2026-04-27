import { openrouter, routeModel, SYSTEM_PROMPT } from "@/lib/openrouter";
import { TOOLS, executeTool } from "@/lib/tools";
import type { NextRequest } from "next/server";
import type OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, symbol = "SPY", tier = "free" } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  // Check API key
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  const model = routeModel(messages[messages.length - 1]?.content ?? "", tier);
  const systemMessage: OpenAI.Chat.ChatCompletionSystemMessageParam = {
    role: "system",
    content: SYSTEM_PROMPT + `\n\n当前关注标的：${symbol}`,
  };

  const history: OpenAI.Chat.ChatCompletionMessageParam[] = [
    systemMessage,
    ...messages,
  ];

  // ReAct loop — max 6 iterations to prevent infinite loops
  let iterations = 0;
  const MAX_ITER = 6;

  while (iterations < MAX_ITER) {
    iterations++;

    const response = await openrouter.chat.completions.create({
      model,
      messages: history,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 2048,
    });

    const choice = response.choices[0];
    history.push(choice.message);

    // Done — return the final answer
    if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
      return Response.json({
        content: choice.message.content,
        model,
        iterations,
        usage: response.usage,
      });
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      choice.message.tool_calls.map(async (tc) => {
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await executeTool(tc.function.name, args);
        return {
          role: "tool" as const,
          tool_call_id: tc.id,
          content: result,
        };
      })
    );

    history.push(...toolResults);
  }

  // Fallback if max iterations reached
  return Response.json({
    content: "分析超时，请换一个更具体的问题重试。",
    model,
    iterations,
  });
}
