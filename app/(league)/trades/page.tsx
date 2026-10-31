import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { AllTimeTradeSuperlatives, TradeSeasons, TradeSuperlatives, ValuesCredit, VerdictKey } from "@/components/league/trades";
import { PageHeader, SectionHeading } from "@/components/league/ui";
import { LEAGUE } from "@/lib/league";
import { COUNTS, CURRENT, FIRST_SEASON, SEASONS_LABEL, TRADE_SEASON, TRADES, TRADES_BY_SEASON, UNKNOWN_SEASONS } from "@/lib/trades";

export const metadata: Metadata = {
  title: "Trades",
  description: `Chicken league trades, ${SEASONS_LABEL}: every player trade by season, ${TRADE_SEASON} judged on long-term value, earlier seasons on points, plus all-time trade superlatives.`,
};

export default function TradesPage() {
  const players = TRADES.reduce((sum, t) => sum + t.playersMoved, 0);
  const picks = TRADES.reduce((sum, t) => sum + t.picksMoved, 0);
  const firstUnknown = UNKNOWN_SEASONS[0];
  const lastUnknown = UNKNOWN_SEASONS[UNKNOWN_SEASONS.length - 1];
  const busiest = Math.max(...TRADES_BY_SEASON.map((s) => s.trades));

  return (
    <>
      <PageHeader eyebrow={`Trades, ${SEASONS_LABEL}`} title="Trade desk">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Every player trade since {FIRST_SEASON}, newest season first. {TRADE_SEASON} deals through week {LEAGUE.week} are judged on long-term value: is each side paying off,
          even or backfiring. Earlier deals are called on points. Points count every point the new players scored for their new teams, started or benched.
          {UNKNOWN_SEASONS.length > 0 && ` Trades from ${firstUnknown}–${lastUnknown} aren't on record.`}
        </p>
        <ValuesCredit className="mt-2" />
      </PageHeader>

      <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-4 text-white shadow-lg shadow-navy/15 sm:p-5">
        <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-gold uppercase">
          <ArrowLeftRight className="size-3.5" /> Trades, {SEASONS_LABEL}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {[
            { k: "Player trades", v: TRADES.length, sub: COUNTS.pickSwaps ? `+ ${COUNTS.pickSwaps} draft-pick-only swaps in ${TRADE_SEASON}, not listed` : undefined },
            { k: "Players moved", v: players, sub: picks ? `+ ${picks} draft picks` : undefined },
            { k: `Offers sent, ${TRADE_SEASON}`, v: COUNTS.offers },
            { k: `Veto votes, ${TRADE_SEASON}`, v: COUNTS.vetoVotes },
          ].map((x) => (
            <div key={x.k} className="min-w-0">
              <dt className="text-xs font-semibold tracking-wider text-white/85 uppercase">{x.k}</dt>
              <dd className="font-display text-3xl leading-tight font-bold tabular-nums">{x.v}</dd>
              {x.sub && <dd className="text-xs text-white/85">{x.sub}</dd>}
            </div>
          ))}
        </dl>
        <ol className="mt-4 grid grid-cols-7 items-end gap-1.5" aria-label="Player trades per season">
          {TRADES_BY_SEASON.map((s) => (
            <li key={s.season} className="flex min-w-0 flex-col items-center gap-1" aria-label={`${s.season}: ${s.trades} player trades`}>
              <span className="text-xs font-semibold tabular-nums" aria-hidden>
                {s.trades}
              </span>
              <span className="w-full rounded-t bg-gold/80" style={{ height: `${Math.max(4, (s.trades / busiest) * 48)}px` }} aria-hidden />
              <span className="text-xs text-white/85 tabular-nums" aria-hidden>
                {s.season}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs leading-snug text-white/85">
          Offers, declines and veto rows are shown as counts only; pending and declined offers stay private.
          {COUNTS.neverProcessed > 0 &&
            ` ${COUNTS.neverProcessed === 1 ? "One more deal was" : `${COUNTS.neverProcessed} more deals were`} accepted but never processed (likely vetoed); ESPN didn't record the teams or players.`}
        </p>
      </section>

      <SectionHeading title="All-time" action={SEASONS_LABEL} />
      <AllTimeTradeSuperlatives />

      <SectionHeading title={`${TRADE_SEASON} superlatives`} action={`${CURRENT.length} player trades`} />
      <TradeSuperlatives />

      <SectionHeading title="Player trades" action="By season" />
      <TradeSeasons trades={TRADES} />

      <VerdictKey />
    </>
  );
}
