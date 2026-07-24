import { useMemo } from 'react'
import ResponsivePenPage from '../components/ResponsivePenPage'
import useInteractivePenPage from '../hooks/useInteractivePenPage'
import useNormalizedPenPage from '../hooks/useNormalizedPenPage'
import { createResponsivePageNode, resolvePageBackground, resolvePageWidth } from '../lib/penPage'
import type { PenInteractionControls, PenNode } from '../types/pen'

interface WebsitePageProps {
  page?: PenNode | null
}

function WebsitePage({ page }: WebsitePageProps) {
  const normalizedPage = useNormalizedPenPage(page)

  const { interactionControls, pageNode: interactivePage } = useInteractivePenPage(normalizedPage)

  const pageNode = useMemo(() => {
    return createResponsivePageNode(interactivePage)
  }, [interactivePage])

  const pageWidth = resolvePageWidth(interactivePage)
  const pageBackground = resolvePageBackground(pageNode?.fill)

  if (!pageNode) {
    return <div className="app-status">页面不存在。</div>
  }

  return (
    <ResponsivePenPage
      pageNode={pageNode}
      pageWidth={pageWidth}
      pageBackground={pageBackground}
      interactionControls={interactionControls as PenInteractionControls}
    />
  )
}

export default WebsitePage
