import type { Metadata } from "next";
import Link from "next/link";
import { ScoreReadout, StateBadge } from "@/components/league/bits";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { Card, PageHeader, Pill, RangeBar, RankBadge, ResultChip, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { slateRead } from "@/lib/commentary";
import { scoreEmphasis } from "@/lib/score-display";
import {
  formatRecord,
  GAMES,
  LEAGUE,
  loserSide,
  MATCHUPS,
  matchupPath,
  STANDINGS,
  team,
  teamPath,
  TEAMS,
  WEEKS_PLAYED,
  winnerSide,
  type Game,
} from "@/lib/league";
import { liveBoard } from "@/lib/live-board";
import { diffSnapshot } from "@/lib/snapshot";
import { loadPriorSnapshot } from "@/lib/snapshot-store";
import { recordBookLabel } from "@/lib/week-state";
import { matchupFacts } from "@/lib/preview";
import {
  ALL_SCORES,
  BAD_BEATS,
  BLOWOUTS,
  CLOSE_GAME_MARGIN,
  CLOSEST_GAMES,
  closeGameRecord,
  consistencyTable,
  H2H,
  LEAGUE_AVG,
  luckTable,
  powerRankings,
  scheduleTable,
  teamStats,
  weeklyLeaders,
  weeklyTopCount,
} from "@/lib/stats";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Chicken league insights across all ten teams and every game: power rankings, luck, high scores, closest games, bad beats, strength of schedule, consistency, and head-to-head.",
};

const LUCK_SPAN = 5;

export default function InsightsPage() {
  const week = LEAGUE.week;
  const power = powerRankings();
  const snapshot = diffSnapshot(loadPriorSnapshot(LEAGUE.week, LEAGUE.generatedAt), liveBoard());
  const powerMove = snapshot.available ? new Map(snapshot.odds.map((row) => [row.teamId, row.powerDelta])) : null;
  const luckRows = luckTable();
  const byPf = [...TEAMS].sort((a, b) => b.pointsFor - a.pointsFor);
  const sos = scheduleTable();
  const consistency = consistencyTable();
  const leaders = weeklyLeaders();
  const hottest = [...TEAMS].sort((a, b) => teamStats(b).last3 - teamStats(a).last3)[0];
  const unluckiest = [...luckRows].sort((a, b) => a.winsOverExpected - b.winsOverExpected)[0];
  const topScore = ALL_SCORES[0];
  const pfMin = Math.min(...byPf.map((t) => t.pointsFor)) - 40;
  const pfMax = byPf[0].pointsFor;
  const oppMin = Math.min(...sos.map((r) => r.oppAvg)) - 5;
  const oppMax = sos[0].oppAvg;

  return (
    <>
      <PageHeader eyebrow={`League hub · Week ${week}`} title="League insights">
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          {slateRead(MATCHUPS.map(matchupFacts))}{" "}
          {LEAGUE.provisionalLabel
            ? `Records, points for, and all-play include Week ${week}, which is still in progress. The record book covers the ${GAMES.length} final games through week ${week - 1}.`
            : `Records, points, all-play, and the record book cover the ${GAMES.length} final games through week ${week}.`}
        </p>
        {LEAGUE.provisionalLabel && (
          <div className="mt-3">
            <ProvisionalNote />
          </div>
        )}
      </PageHeader>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Glance label="Best record" teamId={STANDINGS[0].id} value={formatRecord(STANDINGS[0])} />
        <Glance label="Most points" teamId={byPf[0].id} value={byPf[0].pointsFor.toFixed(1)} />
        <Glance label="Hottest (last 3)" teamId={hottest.id} value={teamStats(hottest).last3.toFixed(1)} sub="pts/wk" />
        <Glance label="Top single game" teamId={topScore.teamId} value={topScore.score.toFixed(2)} sub={`Wk ${topScore.week}`} />
        <Glance
          label="Unluckiest"
          teamId={unluckiest.teamId}
          value={`${unluckiest.winsOverExpected < 0 ? "−" : "+"}${Math.abs(unluckiest.winsOverExpected).toFixed(1)}`}
          sub="vs all-play"
          className="col-span-2 sm:col-span-1"
        />
      </ul>

      <Card
        title={`Week ${week} slate`}
        action={
          <Link href="/matchups" className="font-semibold text-turf hover:underline">
            All scores →
          </Link>
        }
      >
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {MATCHUPS.map((m) => (
            <li key={m.slug}>
              <Link
                href={matchupPath(m)}
                className="block rounded-xl bg-surface-subtle p-3 ring-1 ring-line/90 transition-all hover:bg-white hover:ring-line-strong hover:shadow-xs"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Wk {m.week}</span>
                  <StateBadge state={m.state} className="px-1.5 py-0 text-[10px]" />
                </div>
                <div className="grid gap-1.5">
                  {[m.left, m.right].map((s) => {
                    const other = s === m.left ? m.right : m.left;
                    const emph = scoreEmphasis(m.state, s.points ?? null, s.projected ?? null, other.points ?? null, other.projected ?? null);
                    return (
                      <p key={s.teamId} className="flex items-center gap-2 text-sm">
                        <TeamAvatar teamId={s.teamId} size="xs" />
                        <span className={cn("min-w-0 flex-1 truncate", emph !== "plain" ? "font-semibold text-navy" : "text-slate-600")}>
                          {team(s.teamId).abbrev}
                        </span>
                        <span
                          className={cn(
                            "font-display text-base font-bold tabular-nums",
                            emph === "ahead" ? "text-turf-dark" : emph === "favorite" ? "text-navy" : "text-slate-600",
                          )}
                        >
                          <ScoreReadout side={s} state={m.state} bracketClassName="text-[11px] text-slate-500" />
                        </span>
                      </p>
                    );
                  })}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <SectionHeading id="power" title="Power & luck" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Power rankings" action="By all-play record">
          <ol className="divide-y divide-line">
            {power.map((p) => (
              <li key={p.team.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <RankBadge rank={p.rank} highlight={p.rank === 1 ? "gold" : p.rank <= 4 ? "turf" : "plain"} />
                <TeamAvatar teamId={p.team.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link href={teamPath(p.team.id)} className="block truncate text-sm font-semibold text-navy hover:underline">
                    {p.team.name}
                  </Link>
                  <p className="text-xs text-slate-600 tabular-nums">
                    All-play {p.allPlay.wins}-{p.allPlay.losses} · actual {formatRecord(p.team)} · L3 {p.last3.toFixed(1)}
                  </p>
                </div>
                <PowerMark delta={powerMove ? (powerMove.get(p.team.id) ?? null) : null} standingsRank={p.team.rank} />
              </li>
            ))}
          </ol>
          <p className="mt-3.5 border-t border-line pt-3 text-xs leading-relaxed text-slate-600">
            All-play: each week, every team is scored against all nine others.{" "}
            {powerMove
              ? `Badges show power-rank movement since the Week ${snapshot.week} snapshot.`
              : "W-L indicates current standings rank."}
          </p>
        </Card>

        <Card title="Luck meter" action="Points rank vs record">
          <ol className="grid gap-2.5">
            {luckRows.map((l) => {
              const pct = (Math.min(LUCK_SPAN, Math.abs(l.delta)) / LUCK_SPAN) * 50;
              const t = team(l.teamId);
              return (
                <li key={l.teamId} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_2.25rem] items-center gap-2.5">
                  <span className="min-w-0">
                    <Link href={teamPath(t.id)} className="block truncate text-sm font-semibold text-navy hover:underline">
                      {t.name}
                    </Link>
                    <span className="block text-xs text-slate-600 tabular-nums">
                      {formatRecord(t)} · PF #{l.pfRank} · {l.winsOverExpected >= 0 ? "+" : "−"}
                      {Math.abs(l.winsOverExpected).toFixed(1)} vs exp
                    </span>
                  </span>
                  <span className="relative h-3 rounded-full bg-surface-muted ring-1 ring-line/70 ring-inset" aria-hidden>
                    <span className="absolute inset-y-0 left-1/2 w-px bg-slate-400" />
                    {l.delta !== 0 && (
                      <span
                        className={cn("absolute inset-y-0 rounded-full", l.delta > 0 ? "left-1/2 bg-gold" : "right-1/2 bg-sky-500")}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-right font-display text-lg font-bold tabular-nums",
                      l.delta > 0 ? "text-gold-ink" : l.delta < 0 ? "text-sky-700" : "text-slate-500",
                    )}
                  >
                    {l.delta > 0 ? `+${l.delta}` : l.delta < 0 ? `−${-l.delta}` : "0"}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-slate-600">
            Points-for rank minus standings rank. <span className="font-semibold text-gold-ink">Gold</span>: record ahead of scoring.{" "}
            <span className="font-semibold text-sky-700">Blue</span>: scoring ahead of record.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Points for" action={LEAGUE.provisionalLabel ?? "Season"}>
          <BarList rows={byPf.map((t) => ({ id: t.id, name: t.name, value: t.pointsFor, label: t.pointsFor.toFixed(1) }))} min={pfMin} max={pfMax} />
        </Card>
        <Card title="Strength of schedule" action="Opponents' avg score">
          <BarList
            rows={sos.map((r) => ({ id: r.team.id, name: r.team.name, value: r.oppAvg, label: r.oppAvg.toFixed(1), sub: `${r.pointsAgainst.toFixed(1)} PA` }))}
            min={oppMin}
            max={oppMax}
            muted
          />
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            Opponent scoring average, hardest first, with points allowed alongside. {sos[0].team.name} has faced the highest average, {sos[0].oppAvg.toFixed(1)}.
          </p>
        </Card>
      </div>

      <SectionHeading title="Record book" action={recordBookLabel(WEEKS_PLAYED)} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="High scores">
          <ol className="divide-y divide-line">
            {ALL_SCORES.slice(0, 8).map((s, i) => (
              <li key={`${s.week}-${s.teamId}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <RankBadge rank={i + 1} highlight={i === 0 ? "gold" : "plain"} className="size-6 text-xs" />
                <TeamAvatar teamId={s.teamId} size="xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{team(s.teamId).name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600">
                    <ResultChip result={s.won ? "W" : "L"} className="size-4 text-[10px]" /> Wk {s.week} vs {team(s.oppId).abbrev}
                  </span>
                </span>
                <span className="font-display text-xl font-bold text-navy tabular-nums">{s.score.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Closest games">
          <ol className="divide-y divide-line">
            {CLOSEST_GAMES.slice(0, 5).map((g) => (
              <GameItem key={gameKey(g)} g={g} badge={`by ${g.margin.toFixed(2)}`} />
            ))}
          </ol>
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Bad beats" action="Most points in a loss">
            <ol className="divide-y divide-line">
              {BAD_BEATS.slice(0, 4).map((g) => {
                const w = winnerSide(g);
                const l = loserSide(g);
                return (
                  <li key={gameKey(g)} className="py-2.5 text-sm leading-snug text-slate-700 first:pt-0 last:pb-0">
                    <span className="font-semibold text-navy">{team(l.teamId).name}</span> scored{" "}
                    <span className="font-display text-base font-bold text-loss tabular-nums">{l.score.toFixed(2)}</span> in week {g.week} and lost to{" "}
                    <span className="font-medium text-navy">{team(w.teamId).name}</span> ({w.score.toFixed(2)}).
                  </li>
                );
              })}
            </ol>
          </Card>
          <Card title="Biggest blowouts">
            <ol className="divide-y divide-line">
              {BLOWOUTS.slice(0, 3).map((g) => (
                <GameItem key={gameKey(g)} g={g} badge={`+${g.margin.toFixed(1)}`} tone="turf" />
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Weekly top scorer" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-subtle text-left text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                <th className="w-11 py-2.5 pl-4 sm:pl-5">Wk</th>
                <th className="py-2.5">Top score</th>
                <th className="w-[4.25rem] py-2.5 text-right">Avg</th>
                <th className="w-[5.5rem] py-2.5 pr-4 text-right sm:pr-5">Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leaders.map((w) => (
                <tr key={w.week} className="transition-colors hover:bg-surface-subtle/50">
                  <td className="py-2.5 pl-4 font-display text-base font-bold text-slate-600 tabular-nums sm:pl-5">{w.week}</td>
                  <td className="py-2.5 pr-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <TeamAvatar teamId={w.top.teamId} size="xs" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-navy">{team(w.top.teamId).name}</span>
                        <span className="font-display font-bold text-turf tabular-nums">{w.top.score.toFixed(2)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-slate-600 tabular-nums">{w.avg.toFixed(1)}</td>
                  <td className="py-2.5 pr-4 text-right sm:pr-5">
                    <span className="block text-xs font-semibold text-slate-500">{team(w.bottom.teamId).abbrev}</span>
                    <span className="font-display font-bold text-loss tabular-nums">{w.bottom.score.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line bg-surface-subtle/50 px-4 py-3 text-xs text-slate-600 sm:px-5">
            {topScorerSummary()} League average across all games: {LEAGUE_AVG.toFixed(1)}.
          </p>
        </Card>

        <Card title="Close-game records" action={`Decided by <${CLOSE_GAME_MARGIN}`}>
          <ul className="divide-y divide-line">
            {[...TEAMS]
              .map((t) => ({ t, r: closeGameRecord(t.id) }))
              .filter((x) => x.r.games > 0)
              .sort((a, b) => b.r.wins - a.r.wins || a.r.losses - b.r.losses)
              .map(({ t, r }) => (
                <li key={t.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0 text-sm">
                  <TeamAvatar teamId={t.id} size="xs" />
                  <Link href={teamPath(t.id)} className="min-w-0 flex-1 truncate font-medium text-navy hover:underline">
                    {t.name}
                  </Link>
                  <span className="font-display text-lg font-bold text-navy tabular-nums">
                    {r.wins}-{r.losses}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-xs text-slate-600">
            Teams without a game decided by fewer than {CLOSE_GAME_MARGIN} points:{" "}
            {TEAMS.filter((t) => closeGameRecord(t.id).games === 0).map((t) => t.name).join(", ") || "none"}.
          </p>
        </Card>
      </div>

      <SectionHeading title="Consistency" />
      <Card title="Boom or bust" action="Steadiest first">
        <ul className="grid gap-4 md:grid-cols-2 md:gap-x-8">
          {consistency.map((r, i) => (
            <li key={r.team.id}>
              <div className="flex items-center justify-between gap-2">
                <Link href={teamPath(r.team.id)} className="flex min-w-0 items-center gap-2 hover:underline">
                  <TeamAvatar teamId={r.team.id} size="xs" />
                  <span className="truncate text-sm font-semibold text-navy">{r.team.name}</span>
                </Link>
                <span className="shrink-0 text-xs font-semibold text-slate-600 tabular-nums">
                  {i === 0 ? <Pill tone="turf">Steadiest</Pill> : i === consistency.length - 1 ? <Pill tone="gold">Most volatile</Pill> : `±${r.stdDev.toFixed(1)}`}
                </span>
              </div>
              <div className="mt-2">
                <RangeBar low={r.low.pf} median={r.median} high={r.high.pf} color={r.team.color} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-600 tabular-nums">
                <span>Low {r.low.pf.toFixed(1)}</span>
                <span>Median {r.median.toFixed(1)}</span>
                <span>High {r.high.pf.toFixed(1)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <SectionHeading title="Head to head" action={`${LEAGUE.season} season`} />
      <Card bodyClassName="p-3.5 sm:p-5">
        <div className="overflow-x-auto">
          <table className="mx-auto border-separate border-spacing-1 text-center">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white" />
                {STANDINGS.map((c) => (
                  <th key={c.id} scope="col" className="w-7 pb-1 align-bottom sm:w-10" title={c.name}>
                    <TeamAvatar teamId={c.id} size="xs" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className="sticky left-0 z-10 bg-white pr-1 text-right" title={r.name}>
                    <TeamAvatar teamId={r.id} size="xs" />
                  </th>
                  {STANDINGS.map((c) => {
                    if (r.id === c.id) return <td key={c.id} className="size-7 rounded-md bg-navy/10 sm:size-10" aria-hidden />;
                    const cell = H2H.get(`${r.id}-${c.id}`);
                    if (!cell) return <td key={c.id} className="size-7 rounded-md bg-surface-subtle ring-1 ring-line/60 ring-inset sm:size-10" aria-label="Not played" />;
                    return (
                      <td
                        key={c.id}
                        title={`${r.name} ${cell.won ? "beat" : "lost to"} ${c.name}, week ${cell.week}: ${cell.score.toFixed(2)}–${cell.oppScore.toFixed(2)}`}
                        className={cn(
                          "size-7 rounded-md font-display text-xs font-bold text-white sm:size-10 sm:text-sm",
                          cell.won ? "bg-turf" : "bg-loss",
                        )}
                      >
                        <span className="block leading-none">{cell.won ? "W" : "L"}</span>
                        <span className="hidden text-[10px] leading-none font-semibold opacity-85 sm:block">wk{cell.week}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-xs text-slate-600">
          Read across: each row is a team&apos;s result against the column team, both in standings order. Blank squares haven&apos;t played yet in {LEAGUE.season}.
        </p>
      </Card>
    </>
  );
}

function gameKey(g: Game) {
  return `${g.week}-${g.home.teamId}-${g.away.teamId}`;
}

function topScorerSummary() {
  const counts = TEAMS.map((t) => ({ t, n: weeklyTopCount(t.id) }))
    .filter((x) => x.n > 1)
    .sort((a, b) => b.n - a.n);
  if (!counts.length) return "No team has topped the league more than once.";
  return `${counts.map((x) => `${x.t.name} (${x.n}×)`).join(", ")} ${counts.length === 1 ? "has" : "have"} topped the league more than once.`;
}

function Glance({ label, teamId, value, sub, className }: { label: string; teamId: number; value: string; sub?: string; className?: string }) {
  const t = team(teamId);
  return (
    <li className={cn("relative min-w-0 overflow-hidden rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line", className)}>
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: t.color }} aria-hidden />
      <p className="mt-0.5 text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl leading-none font-extrabold text-navy tabular-nums sm:text-3xl">
        {value}
        {sub && <span className="ml-1 font-sans text-xs font-medium text-slate-500">{sub}</span>}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <TeamAvatar teamId={teamId} size="xs" />
        <Link href={teamPath(teamId)} className="min-w-0 flex-1 truncate text-xs font-semibold text-navy hover:underline">
          {t.name}
        </Link>
      </div>
    </li>
  );
}

function PowerMark({ delta, standingsRank }: { delta: number | null; standingsRank: number }) {
  if (delta == null) {
    return (
      <span className="shrink-0 rounded-md bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-line ring-inset" title="Standings rank">
        W-L #{standingsRank}
      </span>
    );
  }
  if (delta === 0) return <span className="w-10 text-right text-xs font-semibold text-slate-500" title="Same power rank as last snapshot">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ring-inset",
        delta > 0 ? "bg-turf-light text-turf-dark ring-turf-border" : "bg-loss-light text-loss ring-loss-border",
      )}
      title={`${Math.abs(delta)} spot${Math.abs(delta) === 1 ? "" : "s"} ${delta > 0 ? "up" : "down"} since the last power snapshot`}
    >
      {delta > 0 ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

function GameItem({ g, badge, tone = "gold" }: { g: Game; badge: string; tone?: "gold" | "turf" | "slate" }) {
  const w = winnerSide(g);
  const l = loserSide(g);
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <p className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Week {g.week}</span>
        <Pill tone={tone}>{badge}</Pill>
      </p>
      <div className="mt-1.5 grid gap-1">
        {[w, l].map((s, i) => (
          <p key={s.teamId} className="flex items-center gap-2 text-sm">
            <TeamAvatar teamId={s.teamId} size="xs" />
            <span className={cn("min-w-0 flex-1 truncate", i === 0 ? "font-semibold text-navy" : "text-slate-600")}>{team(s.teamId).name}</span>
            <span className={cn("font-display text-base font-bold tabular-nums", i === 0 ? "text-navy" : "text-slate-500")}>{s.score.toFixed(2)}</span>
          </p>
        ))}
      </div>
    </li>
  );
}

function BarList({
  rows,
  min,
  max,
  muted,
}: {
  rows: { id: number; name: string; value: number; label: string; sub?: string }[];
  min: number;
  max: number;
  muted?: boolean;
}) {
  return (
    <ol className="grid gap-2.5">
      {rows.map((r, i) => (
        <li key={r.id}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <Link href={teamPath(r.id)} className="min-w-0 truncate font-medium text-navy hover:underline">
              <span className="mr-2 font-display font-bold text-slate-500 tabular-nums">{i + 1}</span>
              {r.name}
            </Link>
            <span className="shrink-0 font-display text-base font-bold text-navy tabular-nums">
              {r.sub && <span className="mr-2 font-sans text-xs font-medium text-slate-500">{r.sub}</span>}
              {r.label}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
            <div
              className="h-full rounded-full"
              style={{ width: `${((r.value - min) / Math.max(1, max - min)) * 100}%`, background: muted ? "#64748b" : team(r.id).color }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
