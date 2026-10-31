import {
  CHAMPIONS,
  GAMES,
  LEAGUE,
  loserSide,
  MATCHUPS,
  STANDINGS,
  TEAMS,
  team,
  WEEKS_PLAYED,
  winnerSide,
  type Game,
  type Team,
} from "./league";

export const CLOSE_GAME_MARGIN = 5;

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);

/** Every team score in a week, from the full schedule. */
export function weekScores(week: number) {
  return GAMES.filter((g) => g.week === week).flatMap((g) => [g.home, g.away]);
}

export const LEAGUE_AVG_BY_WEEK = new Map(WEEKS_PLAYED.map((w) => [w, mean(weekScores(w).map((s) => s.score))]));

export const LEAGUE_AVG = mean(GAMES.flatMap((g) => [g.home.score, g.away.score]));

export function teamStats(t: Team) {
  const pfs = t.weekly.map((w) => w.pf);
  const high = t.weekly.reduce((a, b) => (b.pf > a.pf ? b : a));
  const low = t.weekly.reduce((a, b) => (b.pf < a.pf ? b : a));
  const avg = mean(pfs);
  const stdDev = Math.sqrt(mean(pfs.map((v) => (v - avg) ** 2)));
  const last3 = mean(t.weekly.slice(-3).map((w) => w.pf));
  const aboveAvgWeeks = t.weekly.filter((w) => w.pf > (LEAGUE_AVG_BY_WEEK.get(w.week) ?? 0)).length;
  return { avg, median: median(pfs), high, low, stdDev, range: high.pf - low.pf, last3, aboveAvgWeeks };
}

/** Record if the team had played every other team every week. */
export function allPlay(teamId: number) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const w of WEEKS_PLAYED) {
    const scores = weekScores(w);
    const mine = scores.find((s) => s.teamId === teamId);
    if (!mine) continue;
    for (const s of scores) {
      if (s.teamId === teamId) continue;
      if (mine.score > s.score) wins++;
      else if (mine.score < s.score) losses++;
      else ties++;
    }
  }
  const games = wins + losses + ties;
  return { wins, losses, ties, pct: games ? (wins + ties / 2) / games : 0, expectedWins: games ? (wins / games) * WEEKS_PLAYED.length : 0 };
}

const PF_ORDER = [...TEAMS].sort((a, b) => b.pointsFor - a.pointsFor).map((t) => t.id);
const PA_ORDER = [...TEAMS].sort((a, b) => b.pointsAgainst - a.pointsAgainst).map((t) => t.id);

export function pfRank(teamId: number) {
  return PF_ORDER.indexOf(teamId) + 1;
}

/** 1 = faced the most points. */
export function paRank(teamId: number) {
  return PA_ORDER.indexOf(teamId) + 1;
}

export type LuckLabel = "lucky" | "even" | "unlucky";

export interface Luck {
  teamId: number;
  pfRank: number;
  recordRank: number;
  /** Positive: the record is better than the scoring rank. */
  delta: number;
  label: LuckLabel;
  /** Actual wins minus all-play expected wins. */
  winsOverExpected: number;
}

export function luck(teamId: number): Luck {
  const t = team(teamId);
  const delta = pfRank(teamId) - t.rank;
  const ap = allPlay(teamId);
  return {
    teamId,
    pfRank: pfRank(teamId),
    recordRank: t.rank,
    delta,
    label: delta >= 2 ? "lucky" : delta <= -2 ? "unlucky" : "even",
    winsOverExpected: t.wins - ap.expectedWins,
  };
}

export const LUCK_LABEL: { [l in LuckLabel]: { text: string; tone: string } } = {
  lucky: { text: "Lucky", tone: "bg-amber-100 text-amber-800 ring-amber-300" },
  even: { text: "Even", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
  unlucky: { text: "Unlucky", tone: "bg-sky-100 text-sky-800 ring-sky-300" },
};

export function closeGameRecord(teamId: number) {
  const close = team(teamId).weekly.filter((w) => Math.abs(w.pf - w.pa) < CLOSE_GAME_MARGIN);
  const wins = close.filter((w) => w.result === "W").length;
  return { wins, losses: close.length - wins, games: close.length };
}

export interface ScoreRow {
  teamId: number;
  week: number;
  score: number;
  won: boolean;
  oppId: number;
  oppScore: number;
}

export const ALL_SCORES: ScoreRow[] = GAMES.flatMap((g) => [
  { teamId: g.home.teamId, week: g.week, score: g.home.score, won: g.winnerId === g.home.teamId, oppId: g.away.teamId, oppScore: g.away.score },
  { teamId: g.away.teamId, week: g.week, score: g.away.score, won: g.winnerId === g.away.teamId, oppId: g.home.teamId, oppScore: g.home.score },
]).sort((a, b) => b.score - a.score);

export const CLOSEST_GAMES = [...GAMES].sort((a, b) => a.margin - b.margin);

export const BAD_BEATS = [...GAMES].sort((a, b) => loserSide(b).score - loserSide(a).score);

export const BLOWOUTS = [...GAMES].sort((a, b) => b.margin - a.margin);

export function weeklyLeaders() {
  return WEEKS_PLAYED.map((week) => {
    const rows = ALL_SCORES.filter((s) => s.week === week);
    return { week, top: rows[0], bottom: rows[rows.length - 1], avg: LEAGUE_AVG_BY_WEEK.get(week) ?? 0 };
  });
}

export function weeklyTopCount(teamId: number) {
  return weeklyLeaders().filter((w) => w.top.teamId === teamId).length;
}

/** Strength of schedule: points allowed plus the season average of every opponent faced. */
export function schedule(teamId: number) {
  const t = team(teamId);
  const oppAvg = mean(t.weekly.map((w) => teamStats(team(w.opponentId)).avg));
  return { pointsAgainst: t.pointsAgainst, paPerGame: t.pointsAgainst / Math.max(1, t.weekly.length), paRank: paRank(teamId), oppAvg };
}

export function scheduleTable() {
  return TEAMS.map((t) => ({ team: t, ...schedule(t.id) })).sort((a, b) => b.oppAvg - a.oppAvg);
}

export function consistencyTable() {
  return TEAMS.map((t) => ({ team: t, ...teamStats(t) })).sort((a, b) => a.stdDev - b.stdDev);
}

export interface H2HCell {
  week: number;
  score: number;
  oppScore: number;
  won: boolean;
}

/** 2026 head-to-head results keyed `${rowTeam}-${colTeam}`. */
export const H2H = (() => {
  const m = new Map<string, H2HCell>();
  for (const s of ALL_SCORES) m.set(`${s.teamId}-${s.oppId}`, { week: s.week, score: s.score, oppScore: s.oppScore, won: s.won });
  return m;
})();

export function meetings(a: number, b: number) {
  return GAMES.filter((g) => [g.home.teamId, g.away.teamId].includes(a) && [g.home.teamId, g.away.teamId].includes(b));
}

export interface PowerRow {
  team: Team;
  rank: number;
  allPlay: ReturnType<typeof allPlay>;
  last3: number;
  /** Standings rank minus power rank: positive means better than the standings say. */
  move: number;
}

/** Ranked by all-play win rate, then points for. */
export function powerRankings(): PowerRow[] {
  return TEAMS.map((t) => ({ team: t, allPlay: allPlay(t.id), last3: teamStats(t).last3 }))
    .sort((a, b) => b.allPlay.pct - a.allPlay.pct || b.team.pointsFor - a.team.pointsFor)
    .map((r, i) => ({ ...r, rank: i + 1, move: r.team.rank - (i + 1) }));
}

export function powerRank(teamId: number) {
  return powerRankings().find((r) => r.team.id === teamId)!.rank;
}

export function luckTable() {
  return STANDINGS.map((t) => luck(t.id)).sort((a, b) => b.delta - a.delta || b.winsOverExpected - a.winsOverExpected);
}

/** Shared y-range so every score chart reads on the same scale. */
export const TRAIL_RANGE = (() => {
  const all = [
    ...ALL_SCORES.map((s) => s.score),
    ...MATCHUPS.flatMap((m) => [m.left.projected ?? LEAGUE_AVG, m.right.projected ?? LEAGUE_AVG]),
  ];
  return { min: Math.floor((Math.min(...all) - 5) / 10) * 10, max: Math.ceil((Math.max(...all) + 5) / 10) * 10 };
})();

export interface TitleRow {
  team: Team;
  titles: number;
  titleYears: number[];
  finalsYears: number[];
  runnerUpYears: number[];
  number1Seeds: number[];
  bestFinish?: number;
  allTime?: { wins: number; losses: number; ties: number };
}

export function titleBoard(): TitleRow[] {
  return TEAMS.map((t) => ({
    team: t,
    titles: t.history.titles,
    titleYears: t.history.titleYears,
    finalsYears: t.history.finalsYears,
    runnerUpYears: t.history.finalsYears.filter((y) => !t.history.titleYears.includes(y)),
    number1Seeds: t.history.number1Seeds,
    bestFinish: t.history.bestFinish,
    allTime: t.history.allTime,
  })).sort(
    (a, b) =>
      b.titles - a.titles ||
      b.finalsYears.length - a.finalsYears.length ||
      (a.bestFinish ?? 99) - (b.bestFinish ?? 99) ||
      (b.allTime?.wins ?? 0) - (a.allTime?.wins ?? 0),
  );
}

export function championSeedSummary() {
  const seeds = CHAMPIONS.filter((c) => c.championSeed != null).map((c) => c.championSeed!);
  const counts = new Map<number, number>();
  for (const s of seeds) counts.set(s, (counts.get(s) ?? 0) + 1);
  const [modeSeed, modeCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
  const topSeedWins = CHAMPIONS.filter((c) => c.championSeed === 1).map((c) => c.season);
  return { seeds, modeSeed, modeCount, total: seeds.length, topSeedWins };
}

export function gameLabel(g: Game) {
  return { winner: winnerSide(g), loser: loserSide(g) };
}

export const SEASONS_WITH_HISTORY = [...new Set(TEAMS.flatMap((t) => t.history.seasons.map((s) => s.season)))].sort((a, b) => a - b);

export const CURRENT_SEASON = LEAGUE.season;
