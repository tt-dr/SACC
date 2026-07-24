import { describe, expect, it } from 'vitest'
import { resolveActivityRouteByTitle, resolveActivitySlugByTitle } from './activityRoutes'

describe('activityRoutes', () => {
  it('maps homepage activity titles to dedicated detail routes', () => {
    expect(resolveActivityRouteByTitle('编程马拉松 2025')).toBe('/activities/programming-marathon-2025')
    expect(resolveActivityRouteByTitle('AI 技术研讨会')).toBe('/activities/ai-tech-seminar')
    expect(resolveActivityRouteByTitle('开源工作坊')).toBe('/activities/open-source-workshop')
  })

  it('maps pen page aliases to the same activity slug', () => {
    expect(resolveActivitySlugByTitle('2025 编程马拉松')).toBe('programming-marathon-2025')
    expect(resolveActivitySlugByTitle('AI 与机器学习技术研讨会')).toBe('ai-tech-seminar')
    expect(resolveActivitySlugByTitle('开源项目贡献工作坊')).toBe('open-source-workshop')
  })
})
