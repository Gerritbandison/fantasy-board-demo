"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PLAYOFF_MODEL } from "@/lib/playoff-data";
import { SIM_COUNT, focusSchedule, formatPct, simulate, winOutChance, winOutPath } from "@/lib/playoff-sim";
import { cn } from "@/lib/utils";

interface SimTeam {
  id: number;
  name: string;
  abbrev: string;
  color: string;
}

const PRESET_SHIFTS = [
  { shift: -20, name: "Season" },
  { shift: -5, name: "Since trade" },
  { shift: 0, name: "ESPN" },
  { shift: 7, name: "Weeks 4–7" },
] as const;

function signed(n: number) {
  const text = Math.abs(n).toFixed(1);
  return n >= 0 ? `+${text}` : `−${text}`;
}

function points(n: number) {
  return n.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

export function PlayoffSimulator({ teams, focusName }: { teams: SimTeam[]; focusName: string }) {
  const [shift, setShift] = useState(0);
  const [mayePick, setMayePick] = useState<Record<number, "W" | "L">>({});
  const [forced, setForced] = useState<Record<number, number>>({});
  const byId = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const name = (id: number) => byId.get(id)?.name ?? "Team";
  const abbrev = (id: number) => byId.get(id)?.abbrev ?? "?";
  const modelTeam = (id: number) => PLAYOFF_MODEL.teams.find((t) => t.id === id);

  const schedule = useMemo(() => focusSchedule(PLAYOFF_MODEL, shift), [shift]);
  const scenarioForced = useMemo(() => {
    const next: Record<number, number> = { ...forced };
    for (const row of schedule) {
      if (mayePick[row.gameIndex] === "W") next[row.gameIndex] = PLAYOFF_MODEL.focusId;
      else if (mayePick[row.gameIndex] === "L") next[row.gameIndex] = row.opponentId;
    }
    return next;
  }, [forced, mayePick, schedule]);

  const baseline = useMemo(() => simulate(PLAYOFF_MODEL, { n: SIM_COUNT, seed: 7, shift }), [shift]);
  const scenario = useMemo(
    () => simulate(PLAYOFF_MODEL, { n: SIM_COUNT, seed: 7, shift, forced: scenarioForced }),
    [shift, scenarioForced],
  );
  const path = useMemo(() => winOutPath(PLAYOFF_MODEL, { n: SIM_COUNT, seed: 11, shift, forced }), [shift, forced]);
  const winAll = useMemo(() => winOutChance(PLAYOFF_MODEL, shift), [shift]);
  const ordered = useMemo(() => [...scenario.teams].sort((a, b) => b.odds - a.odds || a.id - b.id), [scenario]);
  const mean = PLAYOFF_MODEL.nonByeEspn + shift;

  function setPick(gameIndex: number, pick: "W" | "L" | "auto") {
    setMayePick((prev) => {
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
    for (const row of focusSchedule(PLAYOFF_MODEL, 0)) next[row.gameIndex] = "W";
    setMayePick(next);
  }

  const at = (wins: number) => baseline.byWins.find((row) => row.wins === wins);
  const eight = at(8);
  const seven = at(7);

  return (
    <div className="grid gap-5">
      <p className="sr-only" aria-live="polite">
        {focusName} playoff odds for this scenario: {formatPct(scenario.focusOdds, 1)}. {SIM_COUNT.toLocaleString("en-US")} simulations.
      </p>

      <Panel title="Scenario">
        <p className="text-sm leading-snug text-slate-600">
          Odds below are a projection from {SIM_COUNT.toLocaleString("en-US")} seeded simulations, not ESPN&apos;s. Top 4 of 10. Regular season ends Week 14. Tiebreak is record, then points for.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="This scenario" value={formatPct(scenario.focusOdds, 1)} sub={Object.keys(scenarioForced).length ? "With results locked" : "Nothing locked"} />
          <Stat label="Every game modeled" value={formatPct(baseline.focusOdds, 1)} sub="No results locked" />
          <Stat label="Win out" value={formatPct(path[path.length - 1]?.odds ?? 0, 1)} sub="9-5, other locks kept" />
          <Stat label="Win all 7" value={formatPct(winAll, 1)} sub="Product of the game odds" />
        </div>

        <label htmlFor="strength" className="mt-5 block text-sm text-slate-600">
          Non-bye projection for {focusName}: <span className="font-semibold text-navy tabular-nums">{mean.toFixed(1)}</span>
          {shift === 0 ? " (ESPN)" : ` (${shift > 0 ? "+" : "−"}${Math.abs(shift)} vs ESPN)`}
        </label>
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
          aria-valuetext={`${mean.toFixed(1)} projected points in non-bye weeks`}
          className="mt-2 h-11 w-full accent-turf"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_SHIFTS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              aria-pressed={shift === preset.shift}
              onClick={() => setShift(preset.shift)}
              className={cn(
                "min-h-11 rounded-full px-3 text-sm font-semibold",
                shift === preset.shift ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-line",
              )}
            >
              {preset.name} {(PLAYOFF_MODEL.nonByeEspn + preset.shift).toFixed(1)}
            </button>
          ))}
          <button type="button" onClick={winOut} className="min-h-11 rounded-full bg-turf px-3 text-sm font-semibold text-white hover:bg-turf-dark">
            Win out
          </button>
          <button
            type="button"
            onClick={() => {
              setMayePick({});
              setForced({});
            }}
            className="min-h-11 rounded-full bg-white px-3 text-sm font-semibold text-navy ring-1 ring-line"
          >
            Clear locks
          </button>
        </div>
      </Panel>

      <Panel title="Win out">
        <p className="text-sm leading-snug text-slate-600">
          Playoff odds if {focusName} wins each remaining game, one week at a time. Games after that win are still simulated. Locked results in other games stay locked.
        </p>
        <ol className="mt-4 grid gap-2" aria-label="Playoff odds if each remaining game is a win">
          {path.map((step) => (
            <li key={step.week ?? "now"} className="grid grid-cols-[4.75rem_minmax(0,1fr)_3.4rem] items-center gap-2">
              <span className="text-xs leading-tight font-bold text-slate-600">
                <span className="block text-navy">{step.week == null ? "Now" : `Wk ${step.week}`}</span>
                {step.wins}-{step.losses}
              </span>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label={`${step.wins}-${step.losses}, ${formatPct(step.odds, 1)} playoff odds`}
              >
                <div className="h-full rounded-full bg-turf" style={{ width: `${Math.max(2, step.odds * 100)}%` }} />
              </div>
              <span className="text-right font-display text-lg font-bold text-navy tabular-nums">{formatPct(step.odds, 1)}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={`${focusName} games`}>
        <ul className="grid gap-3">
          {schedule.map((row) => {
            const game = PLAYOFF_MODEL.games[row.gameIndex];
            const pick = mayePick[row.gameIndex] ?? "auto";
            const opp = name(row.opponentId);
            return (
              <li key={row.gameIndex} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy">
                      Week {row.week}
                      {row.live ? " · live" : ""} {row.home ? "vs" : "@"} {opp}
                    </p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      Proj {row.focusProj.toFixed(1)}–{row.oppProj.toFixed(1)} · margin {signed(row.margin)} · win {formatPct(row.winProb)}
                    </p>
                    {row.live && game.homeCurrent != null && game.awayCurrent != null && (
                      <p className="text-xs text-slate-600 tabular-nums">
                        So far {points(game.homeId === PLAYOFF_MODEL.focusId ? game.homeCurrent : game.awayCurrent)}–{points(game.homeId === PLAYOFF_MODEL.focusId ? game.awayCurrent : game.homeCurrent)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1" role="group" aria-label={`Week ${row.week} result versus ${opp}`}>
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
                        className={cn(
                          "min-h-11 min-w-11 rounded-full px-3 text-sm font-bold",
                          pick === value
                            ? value === "W"
                              ? "bg-turf text-white"
                              : value === "L"
                                ? "bg-loss text-white"
                                : "bg-navy text-white"
                            : "bg-white text-navy ring-1 ring-line",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Root-for games">
        <ul className="grid gap-3">
          {PLAYOFF_MODEL.rootFor.map((root) => {
            const gameIndex = PLAYOFF_MODEL.games.findIndex(
              (game) => game.week === root.week && [game.homeId, game.awayId].includes(root.winnerId) && [game.homeId, game.awayId].includes(root.loserId),
            );
            const swing = scenario.swings.find((row) => row.gameIndex === gameIndex);
            const locked = forced[gameIndex];
            return (
              <li key={`${root.week}-${root.winnerId}`} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Week {root.week}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[root.winnerId, root.loserId].map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={locked === id}
                      onClick={() => toggleForce(gameIndex, id)}
                      className={cn(
                        "min-h-11 rounded-full px-3 text-left text-sm font-semibold",
                        locked === id ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-line",
                      )}
                    >
                      {name(id)}
                      <span className="ml-1 font-normal text-current/80">{abbrev(id)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-snug text-slate-600">
                  {swing
                    ? `${formatPct(swing.oddsIfWinner, 1)} if ${name(swing.winnerId)} wins · ${formatPct(swing.oddsIfLoser, 1)} if ${name(swing.loserId)} wins`
                    : "Locked, so this game is not in the swing."}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Playoff odds">
        <ol className="grid gap-2">
          {ordered.map((row) => {
            const rec = modelTeam(row.id);
            const mine = row.id === PLAYOFF_MODEL.focusId;
            return (
              <li key={row.id} className={cn("flex min-w-0 items-center gap-3 rounded-xl px-2 py-2", mine && "bg-turf-light")}>
                <span
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                  style={{ background: byId.get(row.id)?.color ?? "#94a3b8" }}
                  aria-hidden
                >
                  {abbrev(row.id)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy">{name(row.id)}</span>
                  <span className="text-xs text-slate-600 tabular-nums">
                    {rec ? `${rec.wins}-${rec.losses}` : ""} · {rec ? rec.pf.toFixed(2) : ""} PF · final {Math.round(row.avgPf)}
                  </span>
                </span>
                <span className="font-display text-2xl font-bold text-navy tabular-nums">{formatPct(row.odds)}</span>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel title="What record gets in">
        <p className="text-sm leading-snug text-slate-600">
          Final record if every game is simulated and nothing is locked. {eight ? `8-6 gets in ${formatPct(eight.odds, 1)} of the time. ` : ""}
          {seven ? `7-7 gets in ${formatPct(seven.odds, 1)}.` : ""} The win-out chart is different: 8-5 there still has a game left.
        </p>
        <ul className="mt-3 divide-y divide-line">
          {baseline.byWins.map((row) => (
            <li key={row.wins} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-semibold text-navy tabular-nums">{row.wins}-{PLAYOFF_MODEL.regularSeasonWeeks - row.wins}</span>
              <span className="text-slate-600 tabular-nums">{formatPct(row.share)} of sims</span>
              <span className="font-display text-lg font-bold text-navy tabular-nums">{formatPct(row.odds)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Points-for tiebreaker">
        <p className="text-sm leading-snug text-slate-600">
          {focusName} has {modelTeam(PLAYOFF_MODEL.focusId)?.pf.toFixed(2)} points, the lowest total in the league. In this scenario,{" "}
          {formatPct(scenario.pfDecidedRate, 1)} of sims are a wins tie on the 4/5 line that includes {focusName}
          {scenario.pfDecidedRate > 0 ? `, and ${focusName} wins ${formatPct(scenario.pfWonRate, 1)} of those` : ""}.
        </p>
      </Panel>

      <details className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
        <summary className="min-h-11 cursor-pointer font-display text-lg font-bold tracking-wide text-navy uppercase">Other games</summary>
        <div className="mt-3 grid gap-3">
          {[8, 9, 10, 11, 12, 13, 14].map((week) => {
            const games = PLAYOFF_MODEL.games
              .map((game, gameIndex) => ({ game, gameIndex }))
              .filter(({ game }) => game.week === week && game.homeId !== PLAYOFF_MODEL.focusId && game.awayId !== PLAYOFF_MODEL.focusId);
            if (!games.length) return null;
            return (
              <div key={week}>
                <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Week {week}</p>
                <ul className="mt-2 grid gap-2">
                  {games.map(({ game, gameIndex }) => (
                    <li key={gameIndex} className="flex flex-wrap items-center gap-2">
                      {[game.homeId, game.awayId].map((id) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={forced[gameIndex] === id}
                          aria-label={`${name(id)} wins in week ${week}`}
                          onClick={() => toggleForce(gameIndex, id)}
                          className={cn(
                            "min-h-11 rounded-full px-3 text-sm font-semibold",
                            forced[gameIndex] === id ? "bg-navy text-white" : "bg-slate-50 text-navy ring-1 ring-line",
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

      <details className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
        <summary className="min-h-11 cursor-pointer font-display text-lg font-bold tracking-wide text-navy uppercase">How the model works</summary>
        <ul className="mt-3 grid gap-2 text-sm leading-snug text-slate-600">
          <li>Standings are through Week 7. Week 8 uses the points already scored and only the noise left in the game.</li>
          <li>Each other team&apos;s weekly mean is its ESPN projection plus half of its average Weeks 1–7 miss. {focusName} gets no penalty. The slider moves that team instead.</li>
          <li>Scores are normal draws using each team&apos;s weekly spread. The top 4 by wins, then points for, make the playoffs.</li>
        </ul>
      </details>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,30,54,0.06)] ring-1 ring-line">
      <header className="px-4 pt-4 sm:px-5">
        <h2 className="min-w-0 font-display text-lg leading-tight font-bold tracking-wide text-navy uppercase">{title}</h2>
      </header>
      <div className="p-4 pt-3 sm:p-5 sm:pt-3">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold tracking-wider text-slate-600 uppercase">{label}</p>
      <p className="font-display text-2xl leading-tight font-bold text-navy tabular-nums">{value}</p>
      {sub && <p className="text-xs leading-snug text-slate-600">{sub}</p>}
    </div>
  );
}
