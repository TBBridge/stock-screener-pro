import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// 使用系统字体栈，不依赖外网字体服务（构建/运行更稳定，国内访问也更快）
const systemFontStack =
  'system-ui, -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans CJK JP", "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: "多市场股票分析仪表盘 - A股 · 港股 · 日股 · 美股",
  description:
    "A股、港股、日股、美股实时行情、K线图、买卖信号、新闻影响判断、智能筛选与持仓管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased" style={{ fontFamily: systemFontStack }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
