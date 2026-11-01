import { PLAYOFF_MODEL } from "@/lib/playoff-data";
import { SIM_COUNT, simulate, winOutChance, winOutPath } from "@/lib/playoff-sim";

export interface SimulatorPreview {
  baseline: number;
  winOut: number;
  winAll: number;
  atEight: number;
  atSeven: number;
  sims: number;
}

let cached: SimulatorPreview | undefined;

/** Baseline odds for the home-page card. Computed once per server process. */
export function simulatorPreview(): SimulatorPreview {
  if (cached) return cached;
  const base = simulate(PLAYOFF_MODEL, { n: SIM_COUNT, seed: 7, shift: 0 });
  const path = winOutPath(PLAYOFF_MODEL, { n: SIM_COUNT, seed: 11, shift: 0 });
  cached = {
    baseline: base.focusOdds,
    winOut: path[path.length - 1]?.odds ?? 0,
    winAll: winOutChance(PLAYOFF_MODEL, 0),
    atEight: base.byWins.find((row) => row.wins === 8)?.odds ?? 0,
    atSeven: base.byWins.find((row) => row.wins === 7)?.odds ?? 0,
    sims: SIM_COUNT,
  };
  return cached;
}
