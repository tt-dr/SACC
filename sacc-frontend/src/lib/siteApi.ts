/**
 * siteApi — 前台站点数据加载（服务端）
 *
 * 核心接口: GET /api/v1/public/bootstrap
 *   返回格式: { code: 0, message: "ok", data: BootstrapData }
 *   请求失败或后端未配置时自动回退到本地 fallbackSiteContent 兜底渲染
 *
 * API_BASE_URL：后端服务地址（可选）。
 *   - 配置后 = `${API_BASE_URL}/api/v1/public/bootstrap`
 *   - 未配置时使用相对路径 /api/v1/...（依赖同源代理或反向代理）
 */
import { fallbackSiteContent, type BootstrapData } from "@/content/siteContent";

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

function buildApiUrl(pathname: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${pathname}` : pathname;
}

interface BootstrapResponse {
  code?: number;
  message?: string;
  data?: Partial<BootstrapData>;
}

function normalizePayload(payload: Partial<BootstrapData> | null | undefined): BootstrapData {
  if (!payload || typeof payload !== "object") {
    return fallbackSiteContent;
  }

  return {
    ...fallbackSiteContent,
    ...payload,
    site: {
      ...fallbackSiteContent.site,
      ...(payload.site || {}),
    },
    home: {
      ...fallbackSiteContent.home,
      ...(payload.home || {}),
    },
  };
}

export interface LoadSiteContentResult {
  data: BootstrapData;
  source: "remote" | "fallback";
  error: string | null;
}

export async function loadSiteContent(): Promise<LoadSiteContentResult> {
  try {
    const response = await fetch(buildApiUrl("/api/v1/public/bootstrap"), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`bootstrap 接口请求失败：HTTP ${response.status}`);
    }

    const payload = (await response.json()) as BootstrapResponse | Partial<BootstrapData> | null;
    const responseData =
      payload && typeof payload === "object" && "data" in payload
        ? payload.data
        : (payload as Partial<BootstrapData> | null | undefined);

    return {
      data: normalizePayload(responseData),
      source: "remote",
      error: null,
    };
  } catch (error) {
    return {
      data: fallbackSiteContent,
      source: "fallback",
      error: error instanceof Error ? error.message : "站点数据读取失败",
    };
  }
}