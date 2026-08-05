import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  hover?: boolean;
}

export function Card({ children, className, as: Tag = "div", hover = false }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-[20px] border border-[#e7ecf4] bg-white p-6 shadow-[0_12px_28px_rgba(15,32,55,0.05)]",
        hover && "transition-all hover:-translate-y-1 hover:shadow-[0_22px_38px_rgba(15,32,55,0.1)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
