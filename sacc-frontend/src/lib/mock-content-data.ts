import type { ContentInput, ContentItem, ContentModule } from "./content-types";

/**
 * 本地演示数据（mock 兜底）
 *
 * 后端接口不可用或未实现时，页面使用内存中的这份数据完成全部交互。
 * 数据只在当前页面会话内有效，刷新后恢复初始种子数据。
 * 待后端接口就绪后，页面会自动切换到真实 API，本文件不再生效。
 */

let nextMockId = -1000;

function mockId(): number {
  nextMockId -= 1;
  return nextMockId;
}

function iso(day: string, time = "10:00:00"): string {
  return `${day}T${time}Z`;
}

function seedItems(): ContentItem[] {
  return [
    {
      id: mockId(),
      module: "docs",
      slug: "project-overview",
      title: "项目概览",
      category: "入门",
      summary: "官网建设项目的历史背景、目标与整体范围。",
      body: [
        "# 项目概览",
        "",
        "## 项目背景",
        "科协目前缺少独立的官网，本次从零搭建 SACC 官网。",
        "",
        "## 项目目标",
        "- 建立品牌形象",
        "- 全栈人才培养",
        "- 高性能官网",
        "",
        "## 技术选型",
        "React + Next.js + Tailwind CSS，后端 Go + Gin + GORM。",
      ].join("\n"),
      tags: [],
      techStack: [],
      status: "published",
      sortOrder: 0,
      publishedAt: iso("2026-04-05"),
      createdAt: iso("2026-04-05", "09:00:00"),
      updatedAt: iso("2026-04-05", "11:20:00"),
    },
    {
      id: mockId(),
      module: "docs",
      slug: "git-collaboration-guide",
      title: "Git 协作规范",
      category: "规范",
      summary: "分支策略、提交规范与 PR 流程的团队约定。",
      body: [
        "# Git 协作规范",
        "",
        "## 分支策略",
        "采用 Trunk-Based：主干开发 + 短分支 + 频繁合入。",
        "",
        "## 提交规范",
        "- 使用约定式提交：`feat:` / `fix:` / `docs:`",
        "- 一次提交只做一件事",
        "",
        "## PR 流程",
        "Review 通过后 Squash Merge。",
      ].join("\n"),
      tags: [],
      techStack: [],
      status: "draft",
      sortOrder: 1,
      publishedAt: iso("2026-03-30"),
      createdAt: iso("2026-03-30", "08:00:00"),
      updatedAt: iso("2026-03-30", "16:00:00"),
    },
    {
      id: mockId(),
      module: "docs",
      slug: "component-library-notes",
      title: "组件库使用说明",
      category: "组件",
      summary: "后台与官网共用组件的用法与约定。",
      body: [
        "# 组件库使用说明",
        "",
        "## 通用组件",
        "- Button：统一使用 `src/components/ui/button.tsx`",
        "- Markdown 预览：`react-markdown` + `remark-gfm`",
        "",
        "## 样式约定",
        "颜色统一使用 `globals.css` 中的 Design Token。",
      ].join("\n"),
      tags: [],
      techStack: [],
      status: "published",
      sortOrder: 2,
      publishedAt: iso("2026-03-28"),
      createdAt: iso("2026-03-28", "10:00:00"),
      updatedAt: iso("2026-03-28", "14:30:00"),
    },
    {
      id: mockId(),
      module: "news",
      slug: "server-components-performance",
      title: "把首屏交给 Server Components：官网性能优化实录",
      category: "工程实践",
      summary: "用 Server Components + 流式渲染把官网首屏 JS 压到接近为零。",
      body: [
        "## 问题背景",
        "旧版官网首屏经常白屏，大量 JS 在客户端解析设计稿。",
        "",
        "## 优化方案",
        "内容渲染下沉到 Server Components，交互部分才注水，配合 Suspense 流式渲染。",
        "",
        "## 优化结果",
        "Lighthouse Performance 从 71 提升到 96，首屏稳定在 1.2s 以内。",
      ].join("\n"),
      tags: ["Next.js", "性能", "React"],
      techStack: [],
      sortOrder: 0,
      status: "published",
      author: "林嘉豪",
      role: "前端负责人",
      publishedAt: iso("2026-04-06"),
      createdAt: iso("2026-04-06", "09:00:00"),
      updatedAt: iso("2026-04-06", "20:10:00"),
    },
    {
      id: mockId(),
      module: "news",
      slug: "rag-knowledge-base-review",
      title: "给社团知识库接上检索增强：一次 RAG 落地复盘",
      category: "AI 应用",
      summary: "从文档切分、向量化到答案可信度评估，聊聊踩过的坑。",
      body: [
        "## 难点在数据",
        "知识库最大的难点不是模型，而是历史资料结构不统一。",
        "",
        "## 检索与作答",
        "统一文档分块策略，向量检索召回候选段落，强制附带来源。",
        "",
        "## 下一步",
        "把录入与审核流程搬进后台，让内容维护也能多人协作。",
      ].join("\n"),
      tags: ["RAG", "AI"],
      techStack: [],
      sortOrder: 0,
      status: "published",
      author: "沈知白",
      role: "AI 方向负责人",
      publishedAt: iso("2026-04-02"),
      createdAt: iso("2026-04-02", "09:00:00"),
      updatedAt: iso("2026-04-02", "18:05:00"),
    },
    {
      id: mockId(),
      module: "news",
      slug: "trunk-based-practice",
      title: "小团队也能用好 Trunk-Based 开发",
      category: "协作复盘",
      summary: "分支策略、提交规范与 PR 流程的团队约定。",
      body: [
        "## 为什么选主干",
        "小团队不需要复杂的 Git Flow，主干开发 + 短分支 + 频繁合入。",
        "",
        "## 团队约定",
        "- 一个 PR 只做一件事",
        "- 提交信息用约定式格式",
        "- 合入前必须通过 lint 与测试",
      ].join("\n"),
      tags: ["Git", "协作"],
      techStack: [],
      sortOrder: 0,
      status: "draft",
      author: "周奕辰",
      role: "主席",
      publishedAt: iso("2026-03-20"),
      createdAt: iso("2026-03-20", "09:00:00"),
      updatedAt: iso("2026-03-20", "15:00:00"),
    },
    {
      id: mockId(),
      module: "projects",
      slug: "smart-knowledge-base",
      title: "SACC 智能知识库",
      summary: "为社团资料和活动手册提供可检索、可问答的统一入口。",
      body: [
        "## 项目亮点",
        "- 文档检索",
        "- 问答增强",
        "- 后台上传流程",
      ].join("\n"),
      tags: ["AI", "知识库"],
      techStack: [],
      status: "published",
      repoUrl: "https://github.com/njupt-sacc/smart-knowledge-base",
      progress: "60%",
      sortOrder: 0,
      publishedAt: iso("2026-03-20"),
      createdAt: iso("2026-03-18", "09:00:00"),
      updatedAt: iso("2026-03-18", "18:20:00"),
    },
    {
      id: mockId(),
      module: "projects",
      slug: "activity-registration",
      title: "校园活动报名系统",
      summary: "支持报名、签到、海报生成与活动数据看板。",
      body: [
        "## 当前进展",
        "已完成报名流程与签到流程，正在接入数据看板。",
      ].join("\n"),
      tags: ["前端", "校园服务"],
      techStack: [],
      status: "published",
      repoUrl: "https://github.com/njupt-sacc/activity-registration",
      progress: "80%",
      sortOrder: 1,
      publishedAt: iso("2026-03-25"),
      createdAt: iso("2026-03-15", "09:00:00"),
      updatedAt: iso("2026-03-17", "16:00:00"),
    },
    {
      id: mockId(),
      module: "projects",
      slug: "recruitment-site-upgrade",
      title: "招新官网升级",
      summary: "以统一视觉语言完成官网内容升级与后台对接。",
      body: [
        "## 交付内容",
        "- 官网页面改版",
        "- 文档库与成员动态",
        "- 后台管理端搭建",
      ].join("\n"),
      tags: ["官网", "React"],
      techStack: [],
      status: "archived",
      repoUrl: "https://github.com/njupt-sacc/sacc-website",
      progress: "100%",
      sortOrder: 2,
      publishedAt: iso("2026-03-18"),
      createdAt: iso("2026-03-10", "09:00:00"),
      updatedAt: iso("2026-03-18", "20:20:00"),
    },
  ];
}

let store: ContentItem[] = seedItems();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sortItems(module: ContentModule, items: ContentItem[]): ContentItem[] {
  const sorted = [...items];
  if (module === "news") {
    sorted.sort(
      (left, right) =>
        (right.publishedAt ?? right.createdAt).localeCompare(left.publishedAt ?? left.createdAt) ||
        right.id - left.id,
    );
  } else {
    sorted.sort((left, right) => left.sortOrder - right.sortOrder || right.updatedAt.localeCompare(left.updatedAt));
  }
  return sorted;
}

export function mockList(module: ContentModule): ContentItem[] {
  return sortItems(module, store.filter((item) => item.module === module));
}

export function mockGet(id: number): ContentItem | null {
  const item = store.find((entry) => entry.id === id);
  return item ? clone(item) : null;
}

function normalizeTags(tags: string[] | undefined): string[] {
  return (tags ?? []).map((tag) => tag.trim()).filter(Boolean);
}

export function mockCreate(input: ContentInput): ContentItem {
  const now = new Date().toISOString();
  const sameModule = store.filter((item) => item.module === input.module);
  const item: ContentItem = {
    id: mockId(),
    module: input.module,
    slug: input.slug || input.title.toLowerCase().replace(/\s+/g, "-") || "untitled",
    title: input.title,
    category: input.category || "",
    summary: input.summary || "",
    body: input.body || "",
    tags: normalizeTags(input.tags),
    status: input.status ?? "draft",
    author: input.author || "",
    role: input.role || "",
    coverImage: input.coverImage || "",
    repoUrl: input.repoUrl || "",
    progress: input.progress || "",
    techStack: normalizeTags(input.techStack),
    sortOrder: sameModule.length,
    publishedAt: input.publishedAt || undefined,
    createdAt: now,
    updatedAt: now,
  };
  store = [...store, item];
  return clone(item);
}

export function mockUpdate(id: number, input: ContentInput): ContentItem {
  const existing = store.find((item) => item.id === id);
  if (!existing) {
    throw new Error("内容不存在或已被删除");
  }
  const updated: ContentItem = {
    ...existing,
    title: input.title,
    slug: input.slug || existing.slug,
    category: input.category ?? existing.category,
    summary: input.summary ?? existing.summary,
    body: input.body ?? existing.body,
    tags: normalizeTags(input.tags ?? existing.tags),
    status: input.status ?? existing.status,
    author: input.author ?? existing.author,
    role: input.role ?? existing.role,
    coverImage: input.coverImage ?? existing.coverImage,
    repoUrl: input.repoUrl ?? existing.repoUrl,
    progress: input.progress ?? existing.progress,
    techStack: normalizeTags(input.techStack ?? existing.techStack),
    publishedAt: input.publishedAt ?? existing.publishedAt,
    updatedAt: new Date().toISOString(),
  };
  store = store.map((item) => (item.id === id ? updated : item));
  return clone(updated);
}

export function mockDelete(id: number): void {
  store = store.filter((item) => item.id !== id);
}

export function mockReorder(module: ContentModule, orderedIds: number[]): void {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  store = store.map((item) => {
    if (item.module !== module) return item;
    const nextOrder = orderMap.get(item.id);
    return nextOrder === undefined ? item : { ...item, sortOrder: nextOrder, updatedAt: new Date().toISOString() };
  });
}
