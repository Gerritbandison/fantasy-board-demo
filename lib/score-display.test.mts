import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreEmphasis, showProjectionBracket } from "./score-display.ts";

test("a live projection is hidden once it is below the points already scored", () => {
  assert.equal(showProjectionBracket("live", 120.64, 108.58), false);
  assert.equal(showProjectionBracket("live", 114.92, 115.27), true);
  assert.equal(showProjectionBracket("live", 114.92, 114.92), false);
});

test("a final scoreboard emphasizes the winner, and a projected board emphasizes the favorite", () => {
  assert.equal(scoreEmphasis("final", 97.66, 138.5, 114.92, 115.27), "plain");
  assert.equal(scoreEmphasis("final", 114.92, 115.27, 97.66, 138.5), "ahead");
  assert.equal(scoreEmphasis("final", 179.26, 128.52, 89.36, 121.66), "ahead");
  assert.equal(scoreEmphasis("live", 80, 120, 90, 100), "plain");
  assert.equal(scoreEmphasis("live", 90, 100, 80, 120), "ahead");
  assert.equal(scoreEmphasis("projected", null, 138.5, null, 115.27), "favorite");
  assert.equal(scoreEmphasis("projected", null, 115.27, null, 138.5), "plain");
  assert.equal(scoreEmphasis("final", 100, 90, 100, 110), "plain");
});

test("a finished game shows the score without a projection bracket", () => {
  assert.equal(showProjectionBracket("final", 179.26, 128.52), false);
  assert.equal(showProjectionBracket("final", 97.66, 138.5), false);
  assert.equal(showProjectionBracket("projected", null, 130.2), false);
});
