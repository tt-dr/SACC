import { useMemo } from 'react'
import { BookOpen, FileText, Hash, ListTree } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import MarkdownContent from '../components/site/MarkdownContent'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'
import { extractToc } from '../lib/markdown'
import { formatDisplayDate } from '../lib/siteSelectors'

function DocsPage() {
  const { content } = useSiteData()
  const { docId } = useParams()

  const docs = useMemo(
    () => [...content.docs].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
    [content.docs],
  )

  const groupedDocs = useMemo(() => {
    const groups = new Map<string, typeof docs>()

    docs.forEach((doc) => {
      const category = doc.category || '文档'
      const list = groups.get(category) ?? []
      list.push(doc)
      groups.set(category, list)
    })

    return [...groups.entries()]
  }, [docs])

  const activeDoc = useMemo(() => {
    if (!docId) {
      return docs[0] ?? null
    }

    return docs.find((doc) => doc.slug === docId) ?? docs[0] ?? null
  }, [docId, docs])

  const toc = useMemo(() => (activeDoc ? extractToc(activeDoc.content) : []), [activeDoc])

  return (
    <SiteLayout>
      <section className="site-hero doc-hero">
        <div className="site-container">
          <span className="site-eyebrow">Documentation</span>
          <h1>文档库</h1>
          <p>项目文档、技术方案与协作规范的统一入口，左侧选择文档，右侧跟随目录快速定位。</p>
        </div>
      </section>

      <section className="site-section doc-section">
        <div className="site-container doc-layout">
          <aside className="doc-sidebar" aria-label="文档列表">
            <div className="doc-sidebar-head">
              <BookOpen size={18} strokeWidth={2.2} />
              <span>全部文档</span>
            </div>
            {groupedDocs.map(([category, list]) => (
              <div key={category} className="doc-sidebar-group">
                <span className="doc-sidebar-group-title">{category}</span>
                <nav className="doc-sidebar-list">
                  {list.map((doc) => (
                    <Link
                      key={doc.slug}
                      to={`/docs/${doc.slug}`}
                      className={`doc-sidebar-item${activeDoc?.slug === doc.slug ? ' is-active' : ''}`}
                    >
                      <FileText size={15} strokeWidth={2.1} />
                      <span>{doc.title}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </aside>

          <article className="doc-content">
            {activeDoc ? (
              <>
                <div className="doc-content-meta">
                  <span className="doc-content-chip">{activeDoc.category}</span>
                  <span>更新于 {formatDisplayDate(activeDoc.updatedAt)}</span>
                </div>
                <MarkdownContent source={activeDoc.content} />
              </>
            ) : (
              <p className="doc-empty">暂无文档内容。</p>
            )}
          </article>

          <aside className="doc-toc" aria-label="本文目录">
            <div className="doc-toc-head">
              <ListTree size={16} strokeWidth={2.2} />
              <span>本页目录</span>
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
              <p className="doc-toc-empty">本文档暂无小节。</p>
            )}
          </aside>
        </div>
      </section>
    </SiteLayout>
  )
}

export default DocsPage
