import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { normalizeWebsitePageFromPen } from '../pages/normalizeWebsitePageFromPen'
import type { PenNode, PenPageNormalizer } from '../types/pen'

function identityPageNormalizer(page: PenNode | null | undefined) {
  return page
}

function useNormalizedPenPage(page: PenNode | null | undefined, normalizePage: PenPageNormalizer = identityPageNormalizer) {
  const location = useLocation()

  const routeNormalizedPage = useMemo(() => {
    return normalizeWebsitePageFromPen(page, location.pathname)
  }, [location.pathname, page])

  return useMemo(() => {
    return normalizePage(routeNormalizedPage, location.pathname)
  }, [location.pathname, normalizePage, routeNormalizedPage])
}

export default useNormalizedPenPage
