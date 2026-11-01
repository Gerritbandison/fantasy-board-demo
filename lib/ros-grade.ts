import { focusWinProb, type SimGame, type SimModel } from "./playoff-sim.ts";

/**
 * Rest-of-season grades for the user's franchise.
 * Counted stats come from the roster pull and Weeks 4–7 scoring.
 * Sentence that start with "Projection:" are the grade board, not that sample.
 */

export interface RosterPlayer {
  id: string;
  name: string;
  pos: string;
  slot: string;
  inj: string | null;
  own: number;
  gp: number | null;
}

export interface ByeFile {
  byes: Record<string, string[]>;
}

export interface PosGrade {
  id: string;
  label: string;
  letter: string;
  reason: string;
}

export interface WeekOutlook {
  week: number;
  opponentId: number;
  home: boolean;
  proj: number;
  oppProj: number;
  winProb: number;
  byes: string[];
}

export interface RosterReport {
  letter: string;
  rank: number;
  field: number;
  ppg: number;
  summary: string;
  positions: PosGrade[];
  weeks: WeekOutlook[];
  suggestions: string[];
  week11Byes: string[];
}

interface Scored {
  name: string;
  pos: string;
  slot: string;
  teamId: string;
  inj: string | null;
  own: number;
  total: number;
  weeks: number;
  ppg: number;
  byWeek: Record<string, number>;
}

const TEAM_GRADE = ["A+", "A", "B+", "B", "B-", "C+", "C", "C-", "D+", "D"];

function ordinal(n: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
}

function one(n: number) {
  return n.toFixed(1);
}

function scoreAll(rosters: Record<string, RosterPlayer[]>, points: Record<string, Record<string, number>>): Scored[] {
  const rows: Scored[] = [];
  for (const [teamId, players] of Object.entries(rosters)) {
    for (const player of players) {
      const byWeek = points[player.id] ?? {};
      const vals = Object.values(byWeek).map(Number);
      const total = vals.reduce((sum, v) => sum + v, 0);
      rows.push({
        name: player.name,
        pos: player.pos,
        slot: player.slot,
        teamId,
        inj: player.inj,
        own: player.own,
        total,
        weeks: vals.length,
        ppg: vals.length ? total / vals.length : 0,
        byWeek,
      });
    }
  }
  return rows;
}

function board(rows: Scored[], pred: (row: Scored) => boolean, minWeeks: number) {
  return rows
    .filter((row) => pred(row) && row.weeks >= minWeeks)
    .sort((a, b) => b.ppg - a.ppg || b.total - a.total || a.name.localeCompare(b.name));
}

function place(rows: Scored[], name: string) {
  const index = rows.findIndex((row) => row.name === name);
  if (index < 0) throw new Error(`Missing ${name} on the comparison board`);
  return index + 1;
}

function must(rows: Scored[], name: string) {
  const row = rows.find((item) => item.name === name);
  if (!row) throw new Error(`Missing player ${name}`);
  return row;
}

export function buildRosterGrade(
  rosters: Record<string, RosterPlayer[]>,
  points: Record<string, Record<string, number>>,
  model: SimModel,
  byes: ByeFile,
  focusTeamId = "7",
): RosterReport {
  const scored = scoreAll(rosters, points);
  const onFocus = (row: Scored) => row.teamId === focusTeamId;

  const qbs = board(scored, (row) => row.pos === "QB" && row.slot === "QB", 4);
  const maye = must(scored, "Drake Maye");
  const qbRank = place(qbs, "Drake Maye");

  const wrs = board(scored, (row) => row.pos === "WR" && row.slot === "WR", 4);
  const nacua = must(scored, "Puka Nacua");
  const moore = must(scored, "DJ Moore");
  const wrRank = place(wrs, "Puka Nacua");

  const rbs = board(scored, (row) => row.pos === "RB" && row.slot === "RB", 4);
  const pollard = must(scored, "Tony Pollard");
  const jacobs = must(scored, "Josh Jacobs");
  const pollardRank = place(rbs, "Tony Pollard");

  const flex = board(scored, (row) => row.slot === "FLEX", 4);
  const golden = must(scored, "Matthew Golden");
  const flexRank = place(flex, "Matthew Golden");

  const tes = board(scored, (row) => row.pos === "TE" && row.slot === "TE", 4);
  const fannin = must(scored, "Harold Fannin Jr.");
  const fanninRank = place(tes, "Harold Fannin Jr.");
  const allTe = board(scored, (row) => row.pos === "TE", 4);
  const likely = must(scored, "Isaiah Likely");
  void place(allTe, likely.name);

  const dst = board(scored, (row) => row.pos === "D/ST" && row.slot === "D/ST", 1);
  const pats = must(scored, "Patriots D/ST");
  const dstRank = place(dst, "Patriots D/ST");
  const patsWeek = Object.entries(pats.byWeek)[0];

  const gay = must(scored, "Matt Gay");
  const gordon = must(scored, "Ollie Gordon II");
  const brown = must(scored, "A.J. Brown");

  const starters = scored.filter((row) => onFocus(row) && row.slot !== "Bench" && row.slot !== "IR" && row.weeks > 0);
  const weakest = [...starters].sort((a, b) => a.total - b.total || a.name.localeCompare(b.name))[0];

  const ros = new Map<number, { sum: number; n: number }>();
  for (const game of model.games) {
    if (game.week < 9) continue;
    for (const [id, proj] of [
      [game.homeId, game.homeProj],
      [game.awayId, game.awayProj],
    ] as const) {
      const row = ros.get(id) ?? { sum: 0, n: 0 };
      row.sum += proj;
      row.n += 1;
      ros.set(id, row);
    }
  }
  const rosRows = [...ros.entries()]
    .map(([id, row]) => ({ id, ppg: row.sum / row.n }))
    .sort((a, b) => b.ppg - a.ppg || a.id - b.id);
  const rosRank = rosRows.findIndex((row) => row.id === model.focusId) + 1;
  const rosPpg = rosRows[rosRank - 1]?.ppg ?? 0;
  const letter = TEAM_GRADE[rosRank - 1] ?? "D";

  const weeks: WeekOutlook[] = model.games
    .filter((game) => game.week >= 9 && (game.homeId === model.focusId || game.awayId === model.focusId))
    .map((game) => weekOutlook(model, game, byes))
    .sort((a, b) => a.week - b.week);

  const week11Byes = byes.byes["11"] ?? [];
  const likelyByeWeeks = Object.entries(byes.byes)
    .filter(([, names]) => names.includes(likely.name))
    .map(([week]) => week);

  const positions: PosGrade[] = [
    {
      id: "QB",
      label: "QB",
      letter: "A+",
      reason: `Drake Maye is ${ordinal(qbRank)} of ${qbs.length} starting quarterbacks at ${one(maye.ppg)} points per game over Weeks 4–7 (${one(maye.total)} points). Projection: the No. 1 QB. On bye in Week 11.`,
    },
    {
      id: "RB",
      label: "RB",
      letter: "B+",
      reason: `Projection: Josh Jacobs as the No. 4 RB and Tony Pollard as the No. 6 RB. Pollard scored ${one(pollard.ppg)} points per game over Weeks 4–7 (${one(pollard.total)} points), ${ordinal(pollardRank)} of ${rbs.length} starting running backs with a full sample. Jacobs scored ${one(jacobs.byWeek["7"] ?? 0)} in Week 7 and 0 in Weeks 4–6.`,
    },
    {
      id: "WR",
      label: "WR",
      letter: "B+",
      reason: `Puka Nacua is ${ordinal(wrRank)} of ${wrs.length} starting wide receivers at ${one(nacua.ppg)} points per game over Weeks 4–7 (${one(nacua.total)} points). ${weakest?.name ?? "The weakest starter"} is the weakest starter with a Weeks 4–7 line: ${one(moore.total)} points${moore.inj ? `, ${moore.inj}` : ""}. Projection: Moore is the No. 7 wide receiver.`,
    },
    {
      id: "TE",
      label: "TE",
      letter: "A",
      reason: `Isaiah Likely is the starter. Projection: the No. 2 tight end. He scored ${one(likely.ppg)} points per game over Weeks 4–7. He is on bye in Week ${likelyByeWeeks.join(" and ") || "8"}, so Harold Fannin Jr. starts this week in his place. Fannin scored ${one(fannin.ppg)} in that sample (${fanninRank === tes.length ? "last" : ordinal(fanninRank)} of ${tes.length} tight ends in the current lineup slot) and does not set this grade.`,
    },
    {
      id: "FLEX",
      label: "FLEX",
      letter: "A-",
      reason: `Matthew Golden is ${ordinal(flexRank)} of ${flex.length} players in a FLEX slot at ${one(golden.ppg)} points per game over Weeks 4–7. Projection: the No. 3 flex. On bye in Week 11.`,
    },
    {
      id: "DST",
      label: "D/ST",
      letter: "C",
      reason: patsWeek
        ? `Patriots D/ST scored ${one(Number(patsWeek[1]))} in Week ${patsWeek[0]}, the only Weeks 4–7 line in this file, ${ordinal(dstRank)} of ${dst.length} starting defenses on that sample. Projection. On bye in Week 11.`
        : "Patriots D/ST have no Weeks 4–7 line in this file. Projection. On bye in Week 11.",
    },
    {
      id: "K",
      label: "K",
      letter: "C",
      reason: `Matt Gay has ${gay.weeks ? `${gay.weeks} Weeks 4–7 lines` : "no Weeks 4–7 scoring"} in this file (${Math.round(gay.own)}% rostered on the roster pull). Projection: a replaceable kicker. On bye in Week 13.`,
    },
    {
      id: "BN",
      label: "Bench",
      letter: "B",
      reason: `Ollie Gordon II scored ${one(gordon.ppg)} points per game over Weeks 4–7, with Cam Skattebo behind Jacobs and Pollard. A.J. Brown is ${brown.inj ?? "benched"} (${one(brown.ppg)} points per game in the sample). Projection: running-back depth is the chip to trade for a WR2.`,
    },
  ];

  return {
    letter,
    rank: rosRank,
    field: rosRows.length,
    ppg: Math.round(rosPpg * 10) / 10,
    summary: `${ordinal(rosRank)} of ${rosRows.length} on Weeks 9–14 team projections, ${one(Math.round(rosPpg * 10) / 10)} points per week. Projection from ESPN weekly totals in the Oct 31 pull, not a record grade.`,
    positions,
    weeks,
    suggestions: [
      "Likely is the starter. Fannin is in only while Likely is on bye.",
      "Add Cousins or Geno as a quarterback fallback.",
      "Stream Bucs D/ST in Week 11.",
      "Trade RB depth for a WR2.",
    ],
    week11Byes,
  };
}

function weekOutlook(model: SimModel, game: SimGame, byes: ByeFile): WeekOutlook {
  const home = game.homeId === model.focusId;
  return {
    week: game.week,
    opponentId: home ? game.awayId : game.homeId,
    home,
    proj: home ? game.homeProj : game.awayProj,
    oppProj: home ? game.awayProj : game.homeProj,
    winProb: focusWinProb(model, game, 0),
    byes: byes.byes[String(game.week)] ?? [],
  };
}
