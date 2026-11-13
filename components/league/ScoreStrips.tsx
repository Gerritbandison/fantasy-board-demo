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
    <Card title="Since last update" action={`Week ${diff.week} snapshot`} bodyClassName="p-0 sm:p-0">
      <div className="grid divide-y divide-line text-sm leading-snug text-slate-700 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">Biggest movers</p>
          <p className="mt-1.5 text-slate-700">
            {diff.movers.length === 0
              ? "Power rank, playoff odds, and projected rank are unchanged."
              : `${diff.movers
                  .slice(0, 3)
                  .map((row) => {
                    const bits = [
                      row.powerDelta !== 0 ? `power ${row.powerDelta > 0 ? "▲" : "▼"}${Math.abs(row.powerDelta)}` : null,
                      row.playoffOddsDelta !== 0 ? `odds ${row.playoffOddsDelta > 0 ? "+" : "−"}${(Math.abs(row.playoffOddsDelta) * 100).toFixed(1)}` : null,
                    ].filter(Boolean);
                    return `${team(row.teamId).name} (${bits.join(", ")})`;
                  })
                  .join(" · ")}.`}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">New results</p>
          <p className="mt-1.5 text-slate-700">
            {diff.newResults.length === 0 ? "No new final since the snapshot." : `${diff.newResults.slice(0, 3).map(resultLine).join(". ")}.`}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">Notable adds</p>
          <p className="mt-1.5 text-slate-700">
            {diff.notableAdds.length === 0
              ? "No new waiver or free-agent add."
              : `${diff.notableAdds
                  .slice(0, 3)
                  .map((move) => `${team(move.teamId).name} added ${move.added.join(", ") || "nobody"}`)
                  .join(" · ")}.`}
          </p>
        </div>
      </div>
    </Card>
  );
}
