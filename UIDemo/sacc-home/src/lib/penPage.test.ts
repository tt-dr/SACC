import { describe, expect, it } from 'vitest'
import { createResponsivePageNode, resolvePageBackground, resolvePageWidth } from './penPage'

describe('penPage utilities', () => {
  it('keeps the original page data while forcing fill-container width', () => {
    expect(createResponsivePageNode({ id: 'page-1', width: 1280, name: '首页' })).toEqual({
      id: 'page-1',
      width: 'fill_container',
      name: '首页',
    })
  })

  it('falls back to the first string fill color and default width', () => {
    expect(resolvePageBackground(['#ffffff', { type: 'gradient' }])).toBe('#ffffff')
    expect(resolvePageWidth({})).toBe(1440)
  })
})
