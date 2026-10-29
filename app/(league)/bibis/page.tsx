import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

export const metadata: Metadata = {
  title: "Bibi's Boys",
  description: "Op 08: Bibi's Boys vs Chewy's Warriors. Matchup brief, projection readout, score trail, and lineups.",
};

export default function BibisPage() {
  const board = getBoard("bibis");
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
