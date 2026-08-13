import type { Metadata } from "next";

export const metadata: Metadata = { title: "相册" };

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">相册</h1>
      <p className="mt-4 text-[#5a6780]">内容建设中...</p>
    </div>
  );
}
