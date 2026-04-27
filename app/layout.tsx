import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "OptionsAji — 期权阿吉",
  description: "AI 驱动的美股期权分析平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-text font-ui antialiased">
        {children}
      </body>
    </html>
  );
}
