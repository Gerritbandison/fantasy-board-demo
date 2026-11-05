/**
 * Lineup table for a franchise.
 * Slot order matches a standard ESPN lineup. Numbers come only from the player
 * record. A missing stat stays null so the page can print "--".
 */

export const STARTER_SLOTS = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "D/ST", "K"] as const;

export interface RosterPlayer {
  name: string;
  position: string;
  nflTeam?: string;
  slot: string;
  status?: string;
  onBye?: boolean;
  playerId?: string;
  /** ESPN-wide percent of leagues that roster the player. */
  percentRostered?: number;
  opponent?: string;
  /** Kickoff or game state, such as "Sun 1:00 PM". */
  gameStatus?: string;
  projection?: number;
  score?: number;
  opponentRank?: number;
  percentStarted?: number;
  seasonRank?: number;
  seasonPoints?: number;
  seasonAverage?: number;
  lastPoints?: number;
}

export interface RosterGroups {
  starters: RosterPlayer[];
  bench: RosterPlayer[];
  ir: RosterPlayer[];
}

export interface SlotRow {
  slot: string;
  player: RosterPlayer | null;
}

/** Sums of the stat columns ESPN totals. Percents and ranks are not summed. */
export interface StatTotals {
  projection: number | null;
  score: number | null;
  seasonPoints: number | null;
  seasonAverage: number | null;
  lastPoints: number | null;
}

export interface RosterBoard {
  starters: SlotRow[];
  bench: RosterPlayer[];
  ir: RosterPlayer[];
  starterTotals: StatTotals;
  benchTotals: StatTotals;
}

const SLOT_ALIAS: { [key: string]: string } = {
  DST: "D/ST",
  DEF: "D/ST",
  "D/ST": "D/ST",
  BN: "Bench",
  BE: "Bench",
  BENCH: "Bench",
  IR: "IR",
};

const INJURY_BADGE: { [status: string]: string } = {
  Questionable: "Q",
  Doubtful: "D",
  Out: "O",
  IR: "IR",
  PUP: "PUP",
  Suspension: "SUS",
  Suspended: "SUS",
};

export function canonicalSlot(slot: string) {
  const trimmed = slot.trim();
  return SLOT_ALIAS[trimmed.toUpperCase()] ?? SLOT_ALIAS[trimmed] ?? trimmed;
}

/** Short injury badge when the file has a status. Active and blank stay empty. */
export function injuryBadge(status?: string | null) {
  if (!status || status === "Active") return null;
  return INJURY_BADGE[status] ?? status;
}

export function sumDefined(values: (number | null | undefined)[]) {
  const nums = values.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((sum, n) => sum + n, 0);
}

function totals(players: (RosterPlayer | null)[]): StatTotals {
  return {
    projection: sumDefined(players.map((p) => p?.projection)),
    score: sumDefined(players.map((p) => p?.score)),
    seasonPoints: sumDefined(players.map((p) => p?.seasonPoints)),
    seasonAverage: sumDefined(players.map((p) => p?.seasonAverage)),
    lastPoints: sumDefined(players.map((p) => p?.lastPoints)),
  };
}

/**
 * Fill QB, RB, RB, WR, WR, TE, FLEX, D/ST, K from lineup slots.
 * Players left over stay on the bench, except IR slots.
 * An unfilled starter slot is an empty row, not a hidden one.
 */
export function buildRosterBoard(groups: RosterGroups): RosterBoard {
  const pool = [...groups.starters, ...groups.bench, ...groups.ir];
  const starters: SlotRow[] = STARTER_SLOTS.map((slot) => {
    const index = pool.findIndex((player) => canonicalSlot(player.slot) === slot);
    const player = index >= 0 ? pool.splice(index, 1)[0] : null;
    return { slot, player };
  });
  const bench: RosterPlayer[] = [];
  const ir: RosterPlayer[] = [];
  for (const player of pool) {
    if (canonicalSlot(player.slot) === "IR") ir.push(player);
    else bench.push(player);
  }
  return {
    starters,
    bench,
    ir,
    starterTotals: totals(starters.map((row) => row.player)),
    benchTotals: totals(bench),
  };
}

export function formatStat(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toFixed(digits);
}

export function opponentLabel(player: RosterPlayer | null) {
  if (!player) return "--";
  if (player.onBye) return "BYE";
  return player.opponent ?? "--";
}

export function gameStatusLabel(player: RosterPlayer | null) {
  if (!player) return "--";
  if (player.onBye) return "BYE";
  return player.gameStatus ?? "--";
}
