import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BackToTopButton from './BackToTopButton'

describe('BackToTopButton', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      writable: true,
    })

    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    })
  })

  it('shows only after the provided container is scrolled and hides again at the top', () => {
    const scrollTo = vi.fn()
    const scrollContainer = document.createElement('div')
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(scrollContainer, 'scrollTo', {
      value: scrollTo,
      writable: true,
    })
    const scrollTargetRef = {
      current: scrollContainer,
    }

    render(<BackToTopButton scrollTargetRef={scrollTargetRef} showAfter={120} />)

    expect(screen.queryByRole('button', { name: '返回顶部' })).not.toBeInTheDocument()

    scrollContainer.scrollTop = 160
    fireEvent.scroll(scrollContainer)

    expect(screen.getByRole('button', { name: '返回顶部' })).toBeInTheDocument()

    scrollContainer.scrollTop = 0
    fireEvent.scroll(scrollContainer)

    expect(screen.queryByRole('button', { name: '返回顶部' })).not.toBeInTheDocument()
  })

  it('scrolls the provided container to the top when clicked', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.fn()
    const scrollContainer = document.createElement('div')
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 160,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(scrollContainer, 'scrollTo', {
      value: scrollTo,
      writable: true,
    })
    const scrollTargetRef = {
      current: scrollContainer,
    }

    render(<BackToTopButton scrollTargetRef={scrollTargetRef} showAfter={120} />)

    fireEvent.scroll(scrollContainer)

    await user.click(screen.getByRole('button', { name: '返回顶部' }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('falls back to window scrolling when no container ref is provided', async () => {
    const user = userEvent.setup()

    render(<BackToTopButton showAfter={120} />)

    expect(screen.queryByRole('button', { name: '返回顶部' })).not.toBeInTheDocument()

    window.scrollY = 160
    fireEvent.scroll(window)

    await user.click(screen.getByRole('button', { name: '返回顶部' }))

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
