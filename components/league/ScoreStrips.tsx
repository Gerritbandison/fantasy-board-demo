import { team } from "@/lib/league";
import { liveBoard } from "@/lib/live-board";
import { diffSnapshot } from "@/lib/snapshot";
import { loadLatestSnapshot } from "@/lib/snapshot-store";
import { Card } from "./ui";

function resultLine(game: { week: number; homeId: number; awayId: number; winnerId: number | null }) {
  if (game.winnerId == null) return `Week ${game.week} is undecided`;
  const loser = game.winnerId === game.homeId ? game.awayId : game.homeId;
  return `Week ${game.week}: ${team(game.winnerId).name} beat ${team(loser).name}`;
}

/** Week-over-week notes from the newest snapshot. A missing file is one line, not a card. */
export function SinceUpdate() {
  const prior = loadLatestSnapshot();
  const diff = diffSnapshot(prior, liveBoard());
  if (!diff.available) {
    return <p className="text-sm leading-snug text-slate-600">No earlier snapshot is saved, so movement since the last update is not on the board yet.</p>;
  }
  return (
    <Card title="Since last update" action={`Week ${diff.week} snapshot`}>
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
    </Card>
  );
}
