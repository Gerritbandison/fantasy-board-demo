import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, TeamAvatar } from "@/components/league/ui";
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

function moveLabel(type: string) {
  if (type === "waiver") return "Waiver";
  if (type === "drop") return "Drop";
  if (type === "add") return "Add";
  return type;
}

export default function MovesPage() {
  const feed = transactionFeed(TEAMS.flatMap((entry) => entry.moves.map((move) => ({ ...move, teamId: entry.id }))));

  return (
    <>
      <PageHeader eyebrow="League wire" title="Waivers & adds">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          Completed waivers, adds, and drops from every roster, newest first. Trades stay on the trade desk.
        </p>
      </PageHeader>

      {feed.length === 0 ? (
        <Card title="Nothing posted">
          <p className="text-sm text-slate-600">No waivers or adds are in the file yet.</p>
        </Card>
      ) : (
        <Card bodyClassName="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {feed.map((move, index) => (
              <li key={`${move.teamId}-${move.date ?? "nodate"}-${move.type}-${index}`} className="flex gap-3 px-4 py-3 sm:px-5">
                <TeamAvatar teamId={move.teamId} size="sm" className="mt-0.5" />
                <div className="min-w-0 text-sm leading-snug">
                  <p className="text-xs font-semibold text-slate-600">
                    {[move.week != null ? `Week ${move.week}` : null, move.date ? formatDate(move.date) : null, moveLabel(move.type)].filter(Boolean).join(" · ")}
                    {move.faabBid != null && ` · $${move.faabBid} FAAB`}
                  </p>
                  <Link href={teamPath(move.teamId)} className="font-semibold break-normal whitespace-normal text-navy hover:underline">
                    {team(move.teamId).name}
                  </Link>
                  {move.added.map((name) => (
                    <p key={`add-${name}`} className="text-slate-700">
                      <span className="font-bold text-turf">+ </span>
                      {name}
                    </p>
                  ))}
                  {move.dropped.map((name) => (
                    <p key={`drop-${name}`} className="text-slate-600">
                      <span className="font-bold text-loss">− </span>
                      {name}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
