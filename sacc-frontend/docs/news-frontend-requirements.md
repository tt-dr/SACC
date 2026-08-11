# 成员动态（News）前端需求文档

> 适用项目：SACC sacc-frontend（Next.js 16 + Tailwind 4）
> 状态：待开发 | 负责：wen

## 一、范围与路由

前台两个页面，后台 `/admin/news` 不在本次范围内：

| 路由 | 页面 | 说明 |
|------|------|------|
| `/news` | 动态列表页 | 博客卡片列表，支持搜索、作者筛选 |
| `/news/[slug]` | 动态详情页 | 按 `slug` 展示单篇，含作者侧栏、正文、TOC |

对应文件：`src/app/(site)/news/page.tsx`、`src/app/(site)/news/[slug]/page.tsx`，复用 `(site)/layout.tsx`（Header + Footer）。

## 二、数据来源与接口

优先对接公开接口，接口不可用时回退本地数据：

1. `GET /api/v1/content?module=news&page=1&pageSize=10&keyword=xxx` —— 列表（不含 `body`，只返回 `published`，支持分页）
2. `GET /api/v1/content/:id` —— 详情（含 `body`，Markdown）
3. `GET /api/v1/public/bootstrap` —— 站点配置，失败时用本地兜底

字段约定（`ContentItemSummary`）：`id / module / slug / title / summary / category / tags / status / author / authorAvatar / publishedAt / createdAt / updatedAt`；详情额外有 `body`。列表接口没有 `coverImage / role / readMinutes / date`，前端用 `publishedAt` 转展示日期。

建议 `src/lib/news-data.ts` 放本地 mock（字段与接口一致），实现 `fetchNewsList / fetchNewsDetail`，内部先走接口、失败走 mock，后续替换只改这一层。

## 三、列表页需求

### 功能

- 默认按 `publishedAt` 倒序（新内容在前）。
- 搜索框：匹配标题、摘要、作者、标签；输入用 `useDeferredValue`。
- 作者筛选：从数据提取不重复作者，渲染 chip；默认选中“全部作者”。
- 结果数提示：`共 N 篇 · 默认按发布时间倒序`。
- 空状态：`没有匹配的动态，试试更换作者或关键词。`
- 分页：使用接口 `pagination`（每页 9 或 12 条），翻页回到顶部。

### 视觉规范（参照旧版 site.css，改用 Tailwind 语义类）

- 顶部用现有 `PageHero`：eyebrow `Member Blog`、标题 `成员动态`、描述“成员发布的技术博客与成长记录，按发布时间排序，支持按作者筛选与关键词搜索。”
- 工具栏：搜索框左、作者 chips 右，`flex-wrap`，间距 16px。
  - 搜索框：圆角全圆（999px）、`min-width: 240px`、`max-width: 360px`、边框 `#e7ecf4`、白底，内嵌 Search 图标。
  - chip：圆角全圆、13px、边框 `#e7ecf4`；hover 边框/文字转橙 `#ff6a00`；选中态橙渐变底（`#ff8a00 → #ff6a00`）白字。
- 卡片网格：`grid`，`repeat(auto-fill, minmax(320px, 1fr))`，gap 20px。
- 卡片：复用 `Card`（圆角 20px、白底、边框 `#e7ecf4`、阴影、hover 上浮 4px），整卡 `<Link>` 跳 `/news/[slug]`。
- 卡片内容自上而下：
  1. 作者行：40px 圆形头像（橙渐变 `#ff9d2a → #ff6a00`，首字白字 700）+ 姓名（15px）+ 角色（12px，`#5a6780`）；右上角可选分类 pill（深蓝 8% 底、`#203158` 字）。
  2. 标题：19px、行高 1.4、加粗。
  3. 摘要：14.5px、`#5a6780`、行高 1.7、最多 3 行（`-webkit-line-clamp: 3`）。
  4. 标签行：`#tag`，12px，橙字，`rgba(255,122,0,0.1)` 底，全圆。
  5. 底部：上边框 `#e7ecf4`；左侧日期（CalendarDays 图标 + 格式化日期，13px 灰），右侧“阅读 →”。
- 骨架屏：列表加载时用灰色圆角块模拟卡片。

## 四、详情页需求

### 功能

- 按 `slug` 取详情；找不到或未发布时跳回 `/news`（或显示 404）。
- Hero：eyebrow `成员动态`、标题为文章标题、meta 行显示头像 + 作者 + 角色 + 日期。
- 三栏布局：
  - 左侧 240px sticky 侧栏：返回链接 `← 返回成员动态`；标题“作者的文章”，列出该作者全部文章（时间倒序），当前篇高亮（橙 12% 底、橙字）。
  - 中间正文卡片：标签行 → Markdown 正文。
  - 右侧 220px sticky 目录：从正文 `h2/h3` 提取 TOC；无小节时显示“本文暂无小节”。
- 正文样式：h1 30px / h2 22px / h3 18px；段落行高 1.85、颜色 `#333c4f`；行内代码 `#f0f2f7` 底、`#c2410c` 字、圆角 6px；标题设 `scroll-margin-top: 92px`。
- Markdown 渲染方案待定（可加 `react-markdown` 或 `next-mdx-remote`）；TOC 工具放 `src/lib/markdown.ts`。

## 五、风格令牌（来自 globals.css，必须遵守）

| Token | 值 | 用途 |
|------|------|------|
| `background` | `#f4f6fb` | 页面背景 |
| `foreground` | `#1d2638` | 正文 |
| `card` | `#ffffff` | 卡片底 |
| `primary` | `#ff6a00` | 主色橙 |
| `secondary` | `#203158` | 深蓝 |
| `muted-foreground` | `#5a6780` | 次要文字 |
| `border` | `#e7ecf4` | 边框 |
| `radius` | `0.625rem` | 基础圆角（卡片用更大圆角） |
| 容器 | `max-width: 1240px` | 居中布局 |

- 使用语义类（`text-primary`、`bg-card`、`text-muted-foreground` 等），不硬编码色值；暗色模式用现有 `.dark` 变量（`--primary: #ff8a00` 等），两页均需暗色可用。
- 字体沿用站点默认 sans。

## 六、组件规划

新增：

```
src/components/news/
  NewsCard.tsx            # 单张博客卡片（复用 Card）
  NewsToolbar.tsx         # 搜索框 + 作者筛选 chips
  AuthorAvatar.tsx        # 圆形作者头像（fallback 首字）
  NewsDetailSidebar.tsx   # 作者文章列表
  NewsToc.tsx             # 右侧目录
```

现有可复用：`PageHero`、`Card`、`SectionHeading`、`Button`。

## 七、验收标准

1. `/news` 默认倒序展示；搜索命中正确；作者筛选正确；无结果有空状态。
2. 点卡片跳 `/news/[slug]`，三栏布局正确，TOC 可定位，作者侧栏当前篇高亮。
3. 接口失败时本地 mock 正常渲染，控制台无未捕获报错。
4. 暗色模式无对比度问题。
5. 移动端（≤768px）三栏收成一栏，卡片网格单列。
6. 键盘可操作：搜索框有 aria-label，chip 为 `<button>`，卡片为 `<a>`，focus 可见。
7. `npm run build` 通过，无 TypeScript 报错。

## 八、当前实现说明与后续切换点

### 当前已按“先跑起来”实现

- 数据层：`src/lib/news-data.ts` 统一封装 `fetchNewsList / fetchAllNews / fetchNewsDetail`；未配置接口地址时使用文件内的 6 篇 mock 数据。
- 搜索、作者筛选、排序、分页目前都在客户端完成：`NewsList.tsx` 一次性拉取（pageSize=100），用 `useDeferredValue` 防抖搜索，内存过滤后每页 9 条分页。
- Markdown 渲染：详情页用 `react-markdown` + `remark-gfm`；TOC 提取与标题锚点在 `src/lib/markdown.ts`。

### 后续切换服务端分页 / 搜索（只改一层）

1. 配置环境变量 `NEXT_PUBLIC_API_BASE_URL`（如 `http://localhost:8080`）后，`news-data.ts` 自动改为请求真实接口：
   - 列表：`GET /api/v1/content?module=news&page=1&pageSize=9&keyword=xxx`
   - 详情：`GET /api/v1/content/:id`
2. 若后端要求搜索、筛选、分页全部服务端化：
   - 只改 `NewsList.tsx`：把 `keyword / activeAuthor / page` 变成请求参数，每次变化调用 `fetchNewsList({ page, pageSize, keyword, author })`；
   - `fetchNewsList` 已预留 `page / pageSize / keyword / author` 参数，数据结构不用动。
3. 注意：后端公开接口目前只支持 `keyword`（匹配 title / summary / author / tags），不支持独立的 `author` 参数；如需服务端按作者筛选，要与后端确认是否新增参数，或在前端对返回结果二次过滤。

### 其他切换点

- 每页条数：`NewsList.tsx` 顶部的 `PAGE_SIZE = 9`。
- 一次性拉取上限：`news-data.ts` 中 `fetchAllNews` 使用 `pageSize: 100`（后端上限 100）。
- 暗色模式：页面使用语义类（`bg-card`、`text-foreground`、`text-muted-foreground`、`text-primary` 等），跟随 `globals.css` 的 `.dark` 变量，无需单独适配。
- 管理后台 `/admin/news`：不在本次范围，相关接口见 api-doc.json 的 `/api/v1/admin/content`。
