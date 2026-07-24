import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SiteDataProvider } from '../context/SiteDataContext'
import { fallbackSiteContent } from '../content/siteContent'
import NewsPage from './NewsPage'

function renderNewsPage() {
  return render(
    <SiteDataProvider>
      <MemoryRouter initialEntries={['/news']}>
        <NewsPage />
      </MemoryRouter>
    </SiteDataProvider>,
  )
}

describe('NewsPage 成员动态', () => {
  it('renders all member posts sorted by date desc by default', () => {
    const { container } = renderNewsPage()

    const cardTitles = [...container.querySelectorAll('.blog-card-title')].map((node) => node.textContent)

    expect(cardTitles).toHaveLength(fallbackSiteContent.news.length)

    const sortedTitles = [...fallbackSiteContent.news]
      .sort((left, right) => right.date.localeCompare(left.date))
      .map((item) => item.title)

    expect(cardTitles).toEqual(sortedTitles)
  })

  it('filters posts by author when clicking an author chip', async () => {
    const user = userEvent.setup()
    const { container } = renderNewsPage()

    await user.click(screen.getByRole('button', { name: '沈知白' }))

    await waitFor(() => {
      const cards = container.querySelectorAll('.blog-card')
      expect(cards).toHaveLength(1)
    })

    expect(screen.getByText('给社团知识库接上检索增强：一次 RAG 落地复盘')).toBeInTheDocument()
  })

  it('filters posts by search keyword', async () => {
    const user = userEvent.setup()
    const { container } = renderNewsPage()

    await user.type(screen.getByPlaceholderText('搜索标题、摘要或标签'), '权限')

    await waitFor(() => {
      const cards = container.querySelectorAll('.blog-card')
      expect(cards).toHaveLength(1)
    })

    expect(screen.getByText('Gin + Gorm 权限中间件的三个设计取舍')).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    renderNewsPage()

    await user.type(screen.getByPlaceholderText('搜索标题、摘要或标签'), '不存在的关键词xyz')

    expect(await screen.findByText('没有匹配的动态，试试更换作者或关键词。')).toBeInTheDocument()
  })
})
