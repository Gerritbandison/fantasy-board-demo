import { cn } from "@/lib/utils";
import { TRAIL_RANGE, median, type Franchise, type WeekResult } from "@/lib/intel";

const W = 340;
const H = 156;
const PAD = { l: 26, r: 30, t: 12, b: 22 };
const WEEKS = 8;

function x(week: number) {
  return PAD.l + ((week - 1) * (W - PAD.l - PAD.r)) / (WEEKS - 1);
}

function y(v: number) {
  const { min, max } = TRAIL_RANGE;
  return PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b);
}

function path(weeks: WeekResult[]) {
  return weeks.map((w, i) => `${i === 0 ? "M" : "L"}${x(w.week).toFixed(1)},${y(w.pf).toFixed(1)}`).join(" ");
}

/**
 * Week-by-week PF for the focus franchise (amber) with an optional opponent overlay (cyan).
 * Week 8 is drawn as a dashed projection to the projected score.
 */
export function ScoreTrail({
  focus,
  opponent,
  focusProj,
  opponentProj,
  className,
}: {
  focus: Franchise;
  opponent?: Franchise;
  focusProj?: number;
  opponentProj?: number;
  className?: string;
}) {
  const fw = focus.weekly2026;
  const last = fw[fw.length - 1];
  const med = median(fw.map((w) => w.pf));
  const grid = [];
  for (let v = Math.ceil(TRAIL_RANGE.min / 20) * 20; v <= TRAIL_RANGE.max; v += 20) grid.push(v);
  const areaPath = `${path(fw)} L${x(last.week)},${y(TRAIL_RANGE.min)} L${x(fw[0].week)},${y(TRAIL_RANGE.min)} Z`;
  const oLast = opponent?.weekly2026[opponent.weekly2026.length - 1];
  const gradId = `trail-fill-${focus.teamId}`;

  const summary = fw.map((w) => `W${w.week} ${w.result} ${w.pf.toFixed(1)}`).join(", ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("block h-auto w-full font-mono", className)}
      role="img"
      aria-label={`${focus.name} points by week: ${summary}${focusProj ? `. Week 8 projected ${focusProj.toFixed(1)}` : ""}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-phos)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-phos)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {grid.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r + 6} y1={y(v)} y2={y(v)} stroke="white" strokeOpacity="0.06" />
          <text x={PAD.l - 5} y={y(v) + 3} textAnchor="end" fontSize="8" fill="var(--color-faint)">
            {v}
          </text>
        </g>
      ))}

      {Array.from({ length: WEEKS }, (_, i) => i + 1).map((wk) => (
        <g key={wk}>
          <line x1={x(wk)} x2={x(wk)} y1={PAD.t} y2={H - PAD.b} stroke="white" strokeOpacity={wk === WEEKS ? 0.12 : 0.035} strokeDasharray={wk === WEEKS ? "2 3" : undefined} />
          <text
            x={x(wk)}
            y={H - 7}
            textAnchor="middle"
            fontSize="8.5"
            fill={wk === WEEKS ? "var(--color-phos)" : "var(--color-dim)"}
          >
            {wk === WEEKS ? "W8·P" : `W${wk}`}
          </text>
        </g>
      ))}

      <line x1={PAD.l} x2={x(last.week)} y1={y(med)} y2={y(med)} stroke="var(--color-phos)" strokeOpacity="0.45" strokeDasharray="1 3" />
      <text x={PAD.l + 3} y={y(med) - 3} fontSize="7.5" fill="var(--color-phos)" fillOpacity="0.75">
        MED {med.toFixed(0)}
      </text>

      {opponent && (
        <g>
          <path d={path(opponent.weekly2026)} fill="none" stroke="var(--color-sig)" strokeOpacity="0.7" strokeWidth="1.25" />
          {opponent.weekly2026.map((w) => (
            <circle key={w.week} cx={x(w.week)} cy={y(w.pf)} r="1.8" fill="var(--color-sig)" fillOpacity="0.8" />
          ))}
          {opponentProj != null && oLast && (
            <>
              <line
                x1={x(oLast.week)}
                y1={y(oLast.pf)}
                x2={x(WEEKS)}
                y2={y(opponentProj)}
                stroke="var(--color-sig)"
                strokeOpacity="0.6"
                strokeDasharray="3 3"
              />
              <rect
                x={x(WEEKS) - 3}
                y={y(opponentProj) - 3}
                width="6"
                height="6"
                transform={`rotate(45 ${x(WEEKS)} ${y(opponentProj)})`}
                fill="var(--color-ink)"
                stroke="var(--color-sig)"
              />
              <text x={x(WEEKS) + 7} y={y(opponentProj) + 3} fontSize="8" fill="var(--color-sig)">
                {opponentProj.toFixed(0)}
              </text>
            </>
          )}
        </g>
      )}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path(fw)} fill="none" stroke="var(--color-phos)" strokeWidth="2" strokeLinejoin="round" />
      {fw.map((w) =>
        w.result === "W" ? (
          <rect key={w.week} x={x(w.week) - 3} y={y(w.pf) - 3} width="6" height="6" fill="var(--color-phos)" />
        ) : (
          <rect
            key={w.week}
            x={x(w.week) - 2.75}
            y={y(w.pf) - 2.75}
            width="5.5"
            height="5.5"
            fill="var(--color-ink)"
            stroke="var(--color-phos)"
            strokeWidth="1.25"
          />
        ),
      )}

      {focusProj != null && (
        <>
          <line x1={x(last.week)} y1={y(last.pf)} x2={x(WEEKS)} y2={y(focusProj)} stroke="var(--color-phos)" strokeWidth="1.5" strokeDasharray="3 3" />
          <rect
            x={x(WEEKS) - 4}
            y={y(focusProj) - 4}
            width="8"
            height="8"
            transform={`rotate(45 ${x(WEEKS)} ${y(focusProj)})`}
            fill="var(--color-ink)"
            stroke="var(--color-phos)"
            strokeWidth="1.5"
          />
          <text x={x(WEEKS) + 8} y={y(focusProj) + 3} fontSize="9" fontWeight="600" fill="var(--color-phos)">
            {focusProj.toFixed(0)}
          </text>
        </>
      )}
    </svg>
  );
}

/** Week cells under a trail: result + PF for each played week. */
export function WeekStrip({ weeks, className }: { weeks: WeekResult[]; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-7 gap-px bg-white/[0.06]", className)}>
      {weeks.map((w) => (
        <li key={w.week} className="bg-panel px-0.5 py-1.5 text-center" title={`Week ${w.week} vs ${w.opp}: ${w.result} ${w.pf}–${w.pa}`}>
          <span className="block font-mono text-[9px] tracking-widest text-faint">W{w.week}</span>
          <span className={cn("block font-mono text-[11px] font-semibold", w.result === "W" ? "text-phos" : "text-zinc-500")}>{w.result}</span>
          <span className="block font-mono text-[11px] text-zinc-200 tabular-nums">{w.pf.toFixed(0)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Inline sparkline for dense lists: same scale as ScoreTrail, no labels. */
export function MiniTrail({ franchise, tone = "phos", className }: { franchise: Franchise; tone?: "phos" | "sig"; className?: string }) {
  const w = 120;
  const h = 34;
  const n = franchise.weekly2026.length;
  const px = (i: number) => 3 + (i * (w - 6)) / Math.max(1, n - 1);
  const py = (v: number) => 3 + ((TRAIL_RANGE.max - v) / (TRAIL_RANGE.max - TRAIL_RANGE.min)) * (h - 6);
  const color = tone === "sig" ? "var(--color-sig)" : "var(--color-phos)";
  const d = franchise.weekly2026.map((wk, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(wk.pf).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("block h-8 w-28 shrink-0", className)} aria-hidden>
      <line x1="0" x2={w} y1={py(120)} y2={py(120)} stroke="white" strokeOpacity="0.08" strokeDasharray="2 3" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {franchise.weekly2026.map((wk, i) =>
        wk.result === "W" ? (
          <rect key={wk.week} x={px(i) - 2} y={py(wk.pf) - 2} width="4" height="4" fill={color} />
        ) : (
          <rect key={wk.week} x={px(i) - 1.75} y={py(wk.pf) - 1.75} width="3.5" height="3.5" fill="var(--color-ink)" stroke={color} strokeWidth="1" />
        ),
      )}
    </svg>
  );
}
