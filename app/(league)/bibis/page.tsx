import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

export const metadata: Metadata = {
  title: "Bibi's Boys",
  description: "Week 8: Bibi's Boys vs Chewy's Warriors. Matchup preview, tale of the tape, weekly scoring, and lineups.",
};

export default function BibisPage() {
  const board = getBoard("bibis");
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
