import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Hash, ListTree } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHero } from "@/components/sections";
import { AuthorAvatar } from "@/components/news/AuthorAvatar";
import { NewsDetailSidebar } from "@/components/news/NewsDetailSidebar";
import { NewsToc } from "@/components/news/NewsToc";
import { fetchAllNews, fetchNewsDetail } from "@/lib/news-data";
import {
  childrenToText,
  extractToc,
  formatDisplayDate,
  isSafeLinkHref,
  slugifyHeading,
} from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchNewsDetail(slug);
  return {
    title: post ? post.title : "成员动态",
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const post = await fetchNewsDetail(slug);
  if (!post) notFound();

  const allNews = await fetchAllNews();
  const authorPosts = allNews.filter((item) => item.author === post.author);
  const toc = extractToc(post.body);

  const usedHeadings = new Map<string, number>();

  const markdownComponents: Components = {
    h2: ({ children }) => {
      const text = childrenToText(children);
      const occurrence = (usedHeadings.get(text) ?? 0) + 1;
      usedHeadings.set(text, occurrence);
      return (
        <h2
          id={slugifyHeading(text, occurrence)}
          className="mb-3 mt-8 scroll-mt-[92px] text-[22px] font-bold leading-[1.3]"
        >
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const text = childrenToText(children);
      const occurrence = (usedHeadings.get(text) ?? 0) + 1;
      usedHeadings.set(text, occurrence);
      return (
        <h3
          id={slugifyHeading(text, occurrence)}
          className="mb-2.5 mt-6 scroll-mt-[92px] text-lg font-semibold"
        >
          {children}
        </h3>
      );
    },
    p: ({ children }) => <p className="my-3.5 leading-[1.85] text-[#333c4f]">{children}</p>,
    a: ({ href, children }) => {
      if (!isSafeLinkHref(href)) {
        return <span className="text-foreground">{children}</span>;
      }
      return (
        <a href={href} className="text-primary underline-offset-4 hover:underline">
          {children}
        </a>
      );
    },
    ul: ({ children }) => (
      <ul className="my-4 ml-5 flex list-disc flex-col gap-2 leading-[1.75]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 ml-5 flex list-decimal flex-col gap-2 leading-[1.75]">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    code: ({ className, children }) => {
      const isBlock = typeof className === "string" && className.includes("language-");
      if (isBlock) {
        return (
          <code className={cn("block overflow-x-auto bg-transparent p-0 font-mono text-[0.9em] text-white", className)}>
            {children}
          </code>
        );
      }
      return (
        <code className="rounded-md bg-[#f0f2f7] px-1.5 py-0.5 font-mono text-[0.9em] text-[#c2410c]">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-4 overflow-x-auto rounded-xl bg-[#0f1727] p-4 text-sm text-white">{children}</pre>
    ),
  };

  return (
    <>
      <PageHero eyebrow="成员动态" title={post.title}>
        <p className="mt-4 inline-flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
          <AuthorAvatar name={post.author} avatar={post.authorAvatar} size={28} />
          <span>{post.author}</span>
          {post.role ? <span>· {post.role}</span> : null}
          <CalendarDays size={15} strokeWidth={2.2} className="text-[#b6bfce]" />
          <span>{formatDisplayDate(post.publishedAt)}</span>
        </p>
      </PageHero>

      <section className="py-8">
        <div className="container mx-auto grid grid-cols-1 items-start gap-7 px-4 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
          <NewsDetailSidebar author={post.author} posts={authorPosts} currentSlug={post.slug} />

          {toc.length > 0 ? (
            <details className="mb-5 rounded-[18px] border border-border bg-card p-4 lg:hidden">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-secondary">
                <ListTree size={16} strokeWidth={2.2} />
                本文目录
              </summary>
              <nav className="mt-3 flex flex-col gap-0.5 border-l-2 border-border">
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
            </details>
          ) : null}

          <article className="min-w-0 rounded-[20px] border border-border bg-card p-6 shadow-[0_14px_30px_rgba(15,32,55,0.05)] sm:p-8 md:p-9">
            <Link
              href="/news"
              className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground no-underline transition-colors hover:text-primary lg:hidden"
            >
              <ArrowLeft size={15} strokeWidth={2.2} />
              返回成员动态
            </Link>

            {post.tags.length > 0 ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[rgba(255,122,0,0.1)] px-2.5 py-0.5 text-xs text-primary">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {post.body}
            </ReactMarkdown>
          </article>

          <NewsToc toc={toc} />
        </div>
      </section>
    </>
  );
}
