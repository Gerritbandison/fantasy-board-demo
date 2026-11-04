/**
 * Write data/snapshots/<currentWeek>.json from the live data files.
 * Run this at the end of a refresh, after those files already match the scoreboard.
 * The next refresh diffs against this file. It does not invent a number.
 *
 *   node --experimental-strip-types scripts/write-snapshot.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LEAGUE } from "../lib/league.ts";
import { liveBoard } from "../lib/live-board.ts";

const board = liveBoard();
const snapshot = {
  week: LEAGUE.week,
  asOf: LEAGUE.generatedAt,
  teams: board.teams,
  results: board.results,
  adds: board.adds,
};

const dir = join(process.cwd(), "data", "snapshots");
mkdirSync(dir, { recursive: true });
const path = join(dir, `${LEAGUE.week}.json`);
writeFileSync(path, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path} (${snapshot.teams.length} teams, ${snapshot.results.length} results, ${snapshot.adds.length} moves)`);
