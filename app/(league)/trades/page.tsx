import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { GradeKey, TradeCard, TradeSuperlatives } from "@/components/league/trades";
import { PageHeader, SectionHeading } from "@/components/league/ui";
import { LEAGUE } from "@/lib/league";
import { COUNTS, TRADE_SEASON, TRADES, TRADES_LABEL, UNKNOWN_SEASONS } from "@/lib/trades";

export const metadata: Metadata = {
  title: "Trades",
  description: `Chicken league ${TRADE_SEASON} season trades: every accepted deal, graded, plus the league's trade superlatives.`,
};

export default function TradesPage() {
  const players = TRADES.reduce((sum, t) => sum + t.playersMoved, 0);
  const picks = TRADES.reduce((sum, t) => sum + t.picksMoved, 0);
  const firstUnknown = UNKNOWN_SEASONS[0];
  const lastUnknown = UNKNOWN_SEASONS[UNKNOWN_SEASONS.length - 1];

  return (
    <>
      <PageHeader eyebrow={TRADES_LABEL} title="Trade desk">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Every accepted trade from the {TRADE_SEASON} preseason through week {LEAGUE.week}, graded on what the new players have scored in starting lineups so far.
          {UNKNOWN_SEASONS.length > 0 &&
            ` ESPN only serves the current season's transactions, so trades from ${firstUnknown}–${lastUnknown} aren't on record here. That's missing data, not a quiet league.`}
        </p>
      </PageHeader>

      <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-4 text-white shadow-lg shadow-navy/15 sm:p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gold uppercase">
          <ArrowLeftRight className="size-3.5" /> {TRADES_LABEL}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {[
            { k: "Accepted trades", v: COUNTS.accepted },
            { k: "Players moved", v: players, sub: picks ? `+ ${picks} draft picks` : undefined },
            { k: "Offers sent", v: COUNTS.offers },
            { k: "Veto votes logged", v: COUNTS.vetoVotes },
          ].map((x) => (
            <div key={x.k} className="min-w-0">
              <dt className="text-[11px] font-semibold tracking-wider text-white/60 uppercase">{x.k}</dt>
              <dd className="font-display text-3xl leading-tight font-bold tabular-nums">{x.v}</dd>
              {x.sub && <dd className="text-xs text-white/60">{x.sub}</dd>}
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-snug text-white/60">
          Offers, declines and veto rows are shown as counts only; pending and declined offers stay private.
          {COUNTS.neverProcessed > 0 &&
            ` ${COUNTS.neverProcessed === 1 ? "One more deal was" : `${COUNTS.neverProcessed} more deals were`} accepted but never processed (likely vetoed); ESPN didn't record the teams or players.`}
        </p>
      </section>

      <SectionHeading title="Superlatives" />
      <TradeSuperlatives />

      <SectionHeading title="Accepted trades" action="Newest first" />
      <ul className="grid gap-4 lg:grid-cols-2">
        {TRADES.map((t) => (
          <TradeCard key={t.id} t={t} />
        ))}
      </ul>

      <GradeKey />
    </>
  );
}
