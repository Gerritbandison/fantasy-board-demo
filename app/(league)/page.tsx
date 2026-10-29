import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

const board = getBoard("golden-goose");

export const metadata: Metadata = board
  ? {
      title: board.focus.teamName,
      description: `Week 8: ${board.focus.teamName} vs ${board.opponent.teamName}. Matchup preview, tale of the tape, weekly scoring, and lineups.`,
    }
  : {};

export default function HomePage() {
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
