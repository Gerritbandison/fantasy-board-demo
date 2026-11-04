/** Roster moves the waiver wire can show. Trades stay on the trade desk. */
const FEED_TYPES = new Set(["waiver", "add", "drop"]);

export interface TransactionRow {
  teamId: number;
  date?: string;
  week?: number;
  type: string;
  added: string[];
  dropped: string[];
  faabBid?: number;
}

/**
 * League-wide waiver, add, and drop feed. Newest date first.
 * Same-day rows stay in team-id order so a refresh does not shuffle the list.
 */
export function transactionFeed(rows: TransactionRow[]): TransactionRow[] {
  return rows
    .filter((row) => FEED_TYPES.has(row.type.toLowerCase()))
    .map((row) => ({ ...row, type: row.type.toLowerCase() }))
    .sort((a, b) => {
      const byDate = (b.date ?? "").localeCompare(a.date ?? "");
      if (byDate !== 0) return byDate;
      const byWeek = (b.week ?? 0) - (a.week ?? 0);
      if (byWeek !== 0) return byWeek;
      return a.teamId - b.teamId;
    });
}
