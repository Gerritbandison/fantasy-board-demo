import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { LegacyTeamHash, TeamSectionNav } from "@/components/league/TeamTabs";
import { LuckBadge, PageHeader, Pill, TeamAvatar } from "@/components/league/ui";
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
      <Link href="/teams" className="-mb-2 text-sm font-semibold text-turf hover:underline">
        ← All teams
      </Link>
      <div className="flex items-start gap-4">
        <TeamAvatar teamId={t.id} size="lg" className="mt-5 hidden sm:inline-flex" />
        <PageHeader eyebrow={[`${ordinal(t.rank)} place`, t.owner].filter(Boolean).join(" · ")} title={t.name}>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill tone="navy">{formatRecord(t)}</Pill>
            <Pill>{ordinal(t.seed)} seed</Pill>
            <Pill tone="sky">Power #{powerRank(t.id)}</Pill>
            <LuckBadge row={lk} withRanks />
            <ProvisionalNote className="basis-full text-sm font-semibold text-amber-800" />
            {history.titles > 0 && (
              <Pill tone="gold">
                <Trophy className="size-3" /> {history.titleYears.join(", ")}
              </Pill>
            )}
          </div>
        </PageHeader>
      </div>
      <TeamSectionNav id={t.id} />
      {children}
      <nav aria-label="More teams" className="grid grid-cols-2 gap-3">
        {[prev, next].map((row, index) => (
          <Link
            key={row.id}
            href={teamPath(row.id)}
            className={cn("flex min-w-0 items-center gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-line hover:shadow-sm", index === 1 && "flex-row-reverse text-right")}
          >
            <TeamAvatar teamId={row.id} size="sm" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-600">{index === 0 ? "← Previous" : "Next →"}</span>
              <span className="block break-normal whitespace-normal text-sm font-semibold text-navy">{row.name}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
