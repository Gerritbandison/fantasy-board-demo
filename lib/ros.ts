import leagueRaw from "../data/league-all-teams.json" with { type: "json" };
import mayeByesRaw from "../data/maye-byes.json" with { type: "json" };
import rostersRaw from "../data/league-rosters.json" with { type: "json" };
import pointsRaw from "../data/player-points-w4-7.json" with { type: "json" };
import tradesRaw from "../data/league-trades.json" with { type: "json" };
import { absencesByPlayerName, applyPlayContext, type LeagueByePlayer } from "./games-played.ts";
import { PLAYOFF_MODEL } from "./playoff-data.ts";
import { buildRosterGrade, type ByeFile, type RosterPlayer, type RosterReport } from "./ros-grade.ts";

interface RawByePlayer {
  name: string;
  byeWeek?: number | null;
  playerId?: number | string | null;
  nflTeam?: string | null;
  score?: number | null;
}

interface TradeFile {
  trades?: Parameters<typeof absencesByPlayerName>[0];
}

interface RawTeamEntry {
  teamId: number;
  roster: { starters: RawByePlayer[]; bench: RawByePlayer[]; ir: RawByePlayer[] };
}

const typedRosters = rostersRaw as Record<string, RosterPlayer[]>;
const typedPoints = pointsRaw as Record<string, Record<string, number>>;
const mayeByes = mayeByesRaw as ByeFile;
const leagueTeams = (leagueRaw as { teams: RawTeamEntry[] }).teams;

function leagueByePlayers(): LeagueByePlayer[] {
  const rows: LeagueByePlayer[] = [];
  for (const teamRow of leagueTeams) {
    for (const player of [...teamRow.roster.starters, ...teamRow.roster.bench, ...teamRow.roster.ir]) {
      const playerId = player.playerId == null ? "" : String(player.playerId);
      if (!playerId) continue;
      rows.push({
        playerId,
        nflTeam: player.nflTeam ?? null,
        byeWeek: typeof player.byeWeek === "number" ? player.byeWeek : null,
        score: typeof player.score === "number" ? player.score : null,
      });
    }
  }
  return rows;
}

/** Attach bye, trade-log absences, and missed-game counts before grading. */
export function withPlayContext(rosters: Record<string, RosterPlayer[]>): Record<string, RosterPlayer[]> {
  return applyPlayContext(rosters, {
    leaguePlayers: leagueByePlayers(),
    absences: absencesByPlayerName((tradesRaw as TradeFile).trades ?? []),
    currentWeek: PLAYOFF_MODEL.currentWeek ?? 0,
    currentWeekFinal: PLAYOFF_MODEL.currentWeekFinal === true,
  });
}

const gradedRosters = withPlayContext(typedRosters);

function byesForTeam(teamRow: RawTeamEntry): ByeFile {
  const byes: Record<string, string[]> = {};
  const add = (week: string, name: string) => {
    const list = (byes[week] ??= []);
    if (!list.includes(name)) list.push(name);
  };

  for (const player of [...teamRow.roster.starters, ...teamRow.roster.bench, ...teamRow.roster.ir]) {
    if (typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek)) {
      add(String(player.byeWeek), player.name);
    }
  }

  if (teamRow.teamId === PLAYOFF_MODEL.focusId) {
    for (const [week, names] of Object.entries(mayeByes.byes)) {
      for (const name of names) add(week, name);
    }
  }

  return { byes };
}

const REPORTS_BY_TEAM = new Map<number, RosterReport>(
  leagueTeams.map((teamRow) => [
    teamRow.teamId,
    buildRosterGrade(gradedRosters, typedPoints, PLAYOFF_MODEL, byesForTeam(teamRow), String(teamRow.teamId)),
  ]),
);

export function rosterOutlookFor(teamId: number): RosterReport | undefined {
  return REPORTS_BY_TEAM.get(teamId);
}

export const MAYE_ROS = REPORTS_BY_TEAM.get(PLAYOFF_MODEL.focusId)!;
