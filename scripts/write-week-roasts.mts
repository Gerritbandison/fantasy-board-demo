import { readFileSync, writeFileSync } from "node:fs";
import { draftRoastCard, type GameInput, type SideInput } from "../lib/commentary.ts";
import { franchiseName } from "../lib/names.ts";

interface Weekly {
  week: number;
  result: string;
  provisional?: boolean;
}
interface TeamRow {
  teamId: number;
  displayName: string;
  espnName?: string | null;
  record: { wins: number; losses: number };
  weekly: Weekly[];
}
interface GameRow {
  week?: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore?: number;
  awayScore?: number;
  homeProjected?: number;
  awayProjected?: number;
  homeCurrentPoints?: number;
  awayCurrentPoints?: number;
}
interface LeagueFile {
  meta: { currentWeek: number; weekInProgress?: { final?: boolean; asOf?: string } };
  teams: TeamRow[];
  schedule: { completed?: GameRow[]; weeks1to7?: GameRow[] } & { [key: string]: unknown };
}

const league = JSON.parse(readFileSync("data/league-all-teams.json", "utf8")) as LeagueFile;
const weekArg = process.argv.find((arg) => arg.startsWith("--week="));
const week = weekArg ? Number(weekArg.slice("--week=".length)) : league.meta.currentWeek;

const names = new Map(
  league.teams.map((team) => [team.teamId, franchiseName(team.teamId, team.displayName, team.espnName)]),
);

function streak(team: TeamRow) {
  let count = 0;
  for (const row of [...team.weekly].reverse()) {
    if (row.provisional) continue;
    if (row.result !== "L") break;
    count += 1;
  }
  return count;
}

function side(teamId: number, points: number, projected: number | undefined): SideInput {
  const team = league.teams.find((row) => row.teamId === teamId);
  if (!team) throw new Error(`missing team ${teamId}`);
  return {
    name: names.get(teamId) ?? String(teamId),
    points,
    projected: projected ?? null,
    wins: team.record.wins,
    losses: team.record.losses,
    lossesInARow: streak(team),
  };
}

const weekKeyGames = league.schedule[`week${week}`];
const completedPool = [...(league.schedule.completed ?? []), ...(league.schedule.weeks1to7 ?? [])];
const games: GameRow[] = Array.isArray(weekKeyGames)
  ? (weekKeyGames as GameRow[])
  : completedPool.filter((game) => game.week === week);

const isLive = week === league.meta.currentWeek && league.meta.weekInProgress?.final === false;

const matchups = games.map((game) => {
  const homePts = game.homeCurrentPoints ?? game.homeScore ?? 0;
  const awayPts = game.awayCurrentPoints ?? game.awayScore ?? 0;
  const input: GameInput = {
    state: isLive ? "live" : "final",
    seed: week * 100 + game.homeTeamId * 10 + game.awayTeamId,
    left: side(game.homeTeamId, homePts, game.homeProjected),
    right: side(game.awayTeamId, awayPts, game.awayProjected),
  };
  const card = draftRoastCard(input);
  return {
    matchupId: `${week}-${game.homeTeamId}v${game.awayTeamId}`,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    homePoints: homePts,
    awayPoints: awayPts,
    headline: card.headline,
    roast: card.roast,
    projection: { home: game.homeProjected ?? null, away: game.awayProjected ?? null },
    tag: card.tag,
  };
});

const file = {
  week,
  dataPulledAt: league.meta.weekInProgress?.asOf ?? new Date().toISOString(),
  note: "Drafted by scripts/write-week-roasts.mts. Check every number against the scoreboard before committing.",
  matchups,
};

const body = `${JSON.stringify(file, null, 2)}\n`;
if (process.argv.includes("--write")) {
  writeFileSync("data/week-roasts.json", body);
  console.log(`wrote data/week-roasts.json for week ${week}`);
} else {
  console.log(body);
}
