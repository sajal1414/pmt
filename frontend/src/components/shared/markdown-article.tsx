import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function CodeBlock({ lang, children }: { lang?: string | null; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-[#0f172a] text-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export function MarkdownArticle({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("article-markdown text-sm leading-relaxed text-fg-1", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-5 mb-3 text-xl font-bold tracking-tight text-fg-1 first:mt-0 border-b border-border/60 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2.5 text-lg font-bold tracking-tight text-fg-1 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3.5 mb-2 text-base font-semibold text-fg-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1.5 text-sm font-semibold text-fg-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2.5 leading-relaxed text-fg-2 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 ml-5 list-disc space-y-1 text-fg-2 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children, start }) => (
            <ol start={start} className="my-3 ml-5 list-decimal space-y-1 text-fg-2 marker:text-primary font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-lg border-l-4 border-primary bg-primary/5 px-4 py-2 text-sm italic text-fg-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-fg-1">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-fg-1">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || "");
            const raw = String(children);
            if (match || raw.includes("\n")) {
              return <CodeBlock lang={match ? match[1] : null}>{children}</CodeBlock>;
            }
            return (
              <code className="rounded border border-border/80 bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-secondary/70 font-semibold text-fg-1">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-xs font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/60 px-3 py-2 text-fg-2">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-accent/20 last:border-b-0">{children}</tr>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
