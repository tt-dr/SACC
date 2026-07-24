import { ArrowRight, Calendar, Newspaper } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteLayout from '../../components/site/SiteLayout'
import './HomePage.css'

const HERO_STATS = [
  { number: '500+', label: '社团成员' },
  { number: '50+', label: '年度活动' },
  { number: '20+', label: '合作企业' },
  { number: '100+', label: '获奖项目' },
]

const ACTIVITIES = [
  {
    title: '项目概述',
    date: '入门',
    description: '了解官网建设项目的背景、目标与整体范围。',
    link: '/docs/project-overview',
  },
  {
    title: '技术方案',
    date: '入门',
    description: 'React 19 + Next.js 15 的技术选型与项目结构约定。',
    link: '/docs/tech-stack',
  },
  {
    title: 'Git 协作规范',
    date: '规范',
    description: '分支策略、提交规范与 PR 流程的团队约定。',
    link: '/docs/git-workflow',
  },
]

const NEWS = [
  { title: '把首屏交给 Server Components：官网性能优化实录', date: '2026-04-06' },
  { title: '给社团知识库接上检索增强：一次 RAG 落地复盘', date: '2026-04-02' },
  { title: 'Gin + Gorm 权限中间件的三个设计取舍', date: '2026-03-29' },
]

const TESTIMONIALS = [
  '在 SACC 的两年让我真正完成了从"会写代码"到"能做项目"的转变。',
  '竞赛集训和项目制协作给了我巨大的成长推动力，也让我更明确未来方向。',
  '最宝贵的是这里的同伴关系，大家真的会一起把事情做成。',
]

const RESOURCES = [
  { value: '200+', label: '学习资料', description: '涵盖编程基础、工程化与竞赛专题。', cta: '浏览资料' },
  { value: '50+', label: '视频教程', description: '面向实战的系统化讲解与录播内容。', cta: '观看课程' },
  { value: '150+', label: '技术文章', description: '从基础到前沿技术的知识沉淀。', cta: '阅读专栏' },
  { value: '100+', label: '代码示例', description: '可直接复用的 demo、模板与练习项目。', cta: '访问资源库' },
]

function HomePage() {
  return (
    <SiteLayout scrollClassName="home-page-scroll" backToTopClassName="home-back-to-top-button">
      <section className="home-hero">
        <div className="home-hero-orb home-hero-orb-right" />
        <div className="home-hero-orb home-hero-orb-left" />
        <div className="home-hero-orb home-hero-orb-mid" />

        <div className="home-container home-hero-inner">
          <div className="home-hero-logo-shell">
            <div className="home-hero-logo-glow" />
            <img className="home-hero-logo" src="/sacc-logo.svg" alt="SACC Logo" />
          </div>

          <p className="home-hero-subtitle">Science Association of Computer College</p>
          <p className="home-hero-copy">探索科学之美 · 创造技术未来 · 成就卓越人生</p>

          <div className="home-hero-actions">
            <Link to="/about" className="home-primary-button">
              <span>了解更多</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </Link>
            <Link to="/join-us" className="home-secondary-button">
              加入我们
            </Link>
          </div>
        </div>
      </section>

      <section className="home-stats">
        <div className="home-container home-stats-grid">
          {HERO_STATS.map((item) => (
            <article key={item.label} className="home-stat-item">
              <strong>{item.number}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-section-warm">
        <div className="home-container">
          <div className="home-section-head home-section-head-row">
            <div>
              <h2>精选文档</h2>
              <p>从这里快速上手项目</p>
            </div>
            <Link to="/docs" className="home-text-link">
              查看全部
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
          </div>

          <div className="home-activities-grid">
            {ACTIVITIES.map((item, index) => (
              <article key={item.title} className="home-activity-card">
                <div className={`home-activity-visual visual-${index + 1}`}>
                  <div className="home-activity-badge">
                    <Calendar size={15} strokeWidth={2.2} />
                    <span>{item.date}</span>
                  </div>
                </div>
                <div className="home-activity-body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Link to={item.link} className="home-inline-link">
                    查看详情
                    <ArrowRight size={16} strokeWidth={2.2} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container">
          <div className="home-section-head home-section-head-row">
            <div>
              <h2>成员动态</h2>
              <p>成员们的技术博客与成长记录</p>
            </div>
            <Link to="/news" className="home-text-link">
              更多动态
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
          </div>

          <div className="home-news-list">
            {NEWS.map((item) => (
              <Link key={item.title} to="/news" className="home-news-card">
                <div className="home-news-icon">
                  <Newspaper size={28} strokeWidth={2.2} />
                </div>
                <div className="home-news-copy">
                  <span>{item.date}</span>
                  <h3>{item.title}</h3>
                </div>
                <ArrowRight className="home-news-arrow" size={18} strokeWidth={2.2} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-soft">
        <div className="home-container">
          <div className="home-section-head">
            <h2>成员心声</h2>
            <p>听听他们在 SACC 的成长故事</p>
          </div>

          <div className="home-testimonials-grid">
            {TESTIMONIALS.map((item) => (
              <article key={item} className="home-testimonial-card">
                <span className="home-quote-mark">"</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-gradient">
        <div className="home-container">
          <div className="home-section-head">
            <h2>学习资源</h2>
            <p>丰富学习资料，助力你的技术成长</p>
          </div>

          <div className="home-resources-grid">
            {RESOURCES.map((item) => (
              <article key={item.label} className="home-resource-card">
                <strong>{item.value}</strong>
                <h3>{item.label}</h3>
                <p>{item.description}</p>
                <span className="home-inline-link">
                  {item.cta}
                  <ArrowRight size={16} strokeWidth={2.2} />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default HomePage
