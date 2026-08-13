import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Card } from "@/components/sections/Card";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { CTAButton } from "@/components/sections/CTAButton";
import { StatsStrip } from "@/components/sections/StatsStrip";

export const metadata: Metadata = { title: "加入我们" };

// 部门介绍数据
const departments = [
  {
    title: "前端组",
    description: "使用 Next.js + TailwindCSS 开发官网页面，掌握组件化开发、响应式布局与设计令牌体系。",
    points: ["Next.js App Router", "组件化开发", "响应式设计"],
  },
  {
    title: "后端组",
    description: "基于 Node.js 与数据库搭建服务端接口，理解数据建模与 API 设计实践。",
    points: ["Node.js / Express", "数据库设计", "RESTful API"],
  },
  {
    title: "设计组",
    description: "负责视觉规范与界面原型，输出设计令牌与组件样板，协同前端落地实现。",
    points: ["视觉规范", "原型设计", "设计令牌"],
  },
];

// 技能亮点数据
const skills = [
  { value: "10+", label: "实战项目" },
  { value: "6", label: "技术栈覆盖" },
  { value: "30+", label: "成员作品" },
  { value: "100%", label: "协作经验" },
];

export default function JoinUsPage() {
  return (
    <div>
      {/* 顶部横幅 */}
      <PageHero
        eyebrow="2026 招新进行中"
        title="加入科协SACC"
        description="参与真实官网项目开发，积累前端实战经验"
      />

      <div className="container mx-auto px-4">
        {/* 板块一：部门介绍 */}
        <section className="py-16">
          <SectionHeading
            title="找到属于你的方向"
            description="三个核心方向，覆盖从设计到开发的全链路协作"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {departments.map((dept) => (
              <Card key={dept.title} hover className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold text-primary">{dept.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {dept.description}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {dept.points.map((point) => (
                    <li key={point} className="text-sm text-foreground">
                      · {point}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* 板块二：我们能学到什么 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="在实战中快速成长"
            description="用数据说话，每一步都看得见的进步"
          />
        </div>
        <StatsStrip stats={skills} />
      </section>

      {/* 底部 CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-card p-8 text-center shadow-sm md:p-12">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              准备好加入我们了吗
            </h2>
            <p className="mt-3 text-muted-foreground">
              提交报名表，开启你的官网项目实战之旅
            </p>
            <div className="mt-6 flex justify-center">
              <CTAButton href="/join-us/register" label="立即报名" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
