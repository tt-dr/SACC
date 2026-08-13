import { cloneDeep, traversePenTree } from '../lib/penTree'
import type { PenNode } from '../types/pen'

const MAIN_NAV_LABELS = ['首页', '关于我们', '活动', '项目', '团队', '动态', '相册', '常见问题']
const ORANGE_COLORS = new Set(['#ff6a00', '#ff7a00', '#ff8a00'])
const MAIN_NAV_TEXT_STYLE_KEYS = ['fill', 'fontWeight'] as const
const HEADER_FRAME_NAMES = new Set(['head', 'headcopy', 'headnew', 'newheader', 'header', 'headercopy', 'header404'])
const UNIFIED_HEADER_STYLE = {
  height: 72,
  fill: [
    '#ffffff',
    {
      type: 'gradient',
      gradientType: 'linear',
      enabled: true,
      rotation: 180,
      size: {
        height: 1,
      },
      colors: [
        {
          color: '#ffffff',
          position: 0,
        },
        {
          color: '#f7f9ff',
          position: 1,
        },
      ],
    },
  ],
  stroke: {
    align: 'inside',
    thickness: {
      bottom: 1,
    },
    fill: '#eceff4',
  },
  padding: [0, 56],
  justifyContent: 'space_between',
  alignItems: 'center',
}

type MainNavTextStyleKey = (typeof MAIN_NAV_TEXT_STYLE_KEYS)[number]
type StyleSnapshot = Partial<Record<MainNavTextStyleKey, unknown>>

function normalizeColor(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function getMainNavActiveLabel(pathname: string): string | null {
  if (pathname === '/') {
    return '首页'
  }

  if (pathname.startsWith('/about')) {
    return '关于我们'
  }

  if (pathname.startsWith('/activities')) {
    return '活动'
  }

  if (pathname.startsWith('/projects') || pathname.startsWith('/tech/')) {
    return '项目'
  }

  if (pathname.startsWith('/team')) {
    return '团队'
  }

  if (pathname.startsWith('/news')) {
    return '动态'
  }

  if (pathname.startsWith('/gallery')) {
    return '相册'
  }

  if (pathname.startsWith('/faq')) {
    return '常见问题'
  }

  if (pathname.startsWith('/join-us')) {
    return '加入我们'
  }

  return null
}

function getMainNavTextNodes(navNode: PenNode): PenNode[] {
  const textNodes: PenNode[] = []

  traversePenTree(navNode, (node) => {
    if (node.type !== 'text') {
      return
    }

    const content = typeof node.content === 'string' ? node.content.trim() : ''
    if (MAIN_NAV_LABELS.includes(content)) {
      textNodes.push(node)
    }
  })

  return textNodes
}

function getNavTextActiveScore(node: PenNode): number {
  let score = 0

  if (typeof node.fontWeight === 'number' && node.fontWeight >= 700) {
    score += 3
  }

  if (typeof node.fontWeight === 'string' && node.fontWeight.toLowerCase() === 'bold') {
    score += 3
  }

  if (ORANGE_COLORS.has(normalizeColor(node.fill))) {
    score += 5
  }

  return score
}

function captureTextStyle(node: PenNode): StyleSnapshot {
  const style: StyleSnapshot = {}

  MAIN_NAV_TEXT_STYLE_KEYS.forEach((key) => {
    const value = node[key]
    style[key] = typeof value === 'object' && value !== null ? cloneDeep(value) : value
  })

  return style
}

function applyTextStyle(node: PenNode, style: StyleSnapshot): void {
  const mutableNode = node as Record<string, unknown>

  MAIN_NAV_TEXT_STYLE_KEYS.forEach((key) => {
    const value = style[key]

    if (value === undefined) {
      delete mutableNode[key]
      return
    }

    mutableNode[key] = typeof value === 'object' && value !== null ? cloneDeep(value) : value
  })
}

function normalizeHeaderFrame(node: PenNode): void {
  const frameName = typeof node.name === 'string' ? node.name.toLowerCase() : ''
  if (node.type !== 'frame' || !HEADER_FRAME_NAMES.has(frameName)) {
    return
  }

  const mutableNode = node as Record<string, unknown>
  Object.entries(UNIFIED_HEADER_STYLE).forEach(([key, value]) => {
    mutableNode[key] = typeof value === 'object' ? cloneDeep(value) : value
  })
}

function stripTopLevelHeaderFrames(pageNode: PenNode): void {
  if (!Array.isArray(pageNode.children)) {
    return
  }

  pageNode.children = pageNode.children.filter((child) => {
    if (child.type !== 'frame') {
      return true
    }

    const frameName = typeof child.name === 'string' ? child.name.toLowerCase() : ''
    return !HEADER_FRAME_NAMES.has(frameName)
  })
}

function normalizeMainNavFrame(navNode: PenNode, activeLabel: string): void {
  const navTextNodes = getMainNavTextNodes(navNode)
  if (navTextNodes.length < 5) {
    return
  }

  const sortedNodes = [...navTextNodes].sort((left, right) => getNavTextActiveScore(right) - getNavTextActiveScore(left))
  const activeTemplate = captureTextStyle(sortedNodes[0])
  const inactiveTemplate = captureTextStyle(sortedNodes[sortedNodes.length - 1])

  navTextNodes.forEach((textNode) => {
    const label = typeof textNode.content === 'string' ? textNode.content.trim() : ''
    applyTextStyle(textNode, label === activeLabel ? activeTemplate : inactiveTemplate)
  })
}

export function normalizeWebsitePageFromPen(
  page: PenNode | null | undefined,
  pathname: string,
): PenNode | null | undefined {
  if (!page || typeof page !== 'object') {
    return page
  }

  const activeLabel = getMainNavActiveLabel(pathname)
  const clonedPage = cloneDeep(page)

  stripTopLevelHeaderFrames(clonedPage)

  if (!activeLabel) {
    return clonedPage
  }

  traversePenTree(clonedPage, (node) => {
    normalizeHeaderFrame(node)

    if (node.type !== 'frame') {
      return
    }

    const frameName = typeof node.name === 'string' ? node.name.toLowerCase() : ''
    if (frameName.includes('nav')) {
      normalizeMainNavFrame(node, activeLabel)
    }
  })

  return clonedPage
}
