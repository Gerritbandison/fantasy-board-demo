import type { Metadata } from "next";
import { PlayoffSimulator } from "@/components/league/PlayoffSimulator";
import { ProjectedStandings } from "@/components/league/ProjectedStandings";
import { PageHeader } from "@/components/league/ui";
import { formatRecord, LEAGUE, TEAMS, USER_TEAM } from "@/lib/league";

export const metadata: Metadata = {
  title: `${USER_TEAM.name} playoff simulator`,
  description: `Projected standings and Monte Carlo playoff odds for ${USER_TEAM.name}. Top 4 make it, the regular season ends Week 14, and the tiebreak is record then points for. Week 8 is provisional.`,
};

export default function PlayoffsPage() {
  return (
    <>
      <PageHeader eyebrow={`${USER_TEAM.name} · ${formatRecord(USER_TEAM)} · projection`} title="Playoff simulator">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Projected final standings, then the remaining weeks resimulated in the browser when a result or the strength slider changes. Provisional, Week {LEAGUE.week} not final.
        </p>
      </PageHeader>
      <ProjectedStandings />
      <PlayoffSimulator
        focusName={USER_TEAM.name}
        currentWeek={LEAGUE.week}
        teams={TEAMS.map((t) => ({ id: t.id, name: t.name, abbrev: t.abbrev, color: t.color }))}
      />
    </>
  );
}
