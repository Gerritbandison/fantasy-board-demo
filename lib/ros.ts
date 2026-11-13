import leagueRaw from "../data/league-all-teams.json" with { type: "json" };
import mayeByesRaw from "../data/maye-byes.json" with { type: "json" };
import rostersRaw from "../data/league-rosters.json" with { type: "json" };
import pointsRaw from "../data/player-points-w4-7.json" with { type: "json" };
import { PLAYOFF_MODEL } from "./playoff-data.ts";
import { buildRosterGrade, type ByeFile, type RosterPlayer, type RosterReport } from "./ros-grade.ts";

interface RawByePlayer {
  name: string;
  byeWeek?: number | null;
}

interface RawTeamEntry {
  teamId: number;
  roster: { starters: RawByePlayer[]; bench: RawByePlayer[]; ir: RawByePlayer[] };
}

const typedRosters = rostersRaw as Record<string, RosterPlayer[]>;
const typedPoints = pointsRaw as Record<string, Record<string, number>>;
const mayeByes = mayeByesRaw as ByeFile;
const leagueTeams = (leagueRaw as { teams: RawTeamEntry[] }).teams;

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
    buildRosterGrade(typedRosters, typedPoints, PLAYOFF_MODEL, byesForTeam(teamRow), String(teamRow.teamId)),
  ]),
);

export function rosterOutlookFor(teamId: number): RosterReport | undefined {
  return REPORTS_BY_TEAM.get(teamId);
}

export const MAYE_ROS = REPORTS_BY_TEAM.get(PLAYOFF_MODEL.focusId)!;
