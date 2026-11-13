import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gamesForWeek, matchupState, projectionActual, recordBookLabel, selectScoreboard, type WeekGame } from "./week-state.ts";
import { WEEKS_PLAYED } from "./league.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const finalWeek8: WeekGame = {
  homeTeamId: 1,
  awayTeamId: 2,
  status: "final",
  winner: "HOME",
  homeCurrentPoints: 10,
  awayCurrentPoints: 5,
  homeProjected: 11,
  awayProjected: 9,
};

test("current week is schedule.weekN and does not fall back to week8", () => {
  const schedule = {
    week8: [finalWeek8],
    week9: [{ homeTeamId: 3, awayTeamId: 4, homeProjected: 100, awayProjected: 90 }],
  };
  const board = selectScoreboard(schedule, 9);
  assert.equal(board.currentWeek, 9);
  assert.equal(board.current?.[0].homeTeamId, 3);
  assert.equal(board.next, null);
  assert.equal(gamesForWeek(schedule, 9)?.[0].awayTeamId, 4);
});

test("a missing current-week key is empty even when week8 is still on the file", () => {
  const board = selectScoreboard({ week8: [finalWeek8] }, 9);
  assert.equal(board.current, null);
});

test("next week pairings prefer the schedule key over the extra list", () => {
  const schedule = {
    week8: [finalWeek8],
    week9: [{ homeTeamId: 7, awayTeamId: 6, homeProjected: 133, awayProjected: 116.7 }],
  };
  const board = selectScoreboard(schedule, 8, [{ week: 9, games: [{ homeTeamId: 1, awayTeamId: 2, homeProjected: 1, awayProjected: 2 }] }]);
  assert.equal(board.next?.[0].homeTeamId, 7);
  assert.equal(board.next?.[0].awayProjected, 116.7);
});

test("next week pairings come from the extra list when the schedule has no key", () => {
  const board = selectScoreboard({ week8: [finalWeek8] }, 8, [
    { week: 9, games: [{ homeTeamId: 7, awayTeamId: 6, homeProjected: 133, awayProjected: 116.7 }] },
  ]);
  assert.equal(board.nextWeek, 9);
  assert.equal(board.next?.[0].awayTeamId, 6);
  assert.equal(matchupState(board.next![0]), "projected");
});

test("an empty next-week schedule key does not borrow extra pairings", () => {
  const board = selectScoreboard({ week8: [finalWeek8], week9: [] }, 8, [
    { week: 9, games: [{ homeTeamId: 7, awayTeamId: 6, homeProjected: 133, awayProjected: 116.7 }] },
  ]);
  assert.deepEqual(board.next, []);
});

test("matchup state is projected, live, or final from the row", () => {
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, winner: "HOME" }), "final");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, winner: "away" }), "final");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, status: "final" }), "final");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, status: "in-progress", homeCurrentPoints: 0, awayCurrentPoints: 0 }), "live");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, status: "live" }), "live");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, homeCurrentPoints: 1, awayCurrentPoints: 0 }), "live");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, homeProjected: 10, awayProjected: 9 }), "projected");
  assert.equal(matchupState({ homeTeamId: 1, awayTeamId: 2, winner: "UNDECIDED", homeCurrentPoints: 0, awayCurrentPoints: 0 }), "projected");
});

test("record book label uses the weeks present on the finals", () => {
  assert.equal(recordBookLabel([1, 2, 3, 4, 5, 6, 7, 8]), "Weeks 1–8");
  assert.equal(recordBookLabel([1, 2, 3, 4, 5, 6, 7]), "Weeks 1–7");
  assert.equal(recordBookLabel([8]), "Week 8");
  assert.equal(recordBookLabel([]), "No finals yet");
  assert.equal(recordBookLabel(WEEKS_PLAYED), `Weeks ${Math.min(...WEEKS_PLAYED)}–${Math.max(...WEEKS_PLAYED)}`);
});

test("projection gap is actual minus projected and skips a side that has no actual", () => {
  const rows = projectionActual([
    {
      homeTeamId: 7,
      awayTeamId: 8,
      homeProjected: 128.52,
      awayProjected: 121.66,
      homeCurrentPoints: 179.26,
      awayCurrentPoints: 89.36,
    },
    { homeTeamId: 1, awayTeamId: 2, homeProjected: 100, awayProjected: 90 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].homeDelta, 50.74);
  assert.equal(rows[0].awayDelta, -32.3);
});

test("the committed schedule selects week 8 finals and week 9 pairings from the model file", () => {
  const league = JSON.parse(readFileSync(join(root, "data/league-all-teams.json"), "utf8")) as {
    meta: { currentWeek: number };
    schedule: { [key: string]: unknown };
  };
  const model = JSON.parse(readFileSync(join(root, "data/playoff-model.json"), "utf8")) as {
    games: { week: number; homeId: number; awayId: number; homeProj: number; awayProj: number; counted?: boolean }[];
  };
  const extras = [...new Set(model.games.map((game) => game.week))]
    .filter((week) => week > league.meta.currentWeek)
    .map((week) => ({
      week,
      games: model.games
        .filter((game) => game.week === week && !game.counted)
        .map((game) => ({
          homeTeamId: game.homeId,
          awayTeamId: game.awayId,
          homeProjected: game.homeProj,
          awayProjected: game.awayProj,
        })),
    }));
  const board = selectScoreboard(league.schedule, league.meta.currentWeek, extras);
  assert.equal(board.currentWeek, league.meta.currentWeek);
  assert.deepEqual(board.current, gamesForWeek(league.schedule, league.meta.currentWeek));
  assert.ok(board.current && board.current.length > 0);
  const week8 = gamesForWeek(league.schedule, 8);
  assert.equal(week8?.length, board.current.length);
  assert.ok(week8?.every((game) => matchupState(game) === "final"));
  if (league.meta.currentWeek !== 8) assert.notDeepEqual(board.current, week8);
  assert.equal(board.nextWeek, league.meta.currentWeek + 1);
  assert.equal(board.next?.length, board.current.length);
  assert.ok(board.next?.every((game) => game.homeProjected != null && game.awayProjected != null));
});
