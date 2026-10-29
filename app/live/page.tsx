import type { Metadata } from "next";
import { FantasyBoard } from "@/components/FantasyBoard";

export const metadata: Metadata = {
  title: "Live board (optional ESPN)",
  robots: { index: false },
};

export default function LivePage() {
  return <FantasyBoard />;
}
