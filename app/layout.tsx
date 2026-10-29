import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fantasy-board-demo.vercel.app"),
  title: {
    default: "Chicken League · Week 8",
    template: "%s · Chicken League",
  },
  description:
    "The Chicken fantasy football league hub: week 8 matchups, standings, power rankings, luck, high scores, and league history.",
  openGraph: {
    title: "Chicken League · Week 8",
    description: "Week 8 matchups, standings, insights, and the Chicken champions history.",
    url: "https://fantasy-board-demo.vercel.app",
    siteName: "Chicken League",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Chicken League", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0f1e36",
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-field text-slate-800">{children}</body>
    </html>
  );
}
