import type { Metadata } from "next";
import Link from "next/link";
import { PlayoffSimulator } from "@/components/league/PlayoffSimulator";
import { ProjectedStandings } from "@/components/league/ProjectedStandings";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { PageHeader } from "@/components/league/ui";
import { formatRecord, LEAGUE, TEAMS, teamPath, USER_TEAM } from "@/lib/league";
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
      <div className="flex flex-col gap-2">
        <Link href={teamPath(USER_TEAM.id)} className="inline-flex items-center gap-1 self-start text-xs font-bold tracking-wide text-turf uppercase hover:underline">
          ← {USER_TEAM.name}
        </Link>
        <PageHeader eyebrow={`${USER_TEAM.name} · ${formatRecord(USER_TEAM)} · projection`} title="Playoff simulator">
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            The projected standings table shows the ESPN baseline with nothing locked. Use the simulator below to shift {USER_TEAM.name}&apos;s weekly scoring expectation or lock matchups across the league.
            {oddsDelta == null ? " No earlier snapshot is stored yet." : " Badges beside each percentage show movement since the last snapshot."}
          </p>
          {LEAGUE.provisionalLabel && (
            <div className="mt-3">
              <ProvisionalNote />
            </div>
          )}
        </PageHeader>
      </div>

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
