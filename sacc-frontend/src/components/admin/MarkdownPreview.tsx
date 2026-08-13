"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  source: string;
  className?: string;
}

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        "max-h-[480px] overflow-y-auto rounded-lg border border-[#e7ecf4] bg-[#fafbfd] p-4 text-sm leading-6 text-[#1d2638]",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 border-b border-[#e7ecf4] pb-2 text-lg font-bold text-[#132544]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-bold text-[#132544]">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-bold text-[#132544]">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-[#ff6a00] underline">
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children }) => (
            <code
              className={cn(
                "rounded bg-[#eef1f6] px-1 py-0.5 font-mono text-[13px] text-[#203158]",
                codeClassName,
              )}
            >
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-[#1f2937] p-3 text-[13px] leading-5 text-white">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-4 border-[#ff7a00] pl-3 text-[#5a6780]">
              {children}
            </blockquote>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt ?? ""} className="my-3 max-w-full rounded-lg border border-[#e7ecf4]" />
          ),
          hr: () => <hr className="my-4 border-[#e7ecf4]" />,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#e7ecf4] bg-[#eef1f6] px-2 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-[#e7ecf4] px-2 py-1.5">{children}</td>,
        }}
      >
        {source || "*暂无内容*"}
      </ReactMarkdown>
    </div>
  );
}
