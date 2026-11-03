import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { shownPending, shownWin, type DirectoryTeam } from "./biggest-win-rows.ts";
import { franchiseName, hasOtherRawName, USER_TEAM_ID } from "./names.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEAM_7 = "Maye i give you a blowj0b";

interface TeamFile {
  teams: { teamId: number; displayName: string; espnName?: string | null; ownerLabelFromApp: string | null }[];
}

interface FileSide {
  teamId: number;
  nameThatSeason: string;
  franchiseNow: string;
  owner: string | null;
  score: number;
}

interface WinsFile {
  gamesConsidered: number;
  boundary: { tenthMargin: number; eleventh: { margin: number }; tieAtBoundary: boolean };
  top10: { rank: number; season: number; week: number; gameId: string; margin: number; winner: FileSide; loser: FileSide }[];
  pending: {
    season: number;
    week: number;
    winnerTeamId: number;
    winnerName: string;
    loserTeamId: number;
    loserName: string;
    winnerScore: number;
    loserScore: number;
    margin: number;
  }[];
}

const wins = JSON.parse(readFileSync(join(root, "data/biggest-wins.json"), "utf8")) as WinsFile;
const teams = JSON.parse(readFileSync(join(root, "data/league-all-teams.json"), "utf8")) as TeamFile;

const directory = new Map<number, DirectoryTeam>(
  teams.teams.map((team) => [
    team.teamId,
    { name: franchiseName(team.teamId, team.displayName, team.espnName), owner: team.ownerLabelFromApp },
  ]),
);

function teamAt(teamId: number) {
  const team = directory.get(teamId);
  assert.ok(team, `missing team ${teamId}`);
  return team;
}

function line(side: { seasonName: string; currentName: string; showCurrent: boolean; owner: string | null; score: number }) {
  return `${side.seasonName}|${side.showCurrent ? side.currentName : ""}|${side.owner ?? ""}|${side.score.toFixed(2)}`;
}

test("top 10 is final regular-season games, ranked by margin, with names from the directory", () => {
  assert.equal(wins.top10.length, 10);
  assert.equal(wins.boundary.tieAtBoundary, false);
  assert.equal(wins.boundary.tenthMargin, 80.14);
  assert.equal(wins.boundary.eleventh.margin, 79.2);

  const ranked = wins.top10.map((row) => shownWin(row, teamAt));
  assert.deepEqual(
    ranked.map((row) => row.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  const margins = ranked.map((row) => row.margin);
  assert.deepEqual(margins, [98.86, 94.82, 94.28, 89.58, 89.04, 86.82, 85.12, 83.18, 80.3, 80.14]);
  for (let i = 1; i < margins.length; i++) assert.ok(margins[i - 1] > margins[i]);

  assert.deepEqual(
    ranked.map((row) => `${row.rank} ${row.season} wk${row.week} ${line(row.winner)} over ${line(row.loser)}`),
    [
      "1 2021 wk5 Rub My Chubb|Jahmyr I Go Again||162.52 over YOU LIKE THAT YOU LIKE THAT|All Heart||63.66",
      "2 2020 wk2 Biden 2020|Maye i give you a blowj0b|Gerrit|175.60 over Team PSU sucks|Bibi's Boys|Kyle / KASE|80.78",
      "3 2025 wk2 Gerry's Gang|Maye i give you a blowj0b|Gerrit|175.80 over M1 Abrams|Easy Peasy Lemon Squeezy||81.52",
      "4 2020 wk12 Sandusky's Soldiers|||165.78 over Team Tino|Smert Fellas||76.20",
      "5 2020 wk2 Team Tino|Smert Fellas||169.62 over Jahmyr I Go Again (2020)|||80.58",
      "6 2021 wk9 Kabul FC|||179.06 over Team KGB|Easy Peasy Lemon Squeezy||92.24",
      "7 2020 wk4 Dimes McSorley||Dimes|165.42 over Zimbabwe Swag moneys|Kabul FC||80.30",
      "8 2023 wk4 First pick or bust|Bibi's Boys|Kyle / KASE|178.32 over Kabul FC|||95.14",
      "9 2025 wk7 Chewy's Warriors||Chewy|157.14 over Brioon Omeglemeally|Smert Fellas||76.84",
      "10 2020 wk8 Dimes McSorley||Dimes|153.92 over Team WAP|Easy Peasy Lemon Squeezy||73.78",
    ],
  );

  for (const row of ranked) {
    for (const side of [row.winner, row.loser]) {
      assert.equal(hasOtherRawName(side.seasonName), false, side.seasonName);
      assert.equal(hasOtherRawName(side.currentName), false, side.currentName);
    }
  }
  assert.equal(directory.get(USER_TEAM_ID)?.name, TEAM_7);
  assert.equal(ranked.some((row) => row.season === 2026 && row.week === 8), false);
});

test("the undecided 2026 week 8 game stays out of the ranking and would be 4th", () => {
  assert.equal(wins.pending.length, 1);
  const pending = wins.pending[0];
  assert.equal(pending.winnerTeamId, USER_TEAM_ID);
  assert.equal(pending.loserName, "Dimes McSorley");
  assert.equal(pending.winnerScore, 179.26);
  assert.equal(pending.loserScore, 89.36);
  assert.equal(pending.margin, 89.9);

  const shown = shownPending(
    {
      season: pending.season,
      week: pending.week,
      margin: pending.margin,
      winner: { teamId: pending.winnerTeamId, nameThatSeason: pending.winnerName, score: pending.winnerScore },
      loser: { teamId: pending.loserTeamId, nameThatSeason: pending.loserName, score: pending.loserScore },
    },
    wins.top10.map((row) => row.margin),
    teamAt,
  );
  assert.equal(shown.season, 2026);
  assert.equal(shown.week, 8);
  assert.equal(shown.wouldRank, 4);
  assert.equal(shown.margin.toFixed(2), "89.90");
  assert.equal(line(shown.winner), "Maye i give you a blowj0b||Gerrit|179.26");
  assert.equal(line(shown.loser), "Dimes McSorley||Dimes|89.36");
  assert.equal(shown.winner.currentName, TEAM_7);
  assert.equal(hasOtherRawName(shown.winner.seasonName), false);
  assert.equal(hasOtherRawName(shown.loser.seasonName), false);
});

test("file owners match the nicknames the app already stores", () => {
  const sides = wins.top10.flatMap((row) => [row.winner, row.loser]);
  for (const side of sides) {
    const team = teamAt(side.teamId);
    assert.equal(side.owner, team.owner);
    assert.equal(side.franchiseNow, team.name);
    assert.equal(hasOtherRawName(side.nameThatSeason), false);
    assert.equal(hasOtherRawName(side.franchiseNow), false);
  }
});
