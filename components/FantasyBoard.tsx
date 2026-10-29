"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize, Minimize, Newspaper, PlugZap, RefreshCw, TriangleAlert, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ConnectedPayload,
  DisconnectedPayload,
  FantasyPayload,
  Headline,
  LineupSlot,
  RosterPlayer,
  TeamSummary,
} from "@/lib/types";

const POLL_MS = 30_000;
const STARTER_SLOTS: LineupSlot[] = ["QB", "RB", "WR", "TE", "FLEX", "D/ST", "K"];

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: FantasyPayload; stale: boolean };

export function FantasyBoard() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/fantasy${window.location.search}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const data = (await res.json()) as FantasyPayload;
      setState({ kind: "ready", data, stale: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => (prev.kind === "ready" ? { ...prev, stale: true } : { kind: "error", message }));
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  if (state.kind === "loading") return <BoardSkeleton />;
  if (state.kind === "error") return <ErrorState message={state.message} onRetry={load} />;
  if (state.data.status === "disconnected") return <DisconnectedState data={state.data} onRetry={load} />;
  return <ConnectedBoard data={state.data} stale={state.stale} />;
}

/* ---------- shell ---------- */

function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        "relative flex min-h-dvh w-full flex-col gap-4 overflow-x-hidden p-4 sm:p-6 lg:h-dvh lg:gap-5 lg:overflow-hidden lg:p-8 tv:gap-7 tv:p-12",
        "bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.12),transparent_50%)]",
        className,
      )}
    >
      {children}
    </main>
  );
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

function useFullscreen() {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);
  return { isFull, toggle };
}

function TopBar({
  league,
  week,
  source,
  updatedAt,
  stale,
}: {
  league: string;
  week: number | null;
  source: FantasyPayload["source"];
  updatedAt: string;
  stale: boolean;
}) {
  const now = useClock();
  const { isFull, toggle } = useFullscreen();
  const ago = now ? Math.max(0, Math.round((now.getTime() - new Date(updatedAt).getTime()) / 1000)) : null;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30 tv:size-12">
          <Tv className="size-5 tv:size-7" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold uppercase tracking-[0.18em] text-zinc-300 tv:text-2xl">
            {league}
          </p>
          {week != null && (
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 tv:text-sm">Week {week}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 tv:gap-5">
        <SourceBadge source={source} stale={stale} />
        <div className="hidden text-right sm:block">
          <p className="font-display text-2xl font-semibold tabular-nums text-zinc-100 tv:text-4xl" suppressHydrationWarning>
            {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}
          </p>
          <p className="text-[11px] uppercase tracking-widest text-zinc-500 tv:text-xs">
            {ago == null ? "Syncing" : ago < 5 ? "Updated just now" : `Updated ${formatAgo(ago)} ago`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={isFull ? "Exit full screen" : "Enter full screen"}
          className="text-zinc-400 hover:text-zinc-100"
        >
          {isFull ? <Minimize /> : <Maximize />}
        </Button>
      </div>
    </header>
  );
}

function SourceBadge({ source, stale }: { source: FantasyPayload["source"]; stale: boolean }) {
  if (stale) {
    return (
      <Badge className="h-7 gap-1.5 bg-amber-500/15 px-3 text-amber-300 ring-1 ring-amber-400/30">
        <TriangleAlert /> Reconnecting
      </Badge>
    );
  }
  const live = source === "espn";
  return (
    <Badge
      className={cn(
        "h-7 gap-2 px-3 font-semibold uppercase tracking-widest ring-1 tv:h-9 tv:text-sm",
        live ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" : "bg-sky-500/15 text-sky-300 ring-sky-400/30",
      )}
    >
      <span className={cn("size-2 rounded-full", live ? "animate-pulse bg-emerald-400" : "bg-sky-400")} />
      {live ? "ESPN Live" : "Demo Data"}
    </Badge>
  );
}

/* ---------- connected board ---------- */

function ConnectedBoard({ data, stale }: { data: ConnectedPayload; stale: boolean }) {
  const starters = useMemo(
    () =>
      data.roster
        .filter((p) => STARTER_SLOTS.includes(p.slot))
        .sort((a, b) => STARTER_SLOTS.indexOf(a.slot) - STARTER_SLOTS.indexOf(b.slot)),
    [data.roster],
  );
  const bench = useMemo(() => data.roster.filter((p) => p.slot === "BN" || p.slot === "IR"), [data.roster]);

  return (
    <Shell>
      <TopBar
        league={data.league.name}
        week={data.matchup?.week ?? data.league.week}
        source={data.source}
        updatedAt={data.updatedAt}
        stale={stale}
      />

      {data.notice && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-200 ring-1 ring-amber-400/20">
          <TriangleAlert className="size-4 shrink-0" /> {data.notice}
        </div>
      )}

      <Hero team={data.team} teamCount={data.league.teamCount} matchup={data.matchup} />

      <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-5 tv:gap-7">
        <Panel title="Starting Lineup" meta={`${starters.length} starters`} className="min-h-0">
          <ol className="grid min-h-0 flex-1 auto-rows-fr gap-1.5 tv:gap-2.5">
            {starters.map((p) => (
              <StarterRow key={p.id} player={p} />
            ))}
            {starters.length === 0 && <EmptyNote>No starters set for this week.</EmptyNote>}
          </ol>
        </Panel>

        <div className="flex min-h-0 flex-col gap-4 lg:gap-5 tv:gap-7">
          <Panel title="Headlines" icon={<Newspaper className="size-4 tv:size-5" />} className="min-h-0 lg:flex-[1.2]">
            <HeadlineList headlines={data.headlines} />
          </Panel>
          <Panel title="Bench" meta={`${bench.length} players`} className="min-h-0 lg:flex-1">
            <ul className="grid min-h-0 flex-1 content-start gap-1 overflow-hidden">
              {bench.map((p) => (
                <BenchRow key={p.id} player={p} />
              ))}
              {bench.length === 0 && <EmptyNote>Bench is empty.</EmptyNote>}
            </ul>
          </Panel>
        </div>
      </section>

      <Ticker headlines={data.headlines} />
    </Shell>
  );
}

function Hero({
  team,
  teamCount,
  matchup,
}: {
  team: TeamSummary;
  teamCount: number;
  matchup: ConnectedPayload["matchup"];
}) {
  const opp = matchup?.opponent;
  const leading = opp ? team.points >= opp.points : true;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-5 tv:gap-7">
      <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 via-zinc-900/60 to-zinc-900/30 p-5 ring-1 ring-white/10 lg:p-5 tv:p-9">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300/80 tv:text-base">Your team</p>
        <h1 className="mt-1 font-display text-5xl leading-[0.9] font-extrabold uppercase tracking-tight text-white sm:text-6xl lg:text-[clamp(3rem,4.2vw,9rem)]">
          {team.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-2">
          <Stat label="Record" value={formatRecord(team.record)} />
          {team.standing != null && (
            <Stat label="Standing" value={`${ordinal(team.standing)}${teamCount ? ` / ${teamCount}` : ""}`} />
          )}
          <Stat label="Projected" value={team.projected.toFixed(1)} />
        </div>
      </div>

      <div className="flex flex-col justify-center rounded-2xl bg-zinc-900/60 p-5 ring-1 ring-white/10 lg:p-5 tv:p-9">
        {opp ? (
          <>
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-zinc-500 tv:text-base">
              <span>Week {matchup.week} matchup</span>
              <span className={leading ? "text-emerald-400" : "text-rose-400"}>{leading ? "Leading" : "Trailing"}</span>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 tv:gap-6">
              <ScoreSide team={team} winning={leading} align="left" />
              <span className="font-display text-2xl font-semibold text-zinc-600 tv:text-4xl">vs</span>
              <ScoreSide team={opp} winning={!leading} align="right" />
            </div>
            {matchup.winProbability != null && <WinBar mine={matchup.winProbability} />}
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="font-display text-3xl font-bold uppercase text-zinc-300">No matchup this week</p>
            <p className="mt-1 text-sm text-zinc-500">Bye week or the schedule hasn&apos;t been published yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ScoreSide({ team, winning, align }: { team: TeamSummary; winning: boolean; align: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <p className="truncate font-display text-lg font-semibold uppercase tracking-wide text-zinc-300 sm:text-xl tv:text-3xl">
        {team.name}
      </p>
      <p className="text-xs text-zinc-500 tv:text-base">{formatRecord(team.record)}</p>
      <p
        className={cn(
          "mt-1 font-display text-6xl leading-none font-extrabold tabular-nums sm:text-7xl lg:text-[clamp(3.25rem,4.4vw,10rem)]",
          winning ? "text-white" : "text-zinc-500",
        )}
      >
        {team.points.toFixed(1)}
      </p>
      <p className="mt-1 text-sm tabular-nums text-zinc-400 tv:text-xl">Proj {team.projected.toFixed(1)}</p>
    </div>
  );
}

function WinBar({ mine }: { mine: number }) {
  const pct = Math.round(mine * 100);
  return (
    <div className="mt-3 tv:mt-6">
      <div className="mb-1.5 flex justify-between text-xs font-medium uppercase tracking-widest tv:text-sm">
        <span className="text-emerald-300">Win {pct}%</span>
        <span className="text-zinc-500">{100 - pct}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800 tv:h-4" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Win probability">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 tv:text-sm">{label}</p>
      <p className="font-display text-3xl font-bold tabular-nums text-zinc-100 lg:text-[clamp(1.75rem,1.9vw,4rem)]">{value}</p>
    </div>
  );
}

function Panel({
  title,
  meta,
  icon,
  className,
  children,
}: {
  title: string;
  meta?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col rounded-2xl bg-zinc-900/50 p-4 ring-1 ring-white/10 tv:p-6", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-[0.2em] text-zinc-300 tv:text-2xl">
          {icon}
          {title}
        </h2>
        {meta && <span className="text-xs uppercase tracking-widest text-zinc-500 tv:text-sm">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

const SLOT_STYLES: { [slot in LineupSlot]: string } = {
  QB: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  RB: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  WR: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  TE: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  FLEX: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  K: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/30",
  "D/ST": "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  BN: "bg-zinc-700/40 text-zinc-400 ring-zinc-600/40",
  IR: "bg-red-900/40 text-red-300 ring-red-500/30",
};

function StarterRow({ player }: { player: RosterPlayer }) {
  const beating = player.points != null && player.points >= player.projected;
  return (
    <li className="grid min-h-11 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl bg-white/[0.03] px-3 py-1 ring-1 ring-white/5 sm:grid-cols-[4rem_minmax(0,1fr)_9rem_auto] tv:grid-cols-[5.5rem_minmax(0,1fr)_13rem_auto] tv:gap-5 tv:px-5">
      <span
        className={cn(
          "flex h-8 items-center justify-center rounded-md font-display text-base font-bold ring-1 tv:h-11 tv:text-2xl",
          SLOT_STYLES[player.slot],
        )}
      >
        {player.slot}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-display text-xl leading-tight font-semibold text-zinc-50 lg:text-[clamp(1.1rem,1.2vw,2.6rem)]">
          <span className="truncate">{player.name}</span>
          {player.injury && <InjuryTag status={player.injury} />}
        </p>
        <p className="truncate text-xs text-zinc-500 tv:text-base">
          {player.position} · {player.nflTeam}
          {player.opponent && ` ${player.opponent}`}
          <span className="sm:hidden"> · {player.gameLabel}</span>
        </p>
      </div>
      <GameStatus player={player} className="hidden sm:flex" />
      <div className="text-right">
        <p
          className={cn(
            "font-display text-3xl leading-none font-bold tabular-nums lg:text-[clamp(1.5rem,1.75vw,3.8rem)]",
            player.points == null ? "text-zinc-600" : beating ? "text-emerald-300" : "text-zinc-50",
          )}
        >
          {player.points == null ? "—" : player.points.toFixed(1)}
        </p>
        <p className="text-[11px] tabular-nums text-zinc-500 tv:text-sm">proj {player.projected.toFixed(1)}</p>
      </div>
    </li>
  );
}

function GameStatus({ player, className }: { player: RosterPlayer; className?: string }) {
  const tone =
    player.gameState === "live"
      ? "text-emerald-300"
      : player.gameState === "final"
        ? "text-zinc-400"
        : player.gameState === "bye"
          ? "text-zinc-600"
          : "text-sky-300";
  return (
    <span className={cn("items-center gap-2 text-sm font-medium uppercase tracking-wider tv:text-lg", tone, className)}>
      {player.gameState === "live" && <span className="size-2 animate-pulse rounded-full bg-emerald-400 tv:size-3" />}
      <span className="truncate">{player.gameLabel}</span>
    </span>
  );
}

function InjuryTag({ status }: { status: string }) {
  return (
    <span className="shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-400/30 tv:text-xs">
      {status}
    </span>
  );
}

function BenchRow({ player }: { player: RosterPlayer }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-1 odd:bg-white/[0.02] tv:py-3">
      <span className={cn("w-11 shrink-0 rounded text-center font-display text-sm font-bold ring-1 tv:w-14 tv:text-lg", SLOT_STYLES[player.slot])}>
        {player.slot}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-200 tv:text-3xl">
        {player.name}
        <span className="text-zinc-500">
          {" "}
          · {player.position} {player.nflTeam}
        </span>
      </span>
      {player.injury && <InjuryTag status={player.injury} />}
      <span className="w-12 shrink-0 text-right font-display text-lg font-semibold tabular-nums text-zinc-400 tv:w-16 tv:text-2xl">
        {player.points == null ? player.gameLabel === "BYE" ? "BYE" : "—" : player.points.toFixed(1)}
      </span>
    </li>
  );
}

function HeadlineList({ headlines }: { headlines: Headline[] }) {
  if (headlines.length === 0) return <EmptyNote>No headlines right now.</EmptyNote>;
  return (
    <ul className="flex min-h-0 flex-1 flex-col divide-y divide-white/5 overflow-hidden">
      {headlines.slice(0, 5).map((h) => (
        <li key={h.id} className="py-1.5 first:pt-0 tv:py-5">
          <div className="mb-0.5 flex items-center gap-2 text-[11px] uppercase tracking-widest text-zinc-500 tv:text-lg">
            {h.tag && <span className="font-semibold text-emerald-400">{h.tag}</span>}
            <span>{h.source}</span>
            <span suppressHydrationWarning>· {relativeTime(h.publishedAt)}</span>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-zinc-100 tv:text-3xl">{h.title}</p>
        </li>
      ))}
    </ul>
  );
}

function Ticker({ headlines }: { headlines: Headline[] }) {
  if (headlines.length === 0) return null;
  const items = [...headlines, ...headlines];
  return (
    <footer className="relative hidden overflow-hidden rounded-xl bg-zinc-900/70 py-2.5 ring-1 ring-white/10 lg:block tv:py-4">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center bg-emerald-500 px-4 font-display text-sm font-bold uppercase tracking-[0.2em] text-zinc-950 tv:text-xl">
        Wire
      </div>
      <div className="flex w-max animate-ticker gap-12 pl-28 whitespace-nowrap">
        {items.map((h, i) => (
          <span key={`${h.id}-${i}`} className="text-sm text-zinc-300 tv:text-3xl" aria-hidden={i >= headlines.length}>
            <span className="mr-3 text-emerald-400">●</span>
            {h.title}
          </span>
        ))}
      </div>
    </footer>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm text-zinc-500">{children}</p>;
}

/* ---------- other states ---------- */

function DisconnectedState({ data, onRetry }: { data: DisconnectedPayload; onRetry: () => void }) {
  return (
    <Shell>
      <TopBar league="Fantasy Board" week={null} source={data.source} updatedAt={data.updatedAt} stale={false} />
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-3xl rounded-3xl bg-zinc-900/60 p-8 text-center ring-1 ring-white/10 sm:p-12 tv:max-w-5xl tv:p-16">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 tv:size-24">
            <PlugZap className="size-8 tv:size-12" />
          </div>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.3em] text-zinc-500 tv:text-base">{data.teamName}</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase tracking-tight text-white sm:text-6xl tv:text-8xl">
            Connect Flaim
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 tv:max-w-3xl tv:text-2xl">{data.reason}</p>
          <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left text-sm text-zinc-300 sm:grid-cols-3 tv:max-w-3xl tv:text-lg">
            {["Open Flaim and sign in", "Link your ESPN, Yahoo, or Sleeper league", "Point this board at your league"].map(
              (step, i) => (
                <li key={step} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
                  <span className="font-display text-2xl font-bold text-emerald-400">{i + 1}</span>
                  <p className="mt-1">{step}</p>
                </li>
              ),
            )}
          </ol>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://flaim.app/leagues"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-lg bg-emerald-500 px-5 font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Open Flaim
            </a>
            <Button variant="outline" onClick={onRetry} className="h-10 px-4">
              <RefreshCw /> Check again
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Shell className="items-center justify-center">
      <div className="max-w-md text-center">
        <TriangleAlert className="mx-auto size-12 text-amber-400" />
        <h1 className="mt-4 font-display text-4xl font-bold uppercase text-white">Board offline</h1>
        <p className="mt-2 text-zinc-400">
          Couldn&apos;t reach the fantasy feed ({message}). The board retries every {POLL_MS / 1000} seconds.
        </p>
        <Button onClick={onRetry} className="mt-6 h-10 px-4">
          <RefreshCw /> Retry now
        </Button>
      </div>
    </Shell>
  );
}

function BoardSkeleton() {
  return (
    <Shell>
      <div className="h-10 w-72 animate-pulse rounded-lg bg-zinc-800/60" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-800/50 tv:h-72" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-800/50 tv:h-72" />
      </div>
      <div className="grid flex-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="min-h-80 animate-pulse rounded-2xl bg-zinc-800/40" />
        <div className="min-h-80 animate-pulse rounded-2xl bg-zinc-800/40" />
      </div>
      <span className="sr-only">Loading fantasy board…</span>
    </Shell>
  );
}

/* ---------- helpers ---------- */

function formatRecord(r: TeamSummary["record"]) {
  return r.ties ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatAgo(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function relativeTime(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
