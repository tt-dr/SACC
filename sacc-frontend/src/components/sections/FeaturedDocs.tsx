import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { DocItem } from "@/content/siteContent";

const VISUAL_GRADIENTS = [
  "bg-gradient-to-br from-[#fb923c] to-[#facc15]",
  "bg-gradient-to-br from-[#f59e0b] to-[#fde68a]",
  "bg-gradient-to-br from-[#f97316] to-[#fcd34d]",
];

interface FeaturedDocsProps {
  docs: DocItem[];
}

export function FeaturedDocs({ docs }: FeaturedDocsProps) {
  const items = docs.slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-[#fff8ef] to-[#fff2df] py-20">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="mb-11 flex items-end justify-between gap-6 text-left">
          <div>
            <h2 className="m-0 mb-2.5 text-[clamp(34px,4vw,56px)] font-medium leading-[1.08] text-[#16233e]">
              精选文档
            </h2>
            <p className="m-0 text-[clamp(17px,1.8vw,22px)] leading-[1.6] text-[#62738b]">
              从这里快速上手项目
            </p>
          </div>
          <Link href="/docs" className="inline-flex items-center gap-2 text-base font-semibold text-[#ff7a00] no-underline transition-transform hover:-translate-y-0.5">
            查看全部
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </div>

        <div className="grid gap-[22px] md:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.slug}
              className="overflow-hidden rounded-3xl border border-[#eee8dd] bg-white/96 shadow-[0_18px_34px_rgba(125,77,12,0.09)] transition-transform hover:-translate-y-0.5"
            >
              <div className={`relative min-h-[240px] ${VISUAL_GRADIENTS[index % VISUAL_GRADIENTS.length]}`}>
                <div className="absolute !inset-auto bottom-5 right-6 h-[120px] w-[120px] rounded-full bg-white/16 blur-[4px]" />
                <span className="absolute right-[18px] top-[18px] inline-flex min-h-[40px] items-center gap-2 rounded-full bg-white/94 px-3.5 text-[#ff7a00] shadow-[0_10px_22px_rgba(255,255,255,0.24)]">
                  <Calendar size={15} strokeWidth={2.2} />
                  <span>{item.category}</span>
                </span>
              </div>
              <div className="p-[26px_26px_30px]">
                <h3 className="m-0 mb-3 text-[26px] font-semibold leading-[1.25] text-[#17233b]">
                  {item.title}
                </h3>
                <p className="m-0 text-base leading-[1.75] font-medium text-[#63748b]">
                  {item.description}
                </p>
                <Link href={`/docs/${item.slug}`} className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-[#ff7a00] no-underline transition-transform hover:-translate-y-0.5">
                  查看详情
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}