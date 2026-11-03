import raw from "@/data/biggest-wins.json";
import { getTeam } from "@/lib/league";
import { shownPending, shownWin, type DirectoryTeam, type ShownPending, type ShownWin } from "./biggest-win-rows.ts";

export type { ShownPending, ShownWin, ShownWinSide } from "./biggest-win-rows.ts";

/*
 * Largest single-week regular-season margins, 2020 through the current season.
 * Playoffs and consolation games are already excluded from the file. Pending
 * weeks stay out of the ranked list. Names are rendered only after lib/names.ts.
 */

interface FileSide {
  teamId: number;
  nameThatSeason: string;
  score: number;
}

interface FileWin {
  rank: number;
  season: number;
  week: number;
  gameId: string;
  margin: number;
  winner: FileSide;
  loser: FileSide;
}

interface FilePending {
  season: number;
  week: number;
  winnerTeamId: number;
  winnerName: string;
  loserTeamId: number;
  loserName: string;
  winnerScore: number;
  loserScore: number;
  margin: number;
}

interface FileShape {
  seasonsCovered: number[];
  gamesConsidered: number;
  boundary: { tenthMargin: number; eleventh: { season: number; week: number; margin: number }; tieAtBoundary: boolean };
  top10: FileWin[];
  pending: FilePending[];
}

const file = raw as FileShape;

function directory(teamId: number): DirectoryTeam {
  const team = getTeam(teamId);
  if (!team) throw new Error(`Biggest wins reference unknown team ${teamId}`);
  return { name: team.name, owner: team.owner ?? null };
}

export const BIGGEST_WINS: ShownWin[] = [...file.top10]
  .sort((a, b) => a.rank - b.rank)
  .map((row) => shownWin(row, directory));

const rankedMargins = BIGGEST_WINS.map((row) => row.margin);

export const PENDING_BIGGEST_WINS: ShownPending[] = file.pending.map((row) =>
  shownPending(
    {
      season: row.season,
      week: row.week,
      margin: row.margin,
      winner: { teamId: row.winnerTeamId, nameThatSeason: row.winnerName, score: row.winnerScore },
      loser: { teamId: row.loserTeamId, nameThatSeason: row.loserName, score: row.loserScore },
    },
    rankedMargins,
    directory,
  ),
);

const seasons = [...file.seasonsCovered].sort((a, b) => a - b);

export const BIGGEST_WINS_SCOPE = {
  from: seasons[0],
  to: seasons[seasons.length - 1],
  games: file.gamesConsidered,
  tenth: file.boundary.tenthMargin,
  nextSeason: file.boundary.eleventh.season,
  nextWeek: file.boundary.eleventh.week,
  nextMargin: file.boundary.eleventh.margin,
  tie: file.boundary.tieAtBoundary,
};
