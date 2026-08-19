import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAdminData } from '../context/AdminDataContext'
import { createDraftForModule } from '../lib/adminConfig'

// 页脚提示文案常量，提醒用户管理权限说明
const FOOT_HINT = '🔒 用户管理仅超级管理员可访问 — 密码由管理员创建时设置，用户首次登录后可自行修改'

// 创建一个空白用户草稿对象，用于"新建账号"时初始化表单
function createEmptyDraft() {
  return {
    id: '',              // 用户唯一标识，新建时为空
    title: '',           // 用户名（登录账号）
    displayName: '',     // 姓名（显示名称）
    roleName: 'editor',  // 管理角色：super_admin（超管）或 editor（普通成员），默认普通成员
    position: '',         // 社团职务（如"前端组组长"）
    desc: '',             // 一句话描述
    password: '',         // 密码，编辑时留空表示不修改
    scheduledAt: '',      // 创建日期
    summary: '',          // 备注
    avatar: '',            // 头像图片 URL
    status: 'active',     // 账号状态：active（正常）或 disabled（已禁用）
  }
}

// 角色枚举映射：把英文角色名转换为中文显示文字
const ROLE_LABELS = {
  super_admin: '超级管理员',  // 超级管理员，拥有全部权限
  editor: '普通成员',          // 普通成员，无用户管理权限
}

// 状态枚举映射：把英文状态值转换为中文显示文字
const STATUS_LABELS = {
  active: '正常',        // 正常状态，可登录后台
  disabled: '已禁用',     // 禁用状态，无法登录后台
}

// 通用表单字段组件：左侧标签 + 右侧输入控件
function TextField({ label, children }) {
  return (
    <label className="design-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

// 角色徽章组件：根据角色类型显示不同颜色的标签
function RoleBadge({ role }) {
  const label = ROLE_LABELS[role] ?? '未知'                          // 从映射表获取中文标签，未知则显示"未知"
  const tone = role === 'super_admin' ? 'tone-warm' : 'tone-cool'   // 超管用暖色，普通成员用冷色
  return <span className={`shortcut-pill ${tone}`} style={{ cursor: 'default', minHeight: 'auto', fontSize: 11 }}>{label}</span>
}

// 状态徽章组件：用内联样式渲染绿色（正常）或红色（禁用）小标签
function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] ?? '正常'   // 从映射表获取中文标签
  const isDisabled = status === 'disabled'        // 判断是否为禁用状态
  return (
    <span
      style={{
        display: 'inline-block',                 // 行内块元素，可以设置宽高和边距
        padding: '2px 10px',                      // 内边距：上下2px 左右10px
        borderRadius: 12,                         // 圆角，做成胶囊形状
        fontSize: 11,                              // 字号 11px
        fontWeight: 600,                           // 半粗体
        // 禁用时红色背景，正常时绿色背景，CSS 变量不存在则用回退值
        background: isDisabled ? 'var(--danger-bg, #fef0f0)' : 'var(--success-bg, #f0f9eb)',
        // 禁用时红色文字，正常时绿色文字
        color: isDisabled ? 'var(--danger, #f56c6c)' : 'var(--success, #67c23a)',
        // 禁用时红色边框，正常时绿色边框
        border: `1px solid ${isDisabled ? 'var(--danger-border, #fde2e2)' : 'var(--success-border, #e1f3d8)'}`,
      }}
    >
      {label}
    </span>
  )
}

/**
 * UsersPage — 用户管理页面
 *
 * 仅超级管理员可访问。支持创建 / 编辑 / 禁用用户。
 *
 * 对应 API 端点：
 *   GET    /api/v1/admin/users           — 用户列表
 *   POST   /api/v1/admin/users           — 创建用户
 *   PUT    /api/v1/admin/users/{id}      — 修改用户（含禁用/启用）
 *   DELETE /api/v1/admin/users/{id}      — 删除用户
 */
function UsersPage() {
  // 从 AuthContext 获取当前登录用户对象（含 role 字段）
  const { currentUser } = useAuth()
  // 从 AdminDataContext 解构：database（数据库引用）、saveCollectionItem（创建/更新）、deleteCollectionItem（删除）
  const { database, saveCollectionItem, deleteCollectionItem } = useAdminData()
  // 从数据库中取出 users 数组，不存在则用空数组兜底
  const items = database.users ?? []

  // 搜索关键字状态
  const [searchKeyword, setSearchKeyword] = useState('')
  // 当前选中的用户 ID，用于高亮列表项和加载编辑表单
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  // 当前编辑中的用户草稿对象
  const [draft, setDraft] = useState(() => createDraftForModule('users', items[0]))
  // 延迟后的搜索关键字，避免每次按键都触发过滤
  const deferredKeyword = useDeferredValue(searchKeyword)

  // 权限拦截：当前用户不是超级管理员时，重定向到首页
  // 必须在所有 Hook 之后、在组件主体 return 之前执行
  if (currentUser?.role !== 'super_admin') {
    return <Navigate replace to="/" />  // replace 表示替换历史记录，不留下中间页
  }

  // 副作用：当用户列表变化或选中 ID 变化时，确保选中项有效
  useEffect(() => {
    // 列表为空时清空选中状态和表单
    if (items.length === 0) {
      setSelectedId('')
      setDraft(createEmptyDraft())
      return
    }
    // 查找选中的用户是否还在列表中
    const selectedItem = items.find((item) => item.id === selectedId)
    // 选中的用户不存在了（被删除），自动选中第一个
    if (!selectedItem) {
      setSelectedId(items[0].id)
      setDraft(createDraftForModule('users', items[0]))
    }
  }, [items, selectedId])

  // 过滤后的用户列表：根据搜索关键字在多个字段中匹配
  const filteredItems = useMemo(() => {
    const kw = deferredKeyword.trim().toLowerCase()  // 去空格转小写
    if (!kw) return items                            // 无关键字返回全部
    return items.filter((item) =>
      // 在用户名、姓名、角色、职务、描述、备注中搜索
      [item.title, item.displayName, item.roleName, item.position, item.desc, item.summary]
        .filter(Boolean)                              // 过滤掉空值
        .some((v) => `${v}`.toLowerCase().includes(kw)),  // 任一字段匹配即通过
    )
  }, [deferredKeyword, items])

  // 角色分布统计卡片数据
  const summaryCards = useMemo(() => {
    const total = items.length                                           // 总用户数
    const superAdmins = items.filter((it) => it.roleName === 'super_admin').length  // 超管数量
    const editors = items.filter((it) => it.roleName === 'editor').length              // 普通成员数量
    const disabled = items.filter((it) => it.status === 'disabled').length              // 已禁用数量
    return [
      { label: '超级管理员', value: superAdmins },
      { label: '普通成员', value: editors },
      { label: '已禁用', value: disabled },
      { label: '总用户数', value: total },
    ]
  }, [items])

  // 点击列表项时选中该用户：更新选中 ID 并加载草稿到表单
  const handleSelect = (item) => {
    setSelectedId(item.id)
    setDraft(createDraftForModule('users', item))
  }

  // 表单字段变更处理：按 key 更新 draft 中对应字段
  const handleFieldChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))  // 展开保留其他字段，仅更新指定字段
  }

  // 保存用户（新建或更新）：校验必填字段后调用 saveCollectionItem
  const handleSave = () => {
    // 校验：用户名不能为空
    if (!draft.title?.trim()) {
      window.alert('请填写用户名')
      return
    }
    // 校验：姓名不能为空
    if (!draft.displayName?.trim()) {
      window.alert('请填写姓名')
      return
    }
    // 调用 AdminDataContext 方法保存用户（无 id 时新建，有 id 时更新）
    const saved = saveCollectionItem('users', draft)
    // 保存成功后刷新选中 ID 和表单
    if (saved) {
      setSelectedId(saved.id)
      setDraft(createDraftForModule('users', saved))
    }
  }

  // 禁用/启用切换：在 active 和 disabled 之间切换 status 字段
  const handleToggleDisable = () => {
    if (!draft.id) return    // 新建模式下没有 id，不执行
    // 判断下一个状态：当前禁用则切换为正常，当前正常则切换为禁用
    const nextStatus = draft.status === 'disabled' ? 'active' : 'disabled'
    // 弹出确认对话框，根据操作方向显示不同提示
    const confirmed = window.confirm(
      nextStatus === 'disabled'
        ? `确认禁用用户「${draft.title}」？禁用后该用户将无法登录后台。`
        : `确认启用用户「${draft.title}」？`,
    )
    if (!confirmed) return  // 用户取消则不执行
    // 调用 saveCollectionItem 更新 status 字段（保留其他字段不变）
    const saved = saveCollectionItem('users', { ...draft, status: nextStatus })
    // 保存成功后刷新表单
    if (saved) {
      setDraft(createDraftForModule('users', saved))
    }
  }

  // 永久删除用户：弹出确认框，确认后调用 deleteCollectionItem
  const handleDelete = () => {
    if (!draft.id) return    // 新建模式下不执行
    // 弹出确认对话框，防止误删
    const confirmed = window.confirm(`确认永久删除用户「${draft.title}」？此操作不可撤销。`)
    if (!confirmed) return
    deleteCollectionItem('users', draft.id)  // 从数据库中删除该用户
    setSelectedId('')                        // 清空选中 ID
    setDraft(createEmptyDraft())              // 重置表单为空白草稿
  }

  // 点击"新建账号"按钮：清空选中状态，进入新建模式
  const handleCreateNew = () => {
    setSelectedId('')
    setDraft(createEmptyDraft())
  }

  // 是否在编辑已有用户（有 id 表示编辑模式，无 id 表示新建模式）
  const isEditing = Boolean(draft.id)
  // 当前用户是否处于禁用状态
  const isDisabled = draft.status === 'disabled'

  return (
    // 页面最外层容器
    <section className="page-stack">
      <h1 className="page-title">用户管理</h1>

      {/* 工具栏：搜索框 + 新建按钮 */}
      <div className="page-toolbar">
        <label className="search-shell">
          <span>🔎</span>
          <input
            value={searchKeyword}                                       // 受控输入绑定到状态
            onChange={(e) => setSearchKeyword(e.target.value)}          // 输入时更新关键字
            placeholder="搜索用户名 / 姓名 / 职务 / 角色"
          />
        </label>
        <div className="toolbar-copy">
          {/* 新建账号按钮 */}
          <button type="button" className="primary-button" style={{ minHeight: 36, fontSize: 12 }} onClick={handleCreateNew}>
            + 新建账号
          </button>
        </div>
      </div>

      {/* 编辑器布局：左侧编辑面板 + 右侧统计/列表 */}
      <div className="editor-layout">
        {/* 左侧：账号编辑面板 */}
        <article className="panel-card">
          <h2 className="section-title">
            {/* 标题动态显示：编辑模式显示用户名，新建模式显示"新建用户" */}
            账号编辑{isEditing ? ` — ${draft.title}` : ' — 新建用户'}
          </h2>
          <div className="editor-shell">
            <p className="section-copy">管理后台登录账号，分配管理角色与社团职务。仅超级管理员可操作。</p>

            {/* 用户名 + 姓名 并排 */}
            <div className="design-field-row">
              <TextField label="用户名">
                <input value={draft.title ?? ''} onChange={(e) => handleFieldChange('title', e.target.value)} placeholder="登录用户名" />
              </TextField>
              <TextField label="姓名">
                <input value={draft.displayName ?? ''} onChange={(e) => handleFieldChange('displayName', e.target.value)} placeholder="真实姓名" />
              </TextField>
            </div>

            {/* 管理角色 + 社团职务 并排 */}
            <div className="design-field-row">
              <TextField label="管理角色">
                {/* 下拉选择框：可选普通成员或超级管理员 */}
                <select
                  value={draft.roleName ?? 'editor'}                    // 当前选中值
                  onChange={(e) => handleFieldChange('roleName', e.target.value)}  // 选择时更新 roleName
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border, #ddd)', background: 'var(--bg, #fff)', fontSize: 13 }}
                >
                  <option value="editor">普通成员 (editor)</option>
                  <option value="super_admin">超级管理员 (super_admin)</option>
                </select>
              </TextField>
              <TextField label="社团职务">
                <input value={draft.position ?? ''} onChange={(e) => handleFieldChange('position', e.target.value)} placeholder="前端组组长 / 组员" />
              </TextField>
            </div>

            {/* 一句话描述 */}
            <TextField label="一句话描述">
              <textarea rows={2} value={draft.desc ?? ''} onChange={(e) => handleFieldChange('desc', e.target.value)} placeholder="例如：统筹全局，确保每一件事都有闭环。" />
            </TextField>

            {/* 头像 URL + 创建日期 并排 */}
            <div className="design-field-row">
              <TextField label="头像 URL">
                {/* 使用 flex 布局让输入框和预览图并排 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    value={draft.avatar ?? ''}
                    onChange={(e) => handleFieldChange('avatar', e.target.value)}
                    placeholder="头像图片地址"
                    style={{ flex: 1 }}                                // 输入框占据剩余空间
                  />
                  {/* 有头像 URL 时显示圆形预览图 */}
                  {draft.avatar && (
                    <img
                      src={draft.avatar}
                      alt="头像预览"
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent, #4f46e5)' }}
                    />
                  )}
                </div>
              </TextField>
              <TextField label="创建日期">
                <input type="date" value={draft.scheduledAt ?? ''} onChange={(e) => handleFieldChange('scheduledAt', e.target.value)} />
              </TextField>
            </div>

            {/* 密码输入框：编辑模式下留空表示不修改 */}
            <TextField label="密码">
              <input type="password" value={draft.password ?? ''} onChange={(e) => handleFieldChange('password', e.target.value)} placeholder={isEditing ? '留空则不修改' : '请输入初始密码'} />
            </TextField>

            {/* 备注 */}
            <TextField label="备注">
              <textarea rows={2} value={draft.summary ?? ''} onChange={(e) => handleFieldChange('summary', e.target.value)} placeholder="例如：张三、前端组" />
            </TextField>

            {/* 仅在编辑模式下显示当前状态徽章 */}
            {isEditing && (
              <div className="design-field">
                <span>当前状态</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={draft.status ?? 'active'} />
                </div>
              </div>
            )}
          </div>

          {/* 编辑器底部操作按钮 */}
          <div className="editor-actions">
            {/* 保存按钮 */}
            <button type="button" className="primary-button save-button" onClick={handleSave}>
              保存账号
            </button>
            {/* 编辑模式下显示禁用/启用按钮 */}
            {isEditing && (
              <button
                type="button"
                // 禁用状态下用 primary-button（启用），正常状态下用 danger-button（禁用）
                className={isDisabled ? 'primary-button' : 'danger-button'}
                onClick={handleToggleDisable}
              >
                {/* 按钮文字根据当前状态切换 */}
                {isDisabled ? '启用用户' : '禁用用户'}
              </button>
            )}
            {/* 编辑模式下显示永久删除按钮，marginLeft auto 让它靠右 */}
            {isEditing && (
              <button type="button" className="danger-button" onClick={handleDelete} style={{ marginLeft: 'auto' }}>
                永久删除
              </button>
            )}
          </div>
        </article>

        {/* 右侧：统计卡片 + 用户列表 */}
        <aside className="side-summary">
          {/* 角色分布统计 */}
          <article className="panel-card">
            <h2 className="section-title">角色分布</h2>
            <div className="info-card-grid">
              {summaryCards.map((card) => (
                <div key={card.label} className="info-card">
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </div>
              ))}
            </div>
          </article>

          {/* 用户列表（右侧仅显示前 8 条，完整列表在下方） */}
          <article className="panel-card">
            <h2 className="section-title">用户列表</h2>
            <p className="section-copy">点击列表项可编辑用户信息</p>
            <div className="table-head">头像      用户名      姓名      角色      状态</div>
            {/* slice(0, 8) 只取前 8 条，避免侧边栏过长 */}
            {filteredItems.slice(0, 8).map((item) => {
              const roleLabel = ROLE_LABELS[item.roleName] ?? item.roleName ?? ''  // 获取角色中文标签
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`table-row${selectedId === item.id ? ' is-active' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  {/* 头像图片，无头像时使用默认头像 */}
                  <img className="table-avatar" src={item.avatar || '/uploads/avatars/default.png'} alt="" />
                  {item.title}      {item.displayName || '—'}      {roleLabel}      <StatusBadge status={item.status ?? 'active'} />
                </button>
              )
            })}
            {/* 列表为空时的占位提示 */}
            {filteredItems.length === 0 && (
              <div className="pager-row">
                <span>暂无用户数据</span>
              </div>
            )}
          </article>
        </aside>
      </div>

      {/* 底部：完整用户列表表格（显示所有字段） */}
      <article className="panel-card">
        <h2 className="section-title">完整用户列表</h2>
        <p className="section-copy">字段：用户名 / 姓名 / 角色 / 职务 / 状态 / 创建日期</p>
        <div className="table-head">用户名      姓名      角色      职务      状态      创建日期</div>
        {filteredItems.map((item) => {
          const roleLabel = ROLE_LABELS[item.roleName] ?? item.roleName ?? ''  // 获取角色中文标签
          return (
            <button
              key={item.id}
              type="button"
              className={`table-row${selectedId === item.id ? ' is-active' : ''}`}
              onClick={() => handleSelect(item)}
            >
              {item.title}      {item.displayName || '—'}      {roleLabel}      {item.position || '—'}      <StatusBadge status={item.status ?? 'active'} />      {item.scheduledAt || '—'}
            </button>
          )
        })}
        {/* 列表为空时的占位提示 */}
        {filteredItems.length === 0 && (
          <div className="pager-row">
            <span>暂无用户数据</span>
          </div>
        )}
        <div className="section-foot">共 {filteredItems.length} 名用户 · 禁用后用户无法登录后台但不删除数据</div>
      </article>

      {/* 页脚提示 */}
      <div className="page-footnote">{FOOT_HINT}</div>
    </section>
  )
}

export default UsersPage