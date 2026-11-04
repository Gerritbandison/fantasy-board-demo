import assert from "node:assert/strict";
import { test } from "node:test";
import { diffSnapshot, latestSnapshotName, snapshotWeekFromName, type SnapshotCurrent, type SnapshotFile } from "./snapshot.ts";

const prior: SnapshotFile = {
  week: 7,
  asOf: "2026-10-28",
  teams: [
    { teamId: 1, projectedRank: 2, playoffOdds: 0.8, powerRank: 3 },
    { teamId: 7, projectedRank: 8, playoffOdds: 0.2, powerRank: 9 },
  ],
  results: [{ week: 7, homeId: 1, awayId: 2, winnerId: 1 }],
  adds: [{ teamId: 1, date: "2026-10-21", type: "add", added: ["A"], dropped: [] }],
};

const current: SnapshotCurrent = {
  teams: [
    { teamId: 1, projectedRank: 1, playoffOdds: 0.9, powerRank: 1 },
    { teamId: 7, projectedRank: 9, playoffOdds: 0.1, powerRank: 9 },
  ],
  results: [
    { week: 7, homeId: 1, awayId: 2, winnerId: 1 },
    { week: 8, homeId: 7, awayId: 8, winnerId: 7 },
  ],
  adds: [
    { teamId: 1, date: "2026-10-21", type: "add", added: ["A"], dropped: [] },
    { teamId: 7, date: "2026-10-31", type: "waiver", added: ["Jonah Coleman (RB, DEN)"], dropped: ["C.J. Stroud (QB, HOU)"] },
    { teamId: 3, date: "2026-10-31", type: "drop", added: [], dropped: ["Only a drop"] },
  ],
};

test("a missing snapshot reports no movement", () => {
  const diff = diffSnapshot(null, current);
  assert.equal(diff.available, false);
  assert.equal(diff.week, null);
  assert.deepEqual(diff.odds, []);
  assert.deepEqual(diff.movers, []);
  assert.deepEqual(diff.newResults, []);
  assert.deepEqual(diff.notableAdds, []);
});

test("odds, power, new results, and adds come only from the prior snapshot", () => {
  const diff = diffSnapshot(prior, current);
  assert.equal(diff.available, true);
  assert.equal(diff.week, 7);
  const one = diff.odds.find((row) => row.teamId === 1);
  const seven = diff.odds.find((row) => row.teamId === 7);
  assert.ok(one);
  assert.ok(seven);
  assert.equal(one.playoffOddsDelta, 0.1);
  assert.equal(one.powerDelta, 2);
  assert.equal(one.projectedRankDelta, 1);
  assert.equal(seven.playoffOddsDelta, -0.1);
  assert.equal(seven.powerDelta, 0);
  assert.equal(seven.projectedRankDelta, -1);
  assert.deepEqual(
    diff.movers.map((row) => row.teamId),
    [1, 7],
  );
  assert.equal(diff.newResults.length, 1);
  assert.equal(diff.newResults[0].winnerId, 7);
  assert.equal(diff.notableAdds.length, 1);
  assert.equal(diff.notableAdds[0].teamId, 7);
  assert.equal(diff.notableAdds[0].type, "waiver");
});

test("an unchanged result is not a new result", () => {
  const diff = diffSnapshot(prior, { ...current, results: prior.results, adds: prior.adds });
  assert.deepEqual(diff.newResults, []);
  assert.deepEqual(diff.notableAdds, []);
});

test("snapshot file names are the week number", () => {
  assert.equal(snapshotWeekFromName("8.json"), 8);
  assert.equal(snapshotWeekFromName("manifest.json"), null);
  assert.equal(snapshotWeekFromName("week-8.json"), null);
  assert.equal(latestSnapshotName(["7.json", "notes.txt", "8.json"]), "8.json");
  assert.equal(latestSnapshotName(["manifest.json"]), null);
});
