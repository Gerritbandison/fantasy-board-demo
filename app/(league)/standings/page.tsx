import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/league/bits";
import { cn } from "@/lib/utils";
import { boardForTeam, formatRecord, PLAYOFF_SEEDS, snapshot } from "@/lib/league";

export const metadata: Metadata = {
  title: "Standings",
  description: "Chicken league standings after week 7: record, points for and against, playoff seed.",
};

export default function StandingsPage() {
  const rows = [...snapshot.standings].sort((a, b) => a.rank - b.rank);
  const maxPf = Math.max(...rows.map((r) => r.pointsFor));

  return (
    <>
      <PageHeading eyebrow={`${snapshot.league.name} · ${snapshot.league.season}`} title="Standings">
        <p className="mt-2 text-sm text-zinc-400 tv:text-2xl">
          Top {PLAYOFF_SEEDS} seeds make the playoffs. Tap a highlighted team to open its board.
        </p>
      </PageHeading>

      <div className="overflow-hidden rounded-2xl bg-zinc-900/60 ring-1 ring-white/10">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 tv:text-base">
              <th scope="col" className="w-10 py-3 pl-3 font-semibold sm:w-14 tv:w-24">#</th>
              <th scope="col" className="py-3 font-semibold">Team</th>
              <th scope="col" className="w-11 py-3 text-right font-semibold sm:w-16 tv:w-28">W-L</th>
              <th scope="col" className="w-18 py-3 pr-3 text-right font-semibold sm:hidden">
                PF<span className="text-zinc-600"> / PA</span>
              </th>
              <th scope="col" className="hidden w-20 py-3 text-right font-semibold sm:table-cell tv:w-36">PF</th>
              <th scope="col" className="hidden w-20 py-3 text-right font-semibold sm:table-cell tv:w-36">PA</th>
              <th scope="col" className="hidden w-20 py-3 text-right font-semibold sm:table-cell tv:w-36">Diff</th>
              <th scope="col" className="hidden w-16 py-3 pr-4 text-right font-semibold sm:table-cell tv:w-28">Seed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const board = boardForTeam(r.teamId);
              const diff = r.pointsFor - r.pointsAgainst;
              const inPlayoffs = r.playoffSeed <= PLAYOFF_SEEDS;
              const cutLine = r.playoffSeed === PLAYOFF_SEEDS;
              return (
                <tr
                  key={r.teamId}
                  className={cn(
                    "border-b border-white/5 last:border-0",
                    cutLine && "border-b-2 border-b-rose-500/50",
                    board && "bg-emerald-500/[0.07]",
                  )}
                >
                  <td className="py-3 pl-3 align-top">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-md font-display text-sm font-bold tv:size-10 tv:text-xl",
                        inPlayoffs ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-500",
                      )}
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td className="py-3 pr-2 align-top">
                    {board ? (
                      <Link href={board.path} className="block font-semibold leading-tight text-white underline decoration-emerald-400/50 underline-offset-4 tv:text-3xl">
                        {r.teamName}
                      </Link>
                    ) : (
                      <span className="block font-semibold leading-tight text-zinc-100 tv:text-3xl">{r.teamName}</span>
                    )}
                    <span className="mt-1 flex items-center gap-2 text-[10px] whitespace-nowrap uppercase tracking-wider text-zinc-500 sm:hidden">
                      Seed {r.playoffSeed}
                      <span className={diff >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)}
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-zinc-800" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                        style={{ width: `${(r.pointsFor / maxPf) * 100}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-3 text-right align-top font-display text-base font-bold tabular-nums text-zinc-100 tv:text-3xl">
                    {formatRecord(r)}
                  </td>
                  <td className="py-3 pr-3 text-right align-top text-sm leading-tight tabular-nums sm:hidden">
                    <span className="block text-zinc-100">{r.pointsFor.toFixed(1)}</span>
                    <span className="block text-xs text-zinc-500">{r.pointsAgainst.toFixed(1)}</span>
                  </td>
                  <td className="hidden py-3 text-right align-top text-sm tabular-nums text-zinc-200 sm:table-cell tv:text-2xl">
                    {r.pointsFor.toFixed(1)}
                  </td>
                  <td className="hidden py-3 text-right align-top text-sm tabular-nums text-zinc-400 sm:table-cell tv:text-2xl">
                    {r.pointsAgainst.toFixed(1)}
                  </td>
                  <td
                    className={cn(
                      "hidden py-3 text-right align-top text-sm tabular-nums sm:table-cell tv:text-2xl",
                      diff >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(1)}
                  </td>
                  <td className="hidden py-3 pr-4 text-right align-top font-display text-base font-bold text-zinc-300 sm:table-cell tv:text-3xl">
                    {r.playoffSeed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-2 text-xs text-zinc-500 tv:text-xl">
        <span className="inline-block h-0.5 w-6 bg-rose-500/60" /> Playoff cut line after seed {PLAYOFF_SEEDS}
      </p>
    </>
  );
}
