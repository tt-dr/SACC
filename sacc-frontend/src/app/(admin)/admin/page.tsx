"use client";

import { useEffect, useState } from "react";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { TrafficChart } from "@/components/admin/TrafficChart";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { QuickActions } from "@/components/admin/QuickActions";
import {
  dashboardStats as fallbackStats,
  trafficTrend,
  auditLogs as fallbackAuditLogs,
  quickActions,
  type DashboardStat,
  type AuditLogItem,
} from "@/content/adminDashboard";
import {
  fetchDashboard,
  fetchAuditLogs,
  type DashboardData,
  type AuditLogApiItem,
} from "@/lib/adminApi";

function mapDashboardToStats(data: DashboardData): DashboardStat[] {
  return [
    {
      label: "站点总访问量",
      value: data.siteVisits.toLocaleString(),
      delta: "+12.4%",
      trend: "up",
      icon: "eye",
    },
    {
      label: "活跃成员",
      value: data.activeMembers.toLocaleString(),
      delta: "+5.8%",
      trend: "up",
      icon: "users",
    },
    {
      label: "成员动态",
      value: data.newsCount.toLocaleString(),
      delta: `${data.pendingNews} 篇待审`,
      trend: data.pendingNews > 0 ? "up" : "up",
      icon: "file-text",
    },
    {
      label: "文档总数",
      value: data.docsCount.toLocaleString(),
      delta: `${data.draftDocs} 篇草稿`,
      trend: "up",
      icon: "file-text",
    },
  ];
}

function mapAuditLogs(items: AuditLogApiItem[]): AuditLogItem[] {
  const moduleMap: Record<string, string> = {
    news: "成员动态",
    docs: "文档库",
    projects: "项目展示",
    users: "用户管理",
    about: "关于我们",
  };
  const actionMap: Record<string, string> = {
    create: "创建",
    update: "更新",
    delete: "删除",
  };

  return items.map((item) => {
    const time = item.timestamp
      ? new Date(item.timestamp).toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).replace(/\//g, "-")
      : "";

    return {
      id: item.id,
      time,
      actor: item.actor,
      action: actionMap[item.action] || item.action,
      resource: moduleMap[item.module] || item.module,
      detail: item.detail,
      ip: "-",
      status: "success" as const,
    };
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStat[]>(fallbackStats);
  const [auditLogs, setAuditLogs] =
    useState<AuditLogItem[]>(fallbackAuditLogs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [dashboardData, auditLogData] = await Promise.all([
        fetchDashboard(),
        fetchAuditLogs(6),
      ]);

      if (cancelled) return;

      if (dashboardData) {
        setStats(mapDashboardToStats(dashboardData));
      }
      if (auditLogData && auditLogData.length > 0) {
        setAuditLogs(mapAuditLogs(auditLogData));
      }
      setLoading(false);
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">仪表盘总览</h1>
          <p className="mt-1 text-xs text-[#64748b]">
            实时监控站点运行数据与操作记录
          </p>
        </div>
        {loading && (
          <span className="text-xs text-[#9ca3af]">数据加载中…</span>
        )}
      </div>

      <StatsPanel stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrafficChart data={trafficTrend} />
        </div>
        <div>
          <QuickActions actions={quickActions} />
        </div>
      </div>

      <AuditLogPanel logs={auditLogs} />
    </div>
  );
}
