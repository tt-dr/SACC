function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

export const NAV_ITEMS = {
  super_admin: [
    { key: 'dashboard', path: '/', label: '> 仪表盘 Dashboard' },
    { key: 'users', path: '/users', label: '> 用户管理' },
    { key: 'docs', path: '/docs', label: '> 文档库管理' },
    { key: 'news', path: '/news', label: '> 成员动态管理' },
    { key: 'projects', path: '/projects', label: '> 项目展示' },
  ],
  editor: [
    { key: 'dashboard', path: '/', label: '> 仪表盘 Dashboard' },
    { key: 'news', path: '/news', label: '> 成员动态管理' },
    { key: 'projects', path: '/projects', label: '> 项目展示' },
  ],
}

export const PAGE_META = {
  '/': {
    title: '仪表盘总览',
    breadcrumb: '首页 / 社团官网管理后台 / 仪表盘',
  },
  '/users': {
    title: '用户管理',
    breadcrumb: '首页 / 系统管理 / 用户管理',
  },
  '/docs': {
    title: '文档库管理',
    breadcrumb: '首页 / 内容管理 / 文档库',
  },
  '/news': {
    title: '成员动态管理',
    breadcrumb: '首页 / 内容管理 / 成员动态',
  },
  '/projects': {
    title: '项目展示管理',
    breadcrumb: '首页 / 内容管理 / 项目展示',
  },
}

export const COLLECTION_MODULES = {
  users: {
    title: '用户管理',
    subtitle: '管理后台账号，分配角色与重置密码。仅超级管理员可见。',
    listTitle: '用户列表',
    formTitle: '账号编辑',
    createLabel: '新建账号',
    placeholder: '搜索用户名 / 角色 / 职务',
    fields: [
      { key: 'title', label: '用户名', type: 'text', placeholder: '请输入登录用户名' },
      { key: 'displayName', label: '姓名', type: 'text', placeholder: '真实姓名' },
      { key: 'roleName', label: '管理角色', type: 'text', placeholder: 'super_admin / editor' },
      { key: 'position', label: '社团职务', type: 'text', placeholder: '前端组组长 / 组员等' },
      { key: 'desc', label: '一句话描述', type: 'textarea', rows: 2, placeholder: '例如：统筹全局，确保每一件事都有闭环。' },
      { key: 'password', label: '密码', type: 'text', placeholder: '留空则不修改' },
      { key: 'scheduledAt', label: '创建日期', type: 'date' },
      { key: 'summary', label: '备注', type: 'textarea', rows: 2, placeholder: '例如：张三、前端组' },
    ],
    summaryCards(items) {
      return [
        { label: '超级管理员', value: items.filter((it) => it.roleName === 'super_admin').length },
        { label: '普通成员', value: items.filter((it) => it.roleName === 'editor').length },
        { label: '总用户数', value: items.length },
      ]
    },
  },
  news: {
    title: '成员动态管理',
    subtitle: '维护成员发布的技术博客文章，发布即生效。',
    listTitle: '成员博客列表',
    formTitle: '博客发布与编辑',
    createLabel: '新建博客',
    placeholder: '搜索标题 / 标签 / 作者',
    fields: [
      { key: 'title', label: '标题', type: 'text', placeholder: '请输入博客标题' },
      { key: 'author', label: '作者', type: 'text', placeholder: '例如：林嘉禾' },
      { key: 'scheduledAt', label: '发布时间', type: 'date' },
      { key: 'summary', label: '摘要', type: 'textarea', rows: 3, placeholder: '用于列表卡片的简述' },
      { key: 'content', label: '正文', type: 'textarea', rows: 8, placeholder: '支持 Markdown 预览' },
      { key: 'tags', label: '标签', type: 'tags', placeholder: 'React, 性能, 复盘' },
    ],
    summaryCards(items) {
      return [
        { label: '博客总数', value: items.length },
        { label: '本月新增', value: items.filter((it) => it.scheduledAt?.startsWith('2026-04')).length },
        { label: '总浏览', value: items.reduce((total, item) => total + (item.views ?? 0), 0) },
      ]
    },
  },
  docs: {
    title: '文档库管理',
    subtitle: '维护项目文档与技术方案，拖拽排序，仅超级管理员可操作。',
    listTitle: '文档列表',
    formTitle: '文档编辑',
    createLabel: '新建文档',
    placeholder: '搜索文档 / 分类',
    fields: [
      { key: 'title', label: '文档标题', type: 'text', placeholder: '请输入文档标题' },
      { key: 'category', label: '分类', type: 'text', placeholder: '入门 / 规范 / 组件' },
      { key: 'scheduledAt', label: '更新时间', type: 'date' },
      { key: 'summary', label: '简介', type: 'textarea', rows: 2, placeholder: '一句话描述文档定位' },
      { key: 'content', label: '正文', type: 'textarea', rows: 10, placeholder: '使用 # 与 ## 标题组织结构' },
    ],
    summaryCards(items) {
      const categories = new Set(items.map((item) => item.category).filter(Boolean))
      return [
        { label: '文档总数', value: items.length },
        { label: '覆盖分类', value: categories.size },
        { label: '已更新', value: items.length },
      ]
    },
  },
  projects: {
    title: '项目展示管理',
    subtitle: '维护 GitHub 项目卡片，拖拽排序。',
    listTitle: '项目列表',
    formTitle: '项目详情编辑',
    createLabel: '新建项目',
    placeholder: '搜索项目 / 标签',
    fields: [
      { key: 'title', label: '项目名称', type: 'text', placeholder: '请输入项目名称' },
      { key: 'scheduledAt', label: '展示日期', type: 'date' },
      { key: 'summary', label: '项目摘要', type: 'textarea', rows: 3, placeholder: '说明项目价值和定位' },
      { key: 'content', label: '项目详情', type: 'textarea', rows: 8, placeholder: '支持 Markdown 预览' },
      { key: 'repoUrl', label: '仓库链接', type: 'text', placeholder: 'https://github.com/...' },
      { key: 'tags', label: '标签', type: 'tags', placeholder: 'AI, 前端, 校园服务' },
    ],
    summaryCards(items) {
      return [
        { label: '项目总数', value: items.length },
        { label: '有仓库链接', value: items.filter((item) => item.repoUrl).length },
        { label: '有标签', value: items.filter((item) => item.tags && item.tags.length > 0).length },
      ]
    },
  },
}

export function createDraftForModule(moduleKey, item = null) {
  if (item) {
    return cloneValue(item)
  }

  const moduleConfig = COLLECTION_MODULES[moduleKey]
  const draft = {
    id: '',
    title: '',
    displayName: '',
    author: '',
    owner: '',
    category: '',
    progress: '',
    repoUrl: '',
    roleName: '',
    position: '',
    desc: '',
    summary: '',
    content: '',
    scheduledAt: '',
    tags: [],
    avatar: '',
    sortOrder: 0,
  }

  if (moduleConfig) {
    moduleConfig.fields.forEach((field) => {
      if (field.type === 'tags') {
        draft[field.key] = []
        return
      }
    })
  }

  return draft
}

export function createSeedDatabase() {
  return cloneValue({
    metrics: {
      siteVisits: 128460,
      activeMembers: 312,
    },
    users: [
      {
        id: 'user-001',
        title: 'admin',
        displayName: 'Super Admin',
        roleName: 'super_admin',
        position: '',
        desc: '',
        password: 'admin123',
        scheduledAt: '2026-01-15',
        summary: '超级管理员：管理用户账号与文档库',
        avatar: '/uploads/avatars/admin.png',
        updatedAt: '2026-03-18 20:30',
      },
      {
        id: 'user-002',
        title: 'zhouyichen',
        displayName: '周亦晨',
        roleName: 'super_admin',
        position: '执行主席',
        desc: '统筹全局，确保每一件事都有闭环。',
        password: '',
        scheduledAt: '2026-01-15',
        summary: '社团执行主席，统筹全局',
        avatar: '/uploads/avatars/zhouyichen.png',
        updatedAt: '2026-04-06 20:10',
      },
      {
        id: 'user-003',
        title: 'xumuan',
        displayName: '许沐安',
        roleName: 'editor',
        position: '主席',
        desc: '专注训练营与招新，把成长路径跑通。',
        password: '',
        scheduledAt: '2026-02-10',
        summary: '主席，负责训练营与招新',
        avatar: '/uploads/avatars/default.png',
        updatedAt: '2026-04-01 10:15',
      },
      {
        id: 'user-004',
        title: 'chensiyuan',
        displayName: '陈思远',
        roleName: 'editor',
        position: '主席',
        desc: '推进周会复盘，让制度不只是纸上。',
        password: '',
        scheduledAt: '2026-02-10',
        summary: '主席，负责制度与复盘',
        avatar: '/uploads/avatars/default.png',
        updatedAt: '2026-04-01 10:20',
      },
      {
        id: 'user-005',
        title: 'linjiahe',
        displayName: '林嘉禾',
        roleName: 'super_admin',
        position: '前端组组长',
        desc: '官网、组件库、工程化，一砖一瓦建起来。',
        password: 'lin123',
        scheduledAt: '2026-02-10',
        summary: '前端负责人，负责官网与组件体系',
        avatar: '/uploads/avatars/linjiahe.png',
        updatedAt: '2026-04-06 20:10',
      },
      {
        id: 'user-006',
        title: 'zhaoyichen',
        displayName: '赵奕辰',
        roleName: 'editor',
        position: '后端组组长',
        desc: 'Gin + Gorm，稳是第一位。',
        password: 'zhao123',
        scheduledAt: '2026-02-10',
        summary: '后端负责人，负责接口与权限',
        avatar: '/uploads/avatars/zhaoyichen.png',
        updatedAt: '2026-03-29 10:40',
      },
    ],
    news: [
      {
        id: 'news-001',
        title: '把首屏交给 Server Components：官网性能优化实录',
        author: '林嘉禾',
        authorAvatar: '/uploads/avatars/linjiahe.png',
        scheduledAt: '2026-04-06',
        summary: '用 Server Components + 流式渲染把首屏 JS 压到接近为零。',
        content: '## 问题背景\n...\n## 优化方案\n...\n## 优化结果\nLighthouse 从 71 提升到 96',
        tags: ['Next.js', '性能'],
        views: 1250,
        status: 'published',
        coverImage: '/uploads/images/blog-cover-performance.png',
        updatedAt: '2026-04-06 20:10',
      },
      {
        id: 'news-002',
        title: '给社团知识库接上检索增强：一次 RAG 落地复盘',
        author: '沈知白',
        authorAvatar: '/uploads/avatars/shenzhibai.png',
        scheduledAt: '2026-04-02',
        summary: '从文档切分、向量化到答案可信度评估。',
        content: '## 难点在数据\n...\n## 检索与作答\n...',
        tags: ['RAG', 'AI'],
        views: 980,
        status: 'published',
        coverImage: '/uploads/images/blog-cover-rag.png',
        updatedAt: '2026-04-02 18:05',
      },
      {
        id: 'news-003',
        title: 'Gin + Gorm 权限中间件的三个设计取舍',
        author: '赵奕辰',
        authorAvatar: '/uploads/avatars/zhaoyichen.png',
        scheduledAt: '2026-03-29',
        summary: 'RBAC、缓存与审计日志上的设计选择。',
        content: '## 默认拒绝\n...\n## 权限模型\n...\n## 审计日志\n...',
        tags: ['Gin', '后端'],
        views: 760,
        status: 'published',
        updatedAt: '2026-03-29 10:40',
      },
    ],
    docs: [
      {
        id: 'doc-001',
        title: '项目概述',
        category: '入门',
        scheduledAt: '2026-04-05',
        summary: '官网建设项目的背景、目标与整体范围。',
        content: '# 项目概述\n## 项目背景\n科协目前尚无独立官网。\n## 项目目标\n品牌建立、全端适配、高性能。',
        sortOrder: 0,
        status: 'published',
        updatedAt: '2026-04-05 11:20',
      },
      {
        id: 'doc-002',
        title: '技术方案',
        category: '入门',
        scheduledAt: '2026-04-03',
        summary: 'React 19 + Next.js 15 的技术选型。',
        content: '# 技术方案\n## 技术选型\n- React 19 + TypeScript\n- Next.js 15\n- Tailwind CSS 4',
        sortOrder: 1,
        status: 'published',
        updatedAt: '2026-04-03 09:40',
      },
      {
        id: 'doc-003',
        title: 'Git 协作规范',
        category: '规范',
        scheduledAt: '2026-03-30',
        summary: '分支策略、提交规范与 PR 流程。',
        content: '# Git 协作规范\n## 分支策略\nTrunk-Based\n## PR 流程\nReview 后 Squash Merge。',
        sortOrder: 2,
        status: 'draft',
        updatedAt: '2026-03-30 16:00',
      },
    ],
    projects: [
      {
        id: 'project-001',
        title: 'SACC 智能知识库',
        scheduledAt: '2026-03-20',
        summary: '为社团资料和活动手册提供可检索、可问答的统一入口。',
        content: '## 项目亮点\n- 文档检索\n- 问答增强\n- 后台上传流程',
        tags: ['AI', '知识库'],
        repoUrl: 'https://github.com/njupt-sacc/smart-knowledge-base',
        coverImage: '/uploads/images/project-knowledge-base.png',
        stars: 126,
        sortOrder: 0,
        status: 'published',
        updatedAt: '2026-03-18 18:20',
      },
      {
        id: 'project-002',
        title: '校园活动报名系统',
        scheduledAt: '2026-03-25',
        summary: '支持报名、签到、海报生成与活动数据看板。',
        content: '## 当前进展\n已完成报名流和签到流。',
        tags: ['前端', '校园服务'],
        repoUrl: 'https://github.com/njupt-sacc/activity-registration',
        stars: 88,
        sortOrder: 1,
        status: 'published',
        updatedAt: '2026-03-17 16:00',
      },
      {
        id: 'project-003',
        title: '招新官网升级',
        scheduledAt: '2026-03-18',
        summary: '以统一视觉语言完成官网内容升级与后台对接。',
        content: '## 交付内容\n- 官网页面改版\n- 文档库与成员动态\n- 后台管理端搭建',
        tags: ['官网', 'React'],
        repoUrl: 'https://github.com/njupt-sacc/sacc-website',
        stars: 154,
        sortOrder: 2,
        status: 'published',
        updatedAt: '2026-03-18 20:20',
      },
    ],
    auditLog: [
      { id: 'log-001', module: 'docs', action: 'update', actor: 'Super Admin', detail: '更新文档「项目概述」', timestamp: '2026-04-05 11:20' },
      { id: 'log-002', module: 'news', action: 'create', actor: '林嘉禾', detail: '发布博客「Server Components 性能优化实录」', timestamp: '2026-04-06 20:10' },
      { id: 'log-003', module: 'projects', action: 'update', actor: '赵奕辰', detail: '调整项目展示排序', timestamp: '2026-03-18 20:20' },
    ],
  })
}

export function cloneDatabase(database) {
  return cloneValue(database)
}
