import Link from "next/link";
import { History, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStanding, isFlagged, ordinal, snapshot, type Board, type MatchupSide, type SnapshotPlayer } from "@/lib/league";
import {
  closeGameRecord,
  CLOSE_GAME_MARGIN,
  getBrief,
  getFranchise,
  getLuck,
  splitMustWin,
  teamColor,
  teamIdByName,
  trailStats,
  type Franchise,
} from "@/lib/intel";
import { SlotChip, StatusChip } from "./bits";
import { Card, LuckBadge, PageHeader, Pill, Stat, TeamAvatar } from "./ui";
import { MiniTrail, ScoreTrail, WeekStrip } from "./trail";
import { TvModeButton } from "./TvModeButton";

export function MatchupBoard({ board }: { board: Board }) {
  const { focus, opponent, config } = board;
  const brief = getBrief(config.slug);
  const focusF = getFranchise(focus.teamId);
  const oppF = getFranchise(opponent.teamId);
  const luck = getLuck(focus.teamId);

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <PageHeader eyebrow={`${focusF?.ownerLabel ?? config.manager}'s team · Week ${snapshot.league.week}`} title={focus.teamName}>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill tone="navy">{focus.record}</Pill>
            {board.focusStanding && <Pill>{ordinal(board.focusStanding.playoffSeed)} seed</Pill>}
            <Pill>{focus.pointsFor.toFixed(1)} PF</Pill>
            {luck && <LuckBadge row={luck} withRanks />}
          </div>
        </PageHeader>
        <TvModeButton />
      </div>

      <Scorecard focus={focus} opponent={opponent} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          {brief && <PreviewCard brief={brief} focus={focus} opponent={opponent} />}
          {focusF && oppF && <TaleOfTheTape focus={focus} opponent={opponent} focusF={focusF} oppF={oppF} />}
        </div>
        <div className="grid content-start gap-5">
          {focusF && <ScoringCard focus={focusF} opponent={oppF} focusSide={focus} opponentSide={opponent} />}
          {focusF && <StoryCard franchise={focusF} title="Team story" />}
          {oppF && <StoryCard franchise={oppF} title="Scouting report" />}
        </div>
      </div>

      <InjuryReport focus={focus} opponent={opponent} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Starting lineups" action={`${focus.starters.length} starters`} bodyClassName="px-0 pb-1 sm:px-0">
          <Lineups focus={focus} opponent={opponent} />
        </Card>
        <Card title="Bench & IR" action={`${focus.bench?.length ?? 0} players`}>
          <BenchList players={focus.bench ?? []} />
        </Card>
      </div>
    </>
  );
}

function Scorecard({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const margin = focus.projected - opponent.projected;
  const share = (focus.projected / (focus.projected + opponent.projected)) * 100;
  const fav = margin >= 0 ? focus : opponent;
  return (
    <section className="overflow-hidden rounded-2xl bg-navy yard-lines text-white shadow-lg shadow-navy/15">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 sm:px-5">
        <span className="tracking-wider uppercase">Week {snapshot.league.week} matchup</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 tracking-wide uppercase">Projected</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 px-4 pt-4 sm:px-5">
        <ScoreSide side={focus} leading={margin >= 0} />
        <span className="pt-16 font-display text-sm font-bold text-white/40 uppercase">vs</span>
        <ScoreSide side={opponent} leading={margin < 0} align="right" />
      </div>
      <div className="px-4 pt-4 pb-4 sm:px-5">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Projected share: ${share.toFixed(0)}% to ${(100 - share).toFixed(0)}%`}>
          <span style={{ width: `${share}%`, background: teamColor(focus.teamId) }} />
          <span className="w-0.5 bg-navy" />
          <span className="flex-1" style={{ background: teamColor(opponent.teamId) }} />
        </div>
        <p className="mt-2 text-center text-sm text-white/80">
          <span className="font-semibold text-white">{fav.teamName}</span> projected to win by{" "}
          <span className="font-display text-base font-bold text-gold tabular-nums">{Math.abs(margin).toFixed(1)}</span>
        </p>
      </div>
    </section>
  );
}

function ScoreSide({ side, leading, align = "left" }: { side: MatchupSide; leading: boolean; align?: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", align === "right" ? "items-end text-right" : "items-start")}>
      <TeamAvatar teamId={side.teamId} size="lg" className="ring-2 ring-white/20" />
      <div className="min-w-0">
        <p className="text-[15px] leading-tight font-semibold break-words">{side.teamName}</p>
        <p className="text-xs text-white/60">
          {side.record} · {ordinal(side.rank)}
        </p>
      </div>
      <p className={cn("font-display text-5xl leading-none font-extrabold tabular-nums sm:text-6xl", leading ? "text-white" : "text-white/55")}>
        {side.projected.toFixed(1)}
      </p>
    </div>
  );
}

function PreviewCard({ brief, focus, opponent }: { brief: NonNullable<ReturnType<typeof getBrief>>; focus: MatchupSide; opponent: MatchupSide }) {
  const must = splitMustWin(brief.mustWin);
  const mustId = teamIdByName(must.subject);
  const mustIsFocus = mustId === focus.teamId;
  return (
    <Card title="Matchup preview" accent={teamColor(focus.teamId)}>
      <p className="text-[16px] leading-relaxed text-slate-700">{brief.story}</p>

      <div className={cn("mt-4 rounded-xl border-l-4 px-3.5 py-3", mustIsFocus ? "border-loss bg-red-50" : "border-gold bg-gold-light")}>
        <p className={cn("text-sm font-bold", mustIsFocus ? "text-red-700" : "text-amber-800")}>
          Must-win for {mustId ? (mustIsFocus ? focus.teamName : opponent.teamName) : must.subject}
        </p>
        <p className="mt-0.5 text-sm leading-snug text-slate-700">{must.detail || brief.mustWin}</p>
      </div>

      <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-500 uppercase">Key edges</h3>
      <ul className="mt-2 grid gap-3">
        {brief.edges.map((e) => {
          const id = teamIdByName(e.side);
          return (
            <li key={e.side} className="flex items-start gap-3">
              <TeamAvatar teamId={id} size="sm" />
              <p className="min-w-0 text-sm leading-snug text-slate-700">
                <span className="font-semibold text-navy">{id === focus.teamId ? focus.teamName : id === opponent.teamId ? opponent.teamName : e.side}: </span>
                {e.edge}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-sm leading-snug text-slate-600">
        <History className="mt-0.5 size-4 shrink-0 text-slate-400" />
        {brief.historyNote}
      </p>
    </Card>
  );
}

function TaleOfTheTape({ focus, opponent, focusF, oppF }: { focus: MatchupSide; opponent: MatchupSide; focusF: Franchise; oppF: Franchise }) {
  const fs = trailStats(focusF);
  const os = trailStats(oppF);
  const fl = getLuck(focus.teamId);
  const ol = getLuck(opponent.teamId);
  const fc = closeGameRecord(focusF);
  const oc = closeGameRecord(oppF);
  const last3 = (f: Franchise) => {
    const w = f.weekly2026.slice(-3);
    return w.reduce((a, b) => a + b.pf, 0) / w.length;
  };
  type Row = { label: string; f: number | string; o: number | string; fmt?: (v: number) => string; better?: "high" | "low" };
  const rows: Row[] = [
    { label: "Week 8 projection", f: focus.projected, o: opponent.projected, better: "high" },
    { label: "Points for", f: focus.pointsFor, o: opponent.pointsFor, better: "high" },
    { label: "Points-for rank", f: fl?.pfRank ?? "—", o: ol?.pfRank ?? "—", fmt: (v) => `#${v}`, better: "low" },
    { label: "Avg per week", f: fs.avg, o: os.avg, better: "high" },
    { label: "Last 3 weeks avg", f: last3(focusF), o: last3(oppF), better: "high" },
    { label: "Best week", f: fs.high.pf, o: os.high.pf, better: "high" },
    { label: "Worst week", f: fs.low.pf, o: os.low.pf, better: "high" },
    { label: "Weekly swing (±)", f: fs.stdDev, o: os.stdDev },
    { label: "Points against", f: getStanding(focus.teamId)?.pointsAgainst ?? 0, o: getStanding(opponent.teamId)?.pointsAgainst ?? 0 },
    { label: `Games decided by <${CLOSE_GAME_MARGIN}`, f: `${fc.wins}-${fc.losses}`, o: `${oc.wins}-${oc.losses}` },
  ];
  const show = (r: Row, v: number | string) => (typeof v === "number" ? (r.fmt ? r.fmt(v) : v.toFixed(1)) : v);
  const winner = (r: Row) => {
    if (!r.better || typeof r.f !== "number" || typeof r.o !== "number" || r.f === r.o) return null;
    return (r.better === "high") === r.f > r.o ? "f" : "o";
  };
  return (
    <Card title="Tale of the tape" action="Weeks 1–7">
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <TeamAvatar teamId={focus.teamId} size="sm" />
          <span className="truncate text-xs font-semibold text-slate-500">{focusF.ownerLabel}</span>
        </span>
        <span />
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate text-xs font-semibold text-slate-500">{oppF.ownerLabel}</span>
          <TeamAvatar teamId={opponent.teamId} size="sm" />
        </span>
      </div>
      <dl className="divide-y divide-line">
        {rows.map((r) => {
          const w = winner(r);
          return (
            <div key={r.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 py-2">
              <dd className={cn("font-display text-lg font-bold tabular-nums", w === "f" ? "text-turf" : "text-navy", w === "o" && "text-slate-400")}>
                {show(r, r.f)}
              </dd>
              <dt className="text-center text-xs font-medium text-slate-500">{r.label}</dt>
              <dd className={cn("text-right font-display text-lg font-bold tabular-nums", w === "o" ? "text-turf" : "text-navy", w === "f" && "text-slate-400")}>
                {show(r, r.o)}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-2 text-xs text-slate-500">Green marks the better side where higher or lower is clearly better.</p>
    </Card>
  );
}

function ScoringCard({
  focus,
  opponent,
  focusSide,
  opponentSide,
}: {
  focus: Franchise;
  opponent?: Franchise;
  focusSide: MatchupSide;
  opponentSide: MatchupSide;
}) {
  const s = trailStats(focus);
  return (
    <Card title="Weekly scoring" action="2026">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full" style={{ background: teamColor(focus.teamId) }} />
          {focusSide.teamName}
        </span>
        {opponent && (
          <span className="flex items-center gap-1.5">
            <span className="h-[2px] w-4 rounded-full opacity-60" style={{ background: teamColor(opponent.teamId) }} />
            {opponentSide.teamName}
          </span>
        )}
        <span className="text-slate-400">Wk 8 = projection</span>
      </div>
      <ScoreTrail focus={focus} opponent={opponent} focusProj={focusSide.projected} opponentProj={opponentSide.projected} />
      <WeekStrip weeks={focus.weekly2026} className="mt-3" />
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
        <Stat label="Average" value={s.avg.toFixed(1)} sub={`Proj ${focusSide.projected - s.avg >= 0 ? "+" : "−"}${Math.abs(focusSide.projected - s.avg).toFixed(1)} vs avg`} />
        <Stat label="Best" value={s.high.pf.toFixed(1)} sub={`Wk ${s.high.week} vs ${s.high.opp}`} valueClassName="text-turf" />
        <Stat label="Worst" value={s.low.pf.toFixed(1)} sub={`Wk ${s.low.week} vs ${s.low.opp}`} valueClassName="text-loss" />
      </div>
    </Card>
  );
}

function StoryCard({ franchise, title }: { franchise: Franchise; title: string }) {
  return (
    <Card title={title} action={franchise.ownerLabel} accent={teamColor(franchise.teamId)}>
      <div className="flex items-start gap-3">
        <TeamAvatar teamId={franchise.teamId} />
        <div className="min-w-0">
          <p className="font-semibold text-navy">{franchise.name}</p>
          <p className="text-xs text-slate-500">
            {franchise.titles} title{franchise.titles === 1 ? "" : "s"} · Playoffs {franchise.playoffAppearancesRecent}
          </p>
        </div>
        <MiniTrail franchise={franchise} className="ml-auto hidden min-[380px]:block" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{franchise.arc}</p>
      <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-snug text-slate-700 ring-1 ring-slate-100">
        <span className="font-semibold text-navy">Signature: </span>
        {franchise.signature}
      </p>
      <Link href="/history" className="mt-3 inline-block text-sm font-semibold text-turf hover:underline">
        League history →
      </Link>
    </Card>
  );
}

function InjuryReport({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const list = [
    ...focus.starters.filter(isFlagged).map((p) => ({ p, team: focus })),
    ...opponent.starters.filter(isFlagged).map((p) => ({ p, team: opponent })),
  ];
  if (list.length === 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-loss" />
      <div className="min-w-0 text-sm leading-snug">
        <p className="font-bold text-red-800">Injury report · starters</p>
        <p className="mt-0.5 text-slate-700">
          {list.map(({ p, team }, i) => (
            <span key={p.name}>
              {i > 0 && " · "}
              {p.name} <span className="font-semibold text-loss">({p.status === "Questionable" ? "Q" : p.status})</span>
              {team.teamId === opponent.teamId && <span className="text-slate-500"> (opp)</span>}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function Lineups({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const rows = Math.max(focus.starters.length, opponent.starters.length);
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] gap-2 border-b border-line bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 sm:px-5">
        <span className="truncate">{focus.teamName}</span>
        <span className="text-center">Pos</span>
        <span className="truncate text-right">{opponent.teamName}</span>
      </div>
      <ol>
        {Array.from({ length: rows }, (_, i) => {
          const mine = focus.starters[i];
          const theirs = opponent.starters[i];
          return (
            <li key={i} className="grid min-h-14 grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] items-center gap-2 border-b border-line px-4 py-2 last:border-0 sm:px-5">
              <PlayerCell player={mine} />
              <SlotChip slot={mine?.slot ?? theirs?.slot ?? "—"} className="justify-self-center" />
              <PlayerCell player={theirs} align="right" muted />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PlayerCell({ player, align = "left", muted }: { player?: SnapshotPlayer; align?: "left" | "right"; muted?: boolean }) {
  if (!player) return <span className="text-slate-300">—</span>;
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className={cn("text-[15px] leading-tight font-semibold break-words", muted ? "text-slate-600" : "text-navy")}>{player.name}</p>
      {(player.team || isFlagged(player)) && (
        <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs text-slate-500", align === "right" && "justify-end")}>
          {player.team && <span>{player.team}</span>}
          <StatusChip status={player.status} />
        </p>
      )}
    </div>
  );
}

function BenchList({ players }: { players: SnapshotPlayer[] }) {
  if (players.length === 0) return <p className="py-3 text-center text-sm text-slate-500">No bench in this snapshot.</p>;
  return (
    <ul className="divide-y divide-line">
      {players.map((p) => (
        <li key={p.name} className="flex min-h-12 items-center gap-3 py-2">
          <SlotChip slot={p.slot} />
          <span className="min-w-0 flex-1 text-[15px] leading-tight font-medium break-words text-slate-700">{p.name}</span>
          {p.team && <span className="text-xs text-slate-500">{p.team}</span>}
          <StatusChip status={p.status} />
        </li>
      ))}
    </ul>
  );
}
