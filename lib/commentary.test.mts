import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyGame,
  gameCommentary,
  resultCallout,
  slateRead,
  teamBlurb,
  type GameInput,
} from "./commentary.ts";

const base = (over: Partial<GameInput> = {}): GameInput => ({
  state: "final",
  seed: 1,
  left: { name: "Home", points: 110, projected: 120, wins: 4, losses: 4, lossesInARow: 0 },
  right: { name: "Away", points: 100, projected: 105, wins: 4, losses: 4, lossesInARow: 0 },
  ...over,
});

test("projection collapse is a favorite who lost and missed by at least 15", () => {
  const game = base({
    left: { name: "Kabul FC", points: 114.92, projected: 115.27, wins: 4, losses: 4, lossesInARow: 0 },
    right: { name: "Easy Peasy Lemon Squeezy", points: 97.66, projected: 138.5, wins: 3, losses: 5, lossesInARow: 1 },
  });
  assert.equal(classifyGame(game), "projection-collapse");
  const text = gameCommentary(game).lines.join(" ");
  assert.match(text, /138\.5/);
  assert.match(text, /97\.66/);
  assert.match(text, /114\.92/);
  assert.match(text, /Easy Peasy Lemon Squeezy/);
  assert.doesNotMatch(text, /Easy Peasy Lemon Squeezy won/);
});

test("a 25-point win is a blowout, including a high score that also blew the game open", () => {
  const game = base({
    seed: 2,
    left: { name: "Maye i give you a blowj0b", points: 179.26, projected: 128.52, wins: 3, losses: 5, lossesInARow: 0 },
    right: { name: "Dimes McSorley", points: 89.36, projected: 121.66, wins: 5, losses: 3, lossesInARow: 1 },
  });
  assert.equal(classifyGame(game), "blowout");
  const text = gameCommentary(game).lines.join(" ");
  assert.match(text, /^179\.26 to 89\.36\./);
  assert.match(text, /89\.9/);
  assert.match(text, /Maye i give you a blowj0b/);
  assert.doesNotMatch(text, /lower projection/);
  assert.doesNotMatch(text, /blowj0b (is|was) (a joke|funny|the name)/i);
});

test("an underdog win without a 15-point projection miss is an upset", () => {
  const game = base({
    left: { name: "Dog", points: 112, projected: 104, wins: 4, losses: 4, lossesInARow: 0 },
    right: { name: "Favorite", points: 108, projected: 118, wins: 5, losses: 3, lossesInARow: 0 },
  });
  assert.equal(classifyGame(game), "upset");
  const text = gameCommentary(game).lines.join(" ");
  assert.match(text, /Favorite/);
  assert.match(text, /10\.0/);
  assert.match(text, /lower projection|underdog|favorite/i);
});

test("a game decided by fewer than 6 is a close game", () => {
  const game = base({
    left: { name: "Left", points: 101.4, projected: 110, wins: 4, losses: 4, lossesInARow: 0 },
    right: { name: "Right", points: 99.2, projected: 108, wins: 4, losses: 4, lossesInARow: 0 },
  });
  assert.equal(classifyGame(game), "close-game");
  const text = gameCommentary(game).lines.join(" ");
  assert.match(text, /101\.4/);
  assert.match(text, /99\.2/);
  assert.match(text, /2\.2/);
});

test("a short loss on a three-game skid is a losing streak", () => {
  const game = base({
    left: { name: "Winner", points: 108, projected: 110, wins: 5, losses: 3, lossesInARow: 0 },
    right: { name: "Skid", points: 100, projected: 107, wins: 2, losses: 6, lossesInARow: 4 },
  });
  assert.equal(classifyGame(game), "losing-streak");
  const text = gameCommentary(game).lines.join(" ");
  assert.match(text, /2-6/);
  assert.match(text, /4 straight/);
  assert.match(text, /100/);
});

test("a 160-point week that stays inside 25 points is a high score", () => {
  const game = base({
    left: { name: "Cannon", points: 165.4, projected: 140, wins: 6, losses: 2, lossesInARow: 0 },
    right: { name: "Other", points: 148.2, projected: 145, wins: 4, losses: 4, lossesInARow: 0 },
  });
  assert.equal(classifyGame(game), "high-score");
  const text = gameCommentary(game).lines.join(" ");
  assert.match(text, /165\.4/);
  assert.match(text, /Cannon/);
});

test("the same facts change wording with the seed and keep the numbers", () => {
  const game = base({
    left: { name: "Alpha", points: 140, projected: 125, wins: 6, losses: 2, lossesInARow: 0 },
    right: { name: "Beta", points: 100, projected: 110, wins: 3, losses: 5, lossesInARow: 0 },
  });
  const a = gameCommentary({ ...game, seed: 1 }).lines.join(" ");
  const b = gameCommentary({ ...game, seed: 2 }).lines.join(" ");
  assert.notEqual(a, b);
  for (const text of [a, b]) {
    assert.match(text, /140/);
    assert.match(text, /100/);
    assert.match(text, /40\.0/);
  }
});

test("a final callout is the result against the projection", () => {
  const game = base({
    left: { name: "All Heart", points: 120.64, projected: 108.58, wins: 4, losses: 4, lossesInARow: 0 },
    right: { name: "Jahmyr I Go Again", points: 103.68, projected: 128.67, wins: 4, losses: 4, lossesInARow: 0 },
  });
  const line = resultCallout(game);
  assert.match(line, /Jahmyr I Go Again was favored by 20\.1 and lost by 17\.0/);
  assert.doesNotMatch(line, /projected final by/);
});

test("a game that has not started states the favorite and the two projections", () => {
  const line = resultCallout(
    base({
      state: "projected",
      left: { name: "Home", points: 0, projected: 130.1, wins: 4, losses: 3, lossesInARow: 0 },
      right: { name: "Away", points: 0, projected: 109.5, wins: 2, losses: 5, lossesInARow: 2 },
    }),
  );
  assert.match(line, /Home is favored by 20\.6, 130\.1 to 109\.5/);
  assert.doesNotMatch(line, /projected final by/);
});

test("generated lines stay on the performance and carry no emoji", () => {
  const samples = [
    gameCommentary(base()).lines.join(" "),
    teamBlurb({
      name: "Smert Fellas",
      wins: 2,
      losses: 6,
      ties: 0,
      pointsFor: 922.94,
      rank: 10,
      pointsRank: 8,
      last3: 90.2,
      seasonAvg: 115.4,
      lossesInARow: 3,
    }),
    slateRead([
      base({
        left: { name: "Kabul FC", points: 114.92, projected: 115.27, wins: 4, losses: 4, lossesInARow: 0 },
        right: { name: "Easy Peasy Lemon Squeezy", points: 97.66, projected: 138.5, wins: 3, losses: 5, lossesInARow: 1 },
      }),
    ]),
  ];
  for (const text of samples) {
    assert.doesNotMatch(text, /\p{Extended_Pictographic}/u);
    assert.doesNotMatch(text, /group chat|mom is proud|kryptonite|lmao|lol/i);
  }
});

test("a team blurb opens with the record and the points", () => {
  const text = teamBlurb({
    name: "Smert Fellas",
    wins: 2,
    losses: 6,
    ties: 0,
    pointsFor: 922.94,
    rank: 10,
    pointsRank: 8,
    last3: 90.2,
    seasonAvg: 115.4,
    lossesInARow: 3,
  });
  assert.match(text, /^2-6 and 922\.94 points\./);
  assert.match(text, /10th/);
  assert.match(text, /3 straight/);
});
