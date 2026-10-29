import raw from "@/data/league-trades.json";
import { team } from "@/lib/league";

/*
 * 2026 trade history (Flaim/ESPN). ESPN only serves the current season's transactions,
 * so earlier seasons are unknown, not empty. Like the other loaders, ESPN names are
 * dropped while mapping. Offers, declines and veto rows are private negotiations:
 * only their counts leave this module, never their contents.
 */

interface RawPlayer {
  name: string;
  position: string;
  nflTeam: string | null;
}

interface RawSide {
  teamId: number;
  received: RawPlayer[];
  sent: RawPlayer[];
  receivedPicks: string[];
  sentPicks: string[];
}

interface RawWhoWon {
  weeksCounted: [number, number];
  edgeTeamId: number | null;
  edgePoints: number | null;
}

interface RawPlayerGrade {
  name: string;
  nflTeam: string | null;
  pointsForNewTeam: number;
  ppgBefore: number | null;
  gamesBefore: number;
  ppgAfter: number | null;
  gamesAfter: number;
  zeroOrMissingWeeksAfter: { week: number; why: string }[];
  disposition: string;
  value: { valueNow: number | null; valueAtTrade?: number | null; changeSinceTrade?: number | null; fetchedAt?: string };
}

interface RawSideGrade {
  teamId: number;
  receivedValueNow: number;
  receivedValueNowKept: number;
  sentValueNow: number;
  valueEdgeNow: number;
  valueChangeSinceTrade: { received: number | null; sent: number | null; net: number | null };
  pointsReceived: number;
  pointsSentAway: number;
  pointsGained: number;
  ppgTrendReceived: number | null;
  ppgTrendSent: number | null;
  received: RawPlayerGrade[];
  verdict: { call: string; mixedSignals: boolean; confidence: string; weeksOfData: number; valueSignal: { edgePct: number } };
}

interface RawTrade {
  id: string;
  season: number;
  week: number;
  weekLabel: string;
  acceptedAt: string;
  processedAt: string;
  date: string;
  teams: RawSide[];
  playersMoved: number;
  picksMoved: number;
  releasedInDeal: RawPlayer[];
  confidence: "partial" | "inferred" | "verified-by-rosters";
  whoWonIt: RawWhoWon | null;
  longTermGrade: { grade?: string; reason?: string; weeksAfterTrade?: number[]; sides?: { [teamId: string]: RawSideGrade } };
}

interface RawTeamSummary {
  teamId: number;
  proposalsSent2026: number;
  proposalsReceived2026: number;
  netPointsFromTrades2026: number;
}

interface RawFile {
  meta: { timezone: string; counts: { acceptedTrades: number; uniqueProposals: number; rawProposalRows: number; declines: number; vetoVoteRows: number; unmatchedAcceptRows: number } };
  tradesPerSeason: { [season: string]: number | null };
  trades: RawTrade[];
  proposals: { teamIds: number[]; proposedByTeamId: number | null }[];
  vetoVotes: { teamIdReported: number }[];
  unprocessedAccepts: { date: string }[];
  teamSummaries: { [teamId: string]: RawTeamSummary };
  leagueNotes: { quickestCut: string };
}

const file = raw as unknown as RawFile;

export const TRADE_SEASON = 2026;
export const TRADES_LABEL = `${TRADE_SEASON} season trades`;
export const UNKNOWN_SEASONS = Object.entries(file.tradesPerSeason)
  .filter(([, v]) => v == null)
  .map(([s]) => Number(s))
  .sort((a, b) => a - b);
export const COUNTS = {
  accepted: file.trades.length,
  pickSwaps: file.trades.filter((t) => t.playersMoved === 0).length,
  offers: file.meta.counts.uniqueProposals,
  declines: file.meta.counts.declines,
  vetoVotes: file.vetoVotes.length,
  neverProcessed: file.unprocessedAccepts.length,
};

/* ---------- Trades ---------- */

/** A week a received player gave the new team nothing, for a reason the file labels. */
export interface QuietWeek {
  week: number;
  kind: "bye" | "out" | "zero-stat";
}

export interface PlayerTrend {
  /** All points for the new team, started or benched. */
  points: number;
  ppgBefore: number | null;
  ppgAfter: number | null;
  gamesBefore: number;
  gamesAfter: number;
  valueNow: number | null;
  /** Null when there is no value at the trade date. */
  valueChange: number | null;
  quiet: QuietWeek[];
  /** Still on the team, released, or flipped in a later trade (by trade number). */
  status: { kind: "kept" } | { kind: "released" } | { kind: "flipped"; tradeNum: number };
}

export type Asset =
  | { kind: "player"; name: string; position: string; nflTeam?: string; trend?: PlayerTrend }
  | { kind: "pick"; ownerId: number; season: number; round: number; overall: number };

export type Verdict = "paying-off" | "even" | "backfiring";

/** One side's long-term read, straight from the file. */
export interface SideGrade {
  verdict: Verdict;
  /** The file's label: "low", "medium", "medium-high"... */
  confidence: string;
  weeksOfData: number;
  /** Value and points disagreed; value decided. */
  mixedSignals: boolean;
  /** Rest-of-season value of the players received that are still here (or flipped on); released players count 0. */
  valueReceived: number;
  /** Same, counting released players at their current value. */
  valueReceivedAll: number;
  valueSent: number;
  valueEdge: number;
  valueEdgePct: number;
  /** Net change in value since the trade (received minus sent); null when value at the trade date is unavailable. */
  valueChange: { received: number; sent: number; net: number } | null;
  pointsSentAway: number;
  pointsGained: number;
  /** Summed per-game change (after minus before) of the players received / sent. */
  ppgTrendReceived: number | null;
  ppgTrendSent: number | null;
}

export interface TradeSide {
  teamId: number;
  got: Asset[];
  /** All points the received players scored for this team, started or benched; null when there is nothing to count. */
  points: number | null;
  grade: SideGrade | null;
}

export interface Trade {
  id: string;
  num: number;
  season: number;
  week: number;
  weekLabel: string;
  acceptedAt: Date;
  sides: [TradeSide, TradeSide];
  /** "partial": pieces rebuilt from the draft board; "inferred": the partner is inferred too. */
  known: "full" | "partial" | "inferred";
  released: { name: string; position: string }[];
  playersMoved: number;
  picksMoved: number;
  /** First and last week counted for points. */
  span: [number, number] | null;
  /** Points edge on all points; null when even or not comparable. */
  edge: { teamId: number; points: number } | null;
  /** Why the file didn't grade it (draft-pick-only deals). */
  ungraded: string | null;
  confidence: string | null;
  weeksOfData: number;
}

const PICK = /^(\d+)'s (\d{4}) round-(\d+) pick \(#(\d+)(?: overall)?\)$/;

function pick(s: string): Asset {
  const m = PICK.exec(s.trim());
  if (!m) throw new Error(`Unrecognised pick "${s}"`);
  return { kind: "pick", ownerId: Number(m[1]), season: Number(m[2]), round: Number(m[3]), overall: Number(m[4]) };
}

function quietWeek(z: { week: number; why: string }): QuietWeek | null {
  if (z.why.startsWith("bye")) return { week: z.week, kind: "bye" };
  if (z.why.startsWith("out")) return { week: z.week, kind: "out" };
  if (z.why.includes("all-zero")) return { week: z.week, kind: "zero-stat" };
  return null;
}

function status(d: string): PlayerTrend["status"] {
  if (d === "released") return { kind: "released" };
  const flipped = /^flipped in \d{4}-T(\d+)$/.exec(d);
  if (flipped) return { kind: "flipped", tradeNum: Number(flipped[1]) };
  return { kind: "kept" };
}

function trend(g: RawPlayerGrade): PlayerTrend {
  return {
    points: g.pointsForNewTeam,
    ppgBefore: g.ppgBefore,
    ppgAfter: g.ppgAfter,
    gamesBefore: g.gamesBefore,
    gamesAfter: g.gamesAfter,
    valueNow: g.value.valueNow,
    valueChange: g.value.changeSinceTrade ?? null,
    quiet: g.zeroOrMissingWeeksAfter.flatMap((z) => quietWeek(z) ?? []),
    status: status(g.disposition),
  };
}

const VERDICTS: { [call: string]: Verdict } = { "paying off": "paying-off", even: "even", backfiring: "backfiring" };

function sideGrade(g: RawSideGrade): SideGrade {
  const verdict = VERDICTS[g.verdict.call];
  if (!verdict) throw new Error(`Unrecognised verdict "${g.verdict.call}"`);
  const c = g.valueChangeSinceTrade;
  return {
    verdict,
    confidence: g.verdict.confidence,
    weeksOfData: g.verdict.weeksOfData,
    mixedSignals: g.verdict.mixedSignals,
    valueReceived: g.receivedValueNowKept,
    valueReceivedAll: g.receivedValueNow,
    valueSent: g.sentValueNow,
    valueEdge: g.valueEdgeNow,
    valueEdgePct: g.verdict.valueSignal.edgePct,
    valueChange: c.net != null && c.received != null && c.sent != null ? { received: c.received, sent: c.sent, net: c.net } : null,
    pointsSentAway: g.pointsSentAway,
    pointsGained: g.pointsGained,
    ppgTrendReceived: g.ppgTrendReceived,
    ppgTrendSent: g.ppgTrendSent,
  };
}

function player(p: RawPlayer, g: RawSideGrade | undefined): Asset {
  const graded = g?.received.find((x) => x.name === p.name);
  return { kind: "player", name: p.name, position: p.position, nflTeam: p.nflTeam ?? graded?.nflTeam ?? undefined, trend: graded ? trend(graded) : undefined };
}

/** When the values were pulled, from the first player value in the file. */
const VALUES_FETCHED_AT = file.trades
  .flatMap((t) => Object.values(t.longTermGrade.sides ?? {}))
  .flatMap((s) => s.received)
  .find((p) => p.value.fetchedAt)?.value.fetchedAt;
export const VALUES_FETCHED = VALUES_FETCHED_AT ? new Date(VALUES_FETCHED_AT) : null;

const ALL_TRADES: Trade[] = file.trades
  .map((t) => {
    const w = t.whoWonIt;
    const lt = t.longTermGrade;
    const sides = t.teams.map((s) => {
      const g = lt.sides?.[String(s.teamId)];
      return {
        teamId: s.teamId,
        got: [...s.received.map((p) => player(p, g)), ...s.receivedPicks.map(pick)],
        points: g?.pointsReceived ?? null,
        grade: g ? sideGrade(g) : null,
      };
    }) as [TradeSide, TradeSide];
    const graded = sides.find((s) => s.grade)?.grade ?? null;
    return {
      id: t.id,
      num: Number(t.id.split("-T")[1]),
      season: t.season,
      week: t.week,
      weekLabel: t.weekLabel.replace(/^w/, "W").replace(/^p/, "P"),
      acceptedAt: new Date(t.acceptedAt),
      sides,
      known: t.confidence === "partial" ? "partial" : t.confidence === "inferred" ? "inferred" : "full",
      released: t.releasedInDeal.map((p) => ({ name: p.name, position: p.position })),
      playersMoved: t.playersMoved,
      picksMoved: t.picksMoved,
      span: w ? w.weeksCounted : null,
      edge: w?.edgeTeamId != null && w.edgePoints ? { teamId: w.edgeTeamId, points: w.edgePoints } : null,
      ungraded: lt.grade === "INC" ? (lt.reason ?? "Not graded.") : null,
      confidence: graded?.confidence ?? null,
      weeksOfData: graded?.weeksOfData ?? 0,
    } satisfies Trade;
  })
  .sort((x, y) => y.acceptedAt.getTime() - x.acceptedAt.getTime());

/** Only deals that moved players; draft-pick-only swaps are counted but not listed. */
export const TRADES = ALL_TRADES.filter((t) => t.playersMoved > 0);
const PICK_SWAPS = ALL_TRADES.filter((t) => t.playersMoved === 0);

export function pickSwapsFor(teamId: number) {
  return PICK_SWAPS.filter((t) => t.sides.some((s) => s.teamId === teamId)).length;
}

/** Seasons with player trades (newest first), each with its trades. */
export function bySeason(trades: Trade[]) {
  const seasons = [...new Set(trades.map((t) => t.season))].sort((a, b) => b - a);
  return seasons.map((season) => ({ season, trades: trades.filter((t) => t.season === season) }));
}

/** The side the verdicts favour: paying off over even over backfiring. Null when both read the same. */
export function verdictWinner(t: Trade) {
  const rank = (s: TradeSide) => (s.grade ? { "paying-off": 2, even: 1, backfiring: 0 }[s.grade.verdict] : -1);
  const [a, b] = t.sides;
  if (!a.grade || !b.grade || rank(a) === rank(b)) return null;
  return rank(a) > rank(b) ? { win: a, lose: b } : { win: b, lose: a };
}

export function tradesFor(teamId: number) {
  return TRADES.filter((t) => t.sides.some((s) => s.teamId === teamId));
}

export function sideOf(t: Trade, teamId: number) {
  return t.sides[0].teamId === teamId ? t.sides[0] : t.sides[1];
}

export function partnerOf(t: Trade, teamId: number) {
  return t.sides[0].teamId === teamId ? t.sides[1] : t.sides[0];
}

/* ---------- Formatting ---------- */

const ET = file.meta.timezone;
const DATE = new Intl.DateTimeFormat("en-US", { timeZone: ET, weekday: "short", month: "short", day: "numeric" });
const TIME = new Intl.DateTimeFormat("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit" });

export function tradeDate(d: Date) {
  return `${DATE.format(d)}, ${TIME.format(d)} ET`;
}

const SHORT = new Intl.DateTimeFormat("en-US", { timeZone: ET, month: "short", day: "numeric" });
export const shortDate = (d: Date) => SHORT.format(d);

/** "Smert Fellas'" rather than "Smert Fellas's". */
export const possessive = (name: string) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);

export function assetLabel(a: Asset) {
  return a.kind === "player" ? a.name : `${possessive(team(a.ownerId).name)} ${a.season} round-${a.round} pick (#${a.overall})`;
}

export const tp = (v: number) => v.toFixed(1);

const VALUE = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
/** FantasyCalc value, e.g. "2,417". */
export const tv = (v: number) => VALUE.format(Math.abs(v));

const LONG = new Intl.DateTimeFormat("en-US", { timeZone: ET, month: "short", day: "numeric", year: "numeric" });
export const longDate = (d: Date) => LONG.format(d);

/* ---------- Offers (counts only) ---------- */

const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

const OFFERS_BY_PAIR = new Map<string, number>();
for (const p of file.proposals) {
  if (p.teamIds.length !== 2) continue;
  const k = pairKey(p.teamIds[0], p.teamIds[1]);
  OFFERS_BY_PAIR.set(k, (OFFERS_BY_PAIR.get(k) ?? 0) + 1);
}

export function offersBetween(a: number, b: number) {
  return OFFERS_BY_PAIR.get(pairKey(a, b)) ?? 0;
}

/* ---------- Per team ---------- */

export interface TeamTrades {
  teamId: number;
  trades: Trade[];
  offersSent: number;
  offersReceived: number;
  /** All points from players traded for, minus all points the players sent away scored for the partners. */
  netPoints: number;
  /** Rest-of-season value received (kept) minus value sent, summed over the graded trades; null when none are graded. */
  netValue: number | null;
  verdicts: { [v in Verdict]: number };
  /** Most accepted trades with, then most offers exchanged; `basis: "offers"` when no trades yet. */
  favorite: { teamIds: number[]; trades: number; offers: number; basis: "trades" | "offers" } | null;
}

const TEAM_IDS = Object.keys(file.teamSummaries).map(Number);

export function teamTrades(teamId: number): TeamTrades {
  const s = file.teamSummaries[String(teamId)];
  const trades = tradesFor(teamId);
  const graded = trades.map((t) => sideOf(t, teamId).grade).filter((g) => g != null);
  const others = TEAM_IDS.filter((id) => id !== teamId);
  const tradeCount = (id: number) => trades.filter((t) => partnerOf(t, teamId).teamId === id).length;
  const rank = others
    .map((id) => ({ id, trades: tradeCount(id), offers: offersBetween(teamId, id) }))
    .filter((r) => r.trades > 0 || r.offers > 0)
    .sort((x, y) => y.trades - x.trades || y.offers - x.offers);
  const top = rank[0];
  const count = (v: Verdict) => graded.filter((g) => g.verdict === v).length;
  return {
    teamId,
    trades,
    offersSent: s?.proposalsSent2026 ?? 0,
    offersReceived: s?.proposalsReceived2026 ?? 0,
    netPoints: s?.netPointsFromTrades2026 ?? 0,
    netValue: graded.length ? graded.reduce((sum, g) => sum + g.valueEdge, 0) : null,
    verdicts: { "paying-off": count("paying-off"), even: count("even"), backfiring: count("backfiring") },
    favorite: top
      ? {
          teamIds: rank.filter((r) => r.trades === top.trades && r.offers === top.offers).map((r) => r.id),
          trades: top.trades,
          offers: top.offers,
          basis: top.trades > 0 ? "trades" : "offers",
        }
      : null,
  };
}

/* ---------- League superlatives ---------- */

function countBy<T>(items: T[], key: (x: T) => number | null) {
  const m = new Map<number, number>();
  for (const x of items) {
    const k = key(x);
    if (k != null) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n || team(a.id).name.localeCompare(team(b.id).name));
}

const chronological = [...TRADES].reverse();

function hotPotatoes() {
  const moves = new Map<string, { from: number; to: number; at: Date }[]>();
  for (const t of chronological)
    for (const s of t.sides)
      for (const a of s.got)
        if (a.kind === "player") moves.set(a.name, [...(moves.get(a.name) ?? []), { from: partnerOf(t, s.teamId).teamId, to: s.teamId, at: t.acceptedAt }]);
  return [...moves.entries()]
    .filter(([, m]) => m.length > 1)
    .map(([name, m]) => ({
      name,
      path: [m[0].from, ...m.map((x) => x.to)],
      days: Math.round((m[m.length - 1].at.getTime() - m[0].at.getTime()) / 86_400_000),
    }))
    .sort((a, b) => a.days - b.days);
}

function negotiatedPairs() {
  return [...OFFERS_BY_PAIR.entries()]
    .map(([k, offers]) => {
      const [a, b] = k.split("-").map(Number);
      return { ids: [a, b] as [number, number], offers, trades: TRADES.filter((t) => t.sides.some((s) => s.teamId === a) && t.sides.some((s) => s.teamId === b)).length };
    })
    .sort((x, y) => y.offers - x.offers);
}

const pairs = new Set(TRADES.map((t) => pairKey(t.sides[0].teamId, t.sides[1].teamId)));
const cut = TRADES.find((t) => t.sides.some((s) => s.got.some((a) => a.kind === "player") && s.points === 0));

/** Graded sides with their trade, oldest trade first. */
const gradedSides = chronological.flatMap((t) => t.sides.flatMap((s) => (s.grade ? [{ t, s, g: s.grade }] : [])));

/** Every team's verdicts, most backfires first. */
function report() {
  const ids = [...new Set(gradedSides.map((x) => x.s.teamId))];
  return ids
    .map((id) => {
      const mine = gradedSides.filter((x) => x.s.teamId === id);
      return {
        id,
        trades: tradesFor(id).length,
        payingOff: mine.filter((x) => x.g.verdict === "paying-off").length,
        even: mine.filter((x) => x.g.verdict === "even").length,
        backfiring: mine.filter((x) => x.g.verdict === "backfiring").length,
      };
    })
    .sort((a, b) => b.backfiring - a.backfiring || a.payingOff - b.payingOff || team(a.id).name.localeCompare(team(b.id).name));
}

/** Nth backfire for this team, in trade order (1-based); 0 when the side isn't backfiring. */
export function backfireNumber(t: Trade, teamId: number) {
  const fires = gradedSides.filter((x) => x.s.teamId === teamId && x.g.verdict === "backfiring");
  return fires.findIndex((x) => x.t.id === t.id) + 1;
}

const bestValue = gradedSides.filter((x) => x.g.verdict === "paying-off").sort((a, b) => b.g.valueEdge - a.g.valueEdge)[0] ?? null;

export const SUPERLATIVES = {
  mostActive: countBy(
    TRADES.flatMap((t) => t.sides),
    (s) => s.teamId,
  )[0],
  offersSent: countBy(file.proposals, (p) => p.proposedByTeamId),
  offersWithKnownSender: file.proposals.filter((p) => p.proposedByTeamId != null).length,
  negotiated: negotiatedPairs()[0],
  vetoVotes: countBy(file.vetoVotes, (v) => v.teamIdReported),
  hotPotatoes: hotPotatoes(),
  tradeAndCut: cut ? { trade: cut, side: cut.sides.find((s) => s.points === 0)!, note: file.leagueNotes.quickestCut } : null,
  distinctPairs: pairs.size,
  biggest: [...TRADES].sort((a, b) => b.playersMoved - a.playersMoved)[0],
  report: report(),
  bestValue: bestValue ? { trade: bestValue.t, side: bestValue.s, grade: bestValue.g } : null,
};
