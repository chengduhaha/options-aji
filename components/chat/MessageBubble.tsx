"use client";

import type { ReactNode } from "react";
import type { Message } from "./ChatWindow";

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

  if (message.thinking) {
    return (
      <div className="flex gap-3 animate-fade-up">
        <AvatarOA />
        <div className="pt-1.5">
          <ThinkingIndicator status={message.toolStatus} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-up">
      <AvatarOA />
      <div className="flex-1 min-w-0 border border-border2/60 rounded-[12px] rounded-tl-[4px] bg-panel/50 px-3.5 py-3">
        <div className="text-[11px] text-gold font-semibold mb-2 font-mono">
          OA · OptionsAji AI
        </div>
        <div className="text-[13.5px] text-text leading-relaxed">
          {renderMarkdown(message.content, message.streaming)}
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

function ThinkingIndicator({ status }: { status?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span className="flex gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </span>
      <span className="text-muted">{status ?? "分析中"}</span>
    </div>
  );
}

// ── Inline Markdown Renderer ─────────────────────────────────────────────────
// Handles: **bold**, *italic*, `inline code`

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let pos = 0;
  let buf = "";
  let k = 0;

  const flush = () => {
    if (buf) {
      parts.push(buf);
      buf = "";
    }
  };

  while (pos < text.length) {
    // **bold**
    if (text[pos] === "*" && text[pos + 1] === "*") {
      const end = text.indexOf("**", pos + 2);
      if (end !== -1) {
        flush();
        parts.push(
          <strong key={k++} className="font-semibold text-text">
            {text.slice(pos + 2, end)}
          </strong>
        );
        pos = end + 2;
        continue;
      }
    }

    // `inline code`
    if (text[pos] === "`") {
      const end = text.indexOf("`", pos + 1);
      if (end !== -1) {
        flush();
        parts.push(
          <code
            key={k++}
            className="bg-white/10 px-1.5 py-0.5 rounded text-[12px] font-mono text-gold"
          >
            {text.slice(pos + 1, end)}
          </code>
        );
        pos = end + 1;
        continue;
      }
    }

    // *italic* (but not **)
    if (text[pos] === "*" && text[pos + 1] !== "*") {
      const end = text.indexOf("*", pos + 1);
      if (end !== -1) {
        flush();
        parts.push(
          <em key={k++} className="italic text-muted/80">
            {text.slice(pos + 1, end)}
          </em>
        );
        pos = end + 1;
        continue;
      }
    }

    buf += text[pos];
    pos++;
  }

  flush();
  return parts.length === 0 ? "" : parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ── Block Markdown Renderer ──────────────────────────────────────────────────
// Handles: headings, code blocks, lists, blockquotes, paragraphs, hr

function renderMarkdown(text: string, streaming?: boolean): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={k++}
          className="bg-bg border border-border2 rounded-[6px] p-3 overflow-x-auto my-2"
        >
          <code className="text-[12px] font-mono text-green leading-relaxed whitespace-pre">
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      i++; // skip closing ```
      continue;
    }

    // Headings (#, ##, ###)
    const hMatch = line.match(/^(#{1,3}) (.+)/);
    if (hMatch) {
      const lvl = hMatch[1].length;
      const cls =
        lvl === 1
          ? "text-[16px] font-bold text-text mb-2 mt-3 first:mt-0"
          : lvl === 2
          ? "text-[14px] font-bold text-text mb-1.5 mt-2 first:mt-0"
          : "text-[13.5px] font-semibold text-gold mb-1 mt-2 first:mt-0";
      nodes.push(
        <div key={k++} className={cls}>
          {renderInline(hMatch[2])}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
      nodes.push(<hr key={k++} className="border-border2 my-3" />);
      i++;
      continue;
    }

    // Unordered list (- or *)
    if (line.match(/^[*-] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[*-] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={k++} className="space-y-1 mb-2.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 items-start text-[13.5px]">
              <span className="text-gold flex-shrink-0 select-none mt-px">·</span>
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list (1. 2. ...)
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={k++} className="space-y-1 mb-2.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 items-start text-[13.5px]">
              <span className="text-gold font-mono text-[11px] flex-shrink-0 min-w-[1.2em] mt-px">
                {j + 1}.
              </span>
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote (>)
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote
          key={k++}
          className="border-l-2 border-gold/40 pl-3 py-0.5 my-2 text-muted italic text-[13px]"
        >
          {renderInline(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // Empty line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-block lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3} /) &&
      !lines[i].match(/^[*-] /) &&
      !lines[i].match(/^\d+\. /) &&
      !lines[i].startsWith("> ") &&
      !lines[i].startsWith("```") &&
      !lines[i].match(/^-{3,}$/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      nodes.push(
        <p key={k++} className="mb-2.5 last:mb-0 leading-relaxed">
          {renderInline(paraLines.join(" "))}
        </p>
      );
    }
  }

  // Append blinking cursor while streaming
  if (streaming) {
    nodes.push(
      <span
        key="cursor"
        className="inline-block w-[2px] h-[1em] bg-gold/80 animate-blink ml-0.5 align-text-bottom"
      />
    );
  }

  return <>{nodes}</>;
}
