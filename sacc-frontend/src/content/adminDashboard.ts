/**
 * 管理后台仪表盘数据类型 + 本地兜底数据
 *
 * 后续接入后端 API（如 /api/v1/admin/dashboard、/api/v1/admin/audit-logs）后，
 * 类型定义保持不变，仅替换数据来源即可。
 */

export interface DashboardStat {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: "users" | "file-text" | "eye" | "activity";
}

export interface TrafficPoint {
  label: string;
  pv: number;
  uv: number;
}

export interface AuditLogItem {
  id: number;
  time: string;
  actor: string;
  action: string;
  resource: string;
  detail: string;
  ip: string;
  status: "success" | "failed";
}

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: "plus" | "upload" | "users" | "settings";
}

export const dashboardStats: DashboardStat[] = [
  {
    label: "总成员数",
    value: "528",
    delta: "+12.4%",
    trend: "up",
    icon: "users",
  },
  {
    label: "内容总数",
    value: "186",
    delta: "+8.2%",
    trend: "up",
    icon: "file-text",
  },
  {
    label: "今日访问量",
    value: "3,247",
    delta: "+15.6%",
    trend: "up",
    icon: "eye",
  },
  {
    label: "活跃用户",
    value: "412",
    delta: "-3.1%",
    trend: "down",
    icon: "activity",
  },
];

export const trafficTrend: TrafficPoint[] = [
  { label: "周一", pv: 1820, uv: 620 },
  { label: "周二", pv: 2140, uv: 710 },
  { label: "周三", pv: 2680, uv: 890 },
  { label: "周四", pv: 2420, uv: 780 },
  { label: "周五", pv: 3150, uv: 1020 },
  { label: "周六", pv: 2890, uv: 940 },
  { label: "周日", pv: 3247, uv: 1105 },
];

export const auditLogs: AuditLogItem[] = [
  {
    id: 1,
    time: "2026-08-23 14:32:08",
    actor: "朱子晨",
    action: "发布内容",
    resource: "成员动态",
    detail: "发布文章《Next.js 16 新特性探索》",
    ip: "192.168.1.101",
    status: "success",
  },
  {
    id: 2,
    time: "2026-08-23 13:15:42",
    actor: "杨皓天",
    action: "用户登录",
    resource: "认证",
    detail: "管理员登录后台系统",
    ip: "192.168.1.105",
    status: "success",
  },
  {
    id: 3,
    time: "2026-08-23 11:48:20",
    actor: "李文杰",
    action: "编辑内容",
    resource: "文档库",
    detail: "更新文档《Git 协作规范》v2.3",
    ip: "10.0.0.23",
    status: "success",
  },
  {
    id: 4,
    time: "2026-08-23 10:02:55",
    actor: "未知用户",
    action: "登录失败",
    resource: "认证",
    detail: "密码错误（第 3 次）",
    ip: "203.0.113.42",
    status: "failed",
  },
  {
    id: 5,
    time: "2026-08-23 09:30:11",
    actor: "杨亚楠",
    action: "创建项目",
    resource: "项目展示",
    detail: "新建项目「SACC 官网重构」",
    ip: "192.168.1.118",
    status: "success",
  },
  {
    id: 6,
    time: "2026-08-22 22:14:36",
    actor: "朱子晨",
    action: "修改密码",
    resource: "账户设置",
    detail: "管理员修改登录密码",
    ip: "192.168.1.101",
    status: "success",
  },
];

export const quickActions: QuickAction[] = [
  {
    label: "发布新内容",
    description: "快速创建一篇成员动态或文档",
    href: "/admin/news",
    icon: "plus",
  },
  {
    label: "上传资源",
    description: "上传图片、文档等媒体资源",
    href: "/admin/docs",
    icon: "upload",
  },
  {
    label: "用户管理",
    description: "查看和管理后台管理员账户",
    href: "/admin/users",
    icon: "users",
  },
  {
    label: "系统设置",
    description: "站点配置、权限与安全设置",
    href: "#",
    icon: "settings",
  },
];
