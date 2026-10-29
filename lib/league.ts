import raw from "@/data/league-snapshot.json";

export interface SnapshotPlayer {
  name: string;
  slot: string;
  team?: string;
  status?: string;
}

export interface MatchupSide {
  teamId: number;
  teamName: string;
  projected: number;
  starters: SnapshotPlayer[];
  bench?: SnapshotPlayer[];
  record: string;
  rank: number;
  pointsFor: number;
}

export interface SnapshotMatchup {
  id: string;
  slug: string;
  home: MatchupSide;
  away: MatchupSide;
}

export interface Standing {
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  playoffSeed: number;
}

export interface LeagueSnapshot {
  league: { id: string; name: string; season: number; week: number; platform: string };
  displayNote: string;
  standings: Standing[];
  matchups: SnapshotMatchup[];
  insights: {
    headline: string;
    bullets: string[];
    power: { team: string; why: string }[];
  };
}

export const snapshot = raw as LeagueSnapshot;

/** Matches the snapshot insight: "Playoff cut currently runs through seed 8". */
export const PLAYOFF_SEEDS = 8;

export interface BoardConfig {
  slug: string;
  path: string;
  focusTeamId: number;
  manager: string;
}

export const BOARDS: BoardConfig[] = [
  { slug: "golden-goose", path: "/", focusTeamId: 7, manager: "Gerrit" },
  { slug: "bibis", path: "/bibis", focusTeamId: 1, manager: "Kyle · KASE" },
];

export interface Board {
  config: BoardConfig;
  matchup: SnapshotMatchup;
  focus: MatchupSide;
  opponent: MatchupSide;
  focusStanding: Standing | undefined;
  opponentStanding: Standing | undefined;
}

export function getBoard(slug: string): Board | null {
  const config = BOARDS.find((b) => b.slug === slug);
  const matchup = snapshot.matchups.find((m) => m.slug === slug);
  if (!config || !matchup) return null;
  const focusIsHome = matchup.home.teamId === config.focusTeamId;
  const focus = focusIsHome ? matchup.home : matchup.away;
  const opponent = focusIsHome ? matchup.away : matchup.home;
  return {
    config,
    matchup,
    focus,
    opponent,
    focusStanding: getStanding(focus.teamId),
    opponentStanding: getStanding(opponent.teamId),
  };
}

export function getStanding(teamId: number) {
  return snapshot.standings.find((s) => s.teamId === teamId);
}

export function getStandingByName(name: string) {
  return snapshot.standings.find((s) => s.teamName === name);
}

export function boardForTeam(teamId: number) {
  return BOARDS.find((b) => b.focusTeamId === teamId);
}

/** The op board whose featured matchup includes this team (focus or opponent). */
export function boardInvolving(teamId: number) {
  const m = snapshot.matchups.find((x) => x.home.teamId === teamId || x.away.teamId === teamId);
  return m ? boardForMatchup(m) : undefined;
}

export function boardForMatchup(m: SnapshotMatchup) {
  return BOARDS.find((b) => b.slug === m.slug);
}

export function formatRecord(s: Pick<Standing, "wins" | "losses" | "ties">) {
  return s.ties ? `${s.wins}-${s.losses}-${s.ties}` : `${s.wins}-${s.losses}`;
}

export function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function isFlagged(p: SnapshotPlayer) {
  return p.status != null && p.status !== "Active";
}
