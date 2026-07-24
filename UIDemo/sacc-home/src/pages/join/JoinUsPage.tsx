import { Github, Linkedin, Mail, Twitter } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import BackToTopButton from '../../components/BackToTopButton'
import GlobalHeader from '../../components/GlobalHeader'
import useRouteScrollTop from '../../hooks/useRouteScrollTop'
import './JoinUsPage.css'

const FOOTER_COLUMNS = [
  {
    title: '关于',
    links: [
      { label: '关于我们', to: '/about' },
      { label: '文档库', to: '/docs' },
      { label: '成员动态', to: '/news' },
      { label: '项目展示', to: '/projects' },
    ],
  },
  {
    title: '文档',
    links: [
      { label: '项目概述', to: '/docs/project-overview' },
      { label: '技术方案', to: '/docs/tech-stack' },
      { label: '协作规范', to: '/docs/git-workflow' },
      { label: '新人指南', to: '/docs/onboarding' },
    ],
  },
  {
    title: '加入',
    links: [
      { label: '加入我们', to: '/join-us' },
      { label: '成员博客', to: '/news' },
      { label: '项目展示', to: '/projects' },
      { label: 'UI 组件库', to: '/docs/ui-components' },
    ],
  },
]

const JOIN_BENEFITS = [
  '分层成长路径：基础训练营 → 项目组 → 竞赛组',
  '社团核心项目实战，沉淀可展示的作品集',
  '导师与学长学姐一对一答疑与路线建议',
]

const JOIN_FLOW = [
  '扫码或搜索群号加入招新群',
  '按格式发送“姓名-学院-方向”',
  '等待管理员拉入对应学习小组',
]

const QR_STEPS = [
  '使用 QQ 扫码入群',
  '或搜索群号 123456789',
  '入群后发送“姓名-学院-方向”完成登记',
]

const SOCIAL_ITEMS = [
  { label: 'GitHub', icon: Github },
  { label: '邮箱', icon: Mail },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'Twitter', icon: Twitter },
]

function JoinUsPage() {
  const scrollRef = useRef(null)

  useRouteScrollTop(scrollRef)

  return (
    <div ref={scrollRef} className="join-page-scroll">
      <div className="join-page-shell">
        <GlobalHeader />

        <section className="join-hero">
          <div className="join-container join-hero-inner">
            <div className="join-hero-badge">2026 春季招新进行中</div>
            <h1 className="join-hero-title">加入 SACC，与最能做事的人一起成长</h1>
            <p className="join-hero-subtitle">
              技术训练营、真实项目、竞赛实战与导师辅导，帮你在大学阶段建立硬实力。
            </p>
            <div className="join-hero-meta">
              <div className="join-pill">0门槛分层培养</div>
              <div className="join-pill">社团核心项目优先参与</div>
            </div>
          </div>
        </section>

        <main className="join-main">
          <div className="join-container join-main-grid">
            <section className="join-left-column">
              <article className="join-info-card">
                <h2>为什么加入 SACC</h2>
                <p>
                  我们强调共创与实战，而非单向灌输。
                  <br />
                  你会在真实任务中建立技术、协作与表达能力。
                </p>
              </article>

              <article className="join-info-card join-info-card-soft">
                <h2>你将获得</h2>
                <ul className="join-list">
                  {JOIN_BENEFITS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="join-info-card">
                <h2>入群流程</h2>
                <ol className="join-flow-list">
                  {JOIN_FLOW.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </article>

              <article className="join-support-card">
                <h2>遇到问题？</h2>
                <p>
                  可在群内咨询招新流程。
                  <br />
                  工作人员会在24小时内回复。
                </p>
              </article>
            </section>

            <section className="join-right-column">
              <article className="join-apply-card">
                <div className="join-apply-head">
                  <h2>加入招新群</h2>
                </div>

                <div className="join-summary-card">
                  <h3>SACC 2026 招新咨询群</h3>
                  <p>
                    入群后可第一时间获取
                    <br />
                    宣讲、面试与训练营通知。
                  </p>
                  <p>
                    建议备注：姓名-年级-方向
                    <br />
                    （前端/后端/AI/设计）
                  </p>
                  <p>加群方式：扫码或复制群号搜索</p>
                  <p className="join-qq-number">群号：123456789</p>
                </div>

                <div className="join-notice-card">
                  <strong>入群提醒</strong>
                  <p>请勿重复加群；若已在群内，无需再次提交任何申请表。</p>
                </div>

                <div className="join-qr-row">
                  <div className="join-qr-box">
                    <span className="join-qr-mark">QR</span>
                    <span className="join-qr-caption">群二维码</span>
                  </div>

                  <div className="join-qr-steps">
                    {QR_STEPS.map((item, index) => (
                      <p key={item}>
                        {index + 1}. {item}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            </section>
          </div>
        </main>

        <footer className="join-footer">
          <div className="join-container join-footer-top">
            <div className="join-footer-brand">
              <div className="join-footer-brand-head">
                <img className="join-footer-logo" src="/sacc-logo.svg" alt="SACC" />
                <span className="join-footer-title">SACC</span>
              </div>
              <p className="join-footer-description">
                Science Association of Computer College - 探索科学之美，创造技术未来
              </p>
              <div className="join-footer-social">
                {SOCIAL_ITEMS.map((item) => {
                  const Icon = item.icon

                  return (
                    <span key={item.label} className="join-social-chip" aria-label={item.label}>
                      <Icon size={16} strokeWidth={2.1} />
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="join-footer-columns">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title} className="join-footer-column">
                  <strong>{column.title}</strong>
                  {column.links.map((link) => (
                    <Link key={link.label} to={link.to}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="join-container">
            <div className="join-footer-divider" />
          </div>

          <div className="join-container join-footer-bottom">
            <span>© 2025 SACC - Science Association of Computer College. All rights reserved.</span>
            <div className="join-footer-legal">
              <span>隐私政策</span>
              <span>使用条款</span>
            </div>
          </div>
        </footer>
      </div>

      <BackToTopButton scrollTargetRef={scrollRef} className="join-back-to-top-button" iconSize={26} strokeWidth={2.5} />
    </div>
  )
}

export default JoinUsPage
