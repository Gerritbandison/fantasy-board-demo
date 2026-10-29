import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

export const metadata: Metadata = {
  title: "Bibi's Boys",
  description: "Bibi's Boys vs Chewy's Warriors — week 8 matchup board.",
};

export default function BibisPage() {
  const board = getBoard("bibis");
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
