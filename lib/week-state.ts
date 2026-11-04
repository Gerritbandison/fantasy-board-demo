/** How a scoreboard game is allowed to look. Derived from the schedule row, never guessed. */
export type MatchupState = "projected" | "live" | "final";

export interface WeekGame {
  homeTeamId: number;
  awayTeamId: number;
  homeProjected?: number | null;
  awayProjected?: number | null;
  homeCurrentPoints?: number | null;
  awayCurrentPoints?: number | null;
  winner?: string | null;
  status?: string | null;
  week?: number;
  margin?: number | null;
}

export interface WeekPairings {
  week: number;
  games: WeekGame[];
}

export interface ScoreboardSelection {
  currentWeek: number;
  /** Null when `schedule.week{N}` is missing. An empty array means the key is there and has no games. */
  current: WeekGame[] | null;
  nextWeek: number;
  /** Null when neither the schedule nor the extra pairings list has next week. */
  next: WeekGame[] | null;
}

export interface ProjectionActual {
  homeId: number;
  awayId: number;
  homeProjected: number;
  awayProjected: number;
  homeActual: number;
  awayActual: number;
  homeDelta: number;
  awayDelta: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** `schedule.week{N}` only. A missing key is null, including when an older `week8` array is still on the file. */
export function gamesForWeek(schedule: { [key: string]: unknown }, week: number): WeekGame[] | null {
  const found = schedule[`week${week}`];
  if (!Array.isArray(found)) return null;
  return found as WeekGame[];
}

/**
 * Current week from `meta.currentWeek`. Next week uses that week's schedule key when it
 * exists, otherwise pairings passed in from another data file (the playoff model).
 */
export function selectScoreboard(
  schedule: { [key: string]: unknown },
  currentWeek: number,
  extras: WeekPairings[] = [],
): ScoreboardSelection {
  const nextWeek = currentWeek + 1;
  const scheduledNext = gamesForWeek(schedule, nextWeek);
  const extra = extras.find((row) => row.week === nextWeek)?.games;
  return {
    currentWeek,
    current: gamesForWeek(schedule, currentWeek),
    nextWeek,
    next: scheduledNext ?? (extra && extra.length > 0 ? extra : null),
  };
}

/** Projected until the row says the week started. A decided winner or status "final" is final. */
export function matchupState(game: WeekGame): MatchupState {
  const winner = (game.winner ?? "").toUpperCase();
  if (winner === "HOME" || winner === "AWAY") return "final";
  const status = (game.status ?? "").toLowerCase();
  if (status === "final") return "final";
  if (status === "in-progress" || status === "live") return "live";
  if ((game.homeCurrentPoints ?? 0) > 0 || (game.awayCurrentPoints ?? 0) > 0) return "live";
  return "projected";
}

/** Label for the record book from the weeks that are actually in the finals, not currentWeek - 1. */
export function recordBookLabel(weeks: number[]) {
  if (weeks.length === 0) return "No finals yet";
  const min = Math.min(...weeks);
  const max = Math.max(...weeks);
  return min === max ? `Week ${min}` : `Weeks ${min}–${max}`;
}

/** Actual minus projected, only for games that already have both numbers. */
export function projectionActual(games: WeekGame[]): ProjectionActual[] {
  return games.flatMap((game) => {
    const homeProjected = game.homeProjected;
    const awayProjected = game.awayProjected;
    const homeActual = game.homeCurrentPoints;
    const awayActual = game.awayCurrentPoints;
    if (homeProjected == null || awayProjected == null || homeActual == null || awayActual == null) return [];
    return [
      {
        homeId: game.homeTeamId,
        awayId: game.awayTeamId,
        homeProjected,
        awayProjected,
        homeActual,
        awayActual,
        homeDelta: round2(homeActual - homeProjected),
        awayDelta: round2(awayActual - awayProjected),
      },
    ];
  });
}
