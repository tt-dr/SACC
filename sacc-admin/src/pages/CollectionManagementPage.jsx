import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import { createDraftForModule } from '../lib/adminConfig'

let imageIdCounter = 0
function nextImageId() {
  imageIdCounter += 1
  return `img-${Date.now()}-${imageIdCounter}`
}

const FOOT_HINT = '📝 Markdown 预览已启用：支持 # 标题、**加粗**、- 列表、`代码`'

const MODULE_PAGE_UI = {
  news: {
    pageTitle: '成员动态管理',
    createLabel: '新建博客',
    searchPlaceholder: '搜索标题 / 作者 / 标签',
    toolbarCopy: '作者：全部 ▼    批量审核    + 新建博客',
    editorTitle: '成员博客编辑',
    editorHint: '维护成员博客的标题、作者、摘要与正文，审核后同步到官网成员动态',
    saveLabel: '保存并发布',
    infoTitle: '博客发布状态',
    infoCards: [
      { title: '待审核', value: '4 篇' },
      { title: '已发布', value: '128 篇' },
      { title: '草稿箱', value: '16 篇' },
    ],
    sectionTitle: '成员博客列表',
    sectionHint: '字段：标题 / 作者 / 状态 / 发布时间（可按作者筛选与批量操作）',
    sectionFoot: '每页 20 条  ·  支持批量发布与撤回',
    bulkLeft: '☑ 已选择 2 篇',
    bulkRight: '批量发布  批量撤回  批量删除',
    modalTitle: '弹窗预览：新建博客',
    modalLines: [
      '标题：_______________________',
      '作者：___________    发布时间：立即',
      '按钮：[取消]   [保存草稿]   [发布]',
    ],
    confirmText: '删除确认：确定删除选中的 2 篇博客？',
  },
  docs: {
    pageTitle: '文档库管理',
    createLabel: '新建文档',
    searchPlaceholder: '搜索文档 / 分类',
    toolbarCopy: '分类：全部 ▼    调整排序    + 新建文档',
    editorTitle: '文档编辑',
    editorHint: '使用 # 与 ## 标题组织结构，官网文档库会自动生成右侧目录',
    saveLabel: '保存文档',
    infoTitle: '文档状态统计',
    infoCards: [
      { title: '已发布', value: '32 篇' },
      { title: '草稿箱', value: '8 篇' },
      { title: '文档分类', value: '5 类' },
    ],
    sectionTitle: '文档列表',
    sectionHint: '字段：标题 / 分类 / 状态 / 更新时间，左侧列表对应官网文档库导航。',
    sectionFoot: '文档更新后 5 分钟内同步到官网文档库。',
    modalTitle: '弹窗预览：新建文档',
    modalLines: [
      '文档标题：___________________',
      '分类：入门 / 规范 / 组件',
      '正文：# 标题  ## 小节（自动生成目录）',
      '按钮：[取消]   [保存]',
    ],
    confirmText: '下线确认：是否下线“UI 组件库说明”？',
  },
  projects: {
    pageTitle: '项目展示管理',
    createLabel: '新建项目',
    searchPlaceholder: '搜索项目名',
    toolbarCopy: '拖拽列表排序    + 新建项目',
    editorTitle: '项目卡片编辑',
    editorHint: '维护项目名称、仓库链接、标签与进度',
    saveLabel: '保存项目',
    infoTitle: '项目状态统计',
    infoCards: [
      { title: '展示中项目', value: '24 个' },
      { title: '有仓库链接', value: '—' },
      { title: '有标签', value: '—' },
    ],
    sectionTitle: '项目拖拽排序',
    sectionHint: '拖动列表项即可调整项目在首页的展示顺序，顺序实时生效。',
    sectionFoot: '排序变更实时保存，立即同步到官网项目页。',
  },
  users: {
    pageTitle: '用户管理',
    createLabel: '新建账号',
    searchPlaceholder: '搜索用户名 / 角色',
    toolbarCopy: '角色：全部 ▼    + 新建账号',
    editorTitle: '账号编辑',
    editorHint: '管理后台登录账号，分配角色（super_admin / editor）',
    saveLabel: '保存账号',
    infoTitle: '角色分布',
    infoCards: [
      { title: '超级管理员', value: '1 人' },
      { title: '普通成员', value: '2 人' },
      { title: '总用户数', value: '3 人' },
    ],
    sectionTitle: '用户列表',
    sectionHint: '字段：用户名 / 角色 / 状态 / 创建日期。仅超级管理员可访问此页面。',
    sectionFoot: '密码由管理员在创建时设置，用户首次登录后可自行修改。',
  },
}

function formatNewsRow(item) {
  const author = item.author || '匿名成员'
  const publishAt = item.scheduledAt || '2026-04-01'
  return `${item.title}      ${author}      ${publishAt}`
}

function formatDocRow(item) {
  const category = item.category || '文档'
  const updatedAt = item.scheduledAt || '2026-04-01'
  return `${item.title}      ${category}      ${updatedAt}`
}

function formatUserRow(item) {
  const role = item.roleName || 'editor'
  const roleLabel = role === 'super_admin' ? '超级管理员' : '普通成员'
  const createdAt = item.scheduledAt || '2026-01-15'
  return { avatar: item.avatar || '/uploads/avatars/default.png', label: `${item.title}      ${roleLabel}      ${createdAt}` }
}

function TextField({ label, children }) {
  return (
    <label className="design-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function DragReorderList({ items, selectedId, onSelect, onReorder, moduleKey }) {
  const [dragIndex, setDragIndex] = useState(null)

  const handleDragStart = (event, index) => {
    setDragIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${index}`)
  }

  const handleDragOver = (event, index) => {
    event.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const reordered = [...items]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    onReorder(reordered)
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div className="drag-list">
      <div className="table-head">
          {moduleKey === 'docs'
            ? '#      文档标题      分类'
            : '#      项目名称'}
        </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(event) => handleDragStart(event, index)}
          onDragOver={(event) => handleDragOver(event, index)}
          onDragEnd={handleDragEnd}
          onClick={() => onSelect(item)}
          className={`drag-list-item${selectedId === item.id ? ' is-active' : ''}${dragIndex === index ? ' is-dragging' : ''}`}
        >
          <span className="drag-handle" aria-hidden="true">⠿</span>
          <span className="drag-order">#{index + 1}</span>
          <span className="drag-title">{item.title}</span>
          {moduleKey === 'docs' ? (
            <span className="drag-owner">{item.category || '文档'}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function renderEditorFields(moduleKey, draft, handleFieldChange, contentRef, handlePaste) {
  switch (moduleKey) {
    case 'news':
      return (
        <>
          <div className="design-field-row">
            <TextField label="标题">
              <input value={draft.title ?? ''} onChange={(event) => handleFieldChange('title', event.target.value)} />
            </TextField>
            <TextField label="作者">
              <input value={draft.author ?? ''} onChange={(event) => handleFieldChange('author', event.target.value)} />
            </TextField>
          </div>
          <div className="design-field-row">
            <TextField label="发布时间">
              <input type="date" value={draft.scheduledAt ?? ''} onChange={(event) => handleFieldChange('scheduledAt', event.target.value)} />
            </TextField>
            <TextField label="标签">
              <input value={Array.isArray(draft.tags) ? draft.tags.join(' / ') : ''} onChange={(event) => handleFieldChange('tags', event.target.value.split(/[/,，]/).map((tag) => tag.trim()).filter(Boolean))} />
            </TextField>
          </div>
          <TextField label="摘要">
            <textarea rows={3} value={draft.summary ?? ''} onChange={(event) => handleFieldChange('summary', event.target.value)} />
          </TextField>
          <TextField label="正文">
            <textarea rows={5} value={draft.content ?? ''} onChange={(event) => handleFieldChange('content', event.target.value)} />
          </TextField>
        </>
      )
    case 'docs':
      return (
        <>
          <div className="design-field-row">
            <TextField label="文档标题">
              <input value={draft.title ?? ''} onChange={(event) => handleFieldChange('title', event.target.value)} />
            </TextField>
            <TextField label="分类">
              <input value={draft.category ?? ''} onChange={(event) => handleFieldChange('category', event.target.value)} />
            </TextField>
          </div>
          <TextField label="更新时间">
            <input type="date" value={draft.scheduledAt ?? ''} onChange={(event) => handleFieldChange('scheduledAt', event.target.value)} />
          </TextField>
          <TextField label="简介">
            <textarea rows={2} value={draft.summary ?? ''} onChange={(event) => handleFieldChange('summary', event.target.value)} />
          </TextField>
          <TextField label="正文（Markdown）">
            <textarea
              ref={contentRef}
              rows={8}
              value={draft.content ?? ''}
              onChange={(event) => handleFieldChange('content', event.target.value)}
              onPaste={handlePaste}
            />
          </TextField>
        </>
      )
    case 'projects':
      return (
        <>
          <TextField label="项目名称">
            <input value={draft.title ?? ''} onChange={(event) => handleFieldChange('title', event.target.value)} />
          </TextField>
          <TextField label="仓库链接">
            <input value={draft.repoUrl ?? ''} onChange={(event) => handleFieldChange('repoUrl', event.target.value)} />
          </TextField>
          <TextField label="项目标签">
            <input value={Array.isArray(draft.tags) ? draft.tags.join(' / ') : ''} onChange={(event) => handleFieldChange('tags', event.target.value.split(/[/,，]/).map((tag) => tag.trim()).filter(Boolean))} />
          </TextField>
          <TextField label="项目摘要">
            <textarea rows={2} value={draft.summary ?? ''} onChange={(event) => handleFieldChange('summary', event.target.value)} />
          </TextField>
          <TextField label="项目详情">
            <textarea rows={5} value={draft.content ?? ''} onChange={(event) => handleFieldChange('content', event.target.value)} />
          </TextField>
        </>
      )
    case 'users':
      return (
        <>
          <div className="design-field-row">
            <TextField label="用户名">
              <input value={draft.title ?? ''} onChange={(event) => handleFieldChange('title', event.target.value)} />
            </TextField>
            <TextField label="角色">
              <input value={draft.roleName ?? ''} onChange={(event) => handleFieldChange('roleName', event.target.value)} />
            </TextField>
          </div>
          <TextField label="头像 URL">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                value={draft.avatar ?? ''}
                onChange={(event) => handleFieldChange('avatar', event.target.value)}
                placeholder="通过图床上传后填入 URL"
                style={{ flex: 1 }}
              />
              {draft.avatar && (
                <img
                  src={draft.avatar}
                  alt="头像预览"
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                />
              )}
            </div>
          </TextField>
          <TextField label="密码">
            <input type="password" value={draft.password ?? ''} onChange={(event) => handleFieldChange('password', event.target.value)} placeholder="留空则不修改" />
          </TextField>
          <TextField label="备注">
            <textarea rows={2} value={draft.summary ?? ''} onChange={(event) => handleFieldChange('summary', event.target.value)} />
          </TextField>
        </>
      )
    default:
      return null
  }
}

function renderSecondaryContent(moduleKey, filteredItems, selectedId, handleSelect, handleReorder) {
  if (moduleKey === 'projects') {
    return (
      <DragReorderList
        items={filteredItems}
        selectedId={selectedId}
        onSelect={handleSelect}
        onReorder={handleReorder}
        moduleKey="projects"
      />
    )
  }

  if (moduleKey === 'docs') {
    return (
      <DragReorderList
        items={filteredItems}
        selectedId={selectedId}
        onSelect={handleSelect}
        onReorder={handleReorder}
        moduleKey="docs"
      />
    )
  }

  if (moduleKey === 'news') {
    const rows = filteredItems.slice(0, 4)
    return (
      <>
        <div className="table-head">头像      标题      作者      发布时间</div>
        {rows.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`table-row${selectedId === item.id ? ' is-active' : ''}`}
            onClick={() => handleSelect(item)}
          >
            <img className="table-avatar" src={item.authorAvatar || '/uploads/avatars/default.png'} alt="" />
            {formatNewsRow(item)}
          </button>
        ))}
      </>
    )
  }

  if (moduleKey === 'users') {
    const rows = filteredItems.slice(0, 5)
    return (
      <>
        <div className="table-head">头像      用户名      角色      创建日期</div>
        {rows.map((item) => {
          const { avatar, label } = formatUserRow(item)
          return (
            <button
              key={item.id}
              type="button"
              className={`table-row${selectedId === item.id ? ' is-active' : ''}`}
              onClick={() => handleSelect(item)}
            >
              <img className="table-avatar" src={avatar} alt="" />
              {label}
            </button>
          )
        })}
      </>
    )
  }

  return null
}

function renderExtraSection(moduleKey, config, items) {
  if (moduleKey === 'news') {
    return (
      <div className="pager-row">
        <span>共 {items.length} 篇</span>
      </div>
    )
  }

  if (moduleKey === 'docs') {
    return (
      <div className="pager-row">
        <span>共 {items.length} 篇文档</span>
      </div>
    )
  }

  if (moduleKey === 'users') {
    return (
      <div className="pager-row">
        <span>共 {items.length} 名用户</span>
      </div>
    )
  }

  return null
}

/**
 * CollectionManagementPage — 通用的集合管理页面
 *
 * 此页面复用于四个模块，每个操作对应一个 API 端点：
 *   GET    /api/v1/admin/content         — 加载内容列表（按 module 筛选）
 *   POST   /api/v1/admin/content         — 创建新内容
 *   PUT    /api/v1/admin/content/{id}    — 更新已有内容
 *   DELETE /api/v1/admin/content/{id}    — 删除内容（软删除）
 *   POST   /api/v1/admin/upload          — 上传图片（图床）
 *   PUT    /api/v1/admin/content/reorder — 拖拽排序（仅 docs/projects）
 *   GET    /api/v1/admin/users           — 用户列表（仅 users 模块）
 *   POST   /api/v1/admin/users           — 创建用户
 *   PUT    /api/v1/admin/users/{id}      — 修改用户
 *   DELETE /api/v1/admin/users/{id}      — 禁用用户
 */
function CollectionManagementPage({ moduleKey }) {
  const { database, saveCollectionItem, deleteCollectionItem, reorderItems } = useAdminData()
  const config = MODULE_PAGE_UI[moduleKey]
  const items = database[moduleKey] ?? []
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  const [draft, setDraft] = useState(() => createDraftForModule(moduleKey, items[0]))
  const [uploadedImages, setUploadedImages] = useState([])
  const [copyFeedback, setCopyFeedback] = useState('')
  const contentRef = useRef(null)
  const fileInputRef = useRef(null)
  const deferredKeyword = useDeferredValue(searchKeyword)

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId('')
      setDraft(createDraftForModule(moduleKey))
      return
    }

    const selectedItem = items.find((item) => item.id === selectedId)

    if (selectedItem) {
      return
    }

    setSelectedId(items[0].id)
    setDraft(createDraftForModule(moduleKey, items[0]))
  }, [items, moduleKey, selectedId])

  const filteredItems = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase()

    if (!normalizedKeyword) {
      return items
    }

    return items.filter((item) =>
      [item.title, item.summary, item.author, item.owner, item.category, ...(item.tags ?? [])]
        .filter(Boolean)
        .some((value) => `${value}`.toLowerCase().includes(normalizedKeyword)),
    )
  }, [deferredKeyword, items])

  if (!config) {
    return (
      <section className="page-stack">
        <h1 className="page-title">模块未找到</h1>
        <p className="section-copy">模块 "{moduleKey}" 尚未配置 UI，请检查 MODULE_PAGE_UI。</p>
      </section>
    )
  }

  const handleSelect = (item) => {
    setSelectedId(item.id)
    setDraft(createDraftForModule(moduleKey, item))
  }

  const handleFieldChange = (key, value) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }))
  }

  const handleSave = () => {
    // 映射: POST/PUT /api/v1/admin/content 或 POST/PUT /api/v1/admin/users/{id}
    const savedItem = saveCollectionItem(moduleKey, draft)

    if (!savedItem) {
      return
    }

    setSelectedId(savedItem.id)
    setDraft(createDraftForModule(moduleKey, savedItem))
  }

  const handleDelete = () => {
    if (!draft.id) return
    // 映射: DELETE /api/v1/admin/content/{id} 或 DELETE /api/v1/admin/users/{id}
    const confirmed = window.confirm(
      moduleKey === 'users'
        ? `确认禁用用户「${draft.title}」？`
        : `确认删除「${draft.title}」？此操作不可撤销。`
    )
    if (!confirmed) return
    deleteCollectionItem(moduleKey, draft.id)
    setSelectedId('')
    setDraft(createDraftForModule(moduleKey))
  }

  const handleCreateNew = () => {
    setSelectedId('')
    setDraft(createDraftForModule(moduleKey))
  }

  const handleReorder = (reordered) => {
    // 映射: PUT /api/v1/admin/content/reorder  { module, orderedIds }
    reorderItems(moduleKey, reordered)
  }

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const addUploadedImage = async (file) => {
    const dataUrl = await readFileAsDataUrl(file)
    const image = { id: nextImageId(), name: file.name, dataUrl }
    setUploadedImages((prev) => [image, ...prev])
    return image
  }

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    for (const file of files) {
      await addUploadedImage(file)
    }
    event.target.value = ''
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (!files || files.length === 0) return
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await addUploadedImage(file)
      }
    }
  }

  const handlePaste = async (event) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const image = await addUploadedImage(file)
          const mdLink = `![${image.name}](${image.dataUrl})`
          const textarea = contentRef.current
          if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const before = (draft.content ?? '').slice(0, start)
            const after = (draft.content ?? '').slice(end)
            const newContent = before + mdLink + after
            setDraft((prev) => ({ ...prev, content: newContent }))
            setTimeout(() => {
              const newPos = start + mdLink.length
              textarea.setSelectionRange(newPos, newPos)
              textarea.focus()
            }, 0)
          }
        }
        break
      }
    }
  }

  const handleCopyMdLink = async (image) => {
    const mdLink = `![${image.name}](${image.dataUrl})`
    try {
      await navigator.clipboard.writeText(mdLink)
      setCopyFeedback(image.id)
      setTimeout(() => setCopyFeedback(''), 1500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = mdLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopyFeedback(image.id)
      setTimeout(() => setCopyFeedback(''), 1500)
    }
  }

  const handleRemoveImage = (imageId) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const sectionContent = renderSecondaryContent(moduleKey, filteredItems, selectedId, handleSelect, handleReorder)
  const extraSection = renderExtraSection(moduleKey, config, filteredItems)

  return (
    <section className="page-stack">
      <h1 className="page-title">{config.pageTitle}</h1>

      <div className="page-toolbar">
        <label className="search-shell">
          <span>🔎</span>
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder={config.searchPlaceholder}
          />
        </label>
        <div className="toolbar-copy">
          <button type="button" className="primary-button" style={{ minHeight: 36, fontSize: 12 }} onClick={handleCreateNew}>
            {config.createLabel}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        <article className="panel-card">
          <h2 className="section-title">{config.editorTitle}</h2>
          <div className="editor-shell">
            <p className="section-copy">{config.editorHint}</p>
            {renderEditorFields(moduleKey, draft, handleFieldChange, contentRef, handlePaste)}
          </div>
          <div className="editor-actions">
            <button type="button" className="primary-button save-button" onClick={handleSave}>
              {config.saveLabel}
            </button>
            {draft.id && (
              <button type="button" className="danger-button" onClick={handleDelete}>
                {moduleKey === 'users' ? '禁用用户' : '删除'}
              </button>
            )}
          </div>
        </article>

        <aside className="side-summary">
          <article className="panel-card">
            <h2 className="section-title">{config.infoTitle}</h2>
            <div className="info-card-grid">
              {config.infoCards.map((item) => (
                <div key={item.title} className="info-card">
                  <strong>{item.title}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </article>

          {moduleKey === 'docs' && (
            <article className="panel-card">
              <h2 className="section-title">图床 · 上传图片</h2>
              <div
                className="image-drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="image-drop-icon">🖼</span>
                <span>拖拽图片到此处 / 点击上传</span>
                <span className="image-drop-hint">支持粘贴截图到正文编辑区</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              {uploadedImages.length > 0 && (
                <div className="image-thumb-list">
                  {uploadedImages.map((img) => (
                    <div key={img.id} className="image-thumb-item">
                      <img src={img.dataUrl} alt={img.name} className="image-thumb-preview" />
                      <span className="image-thumb-name">{img.name}</span>
                      <div className="image-thumb-actions">
                        <button
                          type="button"
                          className="image-copy-button"
                          onClick={() => handleCopyMdLink(img)}
                        >
                          {copyFeedback === img.id ? '已复制 ✓' : '复制 MD 链接'}
                        </button>
                        <button
                          type="button"
                          className="image-remove-button"
                          onClick={() => handleRemoveImage(img.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}
        </aside>
      </div>

      <article className="panel-card">
        <h2 className="section-title">{config.sectionTitle}</h2>
        <p className="section-copy">{config.sectionHint}</p>
        {sectionContent}
        <div className="section-foot">{config.sectionFoot}</div>
      </article>

      {extraSection}

      <div className="page-footnote">{FOOT_HINT}</div>
    </section>
  )
}

export default CollectionManagementPage
