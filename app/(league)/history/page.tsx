import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Medal, Trophy } from "lucide-react";
import { HallOfFameAndShame } from "@/components/league/h2h";
import { Card, PageHeader, Pill, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { CHAMPIONS, formatRecord, ordinal, STANDINGS, team, teamPath } from "@/lib/league";
import { championSeedSummary, SEASONS_WITH_HISTORY, titleBoard } from "@/lib/stats";
import { TRADES, TRADES_LABEL } from "@/lib/trades";

export const metadata: Metadata = {
  title: "History",
  description:
    "Chicken league history: every champion and runner-up, the champion-seed pattern, the trophy case, each franchise's finishes, and the all-time Hall of Fame, Hall of Shame, and rivalry heatmap.",
};

export default function HistoryPage() {
  const seeds = championSeedSummary();
  const board = titleBoard();
  const first = SEASONS_WITH_HISTORY[0];
  const last = SEASONS_WITH_HISTORY[SEASONS_WITH_HISTORY.length - 1];
  const champIds = new Set(CHAMPIONS.map((c) => c.championId));
  const multi = board.filter((r) => r.titles > 1);
  const chronological = [...CHAMPIONS].sort((a, b) => a.season - b.season);

  return (
    <>
      <PageHeader eyebrow={`League history · ${first}–${last}`} title="Chicken history">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          {CHAMPIONS.length} title games on record, {champIds.size} different champions
          {multi.length ? `. ${multi.map((r) => `${r.team.name} (${r.titleYears.join(", ")})`).join(" and ")} ${multi.length === 1 ? "is the only franchise" : "are the only franchises"} with more than one title.` : "."}
        </p>
      </PageHeader>

      <Link
        href="/trades"
        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,30,54,0.06)] ring-1 ring-line transition-colors hover:bg-slate-50 sm:px-5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-light text-amber-700">
          <ArrowLeftRight className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight font-bold tracking-wide text-navy uppercase">Trade desk</span>
          <span className="block text-sm leading-snug text-slate-600">
            {TRADES_LABEL}: {TRADES.length} player trades, judged on long-term value and roasted
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-slate-400" />
      </Link>

      <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-4 text-white shadow-lg shadow-navy/15 sm:p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gold uppercase">
          <Trophy className="size-3.5" /> League pattern
        </p>
        <p className="mt-1 font-display text-3xl leading-tight font-extrabold">
          {seeds.modeCount} of {seeds.total} champions were the {ordinal(seeds.modeSeed)} seed
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/80">
          {seeds.topSeedWins.length
            ? `The regular-season #1 seed has won it once (${seeds.topSeedWins.join(", ")}). Mid-seeds own this league.`
            : "The regular-season #1 seed has never won it in this stretch."}
        </p>
        <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {chronological.map((c) => (
            <li key={c.season} className="min-w-0 rounded-xl bg-white/10 px-1 py-2 text-center ring-1 ring-white/10">
              <p className="text-[11px] font-semibold text-white/60">{c.season}</p>
              <p className="font-display text-2xl leading-none font-extrabold text-gold">{c.championSeed != null ? `#${c.championSeed}` : "—"}</p>
              <p className="mt-1 truncate px-1 text-[11px] text-white/80">{team(c.championId).abbrev}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-white/50">Champion&apos;s regular-season seed, labelled with the franchise&apos;s current abbreviation.</p>
      </section>

      <SectionHeading title="Title timeline" />
      <ol className="relative grid gap-4 pl-7 before:absolute before:inset-y-3 before:left-[11px] before:w-0.5 before:rounded-full before:bg-line lg:grid-cols-2 lg:gap-5 lg:pl-0 lg:before:hidden">
        {CHAMPIONS.map((c) => {
          const champ = team(c.championId);
          const ru = c.runnerUpId != null ? team(c.runnerUpId) : undefined;
          return (
            <li key={c.season} className="relative">
              <span className="absolute top-5 -left-7 flex size-6 items-center justify-center rounded-full bg-gold text-white ring-4 ring-field lg:hidden" aria-hidden>
                <Trophy className="size-3.5" />
              </span>
              <Card as="article" accent={champ.color}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-3xl leading-none font-extrabold text-navy">{c.season}</p>
                    <p className="mt-0.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Champion{c.championSeed != null ? ` · ${ordinal(c.championSeed)} seed` : ""}</p>
                  </div>
                  <Trophy className="size-8 shrink-0 text-gold" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <TeamAvatar teamId={champ.id} />
                  <div className="min-w-0">
                    <p className="font-display text-2xl leading-tight font-bold break-words text-navy">{c.championName}</p>
                    {c.championName !== champ.name && (
                      <Link href={teamPath(champ.id)} className="text-xs font-semibold text-turf hover:underline">
                        Now {champ.name}
                      </Link>
                    )}
                  </div>
                </div>
                {ru && (
                  <div className="mt-3 flex items-start gap-3 border-t border-line pt-3 text-sm text-slate-600">
                    <TeamAvatar teamId={ru.id} size="sm" className="mx-1.5" />
                    <span className="min-w-0">
                      <span className="text-slate-500">Runner-up{c.runnerUpSeed != null ? ` (${ordinal(c.runnerUpSeed)} seed)` : ""}: </span>
                      <span className="font-semibold break-words text-slate-700">{c.runnerUpName}</span>
                      {c.runnerUpName !== ru.name && (
                        <Link href={teamPath(ru.id)} className="block text-xs font-semibold text-turf hover:underline">
                          Now {ru.name}
                        </Link>
                      )}
                    </span>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <SectionHeading title="Trophy case" action={`${first}–${last}`} />
      <Card bodyClassName="p-0 sm:p-0">
        <ol className="divide-y divide-line">
          {board.map((r) => (
            <li key={r.team.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <TeamAvatar teamId={r.team.id} />
              <div className="min-w-0 flex-1">
                <Link href={teamPath(r.team.id)} className="leading-tight font-semibold break-words text-navy hover:underline">
                  {r.team.name}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[
                    r.allTime ? `${formatRecord(r.allTime)} regular season` : null,
                    r.bestFinish != null ? `best finish ${ordinal(r.bestFinish)}` : null,
                    r.number1Seeds.length ? `#1 seed ${r.number1Seeds.join(", ")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {(r.titleYears.length > 0 || r.runnerUpYears.length > 0) && (
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
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("font-display text-3xl leading-none font-extrabold tabular-nums", r.titles ? "text-gold" : "text-slate-300")}>{r.titles}</p>
                <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">title{r.titles === 1 ? "" : "s"}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <SectionHeading title="Finishes by season" />
      <Card bodyClassName="p-3 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[17rem] border-separate border-spacing-1 text-center text-sm">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">Team</th>
                {SEASONS_WITH_HISTORY.map((y) => (
                  <th key={y} className="text-[11px] font-semibold text-slate-500">
                    {String(y).slice(2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="text-left">
                    <Link href={teamPath(t.id)} className="flex items-center gap-1.5" title={t.name}>
                      <TeamAvatar teamId={t.id} size="sm" className="size-6 text-[8px]" />
                      <span className="hidden truncate text-xs font-semibold text-navy sm:inline">{t.name}</span>
                    </Link>
                  </th>
                  {SEASONS_WITH_HISTORY.map((y) => {
                    const s = t.history.seasons.find((x) => x.season === y);
                    const ru = t.history.finalsYears.includes(y) && !s?.champion;
                    return (
                      <td
                        key={y}
                        title={s ? `${y}: ${s.name}, ${formatRecord(s)}${s.finish != null ? `, finished ${ordinal(s.finish)}` : ""}` : undefined}
                        className={cn(
                          "h-8 rounded-md font-display text-sm font-bold tabular-nums",
                          s?.champion ? "bg-gold text-white" : ru ? "bg-slate-300 text-slate-800" : s?.finish != null && s.finish <= 4 ? "bg-turf-light text-turf-dark" : "bg-slate-50 text-slate-400",
                        )}
                      >
                        {s?.finish ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-gold" /> Champion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-slate-300" /> Runner-up
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-turf-light" /> Top 4 finish
          </span>
          <span>Numbers are final rank.</span>
        </div>
      </Card>

      <HallOfFameAndShame />

      <p className="text-xs leading-relaxed text-slate-500">
        Franchises are tracked by ESPN team slot across seasons, so a franchise&apos;s owner may have changed over the years. Season names are shown as they were that year. Open any team for its full season-by-season record.
      </p>
    </>
  );
}
