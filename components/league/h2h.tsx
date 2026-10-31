import Link from "next/link";
import { Banknote, Cookie, Crown, Flame, Frown, HeartCrack, Hourglass, Medal, Scale, Skull, Snowflake, Swords, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STANDINGS, team, teamPath } from "@/lib/league";
import {
  franchise,
  H2H_TEAM_IDS,
  MIN_GAMES,
  pct,
  pts,
  RECORDS,
  RECORDS_NOTE,
  record,
  SCOPE_LABEL,
  seriesBetween,
  spanLabel,
  STREAK_NOTE,
  teamThen,
  TOTAL_GAMES,
  whenLabel,
  type RecordGame,
  type Series,
  type TeamGame,
  type WeekScore,
} from "@/lib/h2h";
import * as roast from "@/lib/roast";
import { Card, SectionHeading, Stat, TeamAvatar } from "./ui";

const signed = (v: number) => `${v >= 0 ? "+" : "−"}${pts(Math.abs(v))}`;

export function Roast({ children, className = "mt-3" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex gap-2 rounded-xl bg-gold-light/70 px-3 py-2 text-sm leading-snug text-slate-800 ring-1 ring-amber-100", className)}>
      <Flame className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function Eyebrow({ icon: Icon, children, tone = "slate" }: { icon: LucideIcon; children: React.ReactNode; tone?: "slate" | "turf" | "loss" | "gold" }) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase",
        tone === "turf" ? "text-turf" : tone === "loss" ? "text-loss" : tone === "gold" ? "text-amber-700" : "text-slate-600",
      )}
    >
      <Icon className="size-3.5" aria-hidden /> {children}
    </p>
  );
}

/** The team a stat belongs to: current name, qualified by that season's name (or year, if retired). */
function TeamLine({ id, season, sub, prefix }: { id: number; season?: number; sub?: React.ReactNode; prefix?: string }) {
  const t = season != null ? teamThen(id, season) : { name: team(id).name, alias: null, year: null };
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TeamAvatar teamId={id} size="sm" />
      <div className="min-w-0">
        <p className="text-sm leading-tight font-semibold break-words text-navy">
          {prefix && <span className="font-medium text-slate-600">{prefix} </span>}
          <Link href={teamPath(id)} className="hover:underline">
            {t.name}
          </Link>
          {t.year != null && <span className="font-medium text-slate-600"> ({t.year})</span>}
        </p>
        {(sub || t.alias) && (
          <p className="text-xs leading-snug text-slate-600">
            {t.alias && <span>as {t.alias}</span>}
            {t.alias && sub ? " · " : null}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/** Secondary opponent line on a team's own stat: "vs <Opponent> (as <season name>) · <score>". */
function Versus({ id, season, score, suffix }: { id: number; season: number; score?: number | null; suffix?: string }) {
  const t = teamThen(id, season);
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-slate-600">
      <TeamAvatar teamId={id} size="sm" className="size-4 text-[6px]" />
      <span className="min-w-0">
        vs{" "}
        <Link href={teamPath(id)} className="font-semibold text-slate-700 hover:underline">
          {t.name}
        </Link>
        {t.alias ? ` (as ${t.alias})` : t.year != null ? ` (${t.year})` : ""}
        {score != null && (
          <>
            {" · "}
            <span className="font-semibold text-slate-700 tabular-nums">{pts(score)}</span>
            {suffix}
          </>
        )}
      </span>
    </p>
  );
}

/* ---------- Team page ---------- */

export function RoastCard({
  icon,
  label,
  tone,
  accent,
  value,
  valueClassName,
  children,
  line,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "slate" | "turf" | "loss" | "gold";
  accent?: string;
  value?: React.ReactNode;
  valueClassName?: string;
  children?: React.ReactNode;
  line: string;
}) {
  return (
    <Card as="li" accent={accent} bodyClassName="flex h-full flex-col">
      <Eyebrow icon={icon} tone={tone}>
        {label}
      </Eyebrow>
      {value != null && <p className={cn("mt-1 font-display text-3xl leading-none font-extrabold text-navy tabular-nums", valueClassName)}>{value}</p>}
      <div className="mt-2">{children}</div>
      <div className="mt-auto pt-3">
        <Roast className="">{line}</Roast>
      </div>
    </Card>
  );
}

function GameCard({ g, icon, label, tone, line }: { g: TeamGame; icon: LucideIcon; label: string; tone: "turf" | "loss"; line: string }) {
  return (
    <RoastCard icon={icon} label={label} tone={tone} accent={team(g.teamId).color} value={signed(g.margin)} valueClassName={tone === "turf" ? "text-turf" : "text-loss"} line={line}>
      <TeamLine id={g.teamId} season={g.when.season} sub={<span className="tabular-nums">scored {pts(g.pf)}</span>} />
      <Versus id={g.opponentId} season={g.when.season} score={g.pa} />
      <p className="mt-1.5 text-xs text-slate-600">{whenLabel(g.when)}</p>
    </RoastCard>
  );
}

function WeekCard({ s, icon, label, tone, line }: { s: WeekScore; icon: LucideIcon; label: string; tone: "turf" | "loss"; line: string }) {
  return (
    <RoastCard icon={icon} label={label} tone={tone} accent={team(s.teamId).color} value={pts(s.score)} valueClassName={tone === "turf" ? "text-turf" : "text-loss"} line={line}>
      <TeamLine id={s.teamId} season={s.when.season} />
      <Versus id={s.opponentId} season={s.when.season} score={s.opponentScore} suffix=" that week" />
      <p className="mt-1.5 text-xs text-slate-600">
        {whenLabel(s.when, s.week)}
        {s.leg && " · one week of a two-week game"}
      </p>
    </RoastCard>
  );
}

function SeriesCard({ me, s, kind }: { me: number; s: Series; kind: "snack" | "nemesis" }) {
  const snack = kind === "snack";
  const title = snack ? roast.snackTitle(s) : roast.nemesisTitle(s);
  const icon = snack ? (title === "Personal ATM" ? Banknote : Cookie) : title === "Who's your daddy" ? Crown : Zap;
  return (
    <RoastCard
      icon={icon}
      label={`${snack ? "Easiest opponent" : "Nemesis"} · ${title}`}
      tone={snack ? "turf" : "loss"}
      accent={team(me).color}
      value={record(s)}
      valueClassName={snack ? "text-turf" : "text-loss"}
      line={snack ? roast.snackLine(me, s) : roast.nemesisLine(me, s)}
    >
      <TeamLine id={s.opponentId} prefix="vs" sub={`${team(me).abbrev} record over ${s.games} games · ${signed(s.avgMargin)} avg margin`} />
    </RoastCard>
  );
}

export function TeamHeadToHead({ teamId }: { teamId: number }) {
  const f = franchise(teamId);
  if (!f) return null;
  const p = f.playoff;
  const streak = f.currentStreak;

  return (
    <>
      <SectionHeading title="Head-to-head" />
      <section id="head-to-head" className="-mt-2 scroll-mt-20 overflow-hidden rounded-2xl bg-navy yard-lines p-4 text-white shadow-lg shadow-navy/15 sm:p-5">
        <p className="text-xs font-bold tracking-wider text-gold uppercase">{SCOPE_LABEL}</p>
        <p className="mt-1 font-display text-4xl leading-none font-extrabold tabular-nums">
          {record(f)} <span className="text-xl font-bold text-white/85">all-time</span>
        </p>
        <p className="mt-2 text-[15px] leading-snug text-white/80">{roast.overallLine(f)}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {[
            { k: "Regular season", v: f.regularSeasonRecord },
            { k: "Playoffs", v: `${p.wins}-${p.losses}` },
            { k: "Points / week", v: pts(f.pointsPerWeek) },
            { k: "Current streak", v: streak ? `${streak.result}${streak.length}` : "—" },
          ].map((x) => (
            <div key={x.k} className="min-w-0">
              <dt className="text-xs font-semibold tracking-wider text-white/85 uppercase">{x.k}</dt>
              <dd className="font-display text-2xl font-bold tabular-nums">{x.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {f.easiest && <SeriesCard me={teamId} s={f.easiest} kind="snack" />}
        {f.nemesis && <SeriesCard me={teamId} s={f.nemesis} kind="nemesis" />}
        {f.biggestWin && <GameCard g={f.biggestWin} icon={Flame} label="Biggest win" tone="turf" line={roast.bigWinLine(f.biggestWin)} />}
        {f.worstLoss && <GameCard g={f.worstLoss} icon={Skull} label="Most embarrassing loss" tone="loss" line={roast.badLossLine(f.worstLoss)} />}
        {f.best && <WeekCard s={f.best} icon={Trophy} label="Best week" tone="turf" line={roast.bestWeekLine(f.best)} />}
        {f.worst && <WeekCard s={f.worst} icon={Frown} label="Worst week" tone="loss" line={roast.worstWeekLine(f.worst)} />}
        {f.closestWin && <GameCard g={f.closestWin} icon={Hourglass} label="Closest win" tone="turf" line={roast.closeWinLine(f.closestWin)} />}
        {f.closestLoss && <GameCard g={f.closestLoss} icon={HeartCrack} label="Closest loss" tone="loss" line={roast.closeLossLine(f.closestLoss)} />}
        <RoastCard icon={Snowflake} label="Streaks" line={roast.streakLine(f)}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Longest W" value={f.winStreak.length} valueClassName="text-turf" sub={spanLabel(f.winStreak) || undefined} />
            <Stat label="Longest L" value={f.losingStreak.length} valueClassName="text-loss" sub={spanLabel(f.losingStreak) || undefined} />
          </div>
        </RoastCard>
      </ul>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <ul className="grid">
          <RoastCard icon={Medal} label="Playoff résumé" tone="gold" line={roast.playoffLine(f)}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Bracket" value={`${p.wins}-${p.losses}`} />
              <Stat label="Finals" value={p.titleGames} />
              <Stat label="Titles" value={p.titles} valueClassName={p.titles ? "text-gold-ink" : "text-slate-600"} />
            </div>
            {p.consolationRecord && <p className="mt-1.5 text-xs text-slate-600">Consolation games: {p.consolationRecord.replace(/-0$/, "")}</p>}
          </RoastCard>
        </ul>

        <Card title="Record vs everyone" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-y border-line bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                <th className="py-2 pl-4 sm:pl-5">Opponent</th>
                <th className="w-14 py-2 text-right">W-L</th>
                <th className="w-[4.5rem] py-2 text-right">Avg ±</th>
                <th className="hidden w-24 py-2 text-right min-[420px]:table-cell">Last</th>
                <th className="w-14 py-2 pr-4 text-right sm:pr-5">Strk</th>
              </tr>
            </thead>
            <tbody>
              {f.vs.map((s) => {
                const tag = s.opponentId === f.easiest?.opponentId ? "snack" : s.opponentId === f.nemesis?.opponentId ? "nemesis" : null;
                return (
                  <tr key={s.opponentId} className={cn("border-b border-line last:border-0", tag === "snack" && "bg-turf-light/50", tag === "nemesis" && "bg-red-50/70")}>
                    <td className="py-2.5 pr-2 pl-4 sm:pl-5">
                      <Link href={teamPath(s.opponentId)} className="flex min-w-0 items-center gap-2 hover:underline">
                        <TeamAvatar teamId={s.opponentId} size="sm" className="size-6 text-xs" />
                        <span className="min-w-0 truncate font-medium text-slate-700">{team(s.opponentId).name}</span>
                        {tag === "snack" && <Cookie className="size-3.5 shrink-0 text-turf" aria-label="Easiest opponent" />}
                        {tag === "nemesis" && <Zap className="size-3.5 shrink-0 text-loss" aria-label="Nemesis" />}
                      </Link>
                    </td>
                    <td className="py-2.5 text-right font-display text-base font-bold text-navy tabular-nums">{record(s)}</td>
                    <td className={cn("py-2.5 text-right font-semibold tabular-nums", s.avgMargin >= 0 ? "text-turf" : "text-loss")}>{signed(s.avgMargin)}</td>
                    <td className="hidden py-2.5 text-right text-xs text-slate-600 tabular-nums min-[420px]:table-cell">
                      {s.last ? (
                        <>
                          <span className={cn("font-bold", s.last.result === "W" ? "text-turf" : "text-loss")}>{s.last.result}</span> {s.last.when.season}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-xs font-semibold text-slate-600 tabular-nums sm:pr-5">
                      {s.currentStreak ? `${s.currentStreak.result}${s.currentStreak.length}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">
            Every game counts, including playoffs and consolation; a two-week playoff matchup counts as one game. Easiest opponent and nemesis need at least {MIN_GAMES} games. The franchise is tracked by
            ESPN team slot, so earlier seasons may have had a different owner.
          </p>
        </Card>
      </div>
    </>
  );
}

/* ---------- Matchup page ---------- */

export function MatchupSeries({ leftId, rightId }: { leftId: number; rightId: number }) {
  const s = seriesBetween(leftId, rightId);
  const back = seriesBetween(rightId, leftId);
  if (!s) return null;
  const L = team(leftId);
  const R = team(rightId);
  const total = s.wins + s.losses + s.ties;
  const share = total ? (s.wins / total) * 100 : 50;
  return (
    <Card title="Head-to-head" accent={L.color}>
      <p className="-mt-1 text-xs font-semibold text-slate-600">{SCOPE_LABEL}</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamAvatar teamId={L.id} />
          <span className="font-display text-4xl leading-none font-extrabold text-navy tabular-nums">{s.wins}</span>
        </div>
        <span className="text-xs font-semibold text-slate-600 uppercase">{total} games</span>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="font-display text-4xl leading-none font-extrabold text-navy tabular-nums">{s.losses}</span>
          <TeamAvatar teamId={R.id} />
        </div>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${L.name} ${s.wins} wins, ${R.name} ${s.losses} wins`}>
        <span style={{ width: `${share}%`, background: L.color }} />
        <span className="w-0.5 bg-white" />
        <span className="flex-1" style={{ background: R.color }} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <Line k="Total points" v={`${pts(s.pointsFor)} – ${pts(s.pointsAgainst)}`} />
        <Line k={`Avg margin (${L.abbrev})`} v={signed(s.avgMargin)} tone={s.avgMargin >= 0 ? "turf" : "loss"} />
        {s.last && (
          <Line
            k="Last meeting"
            v={`${s.last.result === "W" ? L.abbrev : R.abbrev} ${pts(Math.max(s.last.pf, s.last.pa))}-${pts(Math.min(s.last.pf, s.last.pa))}`}
            sub={whenLabel(s.last.when)}
          />
        )}
        {s.biggestWin && <Line k={`${L.abbrev}'s biggest win`} v={signed(s.biggestWin.margin)} sub={`${pts(s.biggestWin.pf)}-${pts(s.biggestWin.pa)} · ${whenLabel(s.biggestWin.when)}`} tone="turf" />}
        {back?.biggestWin && (
          <Line k={`${R.abbrev}'s biggest win`} v={signed(back.biggestWin.margin)} sub={`${pts(back.biggestWin.pf)}-${pts(back.biggestWin.pa)} · ${whenLabel(back.biggestWin.when)}`} tone="turf" />
        )}
        <Line k="Longest streaks" v={`${L.abbrev} ${s.longestWinStreak} · ${R.abbrev} ${s.longestLosingStreak}`} />
        {s.playoffMeetings > 0 && <Line k="Postseason meetings" v={String(s.playoffMeetings)} />}
      </dl>
      <Roast>{roast.seriesLine(s)}</Roast>
    </Card>
  );
}

function Line({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: "turf" | "loss" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
      <dt className="min-w-0 text-slate-600">
        {k}
        {sub && <span className="block text-xs text-slate-600">{sub}</span>}
      </dt>
      <dd className={cn("shrink-0 text-right font-display text-lg font-bold tabular-nums", tone === "turf" ? "text-turf" : tone === "loss" ? "text-loss" : "text-navy")}>{v}</dd>
    </div>
  );
}

/* ---------- History: Hall of Fame / Shame ---------- */

function RecordCard({
  icon,
  label,
  tone,
  teamId,
  value,
  children,
  line,
  more,
}: {
  icon: LucideIcon;
  label: string;
  tone: "turf" | "loss" | "gold" | "slate";
  teamId: number;
  value: string;
  children?: React.ReactNode;
  line: string;
  more?: { key: string; text: React.ReactNode }[];
}) {
  return (
    <Card as="li" accent={team(teamId).color} bodyClassName="flex h-full flex-col">
      <Eyebrow icon={icon} tone={tone}>
        {label}
      </Eyebrow>
      <p className={cn("mt-1 font-display text-4xl leading-none font-extrabold tabular-nums", tone === "loss" ? "text-loss" : tone === "turf" ? "text-turf" : "text-navy")}>{value}</p>
      <div className="mt-2.5">{children}</div>
      <Roast>{line}</Roast>
      {more && more.length > 0 && (
        <ol className="mt-3 grid gap-1 border-t border-line pt-2.5 text-xs text-slate-600" start={2}>
          {more.map((m, i) => (
            <li key={m.key} className="flex gap-2">
              <span className="w-4 shrink-0 font-semibold text-slate-600">#{i + 2}</span>
              <span className="min-w-0">{m.text}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

const gameMore = (list: RecordGame[], v: (g: RecordGame) => string) =>
  list.slice(1, 3).map((g) => ({ key: `${g.when.season}-${g.winnerId}-${g.loserId}-${g.when.weeks[0]}`, text: `${v(g)} · ${team(g.winnerId).abbrev} over ${team(g.loserId).abbrev}, ${g.when.season}` }));

export function HallOfFameAndShame() {
  const R = RECORDS;
  const hi = R.highestScores[0];
  const lo = R.lowestScores[0];
  const blow = R.blowouts[0];
  const close = R.closest[0];
  const ugly = R.fewestPointsInWin[0];
  const robbed = R.mostPointsInLoss[0];
  const ws = R.winStreaks[0];
  const ls = R.losingStreaks[0];

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-4 text-white shadow-lg shadow-navy/15 sm:p-5">
        <p className="text-xs font-bold tracking-wider text-gold uppercase">{SCOPE_LABEL}</p>
        <p className="mt-1 font-display text-3xl leading-tight font-extrabold">Hall of Fame &amp; Hall of Shame</p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/80">
          {TOTAL_GAMES} games of receipts. The league&apos;s best moments, its worst ones, and the rivalries that keep the group chat alive.
        </p>
      </section>

      <SectionHeading title="Hall of Fame" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hi && (
          <RecordCard
            icon={Trophy}
            label="Highest score"
            tone="turf"
            teamId={hi.teamId}
            value={pts(hi.score)}
            line={roast.highScoreLine(R.highestScores)}
            more={R.highestScores.slice(1, 3).map((s) => ({ key: `${s.when.season}-${s.week}-${s.teamId}`, text: `${pts(s.score)} · ${team(s.teamId).abbrev}, ${s.when.season} wk ${s.week}` }))}
          >
            <TeamLine id={hi.teamId} season={hi.when.season} sub={whenLabel(hi.when, hi.week)} />
          </RecordCard>
        )}
        {blow && (
          <RecordCard icon={Flame} label="Biggest blowout" tone="turf" teamId={blow.winnerId} value={pts(blow.margin)} line={roast.blowoutLine(blow)} more={gameMore(R.blowouts, (g) => pts(g.margin))}>
            <TeamLine id={blow.winnerId} season={blow.when.season} sub={whenLabel(blow.when)} />
          </RecordCard>
        )}
        {ws && (
          <RecordCard
            icon={Zap}
            label="Longest win streak"
            tone="turf"
            teamId={ws.teamId}
            value={String(ws.length)}
            line={roast.winStreakLine(ws)}
            more={R.winStreaks.slice(1, 3).map((s) => ({ key: `${s.teamId}-${s.length}-${spanLabel(s)}`, text: `${s.length} · ${team(s.teamId).abbrev}${spanLabel(s) ? `, ${spanLabel(s)}` : ""}` }))}
          >
            <TeamLine id={ws.teamId} sub="games in a row" />
          </RecordCard>
        )}
        {close && (
          <RecordCard icon={Hourglass} label="Closest game" tone="gold" teamId={close.winnerId} value={pts(close.margin)} line={roast.closestLine(close)} more={gameMore(R.closest, (g) => pts(g.margin))}>
            <TeamLine id={close.winnerId} season={close.when.season} sub={whenLabel(close.when)} />
          </RecordCard>
        )}
      </ul>

      <SectionHeading title="Hall of Shame" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {lo && (
          <RecordCard
            icon={Skull}
            label="Lowest score"
            tone="loss"
            teamId={lo.teamId}
            value={pts(lo.score)}
            line={roast.lowScoreLine(lo)}
            more={R.lowestScores.slice(1, 3).map((s) => ({ key: `${s.when.season}-${s.week}-${s.teamId}`, text: `${pts(s.score)} · ${team(s.teamId).abbrev}, ${s.when.season} wk ${s.week}${s.leg ? " (two-week leg)" : ""}` }))}
          >
            <TeamLine id={lo.teamId} season={lo.when.season} sub={`${whenLabel(lo.when, lo.week)}${lo.leg ? " · single week of a two-week game" : ""}`} />
          </RecordCard>
        )}
        {ls && (
          <RecordCard
            icon={Snowflake}
            label="Longest losing streak"
            tone="loss"
            teamId={ls.teamId}
            value={String(ls.length)}
            line={roast.losingStreakLine(ls)}
            more={R.losingStreaks.slice(1, 3).map((s) => ({ key: `${s.teamId}-${s.length}-${spanLabel(s)}`, text: `${s.length} · ${team(s.teamId).abbrev}${spanLabel(s) ? `, ${spanLabel(s)}` : ""}` }))}
          >
            <TeamLine id={ls.teamId} sub="losses in a row" />
          </RecordCard>
        )}
        {ugly && (
          <RecordCard icon={Frown} label="Fewest points in a win" tone="loss" teamId={ugly.winnerId} value={pts(ugly.winnerScore)} line={roast.uglyWinLine(ugly)} more={gameMore(R.fewestPointsInWin, (g) => pts(g.winnerScore))}>
            <TeamLine id={ugly.winnerId} season={ugly.when.season} sub={whenLabel(ugly.when)} />
          </RecordCard>
        )}
        {robbed && (
          <RecordCard
            icon={HeartCrack}
            label="Most points in a loss"
            tone="loss"
            teamId={robbed.loserId}
            value={pts(robbed.loserScore)}
            line={roast.robbedLine(robbed)}
            more={R.mostPointsInLoss.slice(1, 3).map((g) => ({
              key: `${g.when.season}-${g.winnerId}-${g.loserId}-${g.when.weeks[0]}`,
              text: `${pts(g.loserScore)} · ${team(g.loserId).abbrev} lost to ${team(g.winnerId).abbrev}, ${g.when.season}`,
            }))}
          >
            <TeamLine id={robbed.loserId} season={robbed.when.season} sub={whenLabel(robbed.when)} />
          </RecordCard>
        )}
      </ul>
      <p className="-mt-2 text-xs leading-relaxed text-slate-600">
        {RECORDS_NOTE} {STREAK_NOTE}
      </p>

      <TwoWeekRecords />
      <Rivalries />
      <TitleGameScores />
    </>
  );
}

function TwoWeekRecords() {
  const tw = RECORDS.twoWeek;
  const rows = [
    { label: "Biggest two-week blowout", g: tw.blowouts[0], v: (g: RecordGame) => pts(g.margin) },
    { label: "Closest two-week game", g: tw.closest[0], v: (g: RecordGame) => pts(g.margin) },
    { label: "Highest two-week total", g: tw.highestTotal[0], v: (g: RecordGame) => pts(g.winnerScore) },
  ].filter((r) => r.g);
  if (rows.length === 0) return null;
  return (
    <Card title="Two-week playoff games" action="Kept separate">
      <ul className="divide-y divide-line">
        {rows.map(({ label, g, v }) => (
          <li key={label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">{label}</p>
              <p className="text-sm leading-snug text-slate-700">
                <span className="font-semibold text-navy">{team(g!.winnerId).name}</span> over {team(g!.loserId).name}, {pts(g!.winnerScore)}-{pts(g!.loserScore)}
              </p>
              <p className="text-xs text-slate-600">{whenLabel(g!.when)}</p>
            </div>
            <span className="shrink-0 font-display text-2xl font-bold text-navy tabular-nums">{v(g!)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">Semifinals (and some finals and consolation rounds) are two-week totals, so they stay out of the single-game margin records above.</p>
    </Card>
  );
}

function Rivalries() {
  const played = RECORDS.mostPlayed[0];
  const lopsided = RECORDS.mostLopsided[0];
  return (
    <>
      <SectionHeading id="rivalries" title="Rivalries" />
      <div className="grid gap-4 sm:grid-cols-2">
        {played && (
          <Card accent={team(played.a).color}>
            <Eyebrow icon={Swords}>Most-played rivalry</Eyebrow>
            <RivalryRow a={played.a} b={played.b} aw={played.aWins} bw={played.bWins} />
            <p className="mt-1.5 text-xs text-slate-600">
              {played.games} games · {pts(played.pointsA)}–{pts(played.pointsB)} total points
              {played.playoffMeetings > 0 && ` · ${played.playoffMeetings} in the postseason`}
            </p>
            <Roast>{roast.mostPlayedLine(played)}</Roast>
          </Card>
        )}
        {lopsided && (
          <Card accent={team(lopsided.aWins >= lopsided.bWins ? lopsided.a : lopsided.b).color}>
            <Eyebrow icon={Scale}>Most lopsided rivalry</Eyebrow>
            <RivalryRow a={lopsided.a} b={lopsided.b} aw={lopsided.aWins} bw={lopsided.bWins} />
            <p className="mt-1.5 text-xs text-slate-600">
              {lopsided.games} games · {team(lopsided.a).abbrev} average margin {signed(lopsided.avgMarginForA)}
            </p>
            <Roast>{roast.lopsidedLine(lopsided)}</Roast>
          </Card>
        )}
      </div>
      <RivalryHeatmap />
    </>
  );
}

function RivalryRow({ a, b, aw, bw }: { a: number; b: number; aw: number; bw: number }) {
  return (
    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <TeamLine id={a} />
      <span className="font-display text-2xl font-extrabold text-navy tabular-nums">
        {aw}-{bw}
      </span>
      <div className="flex min-w-0 justify-end text-right">
        <TeamLine id={b} />
      </div>
    </div>
  );
}

function heat(wp: number) {
  const d = Math.min(1, Math.abs(wp - 0.5) * 2);
  // Cap the tint so navy text stays above 4.5:1 on both red and green.
  const a = (0.12 + d * 0.4).toFixed(2);
  return { background: wp >= 0.5 ? `rgba(21,128,61,${a})` : `rgba(185,28,28,${a})`, color: "#0f1e36" };
}

function RivalryHeatmap() {
  const order = STANDINGS.map((t) => t.id).filter((id) => H2H_TEAM_IDS.includes(id));
  return (
    <Card title="Rivalry heatmap" action="Row vs column">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <table className="w-full min-w-[30rem] border-separate border-spacing-[3px] text-center">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white" />
              {order.map((id) => (
                <th key={id} scope="col" className="pb-1" title={team(id).name}>
                  <TeamAvatar teamId={id} size="sm" className="size-6 text-[7px]" />
                  <span className="sr-only">{team(id).abbrev}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.map((row) => (
              <tr key={row}>
                <th scope="row" className="sticky left-0 z-10 bg-white pr-1 text-left" title={team(row).name}>
                  <Link href={teamPath(row)} className="inline-flex size-6 items-center justify-center" aria-label={`${team(row).abbrev}, ${team(row).name}`}>
                    <TeamAvatar teamId={row} size="sm" className="size-6 text-[7px]" />
                  </Link>
                </th>
                {order.map((col) => {
                  if (row === col) return <td key={col} className="h-9 rounded-md bg-slate-100" aria-hidden />;
                  const s = seriesBetween(row, col);
                  if (!s) return <td key={col} className="h-9 rounded-md bg-slate-50 text-xs text-slate-600">—</td>;
                  return (
                    <td
                      key={col}
                      title={`${team(row).name} vs ${team(col).name}: ${record(s)} (${pct(s.winPct)})`}
                      className="h-9 rounded-md font-display text-[13px] leading-none font-bold tabular-nums"
                      style={heat(s.winPct)}
                    >
                      {s.wins}-{s.losses}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded" style={heat(1)} /> Row team owns it
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded" style={heat(0.5)} /> Even
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded" style={heat(0)} /> Row team gets owned
        </span>
        <span>Each cell is the row team&apos;s record against the column team. Teams in standings order.</span>
      </div>
    </Card>
  );
}

function TitleGameScores() {
  const games = [...RECORDS.titleGames].sort((a, b) => b.season - a.season);
  if (games.length === 0) return null;
  return (
    <Card title="Title games, by the numbers" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
      <ol className="divide-y divide-line">
        {games.map((g) => (
          <li key={g.season} className="flex items-start gap-3 px-4 py-3 sm:px-5">
            <span className="w-11 shrink-0 font-display text-xl leading-tight font-extrabold text-navy">{g.season}</span>
            <div className="min-w-0 flex-1 text-sm leading-snug">
              <p className="break-words text-slate-700">
                <Trophy className="mr-1 inline size-3.5 -translate-y-px text-gold-ink" aria-hidden />
                <span className="font-semibold text-navy">{g.championSeasonName}</span> <span className="text-xs text-slate-600">{team(g.championId).abbrev}</span>{" "}
                <span className="font-semibold tabular-nums">{pts(g.championScore)}</span>
              </p>
              <p className="break-words text-slate-600">
                {g.runnerUpSeasonName} <span className="text-xs text-slate-600">{team(g.runnerUpId).abbrev}</span> <span className="tabular-nums">{pts(g.runnerUpScore)}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {g.weeks.length > 1 ? `Two-week final, weeks ${g.weeks[0]}–${g.weeks[g.weeks.length - 1]}` : `Week ${g.weeks[0]}`} · {roast.titleGameLine(g)}
              </p>
            </div>
            <span className="shrink-0 font-display text-lg font-bold text-turf tabular-nums">+{pts(g.margin)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
