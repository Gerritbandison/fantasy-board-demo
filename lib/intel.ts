import raw from "@/data/league-intel.json";
import { snapshot } from "@/lib/league";

export interface WeekResult {
  week: number;
  pf: number;
  pa: number;
  opp: string;
  result: "W" | "L" | "T";
}

export interface Franchise {
  teamId: number;
  name: string;
  ownerLabel: string;
  arc: string;
  titles: number;
  playoffAppearancesRecent: string;
  weekly2026: WeekResult[];
  signature: string;
}

export type LuckLabel = "running hot" | "fair" | "unlucky";

export interface LuckRow {
  team: string;
  teamId: number;
  record: string;
  pf: number;
  pfRank: number;
  winRank: number;
  luckDelta: number;
  label: LuckLabel;
}

export interface MatchupBrief {
  slug: string;
  title: string;
  week: number;
  story: string;
  edges: { side: string; edge: string }[];
  historyNote: string;
  mustWin: string;
}

export interface PulseItem {
  tone: "signal" | "alert";
  title: string;
  body: string;
}

export interface Championship {
  year: number;
  champion: string;
  runnerUp: string;
  note: string;
}

export interface LeagueIntel {
  brand: { name: string; tagline: string; mode: string };
  league: { name: string; id: string; season: number; week: number; format: string; seasonsOnRecord: number[] };
  champions: Championship[];
  allTime: { team: string; titles: number; years: string; note: string }[];
  franchises: Franchise[];
  luckIndex: LuckRow[];
  matchupBriefs: MatchupBrief[];
  leaguePulse: PulseItem[];
  week8Projections: { [slug: string]: { home: string; away: string; homeProj: number; awayProj: number } };
}

export const intel = raw as LeagueIntel;

/** Three-letter call signs used across the console; keyed by ESPN team id. */
const CALLSIGNS: { [teamId: number]: string } = {
  1: "BIB",
  2: "JAH",
  3: "CHW",
  4: "AHT",
  5: "EPZ",
  6: "SMF",
  7: "MIG",
  8: "DIM",
  10: "SND",
  11: "KAB",
};

export function callsign(teamId: number) {
  return CALLSIGNS[teamId] ?? "???";
}

/** Intel sometimes shortens names ("Easy Peasy"); resolve to the snapshot's display name. */
export function teamIdByName(name: string) {
  const exact = snapshot.standings.find((s) => s.teamName === name);
  if (exact) return exact.teamId;
  return snapshot.standings.find((s) => s.teamName.startsWith(name))?.teamId;
}

export function getFranchise(teamId: number) {
  return intel.franchises.find((f) => f.teamId === teamId);
}

export function getBrief(slug: string) {
  return intel.matchupBriefs.find((b) => b.slug === slug);
}

export function getLuck(teamId: number) {
  return intel.luckIndex.find((l) => l.teamId === teamId);
}

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function trailStats(f: Franchise) {
  const pfs = f.weekly2026.map((w) => w.pf);
  const wins = f.weekly2026.filter((w) => w.result === "W").length;
  const losses = f.weekly2026.filter((w) => w.result === "L").length;
  const high = f.weekly2026.reduce((a, b) => (b.pf > a.pf ? b : a));
  const low = f.weekly2026.reduce((a, b) => (b.pf < a.pf ? b : a));
  return {
    avg: pfs.reduce((a, b) => a + b, 0) / Math.max(1, pfs.length),
    median: median(pfs),
    high,
    low,
    record: `${wins}-${losses}`,
  };
}

/** Shared y-range so every trail in the app reads on the same scale. */
export const TRAIL_RANGE = (() => {
  const all = intel.franchises.flatMap((f) => f.weekly2026.flatMap((w) => [w.pf, w.pa]));
  return { min: Math.floor((Math.min(...all) - 5) / 10) * 10, max: Math.ceil((Math.max(...all) + 5) / 10) * 10 };
})();

/** "Chewy — a loss puts them…" → { subject, detail } */
export function splitMustWin(text: string) {
  const [subject, ...rest] = text.split(" — ");
  return { subject: subject.trim(), detail: rest.join(" — ").trim() };
}

export interface TitleBoardRow {
  team: string;
  teamId?: number;
  titles: number;
  finals: number;
  titleYears: number[];
  runnerUpYears: number[];
  note?: string;
}

/** Titles and finals appearances derived from the champions archive, annotated with allTime notes. */
export function titleBoard(): TitleBoardRow[] {
  const rows = new Map<string, TitleBoardRow>();
  const row = (team: string) => {
    let r = rows.get(team);
    if (!r) {
      r = { team, teamId: teamIdByName(team), titles: 0, finals: 0, titleYears: [], runnerUpYears: [] };
      rows.set(team, r);
    }
    return r;
  };
  for (const c of intel.champions) {
    const champ = row(c.champion);
    champ.titles += 1;
    champ.finals += 1;
    champ.titleYears.push(c.year);
    const ru = row(c.runnerUp);
    ru.finals += 1;
    ru.runnerUpYears.push(c.year);
  }
  for (const a of intel.allTime) row(a.team).note = a.note;
  return [...rows.values()].sort(
    (a, b) => b.titles - a.titles || b.finals - a.finals || (b.titleYears[0] ?? 0) - (a.titleYears[0] ?? 0),
  );
}

/** Champion seeds as quoted in the "mid-seeds" pulse item, e.g. "2023 Soldiers (4)". */
export function championSeeds() {
  const seeds = new Map<number, number>();
  for (const p of intel.leaguePulse) {
    for (const m of p.body.matchAll(/(\d{4}) [^(),]+\((\d+)\)/g)) seeds.set(Number(m[1]), Number(m[2]));
  }
  return seeds;
}

export type ArchiveRole = "champion" | "runner-up" | "mentioned";

/** Nicknames the archive notes use instead of the full team name. */
const NOTE_NICKNAMES: { [teamId: number]: string } = { 1: "Bibi", 3: "Chewy", 8: "Dimes" };

/** Every champions-archive season that involves this franchise, newest first. */
export function archiveHits(f: Franchise) {
  const nick = NOTE_NICKNAMES[f.teamId];
  const mentioned = (note: string) => note.includes(f.name) || (nick != null && note.includes(nick));
  return intel.champions.flatMap((c) => {
    const role: ArchiveRole | null =
      c.champion === f.name ? "champion" : c.runnerUp === f.name ? "runner-up" : mentioned(c.note) ? "mentioned" : null;
    return role ? [{ ...c, role }] : [];
  });
}

export const LUCK_TONE: { [label in LuckLabel]: { short: string; tone: string } } = {
  "running hot": { short: "HOT", tone: "text-phos ring-phos/40 bg-phos/10" },
  fair: { short: "EVEN", tone: "text-dim ring-white/15 bg-white/[0.03]" },
  unlucky: { short: "DUE", tone: "text-sig ring-sig/40 bg-sig/10" },
};

export function weekCode(week: number) {
  return String(week).padStart(2, "0");
}
