import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Card, LuckBadge, PageHeader, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { getLuck } from "@/lib/intel";
import { boardForTeam, formatRecord, PLAYOFF_SEEDS, snapshot } from "@/lib/league";

export const metadata: Metadata = {
  title: "Standings",
  description: "Chicken league standings after week 7: record, points for and against, luck, playoff seed.",
};

/** Mirrors the header cells so full-width rows don't make hidden columns reserve space. */
const COLUMN_VISIBILITY = ["", "", "", "sm:hidden", "hidden sm:table-cell", "hidden sm:table-cell", "hidden md:table-cell", "hidden md:table-cell", ""];

export default function StandingsPage() {
  const rows = [...snapshot.standings].sort((a, b) => a.rank - b.rank);

  return (
    <>
      <PageHeader eyebrow={`${snapshot.league.season} season · after week ${snapshot.league.week - 1}`} title="Standings">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Top {PLAYOFF_SEEDS} make the playoffs. <span className="font-semibold text-amber-800">Lucky (+)</span> teams have a better record than their
          points rank; <span className="font-semibold text-sky-800">unlucky (−)</span> teams have scored better than their record shows.
        </p>
      </PageHeader>

      <Card bodyClassName="p-0 sm:p-0">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-slate-50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
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
            {rows.map((r) => {
              const board = boardForTeam(r.teamId);
              const luck = getLuck(r.teamId);
              const diff = r.pointsFor - r.pointsAgainst;
              const inPlayoffs = r.playoffSeed <= PLAYOFF_SEEDS;
              return (
                <Fragment key={r.teamId}>
                  <tr className={cn("border-b border-line last:border-0", board && "bg-turf-light/40")}>
                    <td className="py-3 pl-3 align-middle sm:pl-4">
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full font-display text-sm font-bold",
                          inPlayoffs ? "bg-turf text-white" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {r.rank}
                      </span>
                    </td>
                    <td className="py-3 pr-2 align-middle">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <TeamAvatar teamId={r.teamId} size="sm" className="hidden sm:inline-flex" />
                        <span className="min-w-0">
                          {board ? (
                            <Link href={board.path} className="block leading-tight font-semibold break-words text-navy underline decoration-turf/40 underline-offset-4">
                              {r.teamName}
                            </Link>
                          ) : (
                            <span className="block leading-tight font-semibold break-words text-navy">{r.teamName}</span>
                          )}
                          <span className={cn("text-xs md:hidden", diff >= 0 ? "text-turf" : "text-loss")}>
                            {diff >= 0 ? "+" : "−"}
                            {Math.abs(diff).toFixed(1)} diff
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-right align-middle font-display text-lg font-bold text-navy tabular-nums">{formatRecord(r)}</td>
                    <td className="py-3 text-right align-middle text-sm leading-tight tabular-nums sm:hidden">
                      <span className="block font-semibold text-navy">{r.pointsFor.toFixed(1)}</span>
                      <span className="block text-xs text-slate-500">{r.pointsAgainst.toFixed(1)}</span>
                    </td>
                    <td className="hidden py-3 text-right align-middle font-semibold text-navy tabular-nums sm:table-cell">{r.pointsFor.toFixed(1)}</td>
                    <td className="hidden py-3 text-right align-middle text-slate-500 tabular-nums sm:table-cell">{r.pointsAgainst.toFixed(1)}</td>
                    <td className={cn("hidden py-3 text-right align-middle font-semibold tabular-nums md:table-cell", diff >= 0 ? "text-turf" : "text-loss")}>
                      {diff >= 0 ? "+" : "−"}
                      {Math.abs(diff).toFixed(1)}
                    </td>
                    <td className="hidden py-3 text-right align-middle text-slate-600 tabular-nums md:table-cell">{luck ? `#${luck.pfRank}` : "—"}</td>
                    <td className="py-3 pr-3 text-right align-middle sm:pr-4">{luck && <LuckBadge row={luck} compact />}</td>
                  </tr>
                  {r.playoffSeed === PLAYOFF_SEEDS && (
                    <tr>
                      {COLUMN_VISIBILITY.map((vis, i) => (
                        <td key={i} className={cn("border-y-2 border-dashed border-loss/50 bg-red-50/60 py-1", vis, i === 0 && "pl-3 sm:pl-4")}>
                          {i === 1 && <span className="text-[11px] font-bold tracking-wider whitespace-nowrap text-red-700 uppercase">Playoff line</span>}
                        </td>
                      ))}
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="inline-block size-3 rounded-full bg-turf" /> Playoff spot
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block size-3 rounded bg-turf-light" /> Featured teams
        </span>
        <Link href="/insights" className="font-semibold text-turf hover:underline">
          Luck & points-for breakdown →
        </Link>
      </div>
    </>
  );
}
