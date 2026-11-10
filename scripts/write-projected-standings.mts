import { readFileSync, writeFileSync } from "node:fs";
import { SIM_COUNT, simulate, type SimModel } from "../lib/playoff-sim.ts";

const round = (n: number, digits: number) => {
  const scale = 10 ** digits;
  return Math.round(n * scale) / scale;
};

const model = JSON.parse(readFileSync("data/playoff-model.json", "utf8")) as SimModel;
const league = JSON.parse(readFileSync("data/league-all-teams.json", "utf8")) as {
  teams: { teamId: number; record: { wins: number; losses: number }; pointsFor: number }[];
};
const summary = simulate(model, { n: SIM_COUNT, seed: 7, shift: 0 });
const byId = new Map(league.teams.map((team) => [team.teamId, team]));
const standings = [...summary.teams]
  .sort((a, b) => a.avgSeed - b.avgSeed || a.id - b.id)
  .map((row, index) => {
    const team = byId.get(row.id);
    if (!team) throw new Error(`missing team ${row.id}`);
    return {
      teamId: row.id,
      record_thru_wk8: `${team.record.wins}-${team.record.losses}`,
      pf_thru_wk8: team.pointsFor,
      exp_final_wins: round(row.expectedWins, 2),
      exp_final_losses: round(row.expectedLosses, 2),
      exp_final_pf: round(row.avgPf, 1),
      playoff_odds: round(row.odds, 4),
      top_seed_odds: round(row.topSeedOdds, 4),
      avg_seed: round(row.avgSeed, 2),
      projected_rank: index + 1,
    };
  });

const file = {
  asOf: "Nov 3, 2026, Week 8 final",
  playoffSpots: model.playoffSpots,
  regularSeasonWeeks: model.regularSeasonWeeks,
  tiebreak: "Wins, then total points for. A tie adds no win.",
  week8Treatment:
    "Week 8 is final and already in the record. This table is the simulator baseline: ESPN setting, nothing locked, 8,000 runs, seed 7. Rank is average finish.",
  method:
    "Same model as the playoff simulator (data/playoff-model.json): ESPN projection plus each team's bias, normal noise, 8,000 seeded runs. Counted games, including final Week 8, are not simulated again. A tie adds no win. Rank is average finish. The simulator changes when the strength slider moves or a game is locked.",
  standings,
};

writeFileSync("data/projected-standings.json", `${JSON.stringify(file, null, 2)}\n`);
console.log(standings.map((row) => `${row.projected_rank} team ${row.teamId} seed ${row.avg_seed} odds ${row.playoff_odds}`).join("\n"));
