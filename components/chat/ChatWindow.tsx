"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import MessageBubble from "./MessageBubble";
import RightPanel from "./RightPanel";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: boolean;
};

const QUICK_PROMPTS = [
  "GEX 分析",
  "策略推荐",
  "持仓评估",
  "IV 分析",
  "解释概念",
];

const TICKERS = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA", "AMZN", "MSFT"];
const MODES = ["快速问答", "深度分析", "策略评估"] as const;

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState("SPY");
  const [mode, setMode] = useState<(typeof MODES)[number]>("快速问答");
  const [rightOpen, setRightOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    const thinkingMsg: Message = {
      id: Date.now().toString() + "-think",
      role: "assistant",
      content: "",
      thinking: true,
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput("");
    setLoading(true);

    // Build history for API (exclude thinking placeholders)
    const history = [...messages, userMsg]
      .filter((m) => !m.thinking)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, symbol: ticker }),
      });

      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMsg.id
            ? { ...m, content: data.content ?? data.error ?? "未知错误", thinking: false }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMsg.id
            ? { ...m, content: "网络错误，请重试。", thinking: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Center chat column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border2 bg-panel2 flex-shrink-0">
          {/* Ticker selector */}
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="bg-panel border border-border2 text-text text-[12px] px-2.5 py-1.5 rounded-[6px] font-mono focus:outline-none focus:border-border cursor-pointer"
          >
            {TICKERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Mode tabs */}
          <div className="flex gap-1 bg-white/[0.03] border border-border2 p-0.5 rounded-[6px]">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={clsx(
                  "px-2.5 py-1 rounded-[4px] text-[11.5px] transition-all",
                  mode === m
                    ? "bg-gold-dim border border-border text-gold"
                    : "text-muted hover:text-text"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={newChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border border-border2 text-[11.5px] text-muted hover:text-text hover:border-border transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              新对话
            </button>
            <button
              onClick={() => setRightOpen((v) => !v)}
              className="p-1.5 rounded-[6px] border border-border2 text-muted hover:text-text transition-all"
              title={rightOpen ? "收起右侧面板" : "展开右侧面板"}
            >
              {rightOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <WelcomeScreen ticker={ticker} onPrompt={sendMessage} />
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 flex-shrink-0">
          {/* Quick prompts */}
          <div className="flex gap-2 mb-2 flex-wrap">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setInput(p + " ")}
                className="px-2.5 py-1 rounded-full border border-border2 text-[11px] text-muted hover:text-gold hover:border-border transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`问任何关于 ${ticker} 的期权问题...`}
              rows={1}
              className="flex-1 bg-panel border border-border2 text-text text-[13.5px] px-3.5 py-3 rounded-[10px] resize-none focus:outline-none focus:border-border placeholder:text-muted/60 transition-all min-h-[46px] max-h-[160px]"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 160) + "px";
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={clsx(
                "w-[46px] h-[46px] rounded-[10px] flex items-center justify-center transition-all flex-shrink-0",
                input.trim() && !loading
                  ? "bg-gold text-bg hover:bg-gold/90"
                  : "bg-panel border border-border2 text-muted cursor-not-allowed"
              )}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted/50 mt-1.5 text-center">
            仅供教育参考，不构成投资建议 · Enter 发送，Shift+Enter 换行
          </p>
        </div>
      </div>

      {/* Right panel */}
      {rightOpen && <RightPanel ticker={ticker} />}
    </div>
  );
}

function WelcomeScreen({
  ticker,
  onPrompt,
}: {
  ticker: string;
  onPrompt: (p: string) => void;
}) {
  const suggestions = [
    `${ticker} 现在的 GEX 环境怎么样？适合做什么策略？`,
    `分析 ${ticker} 当前的 IV 水平，是否适合卖方策略？`,
    `${ticker} 的 Put Wall 和 Call Wall 在哪里？`,
    `帮我评估 Credit Put Spread 的风险收益比`,
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-up">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-[#a8832a] flex items-center justify-center text-bg font-bold text-lg mb-4">
        OA
      </div>
      <h2 className="text-[18px] font-semibold text-text mb-1">
        OptionsAji AI 分析师
      </h2>
      <p className="text-[13px] text-muted mb-8">
        实时 GEX 数据 · 期权链分析 · 交易策略建议
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPrompt(s)}
            className="text-left px-3.5 py-3 rounded-[8px] bg-panel border border-border2 text-[12.5px] text-muted hover:text-text hover:border-border transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
