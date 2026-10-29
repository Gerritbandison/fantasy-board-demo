import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { LuckChip, PageHead } from "@/components/league/hud";
import { cn } from "@/lib/utils";
import { callsign, getLuck } from "@/lib/intel";
import { boardForTeam, formatRecord, PLAYOFF_SEEDS, snapshot } from "@/lib/league";

export const metadata: Metadata = {
  title: "Standings",
  description: "Chicken league standings after week 7: record, points for and against, luck index, playoff seed.",
};

/** Mirrors the header cells so full-width rows don't make hidden columns reserve space. */
const COLUMN_VISIBILITY = ["", "", "", "sm:hidden", "hidden sm:table-cell", "hidden sm:table-cell", "hidden md:table-cell", "hidden md:table-cell", ""];

export default function StandingsPage() {
  const rows = [...snapshot.standings].sort((a, b) => a.rank - b.rank);
  const maxPf = Math.max(...rows.map((r) => r.pointsFor));
  const minPf = Math.min(...rows.map((r) => r.pointsFor));

  return (
    <>
      <PageHead
        code={`TBL // ${snapshot.league.name} ${snapshot.league.season} · after wk ${snapshot.league.week - 1}`}
        title="Standings"
        kicker={
          <>
            Top {PLAYOFF_SEEDS} seeds make the playoffs. The luck column compares scoring rank to record rank:{" "}
            <span className="font-mono text-xs text-phos">HOT</span> means the record is ahead of the points,{" "}
            <span className="font-mono text-xs text-sig">DUE</span> means the points are ahead of the record.
          </>
        }
      />

      <div className="hud-corners border border-white/[0.07] bg-panel/85">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[10px] tracking-[0.16em] text-dim uppercase">
              <th scope="col" className="w-9 py-2.5 pl-3 font-normal sm:w-12">#</th>
              <th scope="col" className="py-2.5 font-normal">Team</th>
              <th scope="col" className="w-10 py-2.5 text-right font-normal sm:w-14">W-L</th>
              <th scope="col" className="w-16 py-2.5 text-right font-normal sm:hidden">
                PF<span className="text-faint">/PA</span>
              </th>
              <th scope="col" className="hidden w-20 py-2.5 text-right font-normal sm:table-cell">PF</th>
              <th scope="col" className="hidden w-20 py-2.5 text-right font-normal sm:table-cell">PA</th>
              <th scope="col" className="hidden w-18 py-2.5 text-right font-normal md:table-cell">Diff</th>
              <th scope="col" className="hidden w-24 py-2.5 text-right font-normal md:table-cell">PF# / W#</th>
              <th scope="col" className="w-17 py-2.5 pr-3 text-right font-normal sm:w-24">Luck</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const board = boardForTeam(r.teamId);
              const luck = getLuck(r.teamId);
              const diff = r.pointsFor - r.pointsAgainst;
              const inPlayoffs = r.playoffSeed <= PLAYOFF_SEEDS;
              const cutLine = r.playoffSeed === PLAYOFF_SEEDS;
              return (
                <Fragment key={r.teamId}>
                <tr
                  className={cn(
                    "border-b border-white/[0.05] last:border-0",
                    board && "bg-phos/[0.05]",
                    !inPlayoffs && "text-zinc-500",
                  )}
                >
                  <td className="py-3 pl-3 align-top">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center font-mono text-xs font-semibold ring-1 ring-inset",
                        inPlayoffs ? "text-phos ring-phos/40" : "text-faint ring-white/10",
                      )}
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td className="py-3 pr-2 align-top">
                    {board ? (
                      <Link href={board.path} className="block leading-tight font-medium text-zinc-50 underline decoration-phos/50 underline-offset-4">
                        {r.teamName}
                      </Link>
                    ) : (
                      <span className={cn("block leading-tight font-medium", inPlayoffs ? "text-zinc-100" : "text-zinc-400")}>{r.teamName}</span>
                    )}
                    <span className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-wider whitespace-nowrap text-faint uppercase">
                      {callsign(r.teamId)} · S{r.playoffSeed}
                      <span className={cn("md:hidden", diff >= 0 ? "text-phos/80" : "text-sig/80")}>
                        {diff >= 0 ? "+" : "−"}
                        {Math.abs(diff).toFixed(1)}
                      </span>
                    </span>
                    <span className="mt-1.5 block h-0.5 bg-white/[0.06]" aria-hidden>
                      <span
                        className={cn("block h-full", inPlayoffs ? "bg-phos/70" : "bg-white/20")}
                        style={{ width: `${8 + ((r.pointsFor - minPf) / (maxPf - minPf)) * 92}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-3 text-right align-top font-mono text-sm font-medium text-zinc-100 tabular-nums">{formatRecord(r)}</td>
                  <td className="py-3 text-right align-top font-mono text-[13px] leading-tight tabular-nums sm:hidden">
                    <span className="block text-zinc-200">{r.pointsFor.toFixed(1)}</span>
                    <span className="block text-[11px] text-faint">{r.pointsAgainst.toFixed(1)}</span>
                  </td>
                  <td className="hidden py-3 text-right align-top font-mono text-sm text-zinc-200 tabular-nums sm:table-cell">{r.pointsFor.toFixed(1)}</td>
                  <td className="hidden py-3 text-right align-top font-mono text-sm text-dim tabular-nums sm:table-cell">{r.pointsAgainst.toFixed(1)}</td>
                  <td
                    className={cn(
                      "hidden py-3 text-right align-top font-mono text-sm tabular-nums md:table-cell",
                      diff >= 0 ? "text-phos" : "text-sig",
                    )}
                  >
                    {diff >= 0 ? "+" : "−"}
                    {Math.abs(diff).toFixed(1)}
                  </td>
                  <td className="hidden py-3 text-right align-top font-mono text-sm text-zinc-300 tabular-nums md:table-cell">
                    {luck ? (
                      <>
                        {luck.pfRank}
                        <span className="text-faint"> / </span>
                        {luck.winRank}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right align-top">{luck && <LuckChip row={luck} />}</td>
                </tr>
                {cutLine && (
                  <tr className="bg-hot/[0.06]">
                    {COLUMN_VISIBILITY.map((vis, i) => (
                      <td key={i} className={cn("border-y border-hot/60 py-1", vis, i === 0 && "pl-3")}>
                        {i === 1 && (
                          <span className="font-mono text-[9.5px] tracking-[0.22em] whitespace-nowrap text-hot uppercase">
                            ▲ Playoff cut · {PLAYOFF_SEEDS + 1}–{rows.length} out
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10.5px] tracking-wider text-dim uppercase">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-hot" /> Playoff cut after seed {PLAYOFF_SEEDS}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block size-2.5 bg-phos/30" /> Op boards
        </span>
        <Link href="/insights" className="text-sig hover:underline">
          Luck index detail ▸
        </Link>
      </div>
    </>
  );
}
