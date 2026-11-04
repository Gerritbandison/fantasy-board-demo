import type { MatchupState } from "./league.ts";

/** Brackets are the projected final while a game is live, and only when that projection is still above the points already scored. */
export function showProjectionBracket(state: MatchupState, points: number | null, projected: number | null) {
  return state === "live" && points != null && projected != null && projected > points;
}
