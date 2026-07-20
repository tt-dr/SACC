import { Compass, Flag, Layers3, Target } from 'lucide-react'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function AboutPage() {
  const { content } = useSiteData()
  const missionIcons = [Flag, Compass, Layers3]
  const valueIcons = [Target, Layers3, Compass, Flag]

  return (
    <SiteLayout>
      <PageHero
        eyebrow={content.about.hero.eyebrow}
        title={content.about.hero.title}
        description={content.about.hero.description}
        actions={[
          { label: '浏览文档库', to: '/docs' },
          { label: '浏览项目案例', to: '/projects', tone: 'secondary' },
        ]}
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="我们的定位" description="这一部分对应设计稿中的使命 / 愿景 / 方法卡片区。" />
          <div className="three-column-grid">
            {content.about.missionCards.map((item, index) => {
              const Icon = missionIcons[index] || Flag

              return (
                <article key={item.title} className="site-card">
                  <div className="card-icon-shell">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="site-section site-section-warm">
        <div className="site-container two-column-grid">
          <article className="site-card feature-list-card">
            <SectionHeading title="我们提供什么" description="和设计稿一致，这里承接官网关于页的能力陈述。" />
            <ul className="site-list">
              {content.about.capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="site-card honor-card">
            <SectionHeading title="近期荣誉" description="把原设计稿里的荣誉展示改造成更适合真实内容维护的列表。" />
            <ul className="site-list">
              {content.about.honors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="我们的价值观" description="官网不只展示信息，也应该清楚表达团队的工作方式和文化。"/>
          <div className="four-column-grid">
            {content.about.values.map((item, index) => {
              const Icon = valueIcons[index] || Target

              return (
                <article key={item.title} className="site-card">
                  <div className="card-icon-shell">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="site-section site-section-soft">
        <div className="site-container">
          <SectionHeading title="发展历程" description="对应设计稿中的时间线区域，内容已经整理为结构化时间节点。" />
          <div className="timeline-list">
            {content.about.timeline.map((item) => (
              <article key={item.year} className="timeline-item">
                <span>{item.year}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default AboutPage
