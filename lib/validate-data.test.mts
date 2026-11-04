import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateData, validateFiles, type DataFiles } from "../scripts/validate-data.mts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function lineup(name: string, pos: string, slot = pos) {
  return { name, position: pos, lineupSlot: slot, pos, slot };
}

function validFiles(): DataFiles {
  const players = [lineup("Alpha", "QB"), lineup("Bravo", "RB")];
  const team = (teamId: number, opponentTeamId: number) => ({
    teamId,
    isUserTeam: teamId === 7,
    roster: {
      starters: players.map((player) => ({ name: player.name, position: player.position, lineupSlot: player.lineupSlot })),
      bench: [],
      ir: [],
    },
    weekly: [{ week: 8, opponentTeamId, pointsFor: 100, pointsAgainst: 90, result: "W" }],
    week9: { opponentTeamId },
  });
  const roster = () => players.map((player) => ({ name: player.name, pos: player.pos, slot: player.slot }));
  return {
    "league-all-teams.json": {
      meta: {
        currentWeek: 9,
        weekInProgress: { week: 9, final: false, label: "Week 9 not started" },
      },
      teams: [team(7, 1), team(1, 7)],
      schedule: {
        week9: [{ homeTeamId: 7, awayTeamId: 1, status: "not-started", winner: "UNDECIDED" }],
      },
    },
    "league-rosters.json": { "7": roster(), "1": roster() },
    "playoff-model.json": {
      focusId: 7,
      currentWeek: 9,
      currentWeekFinal: false,
      teams: [{ id: 7 }, { id: 1 }],
      games: [{ week: 9, homeId: 7, awayId: 1 }],
    },
    "week-roasts.json": {
      week: 8,
      matchups: [{ homeTeamId: 7, awayTeamId: 1 }],
    },
    "maye-byes.json": { byes: { "9": ["Alpha"] } },
    "projected-standings.json": { standings: [{ teamId: 7 }, { teamId: 1 }] },
    "player-points-w4-7.json": {},
    "league-h2h-history.json": {},
    "league-trades.json": {},
    "biggest-wins.json": {},
    "top-scores.json": {},
  };
}

test("the checked-in data files agree with meta.currentWeek", () => {
  assert.deepEqual(validateData(root), []);
});

test("npm run validate:data exits 0 on the repo", () => {
  const result = spawnSync("npm", ["run", "validate:data"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test("a current week that has not started is valid with an empty D/ST slot", () => {
  assert.deepEqual(validateFiles(validFiles()), []);
});

test("a lineup player missing from league-rosters names the player and the week", () => {
  const files = validFiles();
  const rosters = files["league-rosters.json"] as Record<string, { name: string }[]>;
  rosters["7"] = rosters["7"].filter((player) => player.name !== "Bravo");
  const errors = validateFiles(files);
  assert.ok(errors.length > 0);
  assert.match(errors.join("\n"), /league-rosters\.json/);
  assert.match(errors.join("\n"), /Bravo/);
  assert.match(errors.join("\n"), /Week 9/);
});

test("a playoff-model team that is not in the league is named", () => {
  const files = validFiles();
  const model = files["playoff-model.json"] as { teams: { id: number }[] };
  model.teams.push({ id: 99 });
  const errors = validateFiles(files);
  assert.match(errors.join("\n"), /playoff-model\.json/);
  assert.match(errors.join("\n"), /99/);
});

test("a roast matchup team that is not in the league is named", () => {
  const files = validFiles();
  const roasts = files["week-roasts.json"] as { matchups: { homeTeamId: number }[] };
  roasts.matchups[0].homeTeamId = 99;
  const errors = validateFiles(files);
  assert.match(errors.join("\n"), /week-roasts\.json/);
  assert.match(errors.join("\n"), /99/);
});

test("weekInProgress.week must equal meta.currentWeek", () => {
  const files = validFiles();
  const league = files["league-all-teams.json"] as { meta: { weekInProgress: { week: number } } };
  league.meta.weekInProgress.week = 8;
  const errors = validateFiles(files);
  assert.match(errors.join("\n"), /weekInProgress\.week is 8/);
  assert.match(errors.join("\n"), /meta\.currentWeek is 9/);
});

test("a bye name that is not on the focus roster is named", () => {
  const files = validFiles();
  const byes = files["maye-byes.json"] as { byes: Record<string, string[]> };
  byes.byes["9"] = ["Ghost"];
  const errors = validateFiles(files);
  assert.match(errors.join("\n"), /maye-byes\.json/);
  assert.match(errors.join("\n"), /Ghost/);
  assert.match(errors.join("\n"), /team 7/);
});
