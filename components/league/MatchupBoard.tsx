import Link from "next/link";
import { ShieldAlert, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPoints,
  formatRecord,
  isFlagged,
  LEAGUE,
  ordinal,
  team,
  teamPath,
  WEEKS_PLAYED,
  type Matchup,
  type Player,
  type Team,
} from "@/lib/league";
import { sumDefined } from "@/lib/roster-board";
import { recordBookLabel } from "@/lib/week-state";
import { resultCallout } from "@/lib/commentary";
import { buildPreview, matchupFacts, type Edge } from "@/lib/preview";
import { allPlay, CLOSE_GAME_MARGIN, closeGameRecord, pfRank, powerRank, schedule, teamStats } from "@/lib/stats";
import { ByeChip, ScoreReadout, SlotChip, StateBadge, StatusChip } from "./bits";
import { MatchupSeries } from "./h2h";
import { PlayerHeadshot } from "./PlayerHeadshot";
import { PlayoffSeriesNote } from "./playoff-h2h";
import { Card, PageHeader, Stat, TeamAvatar } from "./ui";
import { MiniTrail, ScoreTrail, TrailLegend, WeekStrip } from "./trail";
import { TvModeButton } from "./TvModeButton";

export function MatchupBoard({ matchup }: { matchup: Matchup }) {
  const L = team(matchup.left.teamId);
  const R = team(matchup.right.teamId);
  const preview = buildPreview(matchup);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/matchups" className="inline-flex items-center gap-1 self-start text-xs font-bold tracking-wide text-turf uppercase hover:underline">
          ← Week {LEAGUE.week} scores
        </Link>
        <PageHeader
          eyebrow={`Week ${LEAGUE.week} matchup`}
          title={
            <span className="text-[1.75rem] sm:text-[2.35rem]">
              {L.name} <span className="font-semibold text-slate-500">vs</span> {R.name}
            </span>
          }
          action={<TvModeButton />}
        />
      </div>

      <Scorecard matchup={matchup} L={L} R={R} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <Card title="Matchup preview" accent={L.color}>
            <div className="grid gap-2.5 text-[15px] leading-relaxed text-slate-700">
              {preview.story.map((s) => (
                <p key={s}>{s}</p>
              ))}
            </div>
            <h3 className="mt-5 text-[11px] font-bold tracking-[0.1em] text-slate-600 uppercase">Statistical edges</h3>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <EdgeList t={L} edges={preview.edges.left} />
              <EdgeList t={R} edges={preview.edges.right} />
            </div>
            <div className="mt-4 rounded-xl border-l-4 border-gold bg-gold-light/65 px-4 py-3 ring-1 ring-gold-border/70">
              <p className="text-xs font-bold tracking-wider text-gold-ink uppercase">What&apos;s at stake</p>
              {preview.stakes.map((s) => (
                <p key={s} className="mt-1 text-sm leading-snug text-slate-800">
                  {s}
                </p>
              ))}
            </div>
          </Card>
          <MatchupSeries leftId={L.id} rightId={R.id} />
          <TaleOfTheTape L={L} R={R} matchup={matchup} />
        </div>
        <div className="grid content-start gap-6">
          <Card title="Weekly scoring" action={`${LEAGUE.season} season`}>
            <TrailLegend focus={L} compare={R} />
            <ScoreTrail focus={L} compare={R} focusProj={matchup.left.projected} compareProj={matchup.right.projected} />
            <div className="mt-4 grid gap-3.5">
              {[L, R].map((t) => (
                <div key={t.id}>
                  <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-navy">
                    <TeamAvatar teamId={t.id} size="xs" />
                    <span className="truncate">{t.name}</span>
                  </p>
                  <WeekStrip weeks={t.weekly} />
                </div>
              ))}
            </div>
          </Card>
          <TeamCard t={L} />
          <TeamCard t={R} />
        </div>
      </div>

      <InjuryReport L={L} R={R} />
      <Card title="Starting lineups" action={`${L.roster.starters.length} starters`} bodyClassName="p-0 sm:p-0">
        <Lineups L={L} R={R} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        {[L, R].map((t) => (
          <Card key={t.id} title="Bench & IR" action={t.abbrev} accent={t.color}>
            <p className="-mt-1 mb-2.5 truncate text-xs font-semibold text-slate-600">{t.name}</p>
            <BenchList players={[...t.roster.bench, ...t.roster.ir]} />
          </Card>
        ))}
      </div>
    </>
  );
}

function Scorecard({ matchup, L, R }: { matchup: Matchup; L: Team; R: Team }) {
  const live = matchup.state !== "projected";
  const lShow = live ? (matchup.left.points ?? 0) : (matchup.left.projected ?? 0);
  const rShow = live ? (matchup.right.points ?? 0) : (matchup.right.projected ?? 0);
  const total = lShow + rShow;
  const share = total > 0 ? (lShow / total) * 100 : 50;
  const lp = matchup.left.projected;
  const rp = matchup.right.projected;
  const hasProj = lp != null && rp != null;
  const stateLabel = matchup.state === "final" ? "Final" : matchup.state === "live" ? "In progress" : "Projected";

  return (
    <section
      className="overflow-hidden rounded-2xl bg-navy yard-lines text-white shadow-[0_6px_20px_rgba(12,25,44,0.18)] ring-1 ring-navy-3"
      aria-label={`${stateLabel} score`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/80 sm:px-6">
        <span className="font-display tracking-[0.1em] uppercase">Week {matchup.week} scoreboard</span>
        <StateBadge state={matchup.state} onDark />
      </div>

      {/* Mobile stacked scoreboard for clean full-width team names */}
      <div className="divide-y divide-white/10 px-4 py-2 sm:hidden">
        <MobileScoreRow
          t={L}
          side={matchup.left}
          state={matchup.state}
          leading={lShow > rShow}
          tied={lShow === rShow}
          home={matchup.homeId === L.id}
        />
        <MobileScoreRow
          t={R}
          side={matchup.right}
          state={matchup.state}
          leading={rShow > lShow}
          tied={lShow === rShow}
          home={matchup.homeId === R.id}
        />
      </div>

      {/* Desktop head-to-head arena banner */}
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-6 pt-5 pb-2 sm:grid">
        <DesktopScoreSide
          t={L}
          side={matchup.left}
          state={matchup.state}
          leading={lShow > rShow}
          tied={lShow === rShow}
          home={matchup.homeId === L.id}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/10 font-display text-xs font-bold tracking-widest text-white/80 uppercase ring-1 ring-white/15">
            VS
          </span>
        </div>
        <DesktopScoreSide
          t={R}
          side={matchup.right}
          state={matchup.state}
          leading={rShow > lShow}
          tied={lShow === rShow}
          home={matchup.homeId === R.id}
          align="right"
        />
      </div>

      <div className="px-4 pt-3 pb-4 sm:px-6 sm:pb-5">
        <div
          className="flex h-2.5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10 ring-inset"
          role="img"
          aria-label={
            live
              ? `Score so far: ${share.toFixed(0)}% to ${(100 - share).toFixed(0)}%`
              : `Projected share: ${share.toFixed(0)}% to ${(100 - share).toFixed(0)}%`
          }
        >
          <span style={{ width: `${share}%`, background: L.color }} />
          <span className="w-0.5 bg-navy" />
          <span className="flex-1" style={{ background: R.color }} />
        </div>
        {hasProj && <p className="mt-2.5 text-center text-sm text-white/90">{resultCallout(matchupFacts(matchup))}</p>}
        <PlayoffSeriesNote leftId={L.id} rightId={R.id} onDark className="mt-2.5" />
      </div>
    </section>
  );
}

function MobileScoreRow({
  t,
  side,
  state,
  leading,
  tied,
  home,
}: {
  t: Team;
  side: Matchup["left"];
  state: Matchup["state"];
  leading: boolean;
  tied: boolean;
  home: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: t.color }} aria-hidden />
      <TeamAvatar teamId={t.id} size="md" className="ring-2 ring-white/15" />
      <div className="min-w-0 flex-1">
        <Link href={teamPath(t.id)} className="block text-[15px] leading-tight font-semibold break-words text-white hover:underline">
          {t.name}
        </Link>
        <p className="mt-0.5 text-xs text-white/75">
          {formatRecord(t)} · {ordinal(t.rank)} · {home ? "Home" : "Away"}
        </p>
      </div>
      <div className={cn("shrink-0 text-right", leading && state !== "projected" && "text-emerald-300")}>
        {leading && !tied && (
          <span className="mb-0.5 inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 font-sans text-[10px] leading-none font-bold tracking-wider text-emerald-200 uppercase ring-1 ring-emerald-400/30 ring-inset">
            {state === "final" ? "Winner" : state === "live" ? "Ahead" : "Favored"}
          </span>
        )}
        <p className={cn("font-display text-4xl leading-none font-extrabold tabular-nums", leading || tied ? "text-white" : "text-white/75")}>
          <ScoreReadout side={side} state={state} bracketClassName="text-white/70" />
        </p>
      </div>
    </div>
  );
}

function DesktopScoreSide({
  t,
  side,
  state,
  leading,
  tied,
  home,
  align = "left",
}: {
  t: Team;
  side: Matchup["left"];
  state: Matchup["state"];
  leading: boolean;
  tied: boolean;
  home: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-4", align === "right" && "flex-row-reverse")}>
      <div className={cn("flex min-w-0 items-center gap-3.5", align === "right" && "flex-row-reverse text-right")}>
        <TeamAvatar teamId={t.id} size="lg" className="ring-2 ring-white/20" />
        <div className="min-w-0">
          <Link href={teamPath(t.id)} className="block font-display text-xl leading-tight font-bold break-words text-white hover:underline lg:text-2xl">
            {t.name}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/75">
            <span>
              {formatRecord(t)} · {ordinal(t.rank)} · {home ? "Home" : "Away"}
            </span>
            {leading && !tied && (
              <span className="inline-flex rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wider text-emerald-200 uppercase ring-1 ring-emerald-400/30 ring-inset">
                {state === "final" ? "Winner" : state === "live" ? "Ahead" : "Favored"}
              </span>
            )}
          </p>
        </div>
      </div>
      <p className={cn("shrink-0 font-display text-5xl leading-none font-extrabold tabular-nums lg:text-6xl", leading || tied ? "text-white" : "text-white/75")}>
        <ScoreReadout side={side} state={state} bracketClassName="text-white/75" />
      </p>
    </div>
  );
}

function EdgeList({ t, edges }: { t: Team; edges: Edge[] }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-subtle p-3 ring-1 ring-line/80">
      <p className="flex items-center gap-2 text-sm font-semibold text-navy">
        <TeamAvatar teamId={t.id} size="xs" />
        <span className="min-w-0 break-words">{t.name}</span>
      </p>
      {edges.length ? (
        <ul className="mt-2 grid gap-1.5">
          {edges.map((e) => (
            <li key={e.label} className="text-xs leading-snug text-slate-700 sm:text-sm">
              <span className="font-bold text-turf-dark">{e.label}: </span>
              {e.detail}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-600 sm:text-sm">No statistical edge this week.</p>
      )}
    </div>
  );
}

function TaleOfTheTape({ L, R, matchup }: { L: Team; R: Team; matchup: Matchup }) {
  const ls = teamStats(L);
  const rs = teamStats(R);
  const la = allPlay(L.id);
  const ra = allPlay(R.id);
  const lc = closeGameRecord(L.id);
  const rc = closeGameRecord(R.id);
  type Row = { label: string; l: number | string; r: number | string; fmt?: (v: number) => string; better?: "high" | "low" };
  const rank = (v: number) => `#${v}`;
  const rows: Row[] = [
    ...(matchup.left.projected != null && matchup.right.projected != null
      ? [{ label: `Week ${matchup.week} projection`, l: matchup.left.projected, r: matchup.right.projected, better: "high" as const }]
      : []),
    { label: "Record", l: formatRecord(L), r: formatRecord(R) },
    { label: "Points for", l: L.pointsFor, r: R.pointsFor, better: "high" },
    { label: "Points-for rank", l: pfRank(L.id), r: pfRank(R.id), fmt: rank, better: "low" },
    { label: "Power rank", l: powerRank(L.id), r: powerRank(R.id), fmt: rank, better: "low" },
    { label: "All-play record", l: `${la.wins}-${la.losses}`, r: `${ra.wins}-${ra.losses}` },
    { label: "Avg per week", l: ls.avg, r: rs.avg, better: "high" },
    { label: "Last 3 weeks avg", l: ls.last3, r: rs.last3, better: "high" },
    { label: "Best week", l: ls.high.pf, r: rs.high.pf, better: "high" },
    { label: "Worst week", l: ls.low.pf, r: rs.low.pf, better: "high" },
    { label: "Weekly swing (±)", l: ls.stdDev, r: rs.stdDev },
    { label: "Points against", l: L.pointsAgainst, r: R.pointsAgainst },
    { label: "Opponents' avg", l: schedule(L.id).oppAvg, r: schedule(R.id).oppAvg },
    { label: `Games decided by <${CLOSE_GAME_MARGIN}`, l: `${lc.wins}-${lc.losses}`, r: `${rc.wins}-${rc.losses}` },
    { label: "Titles (2020–25)", l: L.history.titles, r: R.history.titles, fmt: String },
  ];
  const show = (r: Row, v: number | string) => (typeof v === "number" ? (r.fmt ? r.fmt(v) : v.toFixed(1)) : v);
  const winner = (r: Row) => {
    if (!r.better || typeof r.l !== "number" || typeof r.r !== "number" || r.l === r.r) return null;
    return (r.better === "high") === r.l > r.r ? "l" : "r";
  };

  return (
    <Card title="Tale of the tape" action={recordBookLabel(WEEKS_PLAYED)} bodyClassName="p-0 sm:p-0">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-subtle px-4 py-2.5 text-xs font-bold text-navy uppercase sm:px-5">
        <span className="flex items-center gap-2">
          <TeamAvatar teamId={L.id} size="xs" />
          <span>{L.abbrev}</span>
        </span>
        <span className="text-[11px] font-semibold tracking-wider text-slate-500">Metric</span>
        <span className="flex items-center gap-2">
          <span>{R.abbrev}</span>
          <TeamAvatar teamId={R.id} size="xs" />
        </span>
      </div>
      <dl className="divide-y divide-line px-4 sm:px-5">
        {rows.map((r) => {
          const w = winner(r);
          return (
            <div key={r.label} className="grid grid-cols-[5rem_minmax(0,1fr)_5rem] items-center gap-2 py-2.5">
              <dd
                className={cn(
                  "justify-self-start font-display text-lg leading-none font-bold tabular-nums",
                  w === "l" ? "rounded-md bg-turf-light px-1.5 py-0.5 text-turf-dark" : w === "r" ? "text-slate-500" : "text-navy",
                )}
              >
                {show(r, r.l)}
              </dd>
              <dt className="text-center text-xs font-semibold text-slate-600">{r.label}</dt>
              <dd
                className={cn(
                  "justify-self-end text-right font-display text-lg leading-none font-bold tabular-nums",
                  w === "r" ? "rounded-md bg-turf-light px-1.5 py-0.5 text-turf-dark" : w === "l" ? "text-slate-500" : "text-navy",
                )}
              >
                {show(r, r.r)}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="border-t border-line bg-surface-subtle/60 px-4 py-2.5 text-xs text-slate-600 sm:px-5">
        Highlighted badges mark the stronger side where higher or lower is clearly better. All-play: record if you played every team every week.
      </p>
    </Card>
  );
}

function TeamCard({ t }: { t: Team }) {
  const h = t.history;
  return (
    <Card accent={t.color}>
      <div className="flex items-start gap-3">
        <TeamAvatar teamId={t.id} />
        <div className="min-w-0 flex-1">
          <Link href={teamPath(t.id)} className="font-display text-lg leading-tight font-bold break-words text-navy hover:underline">
            {t.name}
          </Link>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            {[t.owner, `${formatRecord(t)} · ${ordinal(t.rank)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <MiniTrail team={t} className="hidden min-[380px]:block" />
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-3 rounded-xl bg-surface-subtle p-3 ring-1 ring-line/80">
        <Stat label="Titles" value={h.titles} sub={h.titleYears.join(", ") || "—"} valueClassName={h.titles ? "text-gold-ink" : undefined} />
        <Stat label="Finals" value={h.finalsYears.length} sub={h.finalsYears.join(", ") || "—"} />
        {h.allTime && <Stat label="2020–25" value={formatRecord(h.allTime)} sub="Regular season" />}
      </div>
      <Link href={teamPath(t.id)} className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-turf hover:underline">
        {h.titles > 0 && <Trophy className="size-3.5 text-gold-ink" aria-hidden />}
        <span>Team page, roster & history →</span>
      </Link>
    </Card>
  );
}

function InjuryReport({ L, R }: { L: Team; R: Team }) {
  const list = [L, R].flatMap((t) => t.roster.starters.filter((p) => isFlagged(p) || p.onBye).map((p) => ({ p, t })));
  if (list.length === 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-loss-light/70 px-4 py-3.5 ring-1 ring-loss-border sm:px-5">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-loss" />
      <div className="min-w-0 flex-1 text-sm leading-snug">
        <p className="font-display text-sm font-bold tracking-wider text-loss uppercase">Starter availability alert</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {list.map(({ p, t }) => (
            <li
              key={`${t.id}-${p.name}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-navy ring-1 ring-loss-border"
            >
              <span>{p.name}</span>
              <StatusChip status={p.status} />
              <ByeChip onBye={p.onBye} />
              <span className="font-medium text-slate-500">· {t.abbrev}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Lineups({ L, R }: { L: Team; R: Team }) {
  const rows = Math.max(L.roster.starters.length, R.roster.starters.length);
  const lScoreTotal = sumDefined(L.roster.starters.map((p) => p?.score));
  const rScoreTotal = sumDefined(R.roster.starters.map((p) => p?.score));
  const lProjTotal = sumDefined(L.roster.starters.map((p) => p?.projection));
  const rProjTotal = sumDefined(R.roster.starters.map((p) => p?.projection));
  const showTotals = lScoreTotal != null || rScoreTotal != null || lProjTotal != null || rProjTotal != null;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2 border-b border-line bg-surface-subtle px-4 py-2.5 text-xs font-bold tracking-wider text-slate-600 uppercase sm:px-5">
        <span className="flex min-w-0 items-center gap-2 truncate text-navy">
          <TeamAvatar teamId={L.id} size="xs" />
          <span className="truncate">{L.name}</span>
        </span>
        <span className="text-center">Slot</span>
        <span className="flex min-w-0 items-center justify-end gap-2 truncate text-right text-navy">
          <span className="truncate">{R.name}</span>
          <TeamAvatar teamId={R.id} size="xs" />
        </span>
      </div>
      <ol className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => {
          const mine = L.roster.starters[i];
          const theirs = R.roster.starters[i];
          return (
            <li
              key={i}
              className="grid min-h-15 grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2 px-4 py-2.5 transition-colors hover:bg-surface-subtle/50 sm:px-5"
            >
              <PlayerCell player={mine} />
              <SlotChip slot={mine?.slot ?? theirs?.slot ?? "—"} className="justify-self-center" />
              <PlayerCell player={theirs} align="right" />
            </li>
          );
        })}
      </ol>
      {showTotals && (
        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 border-t border-line bg-surface-subtle px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">{L.abbrev} total</span>
            <span className="font-display text-xl font-bold text-navy tabular-nums">
              {lScoreTotal != null ? formatPoints(lScoreTotal) : "—"}
              {lProjTotal != null && <span className="ml-1.5 font-sans text-xs font-semibold text-slate-500">proj {lProjTotal.toFixed(1)}</span>}
            </span>
          </div>
          <span className="text-center font-display text-xs font-bold tracking-wider text-slate-500 uppercase">Sum</span>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-xl font-bold text-navy tabular-nums">
              {rScoreTotal != null ? formatPoints(rScoreTotal) : "—"}
              {rProjTotal != null && <span className="ml-1.5 font-sans text-xs font-semibold text-slate-500">proj {rProjTotal.toFixed(1)}</span>}
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">{R.abbrev} total</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlayerCell({ player, align = "left" }: { player?: Player; align?: "left" | "right" }) {
  if (!player) return <span className={cn("text-sm text-slate-400", align === "right" && "text-right")}>Empty</span>;
  const hasNums = player.score != null || player.projection != null;
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-2", align === "right" && "flex-row-reverse")}>
      <div className={cn("flex min-w-0 items-center gap-2.5", align === "right" && "flex-row-reverse text-right")}>
        <PlayerHeadshot id={player.playerId} name={player.name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm leading-tight font-semibold break-words text-navy sm:text-[15px]">{player.name}</p>
          {(player.nflTeam || isFlagged(player) || player.onBye) && (
            <p className={cn("mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-600", align === "right" && "justify-end")}>
              {player.nflTeam && (
                <span>
                  {player.slot === "FLEX" ? `${player.position} · ` : ""}
                  {player.nflTeam}
                </span>
              )}
              <StatusChip status={player.status} />
              <ByeChip onBye={player.onBye} />
            </p>
          )}
        </div>
      </div>
      {hasNums && (
        <div className={cn("shrink-0 tabular-nums", align === "right" ? "text-left" : "text-right")}>
          <p className={cn("font-display text-base leading-none font-bold", (player.score ?? 0) > 0 ? "text-navy" : "text-slate-500")}>
            {player.score != null ? formatPoints(player.score) : "—"}
          </p>
          {player.projection != null && <p className="mt-0.5 text-[11px] font-medium text-slate-500">{player.projection.toFixed(1)}</p>}
        </div>
      )}
    </div>
  );
}

export function BenchList({ players }: { players: Player[] }) {
  if (players.length === 0) return <p className="py-3 text-center text-sm text-slate-600">Nobody on the bench.</p>;
  return (
    <ul className="divide-y divide-line">
      {players.map((p) => (
        <li key={p.name} className="flex min-h-12 items-center gap-2.5 py-2 first:pt-0 last:pb-0">
          <SlotChip slot={p.slot === "Bench" ? p.position : p.slot} className={p.slot === "Bench" ? "opacity-85" : undefined} />
          <PlayerHeadshot id={p.playerId} name={p.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-semibold break-words text-navy">{p.name}</p>
            {p.nflTeam && <p className="text-xs text-slate-600">{p.nflTeam}</p>}
          </div>
          <StatusChip status={p.status} />
          <ByeChip onBye={p.onBye} />
          {(p.score != null || p.projection != null) && (
            <div className="shrink-0 text-right tabular-nums">
              <p className={cn("font-display text-sm leading-none font-bold", (p.score ?? 0) > 0 ? "text-navy" : "text-slate-500")}>
                {p.score != null ? formatPoints(p.score) : "—"}
              </p>
              {p.projection != null && <p className="text-[11px] text-slate-500">{p.projection.toFixed(1)}</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
