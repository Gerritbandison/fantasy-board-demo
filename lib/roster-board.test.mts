import assert from "node:assert/strict";
import { test } from "node:test";
import { getTeam } from "./league.ts";
import {
  STARTER_SLOTS,
  buildRosterBoard,
  formatStat,
  injuryBadge,
  opponentLabel,
  sumDefined,
  type RosterPlayer,
} from "./roster-board.ts";

function player(partial: Partial<RosterPlayer> & Pick<RosterPlayer, "name" | "position" | "slot">): RosterPlayer {
  return partial;
}

test("starter slots stay in ESPN order and an empty D/ST stays a row", () => {
  const board = buildRosterBoard({
    starters: [
      player({ name: "Kicker", position: "K", slot: "K" }),
      player({ name: "Signal", position: "QB", slot: "QB" }),
      player({ name: "Wide", position: "WR", slot: "WR" }),
      player({ name: "Flex", position: "RB", slot: "FLEX" }),
      player({ name: "End", position: "TE", slot: "TE" }),
      player({ name: "Back", position: "RB", slot: "RB" }),
      player({ name: "Other", position: "WR", slot: "WR" }),
      player({ name: "Second", position: "RB", slot: "RB" }),
    ],
    bench: [player({ name: "Spare", position: "WR", slot: "Bench" })],
    ir: [],
  });

  assert.deepEqual(
    board.starters.map((row) => row.slot),
    [...STARTER_SLOTS],
  );
  assert.deepEqual(
    board.starters.map((row) => row.player?.name ?? "Empty"),
    ["Signal", "Back", "Second", "Wide", "Other", "End", "Flex", "Empty", "Kicker"],
  );
  assert.deepEqual(
    board.bench.map((p) => p.name),
    ["Spare"],
  );
  assert.equal(board.ir.length, 0);
});

test("every rostered player is kept, including a third back and IR", () => {
  const board = buildRosterBoard({
    starters: [player({ name: "One", position: "RB", slot: "RB" })],
    bench: [
      player({ name: "Two", position: "RB", slot: "RB" }),
      player({ name: "Three", position: "RB", slot: "RB" }),
      player({ name: "Defense", position: "D/ST", slot: "D/ST" }),
    ],
    ir: [player({ name: "Hurt", position: "WR", slot: "IR", status: "IR" })],
  });
  const names = [
    ...board.starters.map((row) => row.player?.name),
    ...board.bench.map((p) => p.name),
    ...board.ir.map((p) => p.name),
  ].filter(Boolean);
  assert.deepEqual(names.sort(), ["Defense", "Hurt", "One", "Three", "Two"]);
  assert.equal(board.starters.filter((row) => row.slot === "RB" && row.player).length, 2);
  assert.equal(board.starters.find((row) => row.slot === "D/ST")?.player?.name, "Defense");
  assert.deepEqual(
    board.bench.map((p) => p.name),
    ["Three"],
  );
  assert.equal(board.ir[0]?.name, "Hurt");
  assert.equal(injuryBadge("Questionable"), "Q");
  assert.equal(injuryBadge("Out"), "O");
  assert.equal(injuryBadge("IR"), "IR");
  assert.equal(injuryBadge("Active"), null);
});

test("totals add only the numbers that exist", () => {
  const board = buildRosterBoard({
    starters: [
      player({ name: "A", position: "QB", slot: "QB", projection: 20.5, score: 0, seasonPoints: 100.25 }),
      player({ name: "B", position: "RB", slot: "RB", projection: 10, seasonPoints: 40 }),
    ],
    bench: [player({ name: "C", position: "WR", slot: "Bench", projection: 8.5, lastPoints: 12 })],
    ir: [],
  });
  assert.equal(board.starterTotals.projection, 30.5);
  assert.equal(board.starterTotals.score, 0);
  assert.equal(board.starterTotals.seasonPoints, 140.25);
  assert.equal(board.starterTotals.seasonAverage, null);
  assert.equal(board.starterTotals.lastPoints, null);
  assert.equal(board.benchTotals.projection, 8.5);
  assert.equal(board.benchTotals.lastPoints, 12);
  assert.equal(board.benchTotals.score, null);
  assert.equal(formatStat(null), "--");
  assert.equal(formatStat(board.starterTotals.seasonAverage), "--");
  assert.equal(formatStat(20.5), "20.5");
});

test("a bye is labeled from the bye flag and a missing opponent stays blank", () => {
  const bye = player({ name: "Bye", position: "RB", slot: "RB", onBye: true });
  const quiet = player({ name: "Quiet", position: "WR", slot: "WR" });
  assert.equal(opponentLabel(bye), "BYE");
  assert.equal(opponentLabel(quiet), "--");
  assert.equal(opponentLabel(null), "--");
});

test("team 7 keeps starter slot order and lists the whole roster", () => {
  const team = getTeam(7);
  assert.ok(team);
  const board = buildRosterBoard(team.roster);
  assert.deepEqual(
    board.starters.map((row) => row.slot),
    [...STARTER_SLOTS],
  );
  const listed = board.starters.filter((row) => row.player).length + board.bench.length + board.ir.length;
  const source = team.roster.starters.length + team.roster.bench.length + team.roster.ir.length;
  assert.equal(listed, source);
  assert.ok(listed > board.starters.filter((row) => row.player).length);
  assert.equal(board.starterTotals.projection, sumDefined(board.starters.map((row) => row.player?.projection)));
});
