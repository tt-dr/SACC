"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAllNews, type NewsSummary } from "@/lib/news-data";
import { cn } from "@/lib/utils";
import { NewsCard } from "./NewsCard";
import { NewsToolbar } from "./NewsToolbar";

const ALL_AUTHORS = "全部作者";
const PAGE_SIZE = 9;

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-[20px] border border-border bg-card p-[22px]">
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-full bg-[#eef2f7]" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-3 w-24 rounded bg-[#eef2f7]" />
          <div className="h-2.5 w-16 rounded bg-[#eef2f7]" />
        </div>
      </div>
      <div className="h-5 w-3/4 rounded bg-[#eef2f7]" />
      <div className="h-3 w-full rounded bg-[#eef2f7]" />
      <div className="h-3 w-5/6 rounded bg-[#eef2f7]" />
      <div className="mt-2 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-[#eef2f7]" />
        <div className="h-5 w-14 rounded-full bg-[#eef2f7]" />
      </div>
    </div>
  );
}

export function NewsList() {
  const [items, setItems] = useState<NewsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [activeAuthor, setActiveAuthor] = useState(ALL_AUTHORS);
  const [page, setPage] = useState(1);
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchAllNews()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError("加载成员动态失败，请稍后重试。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const authors = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => {
      if (item.author) unique.add(item.author);
    });
    return [ALL_AUTHORS, ...unique];
  }, [items]);

  const filtered = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    return items
      .filter((item) => {
        if (activeAuthor !== ALL_AUTHORS && item.author !== activeAuthor) return false;
        if (!normalized) return true;
        return [item.title, item.summary, item.author, item.category, ...item.tags]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  }, [items, deferredKeyword, activeAuthor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    setPage(1);
  }, []);

  const handleAuthorChange = useCallback((value: string) => {
    setActiveAuthor(value);
    setPage(1);
  }, []);

  const handleRetry = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <>
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[20px] border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 rounded-full bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] px-6 py-2.5 font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            重新加载
          </button>
        </div>
      ) : (
        <>
          <NewsToolbar
            keyword={keyword}
            onKeywordChange={handleKeywordChange}
            authors={authors}
            activeAuthor={activeAuthor}
            onAuthorChange={handleAuthorChange}
          />

          <p className="mb-6 text-sm text-muted-foreground">
            共 {filtered.length} 篇 · 默认按发布时间倒序
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paged.map((item) => (
                <NewsCard key={item.slug} post={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              没有匹配的动态，试试更换作者或关键词。
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="上一页动态"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  aria-label={`切换到第 ${number} 页动态`}
                  className={cn(
                    "h-9 min-w-9 rounded-full border border-border bg-card px-2 text-sm text-[#47506e] transition-colors hover:text-primary",
                    number === safePage &&
                      "border-transparent bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] font-semibold text-white hover:text-white",
                  )}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="下一页动态"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

