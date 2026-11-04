import { readFileSync, writeFileSync } from "node:fs";
import { draftRoastCard, type GameInput, type SideInput } from "../lib/commentary.ts";

interface Weekly {
  week: number;
  result: string;
  provisional?: boolean;
}
interface TeamRow {
  teamId: number;
  displayName: string;
  espnName?: string;
  record: { wins: number; losses: number };
  weekly: Weekly[];
}
interface GameRow {
  week?: number;
  homeTeamId: number;
  awayTeamId: number;
  homeProjected?: number;
  awayProjected?: number;
  homeCurrentPoints?: number;
  awayCurrentPoints?: number;
}
interface LeagueFile {
  meta: { currentWeek: number; weekInProgress?: { final?: boolean; asOf?: string } };
  teams: TeamRow[];
  schedule: { week8?: GameRow[]; weeks1to7?: { games: GameRow[] }[] };
}

const league = JSON.parse(readFileSync("data/league-all-teams.json", "utf8")) as LeagueFile;
const week = league.meta.currentWeek;
const names = new Map(
  league.teams.map((team) => [team.teamId, team.teamId === 7 && team.espnName ? team.espnName : team.displayName]),
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

const games =
  week === 8
    ? (league.schedule.week8 ?? [])
    : (league.schedule.weeks1to7?.find((row) => row.games.some((game) => game.week === week))?.games.filter((game) => game.week === week) ?? []);

const matchups = games.map((game) => {
  const input: GameInput = {
    state: league.meta.weekInProgress?.final === false ? "live" : "final",
    seed: week * 100 + game.homeTeamId * 10 + game.awayTeamId,
    left: side(game.homeTeamId, game.homeCurrentPoints ?? 0, game.homeProjected),
    right: side(game.awayTeamId, game.awayCurrentPoints ?? 0, game.awayProjected),
  };
  const card = draftRoastCard(input);
  return {
    matchupId: `${week}-${game.homeTeamId}v${game.awayTeamId}`,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    homePoints: game.homeCurrentPoints ?? 0,
    awayPoints: game.awayCurrentPoints ?? 0,
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
