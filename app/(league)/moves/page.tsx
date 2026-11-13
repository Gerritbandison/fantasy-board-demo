import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, Pill, TeamAvatar } from "@/components/league/ui";
import { TEAMS, team, teamPath } from "@/lib/league";
import { transactionFeed } from "@/lib/transactions";

export const metadata: Metadata = {
  title: "Waivers & adds",
  description: "League-wide waivers, adds, and drops, newest first.",
};

function formatDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function moveBadge(type: string): { label: string; tone: "gold" | "turf" | "slate" } {
  if (type === "waiver") return { label: "Waiver", tone: "gold" };
  if (type === "add") return { label: "Add", tone: "turf" };
  if (type === "drop") return { label: "Drop", tone: "slate" };
  return { label: type, tone: "slate" };
}

export default function MovesPage() {
  const feed = transactionFeed(TEAMS.flatMap((entry) => entry.moves.map((move) => ({ ...move, teamId: entry.id }))));

  return (
    <>
      <PageHeader
        eyebrow="League wire"
        title="Waivers & adds"
        action={
          <Link
            href="/trades"
            className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-xs font-bold tracking-wide text-navy uppercase ring-1 ring-line transition-colors hover:bg-surface-subtle"
          >
            Trade desk →
          </Link>
        }
      >
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Completed waiver claims, free-agent adds, and roster drops across all ten teams, newest first. Player trades live on the trade desk.
        </p>
      </PageHeader>

      {feed.length === 0 ? (
        <Card title="Nothing posted">
          <p className="text-sm text-slate-600">No waivers or adds are in the file yet.</p>
        </Card>
      ) : (
        <Card title="Transaction log" action={`${feed.length} moves`} bodyClassName="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {feed.map((move, index) => {
              const badge = moveBadge(move.type);
              return (
                <li
                  key={`${move.teamId}-${move.date ?? "nodate"}-${move.type}-${index}`}
                  className="flex flex-col gap-2.5 px-4 py-3.5 transition-colors hover:bg-surface-subtle/60 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TeamAvatar teamId={move.teamId} size="sm" />
                    <div className="min-w-0">
                      <Link href={teamPath(move.teamId)} className="block leading-tight font-semibold break-words text-navy hover:underline">
                        {team(move.teamId).name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                        <Pill tone={badge.tone} className="h-5 px-1.5 text-[10px] font-bold uppercase">
                          {badge.label}
                        </Pill>
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
        </Card>
      )}
    </>
  );
}
