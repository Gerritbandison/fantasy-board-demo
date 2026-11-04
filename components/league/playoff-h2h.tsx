import { team } from "@/lib/league";
import { consolationLine, consolationSeries, PLAYOFF_SEASONS, playoffRecord, winnersLine, winnersResume, winnersRoundLabel, winnersSeries } from "@/lib/playoff-h2h";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

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
      <p className={cn("text-sm leading-snug break-words", onDark ? "text-white/90" : "text-slate-700")}>
        <span className={cn("font-semibold", onDark ? "text-white" : "text-navy")}>Playoffs: </span>
        {line.record} ({line.last})
      </p>
      {consolation && <p className="mt-0.5 text-xs leading-snug break-words text-slate-600">{consolationLine(consolation, leftId)}</p>}
    </div>
  );
}

/** Winners-bracket record and the seasons a franchise actually played in it. */
export function TeamPlayoffHistory({ teamId }: { teamId: number }) {
  const resume = winnersResume(teamId);
  const [first, last] = [PLAYOFF_SEASONS[0], PLAYOFF_SEASONS[PLAYOFF_SEASONS.length - 1]];
  return (
    <Card title="Playoff history">
      <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Winners bracket</p>
      <p className="mt-1 font-display text-3xl leading-none font-extrabold text-navy tabular-nums">{playoffRecord(resume)}</p>
      <p className="mt-2 text-sm leading-snug break-words text-slate-600">
        {resume.seasons.length > 0 ? `Appeared in ${resume.seasons.join(", ")}.` : `No winners-bracket games from ${first} through ${last}.`}
      </p>
      {resume.games.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {resume.games.map((game) => (
            <li key={`${game.season}-${game.matchupPeriod}-${game.opponentId}`} className="py-2 text-sm leading-snug break-words text-slate-700">
              <span className="font-semibold text-navy">
                {game.season} {winnersRoundLabel(game.championship)}
              </span>
              {" · "}
              {game.result === "W" ? "Won vs" : game.result === "T" ? "Tied" : "Lost to"} {team(game.opponentId).name}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
