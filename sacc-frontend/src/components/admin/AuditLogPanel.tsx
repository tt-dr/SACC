import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLogItem } from "@/content/adminDashboard";

interface AuditLogPanelProps {
  logs: AuditLogItem[];
}

export function AuditLogPanel({ logs }: AuditLogPanelProps) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">审计日志</h3>
          <p className="mt-0.5 text-xs text-[#9ca3af]">最近的操作记录</p>
        </div>
        <Link
          href="#"
          className="text-xs font-medium text-[#f97316] no-underline hover:underline"
        >
          查看全部 →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f3f4f6] bg-[#fafafa] text-left text-xs font-medium text-[#6b7280]">
              <th className="px-5 py-2.5 font-medium">时间</th>
              <th className="px-5 py-2.5 font-medium">操作人</th>
              <th className="px-5 py-2.5 font-medium">操作</th>
              <th className="px-5 py-2.5 font-medium">资源</th>
              <th className="px-5 py-2.5 font-medium">详情</th>
              <th className="px-5 py-2.5 font-medium">IP</th>
              <th className="px-5 py-2.5 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-[#f3f4f6] last:border-b-0 transition-colors hover:bg-[#fafafa]"
              >
                <td className="px-5 py-3 text-xs text-[#6b7280] whitespace-nowrap">
                  {log.time}
                </td>
                <td className="px-5 py-3 font-medium text-[#111827]">
                  {log.actor}
                </td>
                <td className="px-5 py-3 text-[#374151]">{log.action}</td>
                <td className="px-5 py-3 text-[#374151]">{log.resource}</td>
                <td className="px-5 py-3 text-[#6b7280] max-w-[240px] truncate">
                  {log.detail}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-[#6b7280]">
                  {log.ip}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      log.status === "success"
                        ? "bg-[#dcfce7] text-[#166534]"
                        : "bg-[#fee2e2] text-[#991b1b]",
                    )}
                  >
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {log.status === "success" ? "成功" : "失败"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
