import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function GalleryArchivePage() {
  const { content } = useSiteData()

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Gallery Archive"
        title="相册归档"
        description="归档页替代了原来通过文案推断跳转的方式，成为稳定的独立路由页面。"
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="按年份归档" description="每年相册数量和内容都可由后台模块统一维护。" />
          <div className="three-column-grid">
            {content.gallery.archiveYears.map((item) => (
              <article key={item.year} className="site-card archive-card">
                <strong>{item.year}</strong>
                <span>{item.count} 本相册</span>
                <p>包含招新、训练营、路演、竞赛和团队活动等主题内容。</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default GalleryArchivePage
