import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "SACC — 南邮计软院科协", template: "%s | SACC" },
  description: "南京邮电大学计算机学院、软件学院、网络空间安全学院科学技术协会官方网站",
};

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">SACC 官网</h1>
      <p className="mt-4 text-[#5a6780]">内容建设中...</p>
    </div>
  );
}
