import raw from "../data/playoff-h2h.json" with { type: "json" };

/*
 * Winners-bracket and consolation series from the 2020–2025 ESPN playoff pull.
 * Display names in the file are never read. Callers pass names from lib/names.ts
 * (through team()) when they render a line.
 *
 * This league's winners bracket is four teams and two rounds: two semifinals and
 * one championship. A game the file marks as the championship is labeled
 * "championship"; every other winners-bracket game is a semifinal.
 */

interface RawSide {
  teamId: number;
  score: number;
}

interface RawGame {
  gameId: string;
  season: number;
  matchupPeriod: number;
  bracket: string;
  isChampionship: boolean;
  teamA: RawSide;
  teamB: RawSide;
  winnerTeamId: number | null;
  isTie: boolean;
}

interface RawLastMeeting {
  season: number;
  matchupPeriod: number;
  winnerTeamId: number | null;
  championship: boolean;
}

interface RawWinnersPair {
  teamA: number;
  teamB: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  games: number;
  meetings: string[];
  lastMeeting: RawLastMeeting;
}

interface RawConsolationPair {
  teamA: number;
  teamB: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  games: number;
}

interface RawFile {
  meta: { seasonsCovered: number[]; winnersGames: number; consolationGames: number };
  games: RawGame[];
  winnersBracketH2H: RawWinnersPair[];
  consolationH2H: RawConsolationPair[];
}

const file = raw as RawFile;

export const PLAYOFF_SEASONS: readonly number[] = file.meta.seasonsCovered;

export interface PlayoffSeries {
  teamA: number;
  teamB: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  games: number;
}

export interface WinnersSeries extends PlayoffSeries {
  last: {
    season: number;
    matchupPeriod: number;
    winnerTeamId: number | null;
    championship: boolean;
  };
}

export interface WinnersAppearance {
  season: number;
  matchupPeriod: number;
  championship: boolean;
  opponentId: number;
  result: "W" | "L" | "T";
}

export interface WinnersResume {
  wins: number;
  losses: number;
  ties: number;
  /** Seasons with at least one winners-bracket game, oldest first. */
  seasons: number[];
  /** Newest season first. A championship is listed before that year's semifinal. */
  games: WinnersAppearance[];
}

function pairKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function fail(message: string): never {
  throw new Error(`playoff-h2h.json: ${message}`);
}

const GAME_BY_ID = new Map<string, RawGame>();
for (const game of file.games) {
  if (GAME_BY_ID.has(game.gameId)) fail(`duplicate game ${game.gameId}`);
  if (game.isTie === (game.winnerTeamId != null)) fail(`${game.gameId} tie flag does not match the winner`);
  if (game.bracket !== "winners" && game.bracket !== "consolation") fail(`${game.gameId} has bracket ${game.bracket}`);
  GAME_BY_ID.set(game.gameId, game);
}

const winnersGames = file.games.filter((game) => game.bracket === "winners");
const consolationGames = file.games.filter((game) => game.bracket === "consolation");
if (winnersGames.length !== file.meta.winnersGames) fail(`expected ${file.meta.winnersGames} winners-bracket games, found ${winnersGames.length}`);
if (consolationGames.length !== file.meta.consolationGames) fail(`expected ${file.meta.consolationGames} consolation games, found ${consolationGames.length}`);

const winnersBySeason = new Map<number, RawGame[]>();
for (const game of winnersGames) {
  const list = winnersBySeason.get(game.season) ?? [];
  list.push(game);
  winnersBySeason.set(game.season, list);
}
for (const season of PLAYOFF_SEASONS) {
  const games = winnersBySeason.get(season) ?? [];
  const championships = games.filter((game) => game.isChampionship).length;
  if (games.length !== 3 || championships !== 1) fail(`${season} winners bracket is ${games.length} games, ${championships} championships`);
}

function tally(games: RawGame[]) {
  const totals = new Map<string, { ties: number; wins: Map<number, number> }>();
  for (const game of games) {
    const key = pairKey(game.teamA.teamId, game.teamB.teamId);
    const row = totals.get(key) ?? { ties: 0, wins: new Map<number, number>() };
    if (game.isTie || game.winnerTeamId == null) row.ties += 1;
    else row.wins.set(game.winnerTeamId, (row.wins.get(game.winnerTeamId) ?? 0) + 1);
    totals.set(key, row);
  }
  return totals;
}

function winsFor(row: { ties: number; wins: Map<number, number> }, teamId: number) {
  return row.wins.get(teamId) ?? 0;
}

const WINNERS = new Map<string, WinnersSeries>();
const winnersSeen = new Set<string>();
const winnersTotals = tally(winnersGames);

for (const row of file.winnersBracketH2H) {
  const key = pairKey(row.teamA, row.teamB);
  if (WINNERS.has(key)) fail(`duplicate winners pair ${row.teamA} vs ${row.teamB}`);
  if (row.meetings.length !== row.games) fail(`${row.teamA} vs ${row.teamB} lists ${row.meetings.length} meetings for ${row.games} games`);
  let teamAWins = 0;
  let teamBWins = 0;
  let ties = 0;
  for (const gameId of row.meetings) {
    if (winnersSeen.has(gameId)) fail(`game ${gameId} is listed on two winners pairs`);
    winnersSeen.add(gameId);
    const game = GAME_BY_ID.get(gameId);
    if (!game || game.bracket !== "winners") fail(`${gameId} is not a winners-bracket game`);
    if (pairKey(game.teamA.teamId, game.teamB.teamId) !== key) fail(`${gameId} is not ${row.teamA} vs ${row.teamB}`);
    if (game.isTie || game.winnerTeamId == null) ties += 1;
    else if (game.winnerTeamId === row.teamA) teamAWins += 1;
    else if (game.winnerTeamId === row.teamB) teamBWins += 1;
    else fail(`${gameId} winner ${game.winnerTeamId} is not in the pair`);
  }
  if (teamAWins !== row.teamAWins || teamBWins !== row.teamBWins || ties !== row.ties || teamAWins + teamBWins + ties !== row.games) {
    fail(`${row.teamA} vs ${row.teamB} record does not match its games`);
  }
  const summed = winnersTotals.get(key);
  if (!summed || winsFor(summed, row.teamA) !== row.teamAWins || winsFor(summed, row.teamB) !== row.teamBWins || summed.ties !== row.ties) {
    fail(`${row.teamA} vs ${row.teamB} record does not match the winners-bracket games`);
  }
  const lastId = row.meetings[row.meetings.length - 1];
  const lastGame = lastId ? GAME_BY_ID.get(lastId) : undefined;
  if (!lastGame) fail(`${row.teamA} vs ${row.teamB} has no last meeting`);
  const last = row.lastMeeting;
  if (!last || last.season !== lastGame.season || last.matchupPeriod !== lastGame.matchupPeriod || last.championship !== lastGame.isChampionship || last.winnerTeamId !== lastGame.winnerTeamId) {
    fail(`${row.teamA} vs ${row.teamB} last meeting does not match ${lastGame.gameId}`);
  }
  WINNERS.set(key, {
    teamA: row.teamA,
    teamB: row.teamB,
    teamAWins: row.teamAWins,
    teamBWins: row.teamBWins,
    ties: row.ties,
    games: row.games,
    last: {
      season: lastGame.season,
      matchupPeriod: lastGame.matchupPeriod,
      winnerTeamId: lastGame.winnerTeamId,
      championship: lastGame.isChampionship,
    },
  });
}

for (const game of winnersGames) {
  if (!winnersSeen.has(game.gameId)) fail(`${game.gameId} is missing from winnersBracketH2H`);
}
if (WINNERS.size !== winnersTotals.size) fail("winners pairs do not cover every winners-bracket game");

const CONSOLATION = new Map<string, PlayoffSeries>();
const consolationTotals = tally(consolationGames);
for (const row of file.consolationH2H) {
  const key = pairKey(row.teamA, row.teamB);
  if (CONSOLATION.has(key)) fail(`duplicate consolation pair ${row.teamA} vs ${row.teamB}`);
  const summed = consolationTotals.get(key);
  if (!summed || winsFor(summed, row.teamA) !== row.teamAWins || winsFor(summed, row.teamB) !== row.teamBWins || summed.ties !== row.ties || row.teamAWins + row.teamBWins + row.ties !== row.games) {
    fail(`${row.teamA} vs ${row.teamB} consolation record does not match its games`);
  }
  CONSOLATION.set(key, {
    teamA: row.teamA,
    teamB: row.teamB,
    teamAWins: row.teamAWins,
    teamBWins: row.teamBWins,
    ties: row.ties,
    games: row.games,
  });
}
if (CONSOLATION.size !== consolationTotals.size) fail("consolation pairs do not cover every consolation game");

/** Winners-bracket series for a pair, from either team order. Null when they have never met there. */
export function winnersSeries(a: number, b: number) {
  return WINNERS.get(pairKey(a, b)) ?? null;
}

/** Consolation series for a pair. Separate from the winners bracket and from all-time head-to-head. */
export function consolationSeries(a: number, b: number) {
  return CONSOLATION.get(pairKey(a, b)) ?? null;
}

export function winnersRoundLabel(championship: boolean) {
  return championship ? "championship" : "semifinal";
}

export function playoffRecord(record: { wins: number; losses: number; ties: number }) {
  return record.ties ? `${record.wins}\u2013${record.losses}\u2013${record.ties}` : `${record.wins}\u2013${record.losses}`;
}

function oriented(series: PlayoffSeries, perspectiveId: number) {
  if (perspectiveId === series.teamA) return { wins: series.teamAWins, losses: series.teamBWins, ties: series.ties };
  if (perspectiveId === series.teamB) return { wins: series.teamBWins, losses: series.teamAWins, ties: series.ties };
  throw new Error(`Team ${perspectiveId} is not in the ${series.teamA} vs ${series.teamB} playoff series`);
}

export interface WinnersLine {
  /** "Playoffs: 1–1 (last: 2021 semifinal, Maye won)" */
  text: string;
  record: string;
  /** "last: 2021 semifinal, Maye won" */
  last: string;
}

/** Winners-bracket sentence. `perspectiveId` is listed first. `nameOf` supplies the winner's display name. */
export function winnersLine(series: WinnersSeries, perspectiveId: number, nameOf: (teamId: number) => string): WinnersLine {
  const record = playoffRecord(oriented(series, perspectiveId));
  const ending = series.last.winnerTeamId == null ? "tie" : `${nameOf(series.last.winnerTeamId)} won`;
  const last = `last: ${series.last.season} ${winnersRoundLabel(series.last.championship)}, ${ending}`;
  return { record, last, text: `Playoffs: ${record} (${last})` };
}

export function consolationLine(series: PlayoffSeries, perspectiveId: number) {
  return `Consolation: ${playoffRecord(oriented(series, perspectiveId))}`;
}

const RESUMES = new Map<number, WinnersResume>();
for (const game of winnersGames) {
  for (const teamId of [game.teamA.teamId, game.teamB.teamId]) {
    const opponentId = teamId === game.teamA.teamId ? game.teamB.teamId : game.teamA.teamId;
    const result: WinnersAppearance["result"] = game.isTie || game.winnerTeamId == null ? "T" : game.winnerTeamId === teamId ? "W" : "L";
    const resume = RESUMES.get(teamId) ?? { wins: 0, losses: 0, ties: 0, seasons: [], games: [] };
    if (result === "W") resume.wins += 1;
    else if (result === "L") resume.losses += 1;
    else resume.ties += 1;
    resume.games.push({ season: game.season, matchupPeriod: game.matchupPeriod, championship: game.isChampionship, opponentId, result });
    RESUMES.set(teamId, resume);
  }
}
for (const resume of RESUMES.values()) {
  resume.games.sort((a, b) => b.season - a.season || Number(b.championship) - Number(a.championship) || b.matchupPeriod - a.matchupPeriod);
  resume.seasons = [...new Set(resume.games.map((game) => game.season))].sort((a, b) => a - b);
}

const EMPTY_RESUME: WinnersResume = Object.freeze({ wins: 0, losses: 0, ties: 0, seasons: [], games: [] });

/** One franchise's winners-bracket record and the games that make it up. */
export function winnersResume(teamId: number): WinnersResume {
  return RESUMES.get(teamId) ?? EMPTY_RESUME;
}
