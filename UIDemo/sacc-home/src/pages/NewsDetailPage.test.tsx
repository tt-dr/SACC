import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SiteDataProvider } from '../context/SiteDataContext'
import { fallbackSiteContent } from '../content/siteContent'
import NewsDetailPage from './NewsDetailPage'

function renderDetail(slug) {
  return render(
    <SiteDataProvider>
      <MemoryRouter initialEntries={[`/news/${slug}`]}>
        <Routes>
          <Route path="/news/:newsId" element={<NewsDetailPage />} />
          <Route path="/news" element={<div>news list</div>} />
        </Routes>
      </MemoryRouter>
    </SiteDataProvider>,
  )
}

describe('NewsDetailPage 文章详情', () => {
  it('renders the article body and its table of contents', () => {
    const { container } = renderDetail('server-components-notes')

    expect(screen.getByRole('heading', { level: 1, name: '把首屏交给 Server Components：官网性能优化实录' })).toBeInTheDocument()

    const tocLinks = container.querySelectorAll('.doc-toc-link')
    expect(tocLinks.length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /优化方案/ })).toBeInTheDocument()
  })

  it('lists all articles by the same author in the left sidebar', () => {
    const { container } = renderDetail('server-components-notes')

    const authorPostCount = fallbackSiteContent.news.filter((post) => post.author === '林嘉禾').length
    const sidebarItems = container.querySelectorAll('.doc-sidebar-item')

    expect(sidebarItems).toHaveLength(authorPostCount)
    expect(authorPostCount).toBeGreaterThan(1)

    const activeItem = container.querySelector('.doc-sidebar-item.is-active')
    expect(activeItem?.textContent).toContain('把首屏交给 Server Components：官网性能优化实录')
  })
})
