import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import { createDraftForModule } from '../lib/adminConfig'

// 页脚提示文案常量，提醒用户 Markdown 预览已启用
const FOOT_HINT = '📝 Markdown 预览已启用：支持 # 标题、**加粗**、- 列表、`代码`'

// 创建一个空白项目草稿对象，用于"新建项目"时初始化表单
function createEmptyDraft() {
  return {
    id: '',            // 项目唯一标识，新建时为空字符串
    title: '',         // 项目名称
    scheduledAt: '',   // 展示日期（YYYY-MM-DD 格式字符串）
    summary: '',       // 项目摘要（一句话说明）
    content: '',       // 项目详情正文（支持 Markdown 语法）
    repoUrl: '',       // 代码仓库链接（如 GitHub 地址）
    tags: [],          // 项目标签数组（如 ['AI', '前端']）
    coverImage: '',    // 项目封面图片 URL
    stars: 0,          // 星标数（预留字段）
    sortOrder: 0,     // 排序权重，数字越小越靠前
    status: 'published', // 发布状态：published（已发布）/ draft（草稿）
  }
}

// 通用表单字段组件：左侧显示标签文字，右侧渲染子元素（input / textarea 等）
function TextField({ label, children }) {
  return (
    // 使用 design-field 样式类，确保标签与输入框垂直排列
    <label className="design-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

// 拖拽排序列表组件：支持拖动列表项重新排序，点击列表项可选中编辑
function DragReorderList({ items, selectedId, onSelect, onReorder }) {
  // 当前正在拖拽的列表项索引，null 表示没有在拖拽
  const [dragIndex, setDragIndex] = useState(null)

  // 拖拽开始时触发：记录当前拖拽项的索引
  const handleDragStart = (event, index) => {
    setDragIndex(index)                                    // 保存拖拽项索引到状态
    event.dataTransfer.effectAllowed = 'move'              // 设置拖拽效果为"移动"
    event.dataTransfer.setData('text/plain', `${index}`)   // 写入拖拽数据（部分浏览器要求必须有数据才能触发拖拽）
  }

  // 拖拽经过某个列表项时触发：交换位置并通知父组件
  const handleDragOver = (event, index) => {
    event.preventDefault()                                 // 必须 preventDefault，否则不允许 drop
    // 如果没有正在拖拽的项，或者拖拽到了自己身上，则不做处理
    if (dragIndex === null || dragIndex === index) return
    const reordered = [...items]                           // 浅拷贝列表数组，避免直接修改原数组
    const [moved] = reordered.splice(dragIndex, 1)         // 从原位置移除被拖拽的项
    reordered.splice(index, 0, moved)                     // 将被拖拽的项插入到目标位置
    onReorder(reordered)                                   // 调用父组件传入的回调，更新排序
    setDragIndex(index)                                    // 更新当前拖拽索引为目标位置
  }

  // 拖拽结束时触发：重置拖拽索引
  const handleDragEnd = () => setDragIndex(null)

  return (
    <div className="drag-list">
      {/* 列表表头：序号 / 项目名称 / 标签 */}
      <div className="table-head">#      项目名称      标签</div>
      {/* 遍历项目列表，渲染每一行 */}
      {items.map((item, index) => (
        <div
          key={item.id}                                                                    // React key 用项目 id 保证唯一
          draggable                                                                       // draggable 属性使该元素可拖拽
          onDragStart={(event) => handleDragStart(event, index)}                           // 绑定拖拽开始事件
          onDragOver={(event) => handleDragOver(event, index)}                             // 绑定拖拽经过事件
          onDragEnd={handleDragEnd}                                                        // 绑定拖拽结束事件
          onClick={() => onSelect(item)}                                                   // 点击列表项时选中该项目进行编辑
          className={`drag-list-item${selectedId === item.id ? ' is-active' : ''}${dragIndex === index ? ' is-dragging' : ''}`}
        >
          {/* 拖拽手柄图标（⠿），aria-hidden 表示对屏幕阅读器隐藏 */}
          <span className="drag-handle" aria-hidden="true">⠿</span>
          {/* 序号显示，从 1 开始 */}
          <span className="drag-order">#{index + 1}</span>
          {/* 项目名称 */}
          <span className="drag-title">{item.title}</span>
          {/* 标签显示：有标签则用 / 分隔，无标签则显示"无标签" */}
          <span className="drag-owner">
            {Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.join(' / ') : '无标签'}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * ProjectsPage — 项目展示管理页面
 *
 * 对应 API 端点：
 *   GET    /api/v1/admin/content?module=projects  — 加载项目列表
 *   POST   /api/v1/admin/content                  — 创建项目
 *   PUT    /api/v1/admin/content/{id}             — 更新项目
 *   DELETE /api/v1/admin/content/{id}             — 删除项目
 *   PUT    /api/v1/admin/content/reorder          — 拖拽排序
 */
function ProjectsPage() {
  // 从 AdminDataContext 解构出：database（数据库引用）、saveCollectionItem（创建/更新）、deleteCollectionItem（删除）、reorderItems（重排序）
  const { database, saveCollectionItem, deleteCollectionItem, reorderItems } = useAdminData()
  // 从数据库中取出 projects 数组，如果不存在则用空数组兜底
  const items = database.projects ?? []

  // 搜索关键字状态，绑定到搜索输入框
  const [searchKeyword, setSearchKeyword] = useState('')
  // 当前选中的项目 ID，用于高亮列表项和加载编辑表单
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  // 当前编辑中的项目草稿对象，包含表单所有字段的值
  const [draft, setDraft] = useState(() => createDraftForModule('projects', items[0]))
  // 延迟后的搜索关键字，避免每次按键都触发过滤计算，提升输入体验
  const deferredKeyword = useDeferredValue(searchKeyword)

  // 副作用：当项目列表变化或选中的 ID 变化时，确保选中项有效
  useEffect(() => {
    // 如果列表为空，清空选中状态和草稿
    if (items.length === 0) {
      setSelectedId('')
      setDraft(createEmptyDraft())
      return
    }
    // 查找当前选中的项目是否还在列表中
    const selectedItem = items.find((item) => item.id === selectedId)
    // 如果选中的项目不存在了（可能被删除），自动选中第一个项目
    if (!selectedItem) {
      setSelectedId(items[0].id)
      setDraft(createDraftForModule('projects', items[0]))
    }
  }, [items, selectedId]) // 依赖数组：当 items 或 selectedId 变化时重新执行

  // 过滤后的项目列表：根据搜索关键字过滤，使用 useMemo 缓存避免重复计算
  const filteredItems = useMemo(() => {
    const kw = deferredKeyword.trim().toLowerCase()  // 去空格并转小写，实现不区分大小写搜索
    if (!kw) return items                            // 无关键字时返回全部
    return items.filter((item) =>
      // 在项目名称、摘要、仓库链接、标签中搜索匹配项
      [item.title, item.summary, item.repoUrl, ...(item.tags ?? [])]
        .filter(Boolean)                             // 过滤掉 undefined / null / 空字符串
        .some((v) => `${v}`.toLowerCase().includes(kw)),  // 任一字段包含关键字即匹配
    )
  }, [deferredKeyword, items]) // 依赖：延迟关键字或项目列表变化时重新计算

  // 统计卡片数据：项目总数、有仓库链接的数量、有标签的数量
  const summaryCards = useMemo(() => {
    const total = items.length                                                          // 项目总数
    const withRepo = items.filter((it) => it.repoUrl).length                            // 有仓库链接的项目数
    const withTags = items.filter((it) => Array.isArray(it.tags) && it.tags.length > 0).length // 有标签的项目数
    return [
      { label: '项目总数', value: total },
      { label: '有仓库链接', value: withRepo },
      { label: '有标签', value: withTags },
    ]
  }, [items]) // 依赖：项目列表变化时重新统计

  // 点击列表项时选中该项目：更新选中 ID 并加载草稿
  const handleSelect = (item) => {
    setSelectedId(item.id)                                   // 更新选中 ID
    setDraft(createDraftForModule('projects', item))         // 用选中的项目数据填充编辑表单
  }

  // 表单字段变更处理：按 key 更新 draft 对应字段
  const handleFieldChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))           // 使用展开运算符保留其他字段，仅更新指定字段
  }

  // 保存项目（新建或更新）：校验必填字段后调用 saveCollectionItem
  const handleSave = () => {
    // 校验：项目名称不能为空
    if (!draft.title?.trim()) {
      window.alert('请填写项目名称')
      return
    }
    // 调用 AdminDataContext 的方法保存项目（无 id 时新建，有 id 时更新）
    const saved = saveCollectionItem('projects', draft)
    // 保存成功后，更新选中 ID 并用保存后的数据刷新表单
    if (saved) {
      setSelectedId(saved.id)
      setDraft(createDraftForModule('projects', saved))
    }
  }

  // 删除项目：弹出确认框，确认后调用 deleteCollectionItem
  const handleDelete = () => {
    if (!draft.id) return                                    // 新建状态下没有 id，不执行删除
    // 弹出确认对话框，防止误删
    const confirmed = window.confirm(`确认删除项目「${draft.title}」？此操作不可撤销。`)
    if (!confirmed) return                                  // 用户取消则不执行
    deleteCollectionItem('projects', draft.id)              // 从数据库中删除该项目
    setSelectedId('')                                       // 清空选中 ID
    setDraft(createEmptyDraft())                             // 重置表单为空白草稿
  }

  // 点击"新建项目"按钮：清空选中状态和表单，进入新建模式
  const handleCreateNew = () => {
    setSelectedId('')
    setDraft(createEmptyDraft())
  }

  // 拖拽排序回调：接收重排后的数组，调用 AdminDataContext 的 reorderItems 持久化
  const handleReorder = (reordered) => {
    reorderItems('projects', reordered)
  }

  return (
    // page-stack 是页面最外层容器，负责垂直排列各区块
    <section className="page-stack">
      <h1 className="page-title">项目展示管理</h1>

      {/* 工具栏区域：包含搜索框和新建按钮 */}
      <div className="page-toolbar">
        {/* 搜索框，search-shell 提供圆角边框样式 */}
        <label className="search-shell">
          <span>🔎</span>
          <input
            value={searchKeyword}                                           // 受控输入，值绑定到 searchKeyword 状态
            onChange={(e) => setSearchKeyword(e.target.value)}               // 输入时更新关键字
            placeholder="搜索项目名 / 标签 / 仓库链接"
          />
        </label>
        {/* 右侧操作区 */}
        <div className="toolbar-copy">
          {/* 新建项目按钮，点击后进入新建模式 */}
          <button type="button" className="primary-button" style={{ minHeight: 36, fontSize: 12 }} onClick={handleCreateNew}>
            + 新建项目
          </button>
        </div>
      </div>

      {/* 编辑器布局：左侧编辑面板 + 右侧统计/排序列表 */}
      <div className="editor-layout">
        {/* 左侧：项目详情编辑面板 */}
        <article className="panel-card">
          <h2 className="section-title">项目详情编辑</h2>
          <div className="editor-shell">
            <p className="section-copy">维护项目名称、仓库链接、标签与详情，保存后同步到官网项目展示页。</p>

            {/* 项目名称输入框 */}
            <TextField label="项目名称">
              <input value={draft.title ?? ''} onChange={(e) => handleFieldChange('title', e.target.value)} placeholder="请输入项目名称" />
            </TextField>

            {/* 仓库链接 + 展示日期 并排显示 */}
            <div className="design-field-row">
              <TextField label="仓库链接">
                <input value={draft.repoUrl ?? ''} onChange={(e) => handleFieldChange('repoUrl', e.target.value)} placeholder="https://github.com/..." />
              </TextField>
              <TextField label="展示日期">
                <input type="date" value={draft.scheduledAt ?? ''} onChange={(e) => handleFieldChange('scheduledAt', e.target.value)} />
              </TextField>
            </div>

            {/* 项目标签输入框：用 / 或 ， 分隔，自动转为数组 */}
            <TextField label="项目标签">
              <input
                value={Array.isArray(draft.tags) ? draft.tags.join(' / ') : ''}       // 显示时把数组拼接成字符串
                onChange={(e) =>
                  handleFieldChange(
                    'tags',
                    // 用正则按 / 或 ， 分割，去空格后过滤空值
                    e.target.value.split(/[/,，]/).map((t) => t.trim()).filter(Boolean),
                  )
                }
                placeholder="AI / 前端 / 校园服务"
              />
            </TextField>

            {/* 项目摘要：多行文本框 */}
            <TextField label="项目摘要">
              <textarea rows={3} value={draft.summary ?? ''} onChange={(e) => handleFieldChange('summary', e.target.value)} placeholder="说明项目价值和定位" />
            </TextField>

            {/* 项目详情：支持 Markdown 语法的多行文本框 */}
            <TextField label="项目详情（Markdown）">
              <textarea rows={6} value={draft.content ?? ''} onChange={(e) => handleFieldChange('content', e.target.value)} placeholder="## 项目亮点&#10;- 特性1&#10;- 特性2" />
            </TextField>
          </div>

          {/* 编辑器底部操作按钮 */}
          <div className="editor-actions">
            {/* 保存按钮 */}
            <button type="button" className="primary-button save-button" onClick={handleSave}>
              保存项目
            </button>
            {/* 仅在编辑已有项目时显示删除按钮 */}
            {draft.id && (
              <button type="button" className="danger-button" onClick={handleDelete}>
                删除
              </button>
            )}
          </div>
        </article>

        {/* 右侧：统计卡片 + 拖拽排序列表 */}
        <aside className="side-summary">
          {/* 项目状态统计卡片 */}
          <article className="panel-card">
            <h2 className="section-title">项目状态统计</h2>
            <div className="info-card-grid">
              {/* 遍历统计卡片数据渲染 */}
              {summaryCards.map((card) => (
                <div key={card.label} className="info-card">
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </div>
              ))}
            </div>
          </article>

          {/* 拖拽排序面板 */}
          <article className="panel-card">
            <h2 className="section-title">项目拖拽排序</h2>
            <p className="section-copy">拖动列表项即可调整项目在首页的展示顺序，顺序实时生效。</p>
            {/* 使用 DragReorderList 组件渲染可拖拽列表 */}
            <DragReorderList
              items={filteredItems}        // 传入过滤后的项目列表
              selectedId={selectedId}       // 当前选中项 ID
              onSelect={handleSelect}       // 选中回调
              onReorder={handleReorder}    // 排序回调
            />
          </article>
        </aside>
      </div>

      {/* 底部：完整项目列表表格 */}
      <article className="panel-card">
        <h2 className="section-title">项目列表</h2>
        <p className="section-copy">字段：项目名称 / 标签 / 仓库链接 / 展示日期（点击列表项可编辑）</p>
        {/* 表头 */}
        <div className="table-head">项目名称      标签      仓库链接      展示日期</div>
        {/* 遍历过滤后的项目列表渲染每一行 */}
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`table-row${selectedId === item.id ? ' is-active' : ''}`}  // 选中项高亮
            onClick={() => handleSelect(item)}
          >
            {item.title}      {Array.isArray(item.tags) ? item.tags.join(' / ') : ''}      {item.repoUrl || '—'}      {item.scheduledAt || '—'}
          </button>
        ))}
        {/* 列表为空时的占位提示 */}
        {filteredItems.length === 0 && (
          <div className="pager-row">
            <span>暂无项目数据</span>
          </div>
        )}
        <div className="section-foot">排序变更实时保存，立即同步到官网项目页。</div>
      </article>

      {/* 页脚提示 */}
      <div className="page-footnote">{FOOT_HINT}</div>
    </section>
  )
}

export default ProjectsPage
