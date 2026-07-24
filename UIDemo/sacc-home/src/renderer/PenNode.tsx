// @ts-nocheck
import {
  BadgeCheck,
  Briefcase,
  Calendar,
  Circle,
  Code,
  ExternalLink,
  FileText,
  Flame,
  GitFork,
  Github,
  Heart,
  Image,
  Lightbulb,
  Linkedin,
  Mail,
  Megaphone,
  Medal,
  Newspaper,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
  Trophy,
  Twitter,
  Users,
  UsersRound,
  Video,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ACTIVITY_ACTION_ROUTES,
  CONTEXT_BACK_ROUTES,
  EXTERNAL_ROUTES,
  GALLERY_ACTION_ROUTES,
  NAV_LABEL_ROUTES,
  NEWS_ACTION_ROUTES,
  PROJECT_ACTION_ROUTES,
  PROJECT_TAB_ROUTES,
  TEAM_TAB_ROUTES,
} from '../routes/navLabelRoutes'
import { resolveActivityRouteByTitle } from '../lib/activityRoutes'
import type { PenInteractionControls, PenLayoutContext, PenNode as PenNodeModel } from '../types/pen'

const JUSTIFY_CONTENT_MAP = {
  center: 'center',
  end: 'flex-end',
  space_between: 'space-between',
}

const ALIGN_ITEMS_MAP = {
  center: 'center',
  end: 'flex-end',
}

const ICON_OVERRIDES = {
  'Material Symbols Rounded': {
    verified_user: 'ShieldCheck',
  },
}

const ICON_COMPONENTS = {
  BadgeCheck,
  Briefcase,
  Calendar,
  Code,
  ExternalLink,
  FileText,
  GitFork,
  Github,
  Heart,
  Image,
  Lightbulb,
  Linkedin,
  Mail,
  Medal,
  Newspaper,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
  Trophy,
  Twitter,
  Users,
  Video,
  Zap,
}

const PRIMARY_NAV_CONTEXT_PATTERNS = ['nav', 'footercol', 'footerlegal', 'cta', 'secondarybtn', 'brand', 'btnrow404']
const TEAM_TAB_CONTEXT_PATTERNS = ['tabwrap']
const PROJECT_TAB_CONTEXT_PATTERNS = ['tagrowsec', 'tabrow']
const ACTIVITY_CONTEXT_PATTERNS = ['activity', 'summarycard', 'joinbtn', 'crumbsec', 'relatedsec', '活动']
const PROJECT_CONTEXT_PATTERNS = ['detailbtn', 'cardaction', 'project', '项目', 'tagrowsec']
const NEWS_CONTEXT_PATTERNS = ['news', '动态']
const ARCHIVE_CONTEXT_PATTERNS = ['archive', 'crumb', 'headercopy', '归档']
const GALLERY_CONTEXT_PATTERNS = ['gallery', 'album', 'archive', '相册']
const INTERACTIVE_FRAME_NAME_PATTERNS = ['btn', 'button', 'tab', 'chip', 'pill', 'action', 'nav', 'crumb', 'link', 'cta', 'float']
const MAX_ROUTE_SCAN_DEPTH = 4
const VALUE_CARD_ICON_OVERRIDES = [
  {
    context: '关于我们>activities>valuerow>valuecard1',
    iconFontName: 'heart',
    component: Flame,
    size: 22,
    translateY: 0.6,
  },
  {
    context: '关于我们>activities>valuerow>valuecard2',
    iconFontName: 'zap',
    component: Lightbulb,
    size: 20.5,
    translateY: 0.4,
  },
  {
    context: '关于我们>activities>valuerow>valuecard3',
    iconFontName: 'users',
    component: UsersRound,
    size: 21.5,
    translateY: 0.4,
  },
  {
    context: '关于我们>activities>valuerow>valuecard4',
    iconFontName: 'target',
    component: Target,
    size: 19.5,
    translateY: 0.2,
  },
]
const VALUE_CARD_ICON_RENDER = {
  size: 20,
  strokeWidth: 2.3,
  absoluteStrokeWidth: true,
  translateY: 0,
}

function toPx(value) {
  return typeof value === 'number' ? `${value}px` : undefined
}

function extractAssetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return ''
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl
  }

  const filename = rawUrl.split(/[\\/]/).pop()

  if (!filename) {
    return rawUrl
  }

  return `/${filename}`
}

function parseGradientFill(gradient) {
  if (!gradient?.colors?.length) {
    return ''
  }

  const stops = gradient.colors
    .map((stop) => {
      const position = typeof stop.position === 'number' ? `${Math.round(stop.position * 100)}%` : ''
      return `${stop.color} ${position}`.trim()
    })
    .join(', ')

  if (gradient.gradientType === 'radial') {
    return `radial-gradient(circle at center, ${stops})`
  }

  const rotation = typeof gradient.rotation === 'number' ? gradient.rotation : 180
  return `linear-gradient(${rotation}deg, ${stops})`
}

function parseFill(fill) {
  const style = {}
  const layers = []
  const sizes = []
  const repeats = []
  const positions = []
  const fills = Array.isArray(fill) ? fill : [fill]

  for (const item of fills) {
    if (typeof item === 'string') {
      style.backgroundColor = item
      continue
    }

    if (!item || item.enabled === false) {
      continue
    }

    if (item.type === 'gradient') {
      const gradientCss = parseGradientFill(item)

      if (gradientCss) {
        layers.push(gradientCss)
        sizes.push('100% 100%')
        repeats.push('no-repeat')
        positions.push('center')
      }
      continue
    }

    if (item.type === 'image') {
      const url = extractAssetUrl(item.url)

      if (url) {
        layers.push(`url("${url}")`)
        sizes.push(item.mode === 'fit' ? 'contain' : 'cover')
        repeats.push('no-repeat')
        positions.push('center')
      }
    }
  }

  if (layers.length > 0) {
    style.backgroundImage = layers.join(', ')
    style.backgroundSize = sizes.join(', ')
    style.backgroundRepeat = repeats.join(', ')
    style.backgroundPosition = positions.join(', ')
  }

  return style
}

function parsePadding(padding) {
  if (typeof padding === 'number') {
    return `${padding}px`
  }

  if (!Array.isArray(padding)) {
    return undefined
  }

  if (padding.length === 2) {
    return `${padding[0]}px ${padding[1]}px`
  }

  if (padding.length === 4) {
    return padding.map((value) => `${value}px`).join(' ')
  }

  return undefined
}

function resolvePaddingSides(padding) {
  if (typeof padding === 'number') {
    return [padding, padding, padding, padding]
  }

  if (!Array.isArray(padding)) {
    return [0, 0, 0, 0]
  }

  if (padding.length === 2) {
    return [padding[0], padding[1], padding[0], padding[1]]
  }

  if (padding.length === 4) {
    return padding
  }

  return [0, 0, 0, 0]
}

function parseCornerRadius(cornerRadius) {
  if (typeof cornerRadius === 'number') {
    return `${cornerRadius}px`
  }

  if (Array.isArray(cornerRadius) && cornerRadius.length === 4) {
    return cornerRadius.map((value) => `${value}px`).join(' ')
  }

  return undefined
}

function parseStroke(stroke) {
  if (!stroke || typeof stroke !== 'object') {
    return {}
  }

  const style = {}
  const strokeColor = typeof stroke.fill === 'string' ? stroke.fill : '#000000'

  if (typeof stroke.thickness === 'number') {
    style.border = `${stroke.thickness}px solid ${strokeColor}`
    return style
  }

  if (!stroke.thickness || typeof stroke.thickness !== 'object') {
    return style
  }

  const borderMap = {
    top: 'borderTop',
    right: 'borderRight',
    bottom: 'borderBottom',
    left: 'borderLeft',
  }

  for (const [direction, cssProperty] of Object.entries(borderMap)) {
    const thickness = stroke.thickness[direction]

    if (typeof thickness === 'number' && thickness > 0) {
      style[cssProperty] = `${thickness}px solid ${strokeColor}`
    }
  }

  return style
}

function parseEffect(effect) {
  if (!effect) {
    return {}
  }

  const style = {}
  const effects = Array.isArray(effect) ? effect : [effect]
  const shadows = effects
    .filter((item) => item?.type === 'shadow' && item.enabled !== false)
    .map((item) => {
      const x = item.offset?.x ?? 0
      const y = item.offset?.y ?? 0
      const blur = item.blur ?? 0
      const color = item.color ?? '#0000001a'
      return `${x}px ${y}px ${blur}px ${color}`
    })

  if (shadows.length > 0) {
    style.boxShadow = shadows.join(', ')
  }

  return style
}

function parseDimension(style, axis, value, parentContext) {
  if (typeof value === 'number') {
    style[axis] = `${value}px`

    if (
      parentContext?.layoutMode === 'flex' &&
      ((axis === 'width' && parentContext.flexDirection === 'row') ||
        (axis === 'height' && parentContext.flexDirection === 'column'))
    ) {
      style.flexShrink = 0
    }

    return
  }

  if (typeof value !== 'string') {
    return
  }

  if (value.startsWith('fill_container')) {
    style[axis] = '100%'

    if (parentContext?.layoutMode === 'flex') {
      if (axis === 'width' && parentContext.flexDirection === 'row') {
        style.flex = '1 1 0'
        style.minWidth = 0
      }

      if (axis === 'height' && parentContext.flexDirection === 'column') {
        style.flex = '1 1 0'
        style.minHeight = 0
      }
    }

    return
  }

  if (value.startsWith('fit_content')) {
    style[axis] = 'fit-content'
    const match = value.match(/fit_content\((\d+)\)/)

    if (match && match[1]) {
      const numericValue = Number(match[1])

      if (!Number.isNaN(numericValue)) {
        style[axis === 'width' ? 'minWidth' : 'minHeight'] = `${numericValue}px`
      }
    }
  }
}

function parseTransform(node) {
  const transforms = []

  if (typeof node.rotation === 'number' && node.rotation !== 0) {
    transforms.push(`rotate(${node.rotation}deg)`)
  }

  if (node.flipY) {
    transforms.push('scaleY(-1)')
  }

  return transforms.length > 0 ? transforms.join(' ') : undefined
}

function resolveTextColor(fill) {
  if (typeof fill === 'string') {
    return fill
  }

  if (Array.isArray(fill)) {
    const firstColor = fill.find((item) => typeof item === 'string')

    if (firstColor) {
      return firstColor
    }
  }

  if (fill && typeof fill === 'object' && typeof fill.color === 'string') {
    return fill.color
  }

  return '#1d2638'
}

function toPascalCase(iconName) {
  if (!iconName || typeof iconName !== 'string') {
    return ''
  }

  if (iconName.includes('-') || iconName.includes('_')) {
    return iconName
      .split(/[-_]/g)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')
  }

  return iconName[0].toUpperCase() + iconName.slice(1)
}

function resolveValueCardIconOverride(node, ancestors) {
  const contextChain = buildContextChain(ancestors)

  if (node.iconFontFamily !== 'lucide') {
    return null
  }

  return VALUE_CARD_ICON_OVERRIDES.find(
    (item) => contextChain.includes(item.context) && node.iconFontName === item.iconFontName,
  ) || null
}

function resolveIcon(node, ancestors) {
  const contextualIcon = resolveValueCardIconOverride(node, ancestors)

  if (contextualIcon?.component) {
    return contextualIcon.component
  }

  const familyOverride = ICON_OVERRIDES[node.iconFontFamily]?.[node.iconFontName]
  const lucideName = familyOverride || toPascalCase(node.iconFontName)
  return ICON_COMPONENTS[lucideName] || Circle
}

function buildContextChain(ancestors) {
  return ancestors.map((ancestor) => (ancestor?.name || '').toLowerCase()).join('>')
}

function hasContextPattern(contextChain, patterns) {
  return patterns.some((pattern) => contextChain.includes(pattern))
}

function isNativeBackToTopNode(node) {
  const nodeName = typeof node?.name === 'string' ? node.name.toLowerCase() : ''
  return node?.type === 'frame' && nodeName.includes('footerfloatbtn')
}

function getNodeName(node) {
  return typeof node?.name === 'string' ? node.name.toLowerCase() : ''
}

function findActivityRouteInNode(node) {
  if (!node || typeof node !== 'object') {
    return null
  }

  if (node.type === 'text' && typeof node.content === 'string') {
    const route = resolveActivityRouteByTitle(node.content, '')

    if (route) {
      return route
    }
  }

  if (!Array.isArray(node.children)) {
    return null
  }

  for (const child of node.children) {
    const route = findActivityRouteInNode(child)

    if (route) {
      return route
    }
  }

  return null
}

function resolveActivityRouteFromAncestors(ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const route = findActivityRouteInNode(ancestors[index])

    if (route) {
      return route
    }
  }

  return null
}

function isPotentialInteractiveFrame(node, ancestors) {
  const nodeName = getNodeName(node)
  const contextChain = buildContextChain([...ancestors, node])

  return INTERACTIVE_FRAME_NAME_PATTERNS.some((pattern) => nodeName.includes(pattern) || contextChain.includes(pattern))
}

function isTopLevelAbsoluteSection(node, ancestors) {
  return (
    node?.type === 'frame' &&
    ancestors.length === 1 &&
    node.width === 'fill_container' &&
    node.layout === 'none' &&
    typeof node.x !== 'number' &&
    typeof node.y !== 'number'
  )
}

function applyTopLevelAbsoluteSectionInsets(style, node) {
  const [paddingTop, paddingRight, paddingBottom, paddingLeft] = resolvePaddingSides(node.padding)
  const insetBaseWidth = 'var(--pen-page-base-width, 1440px)'

  delete style.padding
  style.paddingTop = `${paddingTop}px`
  style.paddingBottom = `${paddingBottom}px`
  style.paddingLeft = `max(${paddingLeft}px, calc((100% - ${insetBaseWidth}) / 2 + ${paddingLeft}px))`
  style.paddingRight = `max(${paddingRight}px, calc((100% - ${insetBaseWidth}) / 2 + ${paddingRight}px))`
}

function resolveAbsoluteLeft(x, parentContext) {
  if (typeof x !== 'number') {
    return undefined
  }

  if (parentContext?.centerAbsoluteChildren) {
    return `calc((100% - var(--pen-page-base-width, 1440px)) / 2 + ${x}px)`
  }

  return `${x}px`
}

function getFrameClassName(node, ancestors) {
  const pageName = ancestors[0]?.name
  const classes = []
  const nodeName = node?.name || ''

  if (pageName === '首页' && node?.type === 'frame' && nodeName === 'heroLogo') {
    classes.push('home-hero-logo')
  }

  if (pageName === '团队架构-主席团' && node?.type === 'frame') {
    if (nodeName === 'row1' || nodeName === 'row2') {
      classes.push('team-leadership-row')
    }

    if (/^card\d+$/.test(nodeName) && ancestors.some((ancestor) => ancestor?.name === 'coreSec')) {
      classes.push('team-leadership-card')
    }
  }

  return classes.length > 0 ? classes.join(' ') : undefined
}

function resolveTeamTabTokenIcon(token) {
  const normalizedToken = typeof token === 'string' ? token.trim() : ''

  if (normalizedToken === '👥') {
    return Users
  }

  if (normalizedToken === '📣') {
    return Megaphone
  }

  if (normalizedToken === '<>') {
    return Code
  }

  return null
}

function resolveTextRoute(node, ancestors) {
  const rawContent = typeof node.content === 'string' ? node.content.trim() : ''
  const contextChain = buildContextChain(ancestors)

  if (EXTERNAL_ROUTES[rawContent]) {
    return EXTERNAL_ROUTES[rawContent]
  }

  if (PROJECT_TAB_ROUTES[rawContent] && hasContextPattern(contextChain, PROJECT_TAB_CONTEXT_PATTERNS)) {
    return PROJECT_TAB_ROUTES[rawContent]
  }

  if (TEAM_TAB_ROUTES[rawContent] && hasContextPattern(contextChain, TEAM_TAB_CONTEXT_PATTERNS)) {
    return TEAM_TAB_ROUTES[rawContent]
  }

  if (
    CONTEXT_BACK_ROUTES[rawContent] &&
    hasContextPattern(contextChain, [
      ...ACTIVITY_CONTEXT_PATTERNS,
      ...ARCHIVE_CONTEXT_PATTERNS,
      ...PROJECT_CONTEXT_PATTERNS,
      ...NEWS_CONTEXT_PATTERNS,
    ])
  ) {
    return CONTEXT_BACK_ROUTES[rawContent]
  }

  if (NEWS_ACTION_ROUTES[rawContent] && hasContextPattern(contextChain, NEWS_CONTEXT_PATTERNS)) {
    return NEWS_ACTION_ROUTES[rawContent]
  }

  if (ACTIVITY_ACTION_ROUTES[rawContent] && hasContextPattern(contextChain, ACTIVITY_CONTEXT_PATTERNS)) {
    return resolveActivityRouteFromAncestors(ancestors) || ACTIVITY_ACTION_ROUTES[rawContent]
  }

  if (PROJECT_ACTION_ROUTES[rawContent] && hasContextPattern(contextChain, PROJECT_CONTEXT_PATTERNS)) {
    return PROJECT_ACTION_ROUTES[rawContent]
  }

  if (GALLERY_ACTION_ROUTES[rawContent] && hasContextPattern(contextChain, GALLERY_CONTEXT_PATTERNS)) {
    return GALLERY_ACTION_ROUTES[rawContent]
  }

  const navRoute = NAV_LABEL_ROUTES[rawContent]

  if (navRoute && hasContextPattern(contextChain, PRIMARY_NAV_CONTEXT_PATTERNS)) {
    return navRoute
  }

  return null
}

function collectDescendantRoutes(node, ancestors, depth = 0, routes = new Set()) {
  if (!node || depth > MAX_ROUTE_SCAN_DEPTH) {
    return routes
  }

  if (node.type === 'text') {
    const route = resolveTextRoute(node, ancestors)

    if (route) {
      routes.add(route)
    }

    return routes
  }

  if (!Array.isArray(node.children)) {
    return routes
  }

  node.children.forEach((child) => {
    collectDescendantRoutes(child, [...ancestors, node], depth + 1, routes)
  })

  return routes
}

function resolveFrameRoute(node, ancestors) {
  if (node?.type !== 'frame' || !isPotentialInteractiveFrame(node, ancestors)) {
    return null
  }

  const routes = [...collectDescendantRoutes(node, ancestors)]

  if (routes.length !== 1) {
    return null
  }

  return routes[0]
}

function getLayoutMode(node, ancestors) {
  if (node?.type !== 'frame') {
    return { layoutMode: 'none', flexDirection: undefined, centerAbsoluteChildren: false }
  }

  if (node.layout === 'none') {
    return {
      layoutMode: 'absolute',
      flexDirection: undefined,
      centerAbsoluteChildren: isTopLevelAbsoluteSection(node, ancestors),
    }
  }

  return {
    layoutMode: 'flex',
    flexDirection: node.layout === 'vertical' ? 'column' : 'row',
    centerAbsoluteChildren: false,
  }
}

function buildBaseStyle(node, parentContext, options = {}) {
  const { includeFill = true } = options
  const style = {
    boxSizing: 'border-box',
  }

  const transform = parseTransform(node)

  if (transform) {
    style.transform = transform
  }

  if (typeof node.opacity === 'number') {
    style.opacity = node.opacity
  }

  if (node.clip) {
    style.overflow = 'hidden'
  }

  parseDimension(style, 'width', node.width, parentContext)
  parseDimension(style, 'height', node.height, parentContext)

  const cornerRadius = parseCornerRadius(node.cornerRadius)

  if (cornerRadius) {
    style.borderRadius = cornerRadius
  }

  const padding = parsePadding(node.padding)

  if (padding) {
    style.padding = padding
  }

  if (typeof node.gap === 'number') {
    style.gap = `${node.gap}px`
  }

  if (node.justifyContent) {
    style.justifyContent = JUSTIFY_CONTENT_MAP[node.justifyContent] || node.justifyContent
  }

  if (node.alignItems) {
    style.alignItems = ALIGN_ITEMS_MAP[node.alignItems] || node.alignItems
  }

  if (node.alignSelf) {
    style.alignSelf = ALIGN_ITEMS_MAP[node.alignSelf] || node.alignSelf
  }

  if (parentContext?.layoutMode === 'absolute' && (typeof node.x === 'number' || typeof node.y === 'number')) {
    style.position = 'absolute'

    if (typeof node.x === 'number') {
      style.left = resolveAbsoluteLeft(node.x, parentContext)
    }

    if (typeof node.y === 'number') {
      style.top = `${node.y}px`
    }
  }

  return {
    ...style,
    ...(includeFill ? parseFill(node.fill) : {}),
    ...parseStroke(node.stroke),
    ...parseEffect(node.effect),
  }
}

function handleBackNavigation() {
  if (window.history.length > 1) {
    window.history.back()
    return
  }

  window.location.assign('/')
}

function renderInteractiveElement({ route, className, style, children, textAlign }) {
  const interactiveStyle = {
    ...style,
    cursor: 'pointer',
    textDecoration: 'none',
    color: style.color || 'inherit',
  }

  if (route === '__BACK__') {
    return (
      <button
        type="button"
        className={className}
        style={{
          ...interactiveStyle,
          border: 0,
          appearance: 'none',
          textAlign: textAlign || 'left',
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
        }}
        onClick={handleBackNavigation}
      >
        {children}
      </button>
    )
  }

  if (/^https?:\/\//i.test(route)) {
    return (
      <a href={route} className={className} style={interactiveStyle} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

  return (
    <Link to={route} className={className} style={interactiveStyle}>
      {children}
    </Link>
  )
}

function getButtonControl(interactionControls, node) {
  if (!interactionControls?.buttonControls || !node?.id) {
    return null
  }

  return interactionControls.buttonControls[node.id] || null
}

function getInputControl(interactionControls, node) {
  if (!interactionControls?.inputControls || !node?.id) {
    return null
  }

  return interactionControls.inputControls[node.id] || null
}

function renderFrameButtonControl({ className, control, style, children }) {
  return (
    <button
      type="button"
      className={[className, 'pen-interactive', 'pen-interactive-frame', 'pen-control-button'].filter(Boolean).join(' ')}
      style={{
        border: 0,
        appearance: 'none',
        background: 'none',
        padding: 0,
        textAlign: 'inherit',
        ...style,
        color: style.color || 'inherit',
        cursor: control?.disabled ? 'default' : 'pointer',
      }}
      onClick={control?.onClick}
      disabled={control?.disabled}
      aria-label={control?.ariaLabel}
      aria-pressed={control?.ariaPressed}
    >
      {children}
    </button>
  )
}

function renderInputControl(node, parentContext, ancestors, control) {
  const style = buildBaseStyle(node, parentContext)
  const iconNode = (node.children || []).find((child) => child?.type === 'icon_font')
  const textNodes = (node.children || []).filter((child) => child?.type === 'text')
  const iconTextNode = textNodes.find((child) => String(child.content || '').trim() === '⌕')
  const placeholderNode = textNodes.find((child) => child?.id !== iconTextNode?.id)
  const IconComponent = iconNode ? resolveIcon(iconNode, ancestors) : null

  style.display = 'flex'
  style.alignItems = 'center'

  return (
    <label
      className="pen-search-control"
      style={{
        ...style,
        '--pen-search-placeholder-color': resolveTextColor(placeholderNode?.fill || '#99a3b2'),
        cursor: 'text',
      }}
    >
      {IconComponent ? (
        <span
          className="pen-search-control-icon"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: resolveTextColor(iconNode.fill),
          }}
        >
          <IconComponent size={18} strokeWidth={2.2} />
        </span>
      ) : iconTextNode ? (
        <span
          className="pen-search-control-icon"
          style={{
            color: resolveTextColor(iconTextNode.fill),
            fontFamily: iconTextNode.fontFamily || 'Noto Sans SC, PingFang SC, sans-serif',
            fontSize: toPx(iconTextNode.fontSize) || '16px',
            fontWeight: iconTextNode.fontWeight || 500,
            lineHeight: typeof iconTextNode.lineHeight === 'number' ? iconTextNode.lineHeight : undefined,
          }}
        >
          {iconTextNode.content}
        </span>
      ) : null}

      <input
        type="search"
        className="pen-search-control-input"
        value={control?.value || ''}
        placeholder={control?.placeholder || placeholderNode?.content || ''}
        aria-label={control?.ariaLabel}
        onChange={control?.onChange}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          outline: 'none',
          background: 'transparent',
          color: '#1d2638',
          fontFamily: placeholderNode?.fontFamily || 'Noto Sans SC, PingFang SC, sans-serif',
          fontSize: toPx(placeholderNode?.fontSize) || '14px',
          fontWeight: placeholderNode?.fontWeight || 400,
          lineHeight: typeof placeholderNode?.lineHeight === 'number' ? placeholderNode.lineHeight : undefined,
        }}
      />
    </label>
  )
}

function renderTextNode(node, parentContext, ancestors, interactiveAncestor = false) {
  const style = buildBaseStyle(node, parentContext, { includeFill: false })
  const route = interactiveAncestor ? null : resolveTextRoute(node, ancestors)
  const contextChain = buildContextChain(ancestors)

  style.color = resolveTextColor(node.fill)
  style.fontFamily = node.fontFamily || 'Noto Sans SC, PingFang SC, sans-serif'
  style.fontSize = toPx(node.fontSize) || '16px'
  style.fontWeight = node.fontWeight || 400
  style.whiteSpace = 'pre-wrap'
  style.wordBreak = 'break-word'

  if (typeof node.lineHeight === 'number') {
    style.lineHeight = node.lineHeight
  }

  if (node.textAlign) {
    style.textAlign = node.textAlign
  }

  if (hasContextPattern(contextChain, ['tabwrap'])) {
    const TeamTabIcon = resolveTeamTabTokenIcon(node.content)

    if (TeamTabIcon) {
      const iconSize = typeof node.fontSize === 'number' ? node.fontSize + 2 : 16

      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center' }}>
          <TeamTabIcon size={iconSize} color={style.color} strokeWidth={2.2} />
        </div>
      )
    }
  }

  if (route) {
    return renderInteractiveElement({
      route,
      className: 'pen-interactive pen-interactive-text',
      style: {
        ...style,
        display: 'block',
      },
      children: node.content ?? '',
      textAlign: style.textAlign,
    })
  }

  return <div style={style}>{node.content ?? ''}</div>
}

function renderIconNode(node, parentContext, ancestors) {
  const style = buildBaseStyle(node, parentContext, { includeFill: false })
  const iconOverride = resolveValueCardIconOverride(node, ancestors)
  const IconComponent = resolveIcon(node, ancestors)
  const iconWidth = typeof node.width === 'number' ? node.width : 20
  const iconHeight = typeof node.height === 'number' ? node.height : 20
  const iconSize = iconOverride?.component
    ? iconOverride.size || VALUE_CARD_ICON_RENDER.size
    : Math.min(iconWidth, iconHeight)
  const strokeWidth = iconOverride?.component
    ? iconOverride.strokeWidth || VALUE_CARD_ICON_RENDER.strokeWidth
    : typeof node.weight === 'number'
      ? Math.max(1.5, Math.min(3, node.weight / 240))
      : 2
  const iconTransform = iconOverride?.component
    ? `translateY(${iconOverride.translateY ?? VALUE_CARD_ICON_RENDER.translateY}px)`
    : undefined

  style.display = 'flex'
  style.alignItems = 'center'
  style.justifyContent = 'center'

  return (
    <div style={style}>
      <IconComponent
        color={resolveTextColor(node.fill)}
        size={iconSize}
        strokeWidth={strokeWidth}
        style={iconTransform ? { transform: iconTransform } : undefined}
        absoluteStrokeWidth={iconOverride?.component ? VALUE_CARD_ICON_RENDER.absoluteStrokeWidth : undefined}
      />
    </div>
  )
}

interface PenNodeProps {
  node: PenNodeModel | null | undefined
  parentContext?: PenLayoutContext
  ancestors?: PenNodeModel[]
  interactiveAncestor?: boolean
  interactionControls?: PenInteractionControls
}

function PenNode({
  node,
  parentContext = { layoutMode: 'none', flexDirection: undefined },
  ancestors = [],
  interactiveAncestor = false,
  interactionControls,
}: PenNodeProps): ReactNode {
  if (!node || typeof node !== 'object') {
    return null
  }

  if (node.visible === false || interactionControls?.hiddenNodeIds?.has(node.id)) {
    return null
  }

  if (node.type === 'text') {
    return renderTextNode(node, parentContext, ancestors, interactiveAncestor)
  }

  if (node.type === 'icon_font') {
    return renderIconNode(node, parentContext, ancestors)
  }

  const style = buildBaseStyle(node, parentContext)

  if (node.type === 'frame') {
    if (isNativeBackToTopNode(node)) {
      return null
    }

    const layout = getLayoutMode(node, ancestors)
    const inputControl = getInputControl(interactionControls, node)
    const buttonControl = getButtonControl(interactionControls, node)
    const frameRoute = interactiveAncestor ? null : resolveFrameRoute(node, ancestors)
    const baseClassName = getFrameClassName(node, ancestors)
    const className = [baseClassName, frameRoute ? 'pen-interactive pen-interactive-frame' : null]
      .filter(Boolean)
      .join(' ') || undefined

    if (layout.layoutMode === 'flex') {
      style.display = 'flex'
      style.flexDirection = layout.flexDirection
    }

    if (layout.layoutMode === 'absolute') {
      style.position = 'relative'
    }

    if (isTopLevelAbsoluteSection(node, ancestors)) {
      applyTopLevelAbsoluteSectionInsets(style, node)
    }

    if (inputControl) {
      return renderInputControl(node, parentContext, ancestors, inputControl)
    }

    const children = Array.isArray(node.children)
      ? node.children.map((child, index) => (
          <PenNode
            key={child.id ?? `${node.id}-child-${index}`}
            node={child}
            parentContext={layout}
            ancestors={[...ancestors, node]}
            interactiveAncestor={interactiveAncestor || Boolean(frameRoute) || Boolean(buttonControl)}
            interactionControls={interactionControls}
          />
        ))
      : null

    if (buttonControl) {
      return renderFrameButtonControl({
        className: baseClassName,
        control: buttonControl,
        style,
        children,
      })
    }

    if (frameRoute) {
      return renderInteractiveElement({
        route: frameRoute,
        className,
        style,
        children,
      })
    }

    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  if (node.type === 'ellipse') {
    style.borderRadius = '9999px'
  }

  return <div style={style} />
}

export default PenNode
