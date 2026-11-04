import Link from "next/link";
import { formatPct } from "@/lib/playoff-sim";
import { PROJECTED_AS_OF, PROJECTED_METHOD, PROJECTED_NOTE, PROJECTED_SPOTS, PROJECTED_STANDINGS, PROJECTED_WEEKS } from "@/lib/projected-standings";
import { team, teamPath } from "@/lib/league";
import { cn } from "@/lib/utils";
import { Card, TeamAvatar } from "./ui";

const one = (n: number) => n.toFixed(1);

function OddsMove({ delta }: { delta: number }) {
  const points = Math.abs(delta * 100).toFixed(1);
  const text = delta > 0 ? `+${points}` : delta < 0 ? `−${points}` : "0.0";
  return (
    <p className={`text-xs font-semibold tabular-nums ${delta > 0 ? "text-turf" : delta < 0 ? "text-loss" : "text-slate-600"}`} title="Change in playoff odds since the last snapshot, in percentage points">
      {text}
    </p>
  );
}

export function ProjectedStandings({ oddsDelta }: { oddsDelta?: Map<number, number> | null }) {
  return (
    <Card title="Projected standings" action={PROJECTED_AS_OF} bodyClassName="p-0 sm:p-0">
      <p className="px-4 pt-1 text-sm leading-snug text-slate-600 sm:px-5">
        As of {PROJECTED_AS_OF}. {PROJECTED_NOTE} Top {PROJECTED_SPOTS} of {PROJECTED_WEEKS} make it. Green ranks are in. The bar is playoff odds.
      </p>
      <ol className="mt-3 divide-y divide-line" aria-label="Projected final standings">
        {PROJECTED_STANDINGS.map((row) => {
          const franchise = team(row.teamId);
          const inField = row.rank <= PROJECTED_SPOTS;
          return (
            <li key={row.teamId} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${inField ? "bg-turf text-white" : "bg-slate-100 text-slate-600"}`}>
                <span className="sr-only">Projected rank </span>
                {row.rank}
              </span>
              <TeamAvatar teamId={row.teamId} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <Link href={teamPath(row.teamId)} className="block leading-tight font-semibold break-words text-navy hover:underline">
                  {franchise.name}
                </Link>
                <p className="mt-0.5 text-xs leading-snug text-slate-600 tabular-nums">
                  {row.record} now · {one(row.pointsFor)} PF
                  {franchise.owner ? ` · ${franchise.owner}` : ""}
                </p>
                <p className="text-xs leading-snug text-slate-600 tabular-nums">
                  Expected {one(row.expectedWins)}–{one(row.expectedLosses)} · {Math.round(row.expectedPoints)} PF
                </p>
              </div>
              <div className="w-16 shrink-0 text-right">
                <p className="font-display text-2xl leading-none font-extrabold text-navy tabular-nums">{formatPct(row.playoffOdds)}</p>
                {oddsDelta?.has(row.teamId) && <OddsMove delta={oddsDelta.get(row.teamId) ?? 0} />}
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100" role="presentation">
                  <div className={cn("h-full rounded-full", inField ? "bg-turf" : "bg-slate-400")} style={{ width: `${Math.max(2, Math.min(1, row.playoffOdds) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-600 tabular-nums">No. 1 seed {formatPct(row.topSeedOdds)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">{PROJECTED_METHOD}</p>
    </Card>
  );
}
