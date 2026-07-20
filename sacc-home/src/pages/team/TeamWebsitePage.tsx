import { useMemo } from 'react'
import ResponsivePenPage from '../../components/ResponsivePenPage'
import useInteractivePenPage from '../../hooks/useInteractivePenPage'
import useNormalizedPenPage from '../../hooks/useNormalizedPenPage'
import { createResponsivePageNode, resolvePageBackground, resolvePageWidth } from '../../lib/penPage'
import { normalizeTeamPageFromPen } from './normalizeTeamPageFromPen'
import type { PenNode } from '../../types/pen'

interface TeamWebsitePageProps {
  page?: PenNode | null
}

function TeamWebsitePage({ page }: TeamWebsitePageProps) {
  const normalizedPage = useNormalizedPenPage(page, normalizeTeamPageFromPen)
  const { interactionControls, pageNode: interactivePage } = useInteractivePenPage(normalizedPage)

  const pageNode = useMemo(() => {
    return createResponsivePageNode(interactivePage)
  }, [interactivePage])

  if (!interactivePage || !pageNode) {
    return <div className="app-status">页面不存在。</div>
  }

  const pageWidth = resolvePageWidth(interactivePage)
  const pageBackground = resolvePageBackground(interactivePage.fill)

  return (
    <ResponsivePenPage
      pageNode={pageNode}
      pageWidth={pageWidth}
      pageBackground={pageBackground}
      interactionControls={interactionControls}
    />
  )
}

export default TeamWebsitePage
