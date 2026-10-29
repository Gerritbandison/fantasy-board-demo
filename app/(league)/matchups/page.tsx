import type { Metadata } from "next";
import Link from "next/link";
import { DisplayName, Frame, PageHead } from "@/components/league/hud";
import { cn } from "@/lib/utils";
import { callsign, getBrief, weekCode } from "@/lib/intel";
import { boardForMatchup, ordinal, snapshot, type MatchupSide } from "@/lib/league";

export const metadata: Metadata = {
  title: "Slate",
  description: "Week 8 featured ops in the Chicken league: projections and the one-line brief for each.",
};

export default function MatchupsPage() {
  const wk = weekCode(snapshot.league.week);
  return (
    <>
      <PageHead
        code={`SLATE // Week ${wk}`}
        title="Featured ops"
        kicker="The games with full lineups on file this week. Open one for the brief, score trail, and head-to-head."
      />

      <ul className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {snapshot.matchups.map((m) => {
          const board = boardForMatchup(m);
          const brief = getBrief(m.slug);
          const leader = m.home.projected >= m.away.projected ? m.home.teamId : m.away.teamId;
          return (
            <Frame key={m.id} as="li" label={`${callsign(m.away.teamId)} @ ${callsign(m.home.teamId)}`} code={`OP-${wk}`} meta="Projected">
              <div className="grid gap-2">
                {[m.away, m.home].map((s) => (
                  <ScoreLine key={s.teamId} side={s} leading={s.teamId === leader} />
                ))}
              </div>
              {brief && <p className="mt-3 border-t border-dashed border-white/10 pt-3 text-sm leading-relaxed text-zinc-400">{brief.story}</p>}
              {board && (
                <Link
                  href={board.path}
                  className="mt-3 inline-flex h-9 items-center px-3 font-mono text-[11px] tracking-[0.18em] text-phos uppercase ring-1 ring-phos/40 ring-inset hover:bg-phos/10"
                >
                  {board.manager}&apos;s op board ▸
                </Link>
              )}
            </Frame>
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
        <p className={cn("font-display text-xl leading-tight font-semibold tracking-wide break-words uppercase", leading ? "text-zinc-50" : "text-zinc-400")}>
          <DisplayName text={side.teamName} />
        </p>
        <p className="font-mono text-[10px] tracking-wider text-faint uppercase">
          {callsign(side.teamId)} · {side.record} · {ordinal(side.rank)}
        </p>
      </div>
      <span className={cn("font-mono text-3xl tabular-nums", leading ? "text-phos glow-phos" : "text-zinc-500")}>{side.projected.toFixed(2)}</span>
    </div>
  );
}
