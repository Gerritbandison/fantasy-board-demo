import raw from "../data/league-all-teams.json" with { type: "json" };
import playoffRaw from "../data/playoff-model.json" with { type: "json" };
import { franchiseAbbrev, franchiseName, isRetiredSeasonName, publicSeasonName } from "./names.ts";
import { matchupState, projectionActual, selectScoreboard, type MatchupState, type WeekGame } from "./week-state.ts";

/*
 * The committed Flaim/ESPN pull is the single source of truth. For every franchise
 * except team 7, raw ESPN names and abbreviations are dropped while mapping, so
 * only `displayName` and the app abbreviation survive. Team 7 keeps ESPN's name
 * and uses ESPN's abbreviation when that abbreviation is not MAYE.
 */

interface RawPlayer {
  name: string;
  position: string;
  nflTeam: string | null;
  lineupSlot: string;
  injuryStatus: string | null;
  byeWeek?: number | null;
}

interface RawWeek {
  week: number;
  opponentTeamId: number;
  homeAway: string;
  pointsFor: number;
  pointsAgainst: number;
  result: string;
  projected: number | null;
  /** Live score for a week ESPN has not finalized. */
  provisional?: boolean;
}

interface RawSeason {
  season: number;
  displayName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number | null;
  pointsAgainst: number | null;
  regularSeasonSeed: number | null;
  finalRank: number | null;
  championshipWon: boolean | null;
  playoffOutcome: string | null;
}

interface RawTeam {
  teamId: number;
  displayName: string;
  displayAbbrev: string;
  /** Present on the pull. Team 7 renders this name; other franchises keep `displayName`. */
  espnName?: string | null;
  /** Present on the pull. Team 7 uses this when it is not MAYE. */
  espnAbbrev?: string | null;
  ownerLabelFromApp: string | null;
  isUserTeam: boolean;
  record: { wins: number; losses: number; ties: number; winPercentage: number };
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  playoffSeed: number;
  currentProjectedRank: number | null;
  draftDayProjectedRank: number | null;
  weekly: RawWeek[];
  week8: { opponentTeamId: number; homeAway: string; projected: number | null; opponentProjected: number | null } | null;
  roster: { starters: RawPlayer[]; bench: RawPlayer[]; ir: RawPlayer[] };
  recentTransactions: { date: string | null; week: number | null; type: string; added: string[]; dropped: string[]; faabBid: number | null }[];
  history: {
    seasons: RawSeason[];
    titles: number;
    titleYears: number[];
    finalsAppearances: number;
    finalsYears: number[];
    bestFinish: number | null;
    number1Seeds: number[];
    allTimeRegularSeason: { wins: number; losses: number; ties: number } | null;
  };
}

interface RawGame {
  week: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  homeProjected: number | null;
  awayProjected: number | null;
  winnerTeamId: number | null;
  margin: number;
}

interface RawWeek8Game {
  homeTeamId: number;
  awayTeamId: number;
  homeProjected: number | null;
  awayProjected: number | null;
  /** Fantasy points already scored this week. 0 is a real zero, not "not started". */
  homeCurrentPoints?: number | null;
  awayCurrentPoints?: number | null;
  /** "HOME", "AWAY", or "UNDECIDED". */
  winner?: string | null;
  /** "in-progress" once the week has started, even if a team is still on 0. */
  status?: string | null;
  week?: number;
  margin?: number | null;
}

interface RawChampion {
  season: number;
  championTeamId: number;
  championSeed: number | null;
  runnerUpTeamId: number | null;
  runnerUpSeed: number | null;
}

interface RawFile {
  meta: {
    generatedAt: string;
    source: string;
    leagueId: string;
    season: number;
    currentWeek: number;
    weekInProgress?: { week: number; final: boolean; label: string; asOf?: string };
  };
  league: { name: string; size: number; previousSeasons: number[] };
  schedule: { weeks1to7?: RawGame[]; completed?: RawGame[]; week8?: RawWeek8Game[] } & { [key: string]: unknown };
  champions: RawChampion[];
  teams: RawTeam[];
}

const file = raw as unknown as RawFile;

export interface Player {
  name: string;
  position: string;
  nflTeam?: string;
  slot: string;
  status?: string;
  /** True when the player's NFL bye is the current league week. */
  onBye?: boolean;
}

export interface TeamWeek {
  week: number;
  opponentId: number;
  home: boolean;
  pf: number;
  pa: number;
  result: "W" | "L" | "T";
  projected?: number;
  /** The score is live. The result is the current leader, not a final. */
  provisional?: boolean;
}

export interface Season {
  season: number;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor?: number;
  pointsAgainst?: number;
  seed?: number;
  finish?: number;
  champion: boolean;
  outcome?: string;
}

export interface Move {
  date?: string;
  week?: number;
  type: string;
  added: string[];
  dropped: string[];
  faabBid?: number;
}

export interface Team {
  id: number;
  name: string;
  abbrev: string;
  color: string;
  /** App nickname for the owner; only present for a few teams. Owner names are not in the data. */
  owner?: string;
  isUser: boolean;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  seed: number;
  projectedRank?: number;
  draftRank?: number;
  weekly: TeamWeek[];
  week8?: { opponentId: number; projected?: number; opponentProjected?: number };
  roster: { starters: Player[]; bench: Player[]; ir: Player[] };
  moves: Move[];
  history: {
    seasons: Season[];
    titles: number;
    titleYears: number[];
    finalsYears: number[];
    bestFinish?: number;
    number1Seeds: number[];
    allTime?: { wins: number; losses: number; ties: number };
  };
}

const COLORS: { [id: number]: string } = {
  1: "#2563eb",
  2: "#0f766e",
  3: "#c2410c",
  4: "#be185d",
  5: "#a16207",
  6: "#6d28d9",
  7: "#15803d",
  8: "#0e7490",
  10: "#4d7c0f",
  11: "#b91c1c",
};

const nn = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

function player(p: RawPlayer): Player {
  return {
    name: p.name,
    position: p.position,
    nflTeam: nn(p.nflTeam),
    slot: p.lineupSlot,
    status: nn(p.injuryStatus),
    onBye: p.byeWeek === file.meta.currentWeek ? true : undefined,
  };
}

export { isRetiredSeasonName, publicSeasonName };

export const TEAMS: Team[] = file.teams.map((t) => ({
  id: t.teamId,
  name: franchiseName(t.teamId, t.displayName, t.espnName),
  abbrev: franchiseAbbrev(t.teamId, t.displayAbbrev, t.espnAbbrev),
  color: COLORS[t.teamId] ?? "#64748b",
  owner: nn(t.ownerLabelFromApp),
  isUser: t.isUserTeam,
  wins: t.record.wins,
  losses: t.record.losses,
  ties: t.record.ties,
  pointsFor: t.pointsFor,
  pointsAgainst: t.pointsAgainst,
  rank: t.rank,
  seed: t.playoffSeed,
  projectedRank: nn(t.currentProjectedRank),
  draftRank: nn(t.draftDayProjectedRank),
  weekly: t.weekly.map((w) => ({
    week: w.week,
    opponentId: w.opponentTeamId,
    home: w.homeAway === "home",
    pf: w.pointsFor,
    pa: w.pointsAgainst,
    result: w.result as TeamWeek["result"],
    projected: nn(w.projected),
    provisional: w.provisional ? true : undefined,
  })),
  week8: currentWeekSide(t),
  roster: { starters: t.roster.starters.map(player), bench: t.roster.bench.map(player), ir: t.roster.ir.map(player) },
  moves: t.recentTransactions.map((m) => ({
    date: nn(m.date),
    week: nn(m.week),
    type: m.type,
    added: m.added,
    dropped: m.dropped,
    faabBid: m.faabBid ? m.faabBid : undefined,
  })),
  history: {
    seasons: t.history.seasons.map((s) => ({
      season: s.season,
      name: publicSeasonName(franchiseName(t.teamId, t.displayName, t.espnName), s.season, s.displayName),
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      pointsFor: nn(s.pointsFor),
      pointsAgainst: nn(s.pointsAgainst),
      seed: nn(s.regularSeasonSeed),
      finish: nn(s.finalRank),
      champion: s.championshipWon === true,
      outcome: nn(s.playoffOutcome),
    })),
    titles: t.history.titles,
    titleYears: t.history.titleYears,
    finalsYears: t.history.finalsYears,
    bestFinish: nn(t.history.bestFinish),
    number1Seeds: t.history.number1Seeds,
    allTime: nn(t.history.allTimeRegularSeason),
  },
}));

const BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

export function getTeam(id: number) {
  return BY_ID.get(id);
}

export function team(id: number): Team {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`Unknown team ${id}`);
  return t;
}

export const USER_TEAM = TEAMS.find((t) => t.isUser) ?? team(7);

export const LEAGUE = {
  id: file.meta.leagueId,
  name: file.league.name,
  size: file.league.size,
  season: file.meta.season,
  week: file.meta.currentWeek,
  generatedAt: file.meta.generatedAt,
  source: file.meta.source,
  seasonsOnRecord: [...file.league.previousSeasons, file.meta.season].sort((a, b) => a - b),
  /** Set while the current week is still being played. Records and points for include it. */
  provisionalLabel: file.meta.weekInProgress?.final === false ? file.meta.weekInProgress.label : null,
};

export const STANDINGS = [...TEAMS].sort((a, b) => a.rank - b.rank);

export interface GameSide {
  teamId: number;
  score: number;
  projected?: number;
}

export interface Game {
  week: number;
  home: GameSide;
  away: GameSide;
  winnerId?: number;
  margin: number;
}

interface ModelPairing {
  week: number;
  homeId: number;
  awayId: number;
  homeProj: number;
  awayProj: number;
  counted?: boolean;
}

const modelGames = (playoffRaw as { games: ModelPairing[] }).games;

/** Uncounted games after the scoreboard week. Used only when `schedule.week{N+1}` is not on the league file. */
function futurePairings(currentWeek: number) {
  const by = new Map<number, WeekGame[]>();
  for (const game of modelGames) {
    if (game.counted || game.week <= currentWeek) continue;
    const list = by.get(game.week) ?? [];
    list.push({
      homeTeamId: game.homeId,
      awayTeamId: game.awayId,
      homeProjected: game.homeProj,
      awayProjected: game.awayProj,
      week: game.week,
    });
    by.set(game.week, list);
  }
  return [...by.entries()].map(([week, games]) => ({ week, games }));
}

const scoreboard = selectScoreboard(file.schedule as { [key: string]: unknown }, file.meta.currentWeek, futurePairings(file.meta.currentWeek));

const completedGames = (file.schedule.completed ?? file.schedule.weeks1to7 ?? []) as RawGame[];

export const GAMES: Game[] = [
  ...completedGames.map((g) => ({
    week: g.week,
    home: { teamId: g.homeTeamId, score: g.homeScore, projected: nn(g.homeProjected) },
    away: { teamId: g.awayTeamId, score: g.awayScore, projected: nn(g.awayProjected) },
    winnerId: nn(g.winnerTeamId),
    margin: g.margin,
  })),
  ...finalCurrentWeekGames(),
];

export const WEEKS_PLAYED = [...new Set(GAMES.map((g) => g.week))].sort((a, b) => a - b);

export function winnerSide(g: Game) {
  return g.winnerId === g.home.teamId ? g.home : g.away;
}

export function loserSide(g: Game) {
  return g.winnerId === g.home.teamId ? g.away : g.home;
}

export type { MatchupState };

export interface MatchupSide {
  teamId: number;
  projected?: number;
  /** Set once the week is underway, including a real 0. */
  points?: number;
}

export interface Matchup {
  slug: string;
  week: number;
  homeId: number;
  awayId: number;
  state: MatchupState;
  /** Display order: the user's team first, otherwise away then home. */
  left: MatchupSide;
  right: MatchupSide;
}

/** Final current-week games join the record book. A week still in progress stays on the scoreboard only. */
function finalCurrentWeekGames(): Game[] {
  if (file.meta.weekInProgress?.final !== true) return [];
  const current = file.meta.currentWeek;
  if (completedGames.some((game) => game.week === current)) return [];
  return currentWeekGames().flatMap((game) => {
    const winner = (game.winner ?? "").toUpperCase();
    if (winner !== "HOME" && winner !== "AWAY") return [];
    const homeScore = game.homeCurrentPoints ?? 0;
    const awayScore = game.awayCurrentPoints ?? 0;
    return [
      {
        week: game.week ?? current,
        home: { teamId: game.homeTeamId, score: homeScore, projected: nn(game.homeProjected) },
        away: { teamId: game.awayTeamId, score: awayScore, projected: nn(game.awayProjected) },
        winnerId: winner === "HOME" ? game.homeTeamId : game.awayTeamId,
        margin: game.margin ?? Math.abs(homeScore - awayScore),
      },
    ];
  });
}

function currentWeekGames(): RawWeek8Game[] {
  return (scoreboard.current ?? []) as RawWeek8Game[];
}

function currentWeekSide(t: RawTeam) {
  const bag = t as RawTeam & { [key: string]: RawTeam["week8"] };
  const raw = bag[`week${file.meta.currentWeek}`];
  return raw
    ? { opponentId: raw.opponentTeamId, projected: nn(raw.projected), opponentProjected: nn(raw.opponentProjected) }
    : undefined;
}

function toMatchups(games: RawWeek8Game[], week: number): Matchup[] {
  return games
    .map((g) => {
      const state = matchupState(g);
      const live = state !== "projected";
      const away: MatchupSide = {
        teamId: g.awayTeamId,
        projected: nn(g.awayProjected),
        points: live ? (g.awayCurrentPoints ?? 0) : undefined,
      };
      const home: MatchupSide = {
        teamId: g.homeTeamId,
        projected: nn(g.homeProjected),
        points: live ? (g.homeCurrentPoints ?? 0) : undefined,
      };
      const [left, right] = home.teamId === USER_TEAM.id ? [home, away] : [away, home];
      return {
        slug: `${team(left.teamId).abbrev}-${team(right.teamId).abbrev}`.toLowerCase(),
        week,
        homeId: home.teamId,
        awayId: away.teamId,
        state,
        left,
        right,
      };
    })
    .sort((a, b) => Number(b.left.teamId === USER_TEAM.id) - Number(a.left.teamId === USER_TEAM.id));
}

/** True when `schedule.week{currentWeek}` is on the file. False shows the empty scoreboard, not an older week. */
export const CURRENT_WEEK_POSTED = scoreboard.current != null;

export const MATCHUPS: Matchup[] = toMatchups(currentWeekGames(), LEAGUE.week);

/** Next week's pairings, once `schedule.week{N+1}` or the playoff model has them. */
export const UPCOMING_WEEK = scoreboard.nextWeek;
export const UPCOMING: Matchup[] = toMatchups((scoreboard.next ?? []) as RawWeek8Game[], scoreboard.nextWeek);

/** Actual minus projected for the current week, only where both numbers are already on the game. */
export const PROJECTION_GAPS = projectionActual(scoreboard.current ?? []);

/** Older URL ids kept working for shared links. */
const SLUG_ALIASES: { [slug: string]: number } = { "golden-goose": 7, "maye-dim": 7, bibis: 1 };

export function getMatchup(slug: string) {
  const aliased = SLUG_ALIASES[slug];
  return aliased ? matchupFor(aliased) : MATCHUPS.find((m) => m.slug === slug);
}

export function matchupFor(teamId: number) {
  return MATCHUPS.find((m) => m.homeId === teamId || m.awayId === teamId);
}

export function matchupPath(m: Matchup) {
  return `/matchups/${m.slug}`;
}

export function teamPath(id: number) {
  return `/teams/${id}`;
}

export interface Champion {
  season: number;
  championId: number;
  /** The franchise's display name that season. */
  championName: string;
  championSeed?: number;
  runnerUpId?: number;
  runnerUpName?: string;
  runnerUpSeed?: number;
}

function seasonName(teamId: number, season: number) {
  const t = getTeam(teamId);
  return t?.history.seasons.find((s) => s.season === season)?.name ?? t?.name ?? "";
}

export const CHAMPIONS: Champion[] = file.champions
  .map((c) => ({
    season: c.season,
    championId: c.championTeamId,
    championName: seasonName(c.championTeamId, c.season),
    championSeed: nn(c.championSeed),
    runnerUpId: nn(c.runnerUpTeamId),
    runnerUpName: c.runnerUpTeamId != null ? seasonName(c.runnerUpTeamId, c.season) : undefined,
    runnerUpSeed: nn(c.runnerUpSeed),
  }))
  .sort((a, b) => b.season - a.season);

export function formatRecord(t: { wins: number; losses: number; ties: number }) {
  return t.ties ? `${t.wins}-${t.losses}-${t.ties}` : `${t.wins}-${t.losses}`;
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function isFlagged(p: Player) {
  return p.status != null && p.status !== "Active";
}

/** Up to 2 decimals, without a trailing zero. */
export function formatPoints(n: number) {
  return n.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

/** Everything the public API returns: display names only. */
export function publicLeague() {
  return {
    source: LEAGUE.source,
    generatedAt: LEAGUE.generatedAt,
    league: { id: LEAGUE.id, name: LEAGUE.name, season: LEAGUE.season, week: LEAGUE.week },
    teams: TEAMS,
    games: GAMES,
    matchups: MATCHUPS,
    /** @deprecated Use `matchups`. Kept so older clients still resolve. */
    week8: MATCHUPS,
    champions: CHAMPIONS,
  };
}
