import type { Metadata } from "next";
import Link from "next/link";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { Card, LuckBadge, PageHeader, RankBadge, TeamAvatar } from "@/components/league/ui";
import { TeamsTabs } from "@/components/league/TeamsTabs";
import { cn } from "@/lib/utils";
import { formatRecord, LEAGUE, STANDINGS, teamPath, USER_TEAM } from "@/lib/league";
import { luck, pfRank } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Standings",
  description: `Chicken league standings through Week ${LEAGUE.week}: record, points for and against, points rank, and luck.${LEAGUE.provisionalLabel ? ` ${LEAGUE.provisionalLabel}.` : ""}`,
};

export default function StandingsPage() {
  const maxPf = Math.max(...STANDINGS.map((t) => t.pointsFor), 1);

  return (
    <>
      <PageHeader
        eyebrow={`${LEAGUE.season} season · Week ${LEAGUE.week}`}
        title="Standings"
        action={<TeamsTabs active="standings" />}
      >
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          <span className="font-semibold text-gold-ink">Lucky (+)</span> teams hold a better standings place than their scoring rank;{" "}
          <span className="font-semibold text-sky-800">unlucky (−)</span> teams have outscored their current record.
        </p>
        {LEAGUE.provisionalLabel && (
          <div className="mt-3">
            <ProvisionalNote />
          </div>
        )}
      </PageHeader>

      <Card bodyClassName="p-0 sm:p-0">
        <ol className="divide-y divide-line sm:hidden" aria-label={`Chicken standings. ${LEAGUE.provisionalLabel ?? `Week ${LEAGUE.week} is final`}.`}>
          {STANDINGS.map((t) => {
            const lk = luck(t.id);
            const diff = t.pointsFor - t.pointsAgainst;
            return (
              <li
                key={t.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5",
                  t.id === USER_TEAM.id && "bg-turf-light/35",
                )}
              >
                <RankBadge rank={t.rank} className="mt-0.5" />
                <TeamAvatar teamId={t.id} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <Link href={teamPath(t.id)} className="block leading-tight font-semibold break-words text-navy hover:underline">
                    {t.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    <span className="font-semibold text-navy">{t.pointsFor.toFixed(1)} PF</span>
                    <span> · {t.pointsAgainst.toFixed(1)} PA</span>
                    <span className={cn("font-semibold", diff >= 0 ? "text-turf" : "text-loss")}>
                      {" "}
                      · {diff >= 0 ? "+" : "−"}
                      {Math.abs(diff).toFixed(1)}
                    </span>
                  </p>
                  <div className="mt-1.5">
                    <LuckBadge row={lk} withRanks />
                  </div>
                </div>
                <span className="rounded-lg bg-surface-subtle px-2.5 py-1 font-display text-xl font-extrabold text-navy tabular-nums ring-1 ring-line">
                  {formatRecord(t)}
                </span>
              </li>
            );
          })}
        </ol>

        <table className="hidden w-full table-fixed border-collapse text-left sm:table">
          <caption className="sr-only">Chicken standings. {LEAGUE.provisionalLabel ?? `Week ${LEAGUE.week} is final`}.</caption>
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              <th scope="col" className="w-12 py-3 pl-4 sm:pl-5">#</th>
              <th scope="col" className="py-3">Team</th>
              <th scope="col" className="w-16 py-3 text-right">W-L</th>
              <th scope="col" className="w-28 py-3 text-right lg:w-36">PF</th>
              <th scope="col" className="w-20 py-3 text-right">PA</th>
              <th scope="col" className="hidden w-20 py-3 text-right md:table-cell">Diff</th>
              <th scope="col" className="hidden w-20 py-3 text-right md:table-cell">PF rank</th>
              <th scope="col" className="w-24 py-3 pr-4 text-right sm:w-28 sm:pr-5">Luck</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {STANDINGS.map((t) => {
              const lk = luck(t.id);
              const diff = t.pointsFor - t.pointsAgainst;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "transition-colors hover:bg-surface-subtle/65",
                    t.id === USER_TEAM.id && "bg-turf-light/35 hover:bg-turf-light/50",
                  )}
                >
                  <td className="py-3 pl-4 align-middle sm:pl-5">
                    <RankBadge rank={t.rank} />
                  </td>
                  <td className="py-3 pr-2 align-middle">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TeamAvatar teamId={t.id} size="sm" />
                      <span className="min-w-0">
                        <Link href={teamPath(t.id)} className="block leading-tight font-semibold break-normal whitespace-normal text-navy hover:underline">
                          {t.name}
                        </Link>
                        {t.owner && <span className="hidden text-xs text-slate-500 md:block">{t.owner}</span>}
                        <span className={cn("text-xs font-medium md:hidden", diff >= 0 ? "text-turf" : "text-loss")}>
                          {diff >= 0 ? "+" : "−"}
                          {Math.abs(diff).toFixed(1)} diff
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-right align-middle font-display text-xl font-extrabold text-navy tabular-nums">{formatRecord(t)}</td>
                  <td className="py-3 text-right align-middle">
                    <div className="inline-flex flex-col items-end">
                      <span className="font-semibold text-navy tabular-nums">{t.pointsFor.toFixed(1)}</span>
                      <span className="mt-1 hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted lg:block" aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${(t.pointsFor / maxPf) * 100}%`, background: t.color }} />
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right align-middle text-slate-600 tabular-nums">{t.pointsAgainst.toFixed(1)}</td>
                  <td className={cn("hidden py-3 text-right align-middle font-semibold tabular-nums md:table-cell", diff >= 0 ? "text-turf" : "text-loss")}>
                    {diff >= 0 ? "+" : "−"}
                    {Math.abs(diff).toFixed(1)}
                  </td>
                  <td className="hidden py-3 text-right align-middle font-medium text-slate-600 tabular-nums md:table-cell">#{pfRank(t.id)}</td>
                  <td className="py-3 pr-4 text-right align-middle sm:pr-5">
                    <LuckBadge row={lk} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs text-slate-600">
        <span>
          Ordered by wins, then points for. {LEAGUE.provisionalLabel ? `${LEAGUE.provisionalLabel}. The live leader counts as the winner.` : `Week ${LEAGUE.week} is final.`} No playoff cut line is drawn here.
        </span>
        <Link href="/insights" className="font-semibold text-turf hover:underline">
          Power rankings &amp; luck →
        </Link>
      </div>
    </>
  );
}
