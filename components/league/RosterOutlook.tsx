import { Card, TeamAvatar } from "@/components/league/ui";
import { team } from "@/lib/league";
import { formatPct } from "@/lib/playoff-sim";
import { MAYE_ROS } from "@/lib/ros";
import { cn } from "@/lib/utils";

function gradeBadgeClass(letter: string) {
  if (letter === "—") return "bg-surface-muted text-slate-500 ring-line";
  if (letter.startsWith("A")) return "bg-turf-light text-turf-dark ring-turf-border";
  if (letter.startsWith("B")) return "bg-sky-50 text-sky-900 ring-sky-200";
  if (letter.startsWith("C")) return "bg-gold-light text-gold-ink ring-gold-border";
  return "bg-loss-light text-loss ring-loss-border";
}

function weekSpan(weeks: { week: number }[]) {
  const first = weeks[0]?.week;
  const last = weeks[weeks.length - 1]?.week;
  if (first == null || last == null) return "Rest of season";
  if (first === last) return `Week ${first}`;
  return `Weeks ${first}\u2013${last}`;
}

/** Rest-of-season projection for the user's franchise. Counted numbers come from the roster pull. */
export function RosterOutlook() {
  const report = MAYE_ROS;
  return (
    <Card title="Rest of season" action="Projection">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-subtle p-3.5 ring-1 ring-line/80">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex size-14 shrink-0 items-center justify-center rounded-xl font-display text-4xl leading-none font-extrabold ring-1 ring-inset",
              gradeBadgeClass(report.letter),
            )}
          >
            {report.letter}
          </span>
          <div>
            <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">Roster grade</p>
            <p className="mt-0.5 text-sm leading-snug text-slate-700">{report.summary}</p>
          </div>
        </div>
        {report.ppg != null && report.field > 0 ? (
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none font-bold text-navy tabular-nums">{report.ppg.toFixed(1)}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              pts/wk · #{report.rank} of {report.field}
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mt-4 divide-y divide-line">
        {report.positions.map((row) => (
          <li key={row.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={cn(
                "inline-flex h-7 w-10 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold ring-1 ring-inset",
                gradeBadgeClass(row.letter),
              )}
            >
              {row.letter}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-navy">{row.label}</p>
              <p className="text-xs leading-snug text-slate-600 sm:text-sm">{row.reason}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-[11px] font-bold tracking-[0.1em] text-slate-600 uppercase">{weekSpan(report.weeks)}</h3>
      <ul className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {report.weeks.map((week) => {
          const opp = team(week.opponentId);
          return (
            <li key={week.week} className="min-w-0 rounded-xl bg-surface-subtle p-3 ring-1 ring-line/90">
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-display text-sm font-bold tracking-wide text-slate-600 uppercase">Wk {week.week}</span>
                <span className={cn("font-display text-lg leading-none font-bold tabular-nums", week.winProb >= 0.5 ? "text-turf-dark" : "text-navy")}>
                  {formatPct(week.winProb)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <TeamAvatar teamId={opp.id} size="xs" />
                <span className="truncate text-xs font-semibold text-navy">
                  {week.home ? "vs" : "@"} {opp.abbrev}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                <div
                  className={cn("h-full rounded-full", week.winProb >= 0.5 ? "bg-turf" : "bg-slate-400")}
                  style={{ width: `${Math.max(4, Math.min(100, week.winProb * 100))}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-slate-600 tabular-nums">
                ESPN {week.proj.toFixed(1)}–{week.oppProj.toFixed(1)}
              </p>
              {week.byes.length > 0 && (
                <p className="mt-1 text-[11px] leading-snug font-semibold text-loss">
                  Bye: {week.byes.join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs leading-snug text-slate-600">Win odds come from the simulator at the ESPN projection.</p>

      <h3 className="mt-5 text-[11px] font-bold tracking-[0.1em] text-slate-600 uppercase">Lineup notes</h3>
      <ul className="mt-2 grid gap-1.5 text-sm text-slate-700">
        {report.suggestions.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-turf" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
