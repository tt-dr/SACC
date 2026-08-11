import Link from "next/link";
import { ArrowLeft, FileText, PenLine } from "lucide-react";
import type { NewsSummary } from "@/lib/news-data";
import { cn } from "@/lib/utils";

interface NewsDetailSidebarProps {
  author: string;
  posts: NewsSummary[];
  currentSlug: string;
}

export function NewsDetailSidebar({ author, posts, currentSlug }: NewsDetailSidebarProps) {
  return (
    <aside
      className="sticky top-[92px] hidden flex-col gap-5 rounded-[18px] border border-border bg-card p-5 shadow-[0_12px_24px_rgba(15,32,55,0.04)] lg:flex"
      aria-label="作者文章列表"
    >
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground no-underline transition-colors hover:text-primary"
      >
        <ArrowLeft size={15} strokeWidth={2.2} />
        返回成员动态
      </Link>

      <div className="inline-flex items-center gap-2 font-bold text-secondary">
        <PenLine size={18} strokeWidth={2.2} />
        <span>{author} 的文章</span>
      </div>

      <nav className="flex flex-col gap-1">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/news/${post.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm text-[#475065] no-underline transition-colors hover:bg-[#f4f6fb] hover:text-foreground",
              post.slug === currentSlug &&
                "bg-[rgba(255,122,0,0.12)] font-semibold text-primary hover:bg-[rgba(255,122,0,0.12)] hover:text-primary",
            )}
          >
            <FileText size={15} strokeWidth={2.1} className="shrink-0 text-[#9aa4b6]" />
            <span className="truncate">{post.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
