"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { PLAYOFF_MODEL } from "@/lib/playoff-data";
import { SIM_COUNT, focusSchedule, formatPct, simulate, winOutChance, winOutPath, type SimModel } from "@/lib/playoff-sim";
import { cx } from "@/lib/cx";

interface SimTeamInfo {
  id: number;
  name: string;
  abbrev: string;
  color: string;
}

const DEFAULT_PRESETS = PLAYOFF_MODEL.presets ?? [
  { shift: -20, name: "Season" },
  { shift: -5, name: "Since trade" },
  { shift: 0, name: "ESPN" },
  { shift: 7, name: "Weeks 4–7" },
];

const GENERIC_PRESETS = [
  { shift: -15, name: "Cold" },
  { shift: -5, name: "Cautious" },
  { shift: 0, name: "Baseline" },
  { shift: 10, name: "Hot" },
];

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function signed(n: number) {
  const text = Math.abs(n).toFixed(1);
  return n >= 0 ? `+${text}` : `−${text}`;
}

function points(n: number) {
  return n.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

function baseMeanForTeam(model: SimModel, teamId: number) {
  if (teamId === model.focusId) return model.nonByeEspn;
  const t = model.teams.find((row) => row.id === teamId);
  const uncounted = model.games.filter((g) => !g.counted && (g.homeId === teamId || g.awayId === teamId));
  if (!uncounted.length) return model.nonByeEspn;
  const avg = uncounted.reduce((sum, g) => sum + (g.homeId === teamId ? g.homeProj : g.awayProj), 0) / uncounted.length;
  return Math.round((avg + (t?.bias ?? 0)) * 10) / 10;
}

export function PlayoffSimulator({
  teams,
  defaultFocusId,
  currentWeek,
  weekFinal,
}: {
  teams: SimTeamInfo[];
  defaultFocusId: number;
  currentWeek: number;
  weekFinal: boolean;
}) {
  const [focusId, setFocusId] = useState(defaultFocusId);
  const [shift, setShift] = useState(0);
  const [focusPick, setFocusPick] = useState<Record<number, "W" | "L">>({});
  const [forced, setForced] = useState<Record<number, number>>({});

  const byId = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  useEffect(() => {
    const syncFromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get("team");
      if (!raw) return;
      const parsed = Number(raw);
      if (Number.isInteger(parsed) && byId.has(parsed)) {
        setFocusId(parsed);
        setShift(0);
        setFocusPick({});
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [byId]);

  function selectTeam(nextId: number) {
    if (nextId === focusId) return;
    setFocusId(nextId);
    setShift(0);
    setFocusPick({});
    const url = new URL(window.location.href);
    if (nextId === defaultFocusId) url.searchParams.delete("team");
    else url.searchParams.set("team", String(nextId));
    window.history.replaceState(null, "", url.toString());
  }

  const activeModel = useMemo<SimModel>(
    () => ({
      ...PLAYOFF_MODEL,
      focusId,
      nonByeEspn: baseMeanForTeam(PLAYOFF_MODEL, focusId),
    }),
    [focusId],
  );

  const focusName = byId.get(focusId)?.name ?? "Team";
  const name = (id: number) => byId.get(id)?.name ?? "Team";
  const abbrev = (id: number) => byId.get(id)?.abbrev ?? "?";
  const modelTeam = (id: number) => activeModel.teams.find((t) => t.id === id);

  const schedule = useMemo(() => focusSchedule(activeModel, shift), [activeModel, shift]);
  const scenarioForced = useMemo(() => {
    const next: Record<number, number> = { ...forced };
    for (const row of schedule) {
      if (focusPick[row.gameIndex] === "W") next[row.gameIndex] = focusId;
      else if (focusPick[row.gameIndex] === "L") next[row.gameIndex] = row.opponentId;
    }
    return next;
  }, [focusId, focusPick, forced, schedule]);

  const baseline = useMemo(() => simulate(activeModel, { n: SIM_COUNT, seed: 7, shift }), [activeModel, shift]);
  const scenario = useMemo(
    () => simulate(activeModel, { n: SIM_COUNT, seed: 7, shift, forced: scenarioForced }),
    [activeModel, shift, scenarioForced],
  );
  const path = useMemo(() => winOutPath(activeModel, { n: SIM_COUNT, seed: 11, shift, forced }), [activeModel, shift, forced]);
  const winAll = useMemo(() => winOutChance(activeModel, shift), [activeModel, shift]);
  const ordered = useMemo(() => [...scenario.teams].sort((a, b) => b.odds - a.odds || a.id - b.id), [scenario]);

  const mean = activeModel.nonByeEspn + shift;
  const remaining = schedule.filter((row) => !row.counted);
  const winOutRecord = path[path.length - 1];
  const pfOrder = [...activeModel.teams].sort((a, b) => b.pf - a.pf);
  const pfPlace = pfOrder.findIndex((team) => team.id === focusId) + 1;
  const lockedCount = Object.keys(scenarioForced).length;
  const presets = focusId === PLAYOFF_MODEL.focusId ? DEFAULT_PRESETS : GENERIC_PRESETS;

  // Root-for games: use curated rootFor for the default focus team, or the top Monte Carlo swings for any other team (keeping locked games visible).
  const rootGames = useMemo(() => {
    if (focusId === PLAYOFF_MODEL.focusId) {
      return PLAYOFF_MODEL.rootFor
        .map((root) => {
          const gameIndex = activeModel.games.findIndex(
            (game) => game.week === root.week && [game.homeId, game.awayId].includes(root.winnerId) && [game.homeId, game.awayId].includes(root.loserId),
          );
          if (gameIndex < 0 || activeModel.games[gameIndex]?.counted) return null;
          return { gameIndex, week: root.week, winnerId: root.winnerId, loserId: root.loserId };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);
    }
    return baseline.swings.slice(0, 4).map((sw) => ({
      gameIndex: sw.gameIndex,
      week: sw.week,
      winnerId: sw.winnerId,
      loserId: sw.loserId,
    }));
  }, [activeModel.games, baseline.swings, focusId]);

  function setPick(gameIndex: number, pick: "W" | "L" | "auto") {
    setFocusPick((prev) => {
      const next = { ...prev };
      if (pick === "auto") delete next[gameIndex];
      else next[gameIndex] = pick;
      return next;
    });
  }

  function toggleForce(gameIndex: number, teamId: number) {
    setForced((prev) => {
      const next = { ...prev };
      if (next[gameIndex] === teamId) delete next[gameIndex];
      else next[gameIndex] = teamId;
      return next;
    });
  }

  function winOut() {
    const next: Record<number, "W"> = {};
    for (const row of focusSchedule(activeModel, 0)) {
      if (!row.counted) next[row.gameIndex] = "W";
    }
    setFocusPick(next);
  }

  const at = (wins: number) => baseline.byWins.find((row) => row.wins === wins);
  const eight = at(8);
  const seven = at(7);

  return (
    <div className="grid gap-6">
      <p className="sr-only" aria-live="polite">
        {focusName} playoff odds for this scenario: {formatPct(scenario.focusOdds, 1)}. {SIM_COUNT.toLocaleString("en-US")} simulations.
      </p>

      <Panel title="Scenario controls" action={`${SIM_COUNT.toLocaleString("en-US")} sims`}>
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">Focus franchise</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Select franchise to simulate">
            {teams.map((t) => {
              const on = t.id === focusId;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => selectTeam(t.id)}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold",
                    on ? "bg-navy text-white shadow-xs" : "bg-surface-subtle text-navy ring-1 ring-line hover:bg-surface-muted",
                  )}
                >
                  <span
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-full font-display text-[9px] font-bold text-white"
                    style={{ background: t.color }}
                    aria-hidden
                  >
                    {t.abbrev}
                  </span>
                  <span className="max-w-36 truncate">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiBox
            label="This scenario"
            value={formatPct(scenario.focusOdds, 1)}
            sub={lockedCount ? `${lockedCount} ${lockedCount === 1 ? "game" : "games"} locked` : "Nothing locked"}
            highlight
          />
          <KpiBox label="Every game modeled" value={formatPct(baseline.focusOdds, 1)} sub="No results locked" />
          <KpiBox
            label="Win out"
            value={formatPct(winOutRecord?.odds ?? 0, 1)}
            sub={winOutRecord ? `${winOutRecord.wins}-${winOutRecord.losses}, other locks kept` : "Other locks kept"}
          />
          <KpiBox label={`Win all ${remaining.length}`} value={formatPct(winAll, 1)} sub="Product of remaining odds" />
        </div>

        <div className="mt-4 rounded-xl bg-surface-subtle p-4 ring-1 ring-line/90">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="strength" className="text-sm font-semibold text-navy">
              Weekly scoring expectation for {focusName}
            </label>
            <span className="font-display text-xl font-bold text-navy tabular-nums">
              {mean.toFixed(1)}{" "}
              <span className="font-sans text-xs font-semibold text-slate-600">
                {shift === 0 ? "(baseline)" : `(${shift > 0 ? "+" : "−"}${Math.abs(shift)} vs baseline)`}
              </span>
            </span>
          </div>
          <input
            id="strength"
            type="range"
            min={-25}
            max={25}
            step={1}
            value={shift}
            onChange={(event) => setShift(Number(event.target.value))}
            aria-valuemin={-25}
            aria-valuemax={25}
            aria-valuenow={shift}
            aria-valuetext={`${mean.toFixed(1)} projected points per week`}
            className="mt-2.5 h-8 w-full cursor-pointer accent-turf"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  aria-pressed={shift === preset.shift}
                  onClick={() => setShift(preset.shift)}
                  className={cx(
                    "min-h-9 cursor-pointer rounded-lg px-3 text-xs font-bold tracking-wide transition-colors",
                    shift === preset.shift ? "bg-navy text-white shadow-xs" : "bg-white text-navy ring-1 ring-line hover:bg-surface-muted",
                  )}
                >
                  {preset.name} · {(activeModel.nonByeEspn + preset.shift).toFixed(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={winOut}
                className="min-h-9 cursor-pointer rounded-lg bg-turf px-3.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-turf-dark"
              >
                Win out
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocusPick({});
                  setForced({});
                }}
                className="min-h-9 cursor-pointer rounded-lg bg-white px-3 text-xs font-bold tracking-wide text-slate-700 ring-1 ring-line transition-colors hover:bg-surface-muted"
              >
                Clear locks
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Win-out runway" action="Week by week">
          <p className="text-sm leading-snug text-slate-600">
            Playoff odds if {focusName} wins each remaining game in sequence while subsequent weeks are still simulated.
          </p>
          <ol className="mt-4 grid gap-2.5" aria-label="Playoff odds if each remaining game is a win">
            {path.map((step) => (
              <li key={step.week ?? "now"} className="grid grid-cols-[4.75rem_minmax(0,1fr)_3.6rem] items-center gap-2.5">
                <span className="text-xs leading-tight font-semibold text-slate-600 tabular-nums">
                  <span className="block font-bold text-navy">{step.week == null ? "Current" : `Week ${step.week}`}</span>
                  {step.wins}-{step.losses}
                </span>
                <div
                  className="h-3 overflow-hidden rounded-full bg-surface-muted ring-1 ring-line/60 ring-inset"
                  role="img"
                  aria-label={`${step.wins}-${step.losses}, ${formatPct(step.odds, 1)} playoff odds`}
                >
                  <div className="h-full rounded-full bg-turf transition-[width]" style={{ width: `${Math.max(2, step.odds * 100)}%` }} />
                </div>
                <span className="text-right font-display text-lg font-bold text-navy tabular-nums">{formatPct(step.odds, 1)}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="What record gets in" action="Baseline distribution">
          <p className="text-sm leading-snug text-slate-600">
            Final record distribution for {focusName} with nothing locked. {eight ? `8-6 gets in ${formatPct(eight.odds, 1)} of the time. ` : ""}
            {seven ? `7-7 gets in ${formatPct(seven.odds, 1)}.` : ""}
          </p>
          <div className="mt-4 grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_3.75rem] gap-2.5 border-b border-line pb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <span>Record</span>
            <span>Playoff rate</span>
            <span className="text-right">Frequency</span>
            <span className="text-right">In top 4</span>
          </div>
          <ul className="divide-y divide-line">
            {baseline.byWins.map((row) => (
              <li key={row.wins} className="grid grid-cols-[3.5rem_minmax(0,1fr)_5.5rem_3.75rem] items-center gap-2.5 py-2 text-sm">
                <span className="font-display text-base font-bold text-navy tabular-nums">
                  {row.wins}-{activeModel.regularSeasonWeeks - row.wins}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                  <div className="h-full rounded-full bg-navy/75" style={{ width: `${Math.max(2, row.odds * 100)}%` }} />
                </div>
                <span className="text-right text-xs text-slate-600 tabular-nums">{formatPct(row.share)} of sims</span>
                <span className="text-right font-display text-lg font-bold text-navy tabular-nums">{formatPct(row.odds)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={`${focusName} schedule`} action="Lock W / L">
        <ul className="grid gap-2.5">
          {schedule.map((row) => {
            const game = activeModel.games[row.gameIndex];
            const pick = focusPick[row.gameIndex] ?? "auto";
            const opp = name(row.opponentId);
            const liveFor = game.homeId === focusId ? game.homeCurrent : game.awayCurrent;
            const liveAgainst = game.homeId === focusId ? game.awayCurrent : game.homeCurrent;
            return (
              <li
                key={row.gameIndex}
                className={cx(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 ring-1",
                  row.counted ? "bg-surface-subtle/70 ring-line/70" : "bg-surface-subtle ring-line",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-navy px-1.5 py-0.5 font-display text-xs font-bold tracking-wider text-white uppercase">
                      Wk {row.week}
                    </span>
                    <span className="text-sm font-bold text-navy">
                      {row.home ? "vs" : "@"} {opp}
                    </span>
                    {row.counted && (
                      <span className="rounded bg-warn-light px-1.5 py-0.5 text-[11px] font-semibold text-warn ring-1 ring-warn-border ring-inset">
                        {weekFinal && row.week === currentWeek ? "Final" : "In record"}
                      </span>
                    )}
                  </div>
                  {row.counted ? (
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">
                      {liveFor != null && liveAgainst != null ? `${points(liveFor)}–${points(liveAgainst)}. ` : ""}
                      {weekFinal && row.week === currentWeek ? `Week ${row.week} is final.` : `Provisional, Week ${row.week} not final.`} Counted in current record.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">
                      Proj {row.focusProj.toFixed(1)}–{row.oppProj.toFixed(1)} · margin {signed(row.margin)} · win {formatPct(row.winProb)}
                    </p>
                  )}
                </div>

                {row.counted ? null : (
                  <div className="inline-flex rounded-lg bg-surface-muted p-1 ring-1 ring-line" role="group" aria-label={`Week ${row.week} result versus ${opp}`}>
                    {(
                      [
                        ["auto", "Auto"],
                        ["W", "W"],
                        ["L", "L"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={pick === value}
                        onClick={() => setPick(row.gameIndex, value)}
                        className={cx(
                          "min-h-8 min-w-11 cursor-pointer rounded-md px-2.5 text-xs font-bold transition-colors",
                          pick === value
                            ? value === "W"
                              ? "bg-turf text-white shadow-xs"
                              : value === "L"
                                ? "bg-loss text-white shadow-xs"
                                : "bg-navy text-white shadow-xs"
                            : "text-slate-700 hover:text-navy",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Root-for games" action="Key out-of-town swings">
          {rootGames.length === 0 ? (
            <p className="text-sm text-slate-600">Out-of-town outcomes have negligible impact on {focusName}&apos;s top-4 odds right now.</p>
          ) : (
            <ul className="grid gap-2.5">
              {rootGames.map((root) => {
                const swing = scenario.swings.find((row) => row.gameIndex === root.gameIndex);
                const locked = forced[root.gameIndex];
                return (
                  <li key={`${root.week}-${root.gameIndex}`} className="rounded-xl bg-surface-subtle p-3 ring-1 ring-line">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-bold tracking-wider text-slate-600 uppercase">Week {root.week}</span>
                      {locked != null && <span className="text-[11px] font-bold text-turf-dark uppercase">Locked</span>}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[root.winnerId, root.loserId].map((id, idx) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={locked === id}
                          onClick={() => toggleForce(root.gameIndex, id)}
                          className={cx(
                            "flex min-h-10 cursor-pointer items-center justify-between gap-1.5 rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition-colors",
                            locked === id
                              ? "bg-navy text-white shadow-xs"
                              : idx === 0
                                ? "bg-white text-navy ring-1 ring-turf-border hover:bg-turf-light/30"
                                : "bg-white text-navy ring-1 ring-line hover:bg-surface-muted",
                          )}
                        >
                          <span className="truncate">{name(id)}</span>
                          <span className="shrink-0 font-display font-bold opacity-75">{abbrev(id)}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-snug text-slate-600 tabular-nums">
                      {swing
                        ? `${formatPct(swing.oddsIfWinner, 1)} if ${name(swing.winnerId)} wins · ${formatPct(swing.oddsIfLoser, 1)} if ${name(swing.loserId)} wins`
                        : "Locked, so this game is already reflected in scenario odds."}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Scenario playoff odds" action="All 10 teams">
          <ol className="divide-y divide-line">
            {ordered.map((row, idx) => {
              const rec = modelTeam(row.id);
              const mine = row.id === focusId;
              return (
                <Fragment key={row.id}>
                  <li className={cx("flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0", mine && "-mx-2 rounded-lg bg-turf-light/55 px-2")}>
                    <span className="w-5 shrink-0 font-display text-sm font-bold text-slate-500 tabular-nums">{idx + 1}</span>
                    <span
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold text-white ring-1 ring-black/10 ring-inset"
                      style={{ background: byId.get(row.id)?.color ?? "#64748b" }}
                      aria-hidden
                    >
                      {abbrev(row.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectTeam(row.id)}
                      className="min-w-0 flex-1 cursor-pointer text-left hover:underline"
                    >
                      <span className="block truncate text-sm font-semibold text-navy">{name(row.id)}</span>
                      <span className="text-xs text-slate-600 tabular-nums">
                        {rec ? `${rec.wins}-${rec.losses}` : ""} · {rec ? rec.pf.toFixed(1) : ""} PF · proj {Math.round(row.avgPf)}
                      </span>
                    </button>
                    <span className="font-display text-xl font-bold text-navy tabular-nums">{formatPct(row.odds)}</span>
                  </li>
                  {idx === 3 && (
                    <li aria-hidden className="py-1 text-center text-[10px] font-bold tracking-[0.12em] text-turf-dark uppercase">
                      — Top 4 cut line —
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </Panel>
      </div>

      <Panel title="Points-for tiebreaker">
        <p className="text-sm leading-relaxed text-slate-700">
          {focusName} has <span className="font-semibold text-navy tabular-nums">{modelTeam(focusId)?.pf.toFixed(2)}</span> points,{" "}
          <span className="font-semibold text-navy">{place(pfPlace)}</span> in points for.{" "}
          {weekFinal ? `Week ${currentWeek} is final.` : `Provisional, Week ${currentWeek} not final.`} In this scenario,{" "}
          <span className="font-semibold text-navy tabular-nums">{formatPct(scenario.pfDecidedRate, 1)}</span> of sims end in a wins tie on the 4/5 cut line that includes {focusName}
          {scenario.pfDecidedRate > 0 ? `, and ${focusName} wins ${formatPct(scenario.pfWonRate, 1)} of those` : ""}.
        </p>
      </Panel>

      <details className="group overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 bg-surface-subtle/75 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-[1.1rem] font-bold tracking-[0.03em] text-navy uppercase">Lock other league games</span>
          <ChevronIcon className="size-4 text-slate-600 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 border-t border-line/80 p-4 sm:p-5">
          {[...new Set(activeModel.games.map((game) => game.week))].sort((a, b) => a - b).map((week) => {
            const games = activeModel.games
              .map((game, gameIndex) => ({ game, gameIndex }))
              .filter(({ game }) => game.week === week && !game.counted && game.homeId !== focusId && game.awayId !== focusId);
            if (!games.length) return null;
            return (
              <div key={week}>
                <p className="font-display text-xs font-bold tracking-wider text-slate-600 uppercase">Week {week}</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {games.map(({ game, gameIndex }) => (
                    <li key={gameIndex} className="grid grid-cols-2 gap-1.5 rounded-xl bg-surface-subtle p-1.5 ring-1 ring-line">
                      {[game.homeId, game.awayId].map((id) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={forced[gameIndex] === id}
                          aria-label={`${name(id)} wins in week ${week}`}
                          onClick={() => toggleForce(gameIndex, id)}
                          className={cx(
                            "min-h-9 cursor-pointer truncate rounded-lg px-2.5 text-xs font-semibold transition-colors",
                            forced[gameIndex] === id ? "bg-navy text-white shadow-xs" : "bg-white text-navy ring-1 ring-line hover:bg-surface-muted",
                          )}
                        >
                          <span className="sm:hidden">{abbrev(id)}</span>
                          <span className="hidden sm:inline">{name(id)}</span>
                        </button>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </details>

      <details className="group overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 bg-surface-subtle/75 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-[1.1rem] font-bold tracking-[0.03em] text-navy uppercase">How the model works</span>
          <ChevronIcon className="size-4 text-slate-600 transition-transform group-open:rotate-180" />
        </summary>
        <ul className="grid gap-2 border-t border-line/80 p-4 text-sm leading-relaxed text-slate-600 sm:p-5">
          <li>
            Week {currentWeek} is {weekFinal ? "final and included in records" : "live; its partial score scales remaining variance without double-counting"}.
          </li>
          <li>
            {PLAYOFF_MODEL.biasNote ?? "Each team's weekly mean is its ESPN projection plus half of its average miss."} Moving the slider shifts {focusName}&apos;s weekly mean directly.
          </li>
          <li>Scores are normal draws using each team&apos;s weekly spread. The top 4 by wins, then points for, make the playoffs.</li>
        </ul>
      </details>
    </div>
  );
}

function place(n: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
}

function Panel({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line/80 bg-surface-subtle/75 px-4 py-3 sm:px-5">
        <h2 className="min-w-0 font-display text-[1.1rem] leading-tight font-bold tracking-[0.03em] text-navy uppercase">{title}</h2>
        {action && <span className="text-xs font-semibold text-slate-600">{action}</span>}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function KpiBox({ label, value, sub, highlight }: { label: string; value: ReactNode; sub?: ReactNode; highlight?: boolean }) {
  return (
    <div className={cx("min-w-0 rounded-xl p-3 ring-1", highlight ? "bg-turf-light/55 ring-turf-border" : "bg-surface-subtle ring-line/90")}>
      <p className="text-[11px] font-bold tracking-[0.08em] text-slate-600 uppercase">{label}</p>
      <p className={cx("mt-0.5 font-display text-2xl leading-tight font-extrabold tabular-nums sm:text-3xl", highlight ? "text-turf-dark" : "text-navy")}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs leading-snug text-slate-600">{sub}</p>}
    </div>
  );
}
