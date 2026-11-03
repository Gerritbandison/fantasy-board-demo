import Link from "next/link";
import { Hourglass } from "lucide-react";
import { HIGH_SCORE_SCOPE, HIGH_SCORES, PENDING_HIGH_SCORES, type HighScore } from "@/lib/top-scores";
import { ordinal, teamPath } from "@/lib/league";
import type { ShownWinSide } from "@/lib/biggest-wins";
import { Card, SectionHeading, TeamAvatar } from "./ui";

const points = (n: number) => n.toFixed(2);

function Side({ label, side }: { label: string; side: ShownWinSide }) {
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

function ScoreBody({ row }: { row: Pick<HighScore, "team" | "opponent" | "result"> }) {
  return (
    <div className="mt-2 grid gap-1.5">
      <Side label="Team" side={row.team} />
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
      <p className="-mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
        Highest score by one team in a regular-season week, 2020 through the last final week. Playoffs and consolation games are not included.
      </p>

      {PENDING_HIGH_SCORES.map((game) => (
        <aside key={`${game.season}-${game.week}-${game.team.teamId}`} aria-label="Pending score, not yet final" className="rounded-2xl bg-gold-light px-4 py-3 ring-1 ring-amber-200 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
              <Hourglass className="size-3.5 shrink-0" aria-hidden />
              Pending · not yet final
            </p>
            <p className="text-right">
              <span className="block font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{points(game.team.score)}</span>
              <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">Points</span>
            </p>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            {game.season} · Week {game.week}
          </p>
          <div className="mt-2 grid gap-1.5">
            <Side label="Team" side={game.team} />
            <Side label="Opponent" side={game.opponent} />
          </div>
          <p className="mt-2 text-sm leading-snug text-slate-800">
            This week is still in progress, so this score is not in the ranking. If it holds, it would be {ordinal(game.wouldRank)}.
          </p>
        </aside>
      ))}

      <Card bodyClassName="p-0 sm:p-0">
        <ol aria-labelledby="high-scores-title" className="divide-y divide-line">
          {HIGH_SCORES.map((game) => (
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
                  <span className="block font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{points(game.team.score)}</span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">Points</span>
                </p>
              </div>
              <ScoreBody row={game} />
            </li>
          ))}
        </ol>
      </Card>

      <p className="-mt-2 text-xs leading-relaxed text-slate-600">
        20th is {points(scope.twentieth)} and the next is {points(scope.next)}
        {scope.tie ? ", a tie at the cutoff." : ", so the last spot is not a tie."} A name is the one used that season. Now is the franchise today, when that name differs. An owner nickname is shown only for a slot the app already labels.
      </p>
    </>
  );
}
