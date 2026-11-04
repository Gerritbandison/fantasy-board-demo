import assert from "node:assert/strict";
import { test } from "node:test";
import { GAMES, LEAGUE, TEAMS } from "./league.ts";
import { allPlay, luck } from "./stats.ts";

test("all-play uses every week on the record, including the current week", () => {
  for (const entry of TEAMS) {
    const row = allPlay(entry.id);
    const games = entry.weekly.length * (TEAMS.length - 1);
    assert.equal(row.wins + row.losses + row.ties, games, `team ${entry.id}`);
    const rate = games ? row.wins / games : 0;
    assert.ok(Math.abs(row.expectedWins - rate * entry.weekly.length) < 1e-9);
    assert.ok(Math.abs(luck(entry.id).winsOverExpected - (entry.wins - row.expectedWins)) < 1e-9);
  }
});

test("a final current week is in the record book with the standings", () => {
  assert.equal(LEAGUE.provisionalLabel, null);
  assert.ok(GAMES.some((game) => game.week === LEAGUE.week));
  const played = new Set(GAMES.map((game) => game.week));
  for (const entry of TEAMS) {
    for (const week of entry.weekly) assert.ok(played.has(week.week), `week ${week.week} missing from the record book`);
  }
});
