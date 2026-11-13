import { cn } from "@/lib/utils";
import { getTeam } from "@/lib/league";
import { LUCK_LABEL, TRAIL_RANGE, type Luck } from "@/lib/stats";

export function Card({
  title,
  action,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
  accent,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  as?: "section" | "article" | "div" | "li";
  /** Optional team color for a top stripe. */
  accent?: string;
}) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line",
        className,
      )}
    >
      {accent && <span className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: accent }} aria-hidden />}
      {(title || action) && (
        <header
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line/80 bg-surface-subtle/75 px-4 py-3 sm:px-5",
            accent && "pt-3.5",
          )}
        >
          {title && (
            <h2 className="min-w-0 font-display text-[1.1rem] leading-tight font-bold tracking-[0.03em] text-navy uppercase">
              {title}
            </h2>
          )}
          {action && <div className="text-xs font-semibold text-slate-600">{action}</div>}
        </header>
      )}
      <div className={cn("p-4 sm:p-5", !title && !action && accent && "pt-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-xs font-bold tracking-[0.14em] text-turf uppercase">
            <span className="h-2 w-2 rounded-[2px] bg-turf" aria-hidden />
            <span>{eyebrow}</span>
          </p>
          <h1 className="mt-1.5 font-display text-3xl leading-[1.02] font-extrabold tracking-tight break-words text-navy sm:text-[2.5rem]">
            {title}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  id,
  headingId,
}: {
  title: string;
  action?: React.ReactNode;
  id?: string;
  /** Id on the heading itself, for `aria-labelledby`. */
  headingId?: string;
}) {
  return (
    <div id={id} className="flex scroll-mt-28 items-center justify-between gap-3 pt-1">
      <h2 id={headingId} className="flex items-center gap-2.5 font-display text-xl font-bold tracking-[0.03em] text-navy uppercase sm:text-[1.35rem]">
        <span className="h-5 w-1 shrink-0 rounded-full bg-turf" aria-hidden />
        <span>{title}</span>
      </h2>
      <span className="hidden h-px flex-1 bg-line sm:block" aria-hidden />
      {action && <div className="shrink-0 text-xs font-semibold tracking-wide text-slate-600 uppercase">{action}</div>}
    </div>
  );
}

export function TeamAvatar({
  teamId,
  size = "md",
  className,
}: {
  teamId?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const t = teamId != null ? getTeam(teamId) : undefined;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold tracking-wide text-white ring-1 ring-black/10 ring-inset shadow-[inset_0_-1.5px_0_rgba(0,0,0,0.2)]",
        size === "xs" && "size-6 text-[10px]",
        size === "sm" && "size-8 text-[11px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-13 text-sm sm:size-14 sm:text-base",
        className,
      )}
      style={{ background: t?.color ?? "#64748b" }}
      aria-hidden
    >
      {t?.abbrev ?? "?"}
    </span>
  );
}

export function RankBadge({
  rank,
  highlight,
  className,
}: {
  rank: number;
  highlight?: "gold" | "turf" | "plain";
  className?: string;
}) {
  const tone =
    highlight === "gold" || (highlight == null && rank === 1)
      ? "bg-gold-light text-gold-ink ring-gold-border"
      : highlight === "turf"
        ? "bg-turf-light text-turf-dark ring-turf-border"
        : "bg-surface-muted text-slate-700 ring-line";
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold tabular-nums ring-1 ring-inset",
        tone,
        className,
      )}
    >
      {rank}
    </span>
  );
}

type PillTone = "turf" | "gold" | "loss" | "slate" | "sky" | "navy";

const PILL: { [t in PillTone]: string } = {
  turf: "bg-turf-light text-turf-dark ring-turf-border",
  gold: "bg-gold-light text-gold-ink ring-gold-border",
  loss: "bg-loss-light text-loss ring-loss-border",
  slate: "bg-surface-muted text-slate-700 ring-line",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  navy: "bg-navy text-white ring-navy",
};

export function Pill({ tone = "slate", className, children }: { tone?: PillTone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        PILL[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">{label}</p>
      <p className={cn("mt-0.5 font-display text-2xl leading-tight font-bold text-navy tabular-nums sm:text-[1.65rem]", valueClassName)}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs leading-snug text-slate-600">{sub}</p>}
    </div>
  );
}

const LUCK_TONES: Record<Luck["label"], string> = {
  lucky: "bg-gold-light text-gold-ink ring-gold-border",
  even: "bg-surface-muted text-slate-700 ring-line",
  unlucky: "bg-sky-50 text-sky-800 ring-sky-200",
};

/** `compact` drops the word label below `sm` (the delta and color carry it) for narrow table cells. */
export function LuckBadge({ row, withRanks, compact }: { row: Luck; withRanks?: boolean; compact?: boolean }) {
  const l = LUCK_LABEL[row.label];
  const delta = row.delta > 0 ? `+${row.delta}` : `−${Math.abs(row.delta)}`;
  return (
    <span
      title={`Points-for rank ${row.pfRank}, standings rank ${row.recordRank}`}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        LUCK_TONES[row.label],
      )}
    >
      <span className={cn(compact && row.delta !== 0 && "max-sm:hidden")}>{l.text}</span>
      {row.delta !== 0 && <span className="font-bold tabular-nums">{delta}</span>}
      {withRanks && <span className="font-medium opacity-85">· PF #{row.pfRank}</span>}
    </span>
  );
}

export function ResultChip({ result, className }: { result: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] font-display text-xs font-bold text-white",
        result === "W" ? "bg-turf" : result === "T" ? "bg-slate-500" : "bg-loss",
        className,
      )}
    >
      {result}
    </span>
  );
}

/** Low–high band with a median tick, on the shared score scale. */
export function RangeBar({ low, median, high, color }: { low: number; median: number; high: number; color: string }) {
  const { min, max } = TRAIL_RANGE;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <div
      className="relative h-3 rounded-full bg-surface-muted ring-1 ring-line/70 ring-inset"
      role="img"
      aria-label={`Low ${low.toFixed(1)}, median ${median.toFixed(1)}, high ${high.toFixed(1)}`}
    >
      <span
        className="absolute inset-y-0 rounded-full opacity-35"
        style={{ left: pos(low), right: `calc(100% - ${pos(high)})`, background: color }}
      />
      <span className="absolute -inset-y-0.5 w-1.5 -translate-x-1/2 rounded-full ring-1 ring-white" style={{ left: pos(median), background: color }} />
    </div>
  );
}
