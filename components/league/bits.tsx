import { cn } from "@/lib/utils";

export function Panel({
  title,
  meta,
  icon,
  className,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl bg-zinc-900/60 p-4 ring-1 ring-white/10 sm:p-5 tv:p-8", className)}>
      <div className="mb-3 flex items-center justify-between gap-3 tv:mb-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-[0.2em] text-zinc-300 sm:text-lg tv:text-3xl">
          {icon}
          {title}
        </h2>
        {meta && <span className="shrink-0 text-[11px] uppercase tracking-widest text-zinc-500 tv:text-base">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/90 tv:text-base">{eyebrow}</p>
      <h1 className="mt-1 font-display text-4xl leading-[0.95] font-extrabold uppercase tracking-tight text-white sm:text-5xl tv:text-8xl">
        {title}
      </h1>
      {children}
    </div>
  );
}

const SLOT_STYLES: { [slot: string]: string } = {
  QB: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  RB: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  WR: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  TE: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  FLEX: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  K: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/30",
  "D/ST": "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  Bench: "bg-zinc-700/40 text-zinc-400 ring-zinc-600/40",
  IR: "bg-red-900/40 text-red-300 ring-red-500/30",
};

export function SlotChip({ slot, className }: { slot: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-11 items-center justify-center rounded-md px-1.5 font-display text-sm font-bold ring-1 tv:h-11 tv:min-w-18 tv:text-2xl",
        SLOT_STYLES[slot] ?? SLOT_STYLES.Bench,
        className,
      )}
    >
      {slot === "Bench" ? "BN" : slot}
    </span>
  );
}

const STATUS: { [status: string]: { label: string; tone: string } } = {
  Questionable: { label: "Q", tone: "bg-amber-500/20 text-amber-300 ring-amber-400/40" },
  Doubtful: { label: "D", tone: "bg-orange-500/20 text-orange-300 ring-orange-400/40" },
  Out: { label: "O", tone: "bg-red-500/20 text-red-300 ring-red-400/40" },
  IR: { label: "IR", tone: "bg-red-500/20 text-red-300 ring-red-400/40" },
};

export function StatusChip({ status }: { status?: string }) {
  if (!status || status === "Active") return null;
  const s = STATUS[status] ?? { label: status, tone: "bg-zinc-500/20 text-zinc-300 ring-zinc-400/40" };
  return (
    <span
      title={status}
      className={cn("inline-flex shrink-0 items-center rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ring-1 tv:text-sm", s.tone)}
    >
      {s.label}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-300 ring-1 ring-white/10 tv:text-base",
        className,
      )}
    >
      {children}
    </span>
  );
}
