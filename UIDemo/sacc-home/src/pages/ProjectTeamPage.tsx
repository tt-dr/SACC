import { Navigate, useParams } from 'react-router-dom'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'
import { findBySlug } from '../lib/siteSelectors'

function ProjectTeamPage() {
  const { content } = useSiteData()
  const { projectId } = useParams()
  const project = findBySlug(content.projects, projectId)

  if (!project) {
    return <Navigate replace to="/404" />
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Project Team"
        title={`${project.title} · 团队介绍`}
        description="团队页不再依赖设计稿节点命名推断 tab 状态，而是明确由路由和数据驱动。"
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="核心成员" description="项目团队、角色和职责都已经进入结构化模型。" />
          <div className="three-column-grid">
            {project.team.map((item) => (
              <article key={item.name} className="site-card team-card">
                <strong>{item.name}</strong>
                <span>{item.role}</span>
                <p>围绕 {project.title} 的当前阶段目标负责交付与协同。</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default ProjectTeamPage
