"use client";

import { useState, type ComponentType } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClosedSeasonRow {
  season: number;
  count: number;
  netLabel: string | null;
  netClass: string;
}

type Loaded = ComponentType<{ season: number; focus?: number }>;

/** Earlier seasons stay out of the first HTML. Opening one loads that season's cards. */
export function ClosedSeasons({ seasons, focus }: { seasons: ClosedSeasonRow[]; focus?: number }) {
  const [View, setView] = useState<Loaded | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  async function toggle(season: number) {
    const next = open === season ? null : season;
    if (next != null && !View) {
      const mod = await import("./closed-trade-seasons");
      setView(() => mod.ClosedTradeSeasons);
    }
    setOpen(next);
  }

  return (
    <>
      {seasons.map((season) => {
        const shown = open === season.season;
        return (
          <details key={season.season} className="group" open={shown}>
            <summary
              onClick={(event) => {
                event.preventDefault();
                void toggle(season.season);
              }}
              className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(12,25,44,0.05)] ring-1 ring-line transition-colors hover:bg-surface-subtle hover:ring-line-strong [&::-webkit-details-marker]:hidden"
            >
              <span className="font-display text-lg leading-tight font-bold tracking-wide text-navy uppercase">{season.season} season</span>
              <span className="flex min-w-0 items-center gap-2.5 text-xs font-medium text-slate-600">
                <span className="text-right tabular-nums">
                  {season.count} player {season.count === 1 ? "trade" : "trades"}
                  {season.netLabel && (
                    <>
                      {" · "}
                      <span className={cn("font-bold", season.netClass)}>{season.netLabel}</span>
                    </>
                  )}
                </span>
                <ChevronDown className="size-4 shrink-0 text-slate-600 transition-transform group-open:rotate-180" aria-hidden />
              </span>
            </summary>
            {shown && View ? (
              <View season={season.season} focus={focus} />
            ) : shown ? (
              <p className="px-4 py-3 text-sm text-slate-600">Loading {season.season}…</p>
            ) : null}
          </details>
        );
      })}
    </>
  );
}
