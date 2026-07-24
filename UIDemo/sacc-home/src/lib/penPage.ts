import type { PenFill, PenNode } from '../types/pen'

const DEFAULT_PAGE_BACKGROUND = '#eef2f7'
const DEFAULT_PAGE_WIDTH = 1440

export function resolvePageBackground(fill: PenFill | PenFill[] | undefined) {
  if (typeof fill === 'string') {
    return fill
  }

  if (Array.isArray(fill)) {
    const firstColor = fill.find((item) => typeof item === 'string')

    if (firstColor) {
      return firstColor
    }
  }

  return DEFAULT_PAGE_BACKGROUND
}

export function resolvePageWidth(pageNode: PenNode | null | undefined) {
  return typeof pageNode?.width === 'number' ? pageNode.width : DEFAULT_PAGE_WIDTH
}

export function createResponsivePageNode(pageNode: PenNode | null | undefined): PenNode | null {
  if (!pageNode) {
    return null
  }

  return {
    ...pageNode,
    width: 'fill_container',
  }
}
