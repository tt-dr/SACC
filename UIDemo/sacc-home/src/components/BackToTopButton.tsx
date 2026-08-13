import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

function getScrollContainer(scrollTargetRef) {
  if (scrollTargetRef?.current) {
    return scrollTargetRef.current
  }

  if (typeof window !== 'undefined') {
    return window
  }

  return null
}

function getScrollTop(scrollContainer) {
  if (!scrollContainer) {
    return 0
  }

  if ('scrollTop' in scrollContainer && typeof scrollContainer.scrollTop === 'number') {
    return scrollContainer.scrollTop
  }

  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
}

function BackToTopButton({
  scrollTargetRef,
  className = '',
  iconSize = 42,
  strokeWidth = 2.6,
  showAfter = 280,
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const scrollContainer = getScrollContainer(scrollTargetRef)

    if (!scrollContainer) {
      return undefined
    }

    const handleScroll = () => {
      const nextVisible = getScrollTop(scrollContainer) > showAfter

      setIsVisible((currentVisible) => {
        return currentVisible === nextVisible ? currentVisible : nextVisible
      })
    }

    handleScroll()
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [scrollTargetRef, showAfter])

  const handleBackToTop = () => {
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) {
    return null
  }

  const buttonClassName = ['back-top-button', className].filter(Boolean).join(' ')

  return (
    <button className={buttonClassName} type="button" onClick={handleBackToTop} aria-label="返回顶部">
      <ArrowUp size={iconSize} strokeWidth={strokeWidth} />
    </button>
  )
}

export default BackToTopButton
