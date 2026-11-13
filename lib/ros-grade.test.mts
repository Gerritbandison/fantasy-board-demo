import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import type { SimModel } from "./playoff-sim.ts";
import { buildRosterGrade, type ByeFile, type GradePlayer, type RosterPlayer, type RosterReport } from "./ros-grade.ts";
import { rosterOutlookFor } from "./ros.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => JSON.parse(readFileSync(join(dir, "../data", name), "utf8"));

const LETTERS: [number, string][] = [
  [0.1, "A+"],
  [0.2, "A"],
  [0.3, "A-"],
  [0.4, "B+"],
  [0.5, "B"],
  [0.6, "B-"],
  [0.7, "C+"],
  [0.8, "C"],
  [0.9, "C-"],
  [1, "D"],
];

function letterForRatio(ratio: number) {
  for (const [cut, letter] of LETTERS) if (ratio <= cut) return letter;
  return "D";
}

function letterForRanks(ranks: { rank: number; field: number }[]) {
  const comparable = ranks.filter((row) => row.field > 1);
  if (!comparable.length) return "—";
  const ratios = comparable.map((row) => (row.rank - 1) / (row.field - 1)).sort((a, b) => a - b);
  const mid = Math.floor(ratios.length / 2);
  const ratio = ratios.length % 2 ? ratios[mid] : (ratios[mid - 1] + ratios[mid]) / 2;
  return letterForRatio(ratio);
}

function player(id: string, name: string, pos: string, slot: string): RosterPlayer {
  return { id, name, pos, slot, inj: null, own: 50, gp: 4 };
}

function lines(rows: Record<string, number[]>, startWeek = 4) {
  const points: Record<string, Record<string, number>> = {};
  for (const [id, vals] of Object.entries(rows)) {
    points[id] = {};
    vals.forEach((value, index) => {
      points[id][String(startWeek + index)] = value;
    });
  }
  return points;
}

function toyModel(currentWeek = 9, currentWeekFinal = false): SimModel {
  return {
    focusId: 7,
    playoffSpots: 4,
    regularSeasonWeeks: 14,
    nonByeEspn: 100,
    currentWeek,
    currentWeekFinal,
    teams: [
      { id: 7, bias: 0, sd: 10, wins: 3, losses: 5, pf: 100 },
      { id: 1, bias: 0, sd: 10, wins: 4, losses: 4, pf: 90 },
      { id: 2, bias: 0, sd: 10, wins: 5, losses: 3, pf: 110 },
    ],
    games: [
      { week: 9, homeId: 7, awayId: 1, homeProj: 110, awayProj: 100 },
      { week: 10, homeId: 1, awayId: 7, homeProj: 90, awayProj: 120 },
      { week: 9, homeId: 2, awayId: 1, homeProj: 80, awayProj: 70 },
    ],
    rootFor: [],
  };
}

function gradeOrThrow(run: () => RosterReport) {
  try {
    return { report: run(), threw: false as const };
  } catch {
    return { report: null, threw: true as const };
  }
}

test("an empty starting slot omits that grade and does not invent a defense", () => {
  const rosters: Record<string, RosterPlayer[]> = {
    "7": [player("qb", "Alpha", "QB", "QB"), player("rb", "Bravo", "RB", "RB")],
    "1": [player("qb2", "Echo", "QB", "QB"), player("dst", "Hotel D/ST", "D/ST", "D/ST")],
  };
  const points = lines({
    qb: [10, 10, 10, 10],
    rb: [8, 8, 8, 8],
    qb2: [5, 5, 5, 5],
    dst: [9],
  });
  const outcome = gradeOrThrow(() => buildRosterGrade(rosters, points, toyModel(), { byes: { "11": ["Hotel D/ST"] } }));
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);
  assert.equal(report.positions.some((row) => row.id === "DST"), false);
  assert.equal(JSON.stringify(report).includes("Hotel D/ST"), false);
  assert.ok(report.suggestions.includes("The D/ST slot is empty."));
  assert.equal(report.week11Byes.includes("Hotel D/ST"), false);
});

test("a benched bye player keeps a real sample rank and is not required to be starting", () => {
  const rosters: Record<string, RosterPlayer[]> = {
    "7": [
      player("qb", "Alpha", "QB", "QB"),
      player("rb", "Bravo", "RB", "RB"),
      player("bye", "Charlie", "RB", "Bench"),
      player("wr", "Delta", "WR", "Bench"),
    ],
    "1": [player("qb2", "Echo", "QB", "QB"), player("rb2", "Foxtrot", "RB", "RB"), player("wr2", "Golf", "WR", "WR")],
  };
  const points = lines({
    qb: [10, 10, 10, 10],
    rb: [8, 8, 8, 8],
    bye: [20, 20, 20, 20],
    wr: [6, 6, 6, 6],
    qb2: [5, 5, 5, 5],
    rb2: [30, 30, 30, 30],
    wr2: [12, 12, 12, 12],
  });
  const byes: ByeFile = { byes: { "9": ["Charlie"], "11": ["Ghost Player"] } };
  const outcome = gradeOrThrow(() => buildRosterGrade(rosters, points, toyModel(), byes));
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);

  const rb = report.positions.find((row) => row.id === "RB");
  assert.ok(rb);
  const bravo = rb.players.find((row) => row.name === "Bravo");
  const charlie = rb.players.find((row) => row.name === "Charlie");
  assert.ok(bravo);
  assert.ok(charlie);
  assert.equal(bravo.onByeBench, false);
  assert.equal(bravo.rank, 2);
  assert.equal(bravo.field, 2);
  assert.equal(bravo.ppg, 8);
  assert.equal(charlie.onByeBench, true);
  assert.equal(charlie.rank, 2);
  assert.equal(charlie.field, 3);
  assert.equal(charlie.ppg, 20);
  assert.equal(charlie.total, 80);
  assert.equal(rb.letter, "D");
  assert.match(rb.reason, /Charlie is on the bench and on bye in Week 9/);
  assert.match(rb.reason, /20\.0 points per game/);
  assert.match(rb.reason, /2nd of 3 starting running backs/);
  assert.equal(rb.reason.includes("Ghost Player"), false);

  const bench = report.positions.find((row) => row.id === "BN");
  assert.ok(bench);
  assert.equal(bench.players.some((row) => row.name === "Charlie"), false);
  const delta = bench.players.find((row) => row.name === "Delta");
  assert.ok(delta);
  assert.equal(delta.rank, 2);
  assert.equal(delta.field, 2);
  assert.equal(delta.ppg, 6);
  assert.equal(bench.letter, letterForRanks([{ rank: 2, field: 2 }]));

  assert.ok(report.suggestions.includes("Charlie is on bye in Week 9 and is not starting."));
  assert.equal(report.suggestions.some((line) => line.includes("Ghost")), false);
  assert.deepEqual(report.week11Byes, []);
  const week9 = report.weeks.find((week) => week.week === 9);
  assert.ok(week9);
  assert.deepEqual(week9.byes, ["Charlie"]);
});

test("a dropped player is left out even when the bye file and scoring file still name them", () => {
  const rosters: Record<string, RosterPlayer[]> = {
    "7": [player("qb", "Alpha", "QB", "QB")],
    "1": [player("qb2", "Echo", "QB", "QB")],
  };
  const points = lines({
    qb: [10, 10, 10, 10],
    qb2: [4, 4, 4, 4],
    ghost: [99, 99, 99, 99],
  });
  const outcome = gradeOrThrow(() =>
    buildRosterGrade(rosters, points, toyModel(), { byes: { "9": ["Ghost Player"], "11": ["Ghost Player"] } }),
  );
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);
  assert.equal(JSON.stringify(report).includes("Ghost Player"), false);
  assert.equal(report.weeks.every((week) => week.byes.length === 0), true);
});

test("a starter with no scoring line does not get a fabricated rank or letter", () => {
  const rosters: Record<string, RosterPlayer[]> = {
    "7": [player("qb", "Alpha", "QB", "QB"), player("k", "Kicker", "K", "K")],
    "1": [player("qb2", "Echo", "QB", "QB"), player("k2", "Other K", "K", "K")],
  };
  const points = lines({
    qb: [10, 10, 10, 10],
    qb2: [4, 4, 4, 4],
    k2: [8, 8],
  });
  const outcome = gradeOrThrow(() => buildRosterGrade(rosters, points, toyModel(), { byes: {} }));
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);
  assert.equal(report.positions.some((row) => row.id === "K"), false);
  assert.equal(JSON.stringify(report).includes("Kicker"), false);
  assert.equal(report.suggestions.includes("No backup quarterback is on the roster."), true);
});

test("a missing rest-of-season model does not invent a team rate", () => {
  const rosters: Record<string, RosterPlayer[]> = {
    "7": [player("qb", "Alpha", "QB", "QB")],
    "1": [player("qb2", "Echo", "QB", "QB")],
  };
  const points = lines({ qb: [10, 10, 10, 10], qb2: [4, 4, 4, 4] });
  const model = toyModel();
  model.games = [];
  const outcome = gradeOrThrow(() => buildRosterGrade(rosters, points, model, { byes: {} }));
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);
  assert.equal(report.letter, "—");
  assert.equal(report.rank, 0);
  assert.equal(report.field, 0);
  assert.equal(report.ppg, null);
  assert.equal(report.weeks.length, 0);
  assert.match(report.summary, /No rest-of-season team projection/);
  assert.doesNotMatch(report.summary, /\d+\.\d+/);
});

test("the checked-in roster grades use lineup slots, the scoring file, and the playoff model", () => {
  const rosters = read("league-rosters.json") as Record<string, RosterPlayer[]>;
  const points = read("player-points-w4-7.json") as Record<string, Record<string, number>>;
  const model = read("playoff-model.json") as SimModel;
  const byes = read("maye-byes.json") as ByeFile;
  const outcome = gradeOrThrow(() => buildRosterGrade(rosters, points, model, byes));
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);

  const focusId = String(model.focusId);
  const focus = rosters[focusId] ?? [];
  const names = new Set(focus.map((row) => row.name));
  const sampleWeeks = [
    ...new Set(Object.values(points).flatMap((row) => Object.keys(row).map(Number).filter((week) => Number.isFinite(week)))),
  ].sort((a, b) => a - b);
  const sampleLabel =
    sampleWeeks.length === 0 ? "the scoring file" : sampleWeeks.length === 1 ? `Week ${sampleWeeks[0]}` : `Weeks ${sampleWeeks[0]}\u2013${sampleWeeks[sampleWeeks.length - 1]}`;

  const all = Object.entries(rosters).flatMap(([teamId, rows]) =>
    rows.map((row) => {
      const vals = Object.values(points[row.id] ?? {}).map(Number);
      const total = vals.reduce((sum, value) => sum + value, 0);
      return { ...row, teamId, weeks: vals.length, total, ppg: vals.length ? total / vals.length : 0 };
    }),
  );
  const ahead = (left: { ppg: number; total: number; name: string }, right: { ppg: number; total: number; name: string }) =>
    left.ppg !== right.ppg ? left.ppg > right.ppg : left.total !== right.total ? left.total > right.total : left.name.localeCompare(right.name) < 0;

  for (const row of report.positions) {
    assert.ok(row.players, `${row.id} lists the players it graded`);
    assert.ok(row.players.length > 0, row.id);
    assert.match(row.reason, new RegExp(sampleLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    const rankedStarters = row.players.filter((playerRow) => !playerRow.onByeBench && playerRow.rank != null && playerRow.field != null);
    const ranked = rankedStarters.length
      ? rankedStarters
      : row.players.filter((playerRow) => playerRow.rank != null && playerRow.field != null);
    assert.equal(row.letter, letterForRanks(ranked.map((playerRow) => ({ rank: playerRow.rank ?? 0, field: playerRow.field ?? 0 }))));
    for (const playerRow of row.players) {
      assert.ok(names.has(playerRow.name), playerRow.name);
      const rostered = focus.find((item) => item.id === playerRow.id);
      assert.ok(rostered);
      const vals = Object.values(points[playerRow.id] ?? {}).map(Number);
      const total = vals.reduce((sum, value) => sum + value, 0);
      assert.equal(playerRow.weeks, vals.length);
      if (!vals.length) {
        assert.equal(playerRow.ppg, null);
        assert.equal(playerRow.rank, null);
      } else {
        assert.ok(playerRow.ppg != null);
        assert.ok(Math.abs(playerRow.ppg - total / vals.length) < 1e-9);
        assert.ok(playerRow.total != null);
        assert.ok(Math.abs(playerRow.total - total) < 1e-9);
        assert.match(row.reason, new RegExp(playerRow.ppg.toFixed(1).replace(".", "\\.")));
      }
      if (playerRow.rank != null && playerRow.field != null && playerRow.ppg != null && playerRow.total != null) {
        const boardSlot = playerRow.onByeBench || playerRow.slot === "Bench" || playerRow.slot === "IR" ? playerRow.pos : playerRow.slot;
        const min = boardSlot === "D/ST" || boardSlot === "K" ? 1 : sampleWeeks.length;
        const comparison = all
          .filter((item) => item.slot === boardSlot && item.weeks >= min)
          .sort((a, b) => b.ppg - a.ppg || b.total - a.total || a.name.localeCompare(b.name));
        const index = comparison.findIndex((item) => item.id === playerRow.id && item.teamId === focusId);
        if (index >= 0) {
          assert.equal(playerRow.rank, index + 1, playerRow.name);
          assert.equal(playerRow.field, comparison.length, playerRow.name);
        } else {
          const better = comparison.filter((item) => ahead(item, { ppg: playerRow.ppg ?? 0, total: playerRow.total ?? 0, name: playerRow.name })).length;
          assert.equal(playerRow.rank, better + 1, playerRow.name);
          assert.equal(playerRow.field, comparison.length + 1, playerRow.name);
        }
      }
    }
  }

  const minFor = (slot: string) => (sampleWeeks.length === 0 ? Number.POSITIVE_INFINITY : slot === "D/ST" || slot === "K" ? 1 : sampleWeeks.length);
  const scored = focus.map((row) => {
    const vals = Object.values(points[row.id] ?? {}).map(Number);
    const total = vals.reduce((sum, value) => sum + value, 0);
    return { ...row, weeks: vals.length, total, ppg: vals.length ? total / vals.length : 0 };
  });
  for (const slot of ["QB", "RB", "WR", "TE", "FLEX", "D/ST", "K"]) {
    const starters = scored.filter((row) => row.slot === slot && row.weeks >= minFor(slot));
    const grade = report.positions.find((row) => (slot === "D/ST" ? row.id === "DST" : row.id === slot));
    if (!starters.length && !focus.some((row) => row.slot === slot && Object.keys(points[row.id] ?? {}).length > 0)) {
      const byeNow = new Set((byes.byes[String(model.currentWeek)] ?? []).filter((name) => names.has(name)));
      const byeCovered = focus.some((row) => byeNow.has(row.name) && row.slot !== slot && (row.pos === slot || (slot !== "FLEX" && row.pos === slot)));
      if (!byeCovered) assert.equal(grade, undefined, slot);
    }
    if (grade) {
      for (const starter of starters) {
        const listed: GradePlayer | undefined = grade.players.find((item) => item.id === starter.id);
        assert.ok(listed, `${starter.name} is in the ${slot} grade`);
        assert.equal(listed.onByeBench, false);
        assert.equal(listed.rank == null, false);
      }
    }
  }

  for (const name of report.week11Byes) assert.ok(names.has(name), name);
  for (const week of report.weeks) for (const name of week.byes) assert.ok(names.has(name), name);
  const fileWeek11 = (byes.byes["11"] ?? []).filter((name) => names.has(name));
  assert.deepEqual(report.week11Byes, fileWeek11);

  const firstOpen = model.currentWeek == null ? 9 : model.currentWeekFinal === false ? model.currentWeek : model.currentWeek + 1;
  const focusWeeks = model.games
    .filter((game) => game.week >= firstOpen && (game.homeId === model.focusId || game.awayId === model.focusId))
    .map((game) => game.week)
    .sort((a, b) => a - b);
  assert.deepEqual(
    report.weeks.map((week) => week.week),
    focusWeeks,
  );
  for (const week of report.weeks) {
    const game = model.games.find((row) => row.week === week.week && (row.homeId === model.focusId || row.awayId === model.focusId));
    assert.ok(game);
    const home = game.homeId === model.focusId;
    assert.equal(week.proj, home ? game.homeProj : game.awayProj);
    assert.equal(week.oppProj, home ? game.awayProj : game.homeProj);
    assert.ok(week.winProb > 0 && week.winProb < 1);
  }

  if (report.field > 0) {
    assert.ok(report.ppg != null);
    assert.match(report.summary, /Projection/);
    assert.match(report.summary, new RegExp(report.ppg.toFixed(1).replace(".", "\\.")));
  }
  for (const line of report.suggestions) {
    assert.equal(/\bNo\. \d+/.test(line), false, line);
    for (const name of names) {
      if (line.includes(name)) assert.ok(focus.some((row) => row.name === name));
    }
  }
  const kicker = focus.find((row) => row.slot === "K");
  if (kicker && Object.keys(points[kicker.id] ?? {}).length === 0 && !focus.some((row) => row.slot === "K" && row.id !== kicker.id && Object.keys(points[row.id] ?? {}).length > 0)) {
    assert.equal(report.positions.some((row) => row.id === "K"), false);
  }
  if (!focus.some((row) => row.slot === "D/ST")) {
    assert.equal(report.positions.some((row) => row.id === "DST"), false);
    assert.ok(report.suggestions.includes("The D/ST slot is empty."));
  }
  if (!focus.some((row) => row.pos === "QB" && row.slot !== "QB")) {
    assert.ok(report.suggestions.includes("No backup quarterback is on the roster."));
  }
});

test("moving a starter to the bench and dropping the defense still grades the remaining lineup", () => {
  const rosters = structuredClone(read("league-rosters.json")) as Record<string, RosterPlayer[]>;
  const points = read("player-points-w4-7.json") as Record<string, Record<string, number>>;
  const model = read("playoff-model.json") as SimModel;
  const byes = structuredClone(read("maye-byes.json")) as ByeFile;
  const focus = rosters[String(model.focusId)];
  assert.ok(focus);
  const dropped = focus.filter((row) => row.slot === "D/ST" || row.pos === "D/ST");
  const droppedNames = dropped.map((row) => row.name);
  rosters[String(model.focusId)] = focus.filter((row) => !droppedNames.includes(row.name));
  const starter = rosters[String(model.focusId)].find((row) => row.slot === "RB" && row.pos === "RB");
  assert.ok(starter);
  starter.slot = "Bench";
  const current = String(model.currentWeek);
  byes.byes[current] = [...(byes.byes[current] ?? []), starter.name];
  byes.byes["11"] = [...(byes.byes["11"] ?? []), ...droppedNames, "Ghost Player"];

  const outcome = gradeOrThrow(() => buildRosterGrade(rosters, points, model, byes));
  assert.equal(outcome.threw, false);
  const report = outcome.report;
  assert.ok(report);
  const blob = JSON.stringify(report);
  assert.equal(blob.includes("Ghost Player"), false);
  for (const name of droppedNames) assert.equal(blob.includes(name), false, name);
  assert.equal(report.positions.some((row) => row.id === "DST"), false);
  const rb = report.positions.find((row) => row.id === "RB");
  assert.ok(rb);
  const moved = rb.players.find((row) => row.id === starter.id);
  assert.ok(moved);
  assert.equal(moved.onByeBench, true);
  assert.ok(moved.ppg != null);
  const vals = Object.values(points[starter.id] ?? {}).map(Number);
  const total = vals.reduce((sum, value) => sum + value, 0);
  assert.ok(Math.abs((moved.ppg ?? 0) - total / vals.length) < 1e-9);
  assert.match(rb.reason, new RegExp(`on bye in Week ${model.currentWeek}`));
  assert.ok(report.suggestions.some((line) => line.includes(starter.name) && line.includes(`Week ${model.currentWeek}`)));
});

test("rosterOutlookFor grades all 10 teams with distinct ROS ranks and team-scoped schedules", () => {
  const model = read("playoff-model.json") as SimModel;
  const teamIds = model.teams.map((t) => t.id);
  assert.equal(teamIds.length, 10);

  const ranks = new Set<number>();
  for (const id of teamIds) {
    const report = rosterOutlookFor(id);
    assert.ok(report, `missing report for team ${id}`);
    assert.ok(report.rank >= 1 && report.rank <= 10, `invalid rank ${report.rank} for team ${id}`);
    ranks.add(report.rank);
    assert.notEqual(report.letter, "—");
    assert.ok(report.ppg != null && report.ppg > 80);
    assert.ok(report.positions.length >= 5, `team ${id} positions ${report.positions.length}`);
    assert.ok(report.weeks.length > 0, `team ${id} missing remaining weeks`);

    for (const wk of report.weeks) {
      assert.notEqual(wk.opponentId, id);
      const game = model.games.find(
        (g) => g.week === wk.week && ((g.homeId === id && g.awayId === wk.opponentId) || (g.awayId === id && g.homeId === wk.opponentId)),
      );
      assert.ok(game, `team ${id} week ${wk.week} opponent ${wk.opponentId} not found in model`);
      assert.equal(wk.home, game.homeId === id);
      assert.equal(wk.proj, game.homeId === id ? game.homeProj : game.awayProj);
      assert.equal(wk.oppProj, game.homeId === id ? game.awayProj : game.homeProj);
      assert.ok(wk.winProb > 0 && wk.winProb < 1);
    }
  }
  assert.equal(ranks.size, 10);
});
