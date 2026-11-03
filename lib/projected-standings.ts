import raw from "@/data/projected-standings.json";
import { team } from "@/lib/league";

/*
 * Precomputed regular-season projection. Week 8 is provisional: the live leader
 * is counted as the winner. Names shown in the UI come from the team directory.
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
  .sort((a, b) => a.projected_rank - b.projected_rank)
  .map((row) => ({
    teamId: row.teamId,
    rank: row.projected_rank,
    record: row.record_thru_wk8,
    pointsFor: row.pf_thru_wk8,
    expectedWins: row.exp_final_wins,
    expectedLosses: row.exp_final_losses,
    expectedPoints: row.exp_final_pf,
    playoffOdds: row.playoff_odds,
    topSeedOdds: row.top_seed_odds,
  }));

export const PROJECTED_AS_OF = "Nov 2, Week 8 provisional";
export const PROJECTED_SPOTS = file.playoffSpots;
export const PROJECTED_WEEKS = file.regularSeasonWeeks;

/** Short note for the page. The file's method is the source; this is the public wording. */
export const PROJECTED_METHOD =
  "Expected wins and playoff odds come from 20,000 simulated seasons. Each remaining week uses a best available lineup from Nov 1–2 rest-of-season projections, scaled to this year's league scoring. The chance of winning a game comes from the projected margin. The top 4 make the playoffs. Ties break on wins, then points for. Week 8's live leader counts as the winner.";

export function projectedTeamName(teamId: number) {
  return team(teamId).name;
}
