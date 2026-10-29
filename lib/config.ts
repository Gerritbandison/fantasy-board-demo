import type { EspnConfig } from "./espn";

export interface FantasyConfig {
  teamName: string;
  mock: boolean;
  /** Forces the "connect Flaim" empty state, for demos. */
  mockDisconnected: boolean;
  espn: EspnConfig | null;
}

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return !["0", "false", "off", "no"].includes(value.trim().toLowerCase());
}

export function getFantasyConfig(): FantasyConfig {
  const teamName = process.env.FANTASY_TEAM_NAME?.trim() || "Demo Team";
  const leagueId = process.env.ESPN_LEAGUE_ID?.trim();
  const teamId = process.env.ESPN_TEAM_ID?.trim();
  const season = Number(process.env.ESPN_SEASON) || new Date().getUTCFullYear();

  return {
    teamName,
    mock: flag(process.env.MOCK_FANTASY, true),
    mockDisconnected: process.env.MOCK_FANTASY_STATE?.trim().toLowerCase() === "disconnected",
    espn:
      leagueId && teamId
        ? { leagueId, teamId, season, teamNameOverride: process.env.FANTASY_TEAM_NAME?.trim() || null }
        : null,
  };
}
