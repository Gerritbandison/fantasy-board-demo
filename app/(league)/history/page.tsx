import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, ChevronRight, Flame, Medal, Trophy } from "lucide-react";
import { BiggestWins } from "@/components/league/biggest-wins";
import { HighScores } from "@/components/league/high-scores";
import { HallOfFameAndShame } from "@/components/league/h2h";
import { Card, PageHeader, Pill, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { CHAMPIONS, formatRecord, ordinal, STANDINGS, team, teamPath } from "@/lib/league";
import { championSeedSummary, SEASONS_WITH_HISTORY, titleBoard } from "@/lib/stats";
import { SEASONS_LABEL, TRADES } from "@/lib/trades";

export const metadata: Metadata = {
  title: "History",
  description:
    "Chicken league history: every champion and runner-up, the top 10 biggest regular-season wins, the top 20 single-week scores, the champion-seed pattern, the trophy case, each franchise's finishes, and the all-time Hall of Fame, Hall of Shame, and rivalry heatmap.",
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
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          {CHAMPIONS.length} title games on record, {champIds.size} different champions
          {multi.length
            ? `. ${multi.map((r) => `${r.team.name} (${r.titleYears.join(", ")})`).join(" and ")} ${multi.length === 1 ? "is the only franchise" : "are the only franchises"} with more than one title.`
            : "."}
        </p>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/trades"
          className="group flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line transition-all hover:ring-line-strong hover:shadow-xs"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-light text-gold-ink ring-1 ring-gold-border ring-inset">
            <ArrowLeftRight className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-1 font-display text-base leading-tight font-bold tracking-wide text-navy uppercase">
              <span>Trade desk</span>
              <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 block text-xs leading-snug text-slate-600">
              {TRADES.length} player trades ({SEASONS_LABEL}), sharks, suckers, and heists
            </span>
          </span>
        </Link>

        <a
          href="#biggest-wins"
          className="group flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line transition-all hover:ring-line-strong hover:shadow-xs"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-turf-light text-turf-dark ring-1 ring-turf-border ring-inset">
            <Flame className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-1 font-display text-base leading-tight font-bold tracking-wide text-navy uppercase">
              <span>Top 10 biggest wins</span>
              <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 block text-xs leading-snug text-slate-600">
              Largest single-week regular-season margins since 2020
            </span>
          </span>
        </a>

        <a
          href="#high-scores"
          className="group flex items-start gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line transition-all hover:ring-line-strong hover:shadow-xs"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-light text-gold-ink ring-1 ring-gold-border ring-inset">
            <Trophy className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-1 font-display text-base leading-tight font-bold tracking-wide text-navy uppercase">
              <span>Top 20 most points</span>
              <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 block text-xs leading-snug text-slate-600">
              Highest single-week regular-season scores on record
            </span>
          </span>
        </a>
      </div>

      <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-5 text-white shadow-[0_6px_20px_rgba(12,25,44,0.16)] ring-1 ring-navy-3 sm:p-6">
        <p className="flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.12em] text-gold uppercase">
          <Trophy className="size-3.5" aria-hidden /> Championship seed pattern
        </p>
        <p className="mt-1 font-display text-3xl leading-tight font-extrabold sm:text-4xl">
          {seeds.modeCount} of {seeds.total} champions were the {ordinal(seeds.modeSeed)} seed
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/80">
          {seeds.topSeedWins.length
            ? `The regular-season #1 seed has won it once (${seeds.topSeedWins.join(", ")}). Mid-seeds own this league.`
            : "The regular-season #1 seed has never won it in this stretch."}
        </p>
        <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {chronological.map((c) => (
            <li key={c.season} className="min-w-0 rounded-xl bg-white/[0.07] px-2 py-2.5 text-center ring-1 ring-white/10">
              <p className="text-xs font-semibold text-white/75 tabular-nums">{c.season}</p>
              <p className="mt-0.5 font-display text-2xl leading-none font-extrabold text-gold tabular-nums">
                {c.championSeed != null ? `#${c.championSeed}` : "—"}
              </p>
              <p className="mt-1 truncate text-xs font-bold tracking-wide text-white/90">{team(c.championId).abbrev}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2.5 text-xs text-white/75">Champion&apos;s regular-season seed, labelled with the franchise&apos;s current abbreviation.</p>
      </section>

      <SectionHeading title="Title timeline" action={`${CHAMPIONS.length} seasons`} />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHAMPIONS.map((c) => {
          const champ = team(c.championId);
          const ru = c.runnerUpId != null ? team(c.runnerUpId) : undefined;
          return (
            <Card key={c.season} as="li" accent={champ.color} bodyClassName="flex h-full flex-col">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-navy px-2 py-0.5 font-display text-lg font-extrabold text-white tabular-nums">{c.season}</span>
                  <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">
                    {c.championSeed != null ? `${ordinal(c.championSeed)} seed` : "Champion"}
                  </span>
                </div>
                <span className="flex size-8 items-center justify-center rounded-lg bg-gold-light text-gold-ink ring-1 ring-gold-border ring-inset" aria-hidden>
                  <Trophy className="size-4" />
                </span>
              </div>

              <div className="mt-3.5 flex items-center gap-3">
                <TeamAvatar teamId={champ.id} />
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight font-bold break-words text-navy">{c.championName}</p>
                  {c.championName !== champ.name ? (
                    <Link href={teamPath(champ.id)} className="mt-0.5 block text-xs font-semibold text-turf hover:underline">
                      Now {champ.name}
                    </Link>
                  ) : (
                    <Link href={teamPath(champ.id)} className="mt-0.5 block text-xs font-medium text-slate-600 hover:underline">
                      Franchise profile →
                    </Link>
                  )}
                </div>
              </div>

              {ru && (
                <div className="mt-auto pt-3.5">
                  <div className="flex items-center gap-2.5 rounded-xl bg-surface-subtle px-3 py-2 text-xs text-slate-600 ring-1 ring-line/80">
                    <TeamAvatar teamId={ru.id} size="xs" />
                    <div className="min-w-0">
                      <p className="leading-snug">
                        <span className="font-bold tracking-wide text-slate-500 uppercase">
                          Runner-up{c.runnerUpSeed != null ? ` · #${c.runnerUpSeed}` : ""}:{" "}
                        </span>
                        <span className="font-semibold break-words text-navy">{c.runnerUpName}</span>
                      </p>
                      {c.runnerUpName !== ru.name && (
                        <Link href={teamPath(ru.id)} className="font-semibold text-turf hover:underline">
                          Now {ru.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </ol>

      <SectionHeading id="awards" title="Trophy case" action={`${first}–${last}`} />
      <Card bodyClassName="p-0 sm:p-0">
        <ol className="divide-y divide-line">
          {board.map((r) => (
            <li key={r.team.id} className="flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-subtle/50 sm:px-5">
              <TeamAvatar teamId={r.team.id} />
              <div className="min-w-0 flex-1">
                <Link href={teamPath(r.team.id)} className="leading-tight font-semibold break-words text-navy hover:underline">
                  {r.team.name}
                </Link>
                <p className="mt-0.5 text-xs text-slate-600">
                  {[
                    r.allTime ? `${formatRecord(r.allTime)} regular season` : null,
                    r.bestFinish != null ? `best finish ${ordinal(r.bestFinish)}` : null,
                    r.number1Seeds.length ? `#1 seed ${r.number1Seeds.join(", ")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {(r.titleYears.length > 0 || r.runnerUpYears.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
                <p className={cn("font-display text-3xl leading-none font-extrabold tabular-nums", r.titles ? "text-gold-ink" : "text-slate-400")}>
                  {r.titles}
                </p>
                <p className="mt-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">title{r.titles === 1 ? "" : "s"}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <SectionHeading title="Finishes by season" />
      <Card bodyClassName="p-3.5 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[18rem] border-separate border-spacing-1 text-center text-sm">
            <thead>
              <tr>
                <th className="pb-1 text-left text-[11px] font-bold tracking-wider text-slate-600 uppercase">Team</th>
                {SEASONS_WITH_HISTORY.map((y) => (
                  <th key={y} className="pb-1 font-display text-xs font-bold text-slate-600 tabular-nums">
                    &apos;{String(y).slice(2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="pr-2 text-left">
                    <Link href={teamPath(t.id)} className="flex items-center gap-2 hover:underline" title={t.name}>
                      <TeamAvatar teamId={t.id} size="xs" />
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
                          "h-8 rounded-md font-display text-sm font-bold tabular-nums ring-1 ring-inset",
                          s?.champion
                            ? "bg-gold-ink text-white ring-gold-ink"
                            : ru
                              ? "bg-slate-200 text-navy ring-slate-300"
                              : s?.finish != null && s.finish <= 4
                                ? "bg-turf-light text-turf-dark ring-turf-border"
                                : "bg-surface-subtle text-slate-600 ring-line/80",
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
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded bg-gold-ink" /> Champion
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded bg-slate-200 ring-1 ring-slate-300 ring-inset" /> Runner-up
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded bg-turf-light ring-1 ring-turf-border ring-inset" /> Top 4 finish
          </span>
          <span>Numbers indicate final standing.</span>
        </div>
      </Card>

      <BiggestWins />

      <HighScores />

      <HallOfFameAndShame />

      <p className="text-xs leading-relaxed text-slate-600">
        Franchises are tracked by ESPN team slot across seasons, so a franchise&apos;s owner may have changed over the years. Season names are shown as they were that year. Open any team for its full season-by-season record.
      </p>
    </>
  );
}
