import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormatMagic - 免费的文件格式转换工具",
  description: "完全免费的文件格式转换工具，支持PDF、Word、图片格式之间的相互转换，包括合并、拆分、压缩、转换等功能",
  keywords: "文件转换,图片转PDF,PDF转图片,Word转PDF,PDF转Word,在线转换工具,FormatMagic",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
