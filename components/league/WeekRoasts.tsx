import { WEEK_ROASTS, type RoastMatchup, type RoastTag } from "@/lib/roasts";
import { cn } from "@/lib/utils";

const TAG_TONE: { [kind in RoastTag["kind"]]: string } = {
  lock: "bg-turf-light text-turf-dark ring-turf-border",
  upset: "bg-gold-light text-gold-ink ring-gold-border",
  note: "bg-surface-muted text-slate-700 ring-line",
};

function pulledLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function TagBadge({ tag }: { tag: RoastTag }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={cn("inline-flex h-5.5 items-center rounded-md px-2 text-[11px] font-bold tracking-wider uppercase ring-1 ring-inset", TAG_TONE[tag.kind])}>
        {tag.label}
      </span>
      {tag.detail ? <span className="min-w-0 text-xs leading-snug font-medium text-slate-700">{tag.detail}</span> : null}
    </p>
  );
}

/** When the roast file was pulled, for the note above the scoreboard. */
export function roastPulledLabel() {
  return WEEK_ROASTS ? pulledLabel(WEEK_ROASTS.dataPulledAt) : null;
}

/** Roast copy for a game that already shows its score. The score rows stay on the scoreboard. */
export function RoastCopy({ roast }: { roast: RoastMatchup }) {
  return (
    <div className="mt-3.5 border-t border-line pt-3.5">
      <h3 className="font-display text-lg leading-snug font-bold text-navy sm:text-xl">{roast.headline}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{roast.roast}</p>
      <div className="mt-3 flex flex-col gap-2 rounded-xl bg-surface-subtle px-3 py-2.5 ring-1 ring-line/80">
        <p className="text-xs leading-snug font-semibold text-navy tabular-nums">{roast.projectionLine}</p>
        <TagBadge tag={roast.tag} />
      </div>
    </div>
  );
}
