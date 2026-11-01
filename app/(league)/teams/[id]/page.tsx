import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftRight, Medal, ShieldAlert, Trophy } from "lucide-react";
import { BenchList, PlayerCell } from "@/components/league/MatchupBoard";
import { ScoreReadout, SlotChip } from "@/components/league/bits";
import { TeamHeadToHead } from "@/components/league/h2h";
import { TeamTabs } from "@/components/league/TeamTabs";
import { TeamTradesSection } from "@/components/league/trades";
import { RosterOutlook } from "@/components/league/RosterOutlook";
import { Card, LuckBadge, PageHeader, Pill, RangeBar, ResultChip, SectionHeading, Stat, TeamAvatar } from "@/components/league/ui";
import { ScoreTrail, TrailLegend, WeekStrip } from "@/components/league/trail";
import { cn } from "@/lib/utils";
import { formatRecord, getTeam, isFlagged, LEAGUE, matchupFor, matchupPath, ordinal, STANDINGS, team, teamPath, type MatchupSide } from "@/lib/league";
import {
  allPlay,
  CLOSE_GAME_MARGIN,
  closeGameRecord,
  LEAGUE_AVG_BY_WEEK,
  luck,
  paRank,
  pfRank,
  powerRank,
  schedule,
  teamStats,
  weeklyTopCount,
} from "@/lib/stats";

export function generateStaticParams() {
  return STANDINGS.map((t) => ({ id: String(t.id) }));
}

export async function generateMetadata({ params }: PageProps<"/teams/[id]">): Promise<Metadata> {
  const t = getTeam(Number((await params).id));
  if (!t) return {};
  return { title: t.name, description: `${t.name}: ${formatRecord(t)}, ${ordinal(t.rank)} in Chicken. Schedule, roster, moves, trades, head-to-head records, and franchise history.` };
}

export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const t = getTeam(Number((await params).id));
  if (!t) notFound();

  const s = teamStats(t);
  const ap = allPlay(t.id);
  const lk = luck(t.id);
  const sos = schedule(t.id);
  const close = closeGameRecord(t.id);
  const tops = weeklyTopCount(t.id);
  const m = matchupFor(t.id);
  const mine: MatchupSide | undefined = m ? (m.left.teamId === t.id ? m.left : m.right) : undefined;
  const opp: MatchupSide | undefined = m ? (m.left.teamId === t.id ? m.right : m.left) : undefined;
  const oppId = opp?.teamId;
  const myProj = mine?.projected;
  const rosterPlayers = [...t.roster.starters, ...t.roster.bench, ...t.roster.ir];
  const flagged = rosterPlayers.filter(isFlagged);
  const onBye = rosterPlayers.filter((p) => p.onBye);
  const idx = STANDINGS.findIndex((x) => x.id === t.id);
  const prev = STANDINGS[(idx - 1 + STANDINGS.length) % STANDINGS.length];
  const next = STANDINGS[(idx + 1) % STANDINGS.length];
  const h = t.history;

  const overview = (
    <>
      {t.isUser && <RosterOutlook />}
      <Card bodyClassName="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Points for" value={t.pointsFor.toFixed(1)} sub={`${ordinal(pfRank(t.id))} in the league`} />
        <Stat label="Points against" value={t.pointsAgainst.toFixed(1)} sub={`${ordinal(paRank(t.id))} most faced`} />
        <Stat label="Avg / week" value={s.avg.toFixed(1)} sub={`Median ${s.median.toFixed(1)}`} />
        <Stat label="All-play" value={`${ap.wins}-${ap.losses}`} sub={`${ap.expectedWins.toFixed(1)} expected wins`} />
        <Stat label={`Close games <${CLOSE_GAME_MARGIN}`} value={`${close.wins}-${close.losses}`} sub={close.games ? `${close.games} game${close.games === 1 ? "" : "s"}` : "None yet"} />
        {(t.projectedRank != null || t.draftRank != null) && (
          <Stat
            label="ESPN projected finish"
            value={t.projectedRank != null ? ordinal(t.projectedRank) : "—"}
            sub={t.draftRank != null ? `Draft day: ${ordinal(t.draftRank)}` : undefined}
          />
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          {m && oppId != null && (
            <Card title={`Week ${LEAGUE.week} matchup`} action={m.state === "live" ? "In progress" : m.state === "final" ? "Final" : "Projected"} accent={t.color}>
              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                {[mine, opp].filter((x): x is MatchupSide => x != null).map((x) => {
                  const xt = team(x.teamId);
                  const live = m.state !== "projected";
                  const shown = live ? (x.points ?? 0) : (x.projected ?? -1);
                  const other = x === mine ? opp : mine;
                  const otherShown = other ? (live ? (other.points ?? 0) : (other.projected ?? -1)) : -1;
                  const lead = shown === Math.max(shown, otherShown);
                  return (
                    <div key={x.teamId} className="flex items-center gap-3">
                      <TeamAvatar teamId={x.teamId} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-tight font-semibold break-words text-navy">{xt.name}</span>
                        <span className="text-xs text-slate-600">
                          {formatRecord(xt)} · {ordinal(xt.rank)} · {m.homeId === x.teamId ? "Home" : "Away"}
                        </span>
                      </span>
                      <span className={cn("font-display text-2xl font-bold tabular-nums", lead ? "text-turf" : "text-slate-600")}>
                        <ScoreReadout side={x} state={m.state} bracketClassName="text-slate-600" />
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href={matchupPath(m)} className="mt-4 inline-flex h-10 items-center rounded-full bg-turf px-4 text-sm font-semibold text-white hover:bg-turf-dark">
                Matchup preview →
              </Link>
            </Card>
          )}

          <Card title="Weekly scoring" action="vs league average">
            <TrailLegend focus={t} />
            <ScoreTrail focus={t} focusProj={myProj} />
            <WeekStrip weeks={t.weekly} className="mt-3" />
            <p className="mt-3 text-sm text-slate-600">
              Beat the weekly league average in <span className="font-semibold text-navy">{s.aboveAvgWeeks} of {t.weekly.length}</span> weeks
              {tops > 0 && (
                <>
                  {" "}
                  and was the league&apos;s top scorer <span className="font-semibold text-navy">{tops === 1 ? "once" : `${tops} times`}</span>
                </>
              )}
              .
            </p>
          </Card>

          <Card title="Results" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-y border-line bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                  <th className="w-11 py-2 pl-4 sm:pl-5">Wk</th>
                  <th className="py-2">Opponent</th>
                  <th className="w-[5.5rem] py-2 text-right">Score</th>
                  <th className="w-16 py-2 pr-4 text-right sm:pr-5">vs avg</th>
                </tr>
              </thead>
              <tbody>
                {t.weekly.map((w) => {
                  const diff = w.pf - (LEAGUE_AVG_BY_WEEK.get(w.week) ?? 0);
                  return (
                    <tr key={w.week} className="border-b border-line last:border-0">
                      <td className="py-2.5 pl-4 font-display font-bold text-slate-600 sm:pl-5">{w.week}</td>
                      <td className="py-2.5 pr-2">
                        <Link href={teamPath(w.opponentId)} className="flex min-w-0 items-center gap-2 hover:underline">
                          <ResultChip result={w.result} />
                          <span className="truncate text-slate-700">
                            {w.home ? "vs" : "@"} {team(w.opponentId).name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className="font-semibold text-navy">{w.pf.toFixed(1)}</span>
                        <span className="text-slate-600">–{w.pa.toFixed(1)}</span>
                      </td>
                      <td className={cn("py-2.5 pr-4 text-right font-semibold tabular-nums sm:pr-5", diff >= 0 ? "text-turf" : "text-loss")}>
                        {diff >= 0 ? "+" : "−"}
                        {Math.abs(diff).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="grid content-start gap-5">
          <Card title="Boom or bust" action={`±${s.stdDev.toFixed(1)} weekly swing`}>
            <RangeBar low={s.low.pf} median={s.median} high={s.high.pf} color={t.color} />
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Stat label="Worst" value={s.low.pf.toFixed(1)} sub={`Wk ${s.low.week} vs ${team(s.low.opponentId).abbrev}`} valueClassName="text-loss" />
              <Stat label="Median" value={s.median.toFixed(1)} />
              <Stat label="Best" value={s.high.pf.toFixed(1)} sub={`Wk ${s.high.week} vs ${team(s.high.opponentId).abbrev}`} valueClassName="text-turf" />
            </div>
          </Card>

          <Card title="Luck & schedule">
            <dl className="grid gap-2.5 text-sm">
              <Row label="Points-for rank vs standings" value={`#${lk.pfRank} vs #${lk.recordRank}`} />
              <Row
                label="Wins vs all-play expectation"
                value={`${lk.winsOverExpected >= 0 ? "+" : "−"}${Math.abs(lk.winsOverExpected).toFixed(1)}`}
                tone={lk.winsOverExpected >= 0.5 ? "gold" : lk.winsOverExpected <= -0.5 ? "sky" : undefined}
              />
              <Row label="Points against per game" value={sos.paPerGame.toFixed(1)} />
              <Row label="Opponents' season average" value={sos.oppAvg.toFixed(1)} />
              <Row label="Last 3 weeks average" value={s.last3.toFixed(1)} tone={s.last3 > s.avg ? "turf" : "loss"} />
            </dl>
          </Card>

          {onBye.length > 0 && (
            <p className="text-sm leading-snug text-slate-600">
              Bye this week: {onBye.map((p) => p.name).join(", ")}.
            </p>
          )}

          {flagged.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-loss" />
              <div className="min-w-0 text-sm leading-snug">
                <p className="font-bold text-red-800">Injury report</p>
                <ul className="mt-1 grid gap-1">
                  {flagged.map((p) => (
                    <li key={p.name} className="flex items-center gap-2 text-slate-700">
                      <SlotChip slot={p.slot === "Bench" ? "Bench" : p.slot} className="h-6 min-w-9 text-xs" />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="text-xs font-semibold text-loss">{p.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Card title="Recent moves" action="Last two weeks">
            {t.moves.length ? (
              <ul className="divide-y divide-line">
                {t.moves.map((mv, i) => (
                  <li key={i} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                    <ArrowLeftRight className="mt-0.5 size-4 shrink-0 text-slate-600" />
                    <div className="min-w-0 text-sm leading-snug">
                      <p className="text-xs font-semibold text-slate-600">
                        {[mv.week != null ? `Week ${mv.week}` : null, mv.date ? formatDate(mv.date) : null, moveLabel(mv.type)]
                          .filter(Boolean)
                          .join(" · ")}
                        {mv.faabBid != null && ` · $${mv.faabBid} FAAB`}
                      </p>
                      {mv.added.map((a) => (
                        <p key={a} className="text-slate-700">
                          <span className="font-bold text-turf">+ </span>
                          {a}
                        </p>
                      ))}
                      {mv.dropped.map((d) => (
                        <p key={d} className="text-slate-600">
                          <span className="font-bold text-loss">− </span>
                          {d}
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No completed moves in the last two weeks.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );

  const roster = (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title="Starters" action={`${t.roster.starters.length}`}>
          <ul className="divide-y divide-line">
            {t.roster.starters.map((p) => (
              <li key={p.name} className="flex min-h-14 items-center gap-3 py-2">
                <SlotChip slot={p.slot} />
                <PlayerCell player={p} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Bench & IR" action={`${t.roster.bench.length + t.roster.ir.length}`}>
          <BenchList players={[...t.roster.bench, ...t.roster.ir]} />
        </Card>
      </div>
    </>
  );

  const history = (
    <>
      <SectionHeading title="Franchise history" action={`${h.seasons[0]?.season}–${h.seasons[h.seasons.length - 1]?.season}`} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card title="Trophy case">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Titles" value={h.titles} valueClassName={h.titles ? "text-gold-ink" : "text-slate-600"} sub={h.titleYears.join(", ") || undefined} />
            <Stat label="Finals" value={h.finalsYears.length} sub={h.finalsYears.join(", ") || undefined} />
            {h.bestFinish != null && <Stat label="Best finish" value={ordinal(h.bestFinish)} />}
            <Stat label="#1 seeds" value={h.number1Seeds.length} sub={h.number1Seeds.join(", ") || undefined} />
            {h.allTime && <Stat label="Reg. season" value={formatRecord(h.allTime)} sub={`${(winPct(h.allTime) * 100).toFixed(0)}% wins, 2020–25`} />}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {h.titleYears.map((y) => (
              <Pill key={`t${y}`} tone="gold">
                <Trophy className="size-3" /> {y} champion
              </Pill>
            ))}
            {h.finalsYears
              .filter((y) => !h.titleYears.includes(y))
              .map((y) => (
                <Pill key={`f${y}`}>
                  <Medal className="size-3" /> {y} runner-up
                </Pill>
              ))}
          </div>
        </Card>

        <Card title="Season by season" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-y border-line bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                <th className="w-14 py-2 pl-4 sm:pl-5">Year</th>
                <th className="py-2">Team name</th>
                <th className="w-12 py-2 text-right">W-L</th>
                <th className="w-11 py-2 text-right">Seed</th>
                <th className="w-[4.5rem] py-2 pr-4 text-right sm:pr-5">Finish</th>
              </tr>
            </thead>
            <tbody>
              {[...h.seasons].reverse().map((se) => {
                const ru = h.finalsYears.includes(se.season) && !se.champion;
                return (
                  <tr key={se.season} className={cn("border-b border-line last:border-0", se.champion && "bg-gold-light/60")}>
                    <td className="py-2.5 pl-4 font-display font-bold text-navy sm:pl-5">{se.season}</td>
                    <td className="py-2.5 pr-2">
                      <span className="block leading-tight break-words text-slate-700">{se.name}</span>
                      {se.pointsFor != null && <span className="text-xs text-slate-600 tabular-nums">{se.pointsFor.toFixed(1)} PF</span>}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-navy tabular-nums">{formatRecord(se)}</td>
                    <td className="py-2.5 text-right text-slate-600 tabular-nums">{se.seed ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-right sm:pr-5">
                      {se.champion ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Trophy className="size-3.5" /> 1st
                        </span>
                      ) : ru ? (
                        <span className="font-semibold text-slate-700">2nd</span>
                      ) : se.finish != null ? (
                        <span className="text-slate-600 tabular-nums">{ordinal(se.finish)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">
            History follows ESPN team slot {t.id} across seasons. Names are as shown that season; the owner may have changed along the way.
          </p>
        </Card>
      </div>
    </>
  );

  return (
    <>
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
            {h.titles > 0 && (
              <Pill tone="gold">
                <Trophy className="size-3" /> {h.titleYears.join(", ")}
              </Pill>
            )}
          </div>
        </PageHeader>
      </div>

      <TeamTabs
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "roster", label: "Roster", content: roster },
          { id: "trades", label: "Trades", content: <TeamTradesSection teamId={t.id} /> },
          { id: "h2h", label: "H2H", title: "Head-to-head", content: <TeamHeadToHead teamId={t.id} /> },
          { id: "history", label: "History", content: history },
        ]}
      />

      <nav aria-label="More teams" className="grid grid-cols-2 gap-3">
        {[prev, next].map((x, i) => (
          <Link key={x.id} href={teamPath(x.id)} className={cn("flex min-w-0 items-center gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-line hover:shadow-sm", i === 1 && "flex-row-reverse text-right")}>
            <TeamAvatar teamId={x.id} size="sm" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-600">{i === 0 ? "← Previous" : "Next →"}</span>
              <span className="block truncate text-sm font-semibold text-navy">{x.name}</span>
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "gold" | "sky" | "turf" | "loss" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={cn(
          "font-display text-lg font-bold tabular-nums",
          tone === "gold" ? "text-amber-700" : tone === "sky" ? "text-sky-700" : tone === "turf" ? "text-turf" : tone === "loss" ? "text-loss" : "text-navy",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function winPct(r: { wins: number; losses: number; ties: number }) {
  const g = r.wins + r.losses + r.ties;
  return g ? (r.wins + r.ties / 2) / g : 0;
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function moveLabel(type: string) {
  if (type === "waiver") return "Waiver claim";
  if (type === "drop") return "Drop";
  if (type === "trade") return "Trade";
  return "Free agent";
}
