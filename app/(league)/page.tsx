import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getBoard } from "@/lib/league";

export default function GoldenGoosePage() {
  const board = getBoard("golden-goose");
  if (!board) notFound();
  return <MatchupBoard board={board} />;
}
