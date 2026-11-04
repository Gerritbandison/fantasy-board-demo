import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { team } from "./league.ts";
import { consolationLine, consolationSeries, winnersLine, winnersResume, winnersSeries } from "./playoff-h2h.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEAM_7 = "Maye i give you a blowj0b";

interface Pair {
  teamA: number;
  teamB: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  games: number;
  lastMeeting?: { season: number; winnerTeamId: number | null; championship: boolean };
}

interface PlayoffFile {
  winnersBracketH2H: Pair[];
  consolationH2H: Pair[];
}

const file = JSON.parse(readFileSync(join(root, "data/playoff-h2h.json"), "utf8")) as PlayoffFile;

test("winners-bracket lookup finds each pair from either order", () => {
  assert.equal(file.winnersBracketH2H.length, 17);
  for (const row of file.winnersBracketH2H) {
    const found = winnersSeries(row.teamA, row.teamB);
    const flipped = winnersSeries(row.teamB, row.teamA);
    assert.ok(found, `${row.teamA} vs ${row.teamB}`);
    assert.equal(flipped, found);
    assert.equal(found.teamAWins, row.teamAWins);
    assert.equal(found.teamBWins, row.teamBWins);
    assert.equal(found.ties, row.ties);
    assert.equal(found.games, row.games);
    assert.equal(found.last.season, row.lastMeeting?.season);
    assert.equal(found.last.winnerTeamId, row.lastMeeting?.winnerTeamId);
    assert.equal(found.last.championship, row.lastMeeting?.championship);
  }
});

test("a pair with no winners-bracket meeting is absent", () => {
  assert.equal(winnersSeries(6, 10), null);
  assert.equal(winnersSeries(8, 11), null);
  assert.equal(winnersSeries(7, 8), null);
});

test("Smert Fellas vs Maye reads 1–1, last meeting the 2021 semifinal", () => {
  const series = winnersSeries(6, 7);
  assert.ok(series);
  const fromCallback = winnersLine(series, 6, () => "Name From Callback");
  assert.equal(fromCallback.text, "Playoffs: 1–1 (last: 2021 semifinal, Name From Callback won)");
  assert.equal(team(7).name, TEAM_7);
  assert.equal(winnersLine(series, 6, (id) => team(id).name).text, `Playoffs: 1–1 (last: 2021 semifinal, ${TEAM_7} won)`);
  assert.equal(winnersLine(series, 7, (id) => team(id).name).text, `Playoffs: 1–1 (last: 2021 semifinal, ${TEAM_7} won)`);
});

test("an uneven series is shown from the requested team's side", () => {
  const series = winnersSeries(1, 3);
  assert.ok(series);
  assert.equal(winnersLine(series, 1, (id) => team(id).name).text, "Playoffs: 1–0 (last: 2024 championship, Bibi's Boys won)");
  assert.equal(winnersLine(series, 3, (id) => team(id).name).text, "Playoffs: 0–1 (last: 2024 championship, Bibi's Boys won)");
});

test("consolation lookup stays separate from the winners bracket", () => {
  assert.equal(file.consolationH2H.length, 31);
  for (const row of file.consolationH2H) {
    const found = consolationSeries(row.teamA, row.teamB);
    assert.equal(consolationSeries(row.teamB, row.teamA), found);
    assert.equal(found?.teamAWins, row.teamAWins);
    assert.equal(found?.teamBWins, row.teamBWins);
    assert.equal(found?.games, row.games);
  }
  assert.equal(consolationSeries(6, 7), null);
  const bibi = consolationSeries(1, 3);
  assert.ok(bibi);
  assert.equal(consolationLine(bibi, 1), "Consolation: 2–0");
  assert.equal(consolationLine(bibi, 3), "Consolation: 0–2");
});

test("a franchise resume counts only winners-bracket games", () => {
  const maye = winnersResume(7);
  assert.equal(maye.wins, 2);
  assert.equal(maye.losses, 3);
  assert.equal(maye.ties, 0);
  assert.deepEqual(maye.seasons, [2020, 2021, 2023]);
  assert.equal(maye.games.find((game) => game.season === 2020 && game.championship && game.opponentId === 6)?.result, "L");
  assert.equal(maye.games.find((game) => game.season === 2021 && !game.championship && game.opponentId === 6)?.result, "W");
  assert.deepEqual(winnersResume(11), { wins: 0, losses: 0, ties: 0, seasons: [], games: [] });
  assert.equal(winnersResume(8).wins, 0);
  assert.equal(winnersResume(8).losses, 1);
});
