import Link from "next/link";
import { LEAGUE, PROJECTION_GAPS, team, teamPath } from "@/lib/league";
import { liveBoard } from "@/lib/live-board";
import { diffSnapshot } from "@/lib/snapshot";
import { loadLatestSnapshot } from "@/lib/snapshot-store";
import { Card } from "./ui";

function signed(n: number) {
  const text = Math.abs(n).toFixed(2);
  if (n > 0) return `+${text}`;
  if (n < 0) return `−${text}`;
  return text;
}

/** Actual minus the projection already stored on each current-week game. */
export function ProjectionStrip() {
  if (PROJECTION_GAPS.length === 0) return null;
  return (
    <Card title="Projection vs actual" action={`Week ${LEAGUE.week}`}>
      <ul className="grid gap-3">
        {PROJECTION_GAPS.map((game) => (
          <li key={`${game.homeId}-${game.awayId}`} className="grid gap-1 border-b border-line pb-3 last:border-0 last:pb-0">
            {[
              { id: game.homeId, actual: game.homeActual, projected: game.homeProjected, delta: game.homeDelta },
              { id: game.awayId, actual: game.awayActual, projected: game.awayProjected, delta: game.awayDelta },
            ].map((side) => (
              <p key={side.id} className="flex items-baseline gap-2 text-sm">
                <Link href={teamPath(side.id)} className="min-w-0 flex-1 font-semibold break-normal whitespace-normal text-navy hover:underline">
                  {team(side.id).name}
                </Link>
                <span className="shrink-0 text-right text-slate-700 tabular-nums">
                  <span className="font-semibold text-navy">{side.actual.toFixed(2)}</span>
                  <span className="text-slate-600"> vs {side.projected.toFixed(2)}</span>
                  <span className={side.delta >= 0 ? "font-semibold text-turf" : "font-semibold text-loss"}> {signed(side.delta)}</span>
                </span>
              </p>
            ))}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">The gap is the score minus the projection on that game. A positive number beat the projection.</p>
    </Card>
  );
}

function resultLine(game: { week: number; homeId: number; awayId: number; winnerId: number | null }) {
  if (game.winnerId == null) return `Week ${game.week} is undecided`;
  const loser = game.winnerId === game.homeId ? game.awayId : game.homeId;
  return `Week ${game.week}: ${team(game.winnerId).name} beat ${team(loser).name}`;
}

/** Week-over-week notes from the newest snapshot. Quiet when that file is not written yet. */
export function SinceUpdate() {
  const prior = loadLatestSnapshot();
  const diff = diffSnapshot(prior, liveBoard());
  return (
    <Card title="Since last update" action={diff.available ? `Week ${diff.week} snapshot` : "No snapshot"}>
      {!diff.available ? (
        <p className="text-sm leading-snug text-slate-600">No earlier snapshot is saved, so movement since the last update is not on the board yet.</p>
      ) : (
        <div className="grid gap-3 text-sm leading-snug text-slate-700">
          <p>
            <span className="font-semibold text-navy">Biggest movers. </span>
            {diff.movers.length === 0
              ? "Power rank, playoff odds, and projected rank are unchanged."
              : `${diff.movers
                  .slice(0, 3)
                  .map((row) => {
                    const bits = [
                      row.powerDelta !== 0 ? `power ${row.powerDelta > 0 ? "up" : "down"} ${Math.abs(row.powerDelta)}` : null,
                      row.playoffOddsDelta !== 0 ? `odds ${row.playoffOddsDelta > 0 ? "+" : "−"}${(Math.abs(row.playoffOddsDelta) * 100).toFixed(1)}` : null,
                    ].filter(Boolean);
                    return `${team(row.teamId).name} (${bits.join(", ")})`;
                  })
                  .join(". ")}.`}
          </p>
          <p>
            <span className="font-semibold text-navy">New results. </span>
            {diff.newResults.length === 0 ? "No new final." : `${diff.newResults.slice(0, 3).map(resultLine).join(". ")}.`}
          </p>
          <p>
            <span className="font-semibold text-navy">Notable adds. </span>
            {diff.notableAdds.length === 0
              ? "No new waiver or add."
              : `${diff.notableAdds
                  .slice(0, 3)
                  .map((move) => `${team(move.teamId).name} added ${move.added.join(", ") || "nobody"}`)
                  .join(". ")}.`}
          </p>
        </div>
      )}
    </Card>
  );
}
