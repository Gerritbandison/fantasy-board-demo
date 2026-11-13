import type { Metadata } from "next";
import Link from "next/link";
import { MovesFeed } from "@/components/league/MovesFeed";
import { Card, PageHeader } from "@/components/league/ui";
import { STANDINGS, TEAMS } from "@/lib/league";
import { transactionFeed } from "@/lib/transactions";

export const metadata: Metadata = {
  title: "Waivers & adds",
  description: "League-wide waivers, adds, and drops, newest first, filterable by team and transaction type.",
};

export default function MovesPage() {
  const feed = transactionFeed(TEAMS.flatMap((entry) => entry.moves.map((move) => ({ ...move, teamId: entry.id }))));
  const teams = STANDINGS.map((t) => ({ id: t.id, name: t.name, abbrev: t.abbrev, color: t.color }));

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
          Completed waiver claims, free-agent adds, and roster drops across all ten franchises, newest first.
        </p>
      </PageHeader>

      {feed.length === 0 ? (
        <Card title="Nothing posted">
          <p className="text-sm text-slate-600">No waivers or adds are in the file yet.</p>
        </Card>
      ) : (
        <MovesFeed moves={feed} teams={teams} />
      )}
    </>
  );
}
