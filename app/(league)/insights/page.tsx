import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Trophy, TrendingUp, Zap } from "lucide-react";
import { Chip, PageHeading, Panel } from "@/components/league/bits";
import { cn } from "@/lib/utils";
import { boardForTeam, formatRecord, getStandingByName, snapshot } from "@/lib/league";

export const metadata: Metadata = {
  title: "Insights",
  description: "Week 8 Chicken league pulse: storylines, power rankings, and scoring leaders.",
};

const ACCENTS = [
  "from-emerald-500/20 text-emerald-300 ring-emerald-400/30",
  "from-amber-500/20 text-amber-300 ring-amber-400/30",
  "from-sky-500/20 text-sky-300 ring-sky-400/30",
  "from-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-400/30",
  "from-rose-500/20 text-rose-300 ring-rose-400/30",
];

export default function InsightsPage() {
  const { insights, standings } = snapshot;
  const byPf = [...standings].sort((a, b) => b.pointsFor - a.pointsFor);
  const maxPf = byPf[0]?.pointsFor ?? 1;
  const minPf = byPf[byPf.length - 1]?.pointsFor ?? 0;
  const floor = Math.max(0, minPf - 100);
  const byDiff = [...standings].sort((a, b) => b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst));
  const maxAbsDiff = Math.max(...byDiff.map((s) => Math.abs(s.pointsFor - s.pointsAgainst)));

  return (
    <>
      <PageHeading eyebrow="League pulse" title={insights.headline} />

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 tv:gap-6">
        {insights.bullets.map((text, i) => (
          <li
            key={text}
            className={cn(
              "flex gap-3 rounded-2xl bg-gradient-to-br via-zinc-900/70 to-zinc-900/40 p-4 ring-1 tv:p-8",
              ACCENTS[i % ACCENTS.length],
            )}
          >
            <span className="font-display text-3xl leading-none font-extrabold tabular-nums tv:text-6xl">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-[15px] leading-snug text-zinc-100 tv:text-3xl">{text}</p>
          </li>
        ))}
      </ol>

      <Panel title="Power rankings" icon={<Trophy className="size-4 text-amber-300 tv:size-7" />} meta="Top 4">
        <ol className="grid gap-2.5 tv:gap-4">
          {insights.power.map((p, i) => {
            const s = getStandingByName(p.team);
            const board = s ? boardForTeam(s.teamId) : undefined;
            const name = board ? (
              <Link href={board.path} className="underline decoration-emerald-400/50 underline-offset-4">
                {p.team}
              </Link>
            ) : (
              p.team
            );
            return (
              <li key={p.team} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5 tv:gap-6 tv:p-6">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-extrabold ring-1 tv:size-20 tv:text-5xl",
                    i === 0 ? "bg-amber-400/15 text-amber-300 ring-amber-400/40" : "bg-white/5 text-zinc-300 ring-white/10",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl leading-tight font-bold uppercase tracking-wide text-white tv:text-4xl">{name}</p>
                  <p className="mt-0.5 text-sm text-zinc-400 tv:text-2xl">{p.why}</p>
                  {s && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Chip className="text-emerald-300 ring-emerald-400/30">{formatRecord(s)}</Chip>
                      <Chip>PF {s.pointsFor.toFixed(1)}</Chip>
                      <Chip>Seed {s.playoffSeed}</Chip>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5 tv:gap-8">
        <Panel title="Scoring leaders" icon={<Flame className="size-4 text-orange-400 tv:size-7" />} meta="Points for">
          <ol className="grid gap-2 tv:gap-4">
            {byPf.map((s, i) => (
              <li key={s.teamId}>
                <div className="flex items-baseline justify-between gap-2 text-sm tv:text-2xl">
                  <span className="min-w-0 truncate text-zinc-200">
                    <span className="mr-2 font-display font-bold text-zinc-500">{i + 1}</span>
                    {s.teamName}
                  </span>
                  <span className="shrink-0 font-display text-base font-bold tabular-nums text-white tv:text-3xl">
                    {s.pointsFor.toFixed(1)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800 tv:h-3" aria-hidden>
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      i === 0 ? "from-orange-500 to-amber-300" : "from-emerald-600 to-emerald-400",
                    )}
                    style={{ width: `${((s.pointsFor - floor) / (maxPf - floor)) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Point differential" icon={<TrendingUp className="size-4 text-sky-400 tv:size-7" />} meta="PF − PA">
          <ol className="grid gap-2 tv:gap-4">
            {byDiff.map((s) => {
              const diff = s.pointsFor - s.pointsAgainst;
              const pct = (Math.abs(diff) / maxAbsDiff) * 50;
              return (
                <li key={s.teamId} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_3.5rem] items-center gap-2 text-sm tv:text-2xl">
                  <span className="truncate text-zinc-200">{s.teamName}</span>
                  <span className="relative h-2.5 rounded-full bg-zinc-800 tv:h-4" aria-hidden>
                    <span className="absolute inset-y-0 left-1/2 w-px bg-zinc-600" />
                    <span
                      className={cn("absolute inset-y-0 rounded-full", diff >= 0 ? "left-1/2 bg-emerald-400" : "right-1/2 bg-rose-400")}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className={cn("text-right font-display font-bold tabular-nums", diff >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <p className="flex items-center gap-2 text-xs text-zinc-500 tv:text-xl">
        <Zap className="size-3.5" /> {snapshot.displayNote}
      </p>
    </>
  );
}
