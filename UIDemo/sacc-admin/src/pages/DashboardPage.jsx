import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdminData } from '../context/AdminDataContext'

/**
 * DashboardPage — 仪表盘总览
 *
 * 数据来源: GET /api/v1/admin/dashboard
 * 返回 DashboardData 包含:
 *   siteVisits      — 站点累计访问量
 *   activeMembers   — 活跃成员数
 *   contentCounts   — 各模块内容总数 { news, docs, projects, users }
 *   pendingCounts   — 待处理项数量（草稿状态）
 *   trafficTrend    — 流量趋势数据 [{ date, visits }]
 *   recentAuditLogs — 最近操作日志列表
 *
 * 审计日志全量数据分页查询: GET /api/v1/admin/audit-log
 */

const FOOT_HINT = '📝 Markdown 预览已启用：支持 # 标题、**加粗**、- 列表、`代码`'

function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { database } = useAdminData()
  const [keyword, setKeyword] = useState('')
  const role = currentUser?.role ?? 'editor'

  const dashboardStats = useMemo(
    () => [
      { label: '总访问量', value: (database.metrics.siteVisits ?? 128460).toLocaleString('zh-CN') },
      { label: '活跃成员', value: (database.metrics.activeMembers ?? 312).toLocaleString('zh-CN') },
      { label: '博客总数', value: ((database.news ?? []).length).toLocaleString('zh-CN') },
      { label: '文档总数', value: ((database.docs ?? []).length).toLocaleString('zh-CN') },
    ],
    [database],
  )

  const pendingLines = useMemo(() => {
    const lines = []
    const userCount = (database.users ?? []).length
    const docCount = (database.docs ?? []).length
    const newsCount = (database.news ?? []).length
    const projectCount = (database.projects ?? []).length
    lines.push(`1. 注册用户 ${userCount} 名，文档 ${docCount} 篇`)
    lines.push(`2. 博客 ${newsCount} 篇，项目 ${projectCount} 个`)
    return lines
  }, [database])

  const recentLogs = useMemo(() => {
    const mapped = (database.auditLog ?? []).slice(0, 3).map((item) => {
      const time = item.timestamp.slice(11, 16)
      const description = item.detail || item.action
      return `${time}  ${description}`
    })
    return mapped.length > 0 ? mapped : ['暂无操作记录']
  }, [database.auditLog])

  return (
    <section className="page-stack">
      <h1 className="page-title">仪表盘总览</h1>

      <div className="page-toolbar dashboard-toolbar">
        <label className="search-shell">
          <span>🔎</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索内容/标题/成员"
          />
        </label>
        <div className="dashboard-toolbar-meta">
          <div className="toolbar-copy">
            {role === 'super_admin' ? '超级管理员模式' : '成员编辑模式'}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((item) => (
          <article key={item.label} className="panel-card metric-card">
            <span className="metric-label">{item.label}</span>
            <strong className="metric-value">{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="content-grid">
        <article className="panel-card">
          <h2 className="section-title">流量趋势</h2>
          <div className="chart-placeholder">
            <span>折线图占位符（Traffic Trend Line Chart）</span>
          </div>
        </article>

        <article className="panel-card">
          <h2 className="section-title">待处理事项</h2>
          <div className="note-lines">
            {pendingLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </article>
      </div>

      <div className="content-grid">
        <article className="panel-card">
          <h2 className="section-title">最近操作记录</h2>
          <div className="note-lines">
            {recentLogs.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <h2 className="section-title">快捷操作</h2>
          <div className="shortcut-stack">
            {role === 'super_admin' ? (
              <>
                <button type="button" className="shortcut-pill tone-warm" onClick={() => navigate('/users')}>
                  ⚙ 管理用户账号
                </button>
                <button type="button" className="shortcut-pill tone-cool" onClick={() => navigate('/docs')}>
                  ＋ 发布文档
                </button>
                <button type="button" className="shortcut-pill tone-warm" onClick={() => navigate('/news')}>
                  ＋ 发布博客
                </button>
                <button type="button" className="shortcut-pill tone-cool" onClick={() => navigate('/projects')}>
                  ☰ 管理项目
                </button>
              </>
            ) : (
              <>
                <button type="button" className="shortcut-pill tone-warm" onClick={() => navigate('/news')}>
                  ＋ 发布博客
                </button>
                <button type="button" className="shortcut-pill tone-cool" onClick={() => navigate('/projects')}>
                  ☰ 管理项目
                </button>
              </>
            )}
          </div>
        </article>
      </div>

      <div className="page-footnote">{FOOT_HINT}</div>
    </section>
  )
}

export default DashboardPage
