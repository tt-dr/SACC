"use client";

import { Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsToolbarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  authors: string[];
  activeAuthor: string;
  onAuthorChange: (value: string) => void;
}

export function NewsToolbar({
  keyword,
  onKeywordChange,
  authors,
  activeAuthor,
  onAuthorChange,
}: NewsToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <label className="inline-flex min-w-[240px] max-w-[360px] flex-1 items-center gap-2.5 rounded-full border border-border bg-card px-4 py-[11px] text-[#9aa4b6]">
        <Search size={18} strokeWidth={2.2} />
        <input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="搜索标题、摘要或标签"
          aria-label="搜索成员动态"
          className="w-full flex-1 border-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="按作者筛选">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Users size={15} strokeWidth={2.2} />
          作者
        </span>
        {authors.map((author) => (
          <button
            key={author}
            type="button"
            onClick={() => onAuthorChange(author)}
            className={cn(
              "rounded-full border border-border bg-card px-3.5 py-[7px] text-[13px] text-[#47506e] transition-all hover:border-[rgba(255,122,0,0.4)] hover:text-primary",
              activeAuthor === author &&
                "border-transparent bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] font-semibold text-white hover:text-white",
            )}
          >
            {author}
          </button>
        ))}
      </div>
    </div>
  );
}
