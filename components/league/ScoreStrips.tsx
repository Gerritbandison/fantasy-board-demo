import Link from "next/link";
import { LEAGUE, team, teamPath } from "@/lib/league";
import { liveBoard } from "@/lib/live-board";
import { diffSnapshot } from "@/lib/snapshot";
import { loadPriorSnapshot } from "@/lib/snapshot-store";
import { Card } from "./ui";

function resultLine(game: { week: number; homeId: number; awayId: number; winnerId: number | null }) {
  if (game.winnerId == null) return `Week ${game.week} is undecided`;
  const loser = game.winnerId === game.homeId ? game.awayId : game.homeId;
  return `${team(game.winnerId).name} def. ${team(loser).name}`;
}

/** Week-over-week movement against the prior week's snapshot. Renders nothing when no changes exist. */
export function SinceUpdate() {
  const prior = loadPriorSnapshot(LEAGUE.week, LEAGUE.generatedAt);
  const diff = diffSnapshot(prior, liveBoard());
  if (!diff.available) return null;

  const hasMovers = diff.movers.length > 0;
  const hasResults = diff.newResults.length > 0;
  const hasAdds = diff.notableAdds.length > 0;
  if (!hasMovers && !hasResults && !hasAdds) return null;

  const sections: { key: string; label: string; href: string; content: React.ReactNode }[] = [
    ...(hasMovers
      ? [
          {
            key: "movers",
            label: "Biggest movers",
            href: "/playoffs",
            content: (
              <ul className="mt-1.5 grid gap-1 text-sm text-slate-700">
                {diff.movers.slice(0, 3).map((row) => {
                  const bits = [
                    row.powerDelta !== 0 ? `power ${row.powerDelta > 0 ? "▲" : "▼"}${Math.abs(row.powerDelta)}` : null,
                    row.playoffOddsDelta !== 0
                      ? `odds ${row.playoffOddsDelta > 0 ? "+" : "−"}${(Math.abs(row.playoffOddsDelta) * 100).toFixed(1)} pts`
                      : null,
                  ].filter(Boolean);
                  return (
                    <li key={row.teamId} className="truncate">
                      <Link href={teamPath(row.teamId)} className="font-semibold text-navy hover:underline">
                        {team(row.teamId).name}
                      </Link>{" "}
                      <span className="text-xs font-medium text-slate-600 tabular-nums">({bits.join(", ")})</span>
                    </li>
                  );
                })}
              </ul>
            ),
          },
        ]
      : []),
    ...(hasResults
      ? [
          {
            key: "results",
            label: `Week ${diff.newResults[0].week} finals`,
            href: "/standings",
            content: (
              <ul className="mt-1.5 grid gap-1 text-sm text-slate-700">
                {diff.newResults.slice(0, 3).map((g) => (
                  <li key={`${g.week}-${g.homeId}-${g.awayId}`} className="truncate">
                    {resultLine(g)}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(hasAdds
      ? [
          {
            key: "adds",
            label: "Latest wire pickups",
            href: "/moves",
            content: (
              <ul className="mt-1.5 grid gap-1 text-sm text-slate-700">
                {diff.notableAdds.slice(0, 3).map((move, i) => (
                  <li key={`${move.teamId}-${i}`} className="truncate">
                    <Link href={teamPath(move.teamId)} className="font-semibold text-navy hover:underline">
                      {team(move.teamId).abbrev}
                    </Link>{" "}
                    <span className="text-turf-dark">+</span> {move.added.join(", ")}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card title={`Since Week ${diff.week}`} action={<Link href="/moves" className="text-turf hover:underline">Full wire →</Link>} bodyClassName="p-0 sm:p-0">
      <div
        className={`grid divide-y divide-line md:divide-x md:divide-y-0 ${
          sections.length === 3 ? "md:grid-cols-3" : sections.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        {sections.map((sec) => (
          <div key={sec.key} className="min-w-0 p-4 sm:p-5">
            <Link href={sec.href} className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase hover:text-navy">
              {sec.label} →
            </Link>
            {sec.content}
          </div>
        ))}
      </div>
    </Card>
  );
}
