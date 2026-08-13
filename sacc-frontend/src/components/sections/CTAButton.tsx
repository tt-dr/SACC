import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CTAButtonProps {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  size?: "default" | "sm";
}

export function CTAButton({ href, label, variant = "primary", size = "default" }: CTAButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-0.5",
        size === "sm" ? "px-4 py-2 text-sm" : "min-h-[48px] px-6",
        variant === "secondary"
          ? "border border-[#e7ecf4] bg-white text-[#203158] shadow-[0_10px_20px_rgba(15,32,55,0.06)]"
          : "bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] text-white shadow-[0_14px_24px_rgba(255,122,0,0.2)]",
      )}
    >
      {label}
      {variant !== "secondary" && <ArrowRight size={18} strokeWidth={2.4} />}
    </Link>
  );
}
