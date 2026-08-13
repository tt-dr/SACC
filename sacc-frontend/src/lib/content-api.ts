import type { ContentInput, ContentItem, ContentModule } from "./content-types";
import {
  mockCreate,
  mockDelete,
  mockGet,
  mockList,
  mockReorder,
  mockUpdate,
} from "./mock-content-data";

/**
 * 后台内容管理 API 客户端
 *
 * 契约来源：SACC/UIDemo/api-doc.json 与 server/internal/router/router.go
 * - 列表 / 新建 / 更新 / 上传：后端已实现，直接对接
 * - DELETE /api/v1/admin/content/:id、PUT /api/v1/admin/content/reorder：
 *   后端暂未注册，前端已按契约预留，接口不可用时自动降级到本地 mock
 *
 * 使用说明：
 * - 未配置 NEXT_PUBLIC_API_BASE_URL，或后端不可达时，自动进入本地演示模式
 * - 真实模式下收到 401 会清理 Token 并跳转 /admin/login
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const TOKEN_KEY = "sacc-admin-token";

export type BackendMode = "api" | "mock";

export interface AdminListResult {
  items: ContentItem[];
  mode: BackendMode;
}

export interface MutateResult<T> {
  item: T;
  degraded: boolean;
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let backendReady: boolean | null = null;

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

function isMockConfigured(): boolean {
  return !API_BASE;
}

async function probeBackend(): Promise<boolean> {
  if (isMockConfigured()) {
    backendReady = false;
    return false;
  }
  if (backendReady !== null) return backendReady;

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${API_BASE}/api/v1/content?module=news&pageSize=1`, {
      signal: controller.signal,
      cache: "no-store",
    });
    window.clearTimeout(timer);
    backendReady = response.ok;
  } catch {
    backendReady = false;
  }
  return backendReady;
}

async function requestAdmin<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAdminToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("sacc-admin:unauthorized"));
    throw new ApiError(401, "未登录或登录已过期，正在跳转登录页");
  }
  if (!response.ok) {
    throw new ApiError(response.status, `请求失败（${response.status}）`);
  }
  return (await response.json()) as T;
}

function normalizeItem(raw: Partial<ContentItem> & { id: number; title: string }): ContentItem {
  return {
    id: raw.id,
    module: raw.module ?? "news",
    slug: raw.slug ?? "",
    title: raw.title,
    category: raw.category ?? "",
    summary: raw.summary ?? "",
    body: raw.body ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    status: raw.status ?? "draft",
    author: raw.author ?? "",
    role: raw.role ?? "",
    coverImage: raw.coverImage ?? "",
    repoUrl: raw.repoUrl ?? "",
    progress: raw.progress ?? "",
    techStack: Array.isArray(raw.techStack) ? raw.techStack.map(String) : [],
    sortOrder: raw.sortOrder ?? 0,
    views: raw.views ?? 0,
    publishedAt: raw.publishedAt ?? "",
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

function toServerInput(input: ContentInput): Record<string, unknown> {
  const publishedAt = input.publishedAt?.trim();
  return {
    module: input.module,
    slug: input.slug ?? "",
    title: input.title,
    category: input.category ?? "",
    summary: input.summary ?? "",
    body: input.body ?? "",
    tags: input.tags ?? [],
    status: input.status ?? "draft",
    author: input.author ?? "",
    role: input.role ?? "",
    repoUrl: input.repoUrl ?? "",
    progress: input.progress ?? "",
    techStack: input.techStack ?? [],
    sortOrder: input.sortOrder ?? 0,
    publishedAt: publishedAt ? `${publishedAt.slice(0, 10)}T00:00:00Z` : "",
  };
}

export async function listAdminContent(module: ContentModule): Promise<AdminListResult> {
  if (!(await probeBackend())) {
    return { items: mockList(module), mode: "mock" };
  }

  try {
    const params = new URLSearchParams({ module, page: "1", pageSize: "100" });
    const payload = await requestAdmin<{ data: Array<Partial<ContentItem> & { id: number; title: string }> }>(
      `/api/v1/admin/content?${params.toString()}`,
    );
    return { items: payload.data.map(normalizeItem), mode: "api" };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error;
    backendReady = false;
    return { items: mockList(module), mode: "mock" };
  }
}

/**
 * 获取单条内容详情（含正文）。
 *
 * 注意：后端目前只有公开详情接口 GET /api/v1/content/:id，且仅对 published 内容开放；
 * 草稿正文在真实模式下暂无法获取，会返回 null，联调时由后端补齐后生效。
 */
export async function getAdminContentDetail(id: number): Promise<ContentItem | null> {
  if (!(await probeBackend())) {
    return mockGet(id);
  }
  try {
    const payload = await requestAdmin<{ data: Partial<ContentItem> & { id: number; title: string } }>(
      `/api/v1/content/${id}`,
    );
    return normalizeItem(payload.data);
  } catch {
    return null;
  }
}

export async function createAdminContent(input: ContentInput): Promise<MutateResult<ContentItem>> {
  if (!(await probeBackend())) {
    return { item: mockCreate(input), degraded: false };
  }
  try {
    const payload = await requestAdmin<{ data: Partial<ContentItem> & { id: number; title: string } }>(
      "/api/v1/admin/content",
      { method: "POST", body: JSON.stringify(toServerInput(input)) },
    );
    return { item: normalizeItem(payload.data), degraded: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error;
    backendReady = false;
    return { item: mockCreate(input), degraded: true };
  }
}

export async function updateAdminContent(
  id: number,
  input: ContentInput,
): Promise<MutateResult<ContentItem>> {
  if (!(await probeBackend())) {
    return { item: mockUpdate(id, input), degraded: false };
  }
  try {
    const payload = await requestAdmin<{ data: Partial<ContentItem> & { id: number; title: string } }>(
      `/api/v1/admin/content/${id}`,
      { method: "PUT", body: JSON.stringify(toServerInput(input)) },
    );
    return { item: normalizeItem(payload.data), degraded: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error;
    backendReady = false;
    return { item: mockUpdate(id, input), degraded: true };
  }
}

export async function deleteAdminContent(id: number): Promise<{ ok: boolean; degraded: boolean }> {
  if (!(await probeBackend())) {
    mockDelete(id);
    return { ok: true, degraded: false };
  }
  try {
    await requestAdmin(`/api/v1/admin/content/${id}`, { method: "DELETE" });
    return { ok: true, degraded: false };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      // 后端尚未注册 DELETE 接口：按契约降级，本地删除，交互不中断
      mockDelete(id);
      return { ok: true, degraded: true };
    }
    if (error instanceof ApiError && error.status === 401) throw error;
    throw error;
  }
}

export async function reorderAdminContent(
  module: ContentModule,
  orderedIds: number[],
): Promise<{ ok: boolean; degraded: boolean }> {
  if (!(await probeBackend())) {
    mockReorder(module, orderedIds);
    return { ok: true, degraded: false };
  }
  try {
    await requestAdmin("/api/v1/admin/content/reorder", {
      method: "PUT",
      body: JSON.stringify({ module, orderedIds }),
    });
    return { ok: true, degraded: false };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      // 后端尚未注册 reorder 接口：按契约降级，本地排序生效
      mockReorder(module, orderedIds);
      return { ok: true, degraded: true };
    }
    if (error instanceof ApiError && error.status === 401) throw error;
    throw error;
  }
}

export async function uploadAdminImage(
  file: File,
): Promise<{ url: string; filename: string; degraded: boolean }> {
  if (!(await probeBackend())) {
    return { url: URL.createObjectURL(file), filename: file.name, degraded: true };
  }
  const form = new FormData();
  form.append("file", file);
  try {
    const payload = await requestAdmin<{ data: { url: string; filename: string } }>("/api/v1/admin/upload", {
      method: "POST",
      body: form,
    });
    return { url: payload.data.url, filename: payload.data.filename, degraded: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error;
    return { url: URL.createObjectURL(file), filename: file.name, degraded: true };
  }
}

export function isMockMode(): boolean {
  return backendReady === false || isMockConfigured();
}
