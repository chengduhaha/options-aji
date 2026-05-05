import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "OptionsAji - AI 期权分析平台",
  description: "AI 驱动的美股期权分析平台，实时 GEX 分析、期权扫描、智能策略推荐",
  keywords: ["期权", "美股", "GEX", "AI分析", "期权交易", "Gamma Exposure"],
  authors: [{ name: "OptionsAji" }],
  openGraph: {
    title: "OptionsAji - AI 期权分析平台",
    description: "AI 驱动的美股期权分析平台",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050a14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
