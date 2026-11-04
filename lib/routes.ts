import { getMatchup, getTeam } from "./league.ts";

const TEAM_TABS = new Set(["roster", "trades", "h2h", "history"]);

/** True for a team or matchup URL that is not in the league. Other paths are left to the app router. */
export function unknownLeaguePath(pathname: string) {
  const team = pathname.match(/^\/teams\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (team) {
    if (!/^\d+$/.test(team[1])) return true;
    if (getTeam(Number(team[1])) == null) return true;
    if (team[2] != null && !TEAM_TABS.has(team[2])) return true;
    return false;
  }
  const matchup = pathname.match(/^\/matchups\/([^/]+)\/?$/);
  if (matchup) return getMatchup(decodeURIComponent(matchup[1])) == null;
  return false;
}
