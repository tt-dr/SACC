/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { fallbackSiteContent } from '../content/siteContent'
import type { SiteContent } from '../content/siteContent'
import { loadSiteContent } from '../lib/siteApi'

interface SiteDataContextValue {
  content: SiteContent
  source: 'fallback' | 'remote'
  syncError: string
  isLoading: boolean
}

const SiteDataContext = createContext<SiteDataContextValue | null>(null)

export function SiteDataProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState(fallbackSiteContent)
  const [source, setSource] = useState<'fallback' | 'remote'>('fallback')
  const [syncError, setSyncError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    loadSiteContent({ signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) {
        return
      }

      setContent(result.data)
      setSource(result.source)
      setSyncError(result.error || '')
      setIsLoading(false)
    })

    return () => controller.abort()
  }, [])

  const value = useMemo(
    () => ({
      content,
      source,
      syncError,
      isLoading,
    }),
    [content, isLoading, source, syncError],
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData(): SiteDataContextValue {
  const context = useContext(SiteDataContext)

  if (!context) {
    throw new Error('useSiteData 必须在 SiteDataProvider 内使用')
  }

  return context
}
