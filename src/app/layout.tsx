import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { HistoryDrawer } from "@/components/ui/HistoryDrawer";

export const metadata: Metadata = {
  title: "旅游规划 AI Agent",
  description: "智能旅游规划助手，为您提供个性化的旅行方案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="font-sans">
      <body className="antialiased">
        <Navbar />
        <HistoryDrawer />
        {children}
      </body>
    </html>
  );
}
