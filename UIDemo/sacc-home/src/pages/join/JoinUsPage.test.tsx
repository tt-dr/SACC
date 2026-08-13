import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import JoinUsPage from './JoinUsPage'

describe('JoinUsPage', () => {
  it('uses the extracted back-to-top button to scroll the join page container', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <JoinUsPage />
      </MemoryRouter>,
    )

    const scrollContainer = container.querySelector('.join-page-scroll')
    const scrollTo = vi.fn()

    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    })
    scrollContainer.scrollTo = scrollTo

    expect(screen.queryByRole('button', { name: '返回顶部' })).not.toBeInTheDocument()

    scrollContainer.scrollTop = 360
    fireEvent.scroll(scrollContainer)

    await user.click(screen.getByRole('button', { name: '返回顶部' }))

    expect(screen.getByRole('button', { name: '返回顶部' })).toHaveClass('join-back-to-top-button')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
