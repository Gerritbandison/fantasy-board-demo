import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, LuckBadge, PageHeader, Pill, TeamAvatar } from "@/components/league/ui";
import { MiniTrail } from "@/components/league/trail";
import { TeamsTabs } from "@/components/league/TeamsTabs";
import { FindNav } from "@/components/league/FindNav";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { formatPoints, formatRecord, LEAGUE, matchupFor, ordinal, STANDINGS, team, teamPath } from "@/lib/league";
import { luck, pfRank, powerRank, teamStats } from "@/lib/stats";

export const metadata: Metadata = {
  description: `All ten Chicken league teams: record, points, power rank, week ${LEAGUE.week} opponent, and titles.`,
};

export default function HomePage() {
  return (
    <>
      <PageHeader
        eyebrow={`${LEAGUE.size} teams · ${LEAGUE.season} season`}
        title="Teams"
        action={<TeamsTabs active="teams" />}
      >
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Every franchise in Chicken, in standings order. Open any franchise for its schedule, lineup, trade ledger, head-to-head series, and history.
        </p>
        {LEAGUE.provisionalLabel && (
          <div className="mt-3">
            <ProvisionalNote />
          </div>
        )}
        <FindNav />
      </PageHeader>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STANDINGS.map((t) => {
          const m = matchupFor(t.id);
          const oppId = m ? (m.left.teamId === t.id ? m.right.teamId : m.left.teamId) : undefined;
          const proj = m ? (m.left.teamId === t.id ? m.left.projected : m.right.projected) : undefined;
          const s = teamStats(t);
          return (
            <Card
              key={t.id}
              as="li"
              accent={t.color}
              bodyClassName="flex h-full flex-col"
              className="transition-all hover:shadow-[0_4px_14px_rgba(12,25,44,0.08)] hover:ring-line-strong"
            >
              <Link href={teamPath(t.id)} className="group flex flex-1 flex-col">
                <div className="flex items-start gap-3">
                  <TeamAvatar teamId={t.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs font-bold tracking-[0.1em] text-slate-500 uppercase">{ordinal(t.rank)} place</p>
                    <p className="mt-0.5 font-display text-xl leading-tight font-bold break-words text-navy group-hover:underline">{t.name}</p>
                    {t.owner && <p className="mt-0.5 text-xs font-medium text-slate-600">{t.owner}</p>}
                  </div>
                  {t.history.titles > 0 && (
                    <Pill tone="gold" className="shrink-0">
                      <Trophy className="size-3" aria-hidden />
                      <span title={`Titles: ${t.history.titleYears.join(", ")}`}>
                        {t.history.titles > 1 ? `${t.history.titles}×` : t.history.titleYears[0]}
                      </span>
                    </Pill>
                  )}
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl bg-surface-subtle p-2.5 ring-1 ring-line/80">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Record</p>
                    <p className="font-display text-lg leading-tight font-extrabold text-navy tabular-nums">{formatRecord(t)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Points</p>
                    <p className="font-display text-lg leading-tight font-bold text-navy tabular-nums">
                      {t.pointsFor.toFixed(0)} <span className="font-sans text-[11px] font-semibold text-slate-500">#{pfRank(t.id)}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Power</p>
                    <p className="font-display text-lg leading-tight font-bold text-navy tabular-nums">#{powerRank(t.id)}</p>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <LuckBadge row={luck(t.id)} />
                  <span className="text-xs font-medium text-slate-600 tabular-nums">
                    Avg {s.avg.toFixed(1)} · L3 {s.last3.toFixed(1)}
                  </span>
                </div>

                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="min-w-0 text-xs text-slate-600">
                      {oppId != null && m && (
                        <p className="leading-snug break-words">
                          <span className="font-bold tracking-wide text-slate-500 uppercase">Wk {LEAGUE.week}</span> vs{" "}
                          <span className="font-semibold text-navy">{team(oppId).name}</span>
                          {m.state !== "projected" ? (
                            <span className="block font-semibold text-slate-700 tabular-nums">
                              {formatPoints(m.left.teamId === t.id ? (m.left.points ?? 0) : (m.right.points ?? 0))}
                              {proj != null && <span className="font-normal text-slate-500"> [{proj.toFixed(1)}]</span>}
                            </span>
                          ) : (
                            proj != null && <span className="block tabular-nums">proj {proj.toFixed(1)}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <MiniTrail team={t} />
                  </div>
                </div>
              </Link>

              {t.isUser && (
                <Link
                  href="/playoffs"
                  className="mt-3 flex h-9 items-center justify-between rounded-lg bg-turf-light/70 px-3 text-xs font-bold tracking-wide text-turf-dark uppercase ring-1 ring-turf-border transition-colors hover:bg-turf-light"
                >
                  <span>Playoff simulator</span>
                  <span aria-hidden>→</span>
                </Link>
              )}
            </Card>
          );
        })}
      </ul>
      <p className="text-xs text-slate-600">Dashed line in each sparkline marks the weekly league scoring average.</p>
    </>
  );
}
