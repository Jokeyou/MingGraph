import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata: Metadata = {
  title: "MingGraph · 明朝人物关系图谱",
  description: "像 Obsidian 图谱一样拖拽探索明朝三百年，像《明朝那些事儿》一样把故事讲活。",
  openGraph: {
    title: "MingGraph · 明朝人物关系图谱",
    description: "拖一拖，点一点，你会发现——历史比小说更好看。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased" style={{ background: '#080C14' }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
