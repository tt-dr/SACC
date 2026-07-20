/**
 * siteApi — 前台站点数据加载
 *
 * 核心接口: GET /api/v1/public/bootstrap
 *   返回格式: { code: 0, message: "ok", data: BootstrapData }
 *   BootstrapData 包含 siteInfo / navigation / home / about / news / docs / projects / team / gallery / faq / footer
 *   调用失败时前端使用 fallbackSiteContent 兜底渲染
 *
 * 补充接口:
 *   GET /api/v1/content          — 公开内容分页列表（可选，用于按需加载更多）
 *   GET /api/v1/content/{id}     — 单条公开内容详情（可选）
 */
import { fallbackSiteContent } from '../content/siteContent'
import type { SiteContent } from '../content/siteContent'

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}`.trim().replace(/\/+$/, '')

interface BootstrapResponse {
  data?: Partial<SiteContent>
}

interface LoadSiteContentOptions {
  signal?: AbortSignal
}

interface LoadSiteContentResult {
  data: SiteContent
  source: 'fallback' | 'remote'
  error: string | null
}

function buildApiUrl(pathname) {
  if (!API_BASE_URL) {
    return pathname
  }

  return `${API_BASE_URL}${pathname}`
}

function normalizePayload(payload: Partial<SiteContent> | null | undefined): SiteContent {
  if (!payload || typeof payload !== 'object') {
    return fallbackSiteContent
  }

  return {
    ...fallbackSiteContent,
    ...payload,
    site: {
      ...fallbackSiteContent.site,
      ...(payload.site || {}),
    },
  }
}

export async function loadSiteContent({ signal }: LoadSiteContentOptions = {}): Promise<LoadSiteContentResult> {
  try {
    const response = await fetch(buildApiUrl('/api/v1/public/bootstrap'), {
      signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`bootstrap 接口请求失败：HTTP ${response.status}`)
    }

    const payload = (await response.json()) as BootstrapResponse | Partial<SiteContent> | null
    const responseData =
      payload && typeof payload === 'object' && 'data' in payload
        ? payload.data
        : (payload as Partial<SiteContent> | null | undefined)

    return {
      data: normalizePayload(responseData),
      source: 'remote',
      error: null,
    }
  } catch (error) {
    return {
      data: fallbackSiteContent,
      source: 'fallback',
      error: error instanceof Error ? error.message : '站点数据读取失败',
    }
  }
}
