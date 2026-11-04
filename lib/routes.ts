import { getMatchup, getTeam } from "./league.ts";

/** True for a team or matchup URL that is not in the league. Other paths are left to the app router. */
export function unknownLeaguePath(pathname: string) {
  const team = pathname.match(/^\/teams\/([^/]+)\/?$/);
  if (team) {
    if (!/^\d+$/.test(team[1])) return true;
    return getTeam(Number(team[1])) == null;
  }
  const matchup = pathname.match(/^\/matchups\/([^/]+)\/?$/);
  if (matchup) return getMatchup(decodeURIComponent(matchup[1])) == null;
  return false;
}
