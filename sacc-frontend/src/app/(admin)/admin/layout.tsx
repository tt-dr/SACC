"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "dashboard", path: "/admin", label: "仪表盘 Dashboard" },
  { key: "users", path: "/admin/users", label: "用户管理" },
  { key: "docs", path: "/admin/docs", label: "文档库管理" },
  { key: "news", path: "/admin/news", label: "成员动态管理" },
  { key: "projects", path: "/admin/projects", label: "项目展示" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      {/* 侧栏 */}
      <aside className="flex w-[240px] flex-col gap-2 bg-[#1f2937] px-4 py-[22px] text-white">
        <div className="text-2xl font-bold">SACC Admin</div>
        <div className="text-[13px] font-medium text-[#9ca3af]">管理后台</div>

        <nav className="mt-2 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.path}
              className={cn(
                "flex min-h-[42px] items-center rounded-[10px] px-3 text-base font-medium no-underline text-white transition-colors",
                pathname === item.path
                  ? "bg-[#f97316] font-bold"
                  : "hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/12 pt-6">
          <span className="block rounded-[10px] px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 cursor-pointer">
            修改密码
          </span>
          <Link
            href="/admin/login"
            className="block rounded-[10px] px-3 py-2.5 text-sm text-white/75 no-underline hover:bg-white/10"
          >
            退出登录
          </Link>
        </div>
      </aside>

      {/* 右侧内容 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[60px] items-center justify-between gap-4 border-b border-[#e5e7eb] bg-white px-6">
          <span className="text-[13px] font-medium text-[#6b7280]">
            首页 / 管理后台
          </span>
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#111827]">
            <div className="h-8 w-8 rounded-full border-2 border-[#f97316] bg-[#e5e7eb]" />
            管理员
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
