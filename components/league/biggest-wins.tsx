import Link from "next/link";
import { Hourglass } from "lucide-react";
import { BIGGEST_WINS, BIGGEST_WINS_SCOPE, PENDING_BIGGEST_WINS, type ShownWinSide } from "@/lib/biggest-wins";
import { ordinal, teamPath } from "@/lib/league";
import { Card, SectionHeading, TeamAvatar } from "./ui";

const points = (n: number) => n.toFixed(2);

function Side({ label, side }: { label: "Winner" | "Loser"; side: ShownWinSide }) {
  const detail = [side.showCurrent ? `Now ${side.currentName}` : null, side.owner].filter(Boolean).join(" · ");
  return (
    <div className="flex items-start gap-2">
      <span className="w-16 shrink-0 pt-2 text-[10px] font-bold tracking-wider text-slate-600 uppercase">{label}</span>
      <Link href={teamPath(side.teamId)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 hover:bg-slate-50">
        <TeamAvatar teamId={side.teamId} size="sm" />
        <span className="min-w-0">
          <span className="block text-sm leading-tight font-semibold break-words text-navy">{side.seasonName}</span>
          {detail && <span className="block text-xs leading-snug break-words text-slate-600">{detail}</span>}
        </span>
      </Link>
      <span className="shrink-0 pt-1.5 text-sm font-semibold text-navy tabular-nums">{points(side.score)}</span>
    </div>
  );
}

export function BiggestWins() {
  const scope = BIGGEST_WINS_SCOPE;
  if (BIGGEST_WINS.length === 0 && PENDING_BIGGEST_WINS.length === 0) return null;

  return (
    <>
      <SectionHeading id="biggest-wins" headingId="biggest-wins-title" title="Top 10 biggest wins" action={scope.from != null && scope.to != null ? `${scope.from}–${scope.to}` : undefined} />
      <p className="-mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
        Largest single-week margin of victory in the regular season{scope.from != null && scope.to != null ? `, ${scope.from}–${scope.to}` : ""}. Playoffs and consolation games are not included.
      </p>

      {PENDING_BIGGEST_WINS.map((game) => (
        <aside key={`${game.season}-${game.week}-${game.winner.teamId}-${game.loser.teamId}`} aria-label="Pending result, not yet final" className="rounded-2xl bg-gold-light px-4 py-3 ring-1 ring-amber-200 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
              <Hourglass className="size-3.5 shrink-0" aria-hidden />
              Pending · not yet final
            </p>
            <p className="text-right">
              <span className="block font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{points(game.margin)}</span>
              <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">Margin</span>
            </p>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            {game.season} · Week {game.week}
          </p>
          <div className="mt-2 grid gap-1.5">
            <Side label="Winner" side={game.winner} />
            <Side label="Loser" side={game.loser} />
          </div>
          <p className="mt-2 text-sm leading-snug text-slate-800">
            This week is still in progress, so this game is not in the ranking. If the margin holds, it would be {ordinal(game.wouldRank)}.
          </p>
        </aside>
      ))}

      <Card bodyClassName="p-0 sm:p-0">
        <ol aria-labelledby="biggest-wins-title" className="divide-y divide-line">
          {BIGGEST_WINS.map((game) => (
            <li key={game.gameId} className="px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">
                  <span className="font-display text-2xl font-extrabold text-gold-ink tabular-nums">
                    <span className="sr-only">Rank </span>
                    {game.rank}
                  </span>
                  <span className="ml-2">
                    {game.season} · Week {game.week}
                  </span>
                </p>
                <p className="text-right">
                  <span className="block font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{points(game.margin)}</span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">Margin</span>
                </p>
              </div>
              <div className="mt-2 grid gap-1.5">
                <Side label="Winner" side={game.winner} />
                <Side label="Loser" side={game.loser} />
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <p className="-mt-2 text-xs leading-relaxed text-slate-600">
        {scope.games} regular-season games. 10th is {points(scope.tenth)} and the next is {points(scope.nextMargin)} ({scope.nextSeason} week {scope.nextWeek})
        {scope.tie ? ", a tie at the cutoff." : ", so the last spot is not a tie."} A name is the one used that season. Now is the franchise today, when that name differs. An owner nickname is shown only for a slot the app already labels.
      </p>
    </>
  );
}
