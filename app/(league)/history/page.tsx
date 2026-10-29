import type { Metadata } from "next";
import Link from "next/link";
import { Medal, Trophy } from "lucide-react";
import { Card, PageHeader, Pill, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { MiniTrail } from "@/components/league/trail";
import { cn } from "@/lib/utils";
import { archiveHits, championSeeds, displayName, intel, teamColor, teamIdByName, titleBoard, trailStats, type ArchiveRole } from "@/lib/intel";
import { boardInvolving, getStanding } from "@/lib/league";

export const metadata: Metadata = {
  title: "History",
  description: "Chicken league history: champions 2022–2025, the mid-seed title pattern, the trophy case, and franchise arcs.",
};

const ROLE: { [r in ArchiveRole]: { label: string; cell: string } } = {
  champion: { label: "Champ", cell: "bg-gold text-white" },
  "runner-up": { label: "Final", cell: "bg-slate-200 text-slate-700" },
  mentioned: { label: "Note", cell: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200" },
};

export default function HistoryPage() {
  const seeds = championSeeds();
  const board = titleBoard();
  const years = intel.league.seasonsOnRecord;
  const champYears = intel.champions.map((c) => c.year).sort((a, b) => a - b);
  const distinct = new Set(intel.champions.map((c) => c.champion)).size;
  const midSeed = intel.leaguePulse.find((p) => /mid-seed/i.test(p.title));
  const seedList = champYears.map((y) => seeds.get(y)).filter((s): s is number => s != null);

  return (
    <>
      <PageHeader eyebrow={`League history · ${years[0]}–${years[years.length - 1]}`} title="Chicken history">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          {intel.champions.length} title games on record ({champYears[0]}–{champYears[champYears.length - 1]}), {distinct} different champions
          {distinct === intel.champions.length ? ", and nobody has won twice" : ""}.
        </p>
      </PageHeader>

      {midSeed && (
        <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-4 text-white shadow-lg shadow-navy/15 sm:p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gold uppercase">
            <Trophy className="size-3.5" /> League pattern
          </p>
          <p className="mt-1 font-display text-3xl leading-tight font-extrabold">{midSeed.title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-white/80">{midSeed.body}</p>
          {seedList.length > 0 && (
            <ol className="mt-4 grid grid-cols-4 gap-2">
              {champYears.map((y) => {
                const c = intel.champions.find((x) => x.year === y)!;
                return (
                  <li key={y} className="rounded-xl bg-white/10 px-1 py-2 text-center ring-1 ring-white/10">
                    <p className="text-[11px] font-semibold text-white/60">{y}</p>
                    <p className="font-display text-2xl leading-none font-extrabold text-gold">#{seeds.get(y) ?? "?"}</p>
                    <p className="mt-1 truncate px-1 text-[11px] text-white/80">{displayName(c.champion).split(" ")[0]}</p>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-2 text-[11px] text-white/50">Champion&apos;s playoff seed</p>
        </section>
      )}

      <SectionHeading title="Title timeline" />
      <ol className="relative grid gap-4 pl-7 before:absolute before:inset-y-3 before:left-[11px] before:w-0.5 before:rounded-full before:bg-line lg:grid-cols-2 lg:gap-5 lg:pl-0 lg:before:hidden">
        {intel.champions.map((c) => {
          const champId = teamIdByName(c.champion);
          const ruId = teamIdByName(c.runnerUp);
          const seed = seeds.get(c.year);
          return (
            <li key={c.year} className="relative">
              <span className="absolute top-5 -left-7 flex size-6 items-center justify-center rounded-full bg-gold text-white ring-4 ring-field lg:hidden" aria-hidden>
                <Trophy className="size-3.5" />
              </span>
              <Card as="article" accent={champId ? teamColor(champId) : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-3xl leading-none font-extrabold text-navy">{c.year}</p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Champion{seed ? ` · ${seed} seed` : ""}</p>
                  </div>
                  <Trophy className="size-8 shrink-0 text-gold" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <TeamAvatar teamId={champId} />
                  <p className="min-w-0 font-display text-2xl leading-tight font-bold break-words text-navy">{displayName(c.champion)}</p>
                </div>
                <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
                  <TeamAvatar teamId={ruId} size="sm" className="mx-1.5" />
                  <span className="min-w-0">
                    <span className="text-slate-500">Runner-up: </span>
                    <span className="font-semibold text-slate-700">{displayName(c.runnerUp)}</span>
                  </span>
                </div>
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-slate-600">{c.note}</p>
              </Card>
            </li>
          );
        })}
      </ol>

      <SectionHeading title="Trophy case" action={`${champYears[0]}–${champYears[champYears.length - 1]}`} />
      <Card bodyClassName="p-0 sm:p-0">
        <ol className="divide-y divide-line">
          {board.map((r) => (
            <li key={r.team} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <TeamAvatar teamId={r.teamId} />
              <div className="min-w-0 flex-1">
                <p className="leading-tight font-semibold break-words text-navy">{displayName(r.team)}</p>
                <p className="mt-0.5 text-sm leading-snug text-slate-600">
                  {r.note ?? (r.runnerUpYears.length > 1 ? `${r.runnerUpYears.length}-time runner-up, still chasing a first title` : "")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.titleYears.map((y) => (
                    <Pill key={`t${y}`} tone="gold">
                      <Trophy className="size-3" /> {y}
                    </Pill>
                  ))}
                  {r.runnerUpYears.map((y) => (
                    <Pill key={`r${y}`}>
                      <Medal className="size-3" /> {y} final
                    </Pill>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("font-display text-3xl leading-none font-extrabold tabular-nums", r.titles ? "text-gold" : "text-slate-300")}>{r.titles}</p>
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">title{r.titles === 1 ? "" : "s"}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <SectionHeading title="Franchise arcs" />
      <ul className="grid gap-5 lg:grid-cols-2">
        {intel.franchises.map((f) => {
          const hits = archiveHits(f);
          const st = trailStats(f);
          const op = boardInvolving(f.teamId);
          const name = getStanding(f.teamId)?.teamName ?? f.name;
          return (
            <Card key={f.teamId} as="li" accent={teamColor(f.teamId)}>
              <div className="flex items-start gap-3">
                <TeamAvatar teamId={f.teamId} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl leading-tight font-bold break-words text-navy">{name}</p>
                  <p className="text-sm text-slate-500">
                    {f.ownerLabel} · {f.titles} title{f.titles === 1 ? "" : "s"} · Playoffs {f.playoffAppearancesRecent}
                  </p>
                </div>
              </div>

              <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-label={`${name} by season`}>
                {champYears.map((y) => {
                  const hit = hits.find((h) => h.year === y);
                  return (
                    <li key={y} className="text-center">
                      <p className="text-[11px] font-semibold text-slate-400">{y}</p>
                      <p className={cn("mt-0.5 flex h-7 items-center justify-center rounded-md text-xs font-bold", hit ? ROLE[hit.role].cell : "bg-slate-50 text-slate-300")}>
                        {hit ? ROLE[hit.role].label : "—"}
                      </p>
                    </li>
                  );
                })}
                <li className="text-center">
                  <p className="text-[11px] font-semibold text-turf">{intel.league.season}</p>
                  <p className="mt-0.5 flex h-7 items-center justify-center rounded-md bg-turf-light font-display text-sm font-bold text-turf-dark tabular-nums">
                    {st.record}
                  </p>
                </li>
              </ol>

              <p className="mt-4 text-[15px] leading-relaxed text-slate-700">{f.arc}</p>

              {hits.length > 0 && (
                <ul className="mt-3 grid gap-2 border-l-2 border-line pl-3">
                  {hits.map((h) => (
                    <li key={h.year} className="text-sm leading-snug text-slate-600">
                      <span className={cn("mr-1.5 font-display font-bold", h.role === "champion" ? "text-amber-700" : "text-navy")}>{h.year}</span>
                      {h.role === "champion" && <span className="font-semibold text-slate-700">Beat {displayName(h.runnerUp)} in the final. </span>}
                      {h.role === "runner-up" && <span className="font-semibold text-slate-700">Lost the final to {displayName(h.champion)}. </span>}
                      {h.note}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                <div className="min-w-0 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">{intel.league.season} so far</p>
                  <p>
                    {st.record} · median {st.median.toFixed(1)} · best {st.high.pf.toFixed(1)}
                  </p>
                </div>
                <MiniTrail franchise={f} />
              </div>
              {op && (
                <Link href={op.path} className="mt-3 inline-block text-sm font-semibold text-turf hover:underline">
                  Week {intel.league.week} matchup →
                </Link>
              )}
            </Card>
          );
        })}
      </ul>

      <p className="text-xs text-slate-500">
        Seasons on record: {years.join(", ")}. Title-game details are on file for {champYears.join(", ")}.
      </p>
    </>
  );
}
