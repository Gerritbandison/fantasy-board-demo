import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftRight, ShieldAlert } from "lucide-react";
import { ScoreReadout, SlotChip } from "@/components/league/bits";
import { RosterOutlook } from "@/components/league/RosterOutlook";
import { Card, RangeBar, ResultChip, Stat, TeamAvatar } from "@/components/league/ui";
import { ScoreTrail, TrailLegend, WeekStrip } from "@/components/league/trail";
import { cn } from "@/lib/utils";
import { teamBlurb } from "@/lib/commentary";
import { formatRecord, getTeam, isFlagged, LEAGUE, matchupFor, matchupPath, ordinal, team, teamPath, type MatchupSide, type Team } from "@/lib/league";
import {
  allPlay,
  CLOSE_GAME_MARGIN,
  closeGameRecord,
  LEAGUE_AVG_BY_WEEK,
  luck,
  paRank,
  pfRank,
  schedule,
  teamStats,
  weeklyTopCount,
} from "@/lib/stats";

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

  const overview = (
    <>
      {t.isUser && <RosterOutlook />}
      <p className="max-w-2xl text-[15px] leading-snug text-slate-700">
        {teamBlurb({
          name: t.name,
          wins: t.wins,
          losses: t.losses,
          ties: t.ties,
          pointsFor: t.pointsFor,
          rank: t.rank,
          pointsRank: pfRank(t.id),
          last3: s.last3,
          seasonAvg: s.avg,
          lossesInARow: trailingLosses(t),
        })}
      </p>
      <Card bodyClassName="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Points for" value={t.pointsFor.toFixed(1)} sub={`${ordinal(pfRank(t.id))} in the league${LEAGUE.provisionalLabel ? ` · ${LEAGUE.provisionalLabel}` : ""}`} />
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
              {tops > 0 ? (
                <>
                  {" "}
                  and led the league <span className="font-semibold text-navy">{tops === 1 ? "once" : `${tops} times`}</span>
                </>
              ) : (
                ". The weekly lead has not come from this roster"
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
                          <span className="min-w-0 truncate text-slate-700">
                            {w.home ? "vs" : "@"} {team(w.opponentId).name}
                            {w.provisional ? <span className="ml-1 font-semibold text-amber-800">Provisional, Week {w.week} not final</span> : null}
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

  return overview;
}

function trailingLosses(t: Team) {
  let streak = 0;
  for (const week of [...t.weekly].reverse()) {
    if (week.provisional) continue;
    if (week.result !== "L") break;
    streak += 1;
  }
  return streak;
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
