import type { Metadata } from "next";
import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import { Card, LuckBadge, PageHeader, Pill, ResultChip, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { MiniTrail } from "@/components/league/trail";
import { cn } from "@/lib/utils";
import {
  closeGameRecord,
  CLOSE_GAME_MARGIN,
  getLuck,
  highScores,
  intel,
  leagueGamesPlayed,
  splitMustWin,
  teamColor,
  teamIdByName,
  trackedGames,
  TRAIL_RANGE,
  trailStats,
} from "@/lib/intel";
import { BOARDS, boardForTeam, boardInvolving, formatRecord, getStanding, ordinal, snapshot } from "@/lib/league";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Chicken league hub: week 8 previews, storylines, power rankings, luck, high scores, closest games, bad beats, and team trends.",
};

const LUCK_SPAN = 6;

export default function InsightsPage() {
  const week = intel.league.week;
  const games = trackedGames();
  const scores = highScores(games);
  const closest = [...games].sort((a, b) => a.margin - b.margin).slice(0, 4);
  const badBeats = [...games].sort((a, b) => b.loser.score - a.loser.score).slice(0, 3);
  const tracked = intel.franchises.map((f) => getStanding(f.teamId)?.teamName ?? f.name);
  const coverage = `${games.length} of ${leagueGamesPlayed()} league games so far: every game involving ${tracked.slice(0, -1).join(", ")} or ${tracked[tracked.length - 1]}.`;
  const byPf = [...snapshot.standings].sort((a, b) => b.pointsFor - a.pointsFor);
  const byPa = [...snapshot.standings].sort((a, b) => b.pointsAgainst - a.pointsAgainst);
  const pfMin = Math.min(...byPf.map((s) => s.pointsFor)) - 40;
  const pfMax = byPf[0].pointsFor;
  const paMin = Math.min(...byPa.map((s) => s.pointsAgainst)) - 40;
  const paMax = byPa[0].pointsAgainst;
  const swings = intel.franchises.map((f) => ({ f, s: trailStats(f) })).sort((a, b) => b.s.stdDev - a.s.stdDev);

  return (
    <>
      <PageHeader eyebrow={`League hub · Week ${week}`} title="League insights">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Week {week} previews, storylines, and the numbers behind the standings, all from the league&apos;s own results through week {week - 1}.
        </p>
      </PageHeader>

      <SectionHeading title={`Week ${week} previews`} />
      <div className="grid gap-5 lg:grid-cols-2">
        {intel.matchupBriefs.map((b) => {
          const proj = intel.week8Projections[b.slug];
          const board = BOARDS.find((x) => x.slug === b.slug);
          const sides = proj
            ? [
                { id: teamIdByName(proj.away), score: proj.awayProj },
                { id: teamIdByName(proj.home), score: proj.homeProj },
              ]
            : [];
          const top = Math.max(...sides.map((s) => s.score));
          const must = splitMustWin(b.mustWin);
          const mustId = teamIdByName(must.subject);
          return (
            <Card key={b.slug} as="article" title={board ? `${board.manager}'s matchup` : "Featured matchup"} action="Projected">
              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                {sides.map((s) => {
                  const st = s.id ? getStanding(s.id) : undefined;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <TeamAvatar teamId={s.id} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-tight font-semibold break-words text-navy">{st?.teamName}</span>
                        <span className="text-xs text-slate-500">{st && `${formatRecord(st)} · ${ordinal(st.rank)}`}</span>
                      </span>
                      <span className={cn("font-display text-2xl font-bold tabular-nums", s.score === top ? "text-turf" : "text-slate-400")}>
                        {s.score.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{b.story}</p>
              <p className="mt-3 text-sm leading-snug text-slate-600">
                <Pill tone="loss" className="mr-1.5">
                  Must-win
                </Pill>
                <span className="font-semibold text-navy">{mustId ? getStanding(mustId)?.teamName : must.subject}</span>: {must.detail}
              </p>
              {board && (
                <Link href={board.path} className="mt-4 inline-flex h-10 items-center rounded-full bg-turf px-4 text-sm font-semibold text-white hover:bg-turf-dark">
                  Full preview & lineups →
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      <SectionHeading title="Storylines" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {intel.leaguePulse.map((p) => (
          <Card key={p.title} as="li" accent={p.tone === "alert" ? "#d99a06" : "#15803d"}>
            <p className={cn("flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase", p.tone === "alert" ? "text-amber-700" : "text-turf")}>
              {p.tone === "alert" ? <Flame className="size-3.5" /> : <TrendingUp className="size-3.5" />}
              {p.tone === "alert" ? "Hot take" : "Trend"}
            </p>
            <p className="mt-1.5 font-display text-xl leading-tight font-bold text-navy">{p.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.body}</p>
          </Card>
        ))}
      </ul>

      <SectionHeading title="Power & luck" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Power rankings" action="Top 4">
          <ol className="divide-y divide-line">
            {snapshot.insights.power.map((p, i) => {
              const id = teamIdByName(p.team);
              const s = id ? getStanding(id) : undefined;
              const luck = id ? getLuck(id) : undefined;
              const board = id ? boardForTeam(id) : undefined;
              return (
                <li key={p.team} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={cn("w-7 shrink-0 font-display text-3xl leading-none font-extrabold", i === 0 ? "text-gold" : "text-slate-300")}>{i + 1}</span>
                  <TeamAvatar teamId={id} />
                  <div className="min-w-0 flex-1">
                    <p className="leading-tight font-semibold break-words text-navy">
                      {board ? (
                        <Link href={board.path} className="underline decoration-turf/40 underline-offset-4">
                          {s?.teamName ?? p.team}
                        </Link>
                      ) : (
                        (s?.teamName ?? p.team)
                      )}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">{p.why}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s && <Pill tone="navy">{formatRecord(s)}</Pill>}
                      {s && <Pill>{s.pointsFor.toFixed(1)} PF</Pill>}
                      {luck && <LuckBadge row={luck} />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card title="Luck meter" action="Points rank vs record">
          <ol className="grid gap-2.5">
            {intel.luckIndex.map((l) => {
              const pct = (Math.min(LUCK_SPAN, Math.abs(l.luckDelta)) / LUCK_SPAN) * 50;
              const s = getStanding(l.teamId);
              return (
                <li key={l.teamId} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_2rem] items-center gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy">{s?.teamName ?? l.team}</span>
                    <span className="block text-[11px] text-slate-500">
                      {l.record} · PF #{l.pfRank} · record #{l.winRank}
                    </span>
                  </span>
                  <span className="relative h-3 rounded-full bg-slate-100" aria-hidden>
                    <span className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
                    {l.luckDelta !== 0 && (
                      <span
                        className={cn("absolute inset-y-0 rounded-full", l.luckDelta > 0 ? "left-1/2 bg-gold" : "right-1/2 bg-sky-500")}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-right font-display text-lg font-bold tabular-nums",
                      l.luckDelta > 0 ? "text-amber-700" : l.luckDelta < 0 ? "text-sky-700" : "text-slate-400",
                    )}
                  >
                    {l.luckDelta > 0 ? `+${l.luckDelta}` : l.luckDelta < 0 ? `−${-l.luckDelta}` : "0"}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-slate-500">
            Points-for rank minus record rank. <span className="font-semibold text-amber-700">Gold</span>: record is ahead of the scoring.{" "}
            <span className="font-semibold text-sky-700">Blue</span>: scoring is ahead of the record, so they&apos;re due if luck evens out.
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Points for" action="Season total">
          <BarList rows={byPf.map((s) => ({ id: s.teamId, name: s.teamName, value: s.pointsFor }))} min={pfMin} max={pfMax} />
        </Card>
        <Card title="Toughest schedules" action="Points against">
          <BarList rows={byPa.map((s) => ({ id: s.teamId, name: s.teamName, value: s.pointsAgainst }))} min={paMin} max={paMax} muted />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Points scored against each team. {byPa[0].teamName} has faced the most ({byPa[0].pointsAgainst.toFixed(1)}),{" "}
            {byPa[byPa.length - 1].teamName} the fewest ({byPa[byPa.length - 1].pointsAgainst.toFixed(1)}).
          </p>
        </Card>
      </div>

      <SectionHeading title="Record book" action={`Weeks 1–${week - 1}`} />
      <p className="-mt-3 text-xs leading-relaxed text-slate-500">Covers {coverage}</p>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="High scores">
          <ol className="divide-y divide-line">
            {scores.slice(0, 6).map((s, i) => (
              <li key={`${s.week}-${s.name}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={cn("w-5 font-display text-lg font-bold", i === 0 ? "text-gold" : "text-slate-300")}>{i + 1}</span>
                <TeamAvatar teamId={s.teamId} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{s.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ResultChip result={s.won ? "W" : "L"} className="size-4 text-[10px]" /> Wk {s.week} vs {s.vs.name}
                  </span>
                </span>
                <span className="font-display text-xl font-bold text-navy tabular-nums">{s.score.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Closest games">
          <ol className="divide-y divide-line">
            {closest.map((g) => (
              <li key={`${g.week}-${g.winner.name}`} className="py-2.5 first:pt-0 last:pb-0">
                <p className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Week {g.week}</span>
                  <Pill tone="gold">by {g.margin.toFixed(2)}</Pill>
                </p>
                <GameLine side={g.winner} won />
                <GameLine side={g.loser} />
              </li>
            ))}
          </ol>
        </Card>

        <div className="grid content-start gap-5">
          <Card title="Bad beats" action="Most points in a loss">
            <ol className="divide-y divide-line">
              {badBeats.map((g) => (
                <li key={`${g.week}-${g.loser.name}`} className="py-2.5 text-sm leading-snug text-slate-700 first:pt-0 last:pb-0">
                  <span className="font-semibold text-navy">{g.loser.name}</span> scored{" "}
                  <span className="font-display text-base font-bold text-loss tabular-nums">{g.loser.score.toFixed(2)}</span> in week {g.week} and still lost to{" "}
                  {g.winner.name} ({g.winner.score.toFixed(2)}).
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Close-game records" action={`Decided by <${CLOSE_GAME_MARGIN}`}>
            <ul className="grid gap-2">
              {intel.franchises.map((f) => {
                const r = closeGameRecord(f);
                return (
                  <li key={f.teamId} className="flex items-center gap-2.5 text-sm">
                    <TeamAvatar teamId={f.teamId} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium text-navy">{getStanding(f.teamId)?.teamName ?? f.name}</span>
                    <span className="font-display text-lg font-bold text-navy tabular-nums">
                      {r.wins}-{r.losses}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <SectionHeading title="Team trends" />
      <Card title="Boom or bust" action="Weekly low → high">
        <ul className="grid gap-4">
          {swings.map(({ f, s }, i) => {
            const { min: lo, max: hi } = TRAIL_RANGE;
            const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
            return (
              <li key={f.teamId}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <TeamAvatar teamId={f.teamId} size="sm" />
                    <span className="truncate text-sm font-semibold text-navy">{getStanding(f.teamId)?.teamName ?? f.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {i === 0 ? (
                      <Pill tone="gold">Most volatile</Pill>
                    ) : i === swings.length - 1 ? (
                      <Pill tone="turf">Steadiest</Pill>
                    ) : (
                      `±${s.stdDev.toFixed(1)}`
                    )}
                  </span>
                </div>
                <div className="relative mt-2 h-3 rounded-full bg-slate-100" role="img" aria-label={`Low ${s.low.pf.toFixed(1)}, median ${s.median.toFixed(1)}, high ${s.high.pf.toFixed(1)}`}>
                  <span
                    className="absolute inset-y-0 rounded-full opacity-30"
                    style={{ left: pos(s.low.pf), right: `calc(100% - ${pos(s.high.pf)})`, background: teamColor(f.teamId) }}
                  />
                  <span className="absolute -inset-y-0.5 w-1 -translate-x-1/2 rounded-full" style={{ left: pos(s.median), background: teamColor(f.teamId) }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>Low {s.low.pf.toFixed(1)}</span>
                  <span>Median {s.median.toFixed(1)}</span>
                  <span>High {s.high.pf.toFixed(1)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <ul className="grid gap-5 sm:grid-cols-2">
        {intel.franchises.map((f) => {
          const st = trailStats(f);
          const last3 = f.weekly2026.slice(-3);
          const last3Avg = last3.reduce((a, b) => a + b.pf, 0) / last3.length;
          const board = boardInvolving(f.teamId);
          const name = getStanding(f.teamId)?.teamName ?? f.name;
          return (
            <Card key={f.teamId} as="li" accent={teamColor(f.teamId)}>
              <div className="flex items-start gap-3">
                <TeamAvatar teamId={f.teamId} />
                <div className="min-w-0 flex-1">
                  <p className="leading-tight font-semibold break-words text-navy">{name}</p>
                  <p className="text-xs text-slate-500">
                    {f.ownerLabel} · {st.record}
                  </p>
                </div>
                <MiniTrail franchise={f} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center ring-1 ring-slate-100">
                <MiniStat label="Avg" value={st.avg.toFixed(1)} />
                <MiniStat label="Last 3" value={last3Avg.toFixed(1)} tone={last3Avg > st.avg ? "up" : "down"} />
                <MiniStat label="Best" value={st.high.pf.toFixed(1)} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{f.signature}</p>
              {board && (
                <Link href={board.path} className="mt-2 inline-block text-sm font-semibold text-turf hover:underline">
                  Week {week} matchup →
                </Link>
              )}
            </Card>
          );
        })}
      </ul>

      <p className="text-xs text-slate-500">{snapshot.displayNote}</p>
    </>
  );
}

function BarList({ rows, min, max, muted }: { rows: { id: number; name: string; value: number }[]; min: number; max: number; muted?: boolean }) {
  return (
    <ol className="grid gap-2">
      {rows.map((r, i) => (
        <li key={r.id}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-slate-700">
              <span className="mr-2 font-display font-bold text-slate-400">{i + 1}</span>
              {r.name}
            </span>
            <span className="shrink-0 font-display text-base font-bold text-navy tabular-nums">{r.value.toFixed(1)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{ width: `${((r.value - min) / (max - min)) * 100}%`, background: muted ? "#94a3b8" : teamColor(r.id) }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function GameLine({ side, won }: { side: { name: string; teamId?: number; score: number }; won?: boolean }) {
  return (
    <p className="mt-1 flex items-center gap-2 text-sm">
      <TeamAvatar teamId={side.teamId} size="sm" className="size-5 text-[8px]" />
      <span className={cn("min-w-0 flex-1 truncate", won ? "font-semibold text-navy" : "text-slate-500")}>{side.name}</span>
      <span className={cn("font-display text-base font-bold tabular-nums", won ? "text-navy" : "text-slate-400")}>{side.score.toFixed(2)}</span>
    </p>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
      <p className={cn("font-display text-lg leading-tight font-bold tabular-nums", tone === "up" ? "text-turf" : tone === "down" ? "text-loss" : "text-navy")}>
        {value}
      </p>
    </div>
  );
}
