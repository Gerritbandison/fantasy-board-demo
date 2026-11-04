"use client";

import { TradeCard } from "./trades";
import { TRADES } from "@/lib/trades";

/** One closed season, loaded only after its row is opened. */
export function ClosedTradeSeasons({ season, focus }: { season: number; focus?: number }) {
  const trades = TRADES.filter((trade) => trade.season === season && (focus == null || trade.sides.some((side) => side.teamId === focus)));
  return (
    <ul className="mt-3 mb-2 grid gap-4 lg:grid-cols-2">
      {trades.map((trade) => (
        <TradeCard key={trade.id} t={trade} focus={focus} />
      ))}
    </ul>
  );
}
