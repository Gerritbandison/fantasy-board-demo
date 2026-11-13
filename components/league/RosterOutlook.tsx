import { Card, TeamAvatar } from "@/components/league/ui";
import { LEAGUE, team } from "@/lib/league";
import { formatPct } from "@/lib/playoff-sim";
import { rosterOutlookFor } from "@/lib/ros";
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

/** Rest-of-season position grades and remaining schedule outlook for any franchise. */
export function RosterOutlook({ teamId }: { teamId: number }) {
  const report = rosterOutlookFor(teamId);
  if (!report) return null;

  return (
    <Card title="Rest of season" action="Projection & grades">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-subtle p-3.5 ring-1 ring-line/80">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "inline-flex size-13 shrink-0 items-center justify-center rounded-xl font-display text-3xl leading-none font-extrabold ring-1 ring-inset sm:size-14 sm:text-4xl",
              gradeBadgeClass(report.letter),
            )}
          >
            {report.letter}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">Rest-of-season projection</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:text-sm">
              {report.ppg != null && report.field > 0
                ? `Ranked #${report.rank} of ${report.field} in ESPN projected team scoring (${weekSpan(report.weeks)}).`
                : report.summary}
            </p>
          </div>
        </div>
        {report.ppg != null && report.field > 0 ? (
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none font-bold text-navy tabular-nums">{report.ppg.toFixed(1)}</p>
            <p className="mt-0.5 text-xs text-slate-600">pts/wk</p>
          </div>
        ) : null}
      </div>

      {report.positions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">
            <span>Unit grades</span>
            <span>{report.sampleLabel} sample</span>
          </div>
          <ul className="divide-y divide-line">
            {report.positions.map((row) => (
              <li key={row.id} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-0">
                <div className="flex w-20 shrink-0 items-center gap-2 pt-0.5">
                  <span
                    className={cn(
                      "inline-flex h-6 w-9 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold ring-1 ring-inset",
                      gradeBadgeClass(row.letter),
                    )}
                  >
                    {row.letter}
                  </span>
                  <span className="font-display text-xs font-bold tracking-wide text-navy uppercase">{row.label}</span>
                </div>

                <ul className="min-w-0 flex-1 grid gap-1.5">
                  {row.players.map((p) => {
                    const upcomingByes = p.byeWeeks.filter((w) => w >= LEAGUE.week);
                    return (
                      <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-xs sm:text-sm">
                        <span className="min-w-0 font-semibold text-navy">
                          {p.name}
                          {(row.id === "FLEX" || row.id === "BN") && (
                            <span className="ml-1 text-xs font-normal text-slate-500">{p.pos}</span>
                          )}
                          {p.onByeBench && (
                            <span className="ml-1.5 inline-flex rounded bg-surface-muted px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide text-slate-600 uppercase ring-1 ring-line ring-inset">
                              Bench · Bye
                            </span>
                          )}
                          {upcomingByes.length > 0 && !p.onByeBench && (
                            <span className="ml-1.5 text-[11px] font-medium text-slate-500">
                              · Bye Wk {upcomingByes.join(", ")}
                            </span>
                          )}
                        </span>

                        <span className="shrink-0 text-xs text-slate-600 tabular-nums">
                          {p.ppg != null ? <span className="font-semibold text-navy">{p.ppg.toFixed(1)}</span> : "—"}
                          {p.ppg != null && <span className="text-slate-500"> ppg</span>}
                          {p.rank != null && p.field != null ? (
                            <span className="ml-1.5 rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-line">
                              #{p.rank}/{p.field}
                            </span>
                          ) : p.weeks > 0 ? (
                            <span className="ml-1.5 text-[11px] text-slate-400">({p.weeks}g)</span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.weeks.length > 0 && (
        <>
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
        </>
      )}

      {report.suggestions.length > 0 && (
        <>
          <h3 className="mt-5 text-[11px] font-bold tracking-[0.1em] text-slate-600 uppercase">Lineup notes</h3>
          <ul className="mt-2 grid gap-1.5 text-sm text-slate-700">
            {report.suggestions.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-turf" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
