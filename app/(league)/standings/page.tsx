import type { Metadata } from "next";
import Link from "next/link";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { Card, LuckBadge, PageHeader, TeamAvatar } from "@/components/league/ui";
import { TeamsTabs } from "@/components/league/TeamsTabs";
import { cn } from "@/lib/utils";
import { formatRecord, LEAGUE, STANDINGS, teamPath, USER_TEAM } from "@/lib/league";
import { luck, pfRank } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Standings",
  description: `Chicken league standings through Week ${LEAGUE.week}: record, points for and against, points rank, and luck.${LEAGUE.provisionalLabel ? ` ${LEAGUE.provisionalLabel}.` : ""}`,
};

export default function StandingsPage() {
  return (
    <>
      <PageHeader eyebrow={`${LEAGUE.season} season · Week ${LEAGUE.week}`} title="Standings">
        <ProvisionalNote className="mt-2 text-sm font-semibold text-amber-800" />
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          <span className="font-semibold text-amber-800">Lucky (+)</span> teams have a better record than their points rank;{" "}
          <span className="font-semibold text-sky-800">unlucky (−)</span> teams have scored better than their record shows.
        </p>
        <div className="mt-4">
          <TeamsTabs active="standings" />
        </div>
      </PageHeader>

      <Card bodyClassName="p-0 sm:p-0">
        <ol className="divide-y divide-line sm:hidden" aria-label={`Chicken standings. ${LEAGUE.provisionalLabel ?? `Week ${LEAGUE.week} is final`}.`}>
          {STANDINGS.map((t) => {
            const lk = luck(t.id);
            const diff = t.pointsFor - t.pointsAgainst;
            return (
              <li key={t.id} className={cn("flex items-start gap-3 px-4 py-3", t.id === USER_TEAM.id && "bg-turf-light/40")}>
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-display text-sm font-bold text-slate-600">{t.rank}</span>
                <TeamAvatar teamId={t.id} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <Link href={teamPath(t.id)} className="block leading-tight font-semibold break-words text-navy underline decoration-turf/30 underline-offset-4">
                    {t.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-600 tabular-nums">
                    <span className="font-semibold text-navy">{t.pointsFor.toFixed(1)} PF</span>
                    <span> · {t.pointsAgainst.toFixed(1)} PA</span>
                    <span className={diff >= 0 ? "text-turf" : "text-loss"}>
                      {" "}
                      · {diff >= 0 ? "+" : "−"}
                      {Math.abs(diff).toFixed(1)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <LuckBadge row={lk} />
                  </div>
                </div>
                <span className="font-display text-xl font-bold text-navy tabular-nums">{formatRecord(t)}</span>
              </li>
            );
          })}
        </ol>
        <table className="hidden w-full table-fixed border-collapse text-left sm:table">
          <caption className="sr-only">Chicken standings. {LEAGUE.provisionalLabel ?? `Week ${LEAGUE.week} is final`}.</caption>
          <thead>
            <tr className="border-b border-line bg-slate-50 text-xs font-bold tracking-wider text-slate-600 uppercase">
              <th scope="col" className="w-10 py-2.5 pl-3 sm:w-12 sm:pl-4">#</th>
              <th scope="col" className="py-2.5">Team</th>
              <th scope="col" className="w-14 py-2.5 text-right">W-L</th>
              <th scope="col" className="w-20 py-2.5 text-right">PF</th>
              <th scope="col" className="hidden w-20 py-2.5 text-right sm:table-cell">PA</th>
              <th scope="col" className="hidden w-18 py-2.5 text-right md:table-cell">Diff</th>
              <th scope="col" className="hidden w-20 py-2.5 text-right md:table-cell">PF rank</th>
              <th scope="col" className="w-16 py-2.5 pr-3 text-right sm:w-28 sm:pr-4">Luck</th>
            </tr>
          </thead>
          <tbody>
            {STANDINGS.map((t) => {
              const lk = luck(t.id);
              const diff = t.pointsFor - t.pointsAgainst;
              return (
                <tr key={t.id} className={cn("border-b border-line last:border-0", t.id === USER_TEAM.id && "bg-turf-light/40")}>
                  <td className="py-3 pl-3 align-middle sm:pl-4">
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-100 font-display text-sm font-bold text-slate-600">{t.rank}</span>
                  </td>
                  <td className="py-3 pr-2 align-middle">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TeamAvatar teamId={t.id} size="sm" />
                      <span className="min-w-0">
                        <Link href={teamPath(t.id)} className="block leading-tight font-semibold break-normal whitespace-normal text-navy underline decoration-turf/30 underline-offset-4 hover:decoration-turf">
                          {t.name}
                        </Link>
                        <span className={cn("text-xs md:hidden", diff >= 0 ? "text-turf" : "text-loss")}>
                          {diff >= 0 ? "+" : "−"}
                          {Math.abs(diff).toFixed(1)} diff
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="py-3 text-right align-middle font-display text-lg font-bold text-navy tabular-nums">{formatRecord(t)}</td>
                  <td className="py-3 text-right align-middle font-semibold text-navy tabular-nums">{t.pointsFor.toFixed(1)}</td>
                  <td className="py-3 text-right align-middle text-slate-600 tabular-nums">{t.pointsAgainst.toFixed(1)}</td>
                  <td className={cn("hidden py-3 text-right align-middle font-semibold tabular-nums md:table-cell", diff >= 0 ? "text-turf" : "text-loss")}>
                    {diff >= 0 ? "+" : "−"}
                    {Math.abs(diff).toFixed(1)}
                  </td>
                  <td className="hidden py-3 text-right align-middle text-slate-600 tabular-nums md:table-cell">#{pfRank(t.id)}</td>
                  <td className="py-3 pr-3 text-right align-middle sm:pr-4">
                    <LuckBadge row={lk} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
        <span>
          Rank is wins, then points for. {LEAGUE.provisionalLabel ? `${LEAGUE.provisionalLabel}. The live leader counts as the winner.` : `Week ${LEAGUE.week} is final.`} No playoff cut line is drawn.
        </span>
        <Link href="/insights" className="font-semibold text-turf hover:underline">
          Power rankings & luck →
        </Link>
      </div>
    </>
  );
}
