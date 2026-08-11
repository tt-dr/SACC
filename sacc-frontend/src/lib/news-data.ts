export interface NewsSummary {
  id: number;
  module: "news";
  slug: string;
  title: string;
  summary: string;
  category?: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  author: string;
  authorAvatar?: string;
  role?: string;
  coverImage?: string;
  readMinutes?: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPost extends NewsSummary {
  body: string;
}

export interface NewsListResult {
  items: NewsSummary[];
  total: number;
  page: number;
  pageSize: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MOCK_NEWS: NewsPost[] = [
  {
    id: 1,
    module: "news",
    slug: "server-components-notes",
    title: "把首屏交给 Server Components：官网性能优化实录",
    category: "工程实践",
    author: "林嘉豪",
    role: "前端负责人",
    readMinutes: 8,
    tags: ["Next.js", "性能", "React"],
    summary: "记录我们如何用 Server Components + 流式渲染把官网首屏 JS 压到接近为零，Lighthouse 冲到 96。",
    status: "published",
    publishedAt: "2026-04-06T00:00:00Z",
    createdAt: "2026-04-06T20:10:00Z",
    updatedAt: "2026-04-06T20:10:00Z",
    body: [
      "## 问题背景",
      "官网重构最想解决的是首屏体验。旧版把设计稿当成运行时数据源，导致大量 JS 在客户端解析，首屏经常卡在白屏。",
      "## 优化方案",
      "这次我们把内容渲染尽量下沉到 Server Components，只有真正需要交互的部分才作为 Client Component 注水，配合 Suspense 做流式渲染。",
      "### 关键改动",
      "- 首页内容改为静态渲染，减少客户端 JS",
      "- 图片统一走 next/image 与占位图",
      "- 路由改为显示式组件，去掉运行时解析",
      "## 优化结果",
      "实测下来，首屏传输的 JS 体积下降了七成，Lighthouse Performance 从 71 提升到 96，首屏时间稳定在 1.2s 以内。",
    ].join("\n"),
  },
  {
    id: 2,
    module: "news",
    slug: "route-scroll-restoration",
    title: "显示式路由改造：告别运行时解析设计稿",
    category: "工程实践",
    author: "林嘉豪",
    role: "前端负责人",
    readMinutes: 6,
    tags: ["React Router", "重构", "工程化"],
    summary: "把官网从“运行时读取设计稿驱动路由”改成稳定的显示式路由，顺带理清了滚动恢复与页面结构。",
    status: "published",
    publishedAt: "2026-04-04T00:00:00Z",
    createdAt: "2026-04-04T16:20:00Z",
    updatedAt: "2026-04-04T16:20:00Z",
    body: [
      "## 为什么要改",
      "旧方案在运行时解析设计稿来决定路由和跳转，任何文案调整都可能让链接失效，维护起来非常脆弱。",
      "## 改造做法",
      "我们把每个页面都写成显示式的 React 组件与路由，内容来自结构化数据模型，链接不再依赖文本匹配。",
      "## 附带收益",
      "路由清晰之后，滚动恢复、404 兜底和页面级布局都更好处理，新人也更容易看懂项目结构。",
    ].join("\n"),
  },
  {
    id: 3,
    module: "news",
    slug: "rag-knowledge-base",
    title: "给社团知识库接上检索增强：一次 RAG 落地复盘",
    category: "AI 应用",
    author: "沈知白",
    role: "AI 方向负责人",
    readMinutes: 10,
    tags: ["RAG", "Agent", "向量检索"],
    summary: "从文档切分、向量化到答案可信度评估，聊聊智能知识库项目里踩过的坑和最终方案。",
    status: "published",
    publishedAt: "2026-04-02T00:00:00Z",
    createdAt: "2026-04-02T18:05:00Z",
    updatedAt: "2026-04-02T18:05:00Z",
    body: [
      "## 难点在数据",
      "知识库最大的难点不是模型，而是数据。社团历史资料结构不统一，直接喂给模型只会得到一本正经的胡说八道。",
      "## 检索与作答",
      "我们先做了统一的文档分块策略，再用向量检索召回候选段落，最后让模型基于召回内容作答，并强制附带来源。",
      "### 控制幻觉",
      "为了控制“幻觉”，我们加了一层答案可信度评估：召回相似度过低时直接回复“暂无相关资料”，而不是硬编。",
      "## 下一步",
      "会把录入与审核流程搬进后台，让内容维护也能多人协作。",
    ].join("\n"),
  },
  {
    id: 4,
    module: "news",
    slug: "gin-gorm-permission",
    title: "Gin + Gorm 权限中间件的三个设计取舍",
    category: "后端",
    author: "赵奕辰",
    role: "后端负责人",
    readMinutes: 7,
    tags: ["Gin", "Gorm", "鉴权"],
    summary: "后台鉴权链路怎么设计才能既安全又好维护？分享我们在 RBAC、缓存和审计日志上的选择。",
    status: "published",
    publishedAt: "2026-03-29T00:00:00Z",
    createdAt: "2026-03-29T10:40:00Z",
    updatedAt: "2026-03-29T10:40:00Z",
    body: [
      "## 默认拒绝",
      "后台接口的第一原则是默认拒绝。我们用中间件统一拦截，未通过鉴权的请求根本进不到业务层。",
      "## 权限模型",
      "权限模型选了轻量 RBAC，角色到权限的映射放 Redis 缓存，变更时主动失效，避免每次都查库。",
      "## 审计日志",
      "所有写操作都会落一条审计日志，谁在什么时间改了什么都一目了然，这在多人协作时特别重要。",
    ].join("\n"),
  },
  {
    id: 5,
    module: "news",
    slug: "design-token-system",
    title: "从零搭一套 Design Token：让协作不再靠猜",
    category: "设计协作",
    author: "苏曼宁",
    role: "品牌视觉",
    readMinutes: 6,
    tags: ["Design Token", "Tailwind", "组件"],
    summary: "色板、间距、圆角、阴影统一成变量后，前端还原设计稿的效率明显变高了。",
    status: "published",
    publishedAt: "2026-03-24T00:00:00Z",
    createdAt: "2026-03-24T14:30:00Z",
    updatedAt: "2026-03-24T14:30:00Z",
    body: [
      "## 问题",
      "以前设计和开发对不齐颜色是常态，一个橙色能有好几个色值。这次我们把设计决策沉淀成 Design Token。",
      "## 落地方式",
      "所有 token 以 CSS 变量形式落地，Tailwind 直接引用，改一处全站生效，暗色模式也顺带解决了。",
      "## 结论",
      "设计规范不是给设计师看的 PDF，而是能被代码直接消费的变量表。",
    ].join("\n"),
  },
  {
    id: 6,
    module: "news",
    slug: "trunk-based-practice",
    title: "小团队也能用好 Trunk-Based 开发",
    category: "协作复盘",
    author: "周奕辰",
    role: "主席",
    readMinutes: 5,
    tags: ["Git", "协作", "流程"],
    summary: "分支策略、提交规范与 PR 流程的团队约定，聊聊我们怎么把主干开发跑起来。",
    status: "published",
    publishedAt: "2026-03-20T00:00:00Z",
    createdAt: "2026-03-20T09:00:00Z",
    updatedAt: "2026-03-20T09:00:00Z",
    body: [
      "## 为什么选主干",
      "小团队不需要复杂的 Git Flow，主干开发 + 短分支 + 频繁合入，能显著降低合并冲突成本。",
      "## 团队约定",
      "- 每次改动尽量小，一个 PR 只做一件事",
      "- 提交信息用约定式格式，方便生成变更日志",
      "- 合入前必须通过 lint 与测试",
      "## 踩过的坑",
      "一开始大家都习惯长时间不合并，结果合并成本越来越高。改成每天至少合入一次后，节奏明显好了很多。",
    ].join("\n"),
  },
];

function sortByPublishedAtDesc(items: NewsSummary[]): NewsSummary[] {
  return [...items].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchNewsList(
  options: { page?: number; pageSize?: number; keyword?: string; author?: string } = {},
): Promise<NewsListResult> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;

  if (API_BASE) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      module: "news",
    });
    if (options.keyword) params.set("keyword", options.keyword);
    if (options.author) params.set("author", options.author);
    const payload = await requestJson<{
      data: NewsSummary[];
      pagination: { page: number; pageSize: number; total: number };
    }>(`/api/v1/content?${params.toString()}`);
    return {
      items: payload.data,
      total: payload.pagination.total,
      page: payload.pagination.page,
      pageSize: payload.pagination.pageSize,
    };
  }

  const keyword = options.keyword?.trim().toLowerCase() ?? "";
  const filtered = MOCK_NEWS.filter((item) => {
    if (options.author && item.author !== options.author) return false;
    if (!keyword) return true;
    return [item.title, item.summary, item.author, item.category, ...item.tags]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const sorted = sortByPublishedAtDesc(filtered);
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}

export async function fetchAllNews(): Promise<NewsSummary[]> {
  const result = await fetchNewsList({ pageSize: 100 });
  return sortByPublishedAtDesc(result.items);
}

export async function fetchNewsDetail(slug: string): Promise<NewsPost | null> {
  if (API_BASE) {
    const list = await fetchNewsList({ pageSize: 100 });
    const match = list.items.find((item) => item.slug === slug);
    if (!match) return null;
    const payload = await requestJson<{ data: NewsPost }>(`/api/v1/content/${match.id}`);
    return payload.data;
  }
  return MOCK_NEWS.find((item) => item.slug === slug) ?? null;
}
