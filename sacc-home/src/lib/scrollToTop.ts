type ScrollTarget = Window | (Element & { scrollTop?: number; scrollLeft?: number; scrollTo?: (options: ScrollToOptions) => void })

const KNOWN_SCROLL_CONTAINER_CLASSNAMES = new Set([
  'home-page-scroll',
  'join-page-scroll',
  'site-scroll',
  'website-route-scroll',
])

function isKnownScrollContainer(element) {
  if (!element?.classList) {
    return false
  }

  return [...KNOWN_SCROLL_CONTAINER_CLASSNAMES].some((className) => element.classList.contains(className))
}

function hasScrollableOverflow(element) {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return false
  }

  const styles = window.getComputedStyle(element)
  const overflowY = styles.overflowY || styles.overflow || ''

  return /(auto|overlay|scroll)/.test(overflowY) && element.scrollHeight > element.clientHeight
}

export function findScrollableAncestor(node) {
  let current = node?.parentElement ?? null

  while (current) {
    if (isKnownScrollContainer(current) || hasScrollableOverflow(current)) {
      return current
    }

    current = current.parentElement
  }

  return null
}

export function scrollNodeToTop(scrollNode: ScrollTarget | null | undefined, behavior: ScrollBehavior = 'auto') {
  if (!scrollNode) {
    return
  }

  const nextPosition = { top: 0, left: 0, behavior }

  if (typeof scrollNode.scrollTo === 'function') {
    scrollNode.scrollTo(nextPosition)
    return
  }

  if ('scrollTop' in scrollNode) {
    scrollNode.scrollTop = 0

    if ('scrollLeft' in scrollNode) {
      scrollNode.scrollLeft = 0
    }

    return
  }

  if (typeof window !== 'undefined') {
    window.scrollTo(nextPosition)
  }
}

export function scrollClosestContainerToTop(node: Element | null | undefined, behavior: ScrollBehavior = 'auto') {
  const scrollContainer = findScrollableAncestor(node)

  scrollNodeToTop(scrollContainer ?? (typeof window !== 'undefined' ? window : null), behavior)
}
