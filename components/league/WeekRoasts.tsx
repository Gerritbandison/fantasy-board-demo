import Link from "next/link";
import { formatPoints, teamPath, USER_TEAM } from "@/lib/league";
import { WEEK_ROASTS, type RoastSide, type RoastTag } from "@/lib/roasts";
import { cn } from "@/lib/utils";
import { Card, SectionHeading, TeamAvatar } from "./ui";

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

function SideRow({ side }: { side: RoastSide }) {
  return (
    <div className="flex items-center gap-3">
      <TeamAvatar teamId={side.teamId} />
      <div className="min-w-0 flex-1">
        <Link href={teamPath(side.teamId)} className="leading-tight font-semibold break-words text-navy hover:underline">
          {side.name}
        </Link>
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-700">{side.abbrev}</span>
          <span aria-hidden> · </span>
          <span>{side.record}</span>
          <span aria-hidden> · </span>
          <span>{side.home ? "Home" : "Away"}</span>
        </p>
      </div>
      <p className="shrink-0 text-right font-display text-3xl leading-none font-bold text-navy tabular-nums">
        {formatPoints(side.points)}
        <span className="sr-only"> points</span>
      </p>
    </div>
  );
}

function TagBadge({ tag }: { tag: RoastTag }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-bold ring-1 ring-inset", TAG_TONE[tag.kind])}>{tag.label}</span>
      {tag.detail ? <span className="min-w-0 text-sm leading-snug text-slate-700">{tag.detail}</span> : null}
    </p>
  );
}

/** One card per current-week matchup. Hidden when the roast file is for another week. */
export function WeekRoasts() {
  const roasts = WEEK_ROASTS;
  if (!roasts) return null;
  const pulled = pulledLabel(roasts.dataPulledAt);

  return (
    <section aria-labelledby="roasts-heading" className="grid gap-4">
      <SectionHeading id="roasts" headingId="roasts-heading" title={`Week ${roasts.week} Roasts`} />
      {pulled ? <p className="text-sm text-slate-600">ESPN projections as of {pulled}.</p> : null}
      <ul className="grid gap-5 lg:grid-cols-2">
        {roasts.matchups.map((m) => {
          const mine = m.home.teamId === USER_TEAM.id || m.away.teamId === USER_TEAM.id;
          return (
            <Card key={m.id} as="li" accent={mine ? USER_TEAM.color : undefined}>
              <div className="grid gap-3">
                <SideRow side={m.home} />
                <SideRow side={m.away} />
              </div>
              <h3 className="mt-4 font-display text-xl leading-tight font-bold text-navy">{m.headline}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{m.roast}</p>
              <p className="mt-3 text-sm leading-snug font-semibold text-navy">{m.projectionLine}</p>
              <div className="mt-3">
                <TagBadge tag={m.tag} />
              </div>
            </Card>
          );
        })}
      </ul>
    </section>
  );
}
