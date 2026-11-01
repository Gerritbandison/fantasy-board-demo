import { Card } from "@/components/league/ui";
import { team } from "@/lib/league";
import { formatPct } from "@/lib/playoff-sim";
import { MAYE_ROS } from "@/lib/ros";
import { cn } from "@/lib/utils";

function letterClass(letter: string) {
  if (letter.startsWith("A")) return "text-turf";
  if (letter.startsWith("B")) return "text-navy";
  if (letter.startsWith("C")) return "text-gold-ink";
  return "text-loss";
}

/** Rest-of-season projection for the user's franchise. Counted numbers come from the roster pull. */
export function RosterOutlook() {
  const report = MAYE_ROS;
  return (
    <Card title="Rest of season" action="Projection">
      <div className="flex items-end justify-between gap-3">
        <p className={cn("font-display text-5xl leading-none font-extrabold", letterClass(report.letter))}>{report.letter}</p>
        <p className="text-right text-sm text-slate-600">
          <span className="font-display text-2xl font-bold text-navy tabular-nums">{report.ppg.toFixed(1)}</span>
          <span className="block">pts/wk · {report.rank} of {report.field}</span>
        </p>
      </div>
      <p className="mt-3 text-sm leading-snug text-slate-600">{report.summary}</p>

      <ul className="mt-4 divide-y divide-line">
        {report.positions.map((row) => (
          <li key={row.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span className={cn("w-10 shrink-0 font-display text-xl leading-6 font-bold", letterClass(row.letter))}>{row.letter}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-navy">{row.label}</p>
              <p className="text-sm leading-snug text-slate-600">{row.reason}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-600 uppercase">Weeks 9–14</h3>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {report.weeks.map((week) => {
          const opp = team(week.opponentId);
          return (
            <li key={week.week} className="min-w-0 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="font-display text-lg leading-none font-bold text-navy">Wk {week.week}</p>
              <p className="mt-1 truncate text-sm font-semibold text-navy">
                {week.home ? "vs" : "@"} {opp.abbrev}
              </p>
              <p className="truncate text-xs text-slate-600">{opp.name}</p>
              <p className="mt-2 font-display text-2xl leading-none font-bold text-navy tabular-nums">{formatPct(week.winProb)}</p>
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                ESPN {week.proj.toFixed(1)}–{week.oppProj.toFixed(1)}
              </p>
              {week.byes.length > 0 && (
                <p className="mt-1 text-xs leading-snug font-semibold text-loss">
                  Bye: {week.byes.join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs leading-snug text-slate-600">Win odds are the simulator at the ESPN projection. Isaiah Likely is the tight end. Harold Fannin Jr. is in the lineup only while Likely is on bye.</p>

      <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-600 uppercase">Suggestions</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {report.suggestions.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

    </Card>
  );
}
