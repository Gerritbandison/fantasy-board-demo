import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { LegacyTeamHash, TeamSectionNav } from "@/components/league/TeamTabs";
import { LuckBadge, Pill, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { formatRecord, getTeam, ordinal, STANDINGS, teamPath } from "@/lib/league";
import { luck, powerRank } from "@/lib/stats";

export function generateStaticParams() {
  return STANDINGS.map((t) => ({ id: String(t.id) }));
}

export async function generateMetadata({ params }: LayoutProps<"/teams/[id]">): Promise<Metadata> {
  const t = getTeam(Number((await params).id));
  if (!t) return {};
  return {
    title: t.name,
    description: `${t.name}: ${formatRecord(t)}, ${ordinal(t.rank)} in Chicken. Schedule, roster, moves, trades, head-to-head records, and franchise history.`,
  };
}

export default async function TeamLayout({ children, params }: LayoutProps<"/teams/[id]">) {
  const t = getTeam(Number((await params).id));
  if (!t) notFound();
  const lk = luck(t.id);
  const history = t.history;
  const idx = STANDINGS.findIndex((row) => row.id === t.id);
  const prev = STANDINGS[(idx - 1 + STANDINGS.length) % STANDINGS.length];
  const next = STANDINGS[(idx + 1) % STANDINGS.length];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <LegacyTeamHash id={t.id} />

      <div className="flex items-center justify-between gap-2">
        <Link href="/teams" className="inline-flex items-center gap-1 text-xs font-bold tracking-wide text-turf uppercase hover:underline">
          ← All teams
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Link
            href={teamPath(prev.id)}
            className="rounded-md bg-white px-2.5 py-1 text-navy ring-1 ring-line transition-colors hover:bg-surface-subtle"
            title={`Previous: ${prev.name}`}
          >
            ← {prev.abbrev}
          </Link>
          <Link
            href={teamPath(next.id)}
            className="rounded-md bg-white px-2.5 py-1 text-navy ring-1 ring-line transition-colors hover:bg-surface-subtle"
            title={`Next: ${next.name}`}
          >
            {next.abbrev} →
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-white p-4 pt-5 shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line sm:p-6">
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: t.color }} aria-hidden />
        <div className="flex items-start gap-3.5 sm:gap-4">
          <TeamAvatar teamId={t.id} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs font-bold tracking-[0.14em] text-turf uppercase">
              {[`${ordinal(t.rank)} place`, t.owner].filter(Boolean).join(" · ")}
            </p>
            <h1 className="mt-1 font-display text-3xl leading-[1.03] font-extrabold tracking-tight break-words text-navy sm:text-4xl">
              {t.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Pill tone="navy">{formatRecord(t)}</Pill>
              <Pill>{ordinal(t.seed)} seed</Pill>
              <Pill tone="sky">Power #{powerRank(t.id)}</Pill>
              <LuckBadge row={lk} withRanks />
              {history.titles > 0 && (
                <Pill tone="gold">
                  <Trophy className="size-3" /> {history.titleYears.join(", ")}
                </Pill>
              )}
            </div>
            {lk && <ProvisionalNote className="mt-2.5" />}
          </div>
        </div>
      </section>

      <TeamSectionNav id={t.id} />
      {children}

      <nav aria-label="More teams" className="grid grid-cols-2 gap-3 pt-2">
        {[prev, next].map((row, index) => (
          <Link
            key={row.id}
            href={teamPath(row.id)}
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-line transition-all hover:ring-line-strong hover:shadow-xs",
              index === 1 && "flex-row-reverse text-right",
            )}
          >
            <TeamAvatar teamId={row.id} size="sm" />
            <span className="min-w-0">
              <span className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {index === 0 ? "← Previous" : "Next →"}
              </span>
              <span className="mt-0.5 block leading-tight font-semibold break-normal whitespace-normal text-navy">{row.name}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
