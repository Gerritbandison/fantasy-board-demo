"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cx } from "@/lib/cx";

export interface StandingsRowData {
  id: number;
  name: string;
  abbrev: string;
  color: string;
  owner?: string;
  isUser: boolean;
  rank: number;
  record: string;
  wins: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
  pfRank: number;
  allPlayRecord: string;
  allPlayPct: number;
  luckLabel: "lucky" | "even" | "unlucky";
  luckText: string;
  luckDelta: number;
}

type SortKey = "rank" | "pf" | "pa" | "diff" | "allPlay" | "luck";

const SORTS: { key: SortKey; label: string; defaultDir: "asc" | "desc" }[] = [
  { key: "rank", label: "Standings", defaultDir: "asc" },
  { key: "pf", label: "Points for", defaultDir: "desc" },
  { key: "diff", label: "Point diff", defaultDir: "desc" },
  { key: "allPlay", label: "All-play", defaultDir: "desc" },
  { key: "pa", label: "Points against", defaultDir: "desc" },
  { key: "luck", label: "Luck", defaultDir: "desc" },
];

const LUCK_TONES: Record<StandingsRowData["luckLabel"], string> = {
  lucky: "bg-gold-light text-gold-ink ring-gold-border",
  even: "bg-surface-muted text-slate-700 ring-line",
  unlucky: "bg-sky-50 text-sky-800 ring-sky-200",
};

function LuckPill({ row, compact }: { row: StandingsRowData; compact?: boolean }) {
  const delta = row.luckDelta > 0 ? `+${row.luckDelta}` : `−${Math.abs(row.luckDelta)}`;
  return (
    <span
      title={`Points-for rank ${row.pfRank}, standings rank ${row.rank}`}
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        LUCK_TONES[row.luckLabel],
      )}
    >
      <span className={cx(compact && row.luckDelta !== 0 && "max-sm:hidden")}>{row.luckText}</span>
      {row.luckDelta !== 0 && <span className="font-bold tabular-nums">{delta}</span>}
      {!compact && <span className="font-medium opacity-85">· PF #{row.pfRank}</span>}
    </span>
  );
}

export function StandingsTable({
  rows,
  caption,
}: {
  rows: StandingsRowData[];
  caption: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const maxPf = useMemo(() => Math.max(...rows.map((r) => r.pointsFor), 1), [rows]);

  function toggleSort(next: SortKey) {
    if (next === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(next);
      setDir(SORTS.find((s) => s.key === next)?.defaultDir ?? "desc");
    }
  }

  const sorted = useMemo(() => {
    const mult = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "rank") cmp = a.rank - b.rank;
      else if (sortKey === "pf") cmp = a.pointsFor - b.pointsFor;
      else if (sortKey === "pa") cmp = a.pointsAgainst - b.pointsAgainst;
      else if (sortKey === "diff") cmp = a.diff - b.diff;
      else if (sortKey === "allPlay") cmp = a.allPlayPct - b.allPlayPct || a.pointsFor - b.pointsFor;
      else if (sortKey === "luck") cmp = a.luckDelta - b.luckDelta || a.rank - b.rank;
      return cmp * mult || a.rank - b.rank;
    });
  }, [dir, rows, sortKey]);

  const ariaSort = (key: SortKey) => (sortKey !== key ? "none" : dir === "asc" ? "ascending" : "descending");
  const arrow = (key: SortKey) => (sortKey !== key ? "" : dir === "asc" ? " ↑" : " ↓");

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/80 bg-surface-subtle/75 px-4 py-2.5 sm:px-5">
        <span className="font-display text-xs font-bold tracking-[0.1em] text-slate-600 uppercase">Sort by</span>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Sort standings">
          {SORTS.map((s) => {
            const on = sortKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSort(s.key)}
                className={cx(
                  "h-7 cursor-pointer rounded-md px-2.5 text-xs font-semibold",
                  on ? "bg-navy text-white shadow-xs" : "bg-white text-slate-700 ring-1 ring-line hover:bg-surface-muted",
                )}
              >
                {s.label}
                {arrow(s.key)}
              </button>
            );
          })}
        </div>
      </div>

      <ol className="divide-y divide-line sm:hidden" aria-label={caption}>
        {sorted.map((t) => (
          <li key={t.id} className={cx("flex items-start gap-3 px-4 py-3.5", t.isUser && "bg-turf-light/35")}>
            <span
              className={cx(
                "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold tabular-nums ring-1 ring-inset",
                t.rank === 1 ? "bg-gold-light text-gold-ink ring-gold-border" : "bg-surface-muted text-slate-700 ring-line",
              )}
            >
              {t.rank}
            </span>
            <span
              className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold tracking-wide text-white ring-1 ring-black/10 ring-inset"
              style={{ background: t.color }}
              aria-hidden
            >
              {t.abbrev}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/teams/${t.id}`} className="block leading-tight font-semibold break-words text-navy hover:underline">
                {t.name}
              </Link>
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                <span className="font-semibold text-navy">{t.pointsFor.toFixed(1)} PF</span>
                <span> · {t.pointsAgainst.toFixed(1)} PA</span>
                <span className={cx("font-semibold", t.diff >= 0 ? "text-turf" : "text-loss")}>
                  {" "}
                  · {t.diff >= 0 ? "+" : "−"}
                  {Math.abs(t.diff).toFixed(1)}
                </span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <LuckPill row={t} />
                <span className="text-xs text-slate-500 tabular-nums">All-play {t.allPlayRecord}</span>
              </div>
            </div>
            <span className="rounded-lg bg-surface-subtle px-2.5 py-1 font-display text-xl font-extrabold text-navy tabular-nums ring-1 ring-line">
              {t.record}
            </span>
          </li>
        ))}
      </ol>

      <table className="hidden w-full table-fixed border-collapse text-left sm:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-surface-subtle text-[11px] font-bold tracking-wider text-slate-600 uppercase">
            <th scope="col" aria-sort={ariaSort("rank")} className="w-12 py-3 pl-4 sm:pl-5">
              <button type="button" onClick={() => toggleSort("rank")} className="cursor-pointer uppercase hover:text-navy">
                #{arrow("rank")}
              </button>
            </th>
            <th scope="col" className="py-3">
              Team
            </th>
            <th scope="col" className="w-16 py-3 text-right">
              W-L
            </th>
            <th scope="col" aria-sort={ariaSort("pf")} className="w-28 py-3 text-right lg:w-36">
              <button type="button" onClick={() => toggleSort("pf")} className="cursor-pointer uppercase hover:text-navy">
                PF{arrow("pf")}
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort("pa")} className="w-20 py-3 text-right">
              <button type="button" onClick={() => toggleSort("pa")} className="cursor-pointer uppercase hover:text-navy">
                PA{arrow("pa")}
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort("diff")} className="hidden w-20 py-3 text-right md:table-cell">
              <button type="button" onClick={() => toggleSort("diff")} className="cursor-pointer uppercase hover:text-navy">
                Diff{arrow("diff")}
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort("allPlay")} className="hidden w-22 py-3 text-right md:table-cell">
              <button type="button" onClick={() => toggleSort("allPlay")} className="cursor-pointer uppercase hover:text-navy">
                All-play{arrow("allPlay")}
              </button>
            </th>
            <th scope="col" aria-sort={ariaSort("luck")} className="w-24 py-3 pr-4 text-right sm:w-28 sm:pr-5">
              <button type="button" onClick={() => toggleSort("luck")} className="cursor-pointer uppercase hover:text-navy">
                Luck{arrow("luck")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((t) => (
            <tr
              key={t.id}
              className={cx(
                "transition-colors hover:bg-surface-subtle/65",
                t.isUser && "bg-turf-light/35 hover:bg-turf-light/50",
              )}
            >
              <td className="py-3 pl-4 align-middle sm:pl-5">
                <span
                  className={cx(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold tabular-nums ring-1 ring-inset",
                    t.rank === 1 ? "bg-gold-light text-gold-ink ring-gold-border" : "bg-surface-muted text-slate-700 ring-line",
                  )}
                >
                  {t.rank}
                </span>
              </td>
              <td className="py-3 pr-2 align-middle">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold tracking-wide text-white ring-1 ring-black/10 ring-inset"
                    style={{ background: t.color }}
                    aria-hidden
                  >
                    {t.abbrev}
                  </span>
                  <span className="min-w-0">
                    <Link href={`/teams/${t.id}`} className="block leading-tight font-semibold break-normal whitespace-normal text-navy hover:underline">
                      {t.name}
                    </Link>
                    {t.owner && <span className="hidden text-xs text-slate-500 md:block">{t.owner}</span>}
                    <span className={cx("text-xs font-medium md:hidden", t.diff >= 0 ? "text-turf" : "text-loss")}>
                      {t.diff >= 0 ? "+" : "−"}
                      {Math.abs(t.diff).toFixed(1)} diff
                    </span>
                  </span>
                </span>
              </td>
              <td className="py-3 text-right align-middle font-display text-xl font-extrabold text-navy tabular-nums">{t.record}</td>
              <td className="py-3 text-right align-middle">
                <div className="inline-flex flex-col items-end">
                  <span className="font-semibold text-navy tabular-nums">{t.pointsFor.toFixed(1)}</span>
                  <span className="mt-1 hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted lg:block" aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${(t.pointsFor / maxPf) * 100}%`, background: t.color }} />
                  </span>
                </div>
              </td>
              <td className="py-3 text-right align-middle text-slate-600 tabular-nums">{t.pointsAgainst.toFixed(1)}</td>
              <td className={cx("hidden py-3 text-right align-middle font-semibold tabular-nums md:table-cell", t.diff >= 0 ? "text-turf" : "text-loss")}>
                {t.diff >= 0 ? "+" : "−"}
                {Math.abs(t.diff).toFixed(1)}
              </td>
              <td className="hidden py-3 text-right align-middle font-medium text-slate-600 tabular-nums md:table-cell">{t.allPlayRecord}</td>
              <td className="py-3 pr-4 text-right align-middle sm:pr-5">
                <LuckPill row={t} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
