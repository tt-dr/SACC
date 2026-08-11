import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HeroAction } from "@/content/siteContent";

const HERO_ORBS = [
  { className: "right-[10%] top-[14%] h-[320px] w-[320px] bg-[#ff9d2a]", delay: "0s" },
  { className: "bottom-[14%] left-[8%] h-[380px] w-[380px] bg-[#facc15]", delay: "1.4s" },
  { className: "right-[24%] top-[46%] h-[220px] w-[220px] bg-[#f59e0b]", delay: "2.6s" },
];

interface HomeHeroProps {
  fullName: string;
  tagline: string;
  logoUrl: string;
  actions: HeroAction[];
}

export function HomeHero({ fullName, tagline, logoUrl, actions }: HomeHeroProps) {
  const primaryActions = actions.filter((action) => action.tone !== "secondary");
  const secondaryActions = actions.filter((action) => action.tone === "secondary");

  return (
    <section className="relative flex w-full items-center overflow-hidden bg-gradient-to-br from-[#fff8ea] via-[#fff4da] to-[#fff9ee] px-4 py-11">
      {HERO_ORBS.map((orb, index) => (
        <div
          key={index}
          className={`absolute rounded-full opacity-20 blur-[80px] home-orb-breathe ${orb.className}`}
          style={{ animationDelay: orb.delay }}
        />
      ))}

      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center gap-[18px] text-center">
        <div className="relative mb-1 inline-flex items-center justify-center">
          <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,173,38,0.32)_0%,rgba(255,173,38,0)_74%)] blur-[28px] home-glow-breathe" />
          <img
            src={logoUrl}
            alt="SACC Logo"
            className="home-logo-sway relative h-[clamp(220px,22vw,320px)] w-[clamp(220px,22vw,320px)] object-contain drop-shadow-[0_20px_30px_rgba(255,175,0,0.16)]"
          />
        </div>

        <p className="m-0 text-[clamp(24px,4vw,58px)] font-normal leading-[1.1] text-[#17223b]">
          {fullName}
        </p>
        <p className="m-0 max-w-[960px] text-[clamp(18px,1.6vw,28px)] leading-[1.7] text-[#5a6780]">
          {tagline}
        </p>

        {(primaryActions.length > 0 || secondaryActions.length > 0) && (
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {primaryActions.map((action) => (
              <Link
                key={action.to + action.label}
                href={action.to}
                className="inline-flex min-h-[54px] items-center gap-2.5 rounded-full bg-gradient-to-b from-[#ff8a00] to-[#ff6f00] px-7 text-white no-underline shadow-[0_16px_28px_rgba(255,138,0,0.2)] transition-transform hover:-translate-y-0.5"
              >
                <span>{action.label}</span>
                <ArrowRight size={18} strokeWidth={2.4} />
              </Link>
            ))}
            {secondaryActions.map((action) => (
              <Link
                key={action.to + action.label}
                href={action.to}
                className="inline-flex min-h-[54px] items-center rounded-full border-2 border-[#ff8a00] bg-white/94 px-7 text-[#ff7a00] no-underline shadow-[0_12px_24px_rgba(255,255,255,0.26)] transition-transform hover:-translate-y-0.5"
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}