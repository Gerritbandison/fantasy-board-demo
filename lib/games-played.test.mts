import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  absencesByPlayerName,
  minimumGames,
  missedGameCount,
  resolveByeWeek,
  splitScoringLines,
  teamGamesPlayed,
} from "./games-played.ts";
import type { RosterPlayer } from "./ros-grade.ts";
import { withPlayContext } from "./ros.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => JSON.parse(readFileSync(join(dir, "../data", name), "utf8"));

function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);
}

test("a bye zero is left out and a real zero stays when the player did not miss a game", () => {
  const sample = splitScoringLines({ "4": 8.5, "5": 0, "6": 16.4, "7": 0 }, { byeWeek: 7, missedGames: 0 });
  assert.equal(sample.games, 3);
  close(sample.total, 24.9);
  close(sample.ppg, 8.3);
  assert.deepEqual(sample.excludedWeeks, [7]);
});

test("missed games explain a run of zeros, including a player who only scored once", () => {
  const jacobs = splitScoringLines({ "4": 0, "5": 0, "6": 0, "7": 20.1 }, { byeWeek: 11, missedGames: 6 });
  assert.equal(jacobs.games, 1);
  close(jacobs.total, 20.1);
  close(jacobs.ppg, 20.1);
  assert.deepEqual(jacobs.excludedWeeks, [4, 5, 6]);

  const partial = splitScoringLines({ "4": 0, "5": 0, "6": 5.7, "7": 7.8 }, { missedGames: 6 });
  assert.equal(partial.games, 2);
  close(partial.total, 13.5);
  close(partial.ppg, 6.75);
});

test("a zero stays when the missed-game count cannot cover every unexplained zero", () => {
  const sample = splitScoringLines({ "4": 0, "5": 0, "6": 10 }, { missedGames: 1 });
  assert.equal(sample.games, 3);
  close(sample.total, 10);
  assert.deepEqual(sample.excludedWeeks, []);
});

test("a negative score counts as a game played and an unexplained zero stays at a full games-played count", () => {
  const sample = splitScoringLines({ "4": 3, "5": 15, "6": -2, "7": 0 }, { byeWeek: 8, missedGames: 0 });
  assert.equal(sample.games, 4);
  close(sample.total, 16);
  close(sample.ppg, 4);
  assert.deepEqual(sample.excludedWeeks, []);
});

test("an out or zero-snap week is excluded, a logged bye is not, and a positive score wins", () => {
  const absences = absencesByPlayerName([
    {
      season: 2026,
      longTermGrade: {
        sides: {
          "1": {
            received: [
              {
                name: "DJ Moore",
                zeroOrMissingWeeksAfter: [
                  { week: 5, why: "bye" },
                  { week: 6, why: "out (no game-log entry: injured or inactive)" },
                  { week: 4, why: "not on this fantasy team that week (released or traded on)" },
                ],
              },
              {
                name: "Cam Skattebo",
                zeroOrMissingWeeksAfter: [{ week: 6, why: "game-log entry with all-zero stats (likely left early or inactive)" }],
              },
            ],
          },
        },
      },
    },
    {
      season: 2024,
      longTermGrade: {
        sides: { "1": { received: [{ name: "DJ Moore", zeroOrMissingWeeksAfter: [{ week: 7, why: "out" }] }] } },
      },
    },
  ]);
  assert.deepEqual(absences.get("DJ Moore"), [6]);
  assert.deepEqual(absences.get("Cam Skattebo"), [6]);

  const skattebo = splitScoringLines({ "4": 7.6, "5": 7.1, "6": 0, "7": 19.1 }, { byeWeek: 8, didNotPlayWeeks: [6], missedGames: 0 });
  assert.equal(skattebo.games, 3);
  close(skattebo.total, 33.8);
  assert.deepEqual(skattebo.excludedWeeks, [6]);

  const playedAnyway = splitScoringLines({ "4": 12 }, { didNotPlayWeeks: [4], missedGames: 5 });
  assert.equal(playedAnyway.games, 1);
  close(playedAnyway.total, 12);
});

test("a logged absence spends the missed-game budget before any other zero is guessed", () => {
  const sample = splitScoringLines({ "4": 0, "5": 0, "6": 9 }, { didNotPlayWeeks: [4], missedGames: 1 });
  assert.equal(sample.games, 2);
  close(sample.total, 9);
  assert.deepEqual(sample.excludedWeeks, [4]);
});

test("a stale bye follows the current NFL team, and a lone player keeps their own bye", () => {
  assert.equal(resolveByeWeek(13, [5, 5, 5]), 5);
  assert.equal(resolveByeWeek(11, []), 11);
  assert.equal(resolveByeWeek(null, [6, 6, 11]), 6);
  assert.equal(resolveByeWeek(8, [5, 11]), 8);
});

test("team games ignore a future bye and count a live week that already scored", () => {
  assert.equal(teamGamesPlayed(9, 6, 0), 8);
  assert.equal(teamGamesPlayed(9, 11, 0), 9);
  assert.equal(teamGamesPlayed(9, 8, 27.2), 9);
  assert.equal(teamGamesPlayed(9, 8, -3), 9);
  assert.equal(missedGameCount(8, 8), 0);
  assert.equal(missedGameCount(null, 8), 8);
  assert.equal(missedGameCount(3, 9), 6);
  assert.equal(minimumGames("WR"), 2);
  assert.equal(minimumGames("K"), 1);
  assert.equal(minimumGames("D/ST"), 1);
});

test("checked-in players drop byes and missed games from the per-game average", () => {
  const rosters = withPlayContext(read("league-rosters.json") as Record<string, RosterPlayer[]>);
  const points = read("player-points-w4-7.json") as Record<string, Record<string, number>>;
  const sample = (name: string) => {
    const player = Object.values(rosters)
      .flat()
      .find((row) => row.name === name);
    assert.ok(player, name);
    return splitScoringLines(points[player.id], player);
  };

  const chase = sample("Ja'Marr Chase");
  assert.equal(chase.games, 3);
  close(chase.total, 42.6);
  close(chase.ppg, 14.2);
  assert.deepEqual(chase.excludedWeeks, [6]);

  const jacobs = sample("Josh Jacobs");
  assert.equal(jacobs.games, 1);
  close(jacobs.ppg, 20.1);

  const diggs = sample("Stefon Diggs");
  assert.equal(diggs.games, 2);
  close(diggs.total, 24.9);
  close(diggs.ppg, 12.45);
  assert.deepEqual(diggs.excludedWeeks, [5, 7]);

  const texans = sample("Texans D/ST");
  assert.equal(texans.games, 4);
  close(texans.total, 16);
  close(texans.ppg, 4);

  const skattebo = sample("Cam Skattebo");
  assert.equal(skattebo.games, 3);
  assert.ok(skattebo.excludedWeeks.includes(6));

  const brown = sample("A.J. Brown");
  assert.equal(brown.games, 2);
  close(brown.ppg, 6.75);

  const hall = sample("Breece Hall");
  assert.equal(hall.games, 0);
});
