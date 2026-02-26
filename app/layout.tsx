import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// 英文字体 - 通用
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 日文字体
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// 中文字体
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Stock Screener Pro - AI-Powered Investment Analysis",
  description: "Advanced stock screening and portfolio management powered by Claude Code Skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.variable} ${notoSansJP.variable} ${notoSansSC.variable} antialiased font-sans`}
        style={{ fontFamily: 'var(--font-noto-sans), var(--font-noto-sc), var(--font-noto-jp), system-ui, sans-serif' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
