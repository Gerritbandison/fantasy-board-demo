import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { shownSide, wouldRank, type DirectoryTeam } from "./biggest-win-rows.ts";
import { franchiseName, hasOtherRawName, USER_TEAM_ID } from "./names.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEAM_7 = "Maye i give you a blowj0b";

interface TeamFile {
  teams: { teamId: number; displayName: string; espnName?: string | null; ownerLabelFromApp: string | null }[];
}

interface ScoreRow {
  rank: number;
  season: number;
  week: number;
  teamId: number;
  team: string;
  franchiseNow: string;
  owner: string | null;
  points: number;
  opponentId: number;
  opponent: string;
  opponentScore: number;
  result: string;
}

interface ScoresFile {
  boundary: { twentieth: number; twentyFirst: number; tie: boolean };
  top20: ScoreRow[];
  pending: {
    season: number;
    week: number;
    teamId: number;
    team: string;
    points: number;
    opponent: string;
    opponentScore: number;
    wouldRank: number;
  }[];
}

const scores = JSON.parse(readFileSync(join(root, "data/top-scores.json"), "utf8")) as ScoresFile;
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

test("top 20 is final regular-season weeks, ranked by points, with directory names", () => {
  assert.equal(scores.top20.length, 20);
  assert.equal(scores.boundary.tie, false);
  assert.equal(scores.boundary.twentieth, 172.36);
  assert.equal(scores.boundary.twentyFirst, 171.92);

  const ranked = [...scores.top20].sort((a, b) => a.rank - b.rank);
  assert.deepEqual(
    ranked.map((row) => row.rank),
    Array.from({ length: 20 }, (_, i) => i + 1),
  );
  const points = ranked.map((row) => row.points);
  assert.deepEqual(points, [...points].sort((a, b) => b - a));
  for (let i = 1; i < points.length; i++) assert.ok(points[i - 1] > points[i]);
  assert.equal(points[0], 192.68);
  assert.equal(points.at(-1), 172.36);
  assert.equal(points[7], 179.26);

  const first = ranked[0];
  const shown = shownSide(first.season, { teamId: first.teamId, nameThatSeason: first.team, score: first.points }, teamAt(first.teamId));
  assert.equal(first.season, 2024);
  assert.equal(first.week, 11);
  assert.equal(first.teamId, USER_TEAM_ID);
  assert.equal(shown.seasonName, "Mixon Impossible");
  assert.equal(shown.currentName, TEAM_7);
  assert.equal(shown.showCurrent, true);
  assert.equal(shown.owner, "Gerrit");
  assert.equal(shown.score.toFixed(2), "192.68");

  const last = ranked[19];
  const lastShown = shownSide(last.season, { teamId: last.teamId, nameThatSeason: last.team, score: last.points }, teamAt(last.teamId));
  assert.equal(last.season, 2021);
  assert.equal(last.week, 1);
  assert.equal(lastShown.seasonName, "YOU LIKE THAT YOU LIKE THAT");
  assert.equal(lastShown.currentName, "All Heart");
  assert.equal(lastShown.owner, null);
  assert.equal(last.points, 172.36);

  for (const row of ranked) {
    const current = teamAt(row.teamId);
    const opp = teamAt(row.opponentId);
    assert.equal(row.franchiseNow, current.name);
    assert.equal(row.owner, current.owner);
    assert.equal(hasOtherRawName(row.team), false, row.team);
    assert.equal(hasOtherRawName(row.opponent), false, row.opponent);
    assert.equal(hasOtherRawName(row.franchiseNow), false);
    assert.equal(hasOtherRawName(opp.name), false);
  }
  const promoted = ranked.find((row) => row.season === 2026 && row.week === 8);
  assert.equal(promoted?.rank, 8);
  assert.equal(promoted?.teamId, USER_TEAM_ID);
  assert.equal(promoted?.points, 179.26);
  assert.equal(promoted?.team, TEAM_7);
});

test("Gerrit's final 179.26 is rank 8 and nothing is still pending", () => {
  assert.equal(scores.pending.length, 0);
  const ranked = [...scores.top20].sort((a, b) => a.rank - b.rank);
  const row = ranked[7];
  assert.equal(row.teamId, USER_TEAM_ID);
  assert.equal(row.team, TEAM_7);
  assert.equal(row.points, 179.26);
  assert.equal(row.opponent, "Dimes McSorley");
  assert.equal(row.opponentScore, 89.36);
  assert.equal(row.season, 2026);
  assert.equal(row.week, 8);
  assert.equal(row.result, "W");

  const shown = shownSide(row.season, { teamId: row.teamId, nameThatSeason: row.team, score: row.points }, teamAt(row.teamId));
  assert.equal(shown.currentName, TEAM_7);
  assert.equal(shown.owner, "Gerrit");
  assert.equal(shown.showCurrent, false);
  assert.equal(hasOtherRawName(shown.seasonName), false);
  assert.equal(hasOtherRawName(row.opponent), false);
  assert.equal(wouldRank(row.points, ranked.filter((item) => item !== row).map((item) => item.points)), 8);
});
