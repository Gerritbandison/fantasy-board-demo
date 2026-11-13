/** One saved board. Written under data/snapshots/<week>.json before the next refresh overwrites the live files. */
export interface SnapshotTeam {
  teamId: number;
  projectedRank: number;
  playoffOdds: number;
  powerRank: number;
}

export interface SnapshotGame {
  week: number;
  homeId: number;
  awayId: number;
  winnerId: number | null;
}

export interface SnapshotMove {
  teamId: number;
  date?: string;
  type: string;
  added: string[];
  dropped: string[];
}

export interface SnapshotFile {
  week: number;
  asOf: string;
  teams: SnapshotTeam[];
  results: SnapshotGame[];
  adds: SnapshotMove[];
}

export interface SnapshotCurrent {
  teams: SnapshotTeam[];
  results: SnapshotGame[];
  adds: SnapshotMove[];
}

export interface OddsMove {
  teamId: number;
  /** Current playoff odds minus the snapshot. Positive means the odds went up. */
  playoffOddsDelta: number;
  /** Snapshot power rank minus current power rank. Positive means the team climbed. */
  powerDelta: number;
  /** Snapshot projected rank minus current projected rank. Positive means a better (lower) rank. */
  projectedRankDelta: number;
}

export interface SnapshotDiff {
  available: boolean;
  week: number | null;
  asOf: string | null;
  odds: OddsMove[];
  /** Non-zero odds, power, or projected-rank moves. Largest power move first. */
  movers: OddsMove[];
  newResults: SnapshotGame[];
  /** Waiver and add rows on the current board that were not on the snapshot. */
  notableAdds: SnapshotMove[];
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

function gameKey(game: SnapshotGame) {
  return `${game.week}:${game.homeId}:${game.awayId}:${game.winnerId ?? ""}`;
}

function addKey(move: SnapshotMove) {
  return `${move.teamId}|${move.date ?? ""}|${move.type}|${move.added.join(",")}|${move.dropped.join(",")}`;
}

/** `7.json` → 7. Anything else is not a snapshot file. */
export function snapshotWeekFromName(name: string) {
  const match = /^(\d+)\.json$/.exec(name);
  if (!match) return null;
  return Number(match[1]);
}

/** Highest week number wins. `manifest.json` and other names are ignored. */
export function latestSnapshotName(names: string[]) {
  const ranked = names
    .map((name) => ({ name, week: snapshotWeekFromName(name) }))
    .filter((row): row is { name: string; week: number } => row.week != null)
    .sort((a, b) => b.week - a.week);
  return ranked[0]?.name ?? null;
}

/**
 * Snapshot to diff the live board against: prefers the newest snapshot before `currentWeek`
 * so a snapshot written at the end of `currentWeek`'s refresh does not diff the board against itself.
 * Falls back to `currentWeek`'s file only when no earlier week snapshot exists.
 */
export function priorSnapshotName(names: string[], currentWeek: number) {
  const ranked = names
    .map((name) => ({ name, week: snapshotWeekFromName(name) }))
    .filter((row): row is { name: string; week: number } => row.week != null)
    .sort((a, b) => b.week - a.week);
  const earlier = ranked.find((row) => row.week < currentWeek);
  return (earlier ?? ranked[0])?.name ?? null;
}

/**
 * Compare the live board with the newest snapshot.
 * No snapshot means no movement: nothing is treated as new.
 */
export function diffSnapshot(prior: SnapshotFile | null, current: SnapshotCurrent): SnapshotDiff {
  if (!prior) {
    return { available: false, week: null, asOf: null, odds: [], movers: [], newResults: [], notableAdds: [] };
  }

  const priorTeams = new Map(prior.teams.map((team) => [team.teamId, team]));
  const odds: OddsMove[] = current.teams.flatMap((team) => {
    const before = priorTeams.get(team.teamId);
    if (!before) return [];
    return [
      {
        teamId: team.teamId,
        playoffOddsDelta: round4(team.playoffOdds - before.playoffOdds),
        powerDelta: before.powerRank - team.powerRank,
        projectedRankDelta: before.projectedRank - team.projectedRank,
      },
    ];
  });

  const movers = odds
    .filter((row) => row.powerDelta !== 0 || row.playoffOddsDelta !== 0 || row.projectedRankDelta !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.powerDelta) - Math.abs(a.powerDelta) ||
        Math.abs(b.playoffOddsDelta) - Math.abs(a.playoffOddsDelta) ||
        Math.abs(b.projectedRankDelta) - Math.abs(a.projectedRankDelta) ||
        a.teamId - b.teamId,
    );

  const seenGames = new Set(prior.results.map(gameKey));
  const newResults = current.results
    .filter((game) => !seenGames.has(gameKey(game)))
    .sort((a, b) => b.week - a.week || a.homeId - b.homeId);

  const seenAdds = new Set(prior.adds.map(addKey));
  const notableAdds = current.adds.filter((move) => {
    const type = move.type.toLowerCase();
    if (type !== "waiver" && type !== "add") return false;
    return !seenAdds.has(addKey({ ...move, type }));
  });

  return { available: true, week: prior.week, asOf: prior.asOf, odds, movers, newResults, notableAdds };
}
