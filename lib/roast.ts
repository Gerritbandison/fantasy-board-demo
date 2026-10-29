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
import { tp, type Trade, type TradeSide } from "@/lib/trades";

/*
 * PG-13 trash talk, generated from the numbers. Thresholds only choose the joke;
 * every number that appears in a line comes straight from the H2H file.
 */

const n = (id: number) => team(id).name;
const times = (k: number) => (k === 1 ? "once" : k === 2 ? "twice" : `${k} times`);
/** Deterministic variety, so neighbouring pages don't tell the same joke. */
const pick = <T,>(options: T[], seed: number) => options[Math.abs(seed) % options.length];

export function snackTitle(s: Series) {
  if (s.winPct >= 0.65) return "Personal ATM";
  if (s.winPct > 0.5) return "Favorite snack";
  return "Least-bad matchup";
}

export function nemesisTitle(s: Series) {
  if (s.winPct <= 0.3) return "Who's your daddy";
  if (s.winPct < 0.5) return "Kryptonite";
  return "Closest thing to a nemesis";
}

export function snackLine(me: number, s: Series) {
  const opp = n(s.opponentId);
  if (s.winPct <= 0.5) return `Even the softest matchup on the schedule is ${record(s)}. Nobody is scared of ${n(me)}, and that includes ${opp}.`;
  const seed = me + s.opponentId;
  const lines = [
    s.longestWinStreak >= 4
      ? pick(
          [
            `Won ${s.longestWinStreak} straight against ${opp} at one point. That's not a rivalry, that's a subscription.`,
            `${s.longestWinStreak} straight wins over ${opp} at one point. Auto-renewing, no cancellation fee.`,
            `Once beat ${opp} ${s.longestWinStreak} times in a row. ${opp} should ask for a refund.`,
          ],
          seed,
        )
      : s.winPct >= 0.7
        ? `${opp} on the schedule is basically a direct deposit.`
        : pick([`${opp} doesn't always go down easy, but they do go down.`, `${opp} is a reliable snack. Not gourmet, but reliable.`], seed),
  ];
  if (s.last?.result === "L") lines.push(`The snack did bite back last time: ${pts(s.last.pf)}-${pts(s.last.pa)} in ${s.last.when.season}.`);
  return lines.join(" ");
}

export function nemesisLine(me: number, s: Series) {
  const opp = n(s.opponentId);
  if (s.winPct >= 0.5) return `${n(me)} doesn't really have a nemesis. ${opp} is the closest thing, and that series is ${record(s)}.`;
  const seed = me + s.opponentId;
  const cs = s.currentStreak?.result === "L" ? s.currentStreak.length : 0;
  if (cs >= 3 && cs === s.longestLosingStreak) return `Lost the last ${cs} straight to ${opp}, and counting. Rent is due on the first.`;
  const lines = [
    s.longestLosingStreak >= 3
      ? pick(
          [
            `Dropped ${s.longestLosingStreak} straight to ${opp} at one point. Rent is due on the first.`,
            `${opp} once won this ${s.longestLosingStreak} times in a row. Landlord behavior.`,
            `Lost ${s.longestLosingStreak} in a row to ${opp} at one point. Therapy is cheaper than this matchup.`,
          ],
          seed,
        )
      : s.winPct <= 0.3
        ? `${opp} sees this name on the schedule and starts planning the celebration.`
        : `Every time ${opp} shows up on the schedule, the vibes leave the building.`,
  ];
  if (cs >= 2) lines.push(`Currently lost ${cs} in a row to them.`);
  else if (s.last?.result === "W") lines.push(`At least the last meeting went the right way (${s.last.when.season}).`);
  return lines.join(" ");
}

export function bigWinLine(g: TeamGame) {
  const m = pts(Math.abs(g.margin));
  const opp = n(g.opponentId);
  const seed = g.when.season + g.opponentId;
  if (Math.abs(g.margin) >= 80) return pick([`Won by ${m}. Somebody check on ${opp}.`, `Won by ${m}. ${opp} muted the league app for a week.`], seed);
  if (Math.abs(g.margin) >= 60) return pick([`Won by ${m}. Mercy rule? Never heard of it.`, `Won by ${m}. ${opp} left the group chat on read.`], seed);
  if (Math.abs(g.margin) >= 40) return `Won by ${m}. Not close, not even polite.`;
  return `The biggest win ever is ${m}. Gentle-giant energy.`;
}

export function badLossLine(g: TeamGame) {
  const m = pts(Math.abs(g.margin));
  const seed = g.when.season + g.opponentId;
  if (Math.abs(g.margin) >= 80) return pick([`Lost by ${m}. The group chat still has the screenshots.`, `Lost by ${m}. Witness protection was considered.`], seed);
  if (Math.abs(g.margin) >= 60) return pick([`Lost by ${m}. Lineup was set that week, allegedly.`, `Lost by ${m}. The kind of loss you blame on the Wi-Fi.`], seed);
  if (Math.abs(g.margin) >= 40) return `Lost by ${m}. A loss so loud the neighbors heard it.`;
  return `The worst loss ever is only ${m}. Annoyingly respectable.`;
}

function topRanks(teamId: number, list: RecordScore[]) {
  return list.flatMap((r, i) => (r.teamId === teamId ? [i + 1] : []));
}

export function bestWeekLine(s: WeekScore) {
  const rank = highScoreRank(s);
  const owned = topRanks(s.teamId, RECORDS.highestScores);
  const lines: string[] = [];
  if (rank === 1 && owned.includes(2)) lines.push(`The highest score in league history, and ${n(s.teamId)} owns #2 as well. Leave some points for everybody else.`);
  else if (rank === 1) lines.push(`The highest single-week score in league history. Frame it.`);
  else if (rank != null) lines.push(`#${rank} on the league's all-time single-week list.`);
  else lines.push(pick([`A personal best. The league's all-time list remains unbothered.`, `A career week. Still not on the league leaderboard, but mom is proud.`], s.teamId));
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
  else if (rank != null) lines.push(`#${rank} on the league's all-time lowest list. ${rank <= 3 ? "A podium finish, just the wrong podium." : "Just missed the podium. Even that didn't go right."}`);
  if (s.leg) {
    lines.push(
      s.when.kind === "consolation"
        ? `Only one week of a two-week consolation game, which is the nicest thing anyone can say about it.`
        : `Only one week of a two-week playoff game, but still.`,
    );
    if (s.game && rank === 1) lines.push(`The two-week total finished ${pts(s.game.pf)}-${pts(s.game.pa)}.`);
  }
  if (s.opponentScore != null && s.score > s.opponentScore) lines.push(`Somehow still outscored ${n(s.opponentId)} (${pts(s.opponentScore)}) that week. Bottom-feeder bowl.`);
  else if (rank == null)
    lines.push(pick([`Setting a lineup was optional that week, apparently.`, `The whole roster had a bye. Spiritually.`, `Even the bench was embarrassed.`], s.teamId + s.when.season));
  return lines.join(" ");
}

export function closeWinLine(g: TeamGame) {
  const m = Math.abs(g.margin);
  const seed = g.when.season + g.opponentId;
  if (m < 0.5) return pick([`Won by ${pts(m)}. Stole it, kept it, never apologized.`, `Won by ${pts(m)}. Refreshed the app until it stopped hurting.`], seed);
  if (m < 1) return `Won by less than a point. Didn't deserve it, kept it anyway.`;
  return `Won by ${pts(m)}. Sweaty, but a W is a W.`;
}

export function closeLossLine(g: TeamGame) {
  const m = Math.abs(g.margin);
  const seed = g.when.season + g.opponentId;
  if (m < 0.5) return pick([`Lost by ${pts(m)}. Still not over it. Will never be over it.`, `Lost by ${pts(m)}. Checked the box score until it stopped making sense.`, `Lost by ${pts(m)}. Still drafting the appeal to the commissioner.`], seed);
  if (m < 2) return `Lost by ${pts(m)}. Somebody is still mad about a start/sit call.`;
  return `Lost by ${pts(m)}. Close enough to hurt, far enough to blame the kicker.`;
}

export function streakLine(f: Franchise) {
  const lines: string[] = [];
  const worst = RECORDS.losingStreaks[0];
  const best = RECORDS.winStreaks[0];
  if (worst?.teamId === f.teamId && worst.length === f.losingStreak.length) lines.push(`${f.losingStreak.length} straight losses is the league's longest skid ever. Somebody check on them.`);
  else if (best?.teamId === f.teamId && best.length === f.winStreak.length) lines.push(`${f.winStreak.length} straight wins is the league's longest heater ever. Unbearable at the time, probably.`);
  else if (f.winStreak.length > f.losingStreak.length) lines.push(`The hot streaks outlast the cold ones. Mostly.`);
  else if (f.winStreak.length < f.losingStreak.length) lines.push(`The cold streaks outlast the hot ones. Character building.`);
  else lines.push(`Hot and cold streaks of exactly the same length. Perfectly balanced, as all things should be.`);
  return lines.join(" ");
}

export function playoffLine(f: Franchise) {
  const p = f.playoff;
  if (p.wins + p.losses === 0) return `Zero winners-bracket games. The consolation ladder${p.consolationRecord ? ` (${p.consolationRecord.replace(/-0$/, "")})` : ""} knows them by name.`;
  if (p.titles >= 2) return `${p.titles} rings. Insufferable, and they earned it.`;
  if (p.titles === 1) return `One ring. They will remind you.`;
  if (p.titleGames > 0) return `${p.titleGames} title game${p.titleGames === 1 ? "" : "s"}, zero rings. Bridesmaid energy.`;
  return `Makes the bracket, leaves the bracket. No title games yet.`;
}

export function overallLine(f: Franchise) {
  const games = f.wins + f.losses + f.ties;
  const wp = games ? f.wins / games : 0;
  if (wp >= 0.55) return `One of the league's landlords. Everyone else is renting.`;
  if (wp <= 0.4) return `A generous donor to everybody else's win column.`;
  if (wp < 0.5) return `Slightly below .500, which means plenty of material for this page.`;
  return `Above .500, but not enough to stop talking about it.`;
}

/* ---------- Matchup page ---------- */

/** `s` is from team A's point of view. */
export function seriesLine(s: Series) {
  const a = n(s.teamId);
  const b = n(s.opponentId);
  const lines: string[] = [];
  if (s.games === 0) return `These two have never met. Somebody has to go first.`;
  const pointGap = Math.abs(s.pointsFor - s.pointsAgainst);
  if (s.wins === s.losses) lines.push(`Dead even at ${record(s)}. The loser of this one hears about it until the draft.`);
  else {
    const [lead, trail, lw, ll] = s.wins > s.losses ? [a, b, s.wins, s.losses] : [b, a, s.losses, s.wins];
    if (pointGap < s.games) lines.push(`${lead} leads ${lw}-${ll}, yet ${s.games} games of scoring are separated by ${pts(pointGap)} total points. Pure, uncut luck.`);
    else if (lw - ll <= 1) lines.push(`${lead} leads ${lw}-${ll}, which is a coin flip with an attitude.`);
    else if (lw / (lw + ll) >= 0.7) lines.push(`${lead} is ${lw}-${ll} in this series. At this point ${trail} is just paying rent.`);
    else lines.push(`${lead} leads ${lw}-${ll}. ${trail} has some catching up to do.`);
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
  if (second?.teamId === first.teamId) lines.push(`Also holds #2 (${pts(second.score)}). Leave some points for the rest of the league.`);
  else if (first.opponentScore != null) lines.push(`${n(first.opponentId)} scored ${pts(first.opponentScore)} that week and was never in it.`);
  return lines.join(" ");
}

export function lowScoreLine(s: RecordScore) {
  const lines = [`${who(s.teamId, s.when.season)} put up ${pts(s.score)} in a single week.`];
  if (s.leg && s.game) {
    lines.push(
      `${s.when.kind === "consolation" ? "It was one week of a two-week consolation game" : "It was one week of a two-week playoff game"}, and they lost the two-week total ${pts(s.game.pf)}-${pts(s.game.pa)}.`,
    );
  } else if (s.opponentScore != null) lines.push(`${n(s.opponentId)} only needed ${pts(s.opponentScore)}.`);
  lines.push(`Not a typo.`);
  return lines.join(" ");
}

export function blowoutLine(g: RecordGame) {
  return `${who(g.winnerId, g.when.season)} beat ${who(g.loserId, g.when.season)} ${pts(g.winnerScore)}-${pts(g.loserScore)}. ${n(g.loserId)} has asked that this card be removed. Request denied.`;
}

export function closestLine(g: RecordGame) {
  return `${who(g.winnerId, g.when.season)} over ${who(g.loserId, g.when.season)}, ${pts(g.winnerScore)}-${pts(g.loserScore)}. Basically a coin flip with paperwork.`;
}

export function uglyWinLine(g: RecordGame) {
  return `${who(g.winnerId, g.when.season)} won with ${pts(g.winnerScore)}, because ${who(g.loserId, g.when.season)} managed ${pts(g.loserScore)}. Ugly wins still count. Barely.`;
}

export function robbedLine(g: RecordGame) {
  return `${who(g.loserId, g.when.season)} scored ${pts(g.loserScore)} and still lost, because ${who(g.winnerId, g.when.season)} dropped ${pts(g.winnerScore)}. Wrong week to have a great week.`;
}

export function winStreakLine(s: { teamId: number; length: number } & Parameters<typeof spanLabel>[0]) {
  const range = spanLabel(s);
  return `${n(s.teamId)} won ${s.length} straight${range ? ` (${range})` : ""}. The group chat was unbearable.`;
}

export function losingStreakLine(s: { teamId: number; length: number } & Parameters<typeof spanLabel>[0]) {
  const range = spanLabel(s);
  return `${n(s.teamId)} lost ${s.length} in a row${range ? ` (${range})` : ""}. At some point it stops being a slump and starts being a lifestyle.`;
}

export function mostPlayedLine(r: Rivalry) {
  return `${n(r.a)} and ${n(r.b)} have met ${r.games} times, and it's ${r.aWins}-${r.bWins}${r.ties ? `-${r.ties}` : ""}. Nobody is moving out.`;
}

export function lopsidedLine(r: Rivalry) {
  const [lead, trail, lw, ll] = r.aWins >= r.bWins ? [r.a, r.b, r.aWins, r.bWins] : [r.b, r.a, r.bWins, r.aWins];
  return `${n(lead)} is ${lw}-${ll} against ${n(trail)}. That's not a rivalry, that's a habit.`;
}

export function titleGameLine(g: TitleGame) {
  if (g.margin >= 60) return "Never in doubt.";
  if (g.margin >= 30) return "Comfortable. Smug, even.";
  if (g.margin >= 15) return "Closer than the champ admits.";
  return "Down to the wire.";
}

/* ---------- Trades (2026 trade file) ---------- */

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const playersGot = (s: TradeSide) => s.got.flatMap((a) => (a.kind === "player" ? [a.name] : []));

export function tradeLine(t: Trade) {
  const [a, b] = t.sides;
  if (!t.playersMoved) {
    const picks = t.sides.flatMap((s) => s.got).filter((x) => x.kind === "pick");
    const rounds = new Set(picks.map((p) => (p.kind === "pick" ? p.round : 0)));
    if (t.released.length)
      return `Draft picks changed hands in the offseason and ${list(t.released.map((p) => p.name))} got released in the shuffle. Being the packing peanuts in somebody else's deal is a rough way to learn your value.`;
    if (rounds.size === 1 && picks.length === 2)
      return `${n(a.teamId)} and ${n(b.teamId)} swapped round-${[...rounds][0]} slots and ESPN barely took notes. Grade: incomplete. Vibes: suspicious.`;
    return `${n(a.teamId)} and ${n(b.teamId)} shuffled draft picks before the season. Both sides get to claim they won until somebody checks.`;
  }
  if (!t.edge) return `Too soon to call. Both sides are still pretending they read the injury report.`;
  const win = t.sides.find((s) => s.teamId === t.edge!.teamId)!;
  const lose = t.sides.find((s) => s.teamId !== t.edge!.teamId)!;
  const edge = tp(t.edge.points);
  if (lose.points === 0 && playersGot(lose).length)
    return `${n(lose.teamId)} traded for ${list(playersGot(lose))} and let him go before he logged a single week for them. ${n(win.teamId)} has ${tp(win.points ?? 0)} points from the deal. Buyer's remorse, speedrun edition.`;
  if (t.early)
    return t.edge.points < 5
      ? `${t.weeksCounted === 1 ? "One week" : `${t.weeksCounted} weeks`} of data and a ${edge}-point gap. Grading this now is like grading a draft in August. Check back in a month.`
      : `Only ${t.weeksCounted === 1 ? "one week" : `${t.weeksCounted} weeks`} in and ${n(win.teamId)} is up ${edge} points. Early, sure, but ${n(lose.teamId)} has definitely refreshed the box score.`;
  if (t.edge.points / t.weeksCounted >= 8 && playersGot(win).length < playersGot(lose).length)
    return `${n(win.teamId)} turned ${list(playersGot(lose))} into ${list(playersGot(win))} and is up ${edge} points since. ${n(lose.teamId)} got quantity. ${n(win.teamId)} got the points.`;
  return `${n(win.teamId)} leads by ${edge} points over ${t.weeksCounted} weeks. Not a fleece, but ${n(lose.teamId)} is hoping nobody brings it up.`;
}

export function mostActiveLine(id: number, k: number, total: number) {
  return `${n(id)} was in ${k} of the ${total} accepted trades. That's not a fantasy team, that's a pawn shop with a waiver wire.`;
}

export function offersSentLine(id: number, k: number) {
  return `${n(id)} sent ${k} trade offers. That's not negotiating, that's a newsletter.`;
}

export function negotiatedLine(a: number, b: number, offers: number, trades: number) {
  return trades
    ? `${n(a)} and ${n(b)} went back and forth ${offers} times to land ${trades === 1 ? "one deal" : `${trades} deals`}. Hostage negotiations move faster.`
    : `${n(a)} and ${n(b)} went back and forth ${offers} times and still haven't closed. Somebody call a mediator.`;
}

export function hotPotatoLine(name: string, days: number, stops: number) {
  return `${name} was on ${stops} rosters in ${days} days. Somebody get the man a forwarding address.`;
}

export function vetoLine(id: number, k: number) {
  return `${k} veto rows are logged under ${n(id)}. ESPN won't say who actually pressed the button, so let's just call the paperwork suspicious.`;
}

export function tradeAndCutLine() {
  return `Zero starts, zero points, one roster spot freed up. Retail therapy, but in reverse.`;
}

export function fleeceLine(t: Trade) {
  const win = t.sides.find((s) => s.teamId === t.edge!.teamId)!;
  const lose = t.sides.find((s) => s.teamId !== t.edge!.teamId)!;
  return `${n(win.teamId)} is up ${tp(t.edge!.points)} points on ${n(lose.teamId)} over ${t.weeksCounted} weeks. The receipts are getting framed.`;
}

export function noRepeatLine(trades: number, pairs: number) {
  return trades === pairs
    ? `${trades} trades, ${pairs} different pairs. Nobody has come back for seconds, which says something.`
    : `${trades} trades across ${pairs} pairs. Some people never learn.`;
}
