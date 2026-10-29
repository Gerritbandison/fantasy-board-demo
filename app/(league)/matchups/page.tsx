import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/league/bits";
import { cn } from "@/lib/utils";
import { boardForMatchup, ordinal, snapshot, type MatchupSide } from "@/lib/league";

export const metadata: Metadata = {
  title: "Matchups",
  description: "Week 8 featured matchups in the Chicken league with projected scores.",
};

export default function MatchupsPage() {
  return (
    <>
      <PageHeading eyebrow={`Week ${snapshot.league.week} slate`} title="Matchups">
        <p className="mt-2 text-sm text-zinc-400 tv:text-2xl">
          Featured games with full lineups in this snapshot. Tap one to open its board.
        </p>
      </PageHeading>

      <ul className="grid gap-3 lg:grid-cols-2 tv:gap-6">
        {snapshot.matchups.map((m) => {
          const board = boardForMatchup(m);
          const sides = [m.away, m.home];
          const leader = m.home.projected >= m.away.projected ? m.home.teamId : m.away.teamId;
          const content = (
            <>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500 tv:text-lg">
                <span>Projected</span>
                {board && (
                  <span className="flex items-center gap-1 text-emerald-300">
                    {board.manager}&apos;s board <ChevronRight className="size-3.5" />
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-2 tv:gap-4">
                {sides.map((s) => (
                  <ScoreLine key={s.teamId} side={s} leading={s.teamId === leader} />
                ))}
              </div>
            </>
          );
          const className =
            "block rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/10 transition-colors hover:bg-zinc-900/90 hover:ring-emerald-400/30 tv:p-8";
          return (
            <li key={m.id}>
              {board ? (
                <Link href={board.path} className={className}>
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ScoreLine({ side, leading }: { side: MatchupSide; leading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className={cn("font-display text-xl leading-tight font-bold uppercase tracking-wide break-words tv:text-4xl", leading ? "text-white" : "text-zinc-400")}>
          {side.teamName}
        </p>
        <p className="text-xs text-zinc-500 tv:text-xl">
          {side.record} · {ordinal(side.rank)}
        </p>
      </div>
      <span className={cn("font-display text-4xl font-extrabold tabular-nums tv:text-7xl", leading ? "text-emerald-300" : "text-zinc-500")}>
        {side.projected.toFixed(1)}
      </span>
    </div>
  );
}
