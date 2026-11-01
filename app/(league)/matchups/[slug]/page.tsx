import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchupBoard } from "@/components/league/MatchupBoard";
import { getMatchup, LEAGUE, MATCHUPS, team } from "@/lib/league";

export function generateStaticParams() {
  return [...MATCHUPS.map((m) => ({ slug: m.slug })), { slug: "maye-dim" }, { slug: "golden-goose" }];
}

export async function generateMetadata({ params }: PageProps<"/matchups/[slug]">): Promise<Metadata> {
  const m = getMatchup((await params).slug);
  if (!m) return {};
  const title = `${team(m.left.teamId).name} vs ${team(m.right.teamId).name}`;
  return { title, description: `Week ${LEAGUE.week}: ${title}. Preview, tale of the tape, weekly scoring, and lineups.` };
}

export default async function MatchupPage({ params }: PageProps<"/matchups/[slug]">) {
  const m = getMatchup((await params).slug);
  if (!m) notFound();
  return <MatchupBoard matchup={m} />;
}
