import { ArrowUpRight, Github, Layers3, Settings2 } from 'lucide-react'
import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

function ProjectsPage() {
  const { content } = useSiteData()

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Projects"
        title="项目展示"
        description="科协开源在 GitHub 上的项目，每张卡片直达对应的代码仓库。"
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading title="GitHub 项目" description="展示项目摘要、进度与技术栈，点击卡片即可跳转到 GitHub 仓库。" />
          <div className="project-grid">
            {content.projects.map((item) => (
              <a
                key={item.slug}
                className="project-card"
                href={item.repoUrl}
                target="_blank"
                rel="noreferrer"
              >
                <div className="project-card-head">
                  <span className="project-card-repo">
                    <Github size={18} strokeWidth={2.2} />
                    <span>{item.owner}</span>
                  </span>
                  <span className="status-chip">{item.status}</span>
                </div>

                <h3 className="project-card-title">{item.title}</h3>
                <p className="project-card-summary">{item.summary}</p>

                {item.techStack && item.techStack.length > 0 ? (
                  <div className="project-tech-row">
                    {item.techStack.map((tech) => (
                      <span key={tech} className="project-tech-chip">
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="project-card-foot">
                  <span className="project-card-meta">
                    <Settings2 size={15} strokeWidth={2.2} />
                    进度 {item.progress}
                    <Layers3 size={15} strokeWidth={2.2} />
                    负责人 {item.owner}
                  </span>
                  <span className="project-repo-link">
                    进入项目仓库
                    <ArrowUpRight size={16} strokeWidth={2.2} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default ProjectsPage
