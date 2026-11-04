import { WEEK_ROASTS, type RoastMatchup, type RoastTag } from "@/lib/roasts";
import { cn } from "@/lib/utils";

const TAG_TONE: { [kind in RoastTag["kind"]]: string } = {
  lock: "bg-turf-light text-turf-dark ring-green-200",
  upset: "bg-gold-light text-gold-ink ring-amber-200",
  note: "bg-slate-100 text-slate-700 ring-slate-200",
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
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-bold ring-1 ring-inset", TAG_TONE[tag.kind])}>{tag.label}</span>
      {tag.detail ? <span className="min-w-0 text-sm leading-snug text-slate-700">{tag.detail}</span> : null}
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
    <div className="mt-4 border-t border-line pt-3">
      <h3 className="font-display text-xl leading-tight font-bold text-navy">{roast.headline}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{roast.roast}</p>
      <p className="mt-3 text-sm leading-snug font-semibold text-navy">{roast.projectionLine}</p>
      <div className="mt-3">
        <TagBadge tag={roast.tag} />
      </div>
    </div>
  );
}
