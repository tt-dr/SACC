/**
 * BootstrapData 类型定义 + 本地兜底数据
 *
 * 结构与后端 GET /api/v1/public/bootstrap 返回的 data 字段完全一致。
 * 前端请求失败时自动回退到本文件数据渲染。
 */

export interface StatItem {
  value: string;
  label: string;
}

export interface HeroAction {
  label: string;
  to: string;
  tone?: "primary" | "secondary";
}

export interface Highlight {
  title: string;
  description: string;
  link: string;
}

export interface ResourceItem {
  value: string;
  label: string;
  description: string;
}

export interface ActionLink {
  label: string;
  to: string;
}

export interface CtaSection {
  title: string;
  description: string;
  primaryAction: ActionLink;
  secondaryAction: ActionLink;
}

export interface SiteMeta {
  name: string;
  fullName: string;
  tagline: string;
  logoUrl: string;
  domain: string;
  publicIp: string;
  email: string;
  footerStats: StatItem[];
  socialLinks: { label: string; href: string }[];
  cta: CtaSection;
}

export interface HomePageData {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroActions: HeroAction[];
  stats: StatItem[];
  highlights: Highlight[];
  testimonials: string[];
  partners: string[];
  resources: ResourceItem[];
}

export interface DocItem {
  slug: string;
  title: string;
  category: string;
  order: number;
  updatedAt: string;
  description: string;
  content: string | null;
}

export interface NewsItem {
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  author: string;
  authorAvatar: string;
  role: string;
  date: string;
  readMinutes: number;
  tags: string[];
  summary: string;
  content: string | null;
}

export interface BootstrapData {
  site: SiteMeta;
  navigation: { label: string; to: string }[];
  home: HomePageData;
  docs: DocItem[];
  news: NewsItem[];
}

export const fallbackSiteContent: BootstrapData = {
  site: {
    name: "SACC",
    fullName: "Science Association of Computer College",
    tagline: "探索科学之美 · 创造技术未来 · 成就卓越人生",
    logoUrl: "/sacc-logo.svg",
    domain: "sacc.njupt.edu.cn",
    publicIp: "123.56.221.147",
    email: "hello@njupt.edu.cn",
    footerStats: [
      { value: "500+", label: "累计成员" },
      { value: "50+", label: "年度活动" },
      { value: "20+", label: "合作企业" },
      { value: "100+", label: "获奖项目" },
    ],
    socialLinks: [
      { label: "GitHub", href: "https://github.com/" },
      { label: "邮箱", href: "mailto:hello@njupt.edu.cn" },
      { label: "QQ 招新群", href: "/join" },
    ],
    cta: {
      title: "准备好加入我们了吗？",
      description: "和一群愿意把事情做成的人，一起把热爱变成作品、把成长做成履历。",
      primaryAction: { label: "加入我们", to: "/join" },
      secondaryAction: { label: "浏览文档库", to: "/docs" },
    },
  },
  navigation: [
    { label: "主页", to: "/" },
    { label: "关于我们", to: "/about" },
    { label: "文档库", to: "/docs" },
    { label: "成员动态", to: "/news" },
    { label: "项目", to: "/projects" },
  ],
  home: {
    eyebrow: "2026 SACC Official Site",
    title: "把热爱做成作品，把成长做成履历",
    subtitle:
      "SACC 不是“只看活动海报”的社团，而是一个围绕训练营、项目、竞赛和内容共创持续运转的技术共同体。",
    heroActions: [
      { label: "了解更多", to: "/about", tone: "primary" },
      { label: "加入我们", to: "/join", tone: "secondary" },
    ],
    stats: [
      { value: "500+", label: "社团成员" },
      { value: "50+", label: "年度活动" },
      { value: "20+", label: "合作企业" },
      { value: "100+", label: "获奖项目" },
    ],
    highlights: [
      {
        title: "技术训练营",
        description: "用完整学习路径覆盖前端、后端、AI、算法和设计协作，让新成员快速进入真实项目节奏。",
        link: "/activities",
      },
      {
        title: "创新项目孵化",
        description: "围绕校园服务、AI 应用和内容平台推进项目，让灵感最终变成可演示、可复盘的作品。",
        link: "/projects",
      },
      {
        title: "团队协同文化",
        description: "强调负责人机制、文档沉淀、版本管理和复盘，让协作能力和技术能力同步成长。",
        link: "/about",
      },
      {
        title: "竞赛与荣誉",
        description: "通过专题集训、赛后复盘和经验传承，帮助成员在竞赛与科研中跑得更稳更远。",
        link: "/about",
      },
    ],
    testimonials: [
      "在 SACC 的两年让我真正完成了从“会写代码”到“能做项目”的转变。",
      "竞赛集训和项目制协作给了我巨大的成长推动力，也让我更明确未来方向。",
      "最宝贵的是这里的同伴关系，大家真的会一起把事情做成。",
    ],
    partners: ["腾讯", "阿里巴巴", "字节跳动", "华为", "百度", "美团", "网易", "京东"],
    resources: [
      { value: "200+", label: "学习资料", description: "涵盖编程基础、工程化与竞赛专题。" },
      { value: "50+", label: "视频教程", description: "面向实战的系统化讲解与录播内容。" },
      { value: "150+", label: "技术文章", description: "从基础到前沿技术的知识沉淀。" },
      { value: "100+", label: "代码示例", description: "可直接复用的 demo、模板与练习项目。" },
    ],
  },
  docs: [
    {
      slug: "project-overview",
      title: "项目概述",
      category: "入门",
      order: 1,
      updatedAt: "2026-04-05",
      description: "了解官网建设项目的背景、目标与整体范围。",
      content: null,
    },
    {
      slug: "tech-stack",
      title: "技术方案",
      category: "入门",
      order: 2,
      updatedAt: "2026-04-05",
      description: "React 19 + Next.js 15 的技术选型与项目结构约定。",
      content: null,
    },
    {
      slug: "git-workflow",
      title: "Git 协作规范",
      category: "规范",
      order: 3,
      updatedAt: "2026-04-05",
      description: "分支策略、提交规范与 PR 流程的团队约定。",
      content: null,
    },
  ],
  news: [
    {
      slug: "server-components-notes",
      title: "把首屏交给 Server Components：官网性能优化实录",
      category: "工程实践",
      coverImage: "/images/blog-cover-performance.png",
      author: "林嘉禾",
      authorAvatar: "/uploads/avatars/linjiahe.png",
      role: "前端负责人",
      date: "2026-04-06",
      readMinutes: 8,
      tags: ["Next.js", "性能", "React"],
      summary: "记录我们如何用 Server Components 把首屏 JS 压到接近为零。",
      content: null,
    },
    {
      slug: "rag-recap",
      title: "给社团知识库接上检索增强：一次 RAG 落地复盘",
      category: "AI 应用",
      coverImage: "/images/blog-cover-rag.png",
      author: "沈知白",
      authorAvatar: "/uploads/avatars/shenzhibai.png",
      role: "AI 负责人",
      date: "2026-04-02",
      readMinutes: 12,
      tags: ["RAG", "AI", "知识库"],
      summary: "从检索、重排到生成，一次完整的检索增强落地复盘。",
      content: null,
    },
    {
      slug: "gin-permission-middleware",
      title: "Gin + Gorm 权限中间件的三个设计取舍",
      category: "后端",
      coverImage: "/images/blog-cover-gin.png",
      author: "赵奕辰",
      authorAvatar: "/uploads/avatars/zhaoyichen.png",
      role: "后端负责人",
      date: "2026-03-29",
      readMinutes: 6,
      tags: ["Gin", "Gorm", "权限"],
      summary: "RBAC、中间件设计与性能权衡的三点实践总结。",
      content: null,
    },
  ],
};