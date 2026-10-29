import { cn } from "@/lib/utils";

const SLOT_STYLES: { [slot: string]: string } = {
  QB: "text-phos ring-phos/35",
  RB: "text-sig ring-sig/35",
  WR: "text-zinc-100 ring-white/25",
  TE: "text-amber-200 ring-amber-200/25",
  FLEX: "text-sig/80 ring-sig/25 hatch",
  K: "text-dim ring-white/15",
  "D/ST": "text-dim ring-white/15",
  Bench: "text-faint ring-white/10",
  IR: "text-hot ring-hot/35",
};

export function SlotChip({ slot, className }: { slot: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-10 items-center justify-center px-1 font-mono text-[10.5px] font-semibold tracking-wider ring-1 ring-inset",
        SLOT_STYLES[slot] ?? SLOT_STYLES.Bench,
        className,
      )}
    >
      {slot === "Bench" ? "BN" : slot}
    </span>
  );
}

const STATUS: { [status: string]: { label: string; tone: string } } = {
  Questionable: { label: "Q", tone: "bg-phos/15 text-phos ring-phos/40" },
  Doubtful: { label: "D", tone: "bg-hot/15 text-hot ring-hot/40" },
  Out: { label: "OUT", tone: "bg-hot/15 text-hot ring-hot/40" },
  IR: { label: "IR", tone: "bg-hot/15 text-hot ring-hot/40" },
};

export function StatusChip({ status }: { status?: string }) {
  if (!status || status === "Active") return null;
  const s = STATUS[status] ?? { label: status, tone: "bg-white/5 text-zinc-300 ring-white/20" };
  return (
    <span
      title={status}
      className={cn("inline-flex h-4 shrink-0 items-center px-1 font-mono text-[9.5px] font-semibold tracking-wider ring-1 ring-inset", s.tone)}
    >
      {s.label}
    </span>
  );
}
