import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fantasy-board-demo.vercel.app"),
  title: {
    default: "Chicken Command · Week 08 Ops",
    template: "%s · Chicken Command",
  },
  description:
    "Chicken Command: the ops board for the Chicken league. Matchup briefs, score trails, the luck index, and the champions archive.",
  openGraph: {
    title: "Chicken Command · Week 08 Ops",
    description: "Matchup briefs, score trails, luck index, and the Chicken champions archive.",
    url: "https://fantasy-board-demo.vercel.app",
    siteName: "Chicken Command",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Chicken Cmd", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#08090a",
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${plexSans.variable} ${plexMono.variable} ${chakra.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-zinc-100">{children}</body>
    </html>
  );
}
