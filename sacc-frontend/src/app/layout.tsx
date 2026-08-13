import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SACC — 南邮计软院科协",
    template: "%s | SACC",
  },
  description:
    "南京邮电大学计算机学院、软件学院、网络空间安全学院科学技术协会官方网站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
