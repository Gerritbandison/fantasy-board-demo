import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { transactionFeed, type TransactionRow } from "./transactions.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("waiver and add feed is newest first and skips trades", () => {
  const rows: TransactionRow[] = [
    { teamId: 2, date: "2026-10-21", week: 7, type: "add", added: ["Old"], dropped: [] },
    { teamId: 1, date: "2026-10-31", week: 8, type: "Waiver", added: ["New"], dropped: ["X"] },
    { teamId: 1, date: "2026-10-31", week: 8, type: "trade", added: ["Nope"], dropped: [] },
    { teamId: 3, date: "2026-10-28", week: 8, type: "drop", added: [], dropped: ["Y"] },
    { teamId: 4, date: "2026-10-31", week: 8, type: "add", added: ["Later id"], dropped: [] },
  ];
  const feed = transactionFeed(rows);
  assert.deepEqual(
    feed.map((row) => row.teamId),
    [1, 4, 3, 2],
  );
  assert.equal(feed[0].type, "waiver");
  assert.ok(feed.every((row) => row.type !== "trade"));
});

test("the league file feed is newest first and only waivers, adds, and drops", () => {
  const file = JSON.parse(readFileSync(join(root, "data/league-all-teams.json"), "utf8")) as {
    teams: { teamId: number; recentTransactions: TransactionRow[] }[];
  };
  const rows = file.teams.flatMap((team) => team.recentTransactions.map((move) => ({ ...move, teamId: team.teamId })));
  const feed = transactionFeed(rows);
  assert.ok(feed.length > 0);
  assert.ok(feed.every((row) => row.type === "waiver" || row.type === "add" || row.type === "drop"));
  for (let i = 1; i < feed.length; i++) {
    assert.ok((feed[i - 1].date ?? "") >= (feed[i].date ?? ""), `${feed[i - 1].date} before ${feed[i].date}`);
  }
  assert.equal(feed[0].date, "2026-11-01");
});
