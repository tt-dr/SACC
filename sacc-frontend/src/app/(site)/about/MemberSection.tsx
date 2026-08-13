// 功能: 团队成员展示组件,点击标签切换不同组的负责人和组员

// 声明为客户端组件,因为用了 useState 做标签切换
"use client";

import { useState } from "react";

// 定义负责人数据结构:姓名、职务、简介
interface MemberLeader {
  name: string;
  role: string;
  bio: string;
}

// 定义分组数据结构:唯一标识、组名、负责人列表、组员列表
interface MemberGroup {
  id: string;
  name: string;
  leaders: MemberLeader[];
  members: string[];
}

// 所有分组的静态数据,9个组
const MEMBER_GROUPS: MemberGroup[] = [
  {
    // 主席团
    id: "presidium",
    name: "主席团",
    leaders: [
      {
        name: "周亦晨",
        role: "执行主席",
        bio: "统筹全局，确保每一件事都有闭环。",
      },
      {
        name: "许沐安",
        role: "主席",
        bio: "专注训练营与招新，把成长路径跑通。",
      },
      { name: "陈思远", role: "主席", bio: "推进周会复盘，让制度不只是纸上。" },
      {
        name: "林嘉禾",
        role: "主席",
        bio: "前端工程化，把设计变成可维护的代码。",
      },
      { name: "赵奕辰", role: "主席", bio: "接口、缓存、部署，后端三件事。" },
      {
        name: "沈知白",
        role: "主席",
        bio: "让 AI 在校园真正落地，而不是只写 PPT。",
      },
      {
        name: "顾安可",
        role: "技术顾问",
        bio: "品牌与内容的平衡，设计不只是好看。",
      },
    ],
    // 主席团没有普通组员
    members: [],
  },
  {
    // 办公室
    id: "office",
    name: "办公室",
    leaders: [
      { name: "江若云", role: "组长", bio: "管好每一份档案、排期和会议纪要。" },
      {
        name: "徐子谦",
        role: "副组长",
        bio: "让行政流程自动化，减少重复劳动。",
      },
      { name: "何语晴", role: "副组长", bio: "沟通是办公室最重要的技术。" },
    ],
    members: ["张轩铭", "刘雨桐", "王思源", "陈乐怡", "李泽宇", "赵心怡"],
  },
  {
    // 赛事部
    id: "event",
    name: "赛事部",
    leaders: [
      { name: "秦正阳", role: "组长", bio: "把每场比赛办成可复盘的工程。" },
      {
        name: "孙若溪",
        role: "副组长",
        bio: "赛题设计、流程管控，细节决定体验。",
      },
      { name: "陆启帆", role: "副组长", bio: "从场地到设备，保障比赛不翻车。" },
    ],
    members: ["郑浩然", "吴芷若", "马骏驰", "韩雨萱", "杨博文", "姜欣然"],
  },
  {
    // 新媒体
    id: "new-media",
    name: "新媒体",
    leaders: [
      {
        name: "苏漫宁",
        role: "组长",
        bio: "品牌视觉不是画图，是讲好 SACC 的故事。",
      },
      { name: "程彦宁", role: "副组长", bio: "外联与传播，让更多人看到我们。" },
      {
        name: "白毓泽",
        role: "副组长",
        bio: "海报、推送、视频，每个触点都用心。",
      },
    ],
    members: ["谢佳怡", "黄俊杰", "丁梦瑶", "沈逸飞", "叶婉清", "高铭远"],
  },
  {
    // 前端组
    id: "frontend",
    name: "前端组",
    leaders: [
      {
        name: "林嘉禾",
        role: "组长",
        bio: "官网、组件库、工程化，一砖一瓦建起来。",
      },
      { name: "顾安可", role: "副组长", bio: "内容与体验并重，让官网会说话。" },
      { name: "傅明哲", role: "副组长", bio: "把设计稿还原到像素级。" },
    ],
    members: ["唐静怡", "宋文博", "柳雨薇", "孟浩然", "肖欣然", "潘致诚"],
  },
  {
    // 后端组
    id: "backend",
    name: "后端组",
    leaders: [
      { name: "赵奕辰", role: "组长", bio: "Gin + Gorm，稳是第一位。" },
      { name: "梁知行", role: "副组长", bio: "接口设计先想边界，再写代码。" },
      { name: "袁婉清", role: "副组长", bio: "数据库不是存数据，是建模业务。" },
    ],
    members: ["范睿阳", "蒋思琪", "彭俊辉", "黎晓萌", "田云轩", "魏芷兰"],
  },
  {
    // 安全组
    id: "security",
    name: "安全组",
    leaders: [
      {
        name: "邢致远",
        role: "组长",
        bio: "安全不是补漏洞，是从设计就开始防守。",
      },
      { name: "傅嘉宁", role: "副组长", bio: "CTF 与渗透，攻防一体。" },
      {
        name: "余清风",
        role: "副组长",
        bio: "代码审计，让每一行都经得起考验。",
      },
    ],
    members: ["曹云帆", "董思涵", "罗嘉瑞", "常雨晴", "贺知远", "阮佳怡"],
  },
  {
    // Python组
    id: "python",
    name: "Python组",
    leaders: [
      {
        name: "沈知白",
        role: "组长",
        bio: "从 RAG 到 Agent，把 AI 写进生产环境。",
      },
      {
        name: "俞峻熙",
        role: "副组长",
        bio: "Python 生态，脚手架到微服务都碰。",
      },
      {
        name: "姜若涵",
        role: "副组长",
        bio: "数据处理与模型训练，耐心出结果。",
      },
    ],
    members: ["关志远", "郭语彤", "宋景行", "程可欣", "冯逸轩", "梅琳"],
  },
  {
    // 算法组
    id: "algorithm",
    name: "算法组",
    leaders: [
      {
        name: "宋景澄",
        role: "组长",
        bio: "刷题千道不如讲透一道，训练讲究方法。",
      },
      {
        name: "楚清远",
        role: "副组长",
        bio: "图论和 DP，两座山翻过去就是风景。",
      },
      { name: "乔思妍", role: "副组长", bio: "竞赛不只是代码，是心态和策略。" },
    ],
    members: ["温煦阳", "齐婉秋", "汪靖宇", "向雨薇", "陶知行", "冉晴"],
  },
];

// 团队成员展示组件
export function MemberSection() {
  // 当前选中的组ID,默认显示第一个组(主席团)
  const [activeId, setActiveId] = useState(MEMBER_GROUPS[0].id);

  // 根据当前选中的ID找到对应组数据,找不到就回退到第一个组
  const activeGroup: MemberGroup = MEMBER_GROUPS.find((g) => g.id === activeId) ?? MEMBER_GROUPS[0];

  // 判断当前组有没有普通组员(主席团是空数组)
  const hasMembers = activeGroup.members.length > 0;

  return (
    // 最外层:浅灰背景,左右内边距,上下间距
    <section className="bg-[#f7f9fc] px-4 py-16">
      {/* 居中容器 */}
      <div className="container mx-auto">
        {/* 板块标题和描述 */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl">
            团队组成
          </h2>
          <p className="mt-2 text-[#5a6780]">
            SACC 按方向分组，每个组都有明确的负责人和协作节奏。
          </p>
        </div>

        {/* 标签栏:遍历所有组生成按钮 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {MEMBER_GROUPS.map((group) => (
            <button
              key={group.id}
              // 点击时更新当前选中的组ID
              onClick={() => setActiveId(group.id)}
              // 选中:橙色背景白字 / 未选中:白底灰字带边框
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                group.id === activeId
                  ? "bg-[#ff6a00] text-white"
                  : "border border-[#e7ecf4] bg-white text-[#5a6780] hover:text-[#ff6a00]"
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* 负责人卡片:网格布局,手机1列 平板2列 桌面3列 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 遍历当前组的负责人生成卡片 */}
          {activeGroup.leaders.map((leader) => (
            <div
              key={leader.name}
              // 卡片样式:圆角 边框 白底 阴影 hover上移
              className="rounded-[20px] border border-[#e7ecf4] bg-white p-5 shadow-[0_12px_28px_rgba(15,32,55,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_38px_rgba(15,32,55,0.1)]"
            >
              {/* 头像+姓名+职务 */}
              <div className="mb-3 flex items-center gap-3">
                {/* 头像:取姓名第一个字,橙色渐变圆形 */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a00] to-[#ff6a00] text-lg font-bold text-white">
                  {leader.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-[#1d2638]">{leader.name}</h4>
                  <span className="text-sm text-[#ff6a00]">{leader.role}</span>
                </div>
              </div>
              {/* 一句话简介 */}
              <p className="text-sm leading-relaxed text-[#5a6780]">
                {leader.bio}
              </p>
            </div>
          ))}
        </div>

        {/* 组员列表:只有有组员时才显示 */}
        {hasMembers && (
          <div className="mt-6 rounded-[20px] border border-[#e7ecf4] bg-white p-6">
            <span className="mb-3 block text-sm font-semibold text-[#5a6780]">
              组员
            </span>
            {/* 组员名字用标签形式展示 */}
            <div className="flex flex-wrap gap-2">
              {activeGroup.members.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-[#f4f6fb] px-3.5 py-1.5 text-sm text-[#2f3645]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
