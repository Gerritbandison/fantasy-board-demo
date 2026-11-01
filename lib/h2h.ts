import raw from "@/data/league-h2h-history.json";
import { isRetiredSeasonName, publicDisplayName, publicSeasonName, team } from "@/lib/league";

/*
 * All-time head-to-head pull (Flaim/ESPN). Like lib/league.ts, every ESPN name field
 * is dropped while mapping, so only current display names (via `team()`) and the
 * file's cleaned per-season display names can reach the UI.
 */

type Tier = "NONE" | "WINNERS_BRACKET" | "WINNERS_CONSOLATION_LADDER" | "LOSERS_CONSOLATION_LADDER";

interface RawGame {
  gameId: string;
  season: number;
  matchupPeriod: number;
  scoringPeriods: number[];
  playoffTier: Tier;
  isChampionship: boolean;
  twoWeekMatchup: boolean;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  homeDisplayName: string;
  awayDisplayName: string;
  winnerTeamId: number | null;
  margin: number;
}

interface RawLastMeeting {
  gameId: string;
  season: number;
  result: string;
  pointsFor: number;
  pointsAgainst: number;
  playoffTier: Tier;
}

interface RawSeriesGame {
  gameId: string;
  pointsFor: number;
  pointsAgainst: number;
  margin: number;
  twoWeekMatchup: boolean;
}

interface RawSeries {
  opponentTeamId: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  avgMargin: number;
  longestWinStreak: number;
  longestLosingStreak: number;
  currentStreak: string | null;
  playoffMeetings: number;
  lastMeeting: RawLastMeeting | null;
  biggestWin: RawSeriesGame | null;
  worstLoss: RawSeriesGame | null;
}

interface RawTeamGame {
  gameId: string;
  season: number;
  opponentTeamId: number;
  opponentSeasonDisplayName: string;
  pointsFor: number;
  pointsAgainst: number;
  margin: number;
  playoffTier: Tier;
  twoWeekMatchup: boolean;
}

interface RawWeekScore {
  gameId: string;
  season: number;
  scoringPeriod: number;
  score: number;
  opponentTeamId: number;
  opponentScoreThatWeek: number | null;
  playoffTier: Tier;
  isPlayoffLeg: boolean;
}

interface RawRange {
  fromGameId: string;
  toGameId: string;
}

interface RawFranchise {
  teamId: number;
  seasonNames: { season: number; displayName: string }[];
  allTime: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
    regularSeasonRecord: string;
    pointsFor: number;
    pointsAgainst: number;
    pointsPerWeek: number;
    longestWinStreak: number;
    longestWinStreakRange: RawRange | null;
    longestLosingStreak: number;
    longestLosingStreakRange: RawRange | null;
    currentStreak: string | null;
  };
  playoffRecord: { wins: number; losses: number; championshipGames: number; titles: number; consolationRecord: string | null };
  easiestOpponent: { opponentTeamId: number } | null;
  nemesis: { opponentTeamId: number } | null;
  biggestWin: RawTeamGame | null;
  worstLoss: RawTeamGame | null;
  closestWin: RawTeamGame | null;
  closestLoss: RawTeamGame | null;
  highestScore: RawWeekScore | null;
  lowestScore: RawWeekScore | null;
  vsOpponents: { [opponentId: string]: RawSeries };
}

interface RawLeagueScore extends RawWeekScore {
  teamId: number;
  seasonDisplayName: string;
}

interface RawLeagueGame extends RawGame {
  losingScore?: number;
  winningScore?: number;
}

interface RawStreak {
  teamId: number;
  length: number;
  range: RawRange | null;
}

interface RawRivalry {
  teamA: number;
  teamB: number;
  games: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  pointsA: number;
  pointsB: number;
  avgMarginForA: number;
  playoffMeetings: number;
}

interface RawTitleGame {
  season: number;
  gameId: string;
  championTeamId: number;
  championSeasonDisplayName: string;
  runnerUpTeamId: number;
  runnerUpSeasonDisplayName: string;
  championScore: number;
  runnerUpScore: number;
  margin: number;
  scoringPeriods: number[];
}

interface RawFile {
  meta: { scopeLabel: string; seasonsCovered: number[]; totalGames: number; minGamesForEasiestOrNemesis: number; generatedAt: string };
  games: RawGame[];
  franchises: { [teamId: string]: RawFranchise };
  leagueRecords: {
    note: string;
    highestSingleScore: RawLeagueScore[];
    lowestSingleScore: RawLeagueScore[];
    biggestBlowout: RawLeagueGame[];
    closestGame: RawLeagueGame[];
    mostPointsInLoss: RawLeagueGame[];
    fewestPointsInWin: RawLeagueGame[];
    longestWinStreaks: RawStreak[];
    longestLosingStreaks: RawStreak[];
    streakNote: string;
    mostPlayedRivalry: RawRivalry[];
    mostLopsidedRivalry: RawRivalry[];
    twoWeekPlayoffRecords: { biggestBlowout: RawLeagueGame[]; closest: RawLeagueGame[]; highestTwoWeekTotal: RawLeagueGame[] };
    championshipGames: RawTitleGame[];
  };
}

const file = raw as unknown as RawFile;

export const SCOPE_LABEL = file.meta.scopeLabel;
export const MIN_GAMES = file.meta.minGamesForEasiestOrNemesis;
export const SEASONS_COVERED = file.meta.seasonsCovered;
export const TOTAL_GAMES = file.meta.totalGames;
export const RECORDS_NOTE = file.leagueRecords.note;
export const STREAK_NOTE = file.leagueRecords.streakNote;

export type GameKind = "regular" | "playoff" | "title" | "consolation";

/** Where a game happened, in public terms. Scoring weeks come from the game itself. */
export interface When {
  season: number;
  weeks: number[];
  kind: GameKind;
  twoWeek: boolean;
}

const GAME_BY_ID = new Map(file.games.map((g) => [g.gameId, g]));

function kindOf(tier: Tier, championship = false): GameKind {
  if (tier === "NONE") return "regular";
  if (tier === "WINNERS_BRACKET") return championship ? "title" : "playoff";
  return "consolation";
}

function when(gameId: string, season: number, tier: Tier, fallbackWeek?: number): When {
  const g = GAME_BY_ID.get(gameId);
  return {
    season,
    weeks: g?.scoringPeriods ?? (fallbackWeek != null ? [fallbackWeek] : []),
    kind: kindOf(tier, g?.isChampionship),
    twoWeek: g?.twoWeekMatchup ?? false,
  };
}

const SEASON_NAMES = new Map(
  Object.values(file.franchises).map((f) => [f.teamId, new Map(f.seasonNames.map((s) => [s.season, s.displayName.replace(/\s+/g, " ").trim()]))]),
);

/** The franchise's display name for a season, safe to render on its own. */
export function seasonName(teamId: number, season: number) {
  const raw = SEASON_NAMES.get(teamId)?.get(season);
  return raw ? publicSeasonName(team(teamId).name, season, raw) : team(teamId).name;
}

/**
 * Current name plus how to qualify it for a past season: `alias` when the franchise went by
 * another name that year, or `year` when that year's name is retired from display.
 */
export function teamThen(teamId: number, season: number): { name: string; alias: string | null; year: number | null } {
  const name = team(teamId).name;
  const raw = SEASON_NAMES.get(teamId)?.get(season);
  const shown = raw ? publicDisplayName(raw) : "";
  if (!shown || shown === name) return { name, alias: null, year: null };
  if (isRetiredSeasonName(shown)) return { name, alias: null, year: season };
  return { name, alias: shown, year: null };
}

/** e.g. "Maye Day (as Mixon Impossible)" or "Jahmyr I Go Again (2020)". */
export function teamThenLabel(teamId: number, season: number) {
  const t = teamThen(teamId, season);
  return t.alias ? `${t.name} (as ${t.alias})` : t.year ? `${t.name} (${t.year})` : t.name;
}

export interface TeamGame {
  when: When;
  /** The team the stat belongs to. */
  teamId: number;
  opponentId: number;
  pf: number;
  pa: number;
  margin: number;
}

export interface WeekScore {
  when: When;
  week: number;
  /** One leg of a two-week playoff matchup, not a whole game. */
  leg: boolean;
  /** The team that scored `score`. */
  teamId: number;
  score: number;
  opponentId: number;
  opponentScore: number | null;
  /** Full-game totals when the score was one leg of a two-week game. */
  game: { pf: number; pa: number } | null;
}

export interface Series {
  teamId: number;
  opponentId: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  avgMargin: number;
  longestWinStreak: number;
  longestLosingStreak: number;
  currentStreak: { result: "W" | "L" | "T"; length: number } | null;
  playoffMeetings: number;
  last: { when: When; result: string; pf: number; pa: number } | null;
  biggestWin: TeamGame | null;
  worstLoss: TeamGame | null;
}

export interface StreakSpan {
  length: number;
  from?: When;
  to?: When;
}

export interface Franchise {
  teamId: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  regularSeasonRecord: string;
  pointsFor: number;
  pointsAgainst: number;
  pointsPerWeek: number;
  winStreak: StreakSpan;
  losingStreak: StreakSpan;
  currentStreak: { result: "W" | "L" | "T"; length: number } | null;
  playoff: { wins: number; losses: number; titleGames: number; titles: number; consolationRecord: string | null };
  easiest: Series | null;
  nemesis: Series | null;
  biggestWin: TeamGame | null;
  worstLoss: TeamGame | null;
  closestWin: TeamGame | null;
  closestLoss: TeamGame | null;
  best: WeekScore | null;
  worst: WeekScore | null;
  /** Every opponent, best record first. */
  vs: Series[];
}

function parseStreak(s: string | null) {
  const m = s?.match(/^([WLT])(\d+)$/);
  return m ? { result: m[1] as "W" | "L" | "T", length: Number(m[2]) } : null;
}

function span(length: number, r: RawRange | null): StreakSpan {
  const at = (id: string) => {
    const g = GAME_BY_ID.get(id);
    return g ? when(id, g.season, g.playoffTier) : undefined;
  };
  return { length, from: r ? at(r.fromGameId) : undefined, to: r ? at(r.toGameId) : undefined };
}

function teamGame(teamId: number, g: RawTeamGame | null): TeamGame | null {
  if (!g) return null;
  return { when: when(g.gameId, g.season, g.playoffTier), teamId, opponentId: g.opponentTeamId, pf: g.pointsFor, pa: g.pointsAgainst, margin: g.margin };
}

function seriesGame(teamId: number, g: RawSeriesGame | null, opponentId: number): TeamGame | null {
  if (!g) return null;
  const game = GAME_BY_ID.get(g.gameId);
  if (!game) return null;
  return { when: when(g.gameId, game.season, game.playoffTier), teamId, opponentId, pf: g.pointsFor, pa: g.pointsAgainst, margin: g.margin };
}

function weekScore(teamId: number, s: RawWeekScore | null): WeekScore | null {
  if (!s) return null;
  const g = GAME_BY_ID.get(s.gameId);
  const home = g?.homeTeamId === teamId;
  return {
    game: g?.twoWeekMatchup ? { pf: home ? g.homeScore : g.awayScore, pa: home ? g.awayScore : g.homeScore } : null,
    when: when(s.gameId, s.season, s.playoffTier, s.scoringPeriod),
    week: s.scoringPeriod,
    leg: s.isPlayoffLeg,
    teamId,
    score: s.score,
    opponentId: s.opponentTeamId,
    opponentScore: s.opponentScoreThatWeek,
  };
}

function series(teamId: number, s: RawSeries): Series {
  return {
    teamId,
    opponentId: s.opponentTeamId,
    games: s.games,
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    winPct: s.winPct,
    pointsFor: s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    avgMargin: s.avgMargin,
    longestWinStreak: s.longestWinStreak,
    longestLosingStreak: s.longestLosingStreak,
    currentStreak: parseStreak(s.currentStreak),
    playoffMeetings: s.playoffMeetings,
    last: s.lastMeeting
      ? { when: when(s.lastMeeting.gameId, s.lastMeeting.season, s.lastMeeting.playoffTier), result: s.lastMeeting.result, pf: s.lastMeeting.pointsFor, pa: s.lastMeeting.pointsAgainst }
      : null,
    biggestWin: seriesGame(teamId, s.biggestWin, s.opponentTeamId),
    worstLoss: seriesGame(teamId, s.worstLoss, s.opponentTeamId),
  };
}

const FRANCHISES = new Map<number, Franchise>(
  Object.values(file.franchises).map((f) => {
    const vs = Object.values(f.vsOpponents)
      .map((s) => series(f.teamId, s))
      .sort((a, b) => b.winPct - a.winPct || b.avgMargin - a.avgMargin);
    const find = (o: { opponentTeamId: number } | null) => (o ? (vs.find((s) => s.opponentId === o.opponentTeamId) ?? null) : null);
    const a = f.allTime;
    return [
      f.teamId,
      {
        teamId: f.teamId,
        games: a.games,
        wins: a.wins,
        losses: a.losses,
        ties: a.ties,
        regularSeasonRecord: a.regularSeasonRecord.replace(/-0$/, ""),
        pointsFor: a.pointsFor,
        pointsAgainst: a.pointsAgainst,
        pointsPerWeek: a.pointsPerWeek,
        winStreak: span(a.longestWinStreak, a.longestWinStreakRange),
        losingStreak: span(a.longestLosingStreak, a.longestLosingStreakRange),
        currentStreak: parseStreak(a.currentStreak),
        playoff: {
          wins: f.playoffRecord.wins,
          losses: f.playoffRecord.losses,
          titleGames: f.playoffRecord.championshipGames,
          titles: f.playoffRecord.titles,
          consolationRecord: f.playoffRecord.consolationRecord,
        },
        easiest: find(f.easiestOpponent),
        nemesis: find(f.nemesis),
        biggestWin: teamGame(f.teamId, f.biggestWin),
        worstLoss: teamGame(f.teamId, f.worstLoss),
        closestWin: teamGame(f.teamId, f.closestWin),
        closestLoss: teamGame(f.teamId, f.closestLoss),
        best: weekScore(f.teamId, f.highestScore),
        worst: weekScore(f.teamId, f.lowestScore),
        vs,
      },
    ];
  }),
);

export function franchise(teamId: number) {
  return FRANCHISES.get(teamId);
}

/** Series from `a`'s point of view. */
export function seriesBetween(a: number, b: number) {
  return FRANCHISES.get(a)?.vs.find((s) => s.opponentId === b) ?? null;
}

export const H2H_TEAM_IDS = [...FRANCHISES.keys()].sort((a, b) => a - b);

/* ---------- League records ---------- */

export interface RecordGame {
  when: When;
  winnerId: number;
  loserId: number;
  winnerScore: number;
  loserScore: number;
  winnerSeasonName: string;
  loserSeasonName: string;
  margin: number;
}

function recordGame(g: RawLeagueGame): RecordGame {
  const homeWon = g.winnerTeamId === g.homeTeamId;
  return {
    when: when(g.gameId, g.season, g.playoffTier),
    winnerId: homeWon ? g.homeTeamId : g.awayTeamId,
    loserId: homeWon ? g.awayTeamId : g.homeTeamId,
    winnerScore: homeWon ? g.homeScore : g.awayScore,
    loserScore: homeWon ? g.awayScore : g.homeScore,
    winnerSeasonName: seasonName(homeWon ? g.homeTeamId : g.awayTeamId, g.season),
    loserSeasonName: seasonName(homeWon ? g.awayTeamId : g.homeTeamId, g.season),
    margin: g.margin,
  };
}

export interface RecordScore extends WeekScore {
  seasonName: string;
}

function recordScore(s: RawLeagueScore): RecordScore {
  return { ...weekScore(s.teamId, s)!, seasonName: seasonName(s.teamId, s.season) };
}

export interface Rivalry {
  a: number;
  b: number;
  games: number;
  aWins: number;
  bWins: number;
  ties: number;
  pointsA: number;
  pointsB: number;
  avgMarginForA: number;
  playoffMeetings: number;
}

function rivalry(r: RawRivalry): Rivalry {
  return {
    a: r.teamA,
    b: r.teamB,
    games: r.games,
    aWins: r.teamAWins,
    bWins: r.teamBWins,
    ties: r.ties,
    pointsA: r.pointsA,
    pointsB: r.pointsB,
    avgMarginForA: r.avgMarginForA,
    playoffMeetings: r.playoffMeetings,
  };
}

export interface TitleGame {
  season: number;
  weeks: number[];
  championId: number;
  runnerUpId: number;
  championSeasonName: string;
  runnerUpSeasonName: string;
  championScore: number;
  runnerUpScore: number;
  margin: number;
}

const lr = file.leagueRecords;

export const RECORDS = {
  highestScores: lr.highestSingleScore.map(recordScore),
  lowestScores: lr.lowestSingleScore.map(recordScore),
  blowouts: lr.biggestBlowout.map(recordGame),
  closest: lr.closestGame.map(recordGame),
  mostPointsInLoss: lr.mostPointsInLoss.map(recordGame),
  fewestPointsInWin: lr.fewestPointsInWin.map(recordGame),
  winStreaks: lr.longestWinStreaks.map((s) => ({ teamId: s.teamId, ...span(s.length, s.range) })),
  losingStreaks: lr.longestLosingStreaks.map((s) => ({ teamId: s.teamId, ...span(s.length, s.range) })),
  mostPlayed: lr.mostPlayedRivalry.map(rivalry),
  mostLopsided: lr.mostLopsidedRivalry.map(rivalry),
  twoWeek: {
    blowouts: lr.twoWeekPlayoffRecords.biggestBlowout.map(recordGame),
    closest: lr.twoWeekPlayoffRecords.closest.map(recordGame),
    highestTotal: lr.twoWeekPlayoffRecords.highestTwoWeekTotal.map(recordGame),
  },
  titleGames: lr.championshipGames.map(
    (c): TitleGame => ({
      season: c.season,
      weeks: c.scoringPeriods,
      championId: c.championTeamId,
      runnerUpId: c.runnerUpTeamId,
      championSeasonName: seasonName(c.championTeamId, c.season),
      runnerUpSeasonName: seasonName(c.runnerUpTeamId, c.season),
      championScore: c.championScore,
      runnerUpScore: c.runnerUpScore,
      margin: c.margin,
    }),
  ),
};

/** 1-based position of a weekly score in the league's all-time top list, if it made the list. */
export function highScoreRank(s: WeekScore) {
  const i = RECORDS.highestScores.findIndex((r) => r.teamId === s.teamId && r.when.season === s.when.season && r.week === s.week);
  return i < 0 ? null : i + 1;
}

export function lowScoreRank(s: WeekScore) {
  const i = RECORDS.lowestScores.findIndex((r) => r.teamId === s.teamId && r.when.season === s.when.season && r.week === s.week);
  return i < 0 ? null : i + 1;
}

/* ---------- Formatting ---------- */

export const pts = (n: number) => n.toFixed(2);

export function record(r: { wins: number; losses: number; ties: number }) {
  return `${r.wins}-${r.losses}${r.ties ? `-${r.ties}` : ""}`;
}

export function pct(p: number) {
  return p.toFixed(3).replace(/^0/, "");
}

export function weekLabel(w: { weeks: number[] }) {
  if (w.weeks.length === 0) return "";
  return w.weeks.length > 1 ? `Weeks ${w.weeks[0]}–${w.weeks[w.weeks.length - 1]}` : `Week ${w.weeks[0]}`;
}

export const KIND_LABEL: { [k in GameKind]: string } = {
  regular: "",
  playoff: "Playoffs",
  title: "Title game",
  consolation: "Consolation",
};

/** e.g. "2023 · Week 18 · Consolation". */
export function whenLabel(w: When, week?: number) {
  return [String(w.season), week != null ? `Week ${week}` : weekLabel(w), KIND_LABEL[w.kind]].filter(Boolean).join(" · ");
}

export function spanLabel(s: StreakSpan) {
  if (!s.from || !s.to) return "";
  const f = `${s.from.season} wk ${s.from.weeks[0]}`;
  const t = `${s.to.season} wk ${s.to.weeks[s.to.weeks.length - 1]}`;
  return f === t ? f : `${f} – ${t}`;
}
