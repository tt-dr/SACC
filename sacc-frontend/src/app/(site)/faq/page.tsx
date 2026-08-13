import type { Metadata } from "next";

export const metadata: Metadata = { title: "常见问题" };

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">常见问题</h1>
      <p className="mt-4 text-[#5a6780]">内容建设中...</p>
    </div>
  );
}
