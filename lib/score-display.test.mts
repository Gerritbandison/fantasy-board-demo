import assert from "node:assert/strict";
import { test } from "node:test";
import { showProjectionBracket } from "./score-display.ts";

test("a live projection is hidden once it is below the points already scored", () => {
  assert.equal(showProjectionBracket("live", 120.64, 108.58), false);
  assert.equal(showProjectionBracket("live", 114.92, 115.27), true);
  assert.equal(showProjectionBracket("live", 114.92, 114.92), false);
});

test("a finished game shows the score without a projection bracket", () => {
  assert.equal(showProjectionBracket("final", 179.26, 128.52), false);
  assert.equal(showProjectionBracket("final", 97.66, 138.5), false);
  assert.equal(showProjectionBracket("projected", null, 130.2), false);
});
