import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

export const metadata: Metadata = {
  title: { absolute: "Golden Goose · Chicken Command" },
  description: "Op 08: Golden Goose vs Dimes McSorley. Matchup brief, projection readout, score trail, and lineups.",
};

export default function GoldenGoosePage() {
  const board = getBoard("golden-goose");
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
