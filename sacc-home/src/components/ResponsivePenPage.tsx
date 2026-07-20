import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import BackToTopButton from './BackToTopButton'
import GlobalHeader from './GlobalHeader'
import PenNode from '../renderer/PenNode'
import useRouteScrollTop from '../hooks/useRouteScrollTop'
import type { PenInteractionControls, PenNode as PenPageNode } from '../types/pen'

const PAGE_SIDE_GUTTER = 0

function getViewportWidth(scrollContainer) {
  if (scrollContainer?.clientWidth) {
    return scrollContainer.clientWidth
  }

  if (typeof window !== 'undefined') {
    return window.innerWidth
  }

  return 0
}

interface ResponsivePenPageProps {
  pageNode: PenPageNode
  pageWidth?: number
  pageBackground?: string
  backToTopClassName?: string
  interactionControls?: PenInteractionControls
}

function ResponsivePenPage({
  pageNode,
  pageWidth = 1440,
  pageBackground = '#eef2f7',
  backToTopClassName = '',
  interactionControls,
}: ResponsivePenPageProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  useRouteScrollTop(scrollRef)

  useEffect(() => {
    const scrollContainer = scrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    const updateViewportWidth = () => {
      setViewportWidth(getViewportWidth(scrollContainer))
    }

    updateViewportWidth()

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => {
        updateViewportWidth()
      })

      observer.observe(scrollContainer)

      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateViewportWidth)

    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])

  useEffect(() => {
    const pageElement = pageRef.current

    if (!pageElement) {
      return undefined
    }

    const updateContentHeight = () => {
      setContentHeight(pageElement.scrollHeight || pageElement.getBoundingClientRect().height || 0)
    }

    updateContentHeight()

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => {
        updateContentHeight()
      })

      observer.observe(pageElement)

      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateContentHeight)

    return () => window.removeEventListener('resize', updateContentHeight)
  }, [pageNode])

  const scale = useMemo(() => {
    if (!viewportWidth || pageWidth <= 0) {
      return 1
    }

    const availableWidth = Math.max(320, viewportWidth - PAGE_SIDE_GUTTER * 2)

    if (availableWidth >= pageWidth) {
      return 1
    }

    return Number((availableWidth / pageWidth).toFixed(4))
  }, [pageWidth, viewportWidth])

  const stageStyle = useMemo<CSSProperties | undefined>(() => {
    if (scale >= 1 || !contentHeight) {
      return undefined
    }

    return {
      minHeight: `${Math.ceil(contentHeight * scale)}px`,
    }
  }, [contentHeight, scale])

  const isFluidLayout = scale >= 1 && viewportWidth > pageWidth

  const pageShellStyle = useMemo<CSSProperties>(() => {
    return {
      width: isFluidLayout ? '100%' : `${pageWidth}px`,
      transform: scale < 1 ? `scale(${scale})` : undefined,
    }
  }, [isFluidLayout, pageWidth, scale])

  const pageStyle = useMemo<CSSProperties & { '--pen-page-base-width': string }>(() => {
    return {
      '--pen-page-base-width': `${pageWidth}px`,
      width: isFluidLayout ? '100%' : `${pageWidth}px`,
    }
  }, [isFluidLayout, pageWidth])

  return (
    <div ref={scrollRef} className="website-route-scroll" style={{ background: pageBackground }}>
      <GlobalHeader />

      <div className={`website-route-stage${scale < 1 ? ' is-scaled' : ''}${isFluidLayout ? ' is-fluid' : ''}`} style={stageStyle}>
        <div className="website-route-page-shell" style={pageShellStyle}>
          <div ref={pageRef} className="website-route-page" style={pageStyle}>
            <PenNode node={pageNode} interactionControls={interactionControls} />
          </div>
        </div>
      </div>

      <BackToTopButton
        scrollTargetRef={scrollRef}
        className={backToTopClassName}
        iconSize={26}
        strokeWidth={2.4}
      />
    </div>
  )
}

export default ResponsivePenPage
