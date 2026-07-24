import { Link } from 'react-router-dom'
import SiteLayout from '../components/site/SiteLayout'

function NotFoundPage() {
  return (
    <SiteLayout>
      <section className="site-section not-found-section">
        <div className="site-container">
          <article className="site-card not-found-card">
            <span className="site-eyebrow">404</span>
            <h1>这个页面暂时不存在</h1>
            <p>我们已经把官网路由改成了显式维护模式，如果你通过旧链接进入，可以从下面入口继续浏览。</p>
            <div className="site-action-row">
              <Link className="site-button" to="/">
                返回首页
              </Link>
              <Link className="site-button is-secondary" to="/projects">
                查看项目
              </Link>
            </div>
          </article>
        </div>
      </section>
    </SiteLayout>
  )
}

export default NotFoundPage
