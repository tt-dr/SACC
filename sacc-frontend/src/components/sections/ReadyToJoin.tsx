import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CtaSection } from "@/content/siteContent";

interface ReadyToJoinProps {
  cta: CtaSection;
}

export function ReadyToJoin({ cta }: ReadyToJoinProps) {
  return (
    <section className="bg-gradient-to-b from-[#ff8a00] to-[#ffb000] py-20">
      <div className="mx-auto w-full max-w-[1280px] px-6 text-center">
        <h2 className="m-0 mb-2.5 text-[clamp(34px,4vw,56px)] font-medium leading-[1.08] text-white">
          {cta.title}
        </h2>
        <p className="m-0 mx-auto max-w-3xl text-[clamp(17px,1.8vw,22px)] leading-[1.6] text-white">
          {cta.description}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href={cta.primaryAction.to}
            className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-white/96 px-7 text-[#ff7a00] no-underline shadow-[0_16px_28px_rgba(255,138,0,0.2)] transition-transform hover:-translate-y-0.5"
          >
            {cta.primaryAction.label}
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>
          <Link
            href={cta.secondaryAction.to}
            className="inline-flex min-h-[54px] items-center rounded-full border-2 border-white/70 px-7 text-white no-underline transition-transform hover:-translate-y-0.5"
          >
            {cta.secondaryAction.label}
          </Link>
        </div>
      </div>
    </section>
  );
}