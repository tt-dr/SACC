import { ArrowRight } from "lucide-react";
import type { ResourceItem } from "@/content/siteContent";

interface ResourcesProps {
  resources: ResourceItem[];
}

export function Resources({ resources }: ResourcesProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-[#f4f8ff] to-[#fff6e8] py-20">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="mb-11 text-center">
          <h2 className="m-0 mb-2.5 text-[clamp(34px,4vw,56px)] font-medium leading-[1.08] text-[#16233e]">
            学习资源
          </h2>
          <p className="m-0 text-[clamp(17px,1.8vw,22px)] leading-[1.6] text-[#62738b]">
            丰富学习资料，助力你的技术成长
          </p>
        </div>

        <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((item) => (
            <article
              key={item.label}
              className="rounded-3xl border border-[#eef1f6] bg-white/96 p-7 shadow-[0_12px_28px_rgba(23,48,86,0.06)] transition-transform hover:-translate-y-0.5"
            >
              <strong className="mb-3 inline-block text-[42px] font-bold leading-none text-[#ff7a00]">
                {item.value}
              </strong>
              <h3 className="m-0 mb-3 text-[26px] font-semibold leading-[1.25] text-[#17233b]">
                {item.label}
              </h3>
              <p className="m-0 text-base font-medium leading-[1.75] text-[#63748b]">
                {item.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-[#ff7a00]">
                了解更多
                <ArrowRight size={16} strokeWidth={2.2} />
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}