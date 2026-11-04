import raw from "@/data/projected-standings.json";
import { team } from "@/lib/league";

/*
 * Baseline of the playoff simulator, written to JSON so the table and the
 * interactive sim start from the same model. Rank is average finish.
 * Names shown in the UI come from the team directory.
 */

interface RawRow {
  teamId: number;
  record_thru_wk8: string;
  pf_thru_wk8: number;
  exp_final_wins: number;
  exp_final_losses: number;
  exp_final_pf: number;
  playoff_odds: number;
  top_seed_odds: number;
  avg_seed: number;
  projected_rank: number;
}

interface RawFile {
  asOf: string;
  playoffSpots: number;
  regularSeasonWeeks: number;
  tiebreak: string;
  week8Treatment: string;
  method: string;
  standings: RawRow[];
}

const file = raw as RawFile;

export interface ProjectedRow {
  teamId: number;
  rank: number;
  record: string;
  pointsFor: number;
  expectedWins: number;
  expectedLosses: number;
  expectedPoints: number;
  playoffOdds: number;
  topSeedOdds: number;
}

export const PROJECTED_STANDINGS: ProjectedRow[] = [...file.standings]
  .sort((a, b) => a.avg_seed - b.avg_seed || a.teamId - b.teamId)
  .map((row, index) => ({
    teamId: row.teamId,
    rank: index + 1,
    record: row.record_thru_wk8,
    pointsFor: row.pf_thru_wk8,
    expectedWins: row.exp_final_wins,
    expectedLosses: row.exp_final_losses,
    expectedPoints: row.exp_final_pf,
    playoffOdds: row.playoff_odds,
    topSeedOdds: row.top_seed_odds,
  }));

export const PROJECTED_AS_OF = file.asOf;
export const PROJECTED_NOTE = file.week8Treatment;
export const PROJECTED_SPOTS = file.playoffSpots;
export const PROJECTED_WEEKS = file.regularSeasonWeeks;
export const PROJECTED_METHOD = file.method;

export function projectedTeamName(teamId: number) {
  return team(teamId).name;
}
