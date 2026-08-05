# SACC Frontend

南邮计软院科协官方网站 — 前端工程。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 |
| 组件库 | shadcn/ui (Base UI) |
| 图标 | lucide-react |
| 包管理 | pnpm |

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # 生产构建
pnpm lint       # ESLint 检查
```

## 目录结构

```
sacc-frontend/
├── public/                          # 静态资源
│   ├── images/                      # 图片统一放这里
│   └── sacc-logo.svg               # 科协 Logo
│
├── content/                         # Markdown 内容文件（后续开发）
│   ├── docs/                        # 文档文章（.mdx）
│   ├── news/                        # 成员动态（.mdx）
│   └── projects/                    # 项目数据（JSON）
│
├── src/
│   ├── app/                         # Next.js 路由
│   │   ├── layout.tsx               # 根布局（html + body）
│   │   ├── globals.css              # 全局样式 + 设计令牌
│   │   │
│   │   ├── (site)/                  # 前台路由组
│   │   │   ├── layout.tsx           #   Header + Footer 壳
│   │   │   ├── page.tsx             #   首页 /
│   │   │   ├── about/page.tsx       #   关于我们 /about
│   │   │   ├── docs/page.tsx        #   文档库 /docs
│   │   │   ├── news/page.tsx        #   成员动态 /news
│   │   │   ├── projects/page.tsx    #   项目展示 /projects
│   │   │   ├── activities/page.tsx  #   活动 /activities
│   │   │   ├── join/page.tsx        #   加入我们 /join
│   │   │   ├── gallery/page.tsx     #   相册 /gallery
│   │   │   ├── faq/page.tsx         #   常见问题 /faq
│   │   │   └── not-found.tsx        #   404 页面
│   │   │
│   │   └── (admin)/                 # 后台路由组
│   │       └── admin/
│   │           ├── layout.tsx       #   侧栏 + 顶栏壳
│   │           ├── page.tsx         #   仪表盘 /admin
│   │           ├── login/page.tsx   #   登录页 /admin/login
│   │           ├── docs/page.tsx    #   文档管理 /admin/docs
│   │           ├── news/page.tsx    #   动态管理 /admin/news
│   │           ├── projects/page.tsx #  项目管理 /admin/projects
│   │           └── users/page.tsx   #   用户管理 /admin/users
│   │
│   ├── components/
│   │   ├── layout/                  # 布局组件
│   │   │   ├── Header.tsx           #   前台导航栏
│   │   │   └── Footer.tsx           #   前台底部栏
│   │   │
│   │   ├── sections/                # 页面区块组件（跨页面复用）
│   │   │   ├── PageHero.tsx         #   Hero 区（eyebrow + 标题 + 描述 + 按钮组）
│   │   │   ├── SectionHeading.tsx   #   区块标题 + 描述
│   │   │   ├── Card.tsx             #   通用卡片容器
│   │   │   ├── CTAButton.tsx        #   CTA 按钮（橙色/白色胶囊）
│   │   │   ├── StatsStrip.tsx       #   统计条
│   │   │   └── index.ts             #   barrel export
│   │   │
│   │   └── ui/                      # shadcn UI 组件
│   │       └── button.tsx           #   Button
│   │
│   ├── hooks/                       # 自定义 React Hooks（待开发）
│   └── lib/
│       └── utils.ts                 # cn() = clsx + tailwind-merge
```

## 路由一览

### 前台（Header + Footer 壳）

| 路径 | 页面 | 状态 |
|------|------|------|
| `/` | 首页 | 待开发 |
| `/about` | 关于我们 | 待开发 |
| `/docs` | 文档库 | 待开发 |
| `/news` | 成员动态 | 待开发 |
| `/projects` | 项目展示 | 待开发 |
| `/activities` | 活动 | 待开发 |
| `/join` | 加入我们 | 待开发 |
| `/gallery` | 相册 | 待开发 |
| `/faq` | 常见问题 | 待开发 |

### 后台（侧栏壳）

| 路径 | 页面 | 状态 |
|------|------|------|
| `/admin` | 仪表盘 | 待开发 |
| `/admin/login` | 管理员登录 | 已搭建 UI |
| `/admin/docs` | 文档库管理 | 待开发 |
| `/admin/news` | 成员动态管理 | 待开发 |
| `/admin/projects` | 项目展示管理 | 待开发 |
| `/admin/users` | 用户管理 | 待开发 |

## 组件体系

三层架构：Layout（全站壳） → Sections（页面区块） → UI（原子组件）。

### 前台组件

#### Header
位于 `src/components/layout/Header.tsx`，被 `(site)/layout.tsx` 引用。包含 Logo + 5 项导航 + CTA 按钮。导航激活态有橙色下划线。

#### Footer
位于 `src/components/layout/Footer.tsx`，被 `(site)/layout.tsx` 引用。深色背景，包含 Logo、版权信息。

#### Sections 组件（`@/components/sections`）

所有组件通过 `index.ts` 统一导出，引入方式：
```tsx
import { PageHero, SectionHeading, Card, CTAButton, StatsStrip } from "@/components/sections";
```

**PageHero** — 页面顶部 Hero 区
```tsx
<PageHero
  eyebrow="About"                     // 顶部徽章文字（可选）
  title="关于我们"                    // 标题
  description="描述内容"              // 描述（可选）
  actions={[                          // 按钮组（可选）
    { label: "浏览文档库", href: "/docs" },
    { label: "查看项目", href: "/projects", variant: "secondary" },
  ]}
/>
```

**SectionHeading** — 区块标题
```tsx
<SectionHeading
  title="精选文档"
  description="从这里快速上手项目"
  actions={<Link href="/docs">查看全部</Link>}  // 右侧操作区（可选）
/>
```

**Card** — 通用卡片容器
```tsx
<Card hover as="article">
  <h3>标题</h3>
  <p>内容</p>
</Card>
```
Props: `hover`（悬停上浮）、`as`（标签，默认 `div`）、`className`。

**CTAButton** — CTA 按钮
```tsx
<CTAButton href="/join" label="加入我们" />
<CTAButton href="/about" label="了解更多" variant="secondary" size="sm" />
```

**StatsStrip** — 统计条
```tsx
<StatsStrip stats={[{ value: "500+", label: "社团成员" }, ...]} />
```

### 添加新 shadcn 组件

```bash
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
```

## 设计令牌

定义在 `src/app/globals.css`，Tailwind 类名直接引用：

| 变量 | 色值 | Tailwind 类名 |
|------|------|---------------|
| 主色（橙） | `#ff6a00` | `text-primary` `bg-primary` |
| 副色（深蓝） | `#203158` | `text-secondary` `bg-secondary` |
| 背景 | `#f4f6fb` | `bg-background` |
| 卡片白底 | `#ffffff` | `bg-card` |
| 正文色 | `#1d2638` | `text-foreground` |
| 正文弱色 | `#5a6780` | `text-muted-foreground` |
| 边框色 | `#e7ecf4` | `border-border` |
| 圆角 | `10px` | `rounded-lg` |

直接使用 Tailwind 语义类名，无需硬编码色值。

## 编码约定

- 组件文件：PascalCase（`PageHero.tsx`）
- 路由页面：按 Next.js 文件约定（`page.tsx`、`layout.tsx`）
- 前端样式：Tailwind 类名，优先语义类名（`text-primary`）而非硬编码色值
- 颜色引用：使用设���令牌表中列出的 Tailwind 类名
- 公共样式追加到 `globals.css`，组件内样式写在组件文件中

## 参考资源

- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui 组件](https://ui.shadcn.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [lucide 图标](https://lucide.dev/icons)
