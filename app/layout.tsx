import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyOJ 平台",
  description: "A professional online judge platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#edf2f7] text-gray-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}