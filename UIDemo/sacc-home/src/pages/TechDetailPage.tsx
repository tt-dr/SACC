import { Braces, Database, ShieldCheck, Workflow } from 'lucide-react'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function TechDetailPage() {
  const { content } = useSiteData()
  const project = content.projects[0]
  const stackIcons = [Workflow, Database, ShieldCheck, Braces]

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Tech Detail"
        title={`${project.title} · 技术详情`}
        description="技术详情页对应 SACC.pen 里的技术详情设计，但已经被重构为真正可维护的技术说明页。"
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="技术栈" description="这部分直接映射到后端与官网的实际技术选型，而不是设计稿上的静态文字。" />
          <div className="four-column-grid">
            {project.techStack.map((item, index) => {
              const Icon = stackIcons[index % stackIcons.length]

              return (
                <article key={item} className="site-card">
                  <div className="card-icon-shell">
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <h3>{item}</h3>
                  <p>用于支撑官网前台、后台内容管理、缓存和数据持久化能力。</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="site-section site-section-soft">
        <div className="site-container two-column-grid">
          <article className="site-card">
            <SectionHeading title="关键挑战" description="和设计稿保持同样的信息节奏，但内容来自结构化数据。" />
            <ul className="site-list">
              {project.challenges.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="site-card code-card">
            <SectionHeading title="代码片段" description="以官网/API 的真实边界组织展示，而不是作为纯装饰模块。" />
            <pre>{project.codeSample}</pre>
          </article>
        </div>
      </section>
    </SiteLayout>
  )
}

export default TechDetailPage
