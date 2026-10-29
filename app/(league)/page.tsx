import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

const board = getBoard("golden-goose");

export const metadata: Metadata = board
  ? {
      title: { absolute: `${board.focus.teamName} · Chicken Command` },
      description: `Op 08: ${board.focus.teamName} vs ${board.opponent.teamName}. Matchup brief, projection readout, score trail, and lineups.`,
    }
  : {};

export default function HomePage() {
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
