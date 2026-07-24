import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Clock, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'
import { formatDisplayDate, sortByDateDesc } from '../lib/siteSelectors'

const ALL_AUTHORS = '全部作者'

function getInitial(name: string) {
  return name ? name.slice(0, 1) : '·'
}

function NewsPage() {
  const { content } = useSiteData()
  const [keyword, setKeyword] = useState('')
  const [activeAuthor, setActiveAuthor] = useState(ALL_AUTHORS)
  const deferredKeyword = useDeferredValue(keyword)

  const authors = useMemo(() => {
    const unique = new Set<string>()
    content.news.forEach((item) => item.author && unique.add(item.author))
    return [ALL_AUTHORS, ...unique]
  }, [content.news])

  const posts = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase()

    const filtered = content.news.filter((item) => {
      const matchesAuthor = activeAuthor === ALL_AUTHORS || item.author === activeAuthor

      if (!matchesAuthor) {
        return false
      }

      if (!normalizedKeyword) {
        return true
      }

      return [item.title, item.summary, item.author, item.category, ...(item.tags ?? [])]
        .filter(Boolean)
        .some((value) => `${value}`.toLowerCase().includes(normalizedKeyword))
    })

    return sortByDateDesc(filtered)
  }, [activeAuthor, content.news, deferredKeyword])

  return (
    <SiteLayout>
      <section className="site-hero">
        <div className="site-container">
          <span className="site-eyebrow">Member Blog</span>
          <h1>成员动态</h1>
          <p>成员们发布的技术博客与成长记录，按发布时间排序，支持按作者筛选与关键词搜索。</p>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <div className="blog-toolbar">
            <label className="blog-search">
              <Search size={18} strokeWidth={2.2} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索标题、摘要或标签"
                aria-label="搜索成员动态"
              />
            </label>
            <div className="blog-filter" role="group" aria-label="按作者筛选">
              <span className="blog-filter-label">
                <Users size={15} strokeWidth={2.2} />
                作者
              </span>
              {authors.map((author) => (
                <button
                  key={author}
                  type="button"
                  className={`blog-filter-chip${activeAuthor === author ? ' is-active' : ''}`}
                  onClick={() => setActiveAuthor(author)}
                >
                  {author}
                </button>
              ))}
            </div>
          </div>

          <p className="blog-result-count">
            共 {posts.length} 篇 · 默认按发布时间倒序
          </p>

          {posts.length > 0 ? (
            <div className="blog-grid">
              {posts.map((item) => (
                <Link key={item.slug} to={`/news/${item.slug}`} className="blog-card">
                  <div className="blog-card-top">
                    <span className="blog-avatar">{getInitial(item.author)}</span>
                    <div className="blog-author-meta">
                      <strong>{item.author}</strong>
                      {'role' in item && item.role ? <span>{item.role}</span> : null}
                    </div>
                    <span className="blog-category">{item.category}</span>
                  </div>

                  <h3 className="blog-card-title">{item.title}</h3>
                  <p className="blog-card-summary">{item.summary}</p>

                  {item.tags && item.tags.length > 0 ? (
                    <div className="blog-tag-row">
                      {item.tags.map((tag) => (
                        <span key={tag} className="blog-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="blog-card-foot">
                    <span className="blog-foot-meta">
                      <CalendarDays size={14} strokeWidth={2.2} />
                      {formatDisplayDate(item.date)}
                      {'readMinutes' in item && item.readMinutes ? (
                        <>
                          <Clock size={14} strokeWidth={2.2} />
                          {item.readMinutes} 分钟
                        </>
                      ) : null}
                    </span>
                    <span className="blog-read-link">
                      阅读
                      <ArrowRight size={15} strokeWidth={2.2} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <p>没有匹配的动态，试试更换作者或关键词。</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}

export default NewsPage
