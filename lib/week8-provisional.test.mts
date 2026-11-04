import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface Weekly {
  week: number;
  pointsFor: number;
  pointsAgainst: number;
  result: string;
  provisional?: boolean;
  opponentTeamId: number;
}

interface TeamRow {
  teamId: number;
  record: { wins: number; losses: number };
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  playoffSeed: number;
  weekly: Weekly[];
  seasonStats: { highScore: number; lowScore: number; gamesScored: number };
  week8: {
    currentPoints: number;
    opponentCurrentPoints: number;
    status: string;
    opponentTeamId: number;
    starters?: unknown;
    startersFinal?: unknown;
  };
}

interface Standing {
  teamId: number;
  rank: number;
  playoffSeed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

interface Week8Game {
  homeTeamId: number;
  awayTeamId: number;
  homeCurrentPoints: number;
  awayCurrentPoints: number;
  winner: string;
  status: string;
  margin: number | null;
}

interface LeagueFile {
  meta: { currentWeek: number; weekInProgress: { week: number; final: boolean; label: string } };
  schedule: { weeks1to7: { week: number }[]; week8: Week8Game[] };
  standings: Standing[];
  teams: TeamRow[];
}

interface ModelTeam {
  id: number;
  wins: number;
  losses: number;
  pf: number;
}

interface ModelGame {
  week: number;
  homeId: number;
  awayId: number;
  homeCurrent?: number;
  awayCurrent?: number;
  counted?: boolean;
}

interface ProjectedRow {
  teamId: number;
  record_thru_wk8: string;
  pf_thru_wk8: number;
  playoff_odds: number;
  avg_seed: number;
  projected_rank: number;
}

const league = JSON.parse(readFileSync(join(root, "data/league-all-teams.json"), "utf8")) as LeagueFile;
const model = JSON.parse(readFileSync(join(root, "data/playoff-model.json"), "utf8")) as { teams: ModelTeam[]; games: ModelGame[] };
const projected = JSON.parse(readFileSync(join(root, "data/projected-standings.json"), "utf8")) as { standings: ProjectedRow[] };

const round2 = (n: number) => Math.round(n * 100) / 100;

test("week 8 finals are in the season totals and decided on the schedule", () => {
  assert.equal(league.meta.currentWeek, 8);
  assert.equal(league.meta.weekInProgress.week, 8);
  assert.equal(league.meta.weekInProgress.final, true);
  assert.equal(league.schedule.weeks1to7.some((game) => game.week === 8), false);

  const finals = [
    { home: 11, away: 5, homeScore: 114.92, awayScore: 97.66, winner: "HOME", margin: 17.26 },
    { home: 10, away: 6, homeScore: 128.48, awayScore: 95.1, winner: "HOME", margin: 33.38 },
    { home: 4, away: 2, homeScore: 120.64, awayScore: 103.68, winner: "HOME", margin: 16.96 },
    { home: 3, away: 1, homeScore: 116.1, awayScore: 147.78, winner: "AWAY", margin: 31.68 },
    { home: 7, away: 8, homeScore: 179.26, awayScore: 89.36, winner: "HOME", margin: 89.9 },
  ];
  for (const expected of finals) {
    const game = league.schedule.week8.find((row) => row.homeTeamId === expected.home && row.awayTeamId === expected.away);
    assert.ok(game, `missing ${expected.home} vs ${expected.away}`);
    assert.equal(game.winner, expected.winner);
    assert.equal(game.status, "final");
    assert.equal(game.homeCurrentPoints, expected.homeScore);
    assert.equal(game.awayCurrentPoints, expected.awayScore);
    assert.equal(game.margin, expected.margin);
  }

  for (const team of league.teams) {
    const week8 = team.weekly.find((row) => row.week === 8);
    assert.ok(week8, `team ${team.teamId} missing week 8`);
    assert.equal(week8.provisional, undefined);
    assert.equal(team.weekly.filter((row) => row.week === 8).length, 1);
    assert.equal(team.pointsFor, round2(team.weekly.reduce((sum, row) => sum + row.pointsFor, 0)));
    assert.equal(team.pointsAgainst, round2(team.weekly.reduce((sum, row) => sum + row.pointsAgainst, 0)));
    assert.equal(team.record.wins, team.weekly.filter((row) => row.result === "W").length);
    assert.equal(team.record.losses, team.weekly.filter((row) => row.result === "L").length);
    assert.equal(team.week8.currentPoints, week8.pointsFor);
    assert.equal(team.week8.opponentCurrentPoints, week8.pointsAgainst);
    assert.equal(team.week8.status, "final");
    assert.equal(team.week8.opponentTeamId, week8.opponentTeamId);
    assert.equal(team.week8.starters, undefined);
    assert.equal(team.week8.startersFinal, undefined);
    assert.equal(team.seasonStats.gamesScored, 8);
    assert.equal(team.seasonStats.highScore, Math.max(...team.weekly.map((row) => row.pointsFor)));
    assert.equal(team.playoffSeed, team.rank);

    const standing = league.standings.find((row) => row.teamId === team.teamId);
    assert.ok(standing);
    assert.equal(standing.pointsFor, team.pointsFor);
    assert.equal(standing.pointsAgainst, team.pointsAgainst);
    assert.equal(standing.wins, team.record.wins);
    assert.equal(standing.losses, team.record.losses);
    assert.equal(standing.rank, team.rank);
    assert.equal(standing.playoffSeed, team.rank);

    const modelTeam = model.teams.find((row) => row.id === team.teamId);
    assert.ok(modelTeam);
    assert.equal(modelTeam.pf, team.pointsFor);
    assert.equal(modelTeam.wins, team.record.wins);
    assert.equal(modelTeam.losses, team.record.losses);
  }

  const byRule = [...league.teams].sort((a, b) => b.record.wins - a.record.wins || b.pointsFor - a.pointsFor);
  byRule.forEach((team, index) => assert.equal(team.rank, index + 1, `team ${team.teamId}`));

  const focus = league.teams.find((team) => team.teamId === 7);
  assert.ok(focus);
  assert.equal(focus.pointsFor, 950.42);
  assert.equal(focus.record.wins, 3);
  assert.equal(focus.record.losses, 5);
  assert.equal(focus.rank, 9);
  const live = focus.weekly.find((row) => row.week === 8);
  assert.equal(live?.pointsFor, 179.26);
  assert.equal(live?.pointsAgainst, 89.36);
  assert.equal(live?.result, "W");

  const counted = model.games.filter((game) => game.week === 8);
  assert.equal(counted.length, 5);
  assert.ok(counted.every((game) => game.counted === true));
  const focusGame = counted.find((game) => game.homeId === 7);
  assert.equal(focusGame?.awayId, 8);
  assert.equal(focusGame?.homeCurrent, 179.26);
  assert.equal(focusGame?.awayCurrent, 89.36);
});

test("projected standings use the final records and rank by average seed", () => {
  assert.equal(projected.standings.length, 10);
  const odds = projected.standings.reduce((sum, row) => sum + row.playoff_odds, 0);
  assert.ok(Math.abs(odds - 4) < 0.02, `playoff odds sum ${odds}`);
  const bySeed = [...projected.standings].sort((a, b) => a.avg_seed - b.avg_seed || a.teamId - b.teamId);
  assert.deepEqual(
    bySeed.map((row) => row.projected_rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );

  for (const row of projected.standings) {
    const team = league.teams.find((entry) => entry.teamId === row.teamId);
    assert.ok(team);
    assert.equal(row.record_thru_wk8, `${team.record.wins}-${team.record.losses}`);
    assert.equal(row.pf_thru_wk8, team.pointsFor);
  }
});
