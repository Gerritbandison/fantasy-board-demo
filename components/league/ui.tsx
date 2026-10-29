import { cn } from "@/lib/utils";
import { abbrev, LUCK_LABEL, teamColor, type LuckRow } from "@/lib/intel";

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
    <Tag className={cn("relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,30,54,0.06)] ring-1 ring-line", className)}>
      {accent && <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} aria-hidden />}
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          {title && <h2 className="min-w-0 font-display text-lg leading-tight font-bold tracking-wide text-navy uppercase">{title}</h2>}
          {action && <div className="shrink-0 text-sm text-slate-500">{action}</div>}
        </header>
      )}
      <div className={cn("p-4 sm:p-5", (title || action) && "pt-3 sm:pt-3", bodyClassName)}>{children}</div>
    </Tag>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.14em] text-turf uppercase">{eyebrow}</p>
      <h1 className="mt-1 font-display text-[2.15rem] leading-[1.02] font-extrabold break-words text-navy sm:text-5xl">{title}</h1>
      {children}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-wide text-navy uppercase">
        <span className="h-5 w-1 rounded-full bg-turf" aria-hidden />
        {title}
      </h2>
      {action && <div className="shrink-0 text-sm text-slate-500">{action}</div>}
    </div>
  );
}

export function TeamAvatar({ teamId, size = "md", className }: { teamId?: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const code = teamId ? abbrev(teamId) : "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]",
        size === "sm" && "size-7 text-[10px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-14 text-base",
        className,
      )}
      style={{ background: teamId ? teamColor(teamId) : "#94a3b8" }}
      aria-hidden
    >
      {code}
    </span>
  );
}

type PillTone = "turf" | "gold" | "loss" | "slate" | "sky" | "navy";

const PILL: { [t in PillTone]: string } = {
  turf: "bg-turf-light text-turf-dark ring-green-200",
  gold: "bg-gold-light text-amber-800 ring-amber-200",
  loss: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  navy: "bg-navy text-white ring-navy",
};

export function Pill({ tone = "slate", className, children }: { tone?: PillTone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
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
      <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
      <p className={cn("font-display text-2xl leading-tight font-bold text-navy tabular-nums", valueClassName)}>{value}</p>
      {sub && <p className="text-xs leading-snug text-slate-500">{sub}</p>}
    </div>
  );
}

/** `compact` drops the word label below `sm` (the delta and color carry it) for narrow table cells. */
export function LuckBadge({ row, withRanks, compact }: { row: LuckRow; withRanks?: boolean; compact?: boolean }) {
  const l = LUCK_LABEL[row.label];
  const delta = row.luckDelta > 0 ? `+${row.luckDelta}` : row.luckDelta === 0 ? "0" : `−${Math.abs(row.luckDelta)}`;
  return (
    <span
      title={`Points-for rank ${row.pfRank}, record rank ${row.winRank}`}
      className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", l.tone)}
    >
      <span className={cn(compact && row.luckDelta !== 0 && "max-sm:hidden")}>{l.text}</span>
      {row.luckDelta !== 0 && <span className="tabular-nums">{delta}</span>}
      {withRanks && (
        <span className="font-normal opacity-75">
          · PF #{row.pfRank}
        </span>
      )}
    </span>
  );
}

export function ResultChip({ result, className }: { result: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded font-display text-xs font-bold text-white",
        result === "W" ? "bg-turf" : "bg-loss",
        className,
      )}
    >
      {result}
    </span>
  );
}
