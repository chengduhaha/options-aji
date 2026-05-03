"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";

export type AgentSseEvent =
  | { type: "thinking"; content: string | null }
  | {
      type: "data_fetched";
      content: string | null;
      resolved_ticker?: string | null;
    }
  | { type: "answer"; content: string | null }
  | { type: "done" }
  | { type: "error"; content: string | null };

/** Aligns with `ChatWindow` message rows used by SSE updates. */
export type AgentChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: boolean;
};

async function consumeSse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: {
    onEvent: (ev: AgentSseEvent) => void;
    onError?: (reason: unknown) => void;
  },
): Promise<void> {
  const decoder = new TextDecoder();
  let backlog = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();

      backlog += decoder.decode(value ?? new Uint8Array(), { stream: true });

      const blocks = backlog.split("\n\n");
      backlog = blocks.pop() ?? "";

      for (const blockRaw of blocks) {
        const lineJoin = blockRaw
          .split("\n")
          .filter((segment) => segment.startsWith("data:"))
          .map((segment) => segment.replace(/^data:\s*/, ""));
        const payload = lineJoin.join("\n");

        const trimmedPayload = payload.trim();
        if (!trimmedPayload) continue;

        let parsed: AgentSseEvent;
        try {
          parsed = JSON.parse(trimmedPayload) as AgentSseEvent;
        } catch (parseError: unknown) {
          callbacks.onError?.(parseError);
          callbacks.onEvent({
            type: "error",
            content: "SSE 解码失败（非 JSON）。",
          });
          continue;
        }

        callbacks.onEvent(parsed);
      }

      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function runAgentViaSseStream(params: {
  question: string;
  ticker: string;
  bearerToken?: string | null;
  thinkingMsgId: string;
  setMessages: Dispatch<SetStateAction<AgentChatMessage[]>>;
  sessionRef: MutableRefObject<string>;
}): Promise<void> {
  const headersRecord: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };

  if (params.bearerToken) {
    headersRecord.Authorization = `Bearer ${params.bearerToken}`;
  }

  try {
    const resp = await fetch("/api/agent/query", {
      method: "POST",
      headers: headersRecord,
      body: JSON.stringify({
        question: params.question,
        ticker: params.ticker,
        session_id: params.sessionRef.current,
      }),
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text();
      params.setMessages((prev) =>
        prev.map((member) =>
          member.id === params.thinkingMsgId
            ? {
                ...member,
                thinking: false,
                content:
                  resp.status === 503
                    ? `Agent 后端未就绪：${text || "请先配置 OPTIONS_AJI_BACKEND_URL。"}`
                    : `Agent 后端错误 (${resp.status}): ${text || "未知错误"}`,
              }
            : member,
        ),
      );
      return;
    }

    await consumeSse(resp.body.getReader(), {
      onEvent: (eventItem) => {
        if (
          eventItem.type === "thinking" ||
          eventItem.type === "data_fetched" ||
          eventItem.type === "error"
        ) {
          const label =
            eventItem.type === "error"
              ? `错误：${eventItem.content ?? ""}`
              : eventItem.content ?? "";

          params.setMessages((membership) =>
            membership.map((messageEntry) =>
              messageEntry.id === params.thinkingMsgId
                ? {
                    ...messageEntry,
                    content: label,
                    thinking: true,
                  }
                : messageEntry,
            ),
          );
        }

        if (eventItem.type === "answer") {
          params.setMessages((membership) =>
            membership.map((messageEntry) =>
              messageEntry.id === params.thinkingMsgId
                ? {
                    ...messageEntry,
                    content: eventItem.content ?? "",
                    thinking: false,
                  }
                : messageEntry,
            ),
          );
        }
      },
    });
  } catch (connectionError: unknown) {
    const messageLabel =
      connectionError instanceof Error
        ? connectionError.message
        : "网络错误";

    params.setMessages((memberList) =>
      memberList.map((messageEntry) =>
        messageEntry.id === params.thinkingMsgId
          ? {
              ...messageEntry,
              thinking: false,
              content: `${messageLabel}，无法连接 Agent SSE。`,
            }
          : messageEntry,
      ),
    );
  }
}
