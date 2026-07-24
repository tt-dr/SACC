// @ts-nocheck
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { PenInteractionControls, PenNode, PenPageViewResult } from '../types/pen'
import { TEAM_ARCHITECTURE_PAGE_NAMES } from '../pages/team/normalizeTeamPageFromPen'

const EMPTY_INTERACTION_CONTROLS: PenInteractionControls = {
  buttonControls: {},
  hiddenNodeIds: new Set<string>(),
  inputControls: {},
}

const GALLERY_FILTERS = [
  { key: '全部照片', nodeName: 'chipAll' },
  { key: '活动现场', nodeName: 'chipScene' },
  { key: '竞赛时刻', nodeName: 'chipComp' },
  { key: '团队建设', nodeName: 'chipTeam' },
  { key: '获奖时刻', nodeName: 'chipAward' },
]

const NEWS_FILTERS = [
  { key: '全部', nodeName: 'chip1' },
  { key: '赛事成绩', nodeName: 'chip2' },
  { key: '活动回顾', nodeName: 'chip3' },
  { key: '合作伙伴', nodeName: 'chip4' },
  { key: '技术分享', nodeName: 'chip5' },
  { key: '成长记录', nodeName: 'chip6' },
  { key: '技术文章', nodeName: 'chip7' },
  { key: '部门文章', nodeName: 'chip8' },
]

const PROJECT_FILTERS = ['全部项目', 'AI应用', 'Web应用', '系统软件', '区块链', '数据分析', '移动应用']
const PROJECT_SORTS = [
  { key: 'stars', label: '⭐ Stars' },
  { key: 'latest', label: '最新项目' },
  { key: 'popular', label: '最受欢迎' },
]

const ACTIVITY_FILTERS = [
  { key: '全部活动', nodeName: 'chipAll' },
  { key: '技术工作坊', nodeName: 'chipTech' },
  { key: '竞赛活动', nodeName: 'chipComp' },
  { key: '研讨会', nodeName: 'chipMeet' },
  { key: '社交活动', nodeName: 'chipSocial' },
]

const PROJECT_PAGE_SIZE = 6
const ACTIVITY_PAGE_SIZE = 6
const NEWS_LIST_PAGE_SIZE = 6
const STYLE_NODE_KEYS = ['cornerRadius', 'effect', 'fill', 'opacity', 'stroke']
const STYLE_TEXT_KEYS = ['fill', 'fontWeight', 'opacity']
const PAGINATION_ACTIVE_FILL = [
  '#ff9800',
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
        color: '#ff9200',
        position: 0,
      },
      {
        color: '#ffb000',
        position: 1,
      },
    ],
  },
]
const PAGINATION_ACTIVE_EFFECT = {
  type: 'shadow',
  shadowType: 'outer',
  color: '#ff99004d',
  offset: {
    x: 0,
    y: 8,
  },
  blur: 18,
}
const PAGINATION_INACTIVE_FILL = '#ffffff'
const PAGINATION_INACTIVE_STROKE = {
  align: 'inside',
  thickness: 1,
  fill: '#dce4ef',
}
const PAGINATION_NAV_FILL = [
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
        color: '#f2f6fc',
        position: 1,
      },
    ],
  },
]
const PAGINATION_NAV_STROKE = {
  align: 'inside',
  thickness: 1,
  fill: '#d9e2ee',
}
const PAGINATION_NAV_EFFECT = {
  type: 'shadow',
  shadowType: 'outer',
  color: '#7388a61f',
  offset: {
    x: 0,
    y: 8,
  },
  blur: 16,
}

const GALLERY_SECTION_SUBTITLES = {
  全部照片: '精选社团高光时刻',
  活动现场: '活动现场精选影像',
  竞赛时刻: '竞赛高光精选影像',
  团队建设: '团队协作精选影像',
  获奖时刻: '获奖荣耀精选影像',
}

const GALLERY_IMAGE_CATEGORIES = [
  ['活动现场'],
  ['活动现场', '团队建设'],
  ['竞赛时刻'],
  ['团队建设'],
  ['竞赛时刻', '获奖时刻'],
  ['活动现场'],
  ['团队建设'],
  ['获奖时刻'],
  ['活动现场', '竞赛时刻'],
]

const GALLERY_TIMELINE_CATEGORIES = [
  ['活动现场', '团队建设'],
  ['活动现场', '团队建设'],
  ['竞赛时刻', '获奖时刻'],
]

const NEWS_CARD_CATEGORIES = {
  '2025 编程马拉松': ['活动回顾', '成长记录'],
  'AI 与机器学习技术研讨会': ['技术分享'],
  '开源项目贡献工作坊': ['活动回顾', '技术文章'],
  'Web3 与区块链技术讲座': ['合作伙伴', '技术分享'],
  'ACM 程序设计竞赛集训': ['赛事成绩', '成长记录'],
  '前端开发技术分享会': ['部门文章', '技术分享'],
}

const ACTIVITY_CARD_CATEGORIES = {
  '2025 编程马拉松': ['竞赛活动'],
  'AI 与机器学习技术研讨会': ['研讨会'],
  '开源项目贡献工作坊': ['技术工作坊', '社交活动'],
  'Web3 与区块链技术讲座': ['研讨会'],
  'ACM 程序设计竞赛集训': ['竞赛活动'],
  '前端开发技术分享会': ['技术工作坊', '社交活动'],
}

const TEAM_ARCHITECTURE_YEARS = ['2025-2026', '2024-2025', '2023-2024']

function cloneValue(value) {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value
  }

  return JSON.parse(JSON.stringify(value))
}

function deepClone(value) {
  return cloneValue(value)
}

function traverseNode(node, visitor) {
  if (!node || typeof node !== 'object') {
    return
  }

  visitor(node)

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => traverseNode(child, visitor))
  }
}

function findNode(node, predicate) {
  let matchedNode = null

  traverseNode(node, (currentNode) => {
    if (!matchedNode && predicate(currentNode)) {
      matchedNode = currentNode
    }
  })

  return matchedNode
}

function findNodeById(node, id) {
  if (!id) {
    return null
  }

  return findNode(node, (currentNode) => currentNode?.id === id)
}

function findNodeByName(node, name) {
  if (!name) {
    return null
  }

  return findNode(node, (currentNode) => currentNode?.name === name)
}

function findNodeByNameOrId(node, identifier) {
  if (!identifier) {
    return null
  }

  return findNodeByName(node, identifier) || findNodeById(node, identifier)
}

function findTextNodeByContent(node, content) {
  if (!content) {
    return null
  }

  return findNode(
    node,
    (currentNode) => currentNode?.type === 'text' && typeof currentNode.content === 'string' && currentNode.content.trim() === content,
  )
}

function findParentNode(node, childId) {
  if (!childId) {
    return null
  }

  return findNode(
    node,
    (currentNode) =>
      Array.isArray(currentNode?.children) && currentNode.children.some((child) => child?.id === childId),
  )
}

function collectTextContent(node) {
  const texts = []

  traverseNode(node, (currentNode) => {
    if (currentNode?.type !== 'text' || typeof currentNode.content !== 'string') {
      return
    }

    const content = currentNode.content.trim()

    if (content) {
      texts.push(content)
    }
  })

  return texts
}

function findDescendantTextByName(node, name) {
  const textNode = findNode(node, (currentNode) => currentNode?.type === 'text' && currentNode?.name === name)
  return typeof textNode?.content === 'string' ? textNode.content.trim() : ''
}

function findDescendantText(node, predicate) {
  const textNode = findNode(node, (currentNode) => {
    if (currentNode?.type !== 'text' || typeof currentNode.content !== 'string') {
      return false
    }

    return predicate(currentNode)
  })

  return typeof textNode?.content === 'string' ? textNode.content.trim() : ''
}

function normalizeQuery(query) {
  return String(query || '')
    .trim()
    .toLowerCase()
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  const normalized = String(value || '')
  const match = normalized.match(/\d+/g)

  if (!match) {
    return 0
  }

  return Number(match.join(''))
}

function matchesQuery(fields, query) {
  if (!query) {
    return true
  }

  return fields.some((field) => normalizeQuery(field).includes(query))
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function captureNodeProps(node, keys) {
  return keys.reduce((result, key) => {
    result[key] = node && Object.prototype.hasOwnProperty.call(node, key) ? cloneValue(node[key]) : undefined
    return result
  }, {})
}

function applyCapturedProps(node, props) {
  if (!node || !props) {
    return
  }

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) {
      delete node[key]
      return
    }

    node[key] = cloneValue(value)
  })
}

function captureToggleTemplate(activeNode, inactiveNode) {
  return {
    activeNode: captureNodeProps(activeNode, STYLE_NODE_KEYS),
    activeTextNodes: (activeNode?.children || [])
      .filter((child) => child?.type === 'text')
      .map((child) => captureNodeProps(child, STYLE_TEXT_KEYS)),
    inactiveNode: captureNodeProps(inactiveNode, STYLE_NODE_KEYS),
    inactiveTextNodes: (inactiveNode?.children || [])
      .filter((child) => child?.type === 'text')
      .map((child) => captureNodeProps(child, STYLE_TEXT_KEYS)),
  }
}

function applyToggleTemplate(node, isActive, template) {
  if (!node || !template) {
    return
  }

  const nodeProps = isActive ? template.activeNode : template.inactiveNode
  const textTemplates = isActive ? template.activeTextNodes : template.inactiveTextNodes

  applyCapturedProps(node, nodeProps)

  const textChildren = (node.children || []).filter((child) => child?.type === 'text')

  textChildren.forEach((child, index) => {
    applyCapturedProps(child, textTemplates[index] || textTemplates[textTemplates.length - 1])
  })
}

function setNodeOpacity(node, opacity) {
  if (!node) {
    return
  }

  if (opacity === undefined) {
    delete node.opacity
    return
  }

  node.opacity = opacity
}

function buildRows(rowTemplates, itemNodes) {
  const rows = []
  let cursor = 0

  rowTemplates.forEach((template) => {
    const capacity = Array.isArray(template?.children) && template.children.length > 0 ? template.children.length : 3
    const nextItems = itemNodes.slice(cursor, cursor + capacity)

    cursor += capacity

    if (nextItems.length === 0) {
      return
    }

    const row = deepClone(template)
    row.children = nextItems.map((item) => deepClone(item))
    rows.push(row)
  })

  return rows
}

function getFrameChildMaxHeight(node) {
  if (!Array.isArray(node?.children) || node.children.length === 0) {
    return typeof node?.height === 'number' ? node.height : 0
  }

  return node.children.reduce((maxHeight, child) => {
    const childHeight = typeof child?.height === 'number' ? child.height : 0
    return Math.max(maxHeight, childHeight)
  }, 0)
}

function createPaginationButtonNode({ active = false, disabled = false, id, label, name, previousNext = false }) {
  const buttonNode = {
    type: 'frame',
    id,
    name,
    width: 52,
    height: 52,
    cornerRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: disabled ? 0.45 : undefined,
    children: [
      {
        type: 'text',
        id: `${id}-text`,
        name: `${name}Text`,
        fill: active ? '#ffffff' : previousNext ? '#5c6f8a' : '#63758f',
        content: label,
        fontFamily: 'Noto Sans SC',
        fontSize: previousNext ? 24 : 20,
        fontWeight: active || previousNext ? '700' : '600',
      },
    ],
  }

  if (active) {
    buttonNode.fill = cloneValue(PAGINATION_ACTIVE_FILL)
    buttonNode.effect = cloneValue(PAGINATION_ACTIVE_EFFECT)
    return buttonNode
  }

  if (previousNext) {
    buttonNode.fill = cloneValue(PAGINATION_NAV_FILL)
    buttonNode.stroke = cloneValue(PAGINATION_NAV_STROKE)
    buttonNode.effect = cloneValue(PAGINATION_NAV_EFFECT)
    return buttonNode
  }

  buttonNode.fill = cloneValue(PAGINATION_INACTIVE_FILL)
  buttonNode.stroke = cloneValue(PAGINATION_INACTIVE_STROKE)
  return buttonNode
}

function createPaginationNode({ currentPage, prefix, totalPages }) {
  return {
    type: 'frame',
    id: `${prefix}-wrapper`,
    name: `${prefix}Wrapper`,
    width: 1240,
    height: 88,
    layout: 'horizontal',
    gap: 14,
    justifyContent: 'center',
    alignItems: 'center',
    children: [
      createPaginationButtonNode({
        disabled: currentPage === 1,
        id: `${prefix}-prev`,
        label: '←',
        name: `${prefix}Prev`,
        previousNext: true,
      }),
      ...Array.from({ length: totalPages }, (_, index) =>
        createPaginationButtonNode({
          active: currentPage === index + 1,
          id: `${prefix}-page-${index + 1}`,
          label: String(index + 1),
          name: `${prefix}Page${index + 1}`,
        }),
      ),
      createPaginationButtonNode({
        disabled: currentPage === totalPages,
        id: `${prefix}-next`,
        label: '→',
        name: `${prefix}Next`,
        previousNext: true,
      }),
    ],
  }
}

function getTextFrameByLabel(page, label) {
  const textNode = findTextNodeByContent(page, label)

  if (!textNode) {
    return null
  }

  return findParentNode(page, textNode.id)
}

function extractProjectCards(page) {
  return ['cardsRow1', 'cardsRow2', 'cardsRow3']
    .flatMap((rowName) => findNodeByName(page, rowName)?.children || [])
    .map((cardNode, index) => {
      const coverNode = findNodeByName(cardNode, 'cardCover')
      const metricsNode = findNodeByName(cardNode, 'metrics')

      return {
        category: findDescendantText(coverNode, () => true),
        index,
        metrics: collectTextContent(metricsNode).map(parseNumber),
        node: deepClone(cardNode),
        summary: findDescendantTextByName(cardNode, 'cardDesc'),
        tags: collectTextContent(findNodeByName(cardNode, 'cardTags')),
        title: findDescendantTextByName(cardNode, 'cardTitle'),
      }
    })
}

function extractActivityCards(page) {
  return ['cardsRow1', 'cardsRow2']
    .flatMap((rowName) => findNodeByName(page, rowName)?.children || [])
    .map((cardNode, index) => {
      const title = findDescendantTextByName(cardNode, 'cardTitle')

      return {
        categories: ACTIVITY_CARD_CATEGORIES[title] || ['全部活动'],
        index,
        node: deepClone(cardNode),
        summary: findDescendantTextByName(cardNode, 'cardDesc'),
        title,
      }
    })
}

function extractNewsCards(page) {
  return ['row1Dyn', 'row2Dyn', 'row3Dyn']
    .flatMap((rowName) => findNodeByName(page, rowName)?.children || [])
    .map((cardNode, index) => {
      const coverNode = findNodeByName(cardNode, 'cardCover')
      const title = findDescendantTextByName(cardNode, 'cardTitle')

      return {
        categories: NEWS_CARD_CATEGORIES[title] || ['活动回顾'],
        coverFill: cloneValue(coverNode?.fill),
        index,
        node: deepClone(cardNode),
        summary: findDescendantTextByName(cardNode, 'cardDesc'),
        tags: collectTextContent(findNodeByName(cardNode, 'cardTags')),
        title,
      }
    })
}

function createGalleryModel(page) {
  const galleryGrid = findNodeByName(page, 'galleryGridV2')
  const timelineList = findNodeByNameOrId(page, 'BLtML')
  const activeFilterNode = findNodeByName(page, 'chipAll')
  const inactiveFilterNode = findNodeByName(page, 'chipScene')

  if (!galleryGrid || !timelineList || !activeFilterNode || !inactiveFilterNode) {
    return null
  }

  const rowNames = ['row1', 'row2', 'row3']
  const imageNodes = rowNames.flatMap((rowName) => findNodeByName(page, rowName)?.children || [])

  return {
    filters: GALLERY_FILTERS.map((item) => ({
      ...item,
      id: findNodeByName(page, item.nodeName)?.id || '',
    })).filter((item) => item.id),
    imageItems: imageNodes.map((node, index) => ({
      categories: GALLERY_IMAGE_CATEGORIES[index] || ['活动现场'],
      node: deepClone(node),
    })),
    rowNames,
    sectionSubtitleId: findNodeByNameOrId(page, 'nxO70')?.id || '',
    timelineItemNodes: (timelineList.children || []).map((node, index) => ({
      categories: GALLERY_TIMELINE_CATEGORIES[index] || ['活动现场'],
      node: deepClone(node),
    })),
    timelineListId: timelineList.id,
    toggleTemplate: captureToggleTemplate(activeFilterNode, inactiveFilterNode),
  }
}

function createNewsModel(page) {
  const featuredCard = findNodeByName(page, 'featuredCard')
  const featuredTitle = findNode(featuredCard, (node) => node?.type === 'text' && node?.name === 'heroTitle')
  const featuredIntro = findNode(featuredCard, (node) => node?.type === 'text' && node?.name === 'heroIntro')
  const activeFilterNode = findNodeByName(page, 'chip1')
  const inactiveFilterNode = findNodeByName(page, 'chip2')
  const newsCards = extractNewsCards(page)

  if (!featuredCard || !featuredTitle || !featuredIntro || !activeFilterNode || !inactiveFilterNode || newsCards.length === 0) {
    return null
  }

  const secondarySlides = ['ACM 程序设计竞赛集训', 'AI 与机器学习技术研讨会']
    .map((title) => newsCards.find((item) => item.title === title))
    .filter(Boolean)
    .map((item) => ({
      fill: cloneValue(item.coverFill) || cloneValue(featuredCard.fill),
      intro: item.summary,
      title: item.title,
    }))

  const slides = [
    {
      fill: cloneValue(featuredCard.fill),
      intro: featuredIntro.content,
      title: featuredTitle.content,
    },
    ...secondarySlides,
  ].slice(0, 3)

  while (slides.length < 3) {
    slides.push({
      fill: cloneValue(featuredCard.fill),
      intro: featuredIntro.content,
      title: featuredTitle.content,
    })
  }

  return {
    cards: newsCards,
    dotIds: ['dot1', 'dot2', 'dot3'].map((name) => findNodeByName(page, name)?.id || '').filter(Boolean),
    dotToggleTemplate: captureToggleTemplate(findNodeByName(page, 'dot1'), findNodeByName(page, 'dot2')),
    featuredCardId: featuredCard.id,
    featuredIntroId: featuredIntro.id,
    featuredTitleId: featuredTitle.id,
    filterToggleTemplate: captureToggleTemplate(activeFilterNode, inactiveFilterNode),
    filters: NEWS_FILTERS.map((item) => ({
      ...item,
      id: findNodeByName(page, item.nodeName)?.id || '',
    })).filter((item) => item.id),
    listSectionId: findNodeByName(page, 'newsListSec')?.id || '',
    listSubId: findNodeByName(page, 'listSubDyn')?.id || '',
    newsGridId: findNodeByName(page, 'newsGrid')?.id || '',
    rowNames: ['row1Dyn', 'row2Dyn', 'row3Dyn'],
    searchId: findNodeByName(page, 'searchWrapDyn')?.id || '',
    slideHintId: findNodeByName(page, 'slideHint')?.id || '',
    slides,
    textTemplate: {
      empty: '暂未找到匹配的资讯，试试其他关键词或分类',
      prefix: '共',
      suffix: '条匹配内容',
    },
  }
}

function createProjectsModel(page) {
  const activeFilterNode = getTextFrameByLabel(page, '全部项目')
  const inactiveFilterNode = getTextFrameByLabel(page, 'AI应用')
  const activeSortNode = getTextFrameByLabel(page, '⭐ Stars')
  const inactiveSortNode = getTextFrameByLabel(page, '最新项目')

  if (!activeFilterNode || !inactiveFilterNode || !activeSortNode || !inactiveSortNode) {
    return null
  }

  return {
    cards: extractProjectCards(page),
    countTextId: findNodeByName(page, 'foundCount')?.id || '',
    filterToggleTemplate: captureToggleTemplate(activeFilterNode, inactiveFilterNode),
    filters: PROJECT_FILTERS.map((label) => {
      const node = getTextFrameByLabel(page, label)
      return {
        id: node?.id || '',
        key: label,
      }
    }).filter((item) => item.id),
    pageButtonIds: ['page1', 'page2', 'page3'].map((name) => findNodeByName(page, name)?.id || '').filter(Boolean),
    pageToggleTemplate: captureToggleTemplate(findNodeByName(page, 'page1'), findNodeByName(page, 'page2')),
    paginationId: findNodeByName(page, 'projectPagination')?.id || '',
    paginationNextId: findNodeByName(page, 'pageNext')?.id || '',
    paginationPrevId: findNodeByName(page, 'pagePrev')?.id || '',
    rowNames: ['cardsRow1', 'cardsRow2', 'cardsRow3'],
    searchId: findNodeByName(page, 'projectSearch')?.id || '',
    sectionId: findNodeByName(page, 'projectCardsSec')?.id || '',
    sortToggleTemplate: captureToggleTemplate(activeSortNode, inactiveSortNode),
    sorts: PROJECT_SORTS.map((item) => {
      const node = getTextFrameByLabel(page, item.label)
      return {
        id: node?.id || '',
        ...item,
      }
    }).filter((item) => item.id),
  }
}

function createTeamArchitectureModel(page) {
  if (!TEAM_ARCHITECTURE_PAGE_NAMES.has(page?.name)) {
    return null
  }

  const leftArrow = findNodeByName(page, 'leftWrap')
  const rightArrow = findNodeByName(page, 'rightWrap')
  const yearText = findNodeByName(page, 'yearText')

  if (!leftArrow?.id || !rightArrow?.id || !yearText?.id) {
    return null
  }

  return {
    leftArrowId: leftArrow.id,
    rightArrowId: rightArrow.id,
    yearTextId: yearText.id,
    years: TEAM_ARCHITECTURE_YEARS,
  }
}

function createActivitiesModel(page) {
  const activeFilterNode = findNodeByName(page, 'chipAll')
  const inactiveFilterNode = findNodeByName(page, 'chipTech')

  if (!activeFilterNode || !inactiveFilterNode) {
    return null
  }

  return {
    cards: extractActivityCards(page),
    dotIds: ['dotA', 'dotB'].map((name) => findNodeByName(page, name)?.id || '').filter(Boolean),
    dotToggleTemplate: captureToggleTemplate(findNodeByName(page, 'dotA'), findNodeByName(page, 'dotB')),
    filterToggleTemplate: captureToggleTemplate(activeFilterNode, inactiveFilterNode),
    filters: ACTIVITY_FILTERS.map((item) => ({
      ...item,
      id: findNodeByName(page, item.nodeName)?.id || '',
    })).filter((item) => item.id),
    pageDotsId: findNodeByName(page, 'pageDots')?.id || '',
    nextId: findNodeByName(page, 'pageNextBtn')?.id || '',
    prevId: findNodeByName(page, 'pagePrevBtn')?.id || '',
    rowNames: ['cardsRow1', 'cardsRow2'],
    sectionId: findNodeByName(page, 'activityCardsSec')?.id || '',
  }
}

function sortProjectCards(cards, sortKey) {
  const nextCards = [...cards]

  if (sortKey === 'latest') {
    nextCards.sort((left, right) => right.index - left.index)
    return nextCards
  }

  if (sortKey === 'popular') {
    nextCards.sort((left, right) => {
      const rightScore = (right.metrics[2] || 0) * 1000 + (right.metrics[1] || 0)
      const leftScore = (left.metrics[2] || 0) * 1000 + (left.metrics[1] || 0)
      return rightScore - leftScore
    })
    return nextCards
  }

  nextCards.sort((left, right) => (right.metrics[0] || 0) - (left.metrics[0] || 0))
  return nextCards
}

function buildGalleryPage(page, model, activeFilter) {
  const clonedPage = deepClone(page)
  const selectedFilter = activeFilter || '全部照片'

  model.filters.forEach((filter) => {
    const filterNode = findNodeById(clonedPage, filter.id)
    applyToggleTemplate(filterNode, filter.key === selectedFilter, model.toggleTemplate)
  })

  const filteredImages =
    selectedFilter === '全部照片'
      ? model.imageItems
      : model.imageItems.filter((item) => item.categories.includes(selectedFilter))

  const galleryGrid = findNodeByName(clonedPage, 'galleryGridV2')
  const galleryRows = model.rowNames.map((rowName) => findNodeByName(clonedPage, rowName)).filter(Boolean)
  const sectionHead = galleryGrid?.children?.find((child) => child?.name === 'sectionHead')

  if (galleryGrid && sectionHead) {
    galleryGrid.children = [sectionHead, ...buildRows(galleryRows, filteredImages.map((item) => item.node))]
  }

  const subtitleNode = findNodeById(clonedPage, model.sectionSubtitleId)

  if (subtitleNode) {
    subtitleNode.content = GALLERY_SECTION_SUBTITLES[selectedFilter] || GALLERY_SECTION_SUBTITLES.全部照片
  }

  const timelineList = findNodeById(clonedPage, model.timelineListId)
  const filteredTimelineItems =
    selectedFilter === '全部照片'
      ? model.timelineItemNodes
      : model.timelineItemNodes.filter((item) => item.categories.includes(selectedFilter))

  if (timelineList) {
    timelineList.children = filteredTimelineItems.map((item) => deepClone(item.node))
  }

  return {
    meta: {},
    pageNode: clonedPage,
  }
}

function buildNewsPage(page, model, activeFilter, searchQuery, slideIndex, currentPage) {
  const clonedPage = deepClone(page)
  const normalizedQuery = normalizeQuery(searchQuery)
  const selectedFilter = activeFilter || '全部'
  const slidesLength = model.slides.length || 1
  const safeSlideIndex = clamp(slideIndex, 0, slidesLength - 1)
  const currentSlide = model.slides[safeSlideIndex]

  model.filters.forEach((filter) => {
    const filterNode = findNodeById(clonedPage, filter.id)
    applyToggleTemplate(filterNode, filter.key === selectedFilter, model.filterToggleTemplate)
  })

  model.dotIds.forEach((dotId, index) => {
    const dotNode = findNodeById(clonedPage, dotId)
    applyToggleTemplate(dotNode, index === safeSlideIndex, model.dotToggleTemplate)
  })

  const filteredCards = model.cards.filter((card) => {
    const matchesCategory = selectedFilter === '全部' || card.categories.includes(selectedFilter)
    const matchesSearch = matchesQuery([card.title, card.summary, ...card.tags, ...card.categories], normalizedQuery)
    return matchesCategory && matchesSearch
  })
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / NEWS_LIST_PAGE_SIZE))
  const safePage = clamp(currentPage, 1, totalPages)
  const pagedCards = filteredCards.slice((safePage - 1) * NEWS_LIST_PAGE_SIZE, safePage * NEWS_LIST_PAGE_SIZE)

  const newsGrid = findNodeById(clonedPage, model.newsGridId)
  const rowTemplates = model.rowNames.map((rowName) => findNodeByName(clonedPage, rowName)).filter(Boolean)

  if (newsGrid) {
    newsGrid.children = buildRows(rowTemplates, pagedCards.map((item) => item.node))
  }

  const listSubNode = findNodeById(clonedPage, model.listSubId)

  if (listSubNode) {
    listSubNode.content = filteredCards.length
      ? `${model.textTemplate.prefix} ${filteredCards.length} ${model.textTemplate.suffix}`
      : model.textTemplate.empty
  }

  const listSectionNode = findNodeById(clonedPage, model.listSectionId)

  if (listSectionNode) {
    delete listSectionNode.height
    const baseChildren = (listSectionNode.children || []).filter((child) => child?.id !== 'news-list-pagination-wrapper')

    listSectionNode.children = totalPages > 1
      ? [...baseChildren, createPaginationNode({ currentPage: safePage, prefix: 'news-list-pagination', totalPages })]
      : baseChildren
  }

  const featuredCard = findNodeById(clonedPage, model.featuredCardId)
  const featuredTitle = findNodeById(clonedPage, model.featuredTitleId)
  const featuredIntro = findNodeById(clonedPage, model.featuredIntroId)

  if (featuredCard) {
    featuredCard.fill = cloneValue(currentSlide.fill)
  }

  if (featuredTitle) {
    featuredTitle.content = currentSlide.title
  }

  if (featuredIntro) {
    featuredIntro.content = currentSlide.intro
  }

  return {
    meta: {
      listTotalPages: totalPages,
      safeSlideIndex,
      safePage,
      slideCount: slidesLength,
    },
    pageNode: clonedPage,
  }
}

function buildProjectsPage(page, model, activeFilter, sortKey, searchQuery, currentPage) {
  const clonedPage = deepClone(page)
  const normalizedQuery = normalizeQuery(searchQuery)
  const selectedFilter = activeFilter || '全部项目'
  const selectedSort = sortKey || 'stars'

  model.filters.forEach((filter) => {
    const filterNode = findNodeById(clonedPage, filter.id)
    applyToggleTemplate(filterNode, filter.key === selectedFilter, model.filterToggleTemplate)
  })

  model.sorts.forEach((sort) => {
    const sortNode = findNodeById(clonedPage, sort.id)
    applyToggleTemplate(sortNode, sort.key === selectedSort, model.sortToggleTemplate)
  })

  const filteredCards = model.cards.filter((card) => {
    const matchesCategory = selectedFilter === '全部项目' || card.category === selectedFilter
    const matchesSearch = matchesQuery([card.title, card.summary, card.category, ...card.tags], normalizedQuery)
    return matchesCategory && matchesSearch
  })

  const sortedCards = sortProjectCards(filteredCards, selectedSort)
  const totalPages = Math.max(1, Math.ceil(sortedCards.length / PROJECT_PAGE_SIZE))
  const safePage = clamp(currentPage, 1, totalPages)
  const pagedCards = sortedCards.slice((safePage - 1) * PROJECT_PAGE_SIZE, safePage * PROJECT_PAGE_SIZE)
  const cardsGrid = findNodeByName(clonedPage, 'cardsGrid')
  const rowTemplates = model.rowNames.map((rowName) => findNodeByName(clonedPage, rowName)).filter(Boolean)

  if (cardsGrid) {
    cardsGrid.children = buildRows(rowTemplates, pagedCards.map((item) => item.node))
  }

  const countNode = findNodeById(clonedPage, model.countTextId)

  if (countNode) {
    countNode.content = `找到 ${sortedCards.length} 个项目 · 第 ${safePage} / ${totalPages} 页`
  }

  const projectSectionNode = findNodeById(clonedPage, model.sectionId)
  const projectPaginationNode = findNodeById(clonedPage, model.paginationId)

  if (projectSectionNode) {
    delete projectSectionNode.height

    if (projectPaginationNode) {
      projectSectionNode.children = (projectSectionNode.children || []).filter((child) =>
        totalPages > 1 ? true : child?.id !== projectPaginationNode.id,
      )
    }
  }

  if (projectPaginationNode) {
    const availablePageIds = new Set(model.pageButtonIds.slice(0, totalPages))
    projectPaginationNode.children = (projectPaginationNode.children || []).filter((child) => {
      if (!child?.id) {
        return true
      }

      if (child.id === model.paginationPrevId || child.id === model.paginationNextId) {
        return true
      }

      return availablePageIds.has(child.id)
    })
  }

  model.pageButtonIds.forEach((pageButtonId, index) => {
    const pageNode = findNodeById(clonedPage, pageButtonId)
    const pageNumber = index + 1
    const isAvailable = pageNumber <= totalPages

    applyToggleTemplate(pageNode, isAvailable && pageNumber === safePage, model.pageToggleTemplate)
    setNodeOpacity(pageNode, isAvailable ? undefined : 0.45)
  })

  setNodeOpacity(findNodeById(clonedPage, model.paginationPrevId), safePage === 1 ? 0.45 : undefined)
  setNodeOpacity(findNodeById(clonedPage, model.paginationNextId), safePage === totalPages ? 0.45 : undefined)

  return {
    meta: {
      safePage,
      totalPages,
    },
    pageNode: clonedPage,
  }
}

function buildActivitiesPage(page, model, activeFilter, currentPage) {
  const clonedPage = deepClone(page)
  const selectedFilter = activeFilter || '全部活动'

  model.filters.forEach((filter) => {
    const filterNode = findNodeById(clonedPage, filter.id)
    applyToggleTemplate(filterNode, filter.key === selectedFilter, model.filterToggleTemplate)
  })

  const filteredCards =
    selectedFilter === '全部活动'
      ? model.cards
      : model.cards.filter((card) => card.categories.includes(selectedFilter))

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / ACTIVITY_PAGE_SIZE))
  const safePage = clamp(currentPage, 1, totalPages)
  const pagedCards = filteredCards.slice((safePage - 1) * ACTIVITY_PAGE_SIZE, safePage * ACTIVITY_PAGE_SIZE)
  const cardsGrid = findNodeByName(clonedPage, 'cardsGrid')
  const rowTemplates = model.rowNames.map((rowName) => findNodeByName(clonedPage, rowName)).filter(Boolean)
  const pageDotsNode = findNodeById(clonedPage, model.pageDotsId)
  const prevButtonNode = findNodeById(clonedPage, model.prevId)
  const nextButtonNode = findNodeById(clonedPage, model.nextId)
  const sectionNode = findNodeById(clonedPage, model.sectionId)
  const rowCount = Math.ceil(pagedCards.length / 3)

  if (cardsGrid) {
    cardsGrid.children = buildRows(rowTemplates, pagedCards.map((item) => item.node))
  }

  if (sectionNode) {
    const rowHeight = rowTemplates[0] ? getFrameChildMaxHeight(rowTemplates[0]) : 0
    const cardsGap = typeof cardsGrid?.gap === 'number' ? cardsGrid.gap : 0
    const cardsTop = typeof cardsGrid?.y === 'number' ? cardsGrid.y : 0
    const cardsHeight = rowCount > 0 ? rowCount * rowHeight + Math.max(0, rowCount - 1) * cardsGap : 0
    const cardsBottom = cardsTop + cardsHeight
    const shouldShowPagination = totalPages > 1

    sectionNode.children = (sectionNode.children || []).filter((child) => {
      if (!shouldShowPagination && (child?.id === model.prevId || child?.id === model.nextId || child?.id === model.pageDotsId)) {
        return false
      }

      return true
    })

    if (shouldShowPagination) {
      const buttonHeight = typeof prevButtonNode?.height === 'number' ? prevButtonNode.height : 70
      const dotsHeight = getFrameChildMaxHeight(pageDotsNode) || 8
      const centeredY = cardsTop + Math.max(0, (cardsHeight - buttonHeight) / 2)

      if (prevButtonNode) {
        prevButtonNode.y = centeredY
      }

      if (nextButtonNode) {
        nextButtonNode.y = centeredY
      }

      if (pageDotsNode) {
        pageDotsNode.y = cardsBottom + 32
      }

      sectionNode.height = Math.max(cardsBottom + 48, (pageDotsNode?.y || 0) + dotsHeight + 24)
    } else {
      sectionNode.height = cardsBottom + 24
    }
  }

  model.dotIds.forEach((dotId, index) => {
    const dotNode = findNodeById(clonedPage, dotId)
    const pageNumber = index + 1
    const isAvailable = pageNumber <= totalPages

    applyToggleTemplate(dotNode, isAvailable && pageNumber === safePage, model.dotToggleTemplate)
    setNodeOpacity(dotNode, isAvailable ? undefined : 0.45)
  })

  setNodeOpacity(findNodeById(clonedPage, model.prevId), safePage === 1 ? 0.45 : undefined)
  setNodeOpacity(findNodeById(clonedPage, model.nextId), safePage === totalPages ? 0.45 : undefined)

  return {
    meta: {
      safePage,
      totalPages,
    },
    pageNode: clonedPage,
  }
}

function buildTeamArchitecturePage(page, model, yearIndex) {
  const clonedPage = deepClone(page)
  const totalYears = model.years.length
  const safeYearIndex = clamp(yearIndex, 0, totalYears - 1)
  const yearTextNode = findNodeById(clonedPage, model.yearTextId)

  if (yearTextNode) {
    yearTextNode.content = model.years[safeYearIndex]
  }

  setNodeOpacity(findNodeById(clonedPage, model.leftArrowId), safeYearIndex === 0 ? 0.45 : undefined)
  setNodeOpacity(findNodeById(clonedPage, model.rightArrowId), safeYearIndex === totalYears - 1 ? 0.45 : undefined)

  return {
    meta: {
      safeYearIndex,
      totalYears,
    },
    pageNode: clonedPage,
  }
}

function useInteractivePenPage(page: PenNode | null | undefined): PenPageViewResult {
  const [galleryFilter, setGalleryFilter] = useState('全部照片')
  const [newsFilter, setNewsFilter] = useState('全部')
  const [newsListPage, setNewsListPage] = useState(1)
  const [newsQuery, setNewsQuery] = useState('')
  const [newsSlideIndex, setNewsSlideIndex] = useState(0)
  const [projectFilter, setProjectFilter] = useState('全部项目')
  const [projectPage, setProjectPage] = useState(1)
  const [projectQuery, setProjectQuery] = useState('')
  const [projectSort, setProjectSort] = useState('stars')
  const [activityFilter, setActivityFilter] = useState('全部活动')
  const [activityPage, setActivityPage] = useState(1)
  const [teamArchitectureYearIndex, setTeamArchitectureYearIndex] = useState(0)
  const deferredNewsQuery = useDeferredValue(newsQuery)
  const deferredProjectQuery = useDeferredValue(projectQuery)

  const galleryModel = useMemo(() => (page?.name === '相册' ? createGalleryModel(page) : null), [page])
  const newsModel = useMemo(() => (page?.name === '动态' ? createNewsModel(page) : null), [page])
  const projectsModel = useMemo(() => (page?.name === '项目' ? createProjectsModel(page) : null), [page])
  const activitiesModel = useMemo(() => (page?.name === '活动' ? createActivitiesModel(page) : null), [page])
  const teamArchitectureModel = useMemo(() => createTeamArchitectureModel(page), [page])

  useEffect(() => {
    const slideCount = newsModel?.slides.length || 0

    if (page?.name !== '动态' || slideCount <= 1) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setNewsSlideIndex((currentIndex) => (currentIndex + 1) % slideCount)
    }, 4800)

    return () => window.clearInterval(timer)
  }, [newsModel?.slides.length, page?.name])

  const result = useMemo(() => {
    if (!page) {
      return {
        interactionControls: EMPTY_INTERACTION_CONTROLS,
        meta: {},
        pageNode: page,
      }
    }

    if (galleryModel) {
      const view = buildGalleryPage(page, galleryModel, galleryFilter)
      const buttonControls = galleryModel.filters.reduce((controls, filter) => {
        controls[filter.id] = {
          ariaLabel: filter.key,
          ariaPressed: filter.key === galleryFilter,
          onClick: () => setGalleryFilter(filter.key),
        }
        return controls
      }, {})

      return {
        interactionControls: {
          ...EMPTY_INTERACTION_CONTROLS,
          buttonControls,
        },
        meta: view.meta,
        pageNode: view.pageNode,
      }
    }

    if (newsModel) {
      const view = buildNewsPage(page, newsModel, newsFilter, deferredNewsQuery, newsSlideIndex, newsListPage)
      const buttonControls = newsModel.filters.reduce((controls, filter) => {
        controls[filter.id] = {
          ariaLabel: filter.key,
          ariaPressed: filter.key === newsFilter,
          onClick: () => {
            setNewsFilter(filter.key)
            setNewsListPage(1)
          },
        }
        return controls
      }, {})

      const prevId = findNodeByName(page, 'carouselPrev')?.id || ''
      const nextId = findNodeByName(page, 'carouselNext')?.id || ''

      if (prevId) {
        buttonControls[prevId] = {
          ariaLabel: '上一条焦点资讯',
          onClick: () => setNewsSlideIndex((currentIndex) => (currentIndex - 1 + newsModel.slides.length) % newsModel.slides.length),
        }
      }

      if (nextId) {
        buttonControls[nextId] = {
          ariaLabel: '下一条焦点资讯',
          onClick: () => setNewsSlideIndex((currentIndex) => (currentIndex + 1) % newsModel.slides.length),
        }
      }

      newsModel.dotIds.forEach((dotId, index) => {
        buttonControls[dotId] = {
          ariaLabel: `切换到第 ${index + 1} 条焦点资讯`,
          ariaPressed: index === view.meta.safeSlideIndex,
          onClick: () => setNewsSlideIndex(index),
        }
      })

      if (view.meta.listTotalPages > 1) {
        buttonControls['news-list-pagination-prev'] = {
          ariaLabel: '上一页动态',
          disabled: view.meta.safePage === 1,
          onClick: () => setNewsListPage((currentValue) => Math.max(1, currentValue - 1)),
        }

        buttonControls['news-list-pagination-next'] = {
          ariaLabel: '下一页动态',
          disabled: view.meta.safePage === view.meta.listTotalPages,
          onClick: () => setNewsListPage((currentValue) => Math.min(view.meta.listTotalPages, currentValue + 1)),
        }

        Array.from({ length: view.meta.listTotalPages }, (_, index) => {
          const pageNumber = index + 1
          buttonControls[`news-list-pagination-page-${pageNumber}`] = {
            ariaLabel: `切换到第 ${pageNumber} 页动态`,
            ariaPressed: view.meta.safePage === pageNumber,
            onClick: () => setNewsListPage(pageNumber),
          }
          return null
        })
      }

      return {
        interactionControls: {
          buttonControls,
          hiddenNodeIds: new Set(newsModel.slideHintId ? [newsModel.slideHintId] : []),
          inputControls: newsModel.searchId
            ? {
                [newsModel.searchId]: {
                  ariaLabel: '搜索资讯',
                  onChange: (event) => {
                    setNewsQuery(event.target.value)
                    setNewsListPage(1)
                  },
                  placeholder: '搜索资讯...',
                  value: newsQuery,
                },
              }
            : {},
        },
        meta: view.meta,
        pageNode: view.pageNode,
      }
    }

    if (projectsModel) {
      const view = buildProjectsPage(page, projectsModel, projectFilter, projectSort, deferredProjectQuery, projectPage)
      const buttonControls = projectsModel.filters.reduce((controls, filter) => {
        controls[filter.id] = {
          ariaLabel: filter.key,
          ariaPressed: filter.key === projectFilter,
          onClick: () => {
            setProjectFilter(filter.key)
            setProjectPage(1)
          },
        }
        return controls
      }, {})

      projectsModel.sorts.forEach((sort) => {
        buttonControls[sort.id] = {
          ariaLabel: sort.label,
          ariaPressed: sort.key === projectSort,
          onClick: () => {
            setProjectSort(sort.key)
            setProjectPage(1)
          },
        }
      })

      projectsModel.pageButtonIds.forEach((pageButtonId, index) => {
        const pageNumber = index + 1
        buttonControls[pageButtonId] = {
          ariaLabel: `切换到第 ${pageNumber} 页`,
          ariaPressed: view.meta.safePage === pageNumber,
          disabled: pageNumber > view.meta.totalPages,
          onClick: () => setProjectPage(pageNumber),
        }
      })

      if (projectsModel.paginationPrevId) {
        buttonControls[projectsModel.paginationPrevId] = {
          ariaLabel: '上一页项目',
          disabled: view.meta.safePage === 1,
          onClick: () => setProjectPage((currentValue) => Math.max(1, currentValue - 1)),
        }
      }

      if (projectsModel.paginationNextId) {
        buttonControls[projectsModel.paginationNextId] = {
          ariaLabel: '下一页项目',
          disabled: view.meta.safePage === view.meta.totalPages,
          onClick: () => setProjectPage((currentValue) => Math.min(view.meta.totalPages, currentValue + 1)),
        }
      }

      return {
        interactionControls: {
          buttonControls,
          hiddenNodeIds: new Set(),
          inputControls: projectsModel.searchId
            ? {
                [projectsModel.searchId]: {
                  ariaLabel: '搜索项目',
                  onChange: (event) => {
                    setProjectQuery(event.target.value)
                    setProjectPage(1)
                  },
                  placeholder: '搜索项目...',
                  value: projectQuery,
                },
              }
            : {},
        },
        meta: view.meta,
        pageNode: view.pageNode,
      }
    }

    if (activitiesModel) {
      const view = buildActivitiesPage(page, activitiesModel, activityFilter, activityPage)
      const buttonControls = activitiesModel.filters.reduce((controls, filter) => {
        controls[filter.id] = {
          ariaLabel: filter.key,
          ariaPressed: filter.key === activityFilter,
          onClick: () => {
            setActivityFilter(filter.key)
            setActivityPage(1)
          },
        }
        return controls
      }, {})

      if (activitiesModel.prevId) {
        buttonControls[activitiesModel.prevId] = {
          ariaLabel: '上一页活动',
          disabled: view.meta.safePage === 1,
          onClick: () => setActivityPage((currentValue) => Math.max(1, currentValue - 1)),
        }
      }

      if (activitiesModel.nextId) {
        buttonControls[activitiesModel.nextId] = {
          ariaLabel: '下一页活动',
          disabled: view.meta.safePage === view.meta.totalPages,
          onClick: () => setActivityPage((currentValue) => Math.min(view.meta.totalPages, currentValue + 1)),
        }
      }

      activitiesModel.dotIds.forEach((dotId, index) => {
        const pageNumber = index + 1
        buttonControls[dotId] = {
          ariaLabel: `切换到第 ${pageNumber} 页活动`,
          ariaPressed: pageNumber === view.meta.safePage,
          disabled: pageNumber > view.meta.totalPages,
          onClick: () => setActivityPage(pageNumber),
        }
      })

      return {
        interactionControls: {
          buttonControls,
          hiddenNodeIds: new Set(),
          inputControls: {},
        },
        meta: view.meta,
        pageNode: view.pageNode,
      }
    }

    if (teamArchitectureModel) {
      const view = buildTeamArchitecturePage(page, teamArchitectureModel, teamArchitectureYearIndex)

      return {
        interactionControls: {
          buttonControls: {
            [teamArchitectureModel.leftArrowId]: {
              ariaLabel: '切换到上一学年团队',
              disabled: view.meta.safeYearIndex === 0,
              onClick: () => setTeamArchitectureYearIndex((currentValue) => Math.max(0, currentValue - 1)),
            },
            [teamArchitectureModel.rightArrowId]: {
              ariaLabel: '切换到下一学年团队',
              disabled: view.meta.safeYearIndex === view.meta.totalYears - 1,
              onClick: () =>
                setTeamArchitectureYearIndex((currentValue) =>
                  Math.min(view.meta.totalYears - 1, currentValue + 1),
                ),
            },
          },
          hiddenNodeIds: new Set(),
          inputControls: {},
        },
        meta: view.meta,
        pageNode: view.pageNode,
      }
    }

    return {
      interactionControls: EMPTY_INTERACTION_CONTROLS,
      meta: {},
      pageNode: page,
    }
  }, [
    activitiesModel,
    activityFilter,
    activityPage,
    deferredNewsQuery,
    deferredProjectQuery,
    galleryFilter,
    galleryModel,
    newsFilter,
    newsListPage,
    newsModel,
    newsQuery,
    newsSlideIndex,
    page,
    teamArchitectureModel,
    teamArchitectureYearIndex,
    projectFilter,
    projectPage,
    projectQuery,
    projectsModel,
    projectSort,
  ])

  return result
}

export default useInteractivePenPage
