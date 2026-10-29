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
  bySide: { [teamId: string]: { totalPointsForNewTeam: number; startedPointsForNewTeam: number; weeks: { player: string; week: number; points: number; started: boolean }[] } };
  edgeTeamId: number;
  edgeStartedPoints: number;
  verdict: string;
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
}

interface RawTeamSummary {
  teamId: number;
  proposalsSent2026: number;
  proposalsReceived2026: number;
  netStartedPointsFromTrades2026: number;
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
  offers: file.meta.counts.uniqueProposals,
  declines: file.meta.counts.declines,
  vetoVotes: file.vetoVotes.length,
  neverProcessed: file.unprocessedAccepts.length,
};

/* ---------- Trades ---------- */

export type Asset =
  | { kind: "player"; name: string; position: string; nflTeam?: string }
  | { kind: "pick"; ownerId: number; season: number; round: number; overall: number };

export type Grade = "A" | "A-" | "B+" | "B" | "C+" | "C" | "D" | "F" | "INC";

export interface TradeSide {
  teamId: number;
  got: Asset[];
  /** Starters' points the received players scored for this team, or null when there is no data yet. */
  started: number | null;
  total: number | null;
  grade: Grade;
}

export interface Trade {
  id: string;
  num: number;
  week: number;
  weekLabel: string;
  acceptedAt: Date;
  sides: [TradeSide, TradeSide];
  /** "partial": pieces rebuilt from the draft board; "inferred": the partner is inferred too. */
  known: "full" | "partial" | "inferred";
  released: { name: string; position: string }[];
  playersMoved: number;
  picksMoved: number;
  /** First and last week counted in the starters'-points hint. */
  span: [number, number] | null;
  weeksCounted: number;
  edge: { teamId: number; points: number } | null;
  early: boolean;
}

const PICK = /^(\d+)'s (\d{4}) round-(\d+) pick \(#(\d+)(?: overall)?\)$/;

function pick(s: string): Asset {
  const m = PICK.exec(s.trim());
  if (!m) throw new Error(`Unrecognised pick "${s}"`);
  return { kind: "pick", ownerId: Number(m[1]), season: Number(m[2]), round: Number(m[3]), overall: Number(m[4]) };
}

const player = (p: RawPlayer): Asset => ({ kind: "player", name: p.name, position: p.position, nflTeam: p.nflTeam ?? undefined });

/**
 * Grades compare starters' points per counted week between the two sides.
 * Thresholds are the app's rubric; the points themselves come from the file.
 */
export const GRADE_STEPS: { min: number; grade: Grade }[] = [
  { min: 8, grade: "A" },
  { min: 4, grade: "A-" },
  { min: 1.5, grade: "B+" },
  { min: -1.5, grade: "B" },
  { min: -4, grade: "C+" },
  { min: -8, grade: "C" },
];
export const EARLY_WEEKS = 2;

function grade(mine: number, theirs: number, weeks: number): Grade {
  if (mine === 0 && theirs > 0) return "F";
  const perWeek = (mine - theirs) / weeks;
  return GRADE_STEPS.find((s) => perWeek >= s.min)?.grade ?? "D";
}

export const TRADES: Trade[] = file.trades
  .map((t) => {
    const w = t.whoWonIt;
    const weeksCounted = w ? w.weeksCounted[1] - w.weeksCounted[0] + 1 : 0;
    const [a, b] = t.teams.map((s) => {
      const mine = w?.bySide[String(s.teamId)];
      return { teamId: s.teamId, got: [...s.received.map(player), ...s.receivedPicks.map(pick)], started: mine?.startedPointsForNewTeam ?? null, total: mine?.totalPointsForNewTeam ?? null };
    });
    const sides = [a, b].map((s, i, all) => {
      const other = all[1 - i];
      const g: Grade = s.started != null && other.started != null && weeksCounted ? grade(s.started, other.started, weeksCounted) : "INC";
      return { ...s, grade: g };
    }) as [TradeSide, TradeSide];
    return {
      id: t.id,
      num: Number(t.id.split("-T")[1]),
      week: t.week,
      weekLabel: t.weekLabel.replace(/^w/, "W").replace(/^p/, "P"),
      acceptedAt: new Date(t.acceptedAt),
      sides,
      known: t.confidence === "partial" ? "partial" : t.confidence === "inferred" ? "inferred" : "full",
      released: t.releasedInDeal.map((p) => ({ name: p.name, position: p.position })),
      playersMoved: t.playersMoved,
      picksMoved: t.picksMoved,
      span: w ? w.weeksCounted : null,
      weeksCounted,
      edge: w && w.edgeStartedPoints > 0 ? { teamId: w.edgeTeamId, points: w.edgeStartedPoints } : null,
      early: !!w && weeksCounted <= EARLY_WEEKS,
    } satisfies Trade;
  })
  .sort((x, y) => y.acceptedAt.getTime() - x.acceptedAt.getTime());

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
  netStarted: number;
  /** Most accepted trades with, then most offers exchanged; `basis: "offers"` when no trades yet. */
  favorite: { teamIds: number[]; trades: number; offers: number; basis: "trades" | "offers" } | null;
}

const TEAM_IDS = Object.keys(file.teamSummaries).map(Number);

export function teamTrades(teamId: number): TeamTrades {
  const s = file.teamSummaries[String(teamId)];
  const trades = tradesFor(teamId);
  const others = TEAM_IDS.filter((id) => id !== teamId);
  const tradeCount = (id: number) => trades.filter((t) => partnerOf(t, teamId).teamId === id).length;
  const rank = others
    .map((id) => ({ id, trades: tradeCount(id), offers: offersBetween(teamId, id) }))
    .filter((r) => r.trades > 0 || r.offers > 0)
    .sort((x, y) => y.trades - x.trades || y.offers - x.offers);
  const top = rank[0];
  return {
    teamId,
    trades,
    offersSent: s?.proposalsSent2026 ?? 0,
    offersReceived: s?.proposalsReceived2026 ?? 0,
    netStarted: s?.netStartedPointsFromTrades2026 ?? 0,
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

const graded = TRADES.filter((t) => t.edge && !t.early);
const fleece = graded.sort((a, b) => b.edge!.points / b.weeksCounted - a.edge!.points / a.weeksCounted)[0];
const pairs = new Set(TRADES.map((t) => pairKey(t.sides[0].teamId, t.sides[1].teamId)));
const cut = TRADES.find((t) => t.sides.some((s) => s.got.some((a) => a.kind === "player") && s.started === 0 && s.total === 0));

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
  tradeAndCut: cut ? { trade: cut, side: cut.sides.find((s) => s.started === 0 && s.total === 0)!, note: file.leagueNotes.quickestCut } : null,
  distinctPairs: pairs.size,
  biggest: [...TRADES].sort((a, b) => b.playersMoved - a.playersMoved)[0],
  fleece,
};
