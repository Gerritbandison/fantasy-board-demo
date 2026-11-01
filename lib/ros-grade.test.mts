import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import type { SimModel } from "./playoff-sim.ts";
import { buildRosterGrade, type ByeFile, type RosterPlayer } from "./ros-grade.ts";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (name: string) => JSON.parse(readFileSync(join(dir, "../data", name), "utf8"));
const report = buildRosterGrade(
  read("league-rosters.json") as Record<string, RosterPlayer[]>,
  read("player-points-w4-7.json") as Record<string, Record<string, number>>,
  read("playoff-model.json") as SimModel,
  read("maye-byes.json") as ByeFile,
);

const pos = (id: string) => {
  const row = report.positions.find((item) => item.id === id);
  assert.ok(row, id);
  return row;
};

test("overall grade is B+ and third on the Weeks 9–14 projections", () => {
  assert.equal(report.letter, "B+");
  assert.equal(report.rank, 3);
  assert.equal(report.field, 10);
  assert.equal(report.ppg, 123.4);
  assert.match(report.summary, /Projection/);
});

test("position grades cite counted Weeks 4–7 numbers", () => {
  assert.equal(pos("QB").letter, "A+");
  assert.match(pos("QB").reason, /1st of 10 starting quarterbacks/);
  assert.match(pos("QB").reason, /29\.2 points per game/);
  assert.match(pos("QB").reason, /Projection: the No\. 1 QB/);

  assert.equal(pos("RB").letter, "B+");
  assert.match(pos("RB").reason, /No\. 4 RB/);
  assert.match(pos("RB").reason, /No\. 6 RB/);
  assert.match(pos("RB").reason, /15\.6 points per game/);

  assert.equal(pos("WR").letter, "B+");
  assert.match(pos("WR").reason, /Puka Nacua is 1st/);
  assert.match(pos("WR").reason, /25\.3 points per game/);
  assert.match(pos("WR").reason, /DJ Moore is the weakest starter/);
  assert.match(pos("WR").reason, /2\.7 points, Questionable/);
  assert.match(pos("WR").reason, /Projection: Moore is the No\. 7/);

  assert.equal(pos("TE").letter, "A");
  assert.match(pos("TE").reason, /Isaiah Likely is the starter/);
  assert.match(pos("TE").reason, /No\. 2 tight end/);
  assert.match(pos("TE").reason, /18\.3 points per game/);
  assert.match(pos("TE").reason, /on bye in Week 8/);
  assert.match(pos("TE").reason, /does not set this grade/);

  assert.equal(pos("FLEX").letter, "A-");
  assert.match(pos("FLEX").reason, /Matthew Golden is 2nd/);
  assert.match(pos("FLEX").reason, /No\. 3 flex/);

  assert.equal(pos("DST").letter, "C");
  assert.match(pos("DST").reason, /Week 11/);
  assert.equal(pos("K").letter, "C");
  assert.match(pos("K").reason, /no Weeks 4–7 scoring/);
  assert.equal(pos("BN").letter, "B");
});

test("Week 11 lists six starters on bye, and Weeks 9–14 are the outlook", () => {
  assert.deepEqual(report.week11Byes, ["Drake Maye", "Josh Jacobs", "Puka Nacua", "Matthew Golden", "Harold Fannin Jr.", "Patriots D/ST"]);
  assert.deepEqual(
    report.weeks.map((week) => week.week),
    [9, 10, 11, 12, 13, 14],
  );
  const crunch = report.weeks.find((week) => week.week === 11);
  assert.ok(crunch);
  assert.equal(crunch.byes.length, 6);
  assert.equal(crunch.proj, 89.2);
  assert.ok(crunch.winProb > 0.5 && crunch.winProb < 0.85);
  assert.deepEqual(report.suggestions, [
    "Likely is the starter. Fannin is in only while Likely is on bye.",
    "Add Cousins or Geno as a quarterback fallback.",
    "Stream Bucs D/ST in Week 11.",
    "Trade RB depth for a WR2.",
  ]);
});
