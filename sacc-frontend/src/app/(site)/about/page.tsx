// 引入Next.js的Metadata类型,用于设置页面标题
import type { Metadata } from "next";
// 引入lucide-react图标库的图标组件
import {
  Compass,
  Flag,
  Layers3,
  Target,
  Award,
  Calendar,
  CheckCircle2,
} from "lucide-react";
// 引入项目中已有的通用组件
import {
  PageHero,
  SectionHeading,
  Card,
  StatsStrip,
  CTAButton,
} from "@/components/sections";
// 引入同目录下的团队成员展示组件
import { MemberSection } from "./MemberSection";

// 设置浏览器标签页标题
export const metadata: Metadata = { title: "关于我们" };

// 使命/愿景/方法三个卡片数据
const missionCards = [
  {
    icon: Flag, // 旗帜图标代表使命
    title: "使命",
    description: "让愿意投入的人找到方向、找到同伴、找到持续输出成果的舞台。",
  },
  {
    icon: Compass, // 指南针图标代表愿景
    title: "愿景",
    description: "建设一个既能沉淀工程能力，也能承载校园影响力的技术社团品牌。",
  },
  {
    icon: Layers3, // 分层图标代表方法
    title: "方法",
    description: "训练营打基础，项目打协作，竞赛打强度，复盘打沉淀。",
  },
];

// 统计数据,显示在横幅下方的数字条
const stats = [
  { value: "500+", label: "累计成员" },
  { value: "50+", label: "年度活动" },
  { value: "20+", label: "合作企业" },
  { value: "100+", label: "获奖项目" },
];

// "我们提供什么"列表数据
const capabilities = [
  "面向新成员的分层训练营与导师答疑机制",
  "真实项目组协作，覆盖设计、开发、测试、运营",
  "围绕竞赛、科研与实习目标的成长路线建议",
  "统一的文档沉淀、作品展示与内容发布体系",
];

// 四个价值观卡片数据
const values = [
  {
    icon: Target,
    title: "专业",
    description: "不把「热爱」停留在口号，强调工程化、交付和复盘。",
  },
  {
    icon: Layers3,
    title: "协作",
    description: "明确负责人、节奏和边界，让每次共创都能闭环。",
  },
  {
    icon: Compass,
    title: "创新",
    description: "鼓励成员从校园真实问题出发做新的产品和方案。",
  },
  {
    icon: Flag,
    title: "成长",
    description: "用体系化路径帮助成员看到阶段性进步，而不是靠运气。",
  },
];

// 发展历程时间线数据
const timeline = [
  {
    year: "2023",
    title: "组织重构",
    description: "梳理了社团岗位分工与负责人机制，建立周会和复盘制度。",
  },
  {
    year: "2024",
    title: "项目制落地",
    description: "官网、活动报名系统和知识库等项目开始以产品形态推进。",
  },
  {
    year: "2025",
    title: "训练营成型",
    description: "围绕前端、后端、AI 和算法形成可复用的课程与作业体系。",
  },
  {
    year: "2026",
    title: "品牌升级",
    description: "启动官网重构、后台管理和部署规范，推动内容与工程一体化。",
  },
];

// "近期荣誉"列表数据
const honors = [
  "全国大学生程序设计竞赛金奖",
  "校级十佳社团品牌项目",
  "校园开放日优秀展示团队",
  "多家企业联合实践合作社团",
];

export default function AboutPage() {
  return (
    <>
      {/* ===== 第1块:页面头部横幅 ===== */}
      <PageHero
        eyebrow="About SACC" // 小标签(橙色徽章)
        title="一个强调长期主义与交付结果的校园技术共同体" // 主标题
        description="我们不把官网当作单次展示页，而是把它看作项目工程、内容运营和社团品牌共同协作的窗口。"
        actions={[
          { label: "浏览文档库", href: "/docs" }, // 主按钮
          { label: "浏览项目案例", href: "/projects", variant: "secondary" }, // 次按钮
        ]}
      />

      {/* ===== 第2块:统计数据条 ===== */}
      <StatsStrip stats={stats} />

      {/* ===== 第3块:使命/愿景/方法卡片 ===== */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          {/* 板块标题 */}
          <SectionHeading
            title="我们的定位"
            description="使命驱动方向，愿景定义目标，方法保障落地。"
          />
          {/* 网格:手机1列 平板2列 桌面3列 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {missionCards.map((item) => {
              const Icon = item.icon; // 取出图标组件
              return (
                <Card key={item.title} hover>
                  {/* 图标容器:橙色半透明背景 */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(255,122,0,0.12)] text-[#ff6a00]">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#1d2638]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5a6780]">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 第4块:团队成员展示 ===== */}
      <MemberSection />

      {/* ===== 第5块:能力&荣誉 ===== */}
      <section className="bg-[#f7f9fc] px-4 py-16">
        <div className="container mx-auto">
          {/* 两列布局 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 左列:能力列表 */}
            <Card>
              <SectionHeading
                title="我们提供什么"
                description="从训练到交付，覆盖成员成长的关键环节。"
              />
              <ul className="space-y-3">
                {capabilities.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    {/* 对勾图标 */}
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-[#ff6a00]"
                    />
                    <span className="text-sm leading-relaxed text-[#2f3645]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* 右列:荣誉列表 */}
            <Card>
              <SectionHeading
                title="近期荣誉"
                description="团队和成员在各方向取得的阶段性成果。"
              />
              <ul className="space-y-3">
                {honors.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    {/* 奖杯图标 */}
                    <Award
                      size={20}
                      className="mt-0.5 shrink-0 text-[#ff6a00]"
                    />
                    <span className="text-sm leading-relaxed text-[#2f3645]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== 第6块:价值观 ===== */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <SectionHeading
            title="我们的价值观"
            description="官网不只展示信息，也应该清楚表达团队的工作方式和文化。"
          />
          {/* 网格:手机1列 平板2列 桌面4列 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} hover>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(255,122,0,0.12)] text-[#ff6a00]">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#1d2638]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5a6780]">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 第7块:发展历程时间线 ===== */}
      <section className="bg-[#f7f9fc] px-4 py-16">
        <div className="container mx-auto">
          <SectionHeading
            title="发展历程"
            description="每一步都对应着社团组织能力的一次升级。"
          />
          {/* 相对定位容器,竖线和圆点绝对定位 */}
          <div className="relative">
            {/* 竖线:手机在左边,桌面居中 */}
            <div className="absolute left-[7px] top-0 h-full w-0.5 bg-[#e7ecf4] sm:left-1/2 sm:-translate-x-1/2" />
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div
                  key={item.year}
                  // 偶数靠左,奇数靠右(桌面端左右交替)
                  className={`relative flex items-start gap-6 pl-8 sm:pl-0 ${
                    index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* 圆点:绝对定位在竖线上 */}
                  <div className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#ff6a00] bg-white sm:left-1/2 sm:-translate-x-1/2">
                    <div className="h-2 w-2 rounded-full bg-[#ff6a00]" />
                  </div>
                  {/* 内容卡片:桌面端占一半宽度 */}
                  <div className="flex-1 sm:max-w-[calc(50%-2rem)]">
                    <Card>
                      {/* 年份+日历图标 */}
                      <div className="mb-1 flex items-center gap-2">
                        <Calendar size={16} className="text-[#ff6a00]" />
                        <span className="text-sm font-bold text-[#ff6a00]">
                          {item.year}
                        </span>
                      </div>
                      <h3 className="mb-1.5 text-base font-bold text-[#1d2638]">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#5a6780]">
                        {item.description}
                      </p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 第8块:行动召唤(底部引导) ===== */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          {/* 渐变背景圆角卡片 */}
          <div className="rounded-[28px] bg-gradient-to-br from-[#fff8ea] via-[#fff4da] to-[#fbfcff] px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold tracking-[-0.01em] text-[#1d2638] sm:text-3xl">
              准备好加入我们了吗？
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[#5a6780]">
              和一群愿意把事情做成的人，一起把热爱变成作品、把成长做成履历。
            </p>
            {/* 两个按钮:主按钮(橙)+次按钮(白) */}
            <div className="mt-6 flex flex-wrap justify-center gap-3.5">
              <CTAButton href="/join" label="加入我们" />
              <CTAButton href="/docs" label="浏览文档库" variant="secondary" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
