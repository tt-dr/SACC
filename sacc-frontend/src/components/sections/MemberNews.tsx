import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import type { NewsItem } from "@/content/siteContent";

interface MemberNewsProps {
  news: NewsItem[];
}

export function MemberNews({ news }: MemberNewsProps) {
  const items = news.slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="mb-11 flex items-end justify-between gap-6 text-left">
          <div>
            <h2 className="m-0 mb-2.5 text-[clamp(34px,4vw,56px)] font-medium leading-[1.08] text-[#16233e]">
              成员动态
            </h2>
            <p className="m-0 text-[clamp(17px,1.8vw,22px)] leading-[1.6] text-[#62738b]">
              成员们的技术博客与成长记录
            </p>
          </div>
          <Link href="/news" className="inline-flex items-center gap-2 text-base font-semibold text-[#ff7a00] no-underline transition-transform hover:-translate-y-0.5">
            更多动态
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>

        <div className="grid gap-[18px]">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/news/${item.slug}`}
              className="grid items-center gap-[22px] rounded-3xl border border-[#f4dcc0] bg-gradient-to-br from-[#fff8ef] to-[#fff2df] p-6 shadow-[0_12px_30px_rgba(198,129,28,0.08)] no-underline transition-transform hover:-translate-y-0.5 md:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <span className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-[20px] bg-gradient-to-b from-[#fb923c] to-[#f59e0b] text-white">
                <Newspaper size={28} strokeWidth={2.2} />
              </span>
              <span className="min-w-0">
                <span className="mb-2 inline-block text-sm font-semibold text-[#ff7a00]">
                  {item.date}
                </span>
                <h3 className="m-0 truncate text-[26px] font-semibold leading-[1.25] text-[#17233b] md:whitespace-normal">
                  {item.title}
                </h3>
              </span>
              <ArrowRight className="hidden text-[#ff7a00] md:block" size={18} strokeWidth={2.2} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}