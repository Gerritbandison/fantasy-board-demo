import raw from "@/data/week-roasts.json";
import { formatPoints, formatRecord, LEAGUE, sanitizeCopy, team } from "@/lib/league";

/*
 * Weekly roast cards for the scores page. Swap data/week-roasts.json when the
 * week turns. Names, abbreviations, and records always come from the team
 * directory, so a file that still says KBL or JIGA cannot change the card.
 */

interface RawMatchup {
  matchupId: string;
  homeTeamId: number;
  awayTeamId: number;
  homePoints: number;
  awayPoints: number;
  headline: string;
  roast: string;
  projection: { home: number; away: number };
  tag: string;
}

interface RawFile {
  week: number;
  dataPulledAt: string;
  matchups: RawMatchup[];
}

const file = raw as RawFile;

/** File abbrevs from outside the app directory, rewritten to the ones the app already uses. */
export function normalizeRoastText(text: string) {
  return sanitizeCopy(text)
    .replace(/\bJIGA\b/g, "JAH")
    .replace(/\bKBL\b/g, "KAB")
    .replace(/\bKabul\b(?! FC)/g, "Kabul FC");
}

export type RoastTagKind = "lock" | "upset" | "note";

export interface RoastTag {
  kind: RoastTagKind;
  label: string;
  detail: string;
}

export function parseRoastTag(tag: string): RoastTag {
  const text = normalizeRoastText(tag).trim();
  const lock = /^LOCK:\s*/i.exec(text);
  if (lock) return { kind: "lock", label: "Lock", detail: text.slice(lock[0].length).trim() };
  const upset = /^UPSET ALERT:\s*/i.exec(text);
  if (upset) return { kind: "upset", label: "Upset alert", detail: text.slice(upset[0].length).trim() };
  return { kind: "note", label: "Note", detail: text };
}

export interface RoastSide {
  teamId: number;
  name: string;
  abbrev: string;
  record: string;
  points: number;
  projected: number;
  home: boolean;
}

export interface RoastMatchup {
  id: string;
  home: RoastSide;
  away: RoastSide;
  headline: string;
  roast: string;
  projectionLine: string;
  tag: RoastTag;
}

export interface WeekRoasts {
  week: number;
  dataPulledAt: string;
  matchups: RoastMatchup[];
}

function side(teamId: number, points: number, projected: number, home: boolean): RoastSide {
  const t = team(teamId);
  return { teamId, name: t.name, abbrev: t.abbrev, record: formatRecord(t), points, projected, home };
}

function projectionLine(home: RoastSide, away: RoastSide) {
  return `ESPN projection: ${home.name} ${home.projected.toFixed(1)} vs ${away.name} ${away.projected.toFixed(1)} (current ${formatPoints(home.points)}-${formatPoints(away.points)})`;
}

function load(): WeekRoasts | null {
  if (file.week !== LEAGUE.week || file.matchups.length === 0) return null;
  return {
    week: file.week,
    dataPulledAt: file.dataPulledAt,
    matchups: file.matchups.map((m) => {
      const home = side(m.homeTeamId, m.homePoints, m.projection.home, true);
      const away = side(m.awayTeamId, m.awayPoints, m.projection.away, false);
      return {
        id: m.matchupId,
        home,
        away,
        headline: normalizeRoastText(m.headline),
        roast: normalizeRoastText(m.roast),
        projectionLine: projectionLine(home, away),
        tag: parseRoastTag(m.tag),
      };
    }),
  };
}

/** The current week's roast cards, or null when the file is for a different week. */
export const WEEK_ROASTS: WeekRoasts | null = load();
