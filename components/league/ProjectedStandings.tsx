import { Fragment } from "react";
import Link from "next/link";
import { formatPct } from "@/lib/playoff-sim";
import { PROJECTED_AS_OF, PROJECTED_METHOD, PROJECTED_NOTE, PROJECTED_SPOTS, PROJECTED_STANDINGS, PROJECTED_WEEKS } from "@/lib/projected-standings";
import { team, teamPath, USER_TEAM } from "@/lib/league";
import { cn } from "@/lib/utils";
import { Card, RankBadge, TeamAvatar } from "./ui";

const one = (n: number) => n.toFixed(1);

function OddsMove({ delta }: { delta: number }) {
  const points = Math.abs(delta * 100).toFixed(1);
  const text = delta > 0 ? `+${points}` : delta < 0 ? `−${points}` : "0.0";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
        delta > 0 ? "bg-turf-light text-turf-dark" : delta < 0 ? "bg-loss-light text-loss" : "bg-surface-muted text-slate-600",
      )}
      title="Change in playoff odds since the last snapshot, in percentage points"
    >
      {text}
    </span>
  );
}

export function ProjectedStandings({ oddsDelta }: { oddsDelta?: Map<number, number> | null }) {
  return (
    <Card title="Projected standings" action={`Top ${PROJECTED_SPOTS} make playoffs`} bodyClassName="p-0 sm:p-0">
      <p className="border-b border-line/80 px-4 py-2.5 text-xs leading-relaxed text-slate-600 sm:px-5">
        As of {PROJECTED_AS_OF}. {PROJECTED_NOTE} Top {PROJECTED_SPOTS} over {PROJECTED_WEEKS} weeks make the playoffs.
      </p>
      <ol className="divide-y divide-line" aria-label="Projected final standings">
        {PROJECTED_STANDINGS.map((row) => {
          const franchise = team(row.teamId);
          const inField = row.rank <= PROJECTED_SPOTS;
          const isCut = row.rank === PROJECTED_SPOTS;
          const mine = row.teamId === USER_TEAM.id;
          return (
            <Fragment key={row.teamId}>
              <li
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle/60 sm:px-5",
                  mine && "bg-turf-light/35",
                )}
              >
                <RankBadge rank={row.rank} highlight={row.rank === 1 ? "gold" : inField ? "turf" : "plain"} />
                <TeamAvatar teamId={row.teamId} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link href={teamPath(row.teamId)} className="block leading-tight font-semibold break-words text-navy hover:underline">
                    {franchise.name}
                  </Link>
                  <p className="mt-0.5 text-xs leading-snug text-slate-600 tabular-nums">
                    <span className="font-semibold text-slate-700">{row.record}</span> now · {one(row.pointsFor)} PF
                    {franchise.owner ? ` · ${franchise.owner}` : ""}
                  </p>
                  <p className="text-xs leading-snug text-slate-500 tabular-nums">
                    Exp {one(row.expectedWins)}–{one(row.expectedLosses)} · {Math.round(row.expectedPoints)} PF
                  </p>
                </div>
                <div className="w-24 shrink-0 text-right sm:w-28">
                  <div className="flex items-baseline justify-end gap-1.5">
                    {oddsDelta?.has(row.teamId) && <OddsMove delta={oddsDelta.get(row.teamId) ?? 0} />}
                    <span className="font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{formatPct(row.playoffOdds)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted" role="presentation">
                    <div
                      className={cn("h-full rounded-full", inField ? "bg-turf" : "bg-slate-400")}
                      style={{ width: `${Math.max(3, Math.min(1, row.playoffOdds) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-slate-600 tabular-nums">#1 seed {formatPct(row.topSeedOdds)}</p>
                </div>
              </li>
              {isCut && (
                <li aria-hidden className="flex items-center gap-3 bg-surface-subtle px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-turf-dark uppercase sm:px-5">
                  <span className="h-px flex-1 bg-turf/35" />
                  <span>Top {PROJECTED_SPOTS} playoff cut line</span>
                  <span className="h-px flex-1 bg-turf/35" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      <p className="border-t border-line bg-surface-subtle/50 px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">{PROJECTED_METHOD}</p>
    </Card>
  );
}
