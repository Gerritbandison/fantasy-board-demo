import { showProjectionBracket } from "@/lib/score-display";
import { cn } from "@/lib/utils";
import { formatPoints, type MatchupSide, type MatchupState } from "@/lib/league";

const SLOT_STYLES: { [slot: string]: string } = {
  QB: "bg-rose-50 text-rose-800 ring-rose-200",
  RB: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  WR: "bg-sky-50 text-sky-800 ring-sky-200",
  TE: "bg-amber-50 text-amber-800 ring-amber-200",
  FLEX: "bg-violet-50 text-violet-800 ring-violet-200",
  K: "bg-slate-100 text-slate-700 ring-slate-200",
  "D/ST": "bg-slate-100 text-slate-700 ring-slate-200",
  Bench: "bg-surface-muted text-slate-600 ring-line",
  IR: "bg-loss-light text-loss ring-loss-border",
};

export function SlotChip({ slot, className }: { slot: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-11 shrink-0 items-center justify-center rounded-md px-1.5 font-display text-xs font-bold tracking-wide ring-1 ring-inset",
        SLOT_STYLES[slot] ?? SLOT_STYLES.Bench,
        className,
      )}
    >
      {slot === "Bench" ? "BN" : slot}
    </span>
  );
}

export function StateBadge({ state, onDark = false, className }: { state: MatchupState; onDark?: boolean; className?: string }) {
  if (state === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ring-1 ring-inset",
          onDark
            ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/35"
            : "bg-turf-light text-turf-dark ring-turf-border",
          className,
        )}
      >
        <span className={cn("size-1.5 rounded-full animate-pulse", onDark ? "bg-emerald-300" : "bg-turf")} aria-hidden />
        In progress
      </span>
    );
  }
  if (state === "final") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ring-1 ring-inset",
          onDark ? "bg-white/15 text-white ring-white/20" : "bg-navy text-white ring-navy",
          className,
        )}
      >
        Final
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ring-1 ring-inset",
        onDark ? "bg-white/10 text-white/85 ring-white/15" : "bg-surface-muted text-slate-600 ring-line",
        className,
      )}
    >
      Projected
    </span>
  );
}

const STATUS: { [status: string]: string } = {
  Questionable: "Q",
  Doubtful: "D",
  Out: "O",
  IR: "IR",
  PUP: "PUP",
  Suspension: "SUS",
  Suspended: "SUS",
};

/** Live total with the projected final in brackets, or the projection alone before kickoff. */
export function ScoreReadout({
  side,
  state,
  className,
  bracketClassName,
}: {
  side: MatchupSide;
  state: MatchupState;
  className?: string;
  bracketClassName?: string;
}) {
  const live = state !== "projected";
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tabular-nums", className)}>
      <span>{live ? formatPoints(side.points ?? 0) : side.projected != null ? side.projected.toFixed(1) : "—"}</span>
      {showProjectionBracket(state, side.points ?? null, side.projected ?? null) && (
        <span className={cn("font-sans text-xs font-semibold tracking-normal tabular-nums", bracketClassName)}>
          [{side.projected?.toFixed(1)}]
        </span>
      )}
    </span>
  );
}

export function StatusChip({ status }: { status?: string }) {
  if (!status || status === "Active") return null;
  const short = STATUS[status] ?? status;
  const warn = status === "Questionable";
  return (
    <span
      title={status}
      className={cn(
        "inline-flex h-4.5 shrink-0 items-center rounded px-1.5 text-[10px] leading-none font-bold tracking-wide uppercase ring-1 ring-inset",
        warn ? "bg-warn-light text-warn ring-warn-border" : "bg-loss-light text-loss ring-loss-border",
      )}
    >
      {short}
    </span>
  );
}

export function ByeChip({ onBye }: { onBye?: boolean }) {
  if (!onBye) return null;
  return (
    <span
      title="Bye this week"
      className="inline-flex h-4.5 shrink-0 items-center rounded bg-surface-muted px-1.5 text-[10px] leading-none font-bold tracking-wide text-slate-700 uppercase ring-1 ring-line ring-inset"
    >
      BYE
    </span>
  );
}
