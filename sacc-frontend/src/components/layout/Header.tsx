"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "主页", href: "/" },
  { label: "关于我们", href: "/about" },
  { label: "文档库", href: "/docs" },
  { label: "成员动态", href: "/news" },
  { label: "项目", href: "/projects" },
];

const TECH_DEPTS = [
  { label: "开发组", href: "/projects" },
  { label: "竞赛组", href: "/activities" },
  { label: "科研组", href: "/docs" },
];

export function Header() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#eceff4] bg-white/86 backdrop-blur-[18px]">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1240px] items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="inline-flex items-center gap-3 text-[#1d2638] no-underline">
          <img src="/sacc-logo.svg" alt="SACC" className="h-10 w-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <strong className="text-xl font-bold tracking-[-0.02em]">SACC</strong>
            <span className="text-xs text-[#5a6780]">Science Association of Computer College</span>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-[22px] gap-y-2" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-0.5 py-1.5 text-base font-medium text-[#2f3645] no-underline transition-colors",
                "after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-[26px] after:rounded-full after:bg-[#ff7a00] after:opacity-0 after:-translate-x-1/2 after:scale-x-50 after:transition-transform after:transition-opacity after:duration-200",
                "hover:text-[#ff7a00] hover:after:opacity-100 hover:after:scale-x-100",
                isActive(item.href) && "font-bold text-[#ff7a00] after:opacity-100 after:scale-x-100",
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* 技术部门 下拉 */}
          <div
            className="group relative inline-flex items-center"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <span className="relative cursor-default select-none px-0.5 py-1.5 text-base font-medium text-[#2f3645] transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-[26px] after:rounded-full after:bg-[#ff7a00] after:opacity-0 after:-translate-x-1/2 after:scale-x-50 after:transition-transform after:transition-opacity after:duration-200 group-hover:text-[#ff7a00] group-hover:after:opacity-100 group-hover:after:scale-x-100">
              技术部门
            </span>
            <div
              className={cn(
                "absolute left-1/2 top-full z-50 mt-2 flex -translate-x-1/2 flex-col rounded-[14px] border border-[#e7ecf4] bg-white py-2 shadow-[0_16px_36px_rgba(15,32,55,0.12)] transition-all duration-200 min-w-[120px]",
                dropdownOpen ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              {TECH_DEPTS.map((dept) => (
                <Link
                  key={dept.label}
                  href={dept.href}
                  className="block whitespace-nowrap px-5 py-2.5 text-[15px] font-medium text-[#2f3645] no-underline transition-colors hover:bg-[#f4f6fb] hover:text-[#ff7a00]"
                >
                  {dept.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <Link
          href="/join"
          className="inline-flex items-center rounded-full bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] px-5 py-2.5 font-semibold text-white no-underline shadow-[0_12px_22px_rgba(255,122,0,0.22)] transition-transform hover:-translate-y-px hover:shadow-[0_16px_26px_rgba(255,122,0,0.28)]"
        >
          加入我们
        </Link>
      </div>
    </header>
  );
}
