import { team } from "@/lib/league";
import {
  highScoreRank,
  lowScoreRank,
  pts,
  RECORDS,
  record,
  spanLabel,
  teamThenLabel,
  type Franchise,
  type RecordGame,
  type RecordScore,
  type Rivalry,
  type Series,
  type TeamGame,
  type TitleGame,
  type WeekScore,
} from "@/lib/h2h";
import { backfireNumber, partnerOf, tp, tv, verdictWinner, type SideGrade, type Trade, type TradeSide } from "@/lib/trades";

/*
 * Sharp reads on the historical numbers. Thresholds pick the line.
 * Every number in a line comes from the H2H or trade file.
 */

const n = (id: number) => team(id).name;
const times = (k: number) => (k === 1 ? "once" : k === 2 ? "twice" : `${k} times`);
/** Deterministic variety, so neighbouring pages don't tell the same joke. */
const pick = <T,>(options: T[], seed: number) => options[Math.abs(seed) % options.length];

export function snackTitle(s: Series) {
  if (s.winPct >= 0.65) return "One-sided";
  if (s.winPct > 0.5) return "Soft matchup";
  return "No soft matchup";
}

export function nemesisTitle(s: Series) {
  if (s.winPct <= 0.3) return "Owned";
  if (s.winPct < 0.5) return "Problem series";
  return "Closest thing to one";
}

export function snackLine(me: number, s: Series) {
  const opp = n(s.opponentId);
  if (s.winPct <= 0.5) return `The best series on the schedule is still ${record(s)}. ${n(me)} does not have a soft matchup, including ${opp}.`;
  const seed = me + s.opponentId;
  const lines = [
    s.longestWinStreak >= 4
      ? pick(
          [
            `Won ${s.longestWinStreak} straight against ${opp} at one point. That series was not competitive.`,
            `${s.longestWinStreak} straight wins over ${opp}. The results are the record.`,
          ],
          seed,
        )
      : s.winPct >= 0.7
        ? `${opp} is ${record(s)} in this series. That is a soft matchup.`
        : pick([`${record(s)} against ${opp}. The wins are there. They have not all been comfortable.`, `${opp} is a favorable series at ${record(s)}, not a guarantee.`], seed),
  ];
  if (s.last?.result === "L") lines.push(`Last meeting went the other way: ${pts(s.last.pf)}-${pts(s.last.pa)} in ${s.last.when.season}.`);
  return lines.join(" ");
}

export function nemesisLine(me: number, s: Series) {
  const opp = n(s.opponentId);
  if (s.winPct >= 0.5) return `${n(me)} does not have a real nemesis. ${opp} is the closest series, and it is ${record(s)}.`;
  const seed = me + s.opponentId;
  const cs = s.currentStreak?.result === "L" ? s.currentStreak.length : 0;
  if (cs >= 3 && cs === s.longestLosingStreak) return `Lost the last ${cs} straight to ${opp}. The streak is still open.`;
  const lines = [
    s.longestLosingStreak >= 3
      ? pick(
          [
            `Lost ${s.longestLosingStreak} straight to ${opp} at one point.`,
            `${opp} won this series ${s.longestLosingStreak} times in a row.`,
          ],
          seed,
        )
      : s.winPct <= 0.3
        ? `${record(s)} against ${opp}. That is the problem series.`
        : `${opp} has the edge in this series, ${record(s)}.`,
  ];
  if (cs >= 2) lines.push(`The current skid is ${cs}.`);
  else if (s.last?.result === "W") lines.push(`The last meeting went the right way (${s.last.when.season}).`);
  return lines.join(" ");
}

export function bigWinLine(g: TeamGame) {
  const m = pts(Math.abs(g.margin));
  const opp = n(g.opponentId);
  const seed = g.when.season + g.opponentId;
  if (Math.abs(g.margin) >= 80) return pick([`Won by ${m}. ${opp} was not in the game.`, `Won by ${m}. That is a blowout, not a rivalry week.`], seed);
  if (Math.abs(g.margin) >= 60) return pick([`Won by ${m}. The margin did the talking.`, `Won by ${m}. ${opp} never made it close.`], seed);
  if (Math.abs(g.margin) >= 40) return `Won by ${m}. Not a close game.`;
  return `The biggest win is ${m}. Respectable, and still the high mark.`;
}

export function badLossLine(g: TeamGame) {
  const m = pts(Math.abs(g.margin));
  const seed = g.when.season + g.opponentId;
  if (Math.abs(g.margin) >= 80) return pick([`Lost by ${m}. That score is the problem.`, `Lost by ${m}. There is no way to dress that up.`], seed);
  if (Math.abs(g.margin) >= 60) return pick([`Lost by ${m}. The lineup did not compete.`, `Lost by ${m}. The margin is the whole story.`], seed);
  if (Math.abs(g.margin) >= 40) return `Lost by ${m}. Not a one-score game.`;
  return `The worst loss is ${m}. Still a loss.`;
}

function topRanks(teamId: number, list: RecordScore[]) {
  return list.flatMap((r, i) => (r.teamId === teamId ? [i + 1] : []));
}

export function bestWeekLine(s: WeekScore) {
  const rank = highScoreRank(s);
  const owned = topRanks(s.teamId, RECORDS.highestScores);
  const lines: string[] = [];
  if (rank === 1 && owned.includes(2)) lines.push(`The highest score in league history, and ${n(s.teamId)} also owns #2.`);
  else if (rank === 1) lines.push(`The highest single-week score in league history.`);
  else if (rank != null) lines.push(`#${rank} on the league's all-time single-week list.`);
  else lines.push(pick([`A personal best. It is not on the league's all-time list.`, `A career week for this franchise. The league list did not move.`], s.teamId));
  if (s.opponentScore != null) {
    lines.push(
      s.opponentScore >= s.score * 0.8
        ? `${n(s.opponentId)} put up ${pts(s.opponentScore)} that week, which would have won most weeks.`
        : `${n(s.opponentId)} put up ${pts(s.opponentScore)} that week and never stood a chance.`,
    );
  }
  if (s.leg) lines.push(`One week of a two-week playoff game.`);
  return lines.join(" ");
}

export function worstWeekLine(s: WeekScore) {
  const rank = lowScoreRank(s);
  const lines: string[] = [];
  if (rank === 1) lines.push(`The lowest single-week score in league history.`);
  else if (rank != null) lines.push(`#${rank} on the league's all-time lowest list.${rank <= 3 ? " That is the wrong end of the board." : ""}`);
  if (s.leg) {
    lines.push(
      s.when.kind === "consolation"
        ? `One week of a two-week consolation game.`
        : `One week of a two-week playoff game.`,
    );
    if (s.game && rank === 1) lines.push(`The two-week total finished ${pts(s.game.pf)}-${pts(s.game.pa)}.`);
  }
  if (s.opponentScore != null && s.score > s.opponentScore) lines.push(`Still outscored ${n(s.opponentId)} (${pts(s.opponentScore)}) that week.`);
  else if (rank == null)
    lines.push(pick([`The lineup did not produce a competitive total.`, `That week is the floor.`], s.teamId + s.when.season));
  return lines.join(" ");
}

export function closeWinLine(g: TeamGame) {
  const m = Math.abs(g.margin);
  const seed = g.when.season + g.opponentId;
  if (m < 0.5) return pick([`Won by ${pts(m)}. The margin is the whole argument.`, `Won by ${pts(m)}. A win that thin still counts.`], seed);
  if (m < 1) return `Won by less than a point.`;
  return `Won by ${pts(m)}. Close, and still a win.`;
}

export function closeLossLine(g: TeamGame) {
  const m = Math.abs(g.margin);
  const seed = g.when.season + g.opponentId;
  if (m < 0.5) return pick([`Lost by ${pts(m)}. The margin is the whole argument.`, `Lost by ${pts(m)}. One decision covers that gap.`], seed);
  if (m < 2) return `Lost by ${pts(m)}. A start or a sit covers that.`;
  return `Lost by ${pts(m)}. Close enough that the lineup is the question.`;
}

export function streakLine(f: Franchise) {
  const lines: string[] = [];
  const worst = RECORDS.losingStreaks[0];
  const best = RECORDS.winStreaks[0];
  if (worst?.teamId === f.teamId && worst.length === f.losingStreak.length) lines.push(`${f.losingStreak.length} straight losses is the league's longest skid.`);
  else if (best?.teamId === f.teamId && best.length === f.winStreak.length) lines.push(`${f.winStreak.length} straight wins is the league's longest streak.`);
  else if (f.winStreak.length > f.losingStreak.length) lines.push(`The winning streaks have lasted longer than the losing ones.`);
  else if (f.winStreak.length < f.losingStreak.length) lines.push(`The losing streaks have lasted longer than the winning ones.`);
  else lines.push(`The best winning streak and the worst losing streak are the same length.`);
  return lines.join(" ");
}

export function playoffLine(f: Franchise) {
  const p = f.playoff;
  if (p.wins + p.losses === 0) return `Zero winners-bracket games.${p.consolationRecord ? ` Consolation record ${p.consolationRecord.replace(/-0$/, "")}.` : ""}`;
  if (p.titles >= 2) return `${p.titles} titles. The record backs it up.`;
  if (p.titles === 1) return `One title.`;
  if (p.titleGames > 0) return `${p.titleGames} title game${p.titleGames === 1 ? "" : "s"}, no titles.`;
  return `Playoff games on the record. No title games yet.`;
}

export function overallLine(f: Franchise) {
  const games = f.wins + f.losses + f.ties;
  const wp = games ? f.wins / games : 0;
  if (wp >= 0.55) return `Above .550 all-time. The wins are the argument.`;
  if (wp <= 0.4) return `At or under .400 all-time. The losses are the record.`;
  if (wp < 0.5) return `Below .500 all-time.`;
  return `Above .500 all-time, and not by much.`;
}

/* ---------- Matchup page ---------- */

/** `s` is from team A's point of view. */
export function seriesLine(s: Series) {
  const a = n(s.teamId);
  const b = n(s.opponentId);
  const lines: string[] = [];
  if (s.games === 0) return `These two have not played.`;
  const pointGap = Math.abs(s.pointsFor - s.pointsAgainst);
  if (s.wins === s.losses) lines.push(`Even at ${record(s)}.`);
  else {
    const [lead, trail, lw, ll] = s.wins > s.losses ? [a, b, s.wins, s.losses] : [b, a, s.losses, s.wins];
    if (pointGap < s.games) lines.push(`${lead} leads ${lw}-${ll}, and ${s.games} games are separated by ${pts(pointGap)} total points.`);
    else if (lw - ll <= 1) lines.push(`${lead} leads ${lw}-${ll}. One game.`);
    else if (lw / (lw + ll) >= 0.7) lines.push(`${lead} is ${lw}-${ll} in this series. ${trail} has not made it competitive.`);
    else lines.push(`${lead} leads ${lw}-${ll}.`);
  }
  const cs = s.currentStreak;
  if (cs && cs.length >= 2 && cs.result !== "T") lines.push(`${cs.result === "W" ? a : b} has won the last ${cs.length}.`);
  if (s.playoffMeetings > 0) lines.push(`They've met in the postseason ${times(s.playoffMeetings)}.`);
  return lines.join(" ");
}

/* ---------- Hall of Fame / Shame ---------- */

const who = teamThenLabel;

export function highScoreLine(top: RecordScore[]) {
  const [first, second] = top;
  if (!first) return "";
  const lines = [`${who(first.teamId, first.when.season)} dropped ${pts(first.score)}.`];
  if (second?.teamId === first.teamId) lines.push(`Also holds #2 (${pts(second.score)}).`);
  else if (first.opponentScore != null) lines.push(`${n(first.opponentId)} scored ${pts(first.opponentScore)} that week and was not close.`);
  return lines.join(" ");
}

export function lowScoreLine(s: RecordScore) {
  const lines = [`${who(s.teamId, s.when.season)} put up ${pts(s.score)} in a single week.`];
  if (s.leg && s.game) {
    lines.push(
      `${s.when.kind === "consolation" ? "It was one week of a two-week consolation game" : "It was one week of a two-week playoff game"}, and they lost the two-week total ${pts(s.game.pf)}-${pts(s.game.pa)}.`,
    );
  } else if (s.opponentScore != null) lines.push(`${n(s.opponentId)} only needed ${pts(s.opponentScore)}.`);
  lines.push(`The number is the number.`);
  return lines.join(" ");
}

export function blowoutLine(g: RecordGame) {
  return `${who(g.winnerId, g.when.season)} beat ${who(g.loserId, g.when.season)} ${pts(g.winnerScore)}-${pts(g.loserScore)}. The margin is the record.`;
}

export function closestLine(g: RecordGame) {
  return `${who(g.winnerId, g.when.season)} over ${who(g.loserId, g.when.season)}, ${pts(g.winnerScore)}-${pts(g.loserScore)}. One score decided it.`;
}

export function uglyWinLine(g: RecordGame) {
  return `${who(g.winnerId, g.when.season)} won with ${pts(g.winnerScore)} because ${who(g.loserId, g.when.season)} scored ${pts(g.loserScore)}. A win, and a low one.`;
}

export function robbedLine(g: RecordGame) {
  return `${who(g.loserId, g.when.season)} scored ${pts(g.loserScore)} and lost, because ${who(g.winnerId, g.when.season)} scored ${pts(g.winnerScore)}.`;
}

export function winStreakLine(s: { teamId: number; length: number } & Parameters<typeof spanLabel>[0]) {
  const range = spanLabel(s);
  return `${n(s.teamId)} won ${s.length} straight${range ? ` (${range})` : ""}.`;
}

export function losingStreakLine(s: { teamId: number; length: number } & Parameters<typeof spanLabel>[0]) {
  const range = spanLabel(s);
  return `${n(s.teamId)} lost ${s.length} in a row${range ? ` (${range})` : ""}. That is the skid.`;
}

export function mostPlayedLine(r: Rivalry) {
  return `${n(r.a)} and ${n(r.b)} have met ${r.games} times, ${r.aWins}-${r.bWins}${r.ties ? `-${r.ties}` : ""}.`;
}

export function lopsidedLine(r: Rivalry) {
  const [lead, trail, lw, ll] = r.aWins >= r.bWins ? [r.a, r.b, r.aWins, r.bWins] : [r.b, r.a, r.bWins, r.aWins];
  return `${n(lead)} is ${lw}-${ll} against ${n(trail)}. The series is not close.`;
}

export function titleGameLine(g: TitleGame) {
  if (g.margin >= 60) return "Not close.";
  if (g.margin >= 30) return "A comfortable margin.";
  if (g.margin >= 15) return "The champion won it by more than a score.";
  return "Decided late.";
}

/* ---------- Trades (2026 trade file) ---------- */

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const playersGot = (s: TradeSide) => s.got.flatMap((a) => (a.kind === "player" ? [a.name] : []));

const ordinal = (k: number) => `${k}${k % 10 === 1 && k % 100 !== 11 ? "st" : k % 10 === 2 && k % 100 !== 12 ? "nd" : k % 10 === 3 && k % 100 !== 13 ? "rd" : "th"}`;
const pctText = (g: SideGrade) => `${g.valueEdgePct > 0 ? "+" : "−"}${Math.abs(g.valueEdgePct)}%`;
const lowConfidence = (t: Trade) => t.confidence === "low";

/** Appended to a backfiring side's line once it has become a habit. */
function backfireTag(t: Trade, teamId: number) {
  const k = backfireNumber(t, teamId);
  return k >= 2 ? ` That's the ${ordinal(k)} backfire for ${n(teamId)}.` : "";
}

/** Past seasons: called on points alone. */
function pastTradeLine(t: Trade) {
  const seed = t.season * 100 + t.num;
  const [a, b] = t.sides;
  if (t.call === "too-little-data")
    return pick(
      [
        `Made with one week left to count. ${n(a.teamId)} and ${n(b.teamId)} do not have a sample.`,
        `A deadline deal with no weeks left to grade.`,
      ],
      seed,
    );
  if (t.call === "even" || !t.edge)
    return pick(
      [
        `Within ${tp(t.edge?.points ?? 0)} points either way.`,
        `Even, give or take ${tp(t.edge?.points ?? 0)} points. Neither side pulled away.`,
        `${n(a.teamId)} and ${n(b.teamId)} finished inside ${tp(t.edge?.points ?? 0)} points.`,
      ],
      seed,
    );
  const win = t.edge.teamId;
  const lose = partnerOf(t, win).teamId;
  const by = tp(t.edge.points);
  if (t.call === "lopsided")
    return pick(
      [
        `${n(win)} won this one by ${by} points. ${n(lose)} was on the other side in ${t.season}.`,
        `${by} points to ${n(win)}. ${n(lose)} did not get the points.`,
        `${n(win)} by ${by}. The points settled it.`,
      ],
      seed,
    );
  return pick(
    [
      `${n(win)} came out ${by} points ahead.`,
      `${n(win)} by ${by} points. ${n(lose)} did not.`,
      `${by} points to ${n(win)}. Close enough to argue, not close enough to call even.`,
    ],
    seed,
  );
}

export function tradeLine(t: Trade) {
  if (t.past) return pastTradeLine(t);
  const [a, b] = t.sides;
  if (t.ungraded) return `${n(a.teamId)} and ${n(b.teamId)} made a deal with no grade yet.`;
  const v = verdictWinner(t);
  if (!v) return `Even on both counts so far.`;
  const { win, lose } = v;
  const wg = win.grade!;
  const lg = lose.grade!;
  const tag = backfireTag(t, lose.teamId);
  if (lose.points === 0 && playersGot(lose).length)
    return `${n(lose.teamId)} traded for ${list(playersGot(lose))} and moved on before a scored week. ${n(win.teamId)} has ${tp(win.points ?? 0)} points from the deal.${tag}`;
  if (lg.pointsGained > 0)
    return `${n(lose.teamId)} is up ${tp(lg.pointsGained)} points and still down ${tv(lg.valueEdge)} in rest-of-season value.${tag}`;
  if (lowConfidence(t))
    return `${n(win.teamId)} is up ${tv(wg.valueEdge)} in value (${pctText(wg)}) and ${tp(wg.pointsGained)} points after ${t.weeksOfData === 1 ? "one week" : `${t.weeksOfData} weeks`}. One week is not a verdict.${tag}`;
  if (wg.valueChange && wg.valueEdge > 0 && playersGot(win).length < playersGot(lose).length)
    return `${n(win.teamId)} turned ${list(playersGot(lose))} into ${list(playersGot(win))}: up ${tp(wg.pointsGained)} points and ${tv(wg.valueChange.net)} in value since the deal. ${n(lose.teamId)} got the extra names.${tag}`;
  if (wg.valueChange)
    return `${n(win.teamId)} is up ${tp(wg.pointsGained)} points and ${tv(wg.valueChange.net)} in value since the deal.${tag}`;
  return `${n(win.teamId)} is up ${tp(wg.pointsGained)} points and ${tv(wg.valueEdge)} in rest-of-season value.${tag}`;
}

export function mostActiveLine(id: number, k: number, total: number) {
  return `${n(id)} was in ${k} of the ${total} player trades.`;
}

export function offersSentLine(id: number, k: number) {
  return `${n(id)} sent ${k} trade offers.`;
}

export function negotiatedLine(a: number, b: number, offers: number, trades: number) {
  return trades
    ? `${n(a)} and ${n(b)} exchanged ${offers} offers to land ${trades === 1 ? "one deal" : `${trades} deals`}.`
    : `${n(a)} and ${n(b)} exchanged ${offers} offers and did not close.`;
}

export function hotPotatoLine(name: string, days: number, stops: number) {
  return `${name} was on ${stops} rosters in ${days} days.`;
}

export function vetoLine(id: number, k: number) {
  return `${k} veto rows are logged under ${n(id)}. The file does not say who pressed the button.`;
}

export function tradeAndCutLine() {
  return `Zero starts, zero points, one roster spot cleared.`;
}

export function bestValueLine(t: Trade, side: TradeSide) {
  const g = side.grade!;
  const other = t.sides.find((s) => s.teamId !== side.teamId)!;
  return `${n(side.teamId)} got ${tv(g.valueReceived)} of rest-of-season value for ${tv(g.valueSent)}. ${n(other.teamId)} was the other side.${t.confidence === "low" ? " Low confidence." : ""}`;
}

export function reportLine(id: number, trades: number, backfiring: number, payingOff: number) {
  if (backfiring >= 3 && payingOff === 0)
    return `${n(id)}: ${trades} trades, ${backfiring} backfiring, ${payingOff} paying off.`;
  if (backfiring > payingOff) return `${n(id)} has more backfires than wins on the trade market.`;
  return `${n(id)} does not have a backfire on the board yet.`;
}

export function allTimeActiveLine(id: number, k: number, total: number) {
  return `${n(id)} has been in ${k} of the league's ${total} player trades.`;
}

export function sharksLine(shark: number, net: number, sucker: number | null, loss: number | null) {
  return sucker != null && loss != null
    ? `${n(shark)} is up ${tp(net)} points all-time from trades. ${n(sucker)} is down ${tp(Math.abs(loss))}.`
    : `${n(shark)} is up ${tp(net)} points all-time from trades.`;
}

export function mostTradedLine(name: string, trades: number, teams: number) {
  return `${name} has been traded ${trades} times across ${teams} rosters.`;
}

export function heistLine(t: Trade, win: number, lose: number) {
  return `${n(win)} won Trade ${t.num} of ${t.season} by ${tp(t.edge!.points)} points. ${n(lose)} was the other side.`;
}

export function noRepeatLine(trades: number, pairs: number) {
  return trades === pairs
    ? `${trades} trades, ${pairs} different pairs. No pair has repeated.`
    : `${trades} trades across ${pairs} pairs.`;
}
