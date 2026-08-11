import { Hash, ListTree } from "lucide-react";
import type { TocEntry } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function NewsToc({ toc }: { toc: TocEntry[] }) {
  return (
    <aside
      className="sticky top-[92px] hidden flex-col gap-3 rounded-[18px] border border-border bg-card p-[18px] lg:flex"
      aria-label="本文目录"
    >
      <div className="inline-flex items-center gap-2 text-sm font-bold text-secondary">
        <ListTree size={16} strokeWidth={2.2} />
        本文目录
      </div>
      {toc.length > 0 ? (
        <nav className="flex flex-col gap-0.5 border-l-2 border-border">
          {toc.map((entry) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className={cn(
                "-ml-0.5 flex items-center gap-1.5 border-l-2 border-transparent px-2.5 py-1.5 text-[13px] text-muted-foreground no-underline transition-colors hover:border-[rgba(255,122,0,0.4)] hover:text-primary",
                entry.level === 3 && "pl-6 text-[12.5px]",
              )}
            >
              <Hash size={12} strokeWidth={2.4} className="shrink-0 text-[#b6bfce]" />
              <span className="truncate">{entry.text}</span>
            </a>
          ))}
        </nav>
      ) : (
        <p className="m-0 text-[13px] text-[#9aa4b6]">本文暂无小节。</p>
      )}
    </aside>
  );
}
