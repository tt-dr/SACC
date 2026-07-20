import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoadingScreen from './LoadingScreen'

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders the full-screen loading overlay content', () => {
    render(<LoadingScreen />)

    expect(screen.getByRole('status', { name: '页面加载中' })).toBeInTheDocument()
    expect(screen.getByText('全屏加载中').closest('.app-loading-screen')).toBeInTheDocument()
    expect(screen.getByText('全屏加载中')).toBeInTheDocument()
    expect(screen.getByText('正在进入社团空间')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('0 / 100')).toBeInTheDocument()
  })

  it('clamps progress and exposes the provided accessible label', () => {
    render(<LoadingScreen label="站点资源加载中" progress={142} />)

    expect(screen.getByRole('status', { name: '站点资源加载中' })).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('100 / 100')).toBeInTheDocument()
  })

  it('animates the fallback progress when no explicit progress is provided', () => {
    render(<LoadingScreen />)

    act(() => {
      vi.advanceTimersByTime(240)
    })

    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.getAllByText('建立连接')).toHaveLength(2)
  })

  it('renders the provided progress immediately when controlled externally', () => {
    render(<LoadingScreen progress={42} />)

    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('42 / 100')).toBeInTheDocument()
  })
})
