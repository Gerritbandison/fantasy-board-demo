import type { Metadata } from "next";
import { PlayoffSimulator } from "@/components/league/PlayoffSimulator";
import { ProjectedStandings } from "@/components/league/ProjectedStandings";
import { PageHeader } from "@/components/league/ui";
import { formatRecord, LEAGUE, TEAMS, USER_TEAM } from "@/lib/league";

export const metadata: Metadata = {
  title: `${USER_TEAM.name} playoff simulator`,
  description: `Projected standings and Monte Carlo playoff odds for ${USER_TEAM.name}. Both use one model. Top 4 make it, the regular season ends Week 14, and the tiebreak is record then points for.`,
};

export default function PlayoffsPage() {
  return (
    <>
      <PageHeader eyebrow={`${USER_TEAM.name} · ${formatRecord(USER_TEAM)} · projection`} title="Playoff simulator">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          One model. The table is the baseline: the ESPN setting, nothing locked, ranked by average finish. The simulator below it changes when the strength slider moves or a game is locked.
          {LEAGUE.provisionalLabel ? ` ${LEAGUE.provisionalLabel}.` : ` Week ${LEAGUE.week} is final.`}
        </p>
      </PageHeader>
      <ProjectedStandings />
      <PlayoffSimulator
        focusName={USER_TEAM.name}
        currentWeek={LEAGUE.week}
        weekFinal={LEAGUE.provisionalLabel == null}
        teams={TEAMS.map((t) => ({ id: t.id, name: t.name, abbrev: t.abbrev, color: t.color }))}
      />
    </>
  );
}
