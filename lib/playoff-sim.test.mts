import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { focusTeam, formatPct, phi, sideDist, simulate, winOutChance, winOutPath, type SimModel } from "./playoff-sim.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(readFileSync(join(dir, "../data/playoff-model.json"), "utf8")) as SimModel;

test("phi is a standard normal CDF", () => {
  assert.ok(Math.abs(phi(0) - 0.5) < 0.002);
  assert.ok(phi(2) > 0.97);
  assert.ok(phi(-2) < 0.03);
});

test("counted weeks are already in the focus record and are not simulated again", () => {
  const league = JSON.parse(readFileSync(join(dir, "../data/league-all-teams.json"), "utf8")) as {
    teams: { teamId: number; pointsFor: number; record: { wins: number; losses: number } }[];
  };
  const leagueFocus = league.teams.find((t) => t.teamId === model.focusId);
  assert.ok(leagueFocus);

  const focus = focusTeam(model);
  assert.equal(focus.pf, leagueFocus.pointsFor);
  assert.equal(focus.wins, leagueFocus.record.wins);
  assert.equal(focus.losses, leagueFocus.record.losses);
  assert.equal(focus.bias, 0);
  const lowest = Math.min(...model.teams.map((team) => team.pf));
  assert.ok(focus.pf > lowest, `focus pf ${focus.pf} should sit above the league low ${lowest}`);

  const week8 = model.games.filter((game) => game.week === 8);
  assert.equal(week8.length, 5);
  assert.ok(week8.every((game) => game.counted === true));
  const live = week8.find((game) => game.homeId === model.focusId);
  assert.ok(live);
  assert.equal(live.awayId, 8);
  assert.equal(live.homeCurrent, 179.26);
  assert.equal(live.awayCurrent, 89.36);
});

test("the remaining path skips counted weeks and ends at 14 games", () => {
  const focus = focusTeam(model);
  const base = simulate(model, { n: 12000, seed: 7, shift: 0 });
  const path = winOutPath(model, { n: 12000, seed: 11, shift: 0 });
  const chance = winOutChance(model, 0);
  const at = (wins: number) => base.byWins.find((row) => row.wins === wins);
  const firstOpen = model.currentWeek == null ? 9 : model.currentWeekFinal ? model.currentWeek + 1 : model.currentWeek;
  const expectedWeeks = Array.from({ length: model.regularSeasonWeeks - firstOpen + 1 }, (_, i) => firstOpen + i);

  assert.ok(base.focusOdds > 0.28 && base.focusOdds < 0.65, `baseline ${base.focusOdds}`);
  assert.ok(path[0].odds > 0.28 && path[0].odds < 0.65, `path start ${path[0].odds}`);
  assert.equal(path[0].week, null);
  assert.equal(path[0].wins, focus.wins);
  assert.equal(path[0].losses, focus.losses);
  assert.deepEqual(
    path.slice(1).map((step) => step.week),
    expectedWeeks,
  );
  assert.ok(path.at(-1)!.odds > 0.97, `win out ${path.at(-1)!.odds}`);
  assert.equal(path.at(-1)!.wins, focus.wins + expectedWeeks.length);
  assert.equal(path.at(-1)!.losses, focus.losses);
  assert.equal(path.length, expectedWeeks.length + 1);
  assert.ok(chance > 0.035 && chance < 0.25, `win-all ${chance}`);

  const eight = at(8);
  const seven = at(7);
  assert.ok(eight && eight.odds > 0.85 && eight.odds < 0.99, `8-6 ${eight?.odds}`);
  assert.ok(seven && seven.odds > 0.15 && seven.odds < 0.45, `7-7 ${seven?.odds}`);

  for (let i = 1; i < path.length; i++) {
    assert.ok(path[i].odds + 0.03 >= path[i - 1].odds, `path dipped at ${i}: ${path[i - 1].odds} → ${path[i].odds}`);
  }
});

test("the same seed is deterministic", () => {
  const a = simulate(model, { n: 400, seed: 3, shift: 0 });
  const b = simulate(model, { n: 400, seed: 3, shift: 0 });
  assert.equal(a.focusOdds, b.focusOdds);
  assert.equal(formatPct(0.996), ">99%");
  assert.equal(formatPct(0.996, 1), "99.6%");
});

test("root-for games are real matchups", () => {
  assert.equal(model.rootFor.length, 3);
  for (const root of model.rootFor) {
    const game = model.games.find(
      (row) => row.week === root.week && new Set([row.homeId, row.awayId]).has(root.winnerId) && new Set([row.homeId, row.awayId]).has(root.loserId),
    );
    assert.ok(game, `missing week ${root.week}`);
    assert.notEqual(root.winnerId, model.focusId);
  }
});

function toy(games: SimModel["games"], teams: SimModel["teams"], currentWeek = 1, currentWeekFinal = false): SimModel {
  return {
    focusId: 1,
    playoffSpots: 1,
    regularSeasonWeeks: 1,
    nonByeEspn: 100,
    currentWeek,
    currentWeekFinal,
    teams,
    games,
    rootFor: [],
  };
}

test("a tied score gives neither team a win", () => {
  const summary = simulate(
    toy(
      [{ week: 1, homeId: 1, awayId: 2, homeProj: 100, awayProj: 100 }],
      [
        { id: 1, bias: 0, sd: 0, wins: 0, losses: 0, pf: 50 },
        { id: 2, bias: 0, sd: 0, wins: 0, losses: 0, pf: 0 },
      ],
    ),
    { n: 40, seed: 1, shift: 0 },
  );
  const home = summary.teams.find((team) => team.id === 1);
  const away = summary.teams.find((team) => team.id === 2);
  assert.equal(home?.odds, 1);
  assert.equal(away?.odds, 0);
  assert.ok((home?.avgPf ?? 0) > (away?.avgPf ?? 0));
});

test("forcing an upset lifts the trailer instead of swapping the two scores", () => {
  const summary = simulate(
    toy(
      [{ week: 1, homeId: 1, awayId: 2, homeProj: 100, awayProj: 10 }],
      [
        { id: 1, bias: 0, sd: 0, wins: 0, losses: 0, pf: 0 },
        { id: 2, bias: 0, sd: 0, wins: 0, losses: 0, pf: 0 },
      ],
    ),
    { n: 20, seed: 1, shift: 0, forced: { 0: 2 } },
  );
  const home = summary.teams.find((team) => team.id === 1);
  const away = summary.teams.find((team) => team.id === 2);
  assert.ok((home?.avgPf ?? 0) > 90, `home kept its score, avg ${home?.avgPf}`);
  assert.ok((away?.avgPf ?? 0) > (home?.avgPf ?? 0), `away won, avg ${away?.avgPf}`);
});

test("the projected standings file is this simulator at the ESPN setting", () => {
  const file = JSON.parse(readFileSync(join(dir, "../data/projected-standings.json"), "utf8")) as {
    standings: { teamId: number; playoff_odds: number; top_seed_odds: number; avg_seed: number; exp_final_wins: number; projected_rank: number }[];
  };
  const summary = simulate(model, { n: 8000, seed: 7, shift: 0 });
  const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;
  const ranked = [...summary.teams].sort((a, b) => a.avgSeed - b.avgSeed || a.id - b.id);
  assert.deepEqual(
    file.standings.map((row) => row.teamId),
    ranked.map((row) => row.id),
  );
  file.standings.forEach((row, index) => {
    const sim = summary.teams.find((team) => team.id === row.teamId);
    assert.ok(sim);
    assert.equal(row.projected_rank, index + 1);
    assert.equal(row.playoff_odds, round(sim.odds, 4));
    assert.equal(row.top_seed_odds, round(sim.topSeedOdds, 4));
    assert.equal(row.avg_seed, round(sim.avgSeed, 2));
    assert.equal(row.exp_final_wins, round(sim.expectedWins, 2));
  });
});

test("live noise follows the current week, and a final week does not shrink", () => {
  const teams = [
    { id: 1, bias: 0, sd: 20, wins: 0, losses: 0, pf: 0 },
    { id: 2, bias: 0, sd: 20, wins: 0, losses: 0, pf: 0 },
  ];
  const game = { week: 9, homeId: 1, awayId: 2, homeProj: 100, awayProj: 100, homeCurrent: 90, awayCurrent: 10 };
  const live = sideDist(toy([game], teams, 9, false), game, "home", 0);
  const finished = sideDist(toy([game], teams, 9, true), game, "home", 0);
  const otherWeek = sideDist(toy([game], teams, 8, false), game, "home", 0);
  assert.ok(live[1] < 20, `live sd ${live[1]}`);
  assert.equal(finished[1], 20);
  assert.equal(otherWeek[1], 20);
});

test("switching focusId at shift 0 preserves every team's baseline odds", () => {
  const defaultRun = simulate(model, { n: 2000, seed: 7, shift: 0 });
  const altModel: SimModel = { ...model, focusId: 3 };
  const altRun = simulate(altModel, { n: 2000, seed: 7, shift: 0 });
  assert.deepEqual(
    altRun.teams.map((t) => [t.id, t.odds]),
    defaultRun.teams.map((t) => [t.id, t.odds]),
  );
  assert.equal(altRun.focusOdds, defaultRun.teams.find((t) => t.id === 3)?.odds);
});
