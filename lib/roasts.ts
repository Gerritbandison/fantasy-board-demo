import raw from "@/data/week-roasts.json";
import { normalizeRoastText, parseRoastTag, type RoastTag } from "@/lib/roast-copy";
import { formatPoints, formatRecord, LEAGUE, team } from "@/lib/league";

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

export { normalizeRoastText, parseRoastTag };
export type { RoastTag };

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

/** Record before a provisional week, so a Sunday snapshot does not pick up Monday's live result. */
function recordAtSnapshot(t: ReturnType<typeof team>) {
  const live = t.weekly.find((row) => row.week === LEAGUE.week && row.provisional);
  if (!live) return formatRecord(t);
  return formatRecord({
    wins: t.wins - (live.result === "W" ? 1 : 0),
    losses: t.losses - (live.result === "L" ? 1 : 0),
    ties: t.ties - (live.result === "T" ? 1 : 0),
  });
}

function side(teamId: number, points: number, projected: number, home: boolean): RoastSide {
  const t = team(teamId);
  return { teamId, name: t.name, abbrev: t.abbrev, record: recordAtSnapshot(t), points, projected, home };
}

function projectionLine(home: RoastSide, away: RoastSide) {
  const when = LEAGUE.provisionalLabel ? "at that snapshot" : "current";
  return `ESPN projection: ${home.name} ${home.projected.toFixed(1)} vs ${away.name} ${away.projected.toFixed(1)} (${when} ${formatPoints(home.points)}-${formatPoints(away.points)})`;
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
