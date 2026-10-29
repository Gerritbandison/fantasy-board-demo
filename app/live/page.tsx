import type { Metadata } from "next";
import { FantasyBoard } from "@/components/FantasyBoard";

export const metadata: Metadata = {
  title: "Live board (optional ESPN)",
  robots: { index: false },
};

export default function LivePage() {
  return (
    <div className="dark flex min-h-dvh flex-col bg-[#07090d] text-zinc-100">
      <FantasyBoard />
    </div>
  );
}
