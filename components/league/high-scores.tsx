import Link from "next/link";
import { Hourglass } from "lucide-react";
import { HIGH_SCORE_SCOPE, HIGH_SCORES, PENDING_HIGH_SCORES, type HighScore } from "@/lib/top-scores";
import { ordinal, teamPath } from "@/lib/league";
import type { ShownWinSide } from "@/lib/biggest-wins";
import { cn } from "@/lib/utils";
import { Card, RankBadge, SectionHeading, TeamAvatar } from "./ui";

const points = (n: number) => n.toFixed(2);

function Side({ label, side, primary }: { label: string; side: ShownWinSide; primary?: boolean }) {
  const detail = [side.showCurrent ? `Now ${side.currentName}` : null, side.owner].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-16 shrink-0 text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">{label}</span>
      <Link href={teamPath(side.teamId)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 hover:underline">
        <TeamAvatar teamId={side.teamId} size="xs" />
        <span className="min-w-0">
          <span className={cn("block text-sm leading-tight break-words", primary ? "font-semibold text-navy" : "font-medium text-slate-600")}>
            {side.seasonName}
          </span>
          {detail && <span className="block text-xs leading-snug break-words text-slate-500">{detail}</span>}
        </span>
      </Link>
      <span className={cn("shrink-0 font-display text-base tabular-nums", primary ? "font-bold text-navy" : "font-semibold text-slate-500")}>
        {points(side.score)}
      </span>
    </div>
  );
}

function ScoreBody({ row }: { row: Pick<HighScore, "team" | "opponent" | "result"> }) {
  return (
    <div className="mt-2.5 grid gap-1.5 rounded-xl bg-surface-subtle/70 px-3 py-2 ring-1 ring-line/70">
      <Side label="Team" side={row.team} primary />
      <Side label={row.result === "W" ? "Beat" : "Lost to"} side={row.opponent} />
    </div>
  );
}

export function HighScores() {
  const scope = HIGH_SCORE_SCOPE;
  if (HIGH_SCORES.length === 0 && PENDING_HIGH_SCORES.length === 0) return null;

  return (
    <>
      <SectionHeading id="high-scores" headingId="high-scores-title" title="Top 20 most points" action="Single week" />
      <p className="-mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Highest score by one team in a regular-season week, 2020 through the last final week. Playoffs and consolation games are not included.
      </p>

      {PENDING_HIGH_SCORES.map((game) => (
        <aside
          key={`${game.season}-${game.week}-${game.team.teamId}`}
          aria-label="Pending score, not yet final"
          className="rounded-2xl bg-warn-light px-4 py-3.5 ring-1 ring-warn-border sm:px-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 font-display text-xs font-bold tracking-wider text-warn uppercase">
                <Hourglass className="size-3.5 shrink-0" aria-hidden />
                Pending · not yet final
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">
                {game.season} · Week {game.week}
              </p>
            </div>
            <p className="text-right">
              <span className="block font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{points(game.team.score)}</span>
              <span className="text-[10px] font-bold tracking-wider text-warn uppercase">Points</span>
            </p>
          </div>
          <div className="mt-2.5 grid gap-1.5 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-warn-border/70">
            <Side label="Team" side={game.team} primary />
            <Side label="Opponent" side={game.opponent} />
          </div>
          <p className="mt-2 text-xs leading-snug font-medium text-slate-700">
            This week is still in progress, so this score is not in the ranking. If it holds, it would be {ordinal(game.wouldRank)}.
          </p>
        </aside>
      ))}

      <Card bodyClassName="p-0 sm:p-0">
        <ol aria-labelledby="high-scores-title" className="divide-y divide-line lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {HIGH_SCORES.map((game, idx) => (
            <li
              key={game.gameId}
              className={cn(
                "px-4 py-3.5 sm:px-5",
                idx >= 2 && "lg:border-t lg:border-line",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <RankBadge rank={game.rank} highlight={game.rank === 1 ? "gold" : game.rank <= 3 ? "turf" : "plain"} />
                  <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                    {game.season} · Week {game.week}
                  </span>
                </div>
                <p className="text-right">
                  <span className="font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{points(game.team.score)}</span>
                  <span className="ml-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">pts</span>
                </p>
              </div>
              <ScoreBody row={game} />
            </li>
          ))}
        </ol>
      </Card>

      <p className="-mt-2 text-xs leading-relaxed text-slate-600">
        20th is {points(scope.twentieth)} and the next is {points(scope.next)}
        {scope.tie ? ", a tie at the cutoff." : ", so the last spot is not a tie."} A name is the one used that season. Now is the franchise today, when that name differs.
      </p>
    </>
  );
}
