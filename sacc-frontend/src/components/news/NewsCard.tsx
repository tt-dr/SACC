import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { NewsSummary } from "@/lib/news-data";
import { formatDisplayDate } from "@/lib/markdown";
import { AuthorAvatar } from "./AuthorAvatar";

export function NewsCard({ post }: { post: NewsSummary }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex flex-col gap-3 rounded-[20px] border border-border bg-card p-[22px] text-foreground no-underline shadow-[0_12px_26px_rgba(15,32,55,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_38px_rgba(15,32,55,0.1)]"
    >
      <div className="flex items-center gap-2.5">
        <AuthorAvatar name={post.author} avatar={post.authorAvatar} />
        <div className="flex min-w-0 flex-col leading-[1.3]">
          <strong className="truncate text-[15px]">{post.author}</strong>
          {post.role ? <span className="truncate text-xs text-muted-foreground">{post.role}</span> : null}
        </div>
        {post.category ? (
          <span className="ml-auto shrink-0 rounded-full bg-[rgba(32,49,88,0.08)] px-3 py-1 text-xs font-semibold text-secondary">
            {post.category}
          </span>
        ) : null}
      </div>

      <h3 className="mt-0.5 text-[19px] font-bold leading-[1.4]">{post.title}</h3>
      <p className="line-clamp-3 text-[14.5px] leading-[1.7] text-muted-foreground">{post.summary}</p>

      {post.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[rgba(255,122,0,0.1)] px-2.5 py-0.5 text-xs text-primary">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <CalendarDays size={14} strokeWidth={2.2} />
          {formatDisplayDate(post.publishedAt)}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          阅读
          <ArrowRight size={15} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}
