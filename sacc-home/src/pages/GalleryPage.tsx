import { Link } from 'react-router-dom'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function GalleryPage() {
  const { content } = useSiteData()

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Gallery"
        title="精彩相册"
        description="相册页保留了设计稿中的温暖视觉氛围，但展示内容已抽象为标准化的相册模型。"
        actions={[
          { label: '查看归档', to: '/gallery/archive' },
          { label: '浏览动态', to: '/news', tone: 'secondary' },
        ]}
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="精选相册" description="后续可直接从后台管理的相册模块同步，不需要再手写到组件里。" />
          <div className="three-column-grid">
            {content.gallery.albums.map((item) => (
              <article key={item.slug} className={`site-card gallery-card is-${item.accent}`}>
                <span>{item.date}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default GalleryPage
