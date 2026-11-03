import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { focusTeam, formatPct, phi, simulate, winOutChance, winOutPath, type SimModel } from "./playoff-sim.ts";

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

  assert.ok(base.focusOdds > 0.28 && base.focusOdds < 0.5, `baseline ${base.focusOdds}`);
  assert.ok(path[0].odds > 0.28 && path[0].odds < 0.5, `path start ${path[0].odds}`);
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
  assert.ok(chance > 0.035 && chance < 0.09, `win-all ${chance}`);

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
