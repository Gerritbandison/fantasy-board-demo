import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { LEAGUE, matchupFor, team, USER_TEAM } from "@/lib/league";

const matchup = matchupFor(USER_TEAM.id);

export const metadata: Metadata = matchup
  ? {
      title: USER_TEAM.name,
      description: `Week ${LEAGUE.week}: ${team(matchup.left.teamId).name} vs ${team(matchup.right.teamId).name}. Matchup preview, tale of the tape, weekly scoring, and lineups.`,
    }
  : {};

export default function HomePage() {
  if (!matchup) notFound();
  return <MatchupBoard matchup={matchup} featured />;
}
