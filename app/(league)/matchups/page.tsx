import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { getBrief } from "@/lib/intel";
import { boardForMatchup, ordinal, snapshot, type MatchupSide } from "@/lib/league";

export const metadata: Metadata = {
  title: "Scores",
  description: "Week 8 featured matchups in the Chicken league with projected scores and previews.",
};

export default function MatchupsPage() {
  return (
    <>
      <PageHeader eyebrow={`Week ${snapshot.league.week} scoreboard`} title="Featured matchups">
        <p className="mt-2 text-[15px] text-slate-600">The games with full lineups this week. Tap one for the preview, tale of the tape, and lineups.</p>
      </PageHeader>

      <ul className="grid gap-5 lg:grid-cols-2">
        {snapshot.matchups.map((m) => {
          const board = boardForMatchup(m);
          const brief = getBrief(m.slug);
          const leader = m.home.projected >= m.away.projected ? m.home.teamId : m.away.teamId;
          return (
            <Card key={m.id} as="li" action="Projected" title={`Week ${snapshot.league.week}`}>
              <div className="grid gap-3">
                {[m.away, m.home].map((s) => (
                  <ScoreLine key={s.teamId} side={s} leading={s.teamId === leader} />
                ))}
              </div>
              {brief && <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-slate-600">{brief.story}</p>}
              {board && (
                <Link href={board.path} className="mt-4 inline-flex h-10 items-center rounded-full bg-turf px-4 text-sm font-semibold text-white hover:bg-turf-dark">
                  Open {board.manager}&apos;s matchup →
                </Link>
              )}
            </Card>
          );
        })}
      </ul>
    </>
  );
}

function ScoreLine({ side, leading }: { side: MatchupSide; leading: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <TeamAvatar teamId={side.teamId} />
      <div className="min-w-0 flex-1">
        <p className={cn("leading-tight font-semibold break-words", leading ? "text-navy" : "text-slate-500")}>{side.teamName}</p>
        <p className="text-xs text-slate-500">
          {side.record} · {ordinal(side.rank)}
        </p>
      </div>
      <span className={cn("font-display text-3xl font-bold tabular-nums", leading ? "text-turf" : "text-slate-400")}>{side.projected.toFixed(1)}</span>
    </div>
  );
}
