/**
 * adminApi — 管理后台 API 客户端（客户端用，支持 JWT）
 *
 * - 所有 /api/v1/admin/* 接口都需要 Authorization: Bearer <token>
 * - Token 从 sessionStorage 读取，key 为 sacc_admin_token
 * - 请求失败时返回 null，由调用方决定如何兜底
 * - NEXT_PUBLIC_API_BASE_URL 配置后端基地址，留空则走同源相对路径
 */

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

const TOKEN_KEY = "sacc_admin_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

function buildApiUrl(pathname: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${pathname}` : pathname;
}

interface ApiResult<T> {
  code?: number;
  message?: string;
  data?: T;
}

async function request<T>(
  pathname: string,
  options: RequestInit = {},
): Promise<T | null> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(buildApiUrl(pathname), {
      ...options,
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as ApiResult<T>;
    if (json.code !== undefined && json.code !== 200 && json.code !== 0) {
      return null;
    }
    return (json.data ?? (json as unknown as T)) as T;
  } catch {
    return null;
  }
}

export interface DashboardData {
  siteVisits: number;
  activeMembers: number;
  newsCount: number;
  docsCount: number;
  projectsCount: number;
  pendingNews: number;
  draftDocs: number;
}

export interface AuditLogApiItem {
  id: number;
  module: string;
  action: "create" | "update" | "delete";
  actor: string;
  detail: string;
  timestamp: string;
}

export async function fetchDashboard(): Promise<DashboardData | null> {
  return request<DashboardData>("/api/v1/admin/dashboard");
}

export async function fetchAuditLogs(limit = 10): Promise<AuditLogApiItem[] | null> {
  return request<AuditLogApiItem[]>(`/api/v1/admin/audit-log?limit=${limit}`);
}
