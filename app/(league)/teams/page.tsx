import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, LuckBadge, PageHeader, Pill, TeamAvatar } from "@/components/league/ui";
import { MiniTrail } from "@/components/league/trail";
import { TeamsTabs } from "@/components/league/TeamsTabs";
import { formatRecord, LEAGUE, matchupFor, ordinal, STANDINGS, team, teamPath } from "@/lib/league";
import { luck, pfRank, powerRank, teamStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Teams",
  description: "All ten Chicken league teams: record, points, power rank, week 8 opponent, and titles.",
};

export default function TeamsPage() {
  return (
    <>
      <PageHeader eyebrow={`${LEAGUE.size} teams · ${LEAGUE.season} season`} title="Teams">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">Every franchise in Chicken, in standings order. Tap a team for its schedule, roster, moves, and history.</p>
        <div className="mt-4">
          <TeamsTabs active="teams" />
        </div>
      </PageHeader>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STANDINGS.map((t) => {
          const m = matchupFor(t.id);
          const oppId = m ? (m.left.teamId === t.id ? m.right.teamId : m.left.teamId) : undefined;
          const proj = m ? (m.left.teamId === t.id ? m.left.projected : m.right.projected) : undefined;
          const s = teamStats(t);
          return (
            <Card key={t.id} as="li" accent={t.color} className="transition-shadow hover:shadow-md">
              <Link href={teamPath(t.id)} className="block">
                <div className="flex items-start gap-3">
                  <TeamAvatar teamId={t.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{ordinal(t.rank)} place</p>
                    <p className="font-display text-xl leading-tight font-bold break-words text-navy">{t.name}</p>
                    {t.owner && <p className="text-xs text-slate-500">{t.owner}</p>}
                  </div>
                  {t.history.titles > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5 font-display text-lg font-bold text-gold" title={`Titles: ${t.history.titleYears.join(", ")}`}>
                      <Trophy className="size-4" />
                      {t.history.titles > 1 ? `×${t.history.titles}` : ""}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Pill tone="navy">{formatRecord(t)}</Pill>
                  <Pill>
                    {t.pointsFor.toFixed(1)} PF · #{pfRank(t.id)}
                  </Pill>
                  <Pill tone="sky">Power #{powerRank(t.id)}</Pill>
                  <LuckBadge row={luck(t.id)} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <div className="min-w-0 text-xs text-slate-500">
                    {oppId != null && (
                      <p className="truncate">
                        Wk {LEAGUE.week} vs <span className="font-semibold text-slate-700">{team(oppId).name}</span>
                        {proj != null && <> · proj {proj.toFixed(1)}</>}
                      </p>
                    )}
                    <p>
                      Avg {s.avg.toFixed(1)} · last 3 {s.last3.toFixed(1)}
                    </p>
                  </div>
                  <MiniTrail team={t} />
                </div>
              </Link>
            </Card>
          );
        })}
      </ul>
      <p className="text-xs text-slate-500">Dashed line in each trend: the weekly league average.</p>
    </>
  );
}
