"use client";

import Link from "next/link";
import { Plus, Upload, Users, Settings, ChevronRight } from "lucide-react";
import type { QuickAction } from "@/content/adminDashboard";

const iconMap = {
  plus: Plus,
  upload: Upload,
  users: Users,
  settings: Settings,
} as const;

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#111827]">快捷操作</h3>
        <p className="mt-0.5 text-xs text-[#9ca3af]">常用管理功能快速入口</p>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          const isExternal = action.href === "#";
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-1 items-center gap-3 rounded-lg border border-[#e5e7eb] p-3 no-underline transition-all hover:border-[#f97316] hover:bg-[#fff7ed]"
              aria-disabled={isExternal}
              onClick={(e) => isExternal && e.preventDefault()}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff7ed] text-[#f97316] group-hover:bg-[#f97316] group-hover:text-white transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[#111827] group-hover:text-[#f97316] transition-colors">
                  {action.label}
                </div>
                <div className="text-xs text-[#9ca3af] truncate">
                  {action.description}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#d1d5db] group-hover:text-[#f97316] group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
