import raw from "@/data/top-scores.json";
import { getTeam, TEAMS } from "@/lib/league";
import { shownSide, wouldRank, type DirectoryTeam, type ShownWinSide } from "./biggest-win-rows.ts";

/*
 * Highest single-week regular-season scores, 2020 through the last final week.
 * A live week stays in `pending` and out of the ranked list. Names go through lib/names.ts.
 */

interface FileRow {
  rank: number;
  season: number;
  week: number;
  gameId: string;
  teamId: number;
  team: string;
  points: number;
  opponentId: number;
  opponent: string;
  opponentScore: number;
  result: string;
}

interface FilePending {
  season: number;
  week: number;
  teamId: number;
  team: string;
  points: number;
  opponent: string;
  opponentScore: number;
  wouldRank: number;
}

interface FileShape {
  gamesConsidered?: number;
  boundary: { twentieth: number; twentyFirst: number; tie: boolean };
  top20: FileRow[];
  pending: FilePending[];
}

const file = raw as FileShape;

function directory(teamId: number): DirectoryTeam {
  const current = getTeam(teamId);
  if (!current) throw new Error(`Top scores reference unknown team ${teamId}`);
  return { name: current.name, owner: current.owner ?? null };
}

export interface HighScore {
  rank: number;
  season: number;
  week: number;
  gameId: string;
  result: string;
  team: ShownWinSide;
  opponent: ShownWinSide;
}

export interface PendingHighScore {
  season: number;
  week: number;
  team: ShownWinSide;
  opponent: ShownWinSide;
  wouldRank: number;
}

export const HIGH_SCORES: HighScore[] = [...file.top20]
  .sort((a, b) => a.rank - b.rank)
  .map((row) => ({
    rank: row.rank,
    season: row.season,
    week: row.week,
    gameId: row.gameId,
    result: row.result,
    team: shownSide(row.season, { teamId: row.teamId, nameThatSeason: row.team, score: row.points }, directory(row.teamId)),
    opponent: shownSide(row.season, { teamId: row.opponentId, nameThatSeason: row.opponent, score: row.opponentScore }, directory(row.opponentId)),
  }));

const rankedPoints = HIGH_SCORES.map((row) => row.team.score);

function idForCurrentName(name: string) {
  const hit = TEAMS.find((entry) => entry.name === name);
  if (!hit) throw new Error("Pending high score names an opponent the team directory does not use");
  return hit.id;
}

export const PENDING_HIGH_SCORES: PendingHighScore[] = file.pending.map((row) => {
  const opponentId = idForCurrentName(row.opponent);
  return {
    season: row.season,
    week: row.week,
    wouldRank: wouldRank(row.points, rankedPoints),
    team: shownSide(row.season, { teamId: row.teamId, nameThatSeason: row.team, score: row.points }, directory(row.teamId)),
    opponent: shownSide(row.season, { teamId: opponentId, nameThatSeason: row.opponent, score: row.opponentScore }, directory(opponentId)),
  };
});

export const HIGH_SCORE_SCOPE = {
  twentieth: file.boundary.twentieth,
  next: file.boundary.twentyFirst,
  tie: file.boundary.tie,
};
