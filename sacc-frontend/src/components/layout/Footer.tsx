import Link from "next/link";
import { Globe, Mail, MapPin, ExternalLink } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "关于",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "文档库", href: "/docs" },
      { label: "成员动态", href: "/news" },
      { label: "项目展示", href: "/projects" },
    ],
  },
  {
    title: "文档",
    links: [
      { label: "项目概述", href: "/docs" },
      { label: "技术方案", href: "/docs" },
      { label: "协作规范", href: "/docs" },
      { label: "新人指南", href: "/docs" },
    ],
  },
  {
    title: "加入",
    links: [
      { label: "加入我们", href: "/join" },
      { label: "成员动态", href: "/news" },
      { label: "精彩活动", href: "/activities" },
      { label: "常见问题", href: "/faq" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#101a31] pt-12 pb-7 text-white/76">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <div className="flex flex-wrap justify-between gap-10 pb-7">
          {/* 品牌信息 */}
          <div className="flex max-w-[360px] flex-col gap-4">
            <div className="inline-flex items-center gap-3 text-white no-underline">
              <img src="/sacc-logo.svg" alt="SACC" className="h-10 w-10 object-contain" />
              <div className="flex flex-col leading-tight">
                <strong className="text-xl font-bold">SACC</strong>
                <span className="text-xs text-white/60">南邮计软院科协</span>
              </div>
            </div>
            <p className="leading-relaxed">
              Science Association of Computer College — 探索科学之美，创造技术未来
            </p>

            <div className="flex flex-col gap-2.5">
              <a
                href="https://sacc.njupt.edu.cn"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/82 no-underline hover:text-white"
              >
                <Globe size={14} className="text-[#ff7a00]" />
                sacc.njupt.edu.cn
              </a>
              <a
                href="mailto:sacc@njupt.edu.cn"
                className="inline-flex items-center gap-2 text-sm text-white/82 no-underline hover:text-white"
              >
                <Mail size={14} className="text-[#ff7a00]" />
                sacc@njupt.edu.cn
              </a>
              <span className="inline-flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-[#ff7a00]" />
                中国 · 校园技术共同体
              </span>
            </div>
          </div>

          {/* 多栏链接 */}
          <div className="flex flex-wrap gap-10">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-2.5">
                <strong className="mb-1 text-[15px] text-white">{column.title}</strong>
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-1 text-sm text-white/70 no-underline transition-colors hover:text-[#ff7a00]"
                  >
                    {link.label}
                    {link.href.startsWith("http") && <ExternalLink size={12} />}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 底栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-[22px] text-[13px] text-white/60">
          <span>&copy; {currentYear} SACC — Science Association of Computer College. All rights reserved.</span>
          <div className="flex gap-4">
            <span>隐私政策</span>
            <span>使用条款</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
