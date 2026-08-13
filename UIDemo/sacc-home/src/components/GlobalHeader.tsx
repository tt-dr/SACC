import { Link, useLocation } from 'react-router-dom'
import { scrollClosestContainerToTop } from '../lib/scrollToTop'
import './site/site.css'

const MAIN_NAV_ITEMS = [
  { label: '主页', to: '/' },
  { label: '关于我们', to: '/about' },
  { label: '文档库', to: '/docs' },
  { label: '成员动态', to: '/news' },
  { label: '项目', to: '/projects' },
]

function resolveNavActive(pathname, linkPath) {
  if (linkPath === '/') {
    return pathname === '/'
  }

  return pathname === linkPath || pathname.startsWith(`${linkPath}/`)
}

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') {
    return '/'
  }

  return pathname.replace(/\/+$/, '')
}

function GlobalHeader() {
  const location = useLocation()
  const currentPathname = normalizePathname(location.pathname)

  const handleHeaderLinkClick = (event, targetPath) => {
    if (normalizePathname(targetPath) === currentPathname) {
      scrollClosestContainerToTop(event.currentTarget)
    }
  }

  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link className="site-brand" to="/" onClick={(event) => handleHeaderLinkClick(event, '/')}>
          <img src="/sacc-logo.svg" alt="SACC" />
          <div className="site-brand-copy">
            <strong>SACC</strong>
            <span>Science Association of Computer College</span>
          </div>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {MAIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              className={`site-nav-link${resolveNavActive(location.pathname, item.to) ? ' is-active' : ''}`}
              onClick={(event) => handleHeaderLinkClick(event, item.to)}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="site-header-cta" to="/join-us">
          加入我们
        </Link>
      </div>
    </header>
  )
}

export default GlobalHeader
