export type LineupSlot =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "FLEX"
  | "K"
  | "D/ST"
  | "BN"
  | "IR";

export type GameState = "pre" | "live" | "final" | "bye";

export interface RosterPlayer {
  id: string;
  slot: LineupSlot;
  name: string;
  position: string;
  nflTeam: string;
  opponent: string | null;
  gameState: GameState;
  /** Kickoff time, game clock, or final score. */
  gameLabel: string;
  points: number | null;
  projected: number;
  injury: string | null;
}

export interface Record {
  wins: number;
  losses: number;
  ties: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  abbrev: string;
  manager: string;
  record: Record;
  standing: number | null;
  points: number;
  projected: number;
}

export interface Matchup {
  week: number;
  opponent: TeamSummary;
  /** 0-1 probability that the board's team wins, if known. */
  winProbability: number | null;
}

export interface Headline {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  tag: string | null;
}

export type DataSource = "mock" | "espn";

export interface LeagueInfo {
  name: string;
  season: number;
  week: number;
  teamCount: number;
}

export interface ConnectedPayload {
  status: "connected";
  source: DataSource;
  league: LeagueInfo;
  team: TeamSummary;
  matchup: Matchup | null;
  roster: RosterPlayer[];
  headlines: Headline[];
  updatedAt: string;
  notice: string | null;
}

export interface DisconnectedPayload {
  status: "disconnected";
  source: DataSource;
  teamName: string;
  reason: string;
  updatedAt: string;
}

export type FantasyPayload = ConnectedPayload | DisconnectedPayload;
