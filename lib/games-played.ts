/**
 * Which scoring lines count as a game played.
 *
 * A line counts unless one of these says the player did not play. A negative
 * score always counts, and a positive score wins over a conflicting note.
 *
 * 1. Bye. The week is the player's NFL bye and the line is 0. The bye is the
 *    player's own bye week, unless teammates on the current NFL team share a
 *    different majority bye (a bye kept after a trade). The only player on an
 *    NFL team keeps their own bye. With no personal bye, the team majority is
 *    used. A tie has no majority.
 * 2. Trade log, 2026 only. A week whose reason starts with "out" or includes
 *    "all-zero" is a missed game when the line is 0. A reason that starts with
 *    "bye" is ignored, because that label has been wrong. "Not on this fantasy
 *    team" is ignored too: the player may have played, and the points are still
 *    theirs.
 * 3. Games missed. Team games are the last completed week, minus 1 when the bye
 *    already happened, plus 1 when the live week already has a non-zero score.
 *    Missed games are team games minus ESPN games played. A missing games-played
 *    count is treated as missing every team game. Bye weeks are not missed
 *    games. Trade-log absences of non-bye zeros spend that budget first.
 *    The other zero lines are all left out when the remaining budget covers
 *    every one of them. When it does not, those zeros stay, because at least
 *    one is a real score and the file does not say which.
 *
 * Leaving a zero out does not change the point total. It changes the number of
 * games and the per-game average. `missedGames === undefined` skips rule 3, so
 * a caller that only knows the scoring line keeps every unexplained zero.
 */

export interface LeagueByePlayer {
  playerId: string;
  nflTeam: string | null;
  byeWeek: number | null;
  score: number | null;
}

export interface PlaySignals {
  byeWeek: number | null;
  didNotPlayWeeks: number[];
  missedGames: number;
}

export interface PlayedSample {
  total: number;
  games: number;
  ppg: number;
  excludedWeeks: number[];
}

interface TradeAbsence {
  season?: number;
  longTermGrade?: {
    sides?: {
      [teamId: string]: {
        received?: { name?: string; zeroOrMissingWeeksAfter?: { week?: number; why?: string }[] }[];
      };
    };
  };
}

function cleanWeek(week: number | null | undefined): number | null {
  return typeof week === "number" && Number.isFinite(week) && week >= 1 ? week : null;
}

export function isDidNotPlayReason(why: string): boolean {
  const text = why.trim().toLowerCase();
  if (text.startsWith("bye")) return false;
  if (text.includes("not on this fantasy team")) return false;
  return text.startsWith("out") || text.includes("all-zero");
}

/** The bye shared by more players than any other. A tie is no majority. */
export function majorityBye(weeks: number[]): number | null {
  const counts = new Map<number, number>();
  for (const week of weeks) {
    const cleaned = cleanWeek(week);
    if (cleaned == null) continue;
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  let tied = false;
  for (const [week, count] of counts) {
    if (count > bestCount) {
      best = week;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) tied = true;
  }
  return tied ? null : best;
}

export function resolveByeWeek(personalBye: number | null | undefined, teammateByes: number[]): number | null {
  const personal = cleanWeek(personalBye);
  const teammates = teammateByes.map((week) => cleanWeek(week)).filter((week): week is number => week != null);
  if (!teammates.length) return personal;
  const majority = majorityBye(teammates);
  if (personal == null) return majority;
  if (majority != null && majority !== personal) return majority;
  return personal;
}

export function lastCompletedWeek(currentWeek: number, currentWeekFinal: boolean): number {
  if (!Number.isFinite(currentWeek)) return 0;
  return currentWeekFinal ? currentWeek : Math.max(0, currentWeek - 1);
}

export function teamGamesPlayed(lastCompleted: number, byeWeek: number | null, currentWeekScore: number | null | undefined): number {
  const bye = cleanWeek(byeWeek);
  const byeHappened = bye != null && bye <= lastCompleted;
  const liveGame = typeof currentWeekScore === "number" && Number.isFinite(currentWeekScore) && currentWeekScore !== 0;
  return Math.max(0, lastCompleted - (byeHappened ? 1 : 0) + (liveGame ? 1 : 0));
}

export function missedGameCount(gamesPlayed: number | null | undefined, teamGames: number): number {
  if (gamesPlayed == null || !Number.isFinite(gamesPlayed)) return teamGames;
  return Math.max(0, teamGames - gamesPlayed);
}

export function absencesByPlayerName(trades: TradeAbsence[]): Map<string, number[]> {
  const weeksByName = new Map<string, Set<number>>();
  for (const trade of trades) {
    if (trade.season !== 2026) continue;
    for (const side of Object.values(trade.longTermGrade?.sides ?? {})) {
      for (const player of side.received ?? []) {
        if (!player.name) continue;
        for (const row of player.zeroOrMissingWeeksAfter ?? []) {
          const week = cleanWeek(row.week);
          if (week == null || !row.why || !isDidNotPlayReason(row.why)) continue;
          const weeks = weeksByName.get(player.name) ?? new Set<number>();
          weeks.add(week);
          weeksByName.set(player.name, weeks);
        }
      }
    }
  }
  return new Map([...weeksByName].map(([name, weeks]) => [name, [...weeks].sort((a, b) => a - b)]));
}

export function playSignalsFor(
  player: { id: string; name: string; gp?: number | null; team?: string | null },
  input: { leaguePlayers: LeagueByePlayer[]; absences: Map<string, number[]>; currentWeek: number; currentWeekFinal: boolean },
): PlaySignals {
  const mine = input.leaguePlayers.find((row) => row.playerId === player.id);
  const nfl = (mine?.nflTeam || player.team || "").trim();
  const teammateByes = input.leaguePlayers
    .filter((row) => nfl && (row.nflTeam ?? "").trim() === nfl && row.playerId !== player.id)
    .map((row) => row.byeWeek)
    .filter((week): week is number => cleanWeek(week) != null);
  const byeWeek = resolveByeWeek(mine?.byeWeek ?? null, teammateByes);
  const teamGames = teamGamesPlayed(lastCompletedWeek(input.currentWeek, input.currentWeekFinal), byeWeek, mine?.score ?? null);
  return {
    byeWeek,
    didNotPlayWeeks: input.absences.get(player.name) ?? [],
    missedGames: missedGameCount(player.gp ?? null, teamGames),
  };
}

export function applyPlayContext<T extends { id: string; name: string; gp?: number | null; team?: string | null }>(
  rosters: { [teamId: string]: T[] },
  input: { leaguePlayers: LeagueByePlayer[]; absences: Map<string, number[]>; currentWeek: number; currentWeekFinal: boolean },
): { [teamId: string]: (T & PlaySignals)[] } {
  const enriched: { [teamId: string]: (T & PlaySignals)[] } = {};
  for (const [teamId, players] of Object.entries(rosters)) {
    enriched[teamId] = players.map((player) => ({ ...player, ...playSignalsFor(player, input) }));
  }
  return enriched;
}

export function splitScoringLines(
  byWeek: { [week: string]: number } | undefined,
  signals?: { byeWeek?: number | null; didNotPlayWeeks?: number[]; missedGames?: number },
): PlayedSample {
  const byeWeek = cleanWeek(signals?.byeWeek);
  const logged = new Set((signals?.didNotPlayWeeks ?? []).map((week) => cleanWeek(week)).filter((week): week is number => week != null));
  const played: { week: number; points: number }[] = [];
  const loggedOut: number[] = [];
  const unexplained: number[] = [];
  const excluded: number[] = [];

  for (const [key, raw] of Object.entries(byWeek ?? {})) {
    const week = Number(key);
    const points = Number(raw);
    if (!Number.isFinite(week) || !Number.isFinite(points)) continue;
    if (points !== 0) {
      played.push({ week, points });
      continue;
    }
    if (byeWeek != null && week === byeWeek) {
      excluded.push(week);
      continue;
    }
    if (logged.has(week)) {
      loggedOut.push(week);
      continue;
    }
    unexplained.push(week);
  }

  if (signals && "missedGames" in signals && signals.missedGames !== undefined) {
    const remaining = Math.max(0, signals.missedGames - loggedOut.length);
    if (unexplained.length <= remaining) excluded.push(...unexplained);
    else played.push(...unexplained.map((week) => ({ week, points: 0 })));
  } else {
    played.push(...unexplained.map((week) => ({ week, points: 0 })));
  }
  excluded.push(...loggedOut);

  const total = played.reduce((sum, row) => sum + row.points, 0);
  const games = played.length;
  return { total, games, ppg: games ? total / games : 0, excludedWeeks: excluded.sort((a, b) => a - b) };
}

/** Skill positions need a two-game sample. Kickers and defenses are streamed. */
export function minimumGames(slot: string): number {
  if (slot === "D/ST" || slot === "K") return 1;
  return 2;
}
