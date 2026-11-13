import { team } from "@/lib/league";
import {
  consolationLine,
  consolationSeries,
  PLAYOFF_SEASONS,
  playoffRecord,
  winnersLine,
  winnersResume,
  winnersRoundLabel,
  winnersSeries,
} from "@/lib/playoff-h2h";
import { cn } from "@/lib/utils";
import { Card, ResultChip } from "./ui";

/**
 * Winners-bracket series for the pair on a matchup. Nothing when they have never met there.
 * `leftId` is the team listed first, and the record is from that side.
 * `detail` adds the consolation record on the head-to-head card.
 */
export function PlayoffSeriesNote({
  leftId,
  rightId,
  detail = false,
  onDark = false,
  className,
}: {
  leftId: number;
  rightId: number;
  detail?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  const series = winnersSeries(leftId, rightId);
  if (!series) return null;
  const line = winnersLine(series, leftId, (id) => team(id).name);
  const consolation = detail ? consolationSeries(leftId, rightId) : null;
  return (
    <div className={className}>
      <p
        className={cn(
          "rounded-lg px-2.5 py-1.5 text-xs leading-snug break-words ring-1 ring-inset",
          onDark ? "bg-white/8 text-white/90 ring-white/15" : "bg-surface-subtle text-slate-700 ring-line",
        )}
      >
        <span className={cn("font-bold tracking-wide uppercase", onDark ? "text-gold" : "text-navy")}>Playoffs · </span>
        {line.record} ({line.last})
      </p>
      {consolation && <p className="mt-1 text-xs leading-snug break-words text-slate-600">{consolationLine(consolation, leftId)}</p>}
    </div>
  );
}

/** Winners-bracket record and the seasons a franchise actually played in it. */
export function TeamPlayoffHistory({ teamId }: { teamId: number }) {
  const resume = winnersResume(teamId);
  const [first, last] = [PLAYOFF_SEASONS[0], PLAYOFF_SEASONS[PLAYOFF_SEASONS.length - 1]];
  return (
    <Card title="Playoff history" action="Winners bracket">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-3xl leading-none font-extrabold text-navy tabular-nums">{playoffRecord(resume)}</p>
        <p className="text-xs font-medium text-slate-600">
          {resume.seasons.length > 0 ? `Appeared in ${resume.seasons.join(", ")}` : `No winners-bracket games from ${first} through ${last}`}
        </p>
      </div>
      {resume.games.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {resume.games.map((game) => (
            <li key={`${game.season}-${game.matchupPeriod}-${game.opponentId}`} className="flex items-center gap-2.5 py-2.5 text-sm leading-snug break-words text-slate-700 last:pb-0">
              <ResultChip result={game.result} />
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-navy">
                  {game.season} {winnersRoundLabel(game.championship)}
                </span>
                <span className="text-slate-600">
                  {" · "}
                  {game.result === "W" ? "defeated" : game.result === "T" ? "tied" : "lost to"} {team(game.opponentId).name}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
