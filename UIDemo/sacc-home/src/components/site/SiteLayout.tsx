import { ArrowRight, ExternalLink, Globe, Mail, MapPin, Server, ShieldCheck } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BackToTopButton from '../BackToTopButton'
import useRouteScrollTop from '../../hooks/useRouteScrollTop'
import { useSiteData } from '../../context/SiteDataContext'
import './site.css'

const TECH_DEPTS = [
  { label: '前端组', href: '#' },
  { label: '后端组', href: '#' },
  { label: '安全组', href: '#' },
  { label: 'Python组', href: '#' },
  { label: '算法组', href: '#' },
]

function resolveNavActive(pathname, linkPath) {
  if (linkPath === '/') {
    return pathname === '/'
  }

  return pathname === linkPath || pathname.startsWith(`${linkPath}/`)
}

function SiteLayout({ children, scrollClassName = 'site-scroll', backToTopClassName = '' }) {
  const scrollRef = useRef(null)
  const location = useLocation()
  const { content, source, syncError } = useSiteData()
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  useRouteScrollTop(scrollRef)

  return (
    <div ref={scrollRef} className={scrollClassName}>
      <div className="site-shell">
        <header className="site-header">
          <div className="site-container site-header-inner">
            <Link className="site-brand" to="/">
              <img src={content.site.logoUrl} alt={content.site.name} />
              <div className="site-brand-copy">
                <strong>{content.site.name}</strong>
                <span>{content.site.fullName}</span>
              </div>
            </Link>

            <nav className="site-nav" aria-label="主导航">
              {content.navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={() => `site-nav-link${resolveNavActive(location.pathname, item.to) ? ' is-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="site-nav-dropdown">
                <span className="site-nav-dropdown-trigger">技术部门</span>
                <div className="site-nav-dropdown-menu">
                  {TECH_DEPTS.map((dept) => (
                    <a key={dept.label} className="site-nav-dropdown-item" href={dept.href}>
                      {dept.label}
                    </a>
                  ))}
                </div>
              </div>
            </nav>

            <Link className="site-header-cta" to="/join-us">
              加入我们
            </Link>
          </div>
        </header>

        <main className="site-main">{children}</main>

        <section className="site-cta">
          <div className="site-container site-cta-card">
            <div>
              <span className="site-eyebrow">Call To Action</span>
              <h2>{content.site.cta.title}</h2>
              <p>{content.site.cta.description}</p>
            </div>
            <div className="site-action-row">
              <Link className="site-button" to={content.site.cta.primaryAction.to}>
                <span>{content.site.cta.primaryAction.label}</span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </Link>
              <Link className="site-button is-secondary" to={content.site.cta.secondaryAction.to}>
                <span>{content.site.cta.secondaryAction.label}</span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="site-container site-footer-top">
            <div className="site-footer-brand">
              <div className="site-brand site-brand-footer">
                <img src={content.site.logoUrl} alt={content.site.name} />
                <div className="site-brand-copy">
                  <strong>{content.site.name}</strong>
                  <span>{content.site.fullName}</span>
                </div>
              </div>
              <p>{content.site.tagline}</p>
              <div className="site-meta-stack">
                <span>
                  <Globe size={16} />
                  <a href={`https://${content.site.domain}`} target="_blank" rel="noreferrer">
                    {content.site.domain}
                  </a>
                </span>
                <span>
                  <Server size={16} />
                  <span>{content.site.publicIp}</span>
                </span>
                <span>
                  <Mail size={16} />
                  <a href={`mailto:${content.site.email}`}>{content.site.email}</a>
                </span>
                <span>
                  <MapPin size={16} />
                  <span>中国 · 校园技术共同体</span>
                </span>
              </div>
              <div className="site-social-row">
                {content.site.socialLinks.map((item) => (
                  <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    <span>{item.label}</span>
                    {item.href.startsWith('http') ? <ExternalLink size={14} /> : null}
                  </a>
                ))}
              </div>
            </div>

            <div className="site-footer-columns">
              {content.site.footerColumns.map((column) => (
                <div key={column.title} className="site-footer-column">
                  <strong>{column.title}</strong>
                  {column.links.map((link) => (
                    <Link key={link.to} to={link.to}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="site-container site-footer-bottom">
            <span>© {currentYear} {content.site.name}. All rights reserved.</span>
            <div className="site-footer-security">
              <span>
                <ShieldCheck size={15} />
                <span>{source === 'remote' ? '内容已从后端同步' : '当前为本地兜底内容模式'}</span>
              </span>
              {syncError ? <span className="site-footer-warning">同步提示：{syncError}</span> : null}
            </div>
          </div>
        </footer>
      </div>

      <BackToTopButton
        scrollTargetRef={scrollRef}
        className={backToTopClassName}
        iconSize={26}
        strokeWidth={2.4}
      />
    </div>
  )
}

export default SiteLayout
