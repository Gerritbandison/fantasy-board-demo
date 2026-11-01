import { cn } from "@/lib/utils";
import { formatPoints, type MatchupSide, type MatchupState } from "@/lib/league";

const SLOT_STYLES: { [slot: string]: string } = {
  QB: "bg-rose-50 text-rose-700",
  RB: "bg-emerald-50 text-emerald-700",
  WR: "bg-sky-50 text-sky-700",
  TE: "bg-amber-50 text-amber-700",
  FLEX: "bg-violet-50 text-violet-700",
  K: "bg-slate-100 text-slate-600",
  "D/ST": "bg-slate-100 text-slate-600",
  Bench: "bg-slate-100 text-slate-600",
  IR: "bg-red-50 text-red-700",
};

export function SlotChip({ slot, className }: { slot: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-11 items-center justify-center rounded-md px-1.5 font-display text-sm font-bold",
        SLOT_STYLES[slot] ?? SLOT_STYLES.Bench,
        className,
      )}
    >
      {slot === "Bench" ? "BN" : slot}
    </span>
  );
}

const STATUS: { [status: string]: string } = {
  Questionable: "Q",
  Doubtful: "D",
  Out: "O",
  IR: "IR",
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
    <span className={className}>
      {live ? formatPoints(side.points ?? 0) : side.projected != null ? side.projected.toFixed(1) : "—"}
      {live && side.projected != null && <span className={cn("ml-1 font-sans text-xs font-semibold", bracketClassName)}>[{side.projected.toFixed(1)}]</span>}
    </span>
  );
}

export function StatusChip({ status }: { status?: string }) {
  if (!status || status === "Active") return null;
  return (
    <span title={status} className="shrink-0 text-xs font-bold text-loss">
      {STATUS[status] ?? status}
    </span>
  );
}

export function ByeChip({ onBye }: { onBye?: boolean }) {
  if (!onBye) return null;
  return (
    <span title="Bye this week" className="shrink-0 text-xs font-bold text-slate-600">
      BYE
    </span>
  );
}
