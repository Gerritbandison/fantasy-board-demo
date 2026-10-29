import type { Metadata } from "next";
import Link from "next/link";
import { Card, LuckBadge, PageHeader, Pill, RangeBar, ResultChip, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { formatRecord, GAMES, LEAGUE, loserSide, MATCHUPS, matchupPath, STANDINGS, team, teamPath, TEAMS, winnerSide, type Game } from "@/lib/league";
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
  luck,
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
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Every number here is computed from all {GAMES.length} games through week {week - 1}, across all {TEAMS.length} teams.
        </p>
      </PageHeader>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Glance label="Best record" teamId={STANDINGS[0].id} value={formatRecord(STANDINGS[0])} />
        <Glance label="Most points" teamId={byPf[0].id} value={byPf[0].pointsFor.toFixed(1)} />
        <Glance label="Hottest (last 3)" teamId={hottest.id} value={teamStats(hottest).last3.toFixed(1)} />
        <Glance label="Top single game" teamId={topScore.teamId} value={topScore.score.toFixed(2)} sub={`Week ${topScore.week}`} />
        <Glance
          label="Unluckiest"
          teamId={unluckiest.teamId}
          value={`${unluckiest.winsOverExpected < 0 ? "−" : "+"}${Math.abs(unluckiest.winsOverExpected).toFixed(1)}`}
          sub="wins vs all-play"
          className="col-span-2 lg:col-span-4"
        />
      </ul>

      <Card title={`Week ${week} slate`} action={<Link href="/matchups" className="font-semibold text-turf hover:underline">All scores →</Link>}>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {MATCHUPS.map((m) => (
            <li key={m.slug}>
              <Link href={matchupPath(m)} className="block rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100 hover:ring-turf/40">
                {[m.left, m.right].map((s) => {
                  const fav = m.left.projected != null && m.right.projected != null && s.projected === Math.max(m.left.projected, m.right.projected);
                  return (
                    <p key={s.teamId} className="flex items-center gap-2 text-sm">
                      <TeamAvatar teamId={s.teamId} size="sm" className="size-6 text-[9px]" />
                      <span className={cn("min-w-0 flex-1 truncate", fav ? "font-semibold text-navy" : "text-slate-500")}>{team(s.teamId).name}</span>
                      <span className={cn("font-display font-bold tabular-nums", fav ? "text-turf" : "text-slate-400")}>{s.projected?.toFixed(1) ?? "—"}</span>
                    </p>
                  );
                })}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <SectionHeading title="Power & luck" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Power rankings" action="By all-play record">
          <ol className="divide-y divide-line">
            {power.map((p) => (
              <li key={p.team.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={cn("w-6 shrink-0 font-display text-2xl leading-none font-extrabold", p.rank === 1 ? "text-gold" : "text-slate-300")}>{p.rank}</span>
                <TeamAvatar teamId={p.team.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link href={teamPath(p.team.id)} className="block truncate text-sm font-semibold text-navy hover:underline">
                    {p.team.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    All-play {p.allPlay.wins}-{p.allPlay.losses} · actual {formatRecord(p.team)} · last 3 {p.last3.toFixed(1)}
                  </p>
                </div>
                <Move move={p.move} />
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-slate-500">
            All-play: each week, every team is scored against all nine others. Arrows compare with the standings rank.
          </p>
        </Card>

        <Card title="Luck meter" action="Points rank vs record">
          <ol className="grid gap-2.5">
            {luckRows.map((l) => {
              const pct = (Math.min(LUCK_SPAN, Math.abs(l.delta)) / LUCK_SPAN) * 50;
              const t = team(l.teamId);
              return (
                <li key={l.teamId} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_2rem] items-center gap-2">
                  <span className="min-w-0">
                    <Link href={teamPath(t.id)} className="block truncate text-sm font-semibold text-navy hover:underline">
                      {t.name}
                    </Link>
                    <span className="block text-[11px] text-slate-500">
                      {formatRecord(t)} · PF #{l.pfRank} · {l.winsOverExpected >= 0 ? "+" : "−"}
                      {Math.abs(l.winsOverExpected).toFixed(1)} wins vs all-play
                    </span>
                  </span>
                  <span className="relative h-3 rounded-full bg-slate-100" aria-hidden>
                    <span className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
                    {l.delta !== 0 && (
                      <span className={cn("absolute inset-y-0 rounded-full", l.delta > 0 ? "left-1/2 bg-gold" : "right-1/2 bg-sky-500")} style={{ width: `${pct}%` }} />
                    )}
                  </span>
                  <span className={cn("text-right font-display text-lg font-bold tabular-nums", l.delta > 0 ? "text-amber-700" : l.delta < 0 ? "text-sky-700" : "text-slate-400")}>
                    {l.delta > 0 ? `+${l.delta}` : l.delta < 0 ? `−${-l.delta}` : "0"}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-slate-500">
            Points-for rank minus standings rank. <span className="font-semibold text-amber-700">Gold</span>: record is ahead of the scoring.{" "}
            <span className="font-semibold text-sky-700">Blue</span>: scoring is ahead of the record.
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Points for" action="Season total">
          <BarList rows={byPf.map((t) => ({ id: t.id, name: t.name, value: t.pointsFor, label: t.pointsFor.toFixed(1) }))} min={pfMin} max={pfMax} />
        </Card>
        <Card title="Strength of schedule" action="Opponents' avg score">
          <BarList rows={sos.map((r) => ({ id: r.team.id, name: r.team.name, value: r.oppAvg, label: r.oppAvg.toFixed(1), sub: `${r.pointsAgainst.toFixed(1)} PA` }))} min={oppMin} max={oppMax} muted />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Season scoring average of every opponent faced, hardest first, with points allowed alongside. {sos[0].team.name} has had the toughest road so far.
          </p>
        </Card>
      </div>

      <SectionHeading title="Record book" action={`Weeks 1–${week - 1}`} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="High scores">
          <ol className="divide-y divide-line">
            {ALL_SCORES.slice(0, 8).map((s, i) => (
              <li key={`${s.week}-${s.teamId}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={cn("w-5 font-display text-lg font-bold", i === 0 ? "text-gold" : "text-slate-300")}>{i + 1}</span>
                <TeamAvatar teamId={s.teamId} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{team(s.teamId).name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
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

        <div className="grid content-start gap-5">
          <Card title="Bad beats" action="Most points in a loss">
            <ol className="divide-y divide-line">
              {BAD_BEATS.slice(0, 4).map((g) => {
                const w = winnerSide(g);
                const l = loserSide(g);
                return (
                  <li key={gameKey(g)} className="py-2.5 text-sm leading-snug text-slate-700 first:pt-0 last:pb-0">
                    <span className="font-semibold text-navy">{team(l.teamId).name}</span> scored{" "}
                    <span className="font-display text-base font-bold text-loss tabular-nums">{l.score.toFixed(2)}</span> in week {g.week} and lost to {team(w.teamId).name} (
                    {w.score.toFixed(2)}).
                  </li>
                );
              })}
            </ol>
          </Card>
          <Card title="Biggest blowouts">
            <ol className="divide-y divide-line">
              {BLOWOUTS.slice(0, 3).map((g) => (
                <GameItem key={gameKey(g)} g={g} badge={`by ${g.margin.toFixed(1)}`} tone="slate" />
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Weekly top scorer" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-y border-line bg-slate-50 text-left text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <th className="w-11 py-2 pl-4 sm:pl-5">Wk</th>
                <th className="py-2">Top score</th>
                <th className="w-[4.25rem] py-2 text-right">Avg</th>
                <th className="w-[5.5rem] py-2 pr-4 text-right sm:pr-5">Low</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((w) => (
                <tr key={w.week} className="border-b border-line last:border-0">
                  <td className="py-2.5 pl-4 font-display font-bold text-slate-500 sm:pl-5">{w.week}</td>
                  <td className="py-2.5 pr-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <TeamAvatar teamId={w.top.teamId} size="sm" className="size-6 text-[9px]" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-navy">{team(w.top.teamId).name}</span>
                        <span className="font-display font-bold text-turf tabular-nums">{w.top.score.toFixed(2)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-slate-500 tabular-nums">{w.avg.toFixed(1)}</td>
                  <td className="py-2.5 pr-4 text-right sm:pr-5">
                    <span className="block text-xs font-semibold text-slate-600">{team(w.bottom.teamId).abbrev}</span>
                    <span className="font-display font-bold text-loss tabular-nums">{w.bottom.score.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs text-slate-500 sm:px-5">
            {topScorerSummary()} League average across all games: {LEAGUE_AVG.toFixed(1)}.
          </p>
        </Card>

        <Card title="Close-game records" action={`Decided by <${CLOSE_GAME_MARGIN}`}>
          <ul className="grid gap-2">
            {[...TEAMS]
              .map((t) => ({ t, r: closeGameRecord(t.id) }))
              .filter((x) => x.r.games > 0)
              .sort((a, b) => b.r.wins - a.r.wins || a.r.losses - b.r.losses)
              .map(({ t, r }) => (
                <li key={t.id} className="flex items-center gap-2.5 text-sm">
                  <TeamAvatar teamId={t.id} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium text-navy">{t.name}</span>
                  <span className="font-display text-lg font-bold text-navy tabular-nums">
                    {r.wins}-{r.losses}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Teams without a game decided by fewer than {CLOSE_GAME_MARGIN} points: {TEAMS.filter((t) => closeGameRecord(t.id).games === 0).map((t) => t.name).join(", ") || "none"}.
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
                  <TeamAvatar teamId={r.team.id} size="sm" />
                  <span className="truncate text-sm font-semibold text-navy">{r.team.name}</span>
                </Link>
                <span className="shrink-0 text-xs text-slate-500">
                  {i === 0 ? <Pill tone="turf">Steadiest</Pill> : i === consistency.length - 1 ? <Pill tone="gold">Most volatile</Pill> : `±${r.stdDev.toFixed(1)}`}
                </span>
              </div>
              <div className="mt-2">
                <RangeBar low={r.low.pf} median={r.median} high={r.high.pf} color={r.team.color} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-500 tabular-nums">
                <span>Low {r.low.pf.toFixed(1)}</span>
                <span>Median {r.median.toFixed(1)}</span>
                <span>High {r.high.pf.toFixed(1)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <SectionHeading title="Head to head" action={String(LEAGUE.season)} />
      <Card bodyClassName="p-3 sm:p-5">
        <div className="overflow-x-auto">
          <table className="mx-auto border-separate border-spacing-0.5 text-center">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white" />
                {STANDINGS.map((c) => (
                  <th key={c.id} scope="col" className="w-7 pb-1 align-bottom sm:w-10" title={c.name}>
                    <TeamAvatar teamId={c.id} size="sm" className="size-6 text-[8px] sm:size-7 sm:text-[10px]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDINGS.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className="sticky left-0 z-10 bg-white pr-1 text-right" title={r.name}>
                    <TeamAvatar teamId={r.id} size="sm" className="size-6 text-[8px] sm:size-7 sm:text-[10px]" />
                  </th>
                  {STANDINGS.map((c) => {
                    if (r.id === c.id) return <td key={c.id} className="size-7 rounded bg-navy/80 sm:size-10" aria-hidden />;
                    const cell = H2H.get(`${r.id}-${c.id}`);
                    if (!cell) return <td key={c.id} className="size-7 rounded bg-slate-50 sm:size-10" aria-label="Not played" />;
                    return (
                      <td
                        key={c.id}
                        title={`${r.name} ${cell.won ? "beat" : "lost to"} ${c.name}, week ${cell.week}: ${cell.score.toFixed(2)}–${cell.oppScore.toFixed(2)}`}
                        className={cn("size-7 rounded font-display text-xs font-bold text-white sm:size-10 sm:text-sm", cell.won ? "bg-turf" : "bg-loss")}
                      >
                        <span className="block leading-none">{cell.won ? "W" : "L"}</span>
                        <span className="hidden text-[9px] leading-none font-semibold opacity-80 sm:block">wk{cell.week}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Read across: each row is a team&apos;s result against the column team, both in standings order. Blank squares haven&apos;t played yet in {LEAGUE.season}. On desktop, hover a square for the score; every score is also on each team&apos;s page.
        </p>
      </Card>

      <ul className="grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-2">
        {STANDINGS.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <TeamAvatar teamId={t.id} size="sm" className="size-5 text-[7px]" />
            <span className="font-semibold text-slate-600">{t.abbrev}</span>
            <Link href={teamPath(t.id)} className="truncate hover:underline">
              {t.name}
            </Link>
            <LuckBadge row={luck(t.id)} compact />
          </li>
        ))}
      </ul>
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
    <li className={cn("min-w-0 rounded-2xl bg-white p-3 ring-1 ring-line", className)}>
      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <TeamAvatar teamId={teamId} size="sm" />
        <Link href={teamPath(teamId)} className="min-w-0 flex-1 truncate text-sm font-semibold text-navy hover:underline">
          {t.name}
        </Link>
      </div>
      <p className="mt-1 font-display text-2xl leading-none font-bold text-navy tabular-nums">
        {value}
        {sub && <span className="ml-1.5 font-sans text-xs font-medium text-slate-500">{sub}</span>}
      </p>
    </li>
  );
}

function Move({ move }: { move: number }) {
  if (move === 0) return <span className="w-8 text-right text-xs text-slate-400">—</span>;
  return (
    <span className={cn("w-8 text-right text-xs font-bold tabular-nums", move > 0 ? "text-turf" : "text-loss")} title={`${Math.abs(move)} spot${Math.abs(move) === 1 ? "" : "s"} ${move > 0 ? "higher" : "lower"} than the standings`}>
      {move > 0 ? "▲" : "▼"}
      {Math.abs(move)}
    </span>
  );
}

function GameItem({ g, badge, tone = "gold" }: { g: Game; badge: string; tone?: "gold" | "slate" }) {
  const w = winnerSide(g);
  const l = loserSide(g);
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <p className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Week {g.week}</span>
        <Pill tone={tone}>{badge}</Pill>
      </p>
      {[w, l].map((s, i) => (
        <p key={s.teamId} className="mt-1 flex items-center gap-2 text-sm">
          <TeamAvatar teamId={s.teamId} size="sm" className="size-5 text-[8px]" />
          <span className={cn("min-w-0 flex-1 truncate", i === 0 ? "font-semibold text-navy" : "text-slate-500")}>{team(s.teamId).name}</span>
          <span className={cn("font-display text-base font-bold tabular-nums", i === 0 ? "text-navy" : "text-slate-400")}>{s.score.toFixed(2)}</span>
        </p>
      ))}
    </li>
  );
}

function BarList({ rows, min, max, muted }: { rows: { id: number; name: string; value: number; label: string; sub?: string }[]; min: number; max: number; muted?: boolean }) {
  return (
    <ol className="grid gap-2">
      {rows.map((r, i) => (
        <li key={r.id}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-slate-700">
              <span className="mr-2 font-display font-bold text-slate-400">{i + 1}</span>
              {r.name}
            </span>
            <span className="shrink-0 font-display text-base font-bold text-navy tabular-nums">
              {r.sub && <span className="mr-2 font-sans text-xs font-medium text-slate-400">{r.sub}</span>}
              {r.label}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${((r.value - min) / (max - min)) * 100}%`, background: muted ? "#94a3b8" : team(r.id).color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
