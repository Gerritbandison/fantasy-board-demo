import Link from "next/link";
import { Hourglass } from "lucide-react";
import { BIGGEST_WINS, BIGGEST_WINS_SCOPE, PENDING_BIGGEST_WINS, type ShownWinSide } from "@/lib/biggest-wins";
import { ordinal, teamPath } from "@/lib/league";
import { cn } from "@/lib/utils";
import { Card, RankBadge, SectionHeading, TeamAvatar } from "./ui";

const points = (n: number) => n.toFixed(2);

function Side({ label, side }: { label: "Winner" | "Loser"; side: ShownWinSide }) {
  const detail = [side.showCurrent ? `Now ${side.currentName}` : null, side.owner].filter(Boolean).join(" · ");
  const isWin = label === "Winner";
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-16 shrink-0 text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">{label}</span>
      <Link href={teamPath(side.teamId)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 hover:underline">
        <TeamAvatar teamId={side.teamId} size="xs" />
        <span className="min-w-0">
          <span className={cn("block text-sm leading-tight break-words", isWin ? "font-semibold text-navy" : "font-medium text-slate-600")}>
            {side.seasonName}
          </span>
          {detail && <span className="block text-xs leading-snug break-words text-slate-500">{detail}</span>}
        </span>
      </Link>
      <span className={cn("shrink-0 font-display text-base tabular-nums", isWin ? "font-bold text-navy" : "font-semibold text-slate-500")}>
        {points(side.score)}
      </span>
    </div>
  );
}

export function BiggestWins() {
  const scope = BIGGEST_WINS_SCOPE;
  if (BIGGEST_WINS.length === 0 && PENDING_BIGGEST_WINS.length === 0) return null;

  return (
    <>
      <SectionHeading
        id="biggest-wins"
        headingId="biggest-wins-title"
        title="Top 10 biggest wins"
        action={scope.from != null && scope.to != null ? `${scope.from}–${scope.to}` : undefined}
      />
      <p className="-mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        Largest single-week margin of victory in the regular season{scope.from != null && scope.to != null ? `, ${scope.from}–${scope.to}` : ""}. Playoffs and consolation games are not included.
      </p>

      {PENDING_BIGGEST_WINS.map((game) => (
        <aside
          key={`${game.season}-${game.week}-${game.winner.teamId}-${game.loser.teamId}`}
          aria-label="Pending result, not yet final"
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
              <span className="block font-display text-2xl leading-none font-extrabold text-turf-dark tabular-nums">+{points(game.margin)}</span>
              <span className="text-[10px] font-bold tracking-wider text-warn uppercase">Margin</span>
            </p>
          </div>
          <div className="mt-2.5 grid gap-1.5 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-warn-border/70">
            <Side label="Winner" side={game.winner} />
            <Side label="Loser" side={game.loser} />
          </div>
          <p className="mt-2 text-xs leading-snug font-medium text-slate-700">
            This week is still in progress, so this game is not in the ranking. If the margin holds, it would be {ordinal(game.wouldRank)}.
          </p>
        </aside>
      ))}

      <Card bodyClassName="p-0 sm:p-0">
        <ol aria-labelledby="biggest-wins-title" className="divide-y divide-line lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {BIGGEST_WINS.map((game, idx) => (
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
                <span className="rounded-md bg-turf-light px-2 py-0.5 font-display text-lg leading-tight font-extrabold text-turf-dark tabular-nums ring-1 ring-turf-border ring-inset">
                  +{points(game.margin)}
                </span>
              </div>
              <div className="mt-2.5 grid gap-1.5 rounded-xl bg-surface-subtle/70 px-3 py-2 ring-1 ring-line/70">
                <Side label="Winner" side={game.winner} />
                <Side label="Loser" side={game.loser} />
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <p className="-mt-2 text-xs leading-relaxed text-slate-600">
        {scope.games} regular-season games. 10th is {points(scope.tenth)} and the next is {points(scope.nextMargin)} ({scope.nextSeason} week {scope.nextWeek})
        {scope.tie ? ", a tie at the cutoff." : ", so the last spot is not a tie."} A name is the one used that season. Now is the franchise today, when that name differs.
      </p>
    </>
  );
}
