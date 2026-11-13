"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cx } from "@/lib/cx";
import type { TransactionRow } from "@/lib/transactions";

export interface MoveTeam {
  id: number;
  name: string;
  abbrev: string;
  color: string;
}

type TypeFilter = "all" | "waiver" | "add" | "drop";

function formatDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function moveBadge(type: string) {
  if (type === "waiver") return { label: "Waiver", cls: "bg-gold-light text-gold-ink ring-gold-border" };
  if (type === "add") return { label: "Add", cls: "bg-turf-light text-turf-dark ring-turf-border" };
  return { label: "Drop", cls: "bg-surface-muted text-slate-700 ring-line" };
}

export function MovesFeed({ moves, teams }: { moves: TransactionRow[]; teams: MoveTeam[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [teamFilter, setTeamFilter] = useState<number | "all">("all");
  const byId = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const filtered = useMemo(
    () =>
      moves.filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (teamFilter !== "all" && m.teamId !== teamFilter) return false;
        return true;
      }),
    [moves, teamFilter, typeFilter],
  );

  const counts = useMemo(
    () => ({
      all: moves.filter((m) => teamFilter === "all" || m.teamId === teamFilter).length,
      waiver: moves.filter((m) => m.type === "waiver" && (teamFilter === "all" || m.teamId === teamFilter)).length,
      add: moves.filter((m) => m.type === "add" && (teamFilter === "all" || m.teamId === teamFilter)).length,
      drop: moves.filter((m) => m.type === "drop" && (teamFilter === "all" || m.teamId === teamFilter)).length,
    }),
    [moves, teamFilter],
  );

  const hasFilters = typeFilter !== "all" || teamFilter !== "all";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(12,25,44,0.05)] ring-1 ring-line">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-surface-subtle/75 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by transaction type">
          {(
            [
              ["all", `All (${counts.all})`],
              ["waiver", `Waivers (${counts.waiver})`],
              ["add", `Adds (${counts.add})`],
              ["drop", `Drops (${counts.drop})`],
            ] as const
          ).map(([key, label]) => {
            const on = typeFilter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setTypeFilter(key)}
                className={cx(
                  "h-8 cursor-pointer rounded-lg px-2.5 text-xs font-semibold",
                  on ? "bg-navy text-white shadow-xs" : "bg-white text-slate-700 ring-1 ring-line hover:bg-surface-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="moves-team-filter" className="sr-only">
            Filter by team
          </label>
          <select
            id="moves-team-filter"
            value={teamFilter === "all" ? "all" : String(teamFilter)}
            onChange={(e) => setTeamFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-8 cursor-pointer rounded-lg bg-white px-2.5 text-xs font-semibold text-navy ring-1 ring-line hover:bg-surface-subtle"
          >
            <option value="all">All 10 teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("all");
                setTeamFilter("all");
              }}
              className="h-8 cursor-pointer rounded-lg bg-surface-muted px-2.5 text-xs font-semibold text-slate-700 hover:text-navy"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-slate-600 sm:px-5">
          No matching moves for this filter.
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((move, index) => {
            const badge = moveBadge(move.type);
            const t = byId.get(move.teamId);
            return (
              <li
                key={`${move.teamId}-${move.date ?? "nodate"}-${move.type}-${index}`}
                className="flex flex-col gap-2.5 px-4 py-3.5 transition-colors hover:bg-surface-subtle/60 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold tracking-wide text-white ring-1 ring-black/10 ring-inset"
                    style={{ background: t?.color ?? "#64748b" }}
                    aria-hidden
                  >
                    {t?.abbrev ?? "?"}
                  </span>
                  <div className="min-w-0">
                    <Link href={`/teams/${move.teamId}`} className="block leading-tight font-semibold break-words text-navy hover:underline">
                      {t?.name ?? `Team ${move.teamId}`}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <span className={cx("inline-flex h-5 items-center rounded-md px-1.5 text-[10px] font-bold uppercase ring-1 ring-inset", badge.cls)}>
                        {badge.label}
                      </span>
                      {move.faabBid != null && (
                        <span className="rounded bg-navy px-1.5 py-0.5 font-display text-xs font-bold text-white tabular-nums">
                          ${move.faabBid} FAAB
                        </span>
                      )}
                      <span>{[move.week != null ? `Week ${move.week}` : null, move.date ? formatDate(move.date) : null].filter(Boolean).join(" · ")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {move.added.map((name) => (
                    <span
                      key={`add-${name}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-turf-light/65 px-2.5 py-1 text-xs font-semibold text-navy ring-1 ring-turf-border ring-inset sm:text-sm"
                    >
                      <span className="font-bold text-turf-dark">+</span>
                      <span>{name}</span>
                    </span>
                  ))}
                  {move.dropped.map((name) => (
                    <span
                      key={`drop-${name}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-subtle px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-line ring-inset sm:text-sm"
                    >
                      <span className="font-bold text-loss">−</span>
                      <span>{name}</span>
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
