import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, Pill, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { formatRecord, GAMES, LEAGUE, MATCHUPS, matchupPath, ordinal, team, teamPath, USER_TEAM, winnerSide } from "@/lib/league";
import { buildPreview } from "@/lib/preview";

export const metadata: Metadata = {
  title: "Scores",
  description: `All five week ${LEAGUE.week} matchups in the Chicken league with projections and previews, plus last week's finals.`,
};

export default function MatchupsPage() {
  const lastWeek = LEAGUE.week - 1;
  const finals = GAMES.filter((g) => g.week === lastWeek);

  return (
    <>
      <PageHeader eyebrow={`Week ${LEAGUE.week} scoreboard`} title="Scores">
        <p className="mt-2 text-[15px] text-slate-600">All {MATCHUPS.length} games this week. Tap one for the preview, tale of the tape, and lineups.</p>
      </PageHeader>

      <ul className="grid gap-5 lg:grid-cols-2">
        {MATCHUPS.map((m) => {
          const preview = buildPreview(m);
          const sides = [m.left, m.right];
          const mine = m.left.teamId === USER_TEAM.id;
          return (
            <Card key={m.slug} as="li" accent={mine ? USER_TEAM.color : undefined}>
              <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                <span className="tracking-wider uppercase">Week {m.week}</span>
                <span className="flex items-center gap-1.5">
                  {mine && <Pill tone="turf">Your game</Pill>}
                  <span>Projected</span>
                </span>
              </div>
              <div className="grid gap-3">
                {sides.map((s) => {
                  const t = team(s.teamId);
                  const fav = preview.favoriteId === t.id;
                  return (
                    <div key={t.id} className="flex items-center gap-3">
                      <TeamAvatar teamId={t.id} />
                      <div className="min-w-0 flex-1">
                        <Link href={teamPath(t.id)} className={cn("leading-tight font-semibold break-words hover:underline", fav ? "text-navy" : "text-slate-500")}>
                          {t.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {formatRecord(t)} · {ordinal(t.rank)} · {m.homeId === t.id ? "Home" : "Away"}
                        </p>
                      </div>
                      <span className={cn("font-display text-3xl font-bold tabular-nums", fav ? "text-turf" : "text-slate-400")}>
                        {s.projected != null ? s.projected.toFixed(1) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-slate-600">{preview.story.slice(0, 2).join(" ")}</p>
              <Link href={matchupPath(m)} className="mt-4 inline-flex h-10 items-center rounded-full bg-turf px-4 text-sm font-semibold text-white hover:bg-turf-dark">
                Preview & lineups →
              </Link>
            </Card>
          );
        })}
      </ul>

      <SectionHeading title={`Week ${lastWeek} finals`} />
      <Card bodyClassName="p-0 sm:p-0">
        <ul className="divide-y divide-line">
          {finals.map((g) => {
            const w = winnerSide(g);
            return (
              <li key={`${g.home.teamId}-${g.away.teamId}`} className="grid gap-1.5 px-4 py-3 sm:px-5">
                {[g.away, g.home].map((s) => (
                  <p key={s.teamId} className="flex items-center gap-2.5 text-sm">
                    <TeamAvatar teamId={s.teamId} size="sm" />
                    <Link href={teamPath(s.teamId)} className={cn("min-w-0 flex-1 truncate hover:underline", s === w ? "font-semibold text-navy" : "text-slate-500")}>
                      {team(s.teamId).name}
                    </Link>
                    <span className={cn("font-display text-lg font-bold tabular-nums", s === w ? "text-navy" : "text-slate-400")}>{s.score.toFixed(2)}</span>
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
