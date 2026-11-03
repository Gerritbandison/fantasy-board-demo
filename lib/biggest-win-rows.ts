import { cleanName, hasOtherRawName, publicSeasonName } from "./names.ts";

/**
 * Display rows for the all-time biggest regular-season wins.
 * Every name passes through lib/names.ts. Current names come from the team
 * directory (team 7 keeps ESPN's name); season names come from the data file.
 */

export interface DirectoryTeam {
  name: string;
  owner: string | null;
}

export interface RawWinSide {
  teamId: number;
  nameThatSeason: string;
  score: number;
}

export interface ShownWinSide {
  teamId: number;
  /** Franchise name that season, safe to render on its own. */
  seasonName: string;
  /** Current franchise name from the team directory. */
  currentName: string;
  /** App owner nickname, only when that slot already has one. */
  owner: string | null;
  score: number;
  /** True when the season label is a different name than the franchise uses now. */
  showCurrent: boolean;
}

export interface ShownWin {
  rank: number;
  season: number;
  week: number;
  gameId: string;
  winner: ShownWinSide;
  loser: ShownWinSide;
  margin: number;
}

export interface ShownPending {
  season: number;
  week: number;
  winner: ShownWinSide;
  loser: ShownWinSide;
  margin: number;
  /** 1-based place this margin would take among the final top 10. */
  wouldRank: number;
}

function checked(value: string) {
  if (hasOtherRawName(value)) throw new Error("Biggest-wins name failed the clean-name check");
  return value;
}

/** Season label plus the current franchise name and owner, when either adds something. */
export function shownSide(season: number, side: RawWinSide, current: DirectoryTeam): ShownWinSide {
  const currentName = checked(cleanName(current.name));
  const seasonName = checked(publicSeasonName(currentName, season, side.nameThatSeason));
  const retiredForm = `${currentName} (${season})`;
  return {
    teamId: side.teamId,
    seasonName,
    currentName,
    owner: current.owner,
    score: side.score,
    showCurrent: seasonName !== currentName && seasonName !== retiredForm,
  };
}

/** Place a not-yet-final margin would take if it were ranked with the final games. */
export function wouldRank(margin: number, rankedMargins: number[]) {
  return rankedMargins.filter((ranked) => ranked > margin).length + 1;
}

export function shownWin(
  row: { rank: number; season: number; week: number; gameId: string; margin: number; winner: RawWinSide; loser: RawWinSide },
  teamAt: (teamId: number) => DirectoryTeam,
): ShownWin {
  return {
    rank: row.rank,
    season: row.season,
    week: row.week,
    gameId: row.gameId,
    margin: row.margin,
    winner: shownSide(row.season, row.winner, teamAt(row.winner.teamId)),
    loser: shownSide(row.season, row.loser, teamAt(row.loser.teamId)),
  };
}

export function shownPending(
  row: { season: number; week: number; margin: number; winner: RawWinSide; loser: RawWinSide },
  rankedMargins: number[],
  teamAt: (teamId: number) => DirectoryTeam,
): ShownPending {
  return {
    season: row.season,
    week: row.week,
    margin: row.margin,
    wouldRank: wouldRank(row.margin, rankedMargins),
    winner: shownSide(row.season, row.winner, teamAt(row.winner.teamId)),
    loser: shownSide(row.season, row.loser, teamAt(row.loser.teamId)),
  };
}
