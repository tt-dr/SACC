import {
  Users,
  FileText,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStat } from "@/content/adminDashboard";

const iconMap = {
  users: Users,
  "file-text": FileText,
  eye: Eye,
  activity: Activity,
} as const;

interface StatsPanelProps {
  stats: DashboardStat[];
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        const isUp = stat.trend === "up";
        return (
          <div
            key={stat.label}
            className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[#6b7280]">
                  {stat.label}
                </span>
                <span className="text-[28px] font-bold text-[#111827]">
                  {stat.value}
                </span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff7ed] text-[#f97316]">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  isUp ? "text-[#16a34a]" : "text-[#dc2626]",
                )}
              >
                {isUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.delta}
              </span>
              <span className="text-[#9ca3af]">较上周</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
