import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fantasy-board-demo.vercel.app"),
  title: {
    default: "Chicken League · Week 8",
    template: "%s · Chicken League",
  },
  description: "Week 8 matchup boards, standings, and insights for the Chicken fantasy football league.",
  openGraph: {
    title: "Chicken League · Week 8",
    description: "Golden Goose, Bibi's Boys, standings, and insights — phone-friendly.",
    url: "https://fantasy-board-demo.vercel.app",
    siteName: "Chicken League Board",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Chicken", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07090d] text-zinc-100">{children}</body>
    </html>
  );
}
