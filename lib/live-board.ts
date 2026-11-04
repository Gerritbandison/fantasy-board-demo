import { GAMES, TEAMS } from "./league.ts";
import { PROJECTED_STANDINGS } from "./projected-standings.ts";
import type { SnapshotCurrent } from "./snapshot.ts";
import { powerRankings } from "./stats.ts";
import { transactionFeed } from "./transactions.ts";

/** The board a snapshot is diffed against. Every number is already on the live data files. */
export function liveBoard(): SnapshotCurrent {
  const power = new Map(powerRankings().map((row) => [row.team.id, row.rank]));
  return {
    teams: PROJECTED_STANDINGS.map((row) => ({
      teamId: row.teamId,
      projectedRank: row.rank,
      playoffOdds: row.playoffOdds,
      powerRank: power.get(row.teamId) ?? row.rank,
    })),
    results: GAMES.flatMap((game) =>
      game.winnerId == null
        ? []
        : [{ week: game.week, homeId: game.home.teamId, awayId: game.away.teamId, winnerId: game.winnerId }],
    ),
    adds: transactionFeed(TEAMS.flatMap((entry) => entry.moves.map((move) => ({ ...move, teamId: entry.id })))).map((move) => ({
      teamId: move.teamId,
      date: move.date,
      type: move.type,
      added: move.added,
      dropped: move.dropped,
    })),
  };
}
