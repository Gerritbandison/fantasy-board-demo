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

test("week 8 is already in the focus record and is not simulated again", () => {
  const focus = focusTeam(model);
  assert.equal(focus.pf, 950.42);
  assert.equal(focus.wins, 3);
  assert.equal(focus.losses, 5);
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

test("the remaining path skips counted week 8 and ends at 9-5", () => {
  const base = simulate(model, { n: 12000, seed: 7, shift: 0 });
  const path = winOutPath(model, { n: 12000, seed: 11, shift: 0 });
  const chance = winOutChance(model, 0);
  const at = (wins: number) => base.byWins.find((row) => row.wins === wins);

  // Thursday's model is about 34.8%. After Monday night, with every Week 9 projection equal to the live score, the same runs are about 50.3% and the path starts at about 50.1%.
  assert.ok(base.focusOdds > 0.28 && base.focusOdds < 0.55, `baseline ${base.focusOdds}`);
  assert.ok(path[0].odds > 0.28 && path[0].odds < 0.55, `path start ${path[0].odds}`);
  assert.equal(path[0].week, null);
  assert.equal(path[0].wins, 3);
  assert.equal(path[0].losses, 5);
  assert.deepEqual(
    path.slice(1).map((step) => step.week),
    [9, 10, 11, 12, 13, 14],
  );
  assert.ok(path.at(-1)!.odds > 0.97, `win out ${path.at(-1)!.odds}`);
  assert.equal(path.at(-1)!.wins, 9);
  assert.equal(path.at(-1)!.losses, 5);
  assert.equal(path.length, 7);
  // Thursday's partial Week 9 was about 5.8%. After the Sunday slate, with Monday still out, it is about 9.7%.
  assert.ok(chance > 0.035 && chance < 0.11, `win-all ${chance}`);

  const eight = at(8);
  const seven = at(7);
  assert.ok(eight && eight.odds > 0.85 && eight.odds < 0.98, `8-6 ${eight?.odds}`);
  assert.ok(seven && seven.odds > 0.15 && seven.odds < 0.4, `7-7 ${seven?.odds}`);

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
