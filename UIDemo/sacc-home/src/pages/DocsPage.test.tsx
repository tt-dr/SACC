import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SiteDataProvider } from '../context/SiteDataContext'
import { fallbackSiteContent } from '../content/siteContent'
import DocsPage from './DocsPage'

function renderDocsPage(initialEntry = '/docs') {
  return render(
    <SiteDataProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:docId" element={<DocsPage />} />
        </Routes>
      </MemoryRouter>
    </SiteDataProvider>,
  )
}

describe('DocsPage 文档库', () => {
  it('lists every doc in the sidebar', () => {
    const { container } = renderDocsPage()

    const sidebarItems = container.querySelectorAll('.doc-sidebar-item')
    expect(sidebarItems).toHaveLength(fallbackSiteContent.docs.length)
  })

  it('renders the selected doc content and its table of contents', () => {
    const { container } = renderDocsPage('/docs/tech-stack')

    expect(screen.getByRole('heading', { level: 1, name: '技术方案' })).toBeInTheDocument()

    const tocLinks = container.querySelectorAll('.doc-toc-link')
    expect(tocLinks.length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /技术选型/ })).toBeInTheDocument()
  })

  it('marks the active doc in the sidebar', async () => {
    const user = userEvent.setup()
    const { container } = renderDocsPage()

    await user.click(screen.getByRole('link', { name: 'Git 协作规范' }))

    const activeItem = container.querySelector('.doc-sidebar-item.is-active')
    expect(activeItem?.textContent).toContain('Git 协作规范')
  })
})
