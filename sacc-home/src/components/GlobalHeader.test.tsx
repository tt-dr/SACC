import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import GlobalHeader from './GlobalHeader'

describe('GlobalHeader', () => {
  it('scrolls the current page container to the top when clicking the active nav item', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter initialEntries={['/about']}>
        <div className="website-route-scroll" style={{ overflowY: 'auto' }}>
          <GlobalHeader />
        </div>
      </MemoryRouter>,
    )

    const scrollContainer = container.querySelector('.website-route-scroll')
    const scrollTo = vi.fn()

    Object.defineProperty(scrollContainer, 'clientHeight', {
      value: 640,
      configurable: true,
    })
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      value: 1440,
      configurable: true,
    })
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 320,
      writable: true,
      configurable: true,
    })

    scrollContainer.scrollTo = scrollTo

    await user.click(screen.getByRole('link', { name: '关于我们' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })
})
