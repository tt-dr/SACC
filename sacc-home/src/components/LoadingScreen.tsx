import { useEffect, useState, type CSSProperties } from 'react'

const DEFAULT_PROGRESS = 0
const AUTO_PROGRESS_MAX = 100
const AUTO_PROGRESS_INTERVAL = 60
const DEFAULT_STEPS = ['建立连接', '同步活动', '编排内容', '渲染页面']

interface LoadingScreenProps {
  label?: string
  progress?: number
  title?: string
  description?: string
  steps?: string[]
}

function clampProgress(progress) {
  const numericProgress = Number(progress)

  if (Number.isNaN(numericProgress)) {
    return DEFAULT_PROGRESS
  }

  return Math.max(0, Math.min(100, Math.round(numericProgress)))
}

function getNextAutoProgress(currentProgress: number) {
  if (currentProgress >= AUTO_PROGRESS_MAX) {
    return currentProgress
  }

  if (currentProgress >= 96) {
    return Math.min(AUTO_PROGRESS_MAX, currentProgress + 1)
  }

  if (currentProgress >= 84) {
    return Math.min(AUTO_PROGRESS_MAX, currentProgress + 2)
  }

  if (currentProgress >= 64) {
    return Math.min(AUTO_PROGRESS_MAX, currentProgress + 3)
  }

  if (currentProgress >= 36) {
    return Math.min(AUTO_PROGRESS_MAX, currentProgress + 4)
  }

  return Math.min(AUTO_PROGRESS_MAX, currentProgress + 5)
}

function getActiveStepIndex(progress: number, steps: string[]) {
  if (steps.length === 0) {
    return -1
  }

  return Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length))
}

function LoadingScreen({
  label = '页面加载中',
  progress,
  title = '正在进入社团空间',
  description = '我们正在同步社团资料、活动动态与学习资源，请稍候片刻。',
  steps = DEFAULT_STEPS,
}: LoadingScreenProps) {
  const normalizedSteps = steps.length > 0 ? steps : DEFAULT_STEPS
  const [autoProgress, setAutoProgress] = useState(() => clampProgress(DEFAULT_PROGRESS))

  useEffect(() => {
    if (progress != null) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setAutoProgress((currentProgress) => getNextAutoProgress(currentProgress))
    }, AUTO_PROGRESS_INTERVAL)

    return () => {
      window.clearInterval(timer)
    }
  }, [progress])

  const clampedProgress = progress != null ? clampProgress(progress) : clampProgress(autoProgress)
  const activeStepIndex = getActiveStepIndex(clampedProgress, normalizedSteps)
  const currentStep = normalizedSteps[activeStepIndex] ?? '准备中'
  const progressStyle = { '--loading-progress': `${clampedProgress}%` } as CSSProperties & {
    '--loading-progress': string
  }

  return (
    <div className="app-status app-loading-screen">
      <span className="app-visually-hidden" role="status" aria-live="polite" aria-label={label}>
        {label}
      </span>

      <div className="app-loading-ghosts" aria-hidden="true">
        <div className="app-loading-ghost app-loading-ghost-header" />
        <div className="app-loading-ghost app-loading-ghost-hero" />
        <div className="app-loading-ghost app-loading-ghost-stats" />
        <div className="app-loading-ghost app-loading-ghost-content app-loading-ghost-content-top" />
        <div className="app-loading-ghost app-loading-ghost-content app-loading-ghost-content-bottom" />
      </div>

      <div className="app-loading-mask" aria-hidden="true" />

      <div className="app-loading-center">
        <div className="app-loading-badge">
          <span className="app-loading-badge-dot" aria-hidden="true" />
          <span>全屏加载中</span>
        </div>

        <div className="app-loading-brand">
          <img className="app-loading-brand-mark" src="/sacc-logo.svg" alt="" />
          <div className="app-loading-brand-copy">
            <div className="app-loading-brand-name">SACC</div>
            <div className="app-loading-brand-subtitle">Science Association of Computer College</div>
          </div>
        </div>

        <div className="app-loading-ring-shell" aria-hidden="true">
          <div className="app-loading-ring-rotator">
            <div className="app-loading-ring" style={progressStyle} />
            <div className="app-loading-ring-orbit">
              <span className="app-loading-ring-orbit-dot app-loading-ring-orbit-dot-orange" />
              <span className="app-loading-ring-orbit-dot app-loading-ring-orbit-dot-blue" />
              <span className="app-loading-ring-orbit-dot app-loading-ring-orbit-dot-soft" />
            </div>
          </div>
          <div className="app-loading-ring-core">
            <div className="app-loading-ring-value">{clampedProgress}%</div>
            <div className="app-loading-ring-label">Loading</div>
          </div>
        </div>

        <div className="app-loading-copy">
          <h1 className="app-loading-heading">{title}</h1>
          <p className="app-loading-description">{description}</p>
        </div>

        <div className="app-loading-progress">
          <div className="app-loading-progress-head">
            <span className="app-loading-progress-title">初始化页面资源</span>
            <span className="app-loading-progress-value">{clampedProgress} / 100</span>
          </div>
          <div className="app-loading-progress-track" aria-hidden="true">
            <div className="app-loading-progress-fill" style={{ width: `${clampedProgress}%` }} />
          </div>
        </div>

        <div className="app-loading-steps" aria-hidden="true">
          {normalizedSteps.map((step, index) => {
            const stepClassName = [
              'app-loading-step-chip',
              index < activeStepIndex ? 'is-done' : '',
              index === activeStepIndex ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <span key={`${step}-${index}`} className={stepClassName}>
                <span className="app-loading-step-index">{String(index + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </span>
            )
          })}
        </div>

        <div className="app-loading-stage" aria-hidden="true">
          <span className="app-loading-stage-label">当前阶段</span>
          <span className="app-loading-stage-value">{currentStep}</span>
          <span className="app-loading-stage-dots">
            <span className="app-loading-stage-dot" />
            <span className="app-loading-stage-dot" />
            <span className="app-loading-stage-dot" />
          </span>
        </div>

        <p className="app-loading-footnote">首次加载通常只需 1 - 2 秒</p>
      </div>
    </div>
  )
}

export default LoadingScreen
