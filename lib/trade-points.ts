/**
 * Completed-trade rules.
 * Who won is the points the received players scored for the new team after the
 * trade, not a stored value grade and not a pointsGained figure that lagged
 * the box scores.
 */

export const POINT_EVEN_UNDER = 10;

export type PointVerdict = "paying-off" | "even" | "backfiring";

const CLOSED = new Set(["accepted", "processed", "upheld"]);

/** Pending, vetoed, declined, and cancelled rows are not completed trades. A missing status is the historical "accepted" default. */
export function isCompletedStatus(status: string | null | undefined) {
  const value = (status ?? "accepted").trim().toLowerCase();
  if (!value) return false;
  if (CLOSED.has(value)) return true;
  if (
    value.startsWith("proposed") ||
    value.startsWith("pending") ||
    value.includes("veto") ||
    value.includes("cancel") ||
    value.includes("declin") ||
    value.includes("reject") ||
    value.includes("unprocessed") ||
    value.includes("failed")
  ) {
    return false;
  }
  return false;
}

export interface WeekPoint {
  week: number;
  player: string;
}

/**
 * Drop a span note that still describes one player's partial week after the
 * file has a box-score row for more than one player in that week.
 */
export function currentSpanNote(note: string | null | undefined, weeks: WeekPoint[]) {
  if (!note) return null;
  const players = new Map<number, Set<string>>();
  for (const row of weeks) {
    const set = players.get(row.week) ?? new Set<string>();
    set.add(row.player);
    players.set(row.week, set);
  }
  const mentioned = [...note.matchAll(/week\s+(\d+)/gi)].map((match) => Number(match[1]));
  if (mentioned.some((week) => (players.get(week)?.size ?? 0) > 1)) return null;
  return note;
}

/** Keep one row per id. A later copy wins when its point total is higher, so a duplicate partial row does not replace the full one. */
export function dedupeById<T extends { id: string }>(rows: T[], points: (row: T) => number) {
  const chosen = new Map<string, T>();
  const score = new Map<string, number>();
  for (const row of rows) {
    const next = points(row);
    const prev = score.get(row.id);
    if (prev == null || next >= prev) {
      chosen.set(row.id, row);
      score.set(row.id, next);
    }
  }
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const pick = chosen.get(row.id);
    if (pick) out.push(pick);
  }
  return out;
}

export function roundPoint(value: number) {
  return Math.round(value * 10) / 10;
}

/**
 * Points the new players scored for this side, minus the same figure for the
 * partner. Under `evenUnder` is even. Null when either side has no total.
 */
export function postTradeResult(own: number | null, partner: number | null, evenUnder = POINT_EVEN_UNDER) {
  if (own == null || partner == null || !Number.isFinite(own) || !Number.isFinite(partner)) return null;
  const gained = roundPoint(own - partner);
  const verdict: PointVerdict = Math.abs(gained) < evenUnder ? "even" : gained > 0 ? "paying-off" : "backfiring";
  return { gained, verdict };
}
