import { useMemo } from 'react'
import { ArrowLeft, CalendarDays, Clock, FileText, Hash, ListTree, PenLine } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import MarkdownContent from '../components/site/MarkdownContent'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'
import { extractToc } from '../lib/markdown'
import { findBySlug, formatDisplayDate, sortByDateDesc } from '../lib/siteSelectors'

function NewsDetailPage() {
  const { content } = useSiteData()
  const { newsId } = useParams()
  const item = findBySlug(content.news, newsId)

  const authorPosts = useMemo(
    () => (item ? sortByDateDesc(content.news.filter((post) => post.author === item.author)) : []),
    [content.news, item],
  )

  const toc = useMemo(() => (item ? extractToc(item.content) : []), [item])

  if (!item) {
    return <Navigate replace to="/news" />
  }

  return (
    <SiteLayout>
      <section className="site-hero doc-hero">
        <div className="site-container">
          <span className="site-eyebrow">成员动态</span>
          <h1>{item.title}</h1>
          <p className="doc-hero-meta">
            <span className="blog-avatar is-inline">{item.author.slice(0, 1)}</span>
            {item.author}
            {item.role ? ` · ${item.role}` : ''}
            <CalendarDays size={15} strokeWidth={2.2} />
            {formatDisplayDate(item.date)}
            {item.readMinutes ? (
              <>
                <Clock size={15} strokeWidth={2.2} />
                {item.readMinutes} 分钟
              </>
            ) : null}
          </p>
        </div>
      </section>

      <section className="site-section doc-section">
        <div className="site-container doc-layout">
          <aside className="doc-sidebar" aria-label="作者文章列表">
            <Link className="doc-back-link" to="/news">
              <ArrowLeft size={15} strokeWidth={2.2} />
              返回成员动态
            </Link>
            <div className="doc-sidebar-head">
              <PenLine size={18} strokeWidth={2.2} />
              <span>{item.author} 的文章</span>
            </div>
            <nav className="doc-sidebar-list">
              {authorPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/news/${post.slug}`}
                  className={`doc-sidebar-item${post.slug === item.slug ? ' is-active' : ''}`}
                >
                  <FileText size={15} strokeWidth={2.1} />
                  <span>{post.title}</span>
                </Link>
              ))}
            </nav>
          </aside>

          <article className="doc-content">
            <div className="doc-content-meta">
              <span className="doc-content-chip">{item.category}</span>
              <span>发布于 {formatDisplayDate(item.date)}</span>
            </div>

            {item.tags && item.tags.length > 0 ? (
              <div className="blog-tag-row">
                {item.tags.map((tag) => (
                  <span key={tag} className="blog-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <MarkdownContent source={item.content} />
          </article>

          <aside className="doc-toc" aria-label="本文目录">
            <div className="doc-toc-head">
              <ListTree size={16} strokeWidth={2.2} />
              <span>本文目录</span>
            </div>
            {toc.length > 0 ? (
              <nav className="doc-toc-list">
                {toc.map((entry) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    className={`doc-toc-link${entry.level === 3 ? ' is-sub' : ''}`}
                  >
                    <Hash size={12} strokeWidth={2.4} />
                    <span>{entry.text}</span>
                  </a>
                ))}
              </nav>
            ) : (
              <p className="doc-toc-empty">本文暂无小节。</p>
            )}
          </aside>
        </div>
      </section>
    </SiteLayout>
  )
}

export default NewsDetailPage
