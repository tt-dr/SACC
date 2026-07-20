import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PageHeroAction {
  label: string
  to: string
  tone?: 'secondary'
}

interface PageHeroProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: PageHeroAction[]
  aside?: ReactNode
}

function PageHero({ eyebrow, title, description, actions = [], aside = null }: PageHeroProps) {
  return (
    <section className="site-hero">
      <div className="site-container site-hero-grid">
        <div className="site-hero-copy">
          {eyebrow ? <span className="site-eyebrow">{eyebrow}</span> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}

          {actions.length > 0 ? (
            <div className="site-action-row">
              {actions.map((action) => (
                <Link
                  key={`${action.label}-${action.to}`}
                  className={`site-button${action.tone === 'secondary' ? ' is-secondary' : ''}`}
                  to={action.to}
                >
                  <span>{action.label}</span>
                  <ArrowRight size={18} strokeWidth={2.2} />
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {aside ? <div className="site-hero-aside">{aside}</div> : null}
      </div>
    </section>
  )
}

export default PageHero
