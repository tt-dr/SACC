import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: { label: string; href: string; variant?: "primary" | "secondary" }[];
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, actions, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#fff8ea] via-[#fff4da] to-[#fbfcff] px-4 py-16">
      <div className="container mx-auto">
        {eyebrow && (
          <span className="inline-flex items-center rounded-full bg-[rgba(255,122,0,0.12)] px-3.5 py-1.5 text-[13px] font-semibold tracking-wider text-[#ff6a00]">
            {eyebrow}
          </span>
        )}
        <h1 className={cn("font-bold tracking-[-0.02em]", eyebrow ? "mt-4" : "", "text-4xl sm:text-5xl")}>
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#5a6780]">{description}</p>
        )}
        {actions && actions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3.5">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 font-semibold transition-transform hover:-translate-y-0.5",
                  action.variant === "secondary"
                    ? "border border-[#e7ecf4] bg-white text-[#203158] shadow-[0_10px_20px_rgba(15,32,55,0.06)]"
                    : "bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] text-white shadow-[0_14px_24px_rgba(255,122,0,0.2)]",
                )}
              >
                {action.label}
                {action.variant !== "secondary" && <ArrowRight size={18} strokeWidth={2.4} />}
              </Link>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
