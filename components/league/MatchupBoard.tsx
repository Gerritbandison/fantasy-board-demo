import Link from "next/link";
import { cn } from "@/lib/utils";
import { isFlagged, ordinal, snapshot, type Board, type MatchupSide, type SnapshotPlayer } from "@/lib/league";
import {
  callsign,
  getBrief,
  getFranchise,
  getLuck,
  splitMustWin,
  teamIdByName,
  trailStats,
  weekCode,
  type Franchise,
} from "@/lib/intel";
import { SlotChip, StatusChip } from "./bits";
import { Frame, LuckChip, PageHead, Readout, Rule, Tag } from "./hud";
import { ScoreTrail, WeekStrip } from "./trail";
import { TvModeButton } from "./TvModeButton";

export function MatchupBoard({ board }: { board: Board }) {
  const { focus, opponent, config } = board;
  const brief = getBrief(config.slug);
  const focusF = getFranchise(focus.teamId);
  const oppF = getFranchise(opponent.teamId);
  const luck = getLuck(focus.teamId);
  const fc = callsign(focus.teamId);
  const oc = callsign(opponent.teamId);
  const wk = weekCode(snapshot.league.week);

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <PageHead code={`OP-${wk} // ${fc} v ${oc} · ${focusF?.ownerLabel ?? config.manager}`} title={focus.teamName}>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="phos">{focus.record}</Tag>
            {board.focusStanding && <Tag>Seed {board.focusStanding.playoffSeed}</Tag>}
            <Tag>PF {focus.pointsFor.toFixed(1)}</Tag>
            {luck && <LuckChip row={luck} withRanks />}
          </div>
        </PageHead>
        <TvModeButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-5">
        <div className="grid content-start gap-4 lg:gap-5">
          {brief && <BriefFrame brief={brief} focus={focus} fc={fc} oc={oc} />}
          {(focusF || oppF) && <Dossier focus={focusF} opponent={oppF} className="hidden lg:grid" />}
        </div>
        <div className="grid content-start gap-4 lg:gap-5">
          <ProjectionReadout focus={focus} opponent={opponent} focusF={focusF} oppF={oppF} fc={fc} oc={oc} />
          {focusF && <TrailFrame focus={focusF} opponent={oppF} focusSide={focus} opponentSide={opponent} />}
        </div>
      </div>

      {(focusF || oppF) && <Dossier focus={focusF} opponent={oppF} className="lg:hidden" />}

      <Rule label="Lineup // head to head" right={`${focus.starters.length} slots`} />
      <FlagStrip focus={focus} opponent={opponent} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-5">
        <Frame label="Starters" code="LNP" meta={`${fc} · ${oc}`} tone="dim" bodyClassName="p-0 sm:p-0">
          <HeadToHead focus={focus} opponent={opponent} />
        </Frame>
        <Frame label="Bench / IR" code="BNC" meta={`${focus.bench?.length ?? 0} on file`} tone="dim">
          <BenchList players={focus.bench ?? []} />
        </Frame>
      </div>
    </>
  );
}

function BriefFrame({
  brief,
  focus,
  fc,
  oc,
}: {
  brief: NonNullable<ReturnType<typeof getBrief>>;
  focus: MatchupSide;
  fc: string;
  oc: string;
}) {
  const must = splitMustWin(brief.mustWin);
  const mustId = teamIdByName(must.subject);
  const mustIsFocus = mustId === focus.teamId || focus.teamName.startsWith(must.subject);
  return (
    <Frame label="Matchup brief" code={`BRF-${weekCode(brief.week)}`} meta={`${fc} v ${oc}`}>
      <p className="text-[15.5px] leading-relaxed text-zinc-200">{brief.story}</p>

      <div className={cn("mt-4 border-l-2 py-2 pr-2 pl-3", mustIsFocus ? "border-hot bg-hot/[0.06]" : "border-phos bg-phos/[0.05]")}>
        <p className={cn("font-mono text-[10.5px] tracking-[0.2em] uppercase", mustIsFocus ? "text-hot" : "text-phos")}>
          Must-win ▸ {mustIsFocus ? `${fc} (you)` : must.subject}
        </p>
        <p className="mt-1 text-sm leading-snug text-zinc-200">{capitalize(must.detail) || brief.mustWin}</p>
      </div>

      <ul className="mt-4 grid gap-2">
        {brief.edges.map((e) => {
          const id = teamIdByName(e.side);
          const mine = id === focus.teamId;
          return (
            <li key={e.side} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-2.5">
              <Tag tone={mine ? "phos" : "sig"} className="justify-center">
                {id ? callsign(id) : mine ? fc : oc}
              </Tag>
              <p className="pt-0.5 text-sm leading-snug text-zinc-300">
                <span className="font-mono text-[10px] tracking-[0.16em] text-dim uppercase">Edge · </span>
                {e.edge}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t border-dashed border-white/10 pt-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-sig uppercase">Archive note</p>
        <p className="mt-1 text-sm leading-snug text-zinc-400">{brief.historyNote}</p>
      </div>
    </Frame>
  );
}

const GAUGE_SPAN = 30;

function ProjectionReadout({
  focus,
  opponent,
  focusF,
  oppF,
  fc,
  oc,
}: {
  focus: MatchupSide;
  opponent: MatchupSide;
  focusF?: Franchise;
  oppF?: Franchise;
  fc: string;
  oc: string;
}) {
  const margin = focus.projected - opponent.projected;
  const pct = Math.min(1, Math.abs(margin) / GAUGE_SPAN) * 50;
  const fAvg = focusF ? trailStats(focusF).avg : undefined;
  const oAvg = oppF ? trailStats(oppF).avg : undefined;
  const signed = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;

  return (
    <Frame label="Projection" code="PRJ" meta={`Wk ${weekCode(snapshot.league.week)} · pre-lock`}>
      <dl className="grid gap-2">
        {[
          { side: focus, code: fc, tone: "phos" as const, lead: margin >= 0 },
          { side: opponent, code: oc, tone: "sig" as const, lead: margin < 0 },
        ].map(({ side, code, tone, lead }) => (
          <div key={side.teamId} className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-2.5">
            <dt className="contents">
              <Tag tone={tone} className="justify-center">
                {code}
              </Tag>
              <span className="min-w-0">
                <span className="line-clamp-2 block text-sm leading-tight font-medium break-words text-zinc-200">{side.teamName}</span>
                <span className="block font-mono text-[10px] tracking-wider text-faint uppercase">
                  {side.record} · {ordinal(side.rank)}
                  {lead && <span className={tone === "phos" ? "text-phos" : "text-sig"}> · ▲ fav</span>}
                </span>
              </span>
            </dt>
            <dd
              className={cn(
                "font-mono text-[2rem] leading-none font-medium tabular-nums",
                tone === "phos" ? "text-phos glow-phos" : "text-sig glow-sig",
                !lead && "opacity-70",
              )}
            >
              {side.projected.toFixed(2)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4" role="img" aria-label={`Projected margin ${signed(margin)} for ${focus.teamName}`}>
        <div className="flex justify-between font-mono text-[9.5px] tracking-[0.18em] text-faint uppercase">
          <span className="text-phos/80">◀ {fc}</span>
          <span>margin ±{GAUGE_SPAN}</span>
          <span className="text-sig/80">{oc} ▶</span>
        </div>
        <div className="relative mt-1 h-5 border border-white/10 bg-ink">
          {Array.from({ length: 13 }, (_, i) => (
            <span
              key={i}
              className={cn("absolute top-0 w-px bg-white/15", i === 6 ? "h-full bg-white/40" : i % 2 ? "h-1.5" : "h-2.5")}
              style={{ left: `${(i / 12) * 100}%` }}
            />
          ))}
          <span
            className={cn("absolute inset-y-1", margin >= 0 ? "bg-phos/80 shadow-[0_0_10px_var(--color-phos)]" : "bg-sig/80 shadow-[0_0_10px_var(--color-sig)]")}
            style={margin >= 0 ? { right: "50%", width: `${pct}%` } : { left: "50%", width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-3">
        <Readout label="Margin" value={signed(margin)} sub={margin >= 0 ? `${fc} fav` : `${oc} fav`} tone={margin >= 0 ? "phos" : "sig"} />
        {fAvg != null && <Readout label={`${fc} vs avg`} value={signed(focus.projected - fAvg)} sub={`avg ${fAvg.toFixed(1)}`} />}
        {oAvg != null && <Readout label={`${oc} vs avg`} value={signed(opponent.projected - oAvg)} sub={`avg ${oAvg.toFixed(1)}`} />}
      </div>
    </Frame>
  );
}

function TrailFrame({
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
    <Frame label="Score trail" code="TRL" meta="2026 · PF / week">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-wider text-dim uppercase">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-phos" /> {callsign(focus.teamId)}
        </span>
        {opponent && (
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 bg-sig" /> {callsign(opponent.teamId)}
          </span>
        )}
        <span>■ W □ L ◇ proj</span>
      </div>
      <ScoreTrail focus={focus} opponent={opponent} focusProj={focusSide.projected} opponentProj={opponentSide.projected} />
      <WeekStrip weeks={focus.weekly2026} className="mt-2" />
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Readout label="Median" value={s.median.toFixed(1)} />
        <Readout label="Ceiling" value={s.high.pf.toFixed(1)} sub={`W${s.high.week} v ${s.high.opp}`} tone="phos" />
        <Readout label="Floor" value={s.low.pf.toFixed(1)} sub={`W${s.low.week} v ${s.low.opp}`} />
      </div>
    </Frame>
  );
}

function Dossier({ focus, opponent, className }: { focus?: Franchise; opponent?: Franchise; className?: string }) {
  const list = [focus, opponent].filter((f): f is Franchise => Boolean(f));
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5", className)}>
      {list.map((f, i) => (
        <Frame
          key={f.teamId}
          label={i === 0 ? "Franchise dossier" : "Opposition file"}
          code={callsign(f.teamId)}
          meta={f.ownerLabel}
          tone={i === 0 ? "phos" : "sig"}
        >
          <p className="text-sm leading-relaxed text-zinc-300">{f.arc}</p>
          <p className={cn("mt-3 border-l-2 pl-3 text-sm leading-snug text-zinc-200", i === 0 ? "border-phos/60" : "border-sig/60")}>
            {f.signature}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone={f.titles ? "phos" : "dim"}>
              {f.titles} title{f.titles === 1 ? "" : "s"}
            </Tag>
            <Tag>Playoffs {f.playoffAppearancesRecent}</Tag>
            <Link href="/history" className="inline-flex h-6 items-center font-mono text-[10.5px] tracking-[0.12em] text-sig uppercase underline-offset-4 hover:underline">
              Archive ▸
            </Link>
          </div>
        </Frame>
      ))}
    </div>
  );
}

function FlagStrip({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const mine = focus.starters.filter(isFlagged);
  const theirs = opponent.starters.filter(isFlagged);
  if (mine.length + theirs.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border border-phos/25 bg-phos/[0.05] px-3 py-2 font-mono text-[11px] tracking-wide text-phos uppercase">
      <span className="animate-blink">▲</span>
      <span>Status flags</span>
      <span className="normal-case tracking-normal text-zinc-300">
        {[...mine.map((p) => `${p.name} (${p.status})`), ...theirs.map((p) => `${p.name} (${p.status}, opp)`)].join(" · ")}
      </span>
    </div>
  );
}

function HeadToHead({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const rows = Math.max(focus.starters.length, opponent.starters.length);
  return (
    <ol>
      {Array.from({ length: rows }, (_, i) => {
        const mine = focus.starters[i];
        const theirs = opponent.starters[i];
        return (
          <li
            key={i}
            className="grid min-h-13 grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] items-center gap-2 border-b border-white/[0.05] px-3 py-2 last:border-0 odd:bg-white/[0.015] sm:px-4"
          >
            <PlayerCell player={mine} />
            <SlotChip slot={mine?.slot ?? theirs?.slot ?? "—"} className="justify-self-center" />
            <PlayerCell player={theirs} align="right" muted />
          </li>
        );
      })}
    </ol>
  );
}

function PlayerCell({ player, align = "left", muted }: { player?: SnapshotPlayer; align?: "left" | "right"; muted?: boolean }) {
  if (!player) return <span className="font-mono text-faint">—</span>;
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className={cn("text-[14.5px] leading-tight font-medium break-words", muted ? "text-zinc-400" : "text-zinc-50")}>{player.name}</p>
      {(player.team || isFlagged(player)) && (
        <p className={cn("mt-0.5 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-faint", align === "right" && "justify-end")}>
          {player.team && <span>{player.team}</span>}
          <StatusChip status={player.status} />
        </p>
      )}
    </div>
  );
}

function BenchList({ players }: { players: SnapshotPlayer[] }) {
  if (players.length === 0) return <p className="py-3 text-center font-mono text-xs text-faint uppercase">No bench on file</p>;
  return (
    <ul className="grid gap-px bg-white/[0.05]">
      {players.map((p) => (
        <li key={p.name} className="flex min-h-11 items-center gap-3 bg-panel px-1 py-1.5">
          <SlotChip slot={p.slot} />
          <span className="min-w-0 flex-1 text-sm leading-tight break-words text-zinc-300">{p.name}</span>
          {p.team && <span className="font-mono text-[10px] text-faint">{p.team}</span>}
          <StatusChip status={p.status} />
        </li>
      ))}
    </ul>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
