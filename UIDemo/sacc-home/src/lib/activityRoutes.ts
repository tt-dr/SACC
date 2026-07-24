const ACTIVITY_DETAIL_FALLBACK_ROUTE = '/activities/detail'

const ACTIVITY_SLUG_BY_TITLE = {
  '编程马拉松 2025': 'programming-marathon-2025',
  '2025 编程马拉松': 'programming-marathon-2025',
  'AI 技术研讨会': 'ai-tech-seminar',
  'AI 与机器学习技术研讨会': 'ai-tech-seminar',
  'AI 应用研讨会': 'ai-tech-seminar',
  '开源工作坊': 'open-source-workshop',
  '开源项目贡献工作坊': 'open-source-workshop',
  '开源协作工作坊': 'open-source-workshop',
}

export function resolveActivitySlugByTitle(title) {
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''

  if (!normalizedTitle) {
    return ''
  }

  return ACTIVITY_SLUG_BY_TITLE[normalizedTitle] || ''
}

export function resolveActivityRouteByTitle(title, fallbackRoute = ACTIVITY_DETAIL_FALLBACK_ROUTE) {
  const slug = resolveActivitySlugByTitle(title)

  if (!slug) {
    return fallbackRoute
  }

  return `/activities/${slug}`
}

export { ACTIVITY_DETAIL_FALLBACK_ROUTE }
