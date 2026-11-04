import type { Metadata } from "next";
import { PlayoffSimulator } from "@/components/league/PlayoffSimulator";
import { ProjectedStandings } from "@/components/league/ProjectedStandings";
import { PageHeader } from "@/components/league/ui";
import { formatRecord, LEAGUE, TEAMS, USER_TEAM } from "@/lib/league";
import { liveBoard } from "@/lib/live-board";
import { diffSnapshot } from "@/lib/snapshot";
import { loadLatestSnapshot } from "@/lib/snapshot-store";

export const metadata: Metadata = {
  title: `${USER_TEAM.name} playoff simulator`,
  description: `Projected standings and Monte Carlo playoff odds for ${USER_TEAM.name}. Both use one model. Top 4 make it, the regular season ends Week 14, and the tiebreak is record then points for.`,
};

export default function PlayoffsPage() {
  const diff = diffSnapshot(loadLatestSnapshot(), liveBoard());
  const oddsDelta = diff.available ? new Map(diff.odds.map((row) => [row.teamId, row.playoffOddsDelta])) : null;
  return (
    <>
      <PageHeader eyebrow={`${USER_TEAM.name} · ${formatRecord(USER_TEAM)} · projection`} title="Playoff simulator">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          The table is the ESPN baseline, nothing locked. The simulator below it moves when the slider moves or a game is locked.
          {LEAGUE.provisionalLabel ? ` ${LEAGUE.provisionalLabel}.` : ` Week ${LEAGUE.week} is final.`}
          {oddsDelta == null ? " Odds have no earlier snapshot, so the table does not show a change." : " The small number under a percentage is the change since the last snapshot."}
        </p>
      </PageHeader>
      <ProjectedStandings oddsDelta={oddsDelta} />
      <PlayoffSimulator
        focusName={USER_TEAM.name}
        currentWeek={LEAGUE.week}
        weekFinal={LEAGUE.provisionalLabel == null}
        teams={TEAMS.map((t) => ({ id: t.id, name: t.name, abbrev: t.abbrev, color: t.color }))}
      />
    </>
  );
}
