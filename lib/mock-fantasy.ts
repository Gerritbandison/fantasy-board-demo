import type {
  ConnectedPayload,
  DisconnectedPayload,
  Headline,
  RosterPlayer,
} from "./types";

/**
 * Flaim/ESPN-shaped demo data. Every player, manager, and league name here is
 * fictional so the board can be shown publicly without leaking anything real.
 */

type MockPlayer = Omit<RosterPlayer, "points" | "gameLabel"> & {
  /** Final points for finished games, ignored otherwise. */
  finalPoints?: number;
  kickoff?: string;
  finalScore?: string;
};

const MOCK_ROSTER: MockPlayer[] = [
  { id: "p1", slot: "QB", name: "Marcus Hale", position: "QB", nflTeam: "KC", opponent: "@LV", gameState: "live", projected: 22.4, injury: null },
  { id: "p2", slot: "RB", name: "Dante Wilder", position: "RB", nflTeam: "ATL", opponent: "vs NO", gameState: "final", projected: 16.8, finalPoints: 24.6, finalScore: "W 31-17", injury: null },
  { id: "p3", slot: "RB", name: "Jalen Brooks", position: "RB", nflTeam: "DET", opponent: "@GB", gameState: "live", projected: 14.2, injury: "Q" },
  { id: "p4", slot: "WR", name: "Theo Ramsey", position: "WR", nflTeam: "CIN", opponent: "vs PIT", gameState: "live", projected: 18.1, injury: null },
  { id: "p5", slot: "WR", name: "Isaiah Cole", position: "WR", nflTeam: "MIA", opponent: "@BUF", gameState: "pre", projected: 15.3, kickoff: "SNF 8:20 PM", injury: null },
  { id: "p6", slot: "TE", name: "Grant Okafor", position: "TE", nflTeam: "BAL", opponent: "vs CLE", gameState: "final", projected: 11.0, finalPoints: 8.4, finalScore: "W 24-13", injury: null },
  { id: "p7", slot: "FLEX", name: "Riley Santos", position: "WR", nflTeam: "SEA", opponent: "@SF", gameState: "pre", projected: 12.6, kickoff: "Sun 4:25 PM", injury: null },
  { id: "p8", slot: "K", name: "Evan Marsh", position: "K", nflTeam: "PHI", opponent: "vs DAL", gameState: "pre", projected: 8.5, kickoff: "Sun 4:25 PM", injury: null },
  { id: "p9", slot: "D/ST", name: "Steelers D/ST", position: "D/ST", nflTeam: "PIT", opponent: "@CIN", gameState: "live", projected: 7.0, injury: null },
  { id: "p10", slot: "BN", name: "Caleb Fontaine", position: "RB", nflTeam: "HOU", opponent: "vs IND", gameState: "pre", projected: 9.8, kickoff: "MNF 8:15 PM", injury: null },
  { id: "p11", slot: "BN", name: "Nico Alvarez", position: "WR", nflTeam: "LAR", opponent: null, gameState: "bye", projected: 0, injury: null },
  { id: "p12", slot: "BN", name: "Shane Whitlock", position: "QB", nflTeam: "MIN", opponent: "@CHI", gameState: "final", projected: 17.5, finalPoints: 19.2, finalScore: "L 20-23", injury: null },
  { id: "p13", slot: "BN", name: "Omar Pettis", position: "TE", nflTeam: "NYJ", opponent: "vs NE", gameState: "live", projected: 6.4, injury: null },
  { id: "p14", slot: "IR", name: "Tyler Banks", position: "WR", nflTeam: "TB", opponent: null, gameState: "pre", projected: 0, kickoff: "—", injury: "IR" },
];

const MOCK_HEADLINES: Omit<Headline, "publishedAt">[] = [
  { id: "h1", title: "Jalen Brooks (ankle) active, expected to handle early-down work", source: "Flaim Wire", tag: "Injury" },
  { id: "h2", title: "Theo Ramsey leads all receivers in targets over the last three weeks", source: "Flaim Wire", tag: "Trend" },
  { id: "h3", title: "Weather watch: gusts up to 25 mph forecast for the Bills home game", source: "Flaim Wire", tag: "Weather" },
  { id: "h4", title: "Waiver priority resets Wednesday; FAAB budgets refresh next season", source: "League Office", tag: "League" },
  { id: "h5", title: "Seahawks expected to lean on three-receiver sets against San Francisco", source: "Flaim Wire", tag: "Matchup" },
  { id: "h6", title: "Trade deadline is two weeks out — check the league calendar", source: "League Office", tag: "League" },
];

/** 0.3–0.95 progress through live games, cycling every 3 hours so the demo ticks. */
function liveProgress(now: Date, seed: number): number {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const phase = ((minutes + seed * 17) % 180) / 180;
  return 0.3 + phase * 0.65;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

function buildRoster(now: Date): RosterPlayer[] {
  return MOCK_ROSTER.map((p, i) => {
    const { finalPoints, kickoff, finalScore, ...base } = p;
    if (p.gameState === "final") {
      return { ...base, points: finalPoints ?? p.projected, gameLabel: `Final ${finalScore ?? ""}`.trim() };
    }
    if (p.gameState === "live") {
      const progress = liveProgress(now, i);
      const variance = 0.85 + ((i * 37) % 30) / 100;
      const quarter = QUARTERS[Math.min(3, Math.floor(progress * 4))];
      const clock = `${String(14 - (Math.floor(progress * 60) % 15)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`;
      return {
        ...base,
        points: Math.round(p.projected * progress * variance * 10) / 10,
        gameLabel: `${quarter} ${clock}`,
      };
    }
    if (p.gameState === "bye") {
      return { ...base, points: null, gameLabel: "BYE" };
    }
    return { ...base, points: null, gameLabel: kickoff ?? "Sun 1:00 PM" };
  });
}

const STARTER_SLOTS = new Set(["QB", "RB", "WR", "TE", "FLEX", "K", "D/ST"]);

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function getMockFantasy(teamName: string, now = new Date()): ConnectedPayload {
  const roster = buildRoster(now);
  const starters = roster.filter((p) => STARTER_SLOTS.has(p.slot));
  const points = round1(starters.reduce((sum, p) => sum + (p.points ?? 0), 0));
  const projected = round1(
    starters.reduce((sum, p) => {
      if (p.gameState === "final") return sum + (p.points ?? 0);
      if (p.gameState === "live") return sum + Math.max(p.points ?? 0, p.projected);
      return sum + p.projected;
    }, 0),
  );

  const oppProgress = liveProgress(now, 5);
  const oppPoints = round1(48 + oppProgress * 52);
  const oppProjected = round1(Math.max(oppPoints + 18, 118.6));

  const edge = projected - oppProjected;
  const winProbability = Math.min(0.97, Math.max(0.03, 0.5 + edge / 60));

  const headlines = MOCK_HEADLINES.map((h, i) => ({
    ...h,
    publishedAt: new Date(now.getTime() - (i * 47 + 12) * 60_000).toISOString(),
  }));

  return {
    status: "connected",
    source: "mock",
    league: { name: "Sunday Night Syndicate", season: now.getUTCFullYear(), week: 8, teamCount: 12 },
    team: {
      id: "t1",
      name: teamName,
      abbrev: abbreviate(teamName),
      manager: "Team Manager",
      record: { wins: 5, losses: 2, ties: 0 },
      standing: 2,
      points,
      projected,
    },
    matchup: {
      week: 8,
      opponent: {
        id: "t7",
        name: "Gridiron Ghosts",
        abbrev: "GG",
        manager: "Rival Manager",
        record: { wins: 4, losses: 3, ties: 0 },
        standing: 5,
        points: oppPoints,
        projected: oppProjected,
      },
      winProbability: Math.round(winProbability * 100) / 100,
    },
    roster,
    headlines,
    updatedAt: now.toISOString(),
    notice: null,
  };
}

export function getMockDisconnected(teamName: string, now = new Date()): DisconnectedPayload {
  return {
    status: "disconnected",
    source: "mock",
    teamName,
    reason: "No fantasy provider is connected. Link a league in Flaim to light up the board.",
    updatedAt: now.toISOString(),
  };
}

export function abbreviate(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (letters || name.slice(0, 3).toUpperCase()).slice(0, 4);
}
