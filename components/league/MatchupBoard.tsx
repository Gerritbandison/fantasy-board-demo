import { Activity, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFlagged, ordinal, snapshot, type Board, type MatchupSide, type SnapshotPlayer } from "@/lib/league";
import { Chip, Panel, SlotChip, StatusChip } from "./bits";
import { TvModeButton } from "./TvModeButton";

export function MatchupBoard({ board }: { board: Board }) {
  const { focus, opponent, config } = board;
  const flagged = focus.starters.filter(isFlagged);
  const bench = focus.bench ?? [];

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/90 tv:text-base">
            {config.manager}&apos;s board · Week {snapshot.league.week}
          </p>
          <h1 className="mt-1 font-display text-4xl leading-[0.95] font-extrabold uppercase tracking-tight break-words text-white sm:text-5xl lg:text-6xl tv:text-9xl">
            {focus.teamName}
          </h1>
          {board.focusStanding && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip className="text-emerald-300 ring-emerald-400/30">{focus.record}</Chip>
              <Chip>Seed {board.focusStanding.playoffSeed}</Chip>
              <Chip>PA {board.focusStanding.pointsAgainst.toFixed(1)}</Chip>
            </div>
          )}
        </div>
        <TvModeButton />
      </div>

      <Scoreboard focus={focus} opponent={opponent} />

      {flagged.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100 ring-1 ring-amber-400/20 tv:text-2xl">
          <ShieldAlert className="size-4 shrink-0 text-amber-300 tv:size-7" />
          <span className="font-semibold">
            {flagged.length} starter{flagged.length === 1 ? "" : "s"} on the injury report:
          </span>
          <span className="text-amber-200/80">{flagged.map((p) => p.name).join(", ")}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-5 tv:gap-8">
        <Panel title="Starters" meta="Head to head" icon={<Activity className="size-4 text-emerald-400 tv:size-7" />}>
          <HeadToHead focus={focus} opponent={opponent} />
        </Panel>

        <Panel title="Bench" meta={`${bench.length} players`}>
          {bench.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">No bench in this snapshot.</p>
          ) : (
            <ul className="grid gap-1.5 tv:gap-3">
              {bench.map((p) => (
                <BenchRow key={p.name} player={p} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Scoreboard({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const total = focus.projected + opponent.projected;
  const share = total > 0 ? (focus.projected / total) * 100 : 50;
  const edge = focus.projected - opponent.projected;
  const favored = edge >= 0 ? focus : opponent;

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/15 via-zinc-900/70 to-zinc-900/40 p-4 ring-1 ring-white/10 sm:p-6 tv:p-12">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] tv:text-xl">
        <span className="text-zinc-400">Projected · Week {snapshot.league.week}</span>
        <span className={edge >= 0 ? "text-emerald-300" : "text-rose-300"}>
          {favored.teamName} by {Math.abs(edge).toFixed(1)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-6 tv:mt-8">
        <ScoreSide side={focus} leading={edge >= 0} />
        <span className="pt-8 font-display text-lg font-semibold text-zinc-600 sm:pt-10 sm:text-2xl tv:pt-20 tv:text-5xl">vs</span>
        <ScoreSide side={opponent} leading={edge < 0} align="right" />
      </div>

      <div className="mt-5 tv:mt-10">
        <div
          className="flex h-3 overflow-hidden rounded-full bg-zinc-800 tv:h-5"
          role="img"
          aria-label={`Projection share: ${focus.teamName} ${share.toFixed(0)}%, ${opponent.teamName} ${(100 - share).toFixed(0)}%`}
        >
          <div className="h-full bg-gradient-to-r from-emerald-500 to-lime-400" style={{ width: `${share}%` }} />
          <div className="h-full flex-1 bg-gradient-to-r from-sky-600/70 to-sky-400/70" />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] font-semibold uppercase tracking-widest tv:text-lg">
          <span className="text-emerald-300">{share.toFixed(0)}% of proj.</span>
          <span className="text-sky-300">{(100 - share).toFixed(0)}%</span>
        </div>
      </div>
    </section>
  );
}

function ScoreSide({ side, leading, align = "left" }: { side: MatchupSide; leading: boolean; align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="font-display text-lg leading-tight font-bold uppercase tracking-wide break-words text-zinc-200 sm:text-2xl tv:text-5xl">
        {side.teamName}
      </p>
      <p className="mt-0.5 text-xs text-zinc-400 tv:text-xl">
        {side.record} · {ordinal(side.rank)}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-5xl leading-none font-extrabold tabular-nums sm:text-7xl tv:text-[10rem]",
          leading ? "text-white" : "text-zinc-500",
        )}
      >
        {side.projected.toFixed(1)}
      </p>
      <p className="mt-1 text-[11px] tabular-nums uppercase tracking-widest text-zinc-500 tv:text-lg">
        Season PF {side.pointsFor.toFixed(1)}
      </p>
    </div>
  );
}

function HeadToHead({ focus, opponent }: { focus: MatchupSide; opponent: MatchupSide }) {
  const rows = Math.max(focus.starters.length, opponent.starters.length);
  return (
    <div>
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] tv:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] tv:text-base">
        <span className="truncate text-emerald-300">{focus.teamName}</span>
        <span />
        <span className="truncate text-right text-sky-300">{opponent.teamName}</span>
      </div>
      <ol className="grid gap-1.5 tv:gap-3">
        {Array.from({ length: rows }, (_, i) => {
          const mine = focus.starters[i];
          const theirs = opponent.starters[i];
          return (
            <li
              key={i}
              className="grid min-h-14 grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2 rounded-xl bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/5 tv:min-h-24 tv:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] tv:px-6"
            >
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
  if (!player) return <span className="text-zinc-600">—</span>;
  const meta = [player.team].filter(Boolean).join(" · ");
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className={cn("text-[15px] leading-tight font-semibold break-words sm:text-base tv:text-3xl", muted ? "text-zinc-300" : "text-zinc-50")}>
        {player.name}
      </p>
      {(meta || isFlagged(player)) && (
        <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 tv:text-lg", align === "right" && "justify-end")}>
          {meta && <span>{meta}</span>}
          <StatusChip status={player.status} />
        </p>
      )}
    </div>
  );
}

function BenchRow({ player }: { player: SnapshotPlayer }) {
  return (
    <li className="flex min-h-12 items-center gap-3 rounded-xl bg-white/[0.02] px-2.5 py-2 ring-1 ring-white/5 tv:min-h-20 tv:px-5">
      <SlotChip slot={player.slot} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-tight font-medium break-words text-zinc-200 tv:text-3xl">{player.name}</span>
        {player.team && <span className="text-xs text-zinc-500 tv:text-lg">{player.team}</span>}
      </span>
      <StatusChip status={player.status} />
    </li>
  );
}