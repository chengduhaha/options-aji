"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRenderProps = {
  content: string;
};

export default function MarkdownRender({ content }: MarkdownRenderProps) {
  return (
    <div className="markdown-body text-[14px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[16px] font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14px] font-semibold text-foreground mt-3 mb-1.5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold text-foreground mt-2 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-4 text-[13px] text-muted-foreground space-y-1 mb-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 text-[13px] text-muted-foreground space-y-1 mb-2">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-t border-glass-border my-4" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const inline = !className;
            if (inline) {
              return (
                <code className="bg-primary/10 text-primary px-1 py-0.5 rounded text-[11px] font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className ?? ""} font-mono text-[11px]`}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-glass border border-glass-border rounded-lg p-3 overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="w-full overflow-x-auto mb-3 rounded-lg border border-glass-border">
              <table className="w-full text-[11px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-panel text-foreground">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-glass-border px-2 py-1.5 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-glass-border px-2 py-1.5 text-muted-foreground">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
