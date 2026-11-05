import assert from "node:assert/strict";
import { test } from "node:test";
import { franchiseName, USER_TEAM_ID } from "./names.ts";
import { sideOf, TRADES, tradesFor } from "./trades.ts";
import { currentSpanNote, dedupeById, isCompletedStatus, postTradeResult } from "./trade-points.ts";

test("pending, vetoed, and cancelled statuses are not completed trades", () => {
  assert.equal(isCompletedStatus("accepted"), true);
  assert.equal(isCompletedStatus(" processed "), true);
  assert.equal(isCompletedStatus("upheld"), true);
  assert.equal(isCompletedStatus(undefined), true);
  assert.equal(isCompletedStatus("pending"), false);
  assert.equal(isCompletedStatus("proposed (not accepted)"), false);
  assert.equal(isCompletedStatus("veto vote"), false);
  assert.equal(isCompletedStatus("vetoed"), false);
  assert.equal(isCompletedStatus("cancelled"), false);
  assert.equal(isCompletedStatus("canceled"), false);
  assert.equal(isCompletedStatus("declined"), false);
  assert.equal(isCompletedStatus("unprocessed"), false);
});

test("duplicate trade ids collapse to the copy with more post-trade points", () => {
  const rows = [
    { id: "2026-T6", points: 10 },
    { id: "2026-T7", points: 4 },
    { id: "2026-T6", points: 55 },
    { id: "2026-T6", points: 40 },
  ];
  const kept = dedupeById(rows, (row) => row.points);
  assert.deepEqual(
    kept.map((row) => [row.id, row.points]),
    [
      ["2026-T6", 55],
      ["2026-T7", 4],
    ],
  );
});

test("a partial-week note is dropped once several players have that week's points", () => {
  const note = "weeks 6–7, plus Jacobs' Thursday in week 8";
  assert.equal(
    currentSpanNote(note, [
      { week: 8, player: "Josh Jacobs" },
      { week: 8, player: "DJ Moore" },
    ]),
    null,
  );
  assert.equal(currentSpanNote(note, [{ week: 8, player: "Josh Jacobs" }]), note);
  assert.equal(currentSpanNote(null, []), null);
});

test("who won follows the point difference, including an edge that used to be inside the band", () => {
  const even = postTradeResult(30.3, 33);
  assert.equal(even?.verdict, "even");
  assert.equal(even?.gained, -2.7);
  const lead = postTradeResult(41.4, 30.3);
  assert.equal(lead?.verdict, "paying-off");
  assert.equal(lead?.gained, 11.1);
  assert.equal(postTradeResult(null, 10), null);
});

test("loaded trades are unique, accepted, newest first, and attributed to the receiving team", () => {
  const ids = TRADES.map((trade) => trade.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let i = 1; i < TRADES.length; i++) {
    const prev = TRADES[i - 1];
    const next = TRADES[i];
    const prevWhen = prev.acceptedAt?.getTime() ?? Date.parse(`${prev.window?.from ?? "1970-01-01"}T12:00:00Z`);
    const nextWhen = next.acceptedAt?.getTime() ?? Date.parse(`${next.window?.from ?? "1970-01-01"}T12:00:00Z`);
    assert.ok(prev.season > next.season || (prev.season === next.season && prevWhen >= nextWhen));
  }
  const trade = TRADES.find((row) => row.id === "2026-T6");
  assert.ok(trade);
  const maye = sideOf(trade, USER_TEAM_ID);
  const heart = sideOf(trade, 4);
  assert.deepEqual(
    maye.got.flatMap((asset) => (asset.kind === "player" ? [asset.name] : [])),
    ["Josh Jacobs", "Cam Skattebo", "DJ Moore"],
  );
  assert.deepEqual(
    heart.got.flatMap((asset) => (asset.kind === "player" ? [asset.name] : [])),
    ["DK Metcalf", "Chase Brown"],
  );
  assert.equal(franchiseName(USER_TEAM_ID, "Maye Day", "Maye i give you a blowj0b"), "Maye i give you a blowj0b");
  assert.ok(tradesFor(USER_TEAM_ID).some((row) => row.id === "2026-T6"));
});

test("2026-T7 is graded on points scored for the new team, not the stale points gained", () => {
  const trade = TRADES.find((row) => row.id === "2026-T7");
  assert.ok(trade);
  const fellas = sideOf(trade, 6);
  const dimes = sideOf(trade, 8);
  assert.equal(fellas.points, 30.3);
  assert.equal(dimes.points, 41.4);
  assert.equal(dimes.grade?.pointsGained, 11.1);
  assert.equal(fellas.grade?.pointsGained, -11.1);
  assert.equal(dimes.grade?.verdict, "paying-off");
  assert.equal(fellas.grade?.verdict, "backfiring");
  assert.equal(trade.edge?.teamId, 8);
  assert.equal(trade.edge?.points, 11.1);
});
