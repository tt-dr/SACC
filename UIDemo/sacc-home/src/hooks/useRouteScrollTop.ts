import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollNodeToTop } from '../lib/scrollToTop'

function useRouteScrollTop(scrollTargetRef) {
  const location = useLocation()

  useEffect(() => {
    scrollNodeToTop(scrollTargetRef?.current ?? (typeof window !== 'undefined' ? window : null))
  }, [location.key, location.pathname, scrollTargetRef])
}

export default useRouteScrollTop
