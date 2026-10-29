import Link from "next/link";
import { ShieldAlert, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRecord, isFlagged, LEAGUE, ordinal, team, teamPath, type Matchup, type Player, type Team } from "@/lib/league";
import { buildPreview, type Edge } from "@/lib/preview";
import { allPlay, CLOSE_GAME_MARGIN, closeGameRecord, luck, pfRank, powerRank, schedule, teamStats } from "@/lib/stats";
import { SlotChip, StatusChip } from "./bits";
import { MatchupSeries } from "./h2h";
import { Card, LuckBadge, PageHeader, Pill, Stat, TeamAvatar } from "./ui";
import { MiniTrail, ScoreTrail, TrailLegend, WeekStrip } from "./trail";
import { TvModeButton } from "./TvModeButton";

export function MatchupBoard({ matchup, featured }: { matchup: Matchup; featured?: boolean }) {
  const L = team(matchup.left.teamId);
  const R = team(matchup.right.teamId);
  const preview = buildPreview(matchup);

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        {featured ? (
          <PageHeader eyebrow={`${L.owner ? `${L.owner}'s team` : "Featured team"} · Week ${LEAGUE.week}`} title={L.name}>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill tone="navy">{formatRecord(L)}</Pill>
              <Pill>{ordinal(L.seed)} seed</Pill>
              <Pill>{L.pointsFor.toFixed(1)} PF</Pill>
              <LuckBadge row={luck(L.id)} withRanks />
            </div>
            <Link href={teamPath(L.id)} className="mt-3 inline-block text-sm font-semibold text-turf hover:underline">
              Full team page →
            </Link>
          </PageHeader>
        ) : (
          <PageHeader eyebrow={`Week ${LEAGUE.week} matchup`} title={<span className="text-[1.75rem] sm:text-4xl">{L.name} <span className="text-slate-400">vs</span> {R.name}</span>} />
        )}
        <TvModeButton />
      </div>

      <Scorecard matchup={matchup} L={L} R={R} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <Card title="Matchup preview" accent={L.color}>
            <div className="grid gap-2 text-[16px] leading-relaxed text-slate-700">
              {preview.story.map((s) => (
                <p key={s}>{s}</p>
              ))}
            </div>
            <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-500 uppercase">Edges</h3>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <EdgeList t={L} edges={preview.edges.left} />
              <EdgeList t={R} edges={preview.edges.right} />
            </div>
            <div className="mt-5 rounded-xl border-l-4 border-gold bg-gold-light px-3.5 py-3">
              <p className="text-sm font-bold text-amber-800">What&apos;s at stake</p>
              {preview.stakes.map((s) => (
                <p key={s} className="mt-0.5 text-sm leading-snug text-slate-700">
                  {s}
                </p>
              ))}
            </div>
          </Card>
          <MatchupSeries leftId={L.id} rightId={R.id} />
          <TaleOfTheTape L={L} R={R} matchup={matchup} />
        </div>
        <div className="grid content-start gap-5">
          <Card title="Weekly scoring" action={String(LEAGUE.season)}>
            <TrailLegend focus={L} compare={R} />
            <ScoreTrail focus={L} compare={R} focusProj={matchup.left.projected} compareProj={matchup.right.projected} />
            {[L, R].map((t) => (
              <div key={t.id} className="mt-3">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <TeamAvatar teamId={t.id} size="sm" className="size-5 text-[8px]" /> {t.name}
                </p>
                <WeekStrip weeks={t.weekly} />
              </div>
            ))}
          </Card>
          <TeamCard t={L} />
          <TeamCard t={R} />
        </div>
      </div>

      <InjuryReport L={L} R={R} />
      <Card title="Starting lineups" action={`${L.roster.starters.length} starters`} bodyClassName="px-0 pb-1 sm:px-0">
        <Lineups L={L} R={R} />
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {[L, R].map((t) => (
          <Card key={t.id} title={<span className="normal-case">Bench & IR</span>} action={t.abbrev} accent={t.color}>
            <p className="-mt-1 mb-2 truncate text-sm font-semibold text-slate-600">{t.name}</p>
            <BenchList players={[...t.roster.bench, ...t.roster.ir]} />
          </Card>
        ))}
      </div>
    </>
  );
}

function Scorecard({ matchup, L, R }: { matchup: Matchup; L: Team; R: Team }) {
  const lp = matchup.left.projected;
  const rp = matchup.right.projected;
  const hasProj = lp != null && rp != null;
  const margin = hasProj ? lp - rp : 0;
  const share = hasProj ? (lp / (lp + rp)) * 100 : 50;
  const fav = margin >= 0 ? L : R;
  return (
    <section className="overflow-hidden rounded-2xl bg-navy yard-lines text-white shadow-lg shadow-navy/15">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 sm:px-5">
        <span className="tracking-wider uppercase">Week {matchup.week} matchup</span>
        {hasProj && <span className="rounded-full bg-white/10 px-2 py-0.5 tracking-wide uppercase">Projected</span>}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 px-4 pt-4 sm:px-5">
        <ScoreSide t={L} projected={lp} leading={margin >= 0} home={matchup.homeId === L.id} />
        <span className="pt-16 font-display text-sm font-bold text-white/40 uppercase">vs</span>
        <ScoreSide t={R} projected={rp} leading={margin < 0} home={matchup.homeId === R.id} align="right" />
      </div>
      {hasProj && (
        <div className="px-4 pt-4 pb-4 sm:px-5">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Projected share: ${share.toFixed(0)}% to ${(100 - share).toFixed(0)}%`}>
            <span style={{ width: `${share}%`, background: L.color }} />
            <span className="w-0.5 bg-navy" />
            <span className="flex-1" style={{ background: R.color }} />
          </div>
          <p className="mt-2 text-center text-sm text-white/80">
            <span className="font-semibold text-white">{fav.name}</span> projected to win by{" "}
            <span className="font-display text-base font-bold text-gold tabular-nums">{Math.abs(margin).toFixed(1)}</span>
          </p>
        </div>
      )}
    </section>
  );
}

function ScoreSide({ t, projected, leading, home, align = "left" }: { t: Team; projected?: number; leading: boolean; home: boolean; align?: "left" | "right" }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", align === "right" ? "items-end text-right" : "items-start")}>
      <TeamAvatar teamId={t.id} size="lg" className="ring-2 ring-white/20" />
      <div className="min-w-0">
        <Link href={teamPath(t.id)} className="text-[15px] leading-tight font-semibold break-words hover:underline">
          {t.name}
        </Link>
        <p className="text-xs text-white/60">
          {formatRecord(t)} · {ordinal(t.rank)} · {home ? "Home" : "Away"}
        </p>
      </div>
      <p className={cn("font-display text-5xl leading-none font-extrabold tabular-nums sm:text-6xl", leading ? "text-white" : "text-white/55")}>
        {projected != null ? projected.toFixed(1) : "—"}
      </p>
    </div>
  );
}

function EdgeList({ t, edges }: { t: Team; edges: Edge[] }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm font-semibold text-navy">
        <TeamAvatar teamId={t.id} size="sm" />
        <span className="min-w-0 break-words">{t.name}</span>
      </p>
      {edges.length ? (
        <ul className="mt-2 grid gap-1.5">
          {edges.map((e) => (
            <li key={e.label} className="text-sm leading-snug text-slate-700">
              <span className="font-semibold text-turf-dark">{e.label}: </span>
              {e.detail}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No statistical edge this week.</p>
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
    <Card title="Tale of the tape" action={`Weeks 1–${LEAGUE.week - 1}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <TeamAvatar teamId={L.id} size="sm" />
        <TeamAvatar teamId={R.id} size="sm" />
      </div>
      <dl className="divide-y divide-line">
        {rows.map((r) => {
          const w = winner(r);
          return (
            <div key={r.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 py-2">
              <dd className={cn("font-display text-lg font-bold tabular-nums", w === "l" ? "text-turf" : "text-navy", w === "r" && "text-slate-400")}>{show(r, r.l)}</dd>
              <dt className="text-center text-xs font-medium text-slate-500">{r.label}</dt>
              <dd className={cn("text-right font-display text-lg font-bold tabular-nums", w === "r" ? "text-turf" : "text-navy", w === "l" && "text-slate-400")}>
                {show(r, r.r)}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-2 text-xs text-slate-500">Green marks the better side where higher or lower is clearly better. All-play: record if you played every team every week.</p>
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
          <Link href={teamPath(t.id)} className="font-semibold break-words text-navy hover:underline">
            {t.name}
          </Link>
          <p className="text-xs text-slate-500">
            {[t.owner, `${formatRecord(t)} · ${ordinal(t.rank)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <MiniTrail team={t} className="hidden min-[380px]:block" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Titles" value={h.titles} sub={h.titleYears.join(", ") || "—"} valueClassName={h.titles ? "text-gold" : undefined} />
        <Stat label="Finals" value={h.finalsYears.length} sub={h.finalsYears.join(", ") || "—"} />
        {h.allTime && <Stat label="2020–25" value={formatRecord(h.allTime)} sub="Regular season" />}
      </div>
      <Link href={teamPath(t.id)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-turf hover:underline">
        {h.titles > 0 && <Trophy className="size-3.5 text-gold" />}
        Team page, roster & history →
      </Link>
    </Card>
  );
}

function InjuryReport({ L, R }: { L: Team; R: Team }) {
  const list = [L, R].flatMap((t) => t.roster.starters.filter(isFlagged).map((p) => ({ p, t })));
  if (list.length === 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-loss" />
      <div className="min-w-0 text-sm leading-snug">
        <p className="font-bold text-red-800">Injury report · starters</p>
        <p className="mt-0.5 text-slate-700">
          {list.map(({ p, t }, i) => (
            <span key={`${t.id}-${p.name}`}>
              {i > 0 && " · "}
              {p.name} <span className="font-semibold text-loss">({p.status === "Questionable" ? "Q" : p.status})</span>{" "}
              <span className="text-slate-500">{t.abbrev}</span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function Lineups({ L, R }: { L: Team; R: Team }) {
  const rows = Math.max(L.roster.starters.length, R.roster.starters.length);
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] gap-2 border-b border-line bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 sm:px-5">
        <span className="truncate">{L.name}</span>
        <span className="text-center">Pos</span>
        <span className="truncate text-right">{R.name}</span>
      </div>
      <ol>
        {Array.from({ length: rows }, (_, i) => {
          const mine = L.roster.starters[i];
          const theirs = R.roster.starters[i];
          return (
            <li key={i} className="grid min-h-14 grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] items-center gap-2 border-b border-line px-4 py-2 last:border-0 sm:px-5">
              <PlayerCell player={mine} />
              <SlotChip slot={mine?.slot ?? theirs?.slot ?? "—"} className="justify-self-center" />
              <PlayerCell player={theirs} align="right" />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function PlayerCell({ player, align = "left" }: { player?: Player; align?: "left" | "right" }) {
  if (!player) return <span className="text-slate-300">—</span>;
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="text-[15px] leading-tight font-semibold break-words text-navy">{player.name}</p>
      {(player.nflTeam || isFlagged(player)) && (
        <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs text-slate-500", align === "right" && "justify-end")}>
          {player.nflTeam && (
            <span>
              {player.slot === "FLEX" ? `${player.position} · ` : ""}
              {player.nflTeam}
            </span>
          )}
          <StatusChip status={player.status} />
        </p>
      )}
    </div>
  );
}

export function BenchList({ players }: { players: Player[] }) {
  if (players.length === 0) return <p className="py-3 text-center text-sm text-slate-500">Nobody on the bench.</p>;
  return (
    <ul className="divide-y divide-line">
      {players.map((p) => (
        <li key={p.name} className="flex min-h-12 items-center gap-3 py-2">
          <SlotChip slot={p.slot === "Bench" ? p.position : p.slot} className={p.slot === "Bench" ? "opacity-80" : undefined} />
          <span className="min-w-0 flex-1 text-[15px] leading-tight font-medium break-words text-slate-700">{p.name}</span>
          {p.nflTeam && <span className="text-xs text-slate-500">{p.nflTeam}</span>}
          <StatusChip status={p.status} />
        </li>
      ))}
    </ul>
  );
}
