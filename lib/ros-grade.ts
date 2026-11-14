import { minimumGames, splitScoringLines } from "./games-played.ts";
import { focusWinProb, type SimGame, type SimModel } from "./playoff-sim.ts";

/**
 * Rest-of-season grades for one franchise.
 * Counted rates come from the current roster and the games the player played.
 * See games-played.ts for which zeros are left out.
 * Each slot is graded from whoever is in it. A bye, a benching, or a drop
 * removes that player from the starter board instead of throwing.
 * An empty slot or a player with no games played omits the grade. No number is filled in.
 *
 * Rank is points per game played. The tiebreak is total points, then name.
 * Skill slots need 2 games. Kickers and defenses need 1.
 * A letter is one quarter of that ranked list: A, then B, then C, then D.
 * The cutoff rounds up, so a short list may not reach D.
 * A unit letter is the average of its starters' letters, and a .5 rounds up.
 * The team letter uses the same four groups on ESPN projected points per week.
 */

export interface RosterPlayer {
  id: string;
  name: string;
  pos: string;
  slot: string;
  inj: string | null;
  own: number;
  gp: number | null;
  /** NFL abbreviation. Used to resolve a stale bye after a trade. */
  team?: string | null;
  /** Resolved NFL bye. Set by the roster loader. Absent means the bye is unknown. */
  byeWeek?: number | null;
  /** Weeks the 2026 trade log marks out or zero-snap. */
  didNotPlayWeeks?: number[];
  /**
   * Games missed against the NFL team's games.
   * Undefined skips that inference and keeps unexplained zeros.
   */
  missedGames?: number;
}

export interface ByeFile {
  byes: Record<string, string[]>;
}

export interface GradePlayer {
  id: string;
  name: string;
  pos: string;
  slot: string;
  rank: number | null;
  field: number | null;
  ppg: number | null;
  total: number | null;
  /** Games actually played inside the scoring sample. */
  weeks: number;
  byeWeeks: number[];
  onByeBench: boolean;
}

export interface PosGrade {
  id: string;
  label: string;
  letter: string;
  reason: string;
  players: GradePlayer[];
}

export interface WeekOutlook {
  week: number;
  opponentId: number;
  home: boolean;
  proj: number;
  oppProj: number;
  winProb: number;
  byes: string[];
}

export interface RosterReport {
  letter: string;
  rank: number;
  field: number;
  ppg: number | null;
  sampleLabel: string;
  summary: string;
  positions: PosGrade[];
  weeks: WeekOutlook[];
  suggestions: string[];
  week11Byes: string[];
}

interface Scored {
  id: string;
  name: string;
  pos: string;
  slot: string;
  teamId: string;
  inj: string | null;
  total: number;
  weeks: number;
  ppg: number;
}

interface SlotGroup {
  id: string;
  label: string;
  slot: string;
  plural: string;
}

const LETTER_VALUE: { [letter: string]: number } = { A: 4, B: 3, C: 2, D: 1 };
const SLOTS: SlotGroup[] = [
  { id: "QB", label: "QB", slot: "QB", plural: "quarterbacks" },
  { id: "RB", label: "RB", slot: "RB", plural: "running backs" },
  { id: "WR", label: "WR", slot: "WR", plural: "wide receivers" },
  { id: "TE", label: "TE", slot: "TE", plural: "tight ends" },
  { id: "FLEX", label: "FLEX", slot: "FLEX", plural: "flexes" },
  { id: "DST", label: "D/ST", slot: "D/ST", plural: "defenses" },
  { id: "K", label: "K", slot: "K", plural: "kickers" },
];
const STARTING_SLOTS = new Set(SLOTS.map((group) => group.slot));

function ordinal(n: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
}

function one(n: number) {
  return n.toFixed(1);
}

/** One quarter of the ranked list, with the cutoff rounded up. */
export function letterForRank(rank: number, field: number) {
  if (field < 1 || rank < 1) return "—";
  const quarter = Math.ceil(field * 0.25);
  if (rank <= quarter) return "A";
  if (rank <= quarter * 2) return "B";
  if (rank <= quarter * 3) return "C";
  return "D";
}

/** Average of the starters' letters. A half step rounds toward A. */
export function unitLetter(ranks: { rank: number; field: number }[]) {
  const values = ranks.map((row) => LETTER_VALUE[letterForRank(row.rank, row.field)]).filter((value) => value != null);
  if (!values.length) return "—";
  const rounded = Math.min(4, Math.max(1, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)));
  return ["", "D", "C", "B", "A"][rounded] ?? "—";
}

function scoreAll(rosters: Record<string, RosterPlayer[]>, points: Record<string, Record<string, number>>): Scored[] {
  const rows: Scored[] = [];
  for (const [teamId, players] of Object.entries(rosters)) {
    for (const player of players) {
      const sample = splitScoringLines(points[player.id], player);
      rows.push({
        id: player.id,
        name: player.name,
        pos: player.pos,
        slot: player.slot,
        teamId,
        inj: player.inj,
        total: sample.total,
        weeks: sample.games,
        ppg: sample.ppg,
      });
    }
  }
  return rows;
}

function sampleWeeks(points: Record<string, Record<string, number>>) {
  const weeks = new Set<number>();
  for (const row of Object.values(points)) {
    for (const key of Object.keys(row)) {
      const week = Number(key);
      if (Number.isFinite(week)) weeks.add(week);
    }
  }
  return [...weeks].sort((a, b) => a - b);
}

function sampleLabel(weeks: number[]) {
  if (weeks.length === 0) return "the scoring file";
  if (weeks.length === 1) return `Week ${weeks[0]}`;
  return `Weeks ${weeks[0]}\u2013${weeks[weeks.length - 1]}`;
}

function gamesPhrase(games: number) {
  return games === 1 ? "1 game played" : `${games} games played`;
}

function board(rows: Scored[], slot: string, minWeeks: number) {
  return rows
    .filter((row) => row.slot === slot && row.weeks >= minWeeks)
    .sort((a, b) => b.ppg - a.ppg || b.total - a.total || a.name.localeCompare(b.name));
}

function ahead(row: Scored, other: Scored) {
  if (row.ppg !== other.ppg) return row.ppg > other.ppg;
  if (row.total !== other.total) return row.total > other.total;
  return row.name.localeCompare(other.name) < 0;
}

function rankOn(rows: Scored[], row: Scored, minWeeks: number) {
  if (row.weeks < minWeeks) return null;
  const index = rows.findIndex((item) => item.id === row.id && item.teamId === row.teamId);
  if (index >= 0) return { rank: index + 1, field: rows.length };
  const better = rows.filter((item) => ahead(item, row)).length;
  return { rank: better + 1, field: rows.length + 1 };
}

function byeWeeksFor(byes: ByeFile, name: string) {
  return Object.entries(byes.byes)
    .filter(([, names]) => names.includes(name))
    .map(([week]) => Number(week))
    .filter((week) => Number.isFinite(week))
    .sort((a, b) => a - b);
}

function weekList(weeks: number[]) {
  if (weeks.length === 1) return `Week ${weeks[0]}`;
  if (weeks.length === 2) return `Weeks ${weeks[0]} and ${weeks[1]}`;
  return `Weeks ${weeks.slice(0, -1).join(", ")}, and ${weeks[weeks.length - 1]}`;
}

function rankPhrase(rank: number, field: number, group: SlotGroup) {
  if (group.slot === "FLEX") return `${ordinal(rank)} of ${field} players in a FLEX slot`;
  return `${ordinal(rank)} of ${field} starting ${group.plural}`;
}

function factFor(row: Scored, comparison: Scored[], minWeeks: number, byes: ByeFile, onByeBench: boolean): GradePlayer {
  const placement = rankOn(comparison, row, minWeeks);
  const scored = row.weeks > 0;
  return {
    id: row.id,
    name: row.name,
    pos: row.pos,
    slot: row.slot,
    rank: placement?.rank ?? null,
    field: placement?.field ?? null,
    ppg: scored ? row.ppg : null,
    total: scored ? row.total : null,
    weeks: row.weeks,
    byeWeeks: byeWeeksFor(byes, row.name),
    onByeBench,
  };
}

function shownByes(weeks: number[], currentWeek: number | null) {
  if (currentWeek == null) return weeks;
  return weeks.filter((week) => week >= currentWeek);
}

function underMinimum(row: Scored, fact: GradePlayer, label: string, injury: string, slot: string) {
  return `${row.name} scored ${one(fact.ppg ?? 0)} points per game over ${gamesPhrase(fact.weeks)} in ${label} (${one(fact.total ?? 0)} points)${injury}. Fewer than ${minimumGames(slot)} games, so there is no rank.`;
}

function starterSentence(row: Scored, fact: GradePlayer, group: SlotGroup, label: string, currentWeek: number | null) {
  const injury = row.inj ? `, ${row.inj}` : "";
  const byeWeeks = shownByes(fact.byeWeeks, currentWeek);
  const bye = byeWeeks.length ? ` On bye in ${weekList(byeWeeks)}.` : "";
  if (fact.rank == null || fact.field == null || fact.ppg == null || fact.total == null) {
    if (fact.weeks > 0 && fact.ppg != null && fact.total != null) return underMinimum(row, fact, label, injury, row.slot);
    return `${row.name} has no games played in ${label}${injury}.`;
  }
  return `${row.name} is ${rankPhrase(fact.rank, fact.field, group)} at ${one(fact.ppg)} points per game over ${label} (${one(fact.total)} points, ${gamesPhrase(fact.weeks)})${injury}.${bye}`;
}

function benchSentence(row: Scored, fact: GradePlayer, group: SlotGroup, label: string, currentWeek: number | null) {
  const byeLead =
    fact.onByeBench && currentWeek != null
      ? `${row.name} is on the bench and on bye in Week ${currentWeek}. `
      : `${row.name} is on the bench. `;
  if (fact.ppg == null || fact.total == null) return `${byeLead.trim()} No games played in ${label}.`;
  if (fact.rank == null || fact.field == null) return `${byeLead}${underMinimum(row, fact, label, "", row.pos)}`;
  return `${byeLead}${row.name} scored ${one(fact.ppg)} points per game over ${label} (${one(fact.total)} points, ${gamesPhrase(fact.weeks)}), which would rank ${rankPhrase(fact.rank, fact.field, group)}.`;
}

function rosterByeNames(byes: ByeFile, week: string, names: Set<string>) {
  return (byes.byes[week] ?? []).filter((name) => names.has(name));
}

export function buildRosterGrade(
  rosters: Record<string, RosterPlayer[]>,
  points: Record<string, Record<string, number>>,
  model: SimModel,
  byes: ByeFile,
  focusTeamId = String(model.focusId),
): RosterReport {
  const targetId = Number(focusTeamId);
  const scopedModel: SimModel = Number.isFinite(targetId) ? { ...model, focusId: targetId } : model;
  const scored = scoreAll(rosters, points);
  const focus = scored.filter((row) => row.teamId === focusTeamId);
  const names = new Set(focus.map((row) => row.name));
  const weeks = sampleWeeks(points);
  const label = sampleLabel(weeks);
  const currentWeek = scopedModel.currentWeek ?? null;
  const currentBye = new Set(currentWeek == null ? [] : rosterByeNames(byes, String(currentWeek), names));
  const positions: PosGrade[] = [];
  const byeBenchIds = new Set<string>();

  for (const group of SLOTS) {
    const minWeeks = minimumGames(group.slot);
    const comparison = board(scored, group.slot, minWeeks);
    const starters = focus.filter((row) => row.slot === group.slot);
    const byeBench = group.slot === "FLEX" ? [] : focus.filter((row) => row.pos === group.slot && row.slot !== group.slot && currentBye.has(row.name));
    const rows = [
      ...starters.map((row) => ({ row, onByeBench: false })),
      ...byeBench.map((row) => ({ row, onByeBench: true })),
    ];
    if (!rows.some((item) => item.row.weeks > 0)) continue;

    const players = rows.map((item) => factFor(item.row, comparison, minWeeks, byes, item.onByeBench));
    for (const item of rows) if (item.onByeBench) byeBenchIds.add(item.row.id);
    const starterRanks = players.filter((player) => !player.onByeBench && player.rank != null && player.field != null);
    const ranked = starterRanks.length ? starterRanks : players.filter((player) => player.rank != null && player.field != null);
    const sentences = rows.map((item, index) =>
      item.onByeBench
        ? benchSentence(item.row, players[index], group, label, currentWeek)
        : starterSentence(item.row, players[index], group, label, currentWeek),
    );
    positions.push({
      id: group.id,
      label: group.label,
      letter: unitLetter(ranked.map((player) => ({ rank: player.rank ?? 0, field: player.field ?? 0 }))),
      reason: sentences.join(" "),
      players,
    });
  }

  const benchGroup: SlotGroup = { id: "BN", label: "Bench", slot: "Bench", plural: "players" };
  const benched = focus
    .filter((row) => row.slot === "Bench" && !byeBenchIds.has(row.id) && row.weeks > 0)
    .sort((a, b) => b.ppg - a.ppg || b.total - a.total || a.name.localeCompare(b.name));
  if (benched.length) {
    const players = benched.map((row) => {
      const group = SLOTS.find((item) => item.slot === row.pos);
      const minWeeks = minimumGames(row.pos);
      const comparison = group ? board(scored, group.slot, minWeeks) : [];
      return factFor(row, comparison, minWeeks, byes, false);
    });
    const sentences = benched.map((row, index) => {
      const group = SLOTS.find((item) => item.slot === row.pos) ?? benchGroup;
      return benchSentence(row, players[index], group, label, null);
    });
    const ranked = players.filter((player) => player.rank != null && player.field != null);
    positions.push({
      id: "BN",
      label: "Bench",
      letter: unitLetter(ranked.map((player) => ({ rank: player.rank ?? 0, field: player.field ?? 0 }))),
      reason: sentences.join(" "),
      players,
    });
  }

  const firstOpen = scopedModel.currentWeek == null ? 9 : scopedModel.currentWeekFinal === false ? scopedModel.currentWeek : scopedModel.currentWeek + 1;
  const ros = new Map<number, { sum: number; n: number }>();
  for (const game of scopedModel.games) {
    if (game.week < firstOpen) continue;
    for (const [id, proj] of [
      [game.homeId, game.homeProj],
      [game.awayId, game.awayProj],
    ] as const) {
      const row = ros.get(id) ?? { sum: 0, n: 0 };
      row.sum += proj;
      row.n += 1;
      ros.set(id, row);
    }
  }
  const rosRows = [...ros.entries()]
    .map(([id, row]) => ({ id, ppg: row.n ? row.sum / row.n : 0 }))
    .sort((a, b) => b.ppg - a.ppg || a.id - b.id);
  const rosIndex = rosRows.findIndex((row) => row.id === scopedModel.focusId);
  const rosRank = rosIndex + 1;
  const rosPpg = rosIndex >= 0 ? Math.round(rosRows[rosIndex].ppg * 10) / 10 : null;
  const letter = rosIndex >= 0 ? letterForRank(rosRank, rosRows.length) : "—";

  const outlook = scopedModel.games
    .filter((game) => game.week >= firstOpen && (game.homeId === scopedModel.focusId || game.awayId === scopedModel.focusId))
    .map((game) => weekOutlook(scopedModel, game, byes, names))
    .sort((a, b) => a.week - b.week);
  const span =
    outlook.length === 0
      ? ""
      : outlook[0].week === outlook[outlook.length - 1].week
        ? `Week ${outlook[0].week}`
        : `Weeks ${outlook[0].week}\u2013${outlook[outlook.length - 1].week}`;

  const suggestions: string[] = [];
  for (const row of focus) {
    if (!STARTING_SLOTS.has(row.slot) && currentBye.has(row.name) && currentWeek != null) {
      suggestions.push(`${row.name} is on bye in Week ${currentWeek} and is not starting.`);
    }
  }
  for (const group of SLOTS) {
    if (!focus.some((row) => row.slot === group.slot)) suggestions.push(`The ${group.label} slot is empty.`);
  }
  const quarterbacks = focus.filter((row) => row.pos === "QB");
  if (quarterbacks.some((row) => row.slot === "QB") && quarterbacks.every((row) => row.slot === "QB")) {
    suggestions.push("No backup quarterback is on the roster.");
  }

  return {
    letter,
    rank: rosIndex >= 0 ? rosRank : 0,
    field: rosRows.length,
    ppg: rosPpg,
    sampleLabel: label,
    summary:
      rosPpg == null
        ? "No rest-of-season team projection is in the playoff model."
        : `${ordinal(rosRank)} of ${rosRows.length} on ${span} team projections, ${one(rosPpg)} points per week. The letter splits that ranking into four groups. Projection from the ESPN weekly totals in the playoff model. The record is a separate argument.`,
    positions,
    weeks: outlook,
    suggestions,
    week11Byes: rosterByeNames(byes, "11", names),
  };
}

function weekOutlook(model: SimModel, game: SimGame, byes: ByeFile, names: Set<string>): WeekOutlook {
  const home = game.homeId === model.focusId;
  return {
    week: game.week,
    opponentId: home ? game.awayId : game.homeId,
    home,
    proj: home ? game.homeProj : game.awayProj,
    oppProj: home ? game.awayProj : game.homeProj,
    winProb: focusWinProb(model, game, 0),
    byes: rosterByeNames(byes, String(game.week), names),
  };
}
