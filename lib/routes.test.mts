import assert from "node:assert/strict";
import { test } from "node:test";
import { unknownLeaguePath } from "./routes.ts";

test("unknown team and matchup paths are rejected and known ones are not", () => {
  assert.equal(unknownLeaguePath("/teams/99"), true);
  assert.equal(unknownLeaguePath("/teams/nope"), true);
  assert.equal(unknownLeaguePath("/teams/7"), false);
  assert.equal(unknownLeaguePath("/teams/7/roster"), false);
  assert.equal(unknownLeaguePath("/teams/7/trades"), false);
  assert.equal(unknownLeaguePath("/teams/7/h2h"), false);
  assert.equal(unknownLeaguePath("/teams/7/history"), false);
  assert.equal(unknownLeaguePath("/teams/7/nope"), true);
  assert.equal(unknownLeaguePath("/teams/99/roster"), true);
  assert.equal(unknownLeaguePath("/matchups/nope"), true);
  assert.equal(unknownLeaguePath("/matchups/golden-goose"), false);
  assert.equal(unknownLeaguePath("/history"), false);
});
