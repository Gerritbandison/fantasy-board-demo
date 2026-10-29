import { abbreviate } from "./mock-fantasy";
import type { ConnectedPayload, Headline, LineupSlot, RosterPlayer, TeamSummary } from "./types";

/**
 * Read-only adapter for ESPN's public fantasy endpoints. These only work for
 * leagues set to "viewable to public" — private leagues need espn_s2/SWID
 * cookies, which this demo deliberately never asks for.
 */

const LEAGUE_URL = (season: number, leagueId: string) =>
  `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}`;
const NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=8";

const SLOT_MAP: { [id: number]: LineupSlot } = {
  0: "QB", 2: "RB", 4: "WR", 6: "TE", 16: "D/ST", 17: "K", 20: "BN", 21: "IR", 23: "FLEX",
};
const POSITION_MAP: { [id: number]: string } = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };
const PRO_TEAMS: { [id: number]: string } = {
  0: "FA", 1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET", 9: "GB",
  10: "TEN", 11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN", 17: "NE", 18: "NO",
  19: "NYG", 20: "NYJ", 21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC", 25: "SF", 26: "SEA", 27: "TB",
  28: "WSH", 29: "CAR", 30: "JAX", 33: "BAL", 34: "HOU",
};
const SLOT_ORDER: LineupSlot[] = ["QB", "RB", "WR", "TE", "FLEX", "D/ST", "K", "BN", "IR"];

interface EspnStat { scoringPeriodId: number; statSourceId: number; appliedTotal?: number }
interface EspnEntry {
  lineupSlotId: number;
  playerId: number;
  playerPoolEntry?: {
    player?: {
      fullName?: string;
      defaultPositionId?: number;
      proTeamId?: number;
      injuryStatus?: string;
      stats?: EspnStat[];
    };
  };
}
interface EspnTeam {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  abbrev?: string;
  playoffSeed?: number;
  record?: { overall?: { wins: number; losses: number; ties: number } };
  roster?: { entries?: EspnEntry[] };
}
interface EspnSide { teamId: number; totalPoints?: number; totalPointsLive?: number; totalProjectedPointsLive?: number }
interface EspnLeague {
  scoringPeriodId: number;
  seasonId: number;
  settings?: { name?: string };
  status?: { currentMatchupPeriod?: number };
  teams?: EspnTeam[];
  schedule?: { matchupPeriodId: number; home?: EspnSide; away?: EspnSide }[];
}

export interface EspnConfig {
  leagueId: string;
  teamId: string;
  season: number;
  teamNameOverride: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (res.status === 401 || res.status === 403) throw new Error("league is private or does not exist");
  if (!res.ok) throw new Error(`ESPN responded ${res.status}`);
  return (await res.json()) as T;
}

function teamName(t: EspnTeam): string {
  return t.name || [t.location, t.nickname].filter(Boolean).join(" ") || `Team ${t.id}`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function toSummary(t: EspnTeam, side: EspnSide | undefined, nameOverride?: string | null): TeamSummary {
  const name = nameOverride || teamName(t);
  return {
    id: String(t.id),
    name,
    abbrev: t.abbrev ?? abbreviate(name),
    manager: "",
    record: t.record?.overall ?? { wins: 0, losses: 0, ties: 0 },
    standing: t.playoffSeed ?? null,
    points: round1(side?.totalPointsLive ?? side?.totalPoints ?? 0),
    projected: round1(side?.totalProjectedPointsLive ?? side?.totalPointsLive ?? side?.totalPoints ?? 0),
  };
}

function toPlayer(e: EspnEntry, period: number): RosterPlayer {
  const p = e.playerPoolEntry?.player ?? {};
  const stats = p.stats ?? [];
  const actual = stats.find((s) => s.scoringPeriodId === period && s.statSourceId === 0);
  const proj = stats.find((s) => s.scoringPeriodId === period && s.statSourceId === 1);
  const injury = p.injuryStatus && p.injuryStatus !== "ACTIVE" ? p.injuryStatus.replace("_", " ") : null;
  return {
    id: String(e.playerId),
    slot: SLOT_MAP[e.lineupSlotId] ?? "BN",
    name: p.fullName ?? "Unknown player",
    position: POSITION_MAP[p.defaultPositionId ?? -1] ?? "—",
    nflTeam: PRO_TEAMS[p.proTeamId ?? 0] ?? "FA",
    opponent: null,
    gameState: actual ? "live" : "pre",
    gameLabel: actual ? "Scoring" : "Projected",
    points: actual?.appliedTotal != null ? round1(actual.appliedTotal) : null,
    projected: round1(proj?.appliedTotal ?? 0),
    injury,
  };
}

async function getEspnHeadlines(): Promise<Headline[]> {
  try {
    const data = await getJson<{ articles?: { headline?: string; published?: string; type?: string }[] }>(NEWS_URL);
    return (data.articles ?? [])
      .filter((a) => a.headline)
      .slice(0, 6)
      .map((a, i) => ({
        id: `espn-${i}`,
        title: a.headline!,
        source: "ESPN",
        publishedAt: a.published ?? new Date().toISOString(),
        tag: a.type === "Story" ? "News" : (a.type ?? null),
      }));
  } catch {
    return [];
  }
}

export async function getEspnFantasy(cfg: EspnConfig): Promise<ConnectedPayload> {
  const url = `${LEAGUE_URL(cfg.season, cfg.leagueId)}?view=mTeam&view=mRoster&view=mMatchupScore&view=mSettings`;
  const [league, headlines] = await Promise.all([getJson<EspnLeague>(url), getEspnHeadlines()]);

  const team = league.teams?.find((t) => String(t.id) === cfg.teamId);
  if (!team) throw new Error(`Team ${cfg.teamId} not found in league`);

  const week = league.status?.currentMatchupPeriod ?? league.scoringPeriodId;
  const game = league.schedule?.find(
    (m) => m.matchupPeriodId === week && (m.home?.teamId === team.id || m.away?.teamId === team.id),
  );
  const mine = game?.home?.teamId === team.id ? game?.home : game?.away;
  const theirs = game?.home?.teamId === team.id ? game?.away : game?.home;
  const opponent = league.teams?.find((t) => t.id === theirs?.teamId);

  const roster = (team.roster?.entries ?? [])
    .map((e) => toPlayer(e, league.scoringPeriodId))
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  return {
    status: "connected",
    source: "espn",
    league: {
      name: league.settings?.name ?? "ESPN League",
      season: league.seasonId,
      week,
      teamCount: league.teams?.length ?? 0,
    },
    team: toSummary(team, mine, cfg.teamNameOverride),
    matchup: opponent ? { week, opponent: toSummary(opponent, theirs), winProbability: null } : null,
    roster,
    headlines,
    updatedAt: new Date().toISOString(),
    notice: null,
  };
}
