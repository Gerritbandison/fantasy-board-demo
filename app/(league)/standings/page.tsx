import type { Metadata } from "next";
import Link from "next/link";
import { Card, LuckBadge, PageHeader, TeamAvatar } from "@/components/league/ui";
import { TeamsTabs } from "@/components/league/TeamsTabs";
import { cn } from "@/lib/utils";
import { formatRecord, LEAGUE, STANDINGS, teamPath, USER_TEAM } from "@/lib/league";
import { luck, pfRank } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Standings",
  description: `Chicken league standings after week ${LEAGUE.week - 1}: record, points for and against, points rank, and luck.`,
};

export default function StandingsPage() {
  return (
    <>
      <PageHeader eyebrow={`${LEAGUE.season} season · after week ${LEAGUE.week - 1}`} title="Standings">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          <span className="font-semibold text-amber-800">Lucky (+)</span> teams have a better record than their points rank;{" "}
          <span className="font-semibold text-sky-800">unlucky (−)</span> teams have scored better than their record shows.
        </p>
        <div className="mt-4">
          <TeamsTabs active="standings" />
        </div>
      </PageHeader>

      <Card bodyClassName="p-0 sm:p-0">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">Chicken standings after week {LEAGUE.week - 1}</caption>
          <thead>
            <tr className="border-b border-line bg-slate-50 text-xs font-bold tracking-wider text-slate-600 uppercase">
              <th scope="col" className="w-10 py-2.5 pl-3 sm:w-12 sm:pl-4">#</th>
              <th scope="col" className="py-2.5">Team</th>
              <th scope="col" className="w-11 py-2.5 text-right sm:w-14">W-L</th>
              <th scope="col" className="w-16 py-2.5 text-right sm:hidden">PF/PA</th>
              <th scope="col" className="hidden w-20 py-2.5 text-right sm:table-cell">PF</th>
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
                      <TeamAvatar teamId={t.id} size="sm" className="hidden sm:inline-flex" />
                      <span className="min-w-0">
                        <Link href={teamPath(t.id)} className="block leading-tight font-semibold break-words text-navy underline decoration-turf/30 underline-offset-4 hover:decoration-turf">
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
                  <td className="py-3 text-right align-middle text-sm leading-tight tabular-nums sm:hidden">
                    <span className="block font-semibold text-navy">{t.pointsFor.toFixed(1)}</span>
                    <span className="block text-xs text-slate-600">{t.pointsAgainst.toFixed(1)}</span>
                  </td>
                  <td className="hidden py-3 text-right align-middle font-semibold text-navy tabular-nums sm:table-cell">{t.pointsFor.toFixed(1)}</td>
                  <td className="hidden py-3 text-right align-middle text-slate-600 tabular-nums sm:table-cell">{t.pointsAgainst.toFixed(1)}</td>
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
        <span>Rank is ESPN&apos;s standings order. The data doesn&apos;t include the playoff team count, so no cut line is drawn.</span>
        <Link href="/insights" className="font-semibold text-turf hover:underline">
          Power rankings & luck →
        </Link>
      </div>
    </>
  );
}
