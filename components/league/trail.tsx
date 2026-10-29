import { cn } from "@/lib/utils";
import { getTeam, LEAGUE, type Team, type TeamWeek } from "@/lib/league";
import { LEAGUE_AVG_BY_WEEK, median, TRAIL_RANGE } from "@/lib/stats";
import { ResultChip } from "./ui";

const W = 340;
const H = 160;
const PAD = { l: 26, r: 30, t: 12, b: 22 };
const WEEKS = LEAGUE.week;
const AVG_COLOR = "#94a3b8";

function x(week: number) {
  return PAD.l + ((week - 1) * (W - PAD.l - PAD.r)) / (WEEKS - 1);
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
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("block h-auto w-full font-sans", className)}
      role="img"
      aria-label={`${focus.name} points by week: ${summary}${focusProj ? `. Week ${WEEKS} projected ${focusProj.toFixed(1)}` : ""}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={fColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={x(WEEKS) - 14} y={PAD.t - 4} width="28" height={H - PAD.t - PAD.b + 4} rx="6" fill="#f1f5f9" />
      {grid.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r + 6} y1={y(v)} y2={y(v)} stroke="#e2e8f0" />
          <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="8.5" fill="#94a3b8">
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
          fontSize="9"
          fontWeight={wk === WEEKS ? 700 : 500}
          fill={wk === WEEKS ? "#0f1e36" : "#64748b"}
        >
          {wk === WEEKS ? `Wk ${WEEKS}` : `W${wk}`}
        </text>
      ))}

      <line x1={PAD.l} x2={x(last.week)} y1={y(med)} y2={y(med)} stroke={fColor} strokeOpacity="0.5" strokeDasharray="2 3" />
      <text x={PAD.l + 3} y={y(med) - 3} fontSize="8" fontWeight="600" fill={fColor}>
        median {med.toFixed(0)}
      </text>

      <g>
        <path d={path(cSeries)} fill="none" stroke={cColor} strokeOpacity={isLeague ? 0.9 : 0.55} strokeWidth="1.5" strokeDasharray={isLeague ? "4 3" : undefined} />
        {!isLeague && cSeries.map((p) => <circle key={p.week} cx={x(p.week)} cy={y(p.v)} r="2" fill={cColor} fillOpacity="0.6" />)}
        {compareProj != null && cLast && (
          <>
            <line x1={x(cLast.week)} y1={y(cLast.v)} x2={x(WEEKS)} y2={y(compareProj)} stroke={cColor} strokeOpacity="0.55" strokeDasharray="3 3" />
            <circle cx={x(WEEKS)} cy={y(compareProj)} r="3.5" fill="white" stroke={cColor} strokeWidth="1.5" />
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
          r="3.75"
          fill={w.result === "W" ? fColor : "white"}
          stroke={w.result === "W" ? "white" : "#dc2626"}
          strokeWidth="1.75"
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
  );
}

export function TrailLegend({ focus, compare = "league" }: { focus: Team; compare?: Team | "league" }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
      <span className="flex items-center gap-1.5">
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
      <span className="text-slate-400">Wk {WEEKS} = projection</span>
    </div>
  );
}

/** Week-by-week results row: W/L, score, and opponent. */
export function WeekStrip({ weeks, className }: { weeks: TeamWeek[]; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-7 gap-1", className)}>
      {weeks.map((w) => {
        const opp = getTeam(w.opponentId);
        return (
          <li
            key={w.week}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg bg-slate-50 px-0.5 py-1.5 ring-1 ring-slate-100"
            title={`Week ${w.week} vs ${opp?.name}: ${w.result} ${w.pf}–${w.pa}`}
          >
            <span className="text-[10px] font-semibold text-slate-400">W{w.week}</span>
            <ResultChip result={w.result} />
            <span className="font-display text-sm leading-none font-bold text-navy tabular-nums">{w.pf.toFixed(0)}</span>
            <span className="max-w-full truncate text-[9px] font-semibold text-slate-400">{opp?.abbrev}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact sparkline for lists; same y-scale as ScoreTrail. */
export function MiniTrail({ team, className }: { team: Team; className?: string }) {
  const w = 120;
  const h = 36;
  const n = team.weekly.length;
  const px = (i: number) => 4 + (i * (w - 8)) / Math.max(1, n - 1);
  const py = (v: number) => 4 + ((TRAIL_RANGE.max - v) / (TRAIL_RANGE.max - TRAIL_RANGE.min)) * (h - 8);
  const d = team.weekly.map((wk, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(wk.pf).toFixed(1)}`).join(" ");
  const avg = LEAGUE_SERIES.map((p, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(p.v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("block h-9 w-28 shrink-0", className)} role="img" aria-label={`${team.abbrev} weekly points trend`}>
      <path d={avg} fill="none" stroke="#cbd5e1" strokeWidth="1.25" strokeDasharray="2 2" />
      <path d={d} fill="none" stroke={team.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {team.weekly.map((wk, i) => (
        <circle
          key={wk.week}
          cx={px(i)}
          cy={py(wk.pf)}
          r="2.4"
          fill={wk.result === "W" ? team.color : "white"}
          stroke={wk.result === "W" ? "white" : "#dc2626"}
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}
