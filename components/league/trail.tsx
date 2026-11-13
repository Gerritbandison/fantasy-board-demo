import { cn } from "@/lib/utils";
import { getTeam, LEAGUE, type Team, type TeamWeek } from "@/lib/league";
import { LEAGUE_AVG_BY_WEEK, median, TRAIL_RANGE } from "@/lib/stats";
import { ResultChip } from "./ui";

const W = 360;
const H = 168;
const PAD = { l: 28, r: 32, t: 14, b: 24 };
const WEEKS = LEAGUE.week;
const AVG_COLOR = "#64748b";

function x(week: number) {
  return PAD.l + ((week - 1) * (W - PAD.l - PAD.r)) / Math.max(1, WEEKS - 1);
}

function y(v: number) {
  const { min, max } = TRAIL_RANGE;
  return PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b);
}

function path(points: { week: number; v: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.week).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
}

const LEAGUE_SERIES = [...LEAGUE_AVG_BY_WEEK.entries()].map(([week, v]) => ({ week, v }));

/**
 * Week-by-week points for one team, compared against an opponent or the weekly
 * league average. The current week is drawn as a dashed line to the projection.
 */
export function ScoreTrail({
  focus,
  compare = "league",
  focusProj,
  compareProj,
  className,
}: {
  focus: Team;
  compare?: Team | "league";
  focusProj?: number;
  compareProj?: number;
  className?: string;
}) {
  const fw = focus.weekly;
  const last = fw[fw.length - 1];
  const med = median(fw.map((w) => w.pf));
  const fColor = focus.color;
  const isLeague = compare === "league";
  const cColor = isLeague ? AVG_COLOR : compare.color;
  const cSeries = isLeague ? LEAGUE_SERIES : compare.weekly.map((w) => ({ week: w.week, v: w.pf }));
  const cLast = cSeries[cSeries.length - 1];
  const fSeries = fw.map((w) => ({ week: w.week, v: w.pf }));
  const grid = [];
  for (let v = Math.ceil(TRAIL_RANGE.min / 20) * 20; v <= TRAIL_RANGE.max; v += 20) grid.push(v);
  const areaPath = `${path(fSeries)} L${x(last.week)},${y(TRAIL_RANGE.min)} L${x(fw[0].week)},${y(TRAIL_RANGE.min)} Z`;
  const gradId = `trail-fill-${focus.id}`;
  const summary = fw.map((w) => `Week ${w.week} ${w.result} ${w.pf.toFixed(1)}`).join(", ");

  return (
    <div className="rounded-xl bg-surface-subtle p-2.5 ring-1 ring-line/80">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={cn("block h-auto w-full font-sans", className)}
        role="img"
        aria-label={`${focus.name} points by week: ${summary}${focusProj ? `. Week ${WEEKS} projected ${focusProj.toFixed(1)}` : ""}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={fColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={fColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x={x(WEEKS) - 14} y={PAD.t - 4} width="28" height={H - PAD.t - PAD.b + 4} rx="5" fill="#e8ede6" />
        {grid.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r + 8} y1={y(v)} y2={y(v)} stroke="#dce2da" strokeWidth="1" />
            <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="8.5" fontWeight="600" fill="#64748b">
              {v}
            </text>
          </g>
        ))}
        {Array.from({ length: WEEKS }, (_, i) => i + 1).map((wk) => (
          <text
            key={wk}
            x={x(wk)}
            y={H - 6}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight={wk === WEEKS ? 700 : 500}
            fill={wk === WEEKS ? "#0c192c" : "#64748b"}
          >
            {wk === WEEKS ? `Wk ${WEEKS}` : `W${wk}`}
          </text>
        ))}

        <line x1={PAD.l} x2={x(last.week)} y1={y(med)} y2={y(med)} stroke={fColor} strokeOpacity="0.45" strokeDasharray="2 3" />
        <text x={PAD.l + 3} y={y(med) - 3.5} fontSize="8" fontWeight="600" fill={fColor}>
          median {med.toFixed(0)}
        </text>

        <g>
          <path
            d={path(cSeries)}
            fill="none"
            stroke={cColor}
            strokeOpacity={isLeague ? 0.85 : 0.6}
            strokeWidth="1.6"
            strokeDasharray={isLeague ? "4 3" : undefined}
          />
          {!isLeague && cSeries.map((p) => <circle key={p.week} cx={x(p.week)} cy={y(p.v)} r="2.2" fill={cColor} fillOpacity="0.65" />)}
          {compareProj != null && cLast && (
            <>
              <line x1={x(cLast.week)} y1={y(cLast.v)} x2={x(WEEKS)} y2={y(compareProj)} stroke={cColor} strokeOpacity="0.6" strokeDasharray="3 3" />
              <circle cx={x(WEEKS)} cy={y(compareProj)} r="3.5" fill="white" stroke={cColor} strokeWidth="1.6" />
              <text x={x(WEEKS) + 7} y={y(compareProj) + 3} fontSize="8.5" fontWeight="600" fill={cColor}>
                {compareProj.toFixed(0)}
              </text>
            </>
          )}
        </g>

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={path(fSeries)} fill="none" stroke={fColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {fw.map((w) => (
          <circle
            key={w.week}
            cx={x(w.week)}
            cy={y(w.pf)}
            r="3.8"
            fill={w.result === "W" ? fColor : "white"}
            stroke={w.result === "W" ? "white" : "#b91c1c"}
            strokeWidth="1.8"
          />
        ))}

        {focusProj != null && (
          <>
            <line x1={x(last.week)} y1={y(last.pf)} x2={x(WEEKS)} y2={y(focusProj)} stroke={fColor} strokeWidth="2" strokeDasharray="4 3" />
            <circle cx={x(WEEKS)} cy={y(focusProj)} r="4.5" fill="white" stroke={fColor} strokeWidth="2.25" />
            <text x={x(WEEKS) + 8} y={y(focusProj) + 3} fontSize="9.5" fontWeight="700" fill={fColor}>
              {focusProj.toFixed(0)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export function TrailLegend({ focus, compare = "league" }: { focus: Team; compare?: Team | "league" }) {
  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
      <span className="flex items-center gap-1.5 font-semibold text-navy">
        <span className="h-[3px] w-4 rounded-full" style={{ background: focus.color }} />
        {focus.name}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-0 w-4 border-t-2"
          style={{ borderColor: compare === "league" ? AVG_COLOR : compare.color, borderStyle: compare === "league" ? "dashed" : "solid" }}
        />
        {compare === "league" ? "League average" : compare.name}
      </span>
      <span className="text-slate-600">
        {LEAGUE.provisionalLabel ? `Wk ${WEEKS} dot is live (${LEAGUE.provisionalLabel}).` : `Wk ${WEEKS} dot is final.`}
      </span>
    </div>
  );
}

/** Week-by-week results row: W/L, score, and opponent. Wraps cleanly into 5-col rows on narrow screens. */
export function WeekStrip({ weeks, className }: { weeks: TeamWeek[]; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-5 gap-1.5 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none", className)}>
      {weeks.map((w) => {
        const opp = getTeam(w.opponentId);
        return (
          <li
            key={w.week}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 ring-1",
              w.provisional
                ? "bg-warn-light/70 ring-warn-border"
                : "bg-surface-subtle ring-line/90",
            )}
            title={`Week ${w.week} vs ${opp?.name}: ${w.result} ${w.pf}–${w.pa}${w.provisional ? `. Provisional, Week ${w.week} not final` : ""}`}
          >
            <span className="text-[11px] leading-none font-bold text-slate-600">W{w.week}</span>
            <ResultChip result={w.result} />
            <span className="font-display text-sm leading-none font-bold text-navy tabular-nums">{w.pf.toFixed(0)}</span>
            <span className="max-w-full truncate text-[11px] leading-none font-semibold text-slate-600">{opp?.abbrev}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact sparkline for lists; same y-scale as ScoreTrail. */
export function MiniTrail({ team, className }: { team: Team; className?: string }) {
  const w = 120;
  const h = 38;
  const n = team.weekly.length;
  const px = (i: number) => 4 + (i * (w - 8)) / Math.max(1, n - 1);
  const py = (v: number) => 5 + ((TRAIL_RANGE.max - v) / (TRAIL_RANGE.max - TRAIL_RANGE.min)) * (h - 10);
  const d = team.weekly.map((wk, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(wk.pf).toFixed(1)}`).join(" ");
  const area = `${d} L${px(n - 1).toFixed(1)},${h - 3} L${px(0).toFixed(1)},${h - 3} Z`;
  const avg = LEAGUE_SERIES.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(p.v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("block h-9 w-28 shrink-0", className)} role="img" aria-label={`${team.abbrev} weekly points trend`}>
      <path d={area} fill={team.color} fillOpacity="0.09" />
      <path d={avg} fill="none" stroke="#94a3b8" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="2 2" />
      <path d={d} fill="none" stroke={team.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {team.weekly.map((wk, i) => (
        <circle
          key={wk.week}
          cx={px(i)}
          cy={py(wk.pf)}
          r="2.4"
          fill={wk.result === "W" ? team.color : "white"}
          stroke={wk.result === "W" ? "white" : "#b91c1c"}
          strokeWidth="1.25"
        />
      ))}
    </svg>
  );
}
