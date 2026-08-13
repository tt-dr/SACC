import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-[#ff6a00]">404</h1>
      <p className="mt-4 text-lg text-[#5a6780]">页面不存在</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-full bg-gradient-to-b from-[#ff8a00] to-[#ff6a00] px-6 py-3 font-semibold text-white"
        >
          返回首页
        </Link>
        <Link
          href="/projects"
          className="rounded-full border px-6 py-3 font-semibold text-[#203158]"
        >
          查看项目
        </Link>
      </div>
    </div>
  );
}
