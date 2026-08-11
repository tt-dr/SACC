import type { Metadata } from "next";
import { PageHero } from "@/components/sections";
import { NewsList } from "@/components/news/NewsList";

export const metadata: Metadata = {
  title: "成员动态",
  description: "SACC 成员发布的技术博客与成长记录，支持按作者筛选与关键词搜索。",
};

export default function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Member Blog"
        title="成员动态"
        description="成员发布的技术博客与成长记录，按发布时间排序，支持按作者筛选与关键词搜索。"
      />
      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4">
          <NewsList />
        </div>
      </section>
    </>
  );
}

