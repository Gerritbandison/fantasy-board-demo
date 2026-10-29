import raw from "@/data/league-trades.json";
import { team } from "@/lib/league";

/*
 * Trade history (Flaim/ESPN). 2026 comes from ESPN's transaction log and is graded on
 * long-term value. ESPN keeps no log for 2020-2025, so those player trades were rebuilt
 * from weekly roster snapshots and are graded on points only. Like the other loaders,
 * ESPN names are dropped while mapping. Offers, declines and veto rows are private
 * negotiations: only their counts leave this module, never their contents.
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
  bySide?: { [teamId: string]: { totalPointsForNewTeam: number } };
  /** Past seasons only: "won", "lopsided", "even" or "too little data". */
  verdict?: string;
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
  /** Null for 2020-2025: ESPN kept no timestamp. */
  acceptedAt: string | null;
  processedAt: string | null;
  date: string;
  dateWindow?: { from: string; to: string };
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
  tradesBySeason: { [season: string]: number };
  partnersAllTime: { teamId: number; trades: number }[];
  netPointsFromTradesBySeason: { [season: string]: number };
  pastSeasonTradeRecord: { won: number; lost: number; even: number; tooEarly: number };
}

interface RawFile {
  meta: {
    timezone: string;
    counts: { acceptedTrades: number; uniqueProposals: number; rawProposalRows: number; declines: number; vetoVoteRows: number; unmatchedAcceptRows: number };
    pastSeasons: { evenUnder: number; lopsidedFrom: number };
  };
  tradesPerSeason: { [season: string]: number | null };
  trades: RawTrade[];
  proposals: { teamIds: number[]; proposedByTeamId: number | null }[];
  vetoVotes: { teamIdReported: number }[];
  unprocessedAccepts: { date: string }[];
  teamSummaries: { [teamId: string]: RawTeamSummary };
  leagueNotes: {
    quickestCut: string;
    allTime: { playerTradesBySeason: { [season: string]: number }; mostActiveTraderAllTime: { teamId: number; trades: number }[] };
  };
}

const file = raw as unknown as RawFile;

export const TRADE_SEASON = 2026;
export const TRADES_LABEL = `${TRADE_SEASON} season trades`;
export const UNKNOWN_SEASONS = Object.entries(file.tradesPerSeason)
  .filter(([, v]) => v == null)
  .map(([s]) => Number(s))
  .sort((a, b) => a - b);
const KNOWN_SEASONS = Object.entries(file.tradesPerSeason)
  .filter(([, v]) => v != null)
  .map(([s]) => Number(s))
  .sort((a, b) => a - b);
export const FIRST_SEASON = KNOWN_SEASONS[0] ?? TRADE_SEASON;
/** "2020–2026" */
export const SEASONS_LABEL = FIRST_SEASON === TRADE_SEASON ? String(TRADE_SEASON) : `${FIRST_SEASON}–${TRADE_SEASON}`;
/** Past-season points calls: an edge under `evenUnder` is even, `lopsidedFrom` or more is lopsided. */
export const PAST_GRADING = file.meta.pastSeasons;
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

/** Past seasons are called on points alone. */
export type PastCall = "won" | "lopsided" | "even" | "too-little-data";
export type PastOutcome = "won" | "lost" | "even" | "too-little-data";

export interface Trade {
  id: string;
  num: number;
  season: number;
  /** A 2020-2025 deal: no timestamp, no long-term value, points-only call. */
  past: boolean;
  week: number;
  weekLabel: string;
  /** Null for past seasons, which only have a date window. */
  acceptedAt: Date | null;
  /** Calendar days the deal went through in, for past seasons ("YYYY-MM-DD"). */
  window: { from: string; to: string } | null;
  sides: [TradeSide, TradeSide];
  /**
   * "partial": pieces rebuilt from the draft board; "inferred": the partner is inferred too;
   * "rebuilt": a past-season deal rebuilt from weekly rosters.
   */
  known: "full" | "partial" | "inferred" | "rebuilt";
  call: PastCall | null;
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

const PAST_CALLS: { [verdict: string]: PastCall } = { won: "won", lopsided: "lopsided", even: "even", "too little data": "too-little-data" };

function pastCall(w: RawWhoWon | null): PastCall {
  const c = w?.verdict != null ? PAST_CALLS[w.verdict] : undefined;
  if (!c) throw new Error(`Unrecognised past-season verdict "${w?.verdict}"`);
  return c;
}

/** Sort key: the accepted time, or the first day of a past deal's window. */
const when = (t: RawTrade) => new Date(t.acceptedAt ?? `${t.dateWindow?.from ?? t.date}T12:00:00Z`).getTime();

const ALL_TRADES: Trade[] = [...file.trades]
  .sort((x, y) => y.season - x.season || when(y) - when(x) || Number(y.id.split("-T")[1]) - Number(x.id.split("-T")[1]))
  .map((t) => {
    const w = t.whoWonIt;
    const lt = t.longTermGrade;
    const past = t.acceptedAt == null;
    const sides = t.teams.map((s) => {
      const g = lt.sides?.[String(s.teamId)];
      return {
        teamId: s.teamId,
        got: [...s.received.map((p) => player(p, g)), ...s.receivedPicks.map(pick)],
        points: g?.pointsReceived ?? (past ? (w?.bySide?.[String(s.teamId)]?.totalPointsForNewTeam ?? null) : null),
        grade: g ? sideGrade(g) : null,
      };
    }) as [TradeSide, TradeSide];
    const graded = sides.find((s) => s.grade)?.grade ?? null;
    return {
      id: t.id,
      num: Number(t.id.split("-T")[1]),
      season: t.season,
      past,
      week: t.week,
      weekLabel: t.weekLabel.replace(/^w/, "W").replace(/^p/, "P").replace(/^a/, "A"),
      acceptedAt: t.acceptedAt ? new Date(t.acceptedAt) : null,
      window: t.dateWindow ? { from: t.dateWindow.from, to: t.dateWindow.to } : null,
      sides,
      known: past ? "rebuilt" : t.confidence === "partial" ? "partial" : t.confidence === "inferred" ? "inferred" : "full",
      call: past ? pastCall(w) : null,
      released: t.releasedInDeal.map((p) => ({ name: p.name, position: p.position })),
      playersMoved: t.playersMoved,
      picksMoved: t.picksMoved,
      span: w ? w.weeksCounted : null,
      edge: w?.edgeTeamId != null && w.edgePoints ? { teamId: w.edgeTeamId, points: w.edgePoints } : null,
      ungraded: lt.grade === "INC" ? (lt.reason ?? "Not graded.") : null,
      confidence: graded?.confidence ?? null,
      weeksOfData: graded?.weeksOfData ?? 0,
    } satisfies Trade;
  });

/** Every player trade, all seasons, newest first. Draft-pick-only swaps are counted but not listed. */
export const TRADES = ALL_TRADES.filter((t) => t.playersMoved > 0);
/** This season's player trades: the ones with long-term value grades. */
export const CURRENT = TRADES.filter((t) => t.season === TRADE_SEASON);
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

/** A past-season side's result on points. */
export function pastOutcome(t: Trade, teamId: number): PastOutcome | null {
  if (!t.call) return null;
  if (t.call === "even" || t.call === "too-little-data") return t.call;
  return t.edge?.teamId === teamId ? "won" : "lost";
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

const DAY = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
/** A past deal's window, e.g. "Sep 14–17, 2020" or "Sep 29 – Oct 2, 2020". */
export function windowLabel(w: { from: string; to: string }) {
  const [a, b] = [w.from, w.to].map((d) => new Date(`${d}T12:00:00Z`));
  if (w.from === w.to) return DAY.format(a);
  return DAY.formatRange(a, b);
}

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

export interface SeasonNet {
  season: number;
  /** Player trades this team made that season. */
  trades: number;
  /** Net all points from that season's trades; null when the team made none. */
  netPoints: number | null;
}

export interface AllTimeTrades {
  /** Points-only results of the 2020-2025 deals, from the file. */
  record: { won: number; lost: number; even: number; tooLittleData: number };
  /** Net points from every season's trades (2026 runs through the last completed week). */
  netPoints: number;
  bySeason: SeasonNet[];
}

export interface TeamTrades {
  teamId: number;
  /** Player trades, every season. */
  trades: Trade[];
  /** This season's player trades. */
  current: Trade[];
  offersSent: number;
  offersReceived: number;
  /** This season: all points from players traded for, minus all points the players sent away scored for the partners. */
  netPoints: number;
  /** Rest-of-season value received (kept) minus value sent, summed over the graded trades; null when none are graded. */
  netValue: number | null;
  verdicts: { [v in Verdict]: number };
  /** Most player trades with, all-time; falls back to this season's offers (`basis: "offers"`) when there are none. */
  favorite: { teamIds: number[]; trades: number; offers: number; basis: "trades" | "offers" } | null;
  allTime: AllTimeTrades;
}

const TEAM_IDS = Object.keys(file.teamSummaries).map(Number);

function favoritePartner(teamId: number, s: RawTeamSummary | undefined): TeamTrades["favorite"] {
  const partners = s?.partnersAllTime ?? [];
  const most = Math.max(0, ...partners.map((p) => p.trades));
  if (most > 0) {
    const ids = partners.filter((p) => p.trades === most).map((p) => p.teamId);
    return { teamIds: ids, trades: most, offers: ids.reduce((sum, id) => sum + offersBetween(teamId, id), 0), basis: "trades" };
  }
  const offers = TEAM_IDS.filter((id) => id !== teamId)
    .map((id) => ({ id, offers: offersBetween(teamId, id) }))
    .filter((r) => r.offers > 0)
    .sort((x, y) => y.offers - x.offers);
  if (!offers.length) return null;
  return { teamIds: offers.filter((r) => r.offers === offers[0].offers).map((r) => r.id), trades: 0, offers: offers[0].offers, basis: "offers" };
}

function allTime(teamId: number, s: RawTeamSummary | undefined, trades: Trade[]): AllTimeTrades {
  const r = s?.pastSeasonTradeRecord;
  const net = s?.netPointsFromTradesBySeason ?? {};
  const bySeason = KNOWN_SEASONS.map((season) => {
    const n = trades.filter((t) => t.season === season).length;
    return { season, trades: n, netPoints: n ? (net[String(season)] ?? 0) : null };
  }).reverse();
  return {
    record: { won: r?.won ?? 0, lost: r?.lost ?? 0, even: r?.even ?? 0, tooLittleData: r?.tooEarly ?? 0 },
    netPoints: Object.values(net).reduce((sum, v) => sum + v, 0),
    bySeason,
  };
}

export function teamTrades(teamId: number): TeamTrades {
  const s = file.teamSummaries[String(teamId)];
  const trades = tradesFor(teamId);
  const current = trades.filter((t) => t.season === TRADE_SEASON);
  const graded = current.map((t) => sideOf(t, teamId).grade).filter((g) => g != null);
  const count = (v: Verdict) => graded.filter((g) => g.verdict === v).length;
  return {
    teamId,
    trades,
    current,
    offersSent: s?.proposalsSent2026 ?? 0,
    offersReceived: s?.proposalsReceived2026 ?? 0,
    netPoints: s?.netPointsFromTrades2026 ?? 0,
    netValue: graded.length ? graded.reduce((sum, g) => sum + g.valueEdge, 0) : null,
    verdicts: { "paying-off": count("paying-off"), even: count("even"), backfiring: count("backfiring") },
    favorite: favoritePartner(teamId, s),
    allTime: allTime(teamId, s, trades),
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

/** This season's player trades, oldest first. The superlatives below are this season's. */
const chronological = [...CURRENT].reverse();

function hotPotatoes() {
  const moves = new Map<string, { from: number; to: number; at: Date }[]>();
  for (const t of chronological)
    for (const s of t.sides)
      for (const a of s.got)
        if (a.kind === "player") moves.set(a.name, [...(moves.get(a.name) ?? []), { from: partnerOf(t, s.teamId).teamId, to: s.teamId, at: t.acceptedAt! }]);
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
      return { ids: [a, b] as [number, number], offers, trades: CURRENT.filter((t) => t.sides.some((s) => s.teamId === a) && t.sides.some((s) => s.teamId === b)).length };
    })
    .sort((x, y) => y.offers - x.offers);
}

const pairs = new Set(CURRENT.map((t) => pairKey(t.sides[0].teamId, t.sides[1].teamId)));
const cut = CURRENT.find((t) => t.sides.some((s) => s.got.some((a) => a.kind === "player") && s.points === 0));

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
        trades: tradesFor(id).filter((t) => t.season === TRADE_SEASON).length,
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
    CURRENT.flatMap((t) => t.sides),
    (s) => s.teamId,
  )[0],
  offersSent: countBy(file.proposals, (p) => p.proposedByTeamId),
  offersWithKnownSender: file.proposals.filter((p) => p.proposedByTeamId != null).length,
  negotiated: negotiatedPairs()[0],
  vetoVotes: countBy(file.vetoVotes, (v) => v.teamIdReported),
  hotPotatoes: hotPotatoes(),
  tradeAndCut: cut ? { trade: cut, side: cut.sides.find((s) => s.points === 0)!, note: file.leagueNotes.quickestCut } : null,
  distinctPairs: pairs.size,
  biggest: [...CURRENT].sort((a, b) => b.playersMoved - a.playersMoved)[0],
  report: report(),
  bestValue: bestValue ? { trade: bestValue.t, side: bestValue.s, grade: bestValue.g } : null,
};

/* ---------- All-time ---------- */

/** Player trades per season, oldest first, from the file. */
export const TRADES_BY_SEASON = Object.entries(file.leagueNotes.allTime.playerTradesBySeason)
  .map(([season, n]) => ({ season: Number(season), trades: n }))
  .sort((a, b) => a.season - b.season);

/** "Deebo Samuel Sr." and "Deebo Samuel" are the same player across seasons. */
const playerKey = (name: string) => name.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/, "");

/** Players in the most trades, with each move oldest first. */
function mostTraded() {
  const m = new Map<string, { name: string; moves: { trade: Trade; from: number; to: number }[] }>();
  for (const t of [...TRADES].reverse())
    for (const s of t.sides)
      for (const a of s.got) {
        if (a.kind !== "player") continue;
        const e = m.get(playerKey(a.name)) ?? { name: a.name, moves: [] };
        e.name = a.name;
        e.moves.push({ trade: t, from: partnerOf(t, s.teamId).teamId, to: s.teamId });
        m.set(playerKey(a.name), e);
      }
  return [...m.values()].filter((p) => p.moves.length > 1).sort((a, b) => b.moves.length - a.moves.length || a.name.localeCompare(b.name));
}

/** Every team with a player trade, by net points from trades across all seasons. */
function netTable() {
  return TEAM_IDS.map((id) => ({ id, ...teamTrades(id) }))
    .filter((r) => r.trades.length > 0)
    .map((r) => ({ id: r.id, trades: r.trades.length, net: r.allTime.netPoints, record: r.allTime.record }))
    .sort((a, b) => b.net - a.net);
}

const NET_TABLE = netTable();
const heist = TRADES.filter((t) => t.call === "lopsided" && t.edge).sort((a, b) => b.edge!.points - a.edge!.points)[0] ?? null;

export const ALL_TIME = {
  mostActive: file.leagueNotes.allTime.mostActiveTraderAllTime.map((r) => ({ id: r.teamId, n: r.trades })),
  sharks: NET_TABLE.filter((r) => r.net > 0).slice(0, 3),
  suckers: NET_TABLE.filter((r) => r.net < 0)
    .slice(-3)
    .reverse(),
  mostTraded: mostTraded(),
  heist: heist ? { trade: heist, winner: sideOf(heist, heist.edge!.teamId), loser: partnerOf(heist, heist.edge!.teamId) } : null,
};
