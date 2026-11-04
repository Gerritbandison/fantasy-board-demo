/**
 * Sharp league commentary. Every number in a line comes from the facts passed in.
 * Thresholds pick the branch. See docs/commentary-voice.md.
 */

export type CommentaryBranch =
  | "projection-collapse"
  | "blowout"
  | "upset"
  | "close-game"
  | "losing-streak"
  | "high-score"
  | "result";

export interface SideInput {
  name: string;
  points: number;
  projected: number | null;
  wins: number;
  losses: number;
  lossesInARow: number;
}

export interface GameInput {
  state: "final" | "live" | "projected";
  seed: number;
  left: SideInput;
  right: SideInput;
}

export interface GameCommentary {
  branch: CommentaryBranch;
  lines: string[];
}

const points = (n: number) => n.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
const one = (n: number) => n.toFixed(1);
const record = (side: SideInput) => `${side.wins}-${side.losses}`;
const pick = <T,>(options: T[], seed: number) => options[Math.abs(seed) % options.length];

function ordinal(n: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
}

function read(game: GameInput) {
  const { left, right } = game;
  const winner = left.points >= right.points ? left : right;
  const loser = winner === left ? right : left;
  const leftProj = left.projected ?? 0;
  const rightProj = right.projected ?? 0;
  const favorite = leftProj >= rightProj ? left : right;
  const dog = favorite === left ? right : left;
  return {
    winner,
    loser,
    favorite,
    dog,
    projMargin: Math.abs(leftProj - rightProj),
    margin: Math.abs(left.points - right.points),
    hasProjection: left.projected != null && right.projected != null,
  };
}

/** Which cut the week earns. Final and live games use the score; a game that has not started does not. */
export function classifyGame(game: GameInput): CommentaryBranch {
  if (game.state === "projected") return "result";
  const { winner, favorite, loser, margin } = read(game);
  const miss = (favorite.projected ?? 0) - favorite.points;
  if (favorite !== winner && miss >= 15) return "projection-collapse";
  if (margin >= 25) return "blowout";
  if (winner.points >= 160) return "high-score";
  if (loser.lossesInARow >= 3) return "losing-streak";
  if (favorite !== winner && game.left.projected != null && game.right.projected != null) return "upset";
  if (margin < 6) return "close-game";
  return "result";
}

/** The score bar under a matchup. Final games compare the result with the projection. */
export function resultCallout(game: GameInput) {
  const { favorite, dog, winner, projMargin, margin, hasProjection } = read(game);
  if (!hasProjection) return `${winner.name} won by ${one(margin)}.`;
  if (game.state === "projected") {
    return `${favorite.name} is favored by ${one(projMargin)}, ${points(favorite.projected ?? 0)} to ${points(dog.projected ?? 0)}.`;
  }
  if (game.state === "live") {
    return `${favorite.name} is favored by ${one(projMargin)}. The bracket stays only while that projection is still above the points already scored.`;
  }
  if (favorite === winner) return `${favorite.name} was favored by ${one(projMargin)} and won by ${one(margin)}.`;
  return `${favorite.name} was favored by ${one(projMargin)} and lost by ${one(margin)}.`;
}

function linesFor(game: GameInput, branch: CommentaryBranch): string[] {
  const { winner, loser, favorite, dog, projMargin, margin } = read(game);
  const miss = (favorite.projected ?? 0) - favorite.points;
  if (branch === "projection-collapse") {
    return [
      `${favorite.name} was favored by ${one(projMargin)}, ${points(favorite.projected ?? 0)} to ${points(dog.projected ?? 0)}. They scored ${points(favorite.points)}.`,
      pick(
        [
          `${dog.name} won ${points(dog.points)}–${points(favorite.points)}. The number said ${favorite.name}. The score said otherwise.`,
          `${dog.name} took it ${points(winner.points)}–${points(loser.points)}. A ${one(miss)}-point miss is not a bad break. It is the week.`,
        ],
        game.seed,
      ),
    ];
  }
  if (branch === "blowout") {
    return [
      `${points(winner.points)} to ${points(loser.points)}.`,
      pick(
        [
          `${loser.name} lost by ${one(margin)}. ${winner.name} was ${favorite === winner ? "favored" : "the lower projection"} by ${one(projMargin)} and did not need a close game.`,
          `${record(loser)} and ${points(loser.points)} points. ${winner.name} won by ${one(margin)}.`,
        ],
        game.seed,
      ),
    ];
  }
  if (branch === "high-score") {
    return [
      `${points(winner.points)} points.`,
      pick(
        [
          `${winner.name} put up ${points(winner.points)} against ${points(loser.points)}. That is the week, and ${loser.name} was on the other side of it.`,
          `${winner.name} posted ${points(winner.points)}. ${loser.name} scored ${points(loser.points)} and still lost by ${one(margin)}.`,
        ],
        game.seed,
      ),
    ];
  }
  if (branch === "losing-streak") {
    return [
      `${record(loser)} and ${points(loser.points)} points.`,
      pick(
        [
          `${loser.name} has lost ${loser.lossesInARow} straight. ${winner.name} won by ${one(margin)}.`,
          `${loser.lossesInARow} straight losses. ${winner.name} beat ${loser.name} by ${one(margin)}, ${points(winner.points)}–${points(loser.points)}.`,
        ],
        game.seed,
      ),
    ];
  }
  if (branch === "upset") {
    return [
      `${dog.name} ${points(dog.points)}, ${favorite.name} ${points(favorite.points)}.`,
      pick(
        [
          `${favorite.name} was favored by ${one(projMargin)} and lost. They finished ${one(miss)} below the projection. The lower projection won.`,
          `The lower projection won. ${favorite.name} missed by ${one(miss)} and lost by ${one(margin)}.`,
        ],
        game.seed,
      ),
    ];
  }
  if (branch === "close-game") {
    return [
      `${points(winner.points)}–${points(loser.points)}, a margin of ${one(margin)}.`,
      pick(
        [
          `${favorite.name} was favored by ${one(projMargin)}. It finished inside ${one(margin)}.`,
          `${winner.name} won by ${one(margin)}. ${loser.name} had the same game and came up short.`,
        ],
        game.seed,
      ),
    ];
  }
  return [
    `${points(winner.points)}–${points(loser.points)}.`,
    `${favorite.name} was favored by ${one(projMargin)}. The margin was ${one(margin)}.`,
  ];
}

export function gameCommentary(game: GameInput): GameCommentary {
  if (game.state === "projected") {
    return {
      branch: "result",
      lines: [
        resultCallout(game),
        `${game.left.name} is ${record(game.left)}. ${game.right.name} is ${record(game.right)}.`,
      ],
    };
  }
  if (game.state === "live") {
    return {
      branch: classifyGame(game),
      lines: [`${points(game.left.points)}–${points(game.right.points)} so far.`, resultCallout(game)],
    };
  }
  const branch = classifyGame(game);
  return { branch, lines: linesFor(game, branch) };
}

export interface TeamBlurbInput {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  rank: number;
  pointsRank: number;
  last3: number;
  seasonAvg: number;
  lossesInARow: number;
}

export function teamBlurb(input: TeamBlurbInput) {
  const rec = input.ties ? `${input.wins}-${input.losses}-${input.ties}` : `${input.wins}-${input.losses}`;
  const form =
    input.lossesInARow >= 3
      ? ` They have lost ${input.lossesInARow} straight, and the last three weeks averaged ${points(input.last3)} against a season average of ${points(input.seasonAvg)}.`
      : input.last3 + 5 < input.seasonAvg
        ? ` The last three weeks averaged ${points(input.last3)}, under the season average of ${points(input.seasonAvg)}.`
        : ` The last three weeks averaged ${points(input.last3)}.`;
  return `${rec} and ${points(input.pointsFor)} points. ${input.name} is ${ordinal(input.rank)} in the standings and ${ordinal(input.pointsRank)} in points.${form}`;
}

/** The sharpest projection miss, then the largest margin if it is a different game. */
export function slateRead(games: GameInput[]) {
  const collapse = games.find((game) => classifyGame(game) === "projection-collapse");
  const blowout = [...games].sort((a, b) => read(b).margin - read(a).margin)[0];
  const chosen = [collapse, blowout].filter((game, index, list): game is GameInput => game != null && list.indexOf(game) === index);
  return (chosen.length ? chosen : games.slice(0, 1)).map((game) => gameCommentary(game).lines[0]).join(" ");
}

const TAG: Record<CommentaryBranch, string> = {
  "projection-collapse": "UPSET ALERT",
  upset: "UPSET ALERT",
  blowout: "LOCK",
  "high-score": "LOCK",
  "losing-streak": "LOCK",
  "close-game": "TOSS-UP",
  result: "NOTE",
};

/** A card draft for a future week. Week 8 in data/week-roasts.json is the approved copy. */
export function draftRoastCard(game: GameInput) {
  const commentary = gameCommentary(game);
  const callout = resultCallout(game);
  return {
    branch: commentary.branch,
    headline: `${game.left.name} ${points(game.left.points)} – ${game.right.name} ${points(game.right.points)}`,
    roast: commentary.lines.join("\n"),
    tag: `${TAG[commentary.branch]}: ${callout}`,
  };
}
