import { readFileSync, writeFileSync } from "node:fs";
import { SIM_COUNT, simulate, type SimModel } from "../lib/playoff-sim.ts";

const round = (n: number, digits: number) => {
  const scale = 10 ** digits;
  return Math.round(n * scale) / scale;
};

interface LeagueFile {
  meta: {
    currentWeek: number;
    generatedAt: string;
    weekInProgress?: { week: number; final: boolean; label: string; asOf?: string };
  };
  teams: { teamId: number; record: { wins: number; losses: number }; pointsFor: number }[];
}

const model = JSON.parse(readFileSync("data/playoff-model.json", "utf8")) as SimModel;
const league = JSON.parse(readFileSync("data/league-all-teams.json", "utf8")) as LeagueFile;
const existing = JSON.parse(readFileSync("data/projected-standings.json", "utf8")) as {
  asOf?: string;
  week8Treatment?: string;
  method?: string;
};

const summary = simulate(model, { n: SIM_COUNT, seed: 7, shift: 0 });
const byId = new Map(league.teams.map((team) => [team.teamId, team]));
const standings = summary.teams
  .map((row) => {
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
      projected_rank: 0,
    };
  })
  .sort((a, b) => a.avg_seed - b.avg_seed || a.teamId - b.teamId);

standings.forEach((row, index) => {
  row.projected_rank = index + 1;
});

const stampIso = league.meta.weekInProgress?.asOf ?? league.meta.generatedAt;
const stampDate = new Date(stampIso);
const stampText = Number.isNaN(stampDate.getTime())
  ? stampIso
  : new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(stampDate);

const wk = league.meta.currentWeek;
const isFinal = league.meta.weekInProgress?.final === true;
const statusText = isFinal
  ? `Records through Week ${wk} final.`
  : `Records through Week ${wk - 1} final. ${league.meta.weekInProgress?.label ?? `Week ${wk} in progress`}.`;

const treatment = isFinal
  ? `Week ${wk} is final and already in the record. This table is the simulator baseline: ESPN setting, nothing locked, ${SIM_COUNT.toLocaleString("en-US")} runs, seed 7. Rank is average finish.`
  : `Week ${wk - 1} is final and already in the record. Week ${wk} is in progress, so the simulator uses the live score and updated ESPN projection without double-counting the game. Baseline: ESPN setting, nothing locked, ${SIM_COUNT.toLocaleString("en-US")} runs, seed 7.`;

const file = {
  asOf: `${stampText}. ${statusText}`,
  playoffSpots: model.playoffSpots,
  regularSeasonWeeks: model.regularSeasonWeeks,
  tiebreak: "Wins, then total points for. A tie adds no win.",
  week8Treatment: treatment,
  method:
    existing.method ??
    `Same model as the playoff simulator (data/playoff-model.json): ESPN projection plus each team's bias, normal noise, ${SIM_COUNT.toLocaleString("en-US")} seeded runs. Counted games are not simulated again. A tie adds no win. Rank is average finish.`,
  standings,
};

writeFileSync("data/projected-standings.json", `${JSON.stringify(file, null, 2)}\n`);
console.log(standings.map((row) => `${row.projected_rank} team ${row.teamId} seed ${row.avg_seed} odds ${row.playoff_odds}`).join("\n"));
