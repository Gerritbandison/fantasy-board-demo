import type { MatchupState } from "./league.ts";

/** Brackets are the projected final while a game is live, and only when that projection is still above the points already scored. */
export function showProjectionBracket(state: MatchupState, points: number | null, projected: number | null) {
  return state === "live" && points != null && projected != null && projected > points;
}

/** Which side the scoreboard should emphasize.
 * A final or live score emphasizes the side ahead. A projected score emphasizes the favorite.
 * A tie emphasizes neither side.
 */
export function scoreEmphasis(
  state: MatchupState,
  points: number | null,
  projected: number | null,
  opponentPoints: number | null,
  opponentProjected: number | null,
): "ahead" | "favorite" | "plain" {
  if (state === "final" || state === "live") {
    if (points == null || opponentPoints == null || points <= opponentPoints) return "plain";
    return "ahead";
  }
  if (projected != null && opponentProjected != null && projected > opponentProjected) return "favorite";
  return "plain";
}
