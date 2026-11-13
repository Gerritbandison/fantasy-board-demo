import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { AllTimeTradeSuperlatives, TradeSeasons, TradeSuperlatives, ValuesCredit, VerdictKey } from "@/components/league/trades";
import { PageHeader, SectionHeading } from "@/components/league/ui";
import {
  COMPLETED,
  COUNTS,
  CURRENT,
  FIRST_SEASON,
  POINTS_THROUGH,
  SEASONS_LABEL,
  TRADE_SEASON,
  TRADES,
  TRADES_BY_SEASON,
  UNKNOWN_SEASONS,
} from "@/lib/trades";

export const metadata: Metadata = {
  title: "Trades",
  description: `Chicken league trades, ${SEASONS_LABEL}: every player trade by season, ${TRADE_SEASON} judged on long-term value, earlier seasons on points, plus all-time trade superlatives.`,
};

export default function TradesPage() {
  const players = TRADES.reduce((sum, t) => sum + t.playersMoved, 0);
  const picks = TRADES.reduce((sum, t) => sum + t.picksMoved, 0);
  const firstUnknown = UNKNOWN_SEASONS[0];
  const lastUnknown = UNKNOWN_SEASONS[UNKNOWN_SEASONS.length - 1];
  const busiest = Math.max(...TRADES_BY_SEASON.map((s) => s.trades), 1);

  return (
    <>
      <PageHeader eyebrow={`Trades · ${SEASONS_LABEL}`} title="Trade desk">
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Every completed trade since {FIRST_SEASON}, newest first. Who won is the points the new players scored for their new team after the deal, started or benched. Inside 10 points is even. {POINTS_THROUGH}.
          {UNKNOWN_SEASONS.length > 0 && ` Trades from ${firstUnknown}–${lastUnknown} aren't on record.`}
        </p>
        <ValuesCredit className="mt-2" />
      </PageHeader>

      <section className="overflow-hidden rounded-2xl bg-navy yard-lines p-5 text-white shadow-[0_6px_20px_rgba(12,25,44,0.16)] ring-1 ring-navy-3 sm:p-6">
        <p className="flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.12em] text-gold uppercase">
          <ArrowLeftRight className="size-3.5" aria-hidden /> League trade ledger · {SEASONS_LABEL}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { k: "Player trades", v: TRADES.length, sub: COUNTS.pickSwaps ? `+ ${COUNTS.pickSwaps} draft-pick swaps` : undefined },
            { k: "Players moved", v: players, sub: picks ? `+ ${picks} draft picks` : undefined },
            { k: `Offers sent (${TRADE_SEASON})`, v: COUNTS.offers },
            { k: `Veto votes (${TRADE_SEASON})`, v: COUNTS.vetoVotes },
          ].map((x) => (
            <div key={x.k} className="min-w-0 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <dt className="text-[11px] font-bold tracking-[0.08em] text-white/75 uppercase">{x.k}</dt>
              <dd className="mt-0.5 font-display text-3xl leading-tight font-extrabold tabular-nums">{x.v}</dd>
              {x.sub && <dd className="mt-0.5 text-xs text-white/75">{x.sub}</dd>}
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
          <p className="mb-2 text-[11px] font-bold tracking-[0.08em] text-white/70 uppercase">Player trades by season</p>
          <ol className="grid grid-cols-7 items-end gap-2" aria-label="Player trades per season">
            {TRADES_BY_SEASON.map((s) => (
              <li key={s.season} className="flex min-w-0 flex-col items-center gap-1" aria-label={`${s.season}: ${s.trades} player trades`}>
                <span className="font-display text-sm font-bold text-white tabular-nums" aria-hidden>
                  {s.trades}
                </span>
                <span
                  className="w-full max-w-12 rounded-t-md bg-gold transition-[height]"
                  style={{ height: `${Math.max(5, (s.trades / busiest) * 54)}px` }}
                  aria-hidden
                />
                <span className="text-[11px] font-semibold text-white/75 tabular-nums" aria-hidden>
                  {s.season}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-white/75">
          Offers, declines, and veto rows are shown as counts only; pending and declined offers stay private.
          {COUNTS.neverProcessed > 0 &&
            ` ${COUNTS.neverProcessed === 1 ? "One more deal was" : `${COUNTS.neverProcessed} more deals were`} accepted but never processed (likely vetoed); ESPN didn't record the teams or players.`}
        </p>
      </section>

      <SectionHeading title="All-time" action={SEASONS_LABEL} />
      <AllTimeTradeSuperlatives />

      <SectionHeading title={`${TRADE_SEASON} superlatives`} action={`${CURRENT.length} player trades`} />
      <TradeSuperlatives />

      <SectionHeading title="Player trades" action="By season" />
      <TradeSeasons trades={COMPLETED} />

      <VerdictKey />
    </>
  );
}
