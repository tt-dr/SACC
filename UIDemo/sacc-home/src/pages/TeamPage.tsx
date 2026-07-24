import PageHero from '../components/site/PageHero'
import SectionHeading from '../components/site/SectionHeading'
import SiteLayout from '../components/site/SiteLayout'
import { useSiteData } from '../context/SiteDataContext'

const TEAM_PAGE_CONFIG = {
  intro: {
    title: '团队介绍',
    description: '团队结构不再通过设计稿颜色猜测激活态，而是由明确的路由和数据分组决定。',
  },
  leadership: {
    title: '团队架构 · 主席团',
    description: '主席团负责节奏、资源和组织层的长期建设。',
  },
  technical: {
    title: '团队架构 · 技术部门',
    description: '技术部门聚焦前端、后端、AI、算法与工程落地。',
  },
  nonTechnical: {
    title: '团队架构 · 非技术部门',
    description: '非技术部门承接运营、品牌、外联和活动包装等关键能力。',
  },
}

function resolveMembers(team, variant) {
  if (variant === 'technical') {
    return team.technical
  }

  if (variant === 'nonTechnical') {
    return team.nonTechnical
  }

  return team.leadership
}

function TeamPage({ variant = 'leadership' }) {
  const { content } = useSiteData()
  const config = TEAM_PAGE_CONFIG[variant] || TEAM_PAGE_CONFIG.leadership
  const members = variant === 'intro' ? [...content.team.leadership, ...content.team.technical, ...content.team.nonTechnical] : resolveMembers(content.team, variant)

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Team"
        title={config.title}
        description={variant === 'intro' ? content.team.intro.description : config.description}
      />

      <section className="site-section">
        <div className="site-container">
          <SectionHeading
            title={variant === 'intro' ? content.team.intro.title : '核心成员'}
            description={variant === 'intro' ? '团队页已经改成显式分组和统一成员卡片模型。' : '和设计稿保持同样的展示层次，但维护成本更低。'}
          />
          <div className="three-column-grid">
            {members.map((item) => (
              <article key={`${variant}-${item.name}`} className="site-card team-card">
                <strong>{item.name}</strong>
                <span>{item.role}</span>
                <p>{item.focus}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default TeamPage
