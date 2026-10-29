import { cn } from "@/lib/utils";

const SLOT_STYLES: { [slot: string]: string } = {
  QB: "bg-rose-50 text-rose-700",
  RB: "bg-emerald-50 text-emerald-700",
  WR: "bg-sky-50 text-sky-700",
  TE: "bg-amber-50 text-amber-700",
  FLEX: "bg-violet-50 text-violet-700",
  K: "bg-slate-100 text-slate-600",
  "D/ST": "bg-slate-100 text-slate-600",
  Bench: "bg-slate-100 text-slate-500",
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

export function StatusChip({ status }: { status?: string }) {
  if (!status || status === "Active") return null;
  return (
    <span title={status} className="shrink-0 text-xs font-bold text-loss">
      {STATUS[status] ?? status}
    </span>
  );
}
