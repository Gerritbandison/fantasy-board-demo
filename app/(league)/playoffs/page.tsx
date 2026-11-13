import type { Metadata } from "next";
import Link from "next/link";
import { PlayoffSimulator } from "@/components/league/PlayoffSimulator";
import { ProjectedStandings } from "@/components/league/ProjectedStandings";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { PageHeader } from "@/components/league/ui";
import { LEAGUE, STANDINGS, USER_TEAM } from "@/lib/league";
import { liveBoard } from "@/lib/live-board";
import { diffSnapshot } from "@/lib/snapshot";
import { loadPriorSnapshot } from "@/lib/snapshot-store";

export const metadata: Metadata = {
  title: "Playoff simulator",
  description: `Projected standings and interactive Monte Carlo playoff odds for all 10 Chicken League teams. Top 4 make it, the regular season ends Week 14, and the tiebreak is record then points for.`,
};

export default function PlayoffsPage() {
  const diff = diffSnapshot(loadPriorSnapshot(LEAGUE.week, LEAGUE.generatedAt), liveBoard());
  const oddsDelta = diff.available ? new Map(diff.odds.map((row) => [row.teamId, row.playoffOddsDelta])) : null;
  return (
    <>
      <PageHeader
        eyebrow={`${LEAGUE.season} season · Week ${LEAGUE.week} projection`}
        title="Playoff simulator"
        action={
          <Link
            href="/standings"
            className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-xs font-bold tracking-wide text-navy uppercase ring-1 ring-line transition-colors hover:bg-surface-subtle"
          >
            Standings →
          </Link>
        }
      >
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Projected standings show the 8,000-run ESPN baseline. Pick any franchise in the simulator below to test weekly scoring shifts, win-out paths, and locked matchups.
          {oddsDelta != null && ` Badges show odds movement since Week ${diff.week}.`}
        </p>
        {LEAGUE.provisionalLabel && (
          <div className="mt-3">
            <ProvisionalNote />
          </div>
        )}
      </PageHeader>

      <ProjectedStandings oddsDelta={oddsDelta} />
      <PlayoffSimulator
        defaultFocusId={USER_TEAM.id}
        currentWeek={LEAGUE.week}
        weekFinal={LEAGUE.provisionalLabel == null}
        teams={STANDINGS.map((t) => ({ id: t.id, name: t.name, abbrev: t.abbrev, color: t.color }))}
      />
    </>
  );
}
