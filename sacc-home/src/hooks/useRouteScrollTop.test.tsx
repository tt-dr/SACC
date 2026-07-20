import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import useRouteScrollTop from './useRouteScrollTop'

function ScrollAwareShell() {
  const scrollRef = useRef(null)
  const location = useLocation()

  useRouteScrollTop(scrollRef)

  return (
    <div>
      <Link to="/news">切到动态</Link>
      <div ref={scrollRef} className="website-route-scroll" data-testid="scroll-shell">
        {location.pathname}
      </div>
    </div>
  )
}

describe('useRouteScrollTop', () => {
  it('scrolls the route container to the top after navigation', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/about']}>
        <ScrollAwareShell />
      </MemoryRouter>,
    )

    const scrollContainer = screen.getByTestId('scroll-shell')
    const scrollTo = vi.fn()

    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 260,
      writable: true,
      configurable: true,
    })
    scrollContainer.scrollTo = scrollTo

    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: '切到动态' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })
})
