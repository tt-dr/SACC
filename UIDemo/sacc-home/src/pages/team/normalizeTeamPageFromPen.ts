import { cloneDeep, getTextChildren, traversePenTree } from '../../lib/penTree'
import type { PenNode } from '../../types/pen'

export const TEAM_ARCHITECTURE_PAGE_NAMES = new Set([
  '团队架构-主席团',
  '团队架构-非技术部门',
  '团队架构-技术部门',
])

const TEAM_LEADERSHIP_PAGE_NAME = '团队架构-主席团'
const TEAM_DEPARTMENT_LABELS = ['主席团', '非技术部门', '技术部门']
const TEAM_DEPARTMENT_ICON_TOKENS = ['👥', '📣', '<>']
const TAB_FRAME_STYLE_KEYS = ['fill', 'stroke', 'effect', 'cornerRadius'] as const
const TAB_TEXT_STYLE_KEYS = ['fill', 'fontWeight'] as const
const LEADERSHIP_CARD_BUTTON_NAME = 'btn'
const LEADERSHIP_CARD_MIN_HEIGHT = 304

const FIXED_INACTIVE_TAB_TEMPLATE = {
  frame: {
    fill: '#f2f4f7',
    effect: {
      type: 'shadow',
      shadowType: 'outer',
      enabled: false,
      color: '#000000',
    },
    cornerRadius: 999,
  },
  texts: {
    icon: {
      fill: '#697488',
      fontWeight: '700',
    },
    label: {
      fill: '#697488',
      fontWeight: '700',
    },
  },
}

const FIXED_ACTIVE_TAB_TEMPLATE = {
  frame: {
    fill: '#ffffff',
    effect: {
      type: 'shadow',
      shadowType: 'outer',
      color: '#0f203726',
      offset: {
        x: 0,
        y: 8,
      },
      blur: 18,
    },
    cornerRadius: 999,
  },
  texts: {
    icon: {
      fill: '#ff6a00',
      fontWeight: '700',
    },
    label: {
      fill: '#ff6a00',
      fontWeight: '600',
    },
  },
}

type TabStyleKey = (typeof TAB_FRAME_STYLE_KEYS)[number]
type TabTextStyleKey = (typeof TAB_TEXT_STYLE_KEYS)[number]
type StyleTemplate = Record<string, unknown>

function getDesiredDepartmentLabel(pathname: string): string {
  if (pathname.startsWith('/team/non-technical')) {
    return '非技术部门'
  }

  if (pathname.startsWith('/team/technical')) {
    return '技术部门'
  }

  return '主席团'
}

function getDepartmentLabelFromTabItem(tabItem: PenNode): string | null {
  for (const textNode of getTextChildren(tabItem)) {
    const content = typeof textNode.content === 'string' ? textNode.content.trim() : ''
    if (TEAM_DEPARTMENT_LABELS.includes(content)) {
      return content
    }
  }

  return null
}

function getTextRole(textNode: PenNode, index: number): string {
  const content = typeof textNode.content === 'string' ? textNode.content.trim() : ''

  if (TEAM_DEPARTMENT_ICON_TOKENS.includes(content)) {
    return 'icon'
  }

  if (TEAM_DEPARTMENT_LABELS.includes(content)) {
    return 'label'
  }

  return `text-${index}`
}

function applyNodeStyleKeys(
  targetNode: PenNode,
  styleSource: StyleTemplate,
  keys: readonly (TabStyleKey | TabTextStyleKey)[],
): void {
  const mutableNode = targetNode as Record<string, unknown>

  keys.forEach((key) => {
    const value = styleSource[key]

    if (value === undefined) {
      delete mutableNode[key]
      return
    }

    mutableNode[key] = typeof value === 'object' && value !== null ? cloneDeep(value) : value
  })
}

function applyTabItemTemplate(
  tabItem: PenNode,
  template: { frame: StyleTemplate; texts: Record<string, StyleTemplate> },
): void {
  applyNodeStyleKeys(tabItem, template.frame, TAB_FRAME_STYLE_KEYS)

  getTextChildren(tabItem).forEach((textNode, index) => {
    const role = getTextRole(textNode, index)
    const textTemplate = template.texts[role] || template.texts.label || template.texts.icon

    if (textTemplate) {
      applyNodeStyleKeys(textNode, textTemplate, TAB_TEXT_STYLE_KEYS)
    }
  })
}

function normalizeTabWrap(tabWrapNode: PenNode, desiredLabel: string): void {
  if (!Array.isArray(tabWrapNode.children)) {
    return
  }

  const tabItems = tabWrapNode.children
    .filter((child) => child.type === 'frame')
    .map((item) => ({ item, label: getDepartmentLabelFromTabItem(item) }))
    .filter((entry) => entry.label)

  if (tabItems.length < 2) {
    return
  }

  tabItems.forEach(({ item, label }) => {
    applyTabItemTemplate(item, label === desiredLabel ? FIXED_ACTIVE_TAB_TEMPLATE : FIXED_INACTIVE_TAB_TEMPLATE)
  })
}

function normalizeArchitectureHeroHeight(node: PenNode): void {
  if (node.type !== 'frame') {
    return
  }

  if (node.name !== 'hero' && node.name !== 'heroNew') {
    return
  }

  node.width = 'fill_container'
  node.height = 248
  node.gap = 14
  node.padding = [24, 0, 12, 0]
}

function stripLeadershipCardDetailButtons(node: PenNode, pageName: string | undefined): void {
  if (pageName !== TEAM_LEADERSHIP_PAGE_NAME) {
    return
  }

  if (node.type !== 'frame' || !/^card\d+$/.test(node.name ?? '')) {
    return
  }

  if (!Array.isArray(node.children)) {
    return
  }

  const nextChildren = node.children.filter((child) => child.name !== LEADERSHIP_CARD_BUTTON_NAME)
  const removedCount = node.children.length - nextChildren.length

  if (removedCount === 0) {
    return
  }

  node.children = nextChildren

  if (typeof node.height === 'number') {
    node.height = Math.max(LEADERSHIP_CARD_MIN_HEIGHT, node.height - removedCount * 56)
  }
}

export function normalizeTeamPageFromPen(
  page: PenNode | null | undefined,
  pathname: string,
): PenNode | null | undefined {
  if (!page || typeof page !== 'object') {
    return page
  }

  const clonedPage = cloneDeep(page)

  if (!TEAM_ARCHITECTURE_PAGE_NAMES.has(clonedPage.name ?? '')) {
    return clonedPage
  }

  const desiredLabel = getDesiredDepartmentLabel(pathname)
  const pageName = clonedPage.name

  traversePenTree(clonedPage, (node) => {
    if (node.type === 'frame' && node.name === 'tabWrap') {
      normalizeTabWrap(node, desiredLabel)
    }

    normalizeArchitectureHeroHeight(node)
    stripLeadershipCardDetailButtons(node, pageName)
  })

  return clonedPage
}
