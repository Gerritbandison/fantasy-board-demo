import type { Metadata } from "next";
import Link from "next/link";
import { ScoreReadout, StateBadge } from "@/components/league/bits";
import { PlayoffSeriesNote } from "@/components/league/playoff-h2h";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { SinceUpdate } from "@/components/league/ScoreStrips";
import { Card, PageHeader, Pill, ResultChip, SectionHeading, TeamAvatar } from "@/components/league/ui";
import { RoastCopy, roastPulledLabel } from "@/components/league/WeekRoasts";
import { cn } from "@/lib/utils";
import { scoreEmphasis } from "@/lib/score-display";
import { WEEK_ROASTS } from "@/lib/roasts";
import {
  CURRENT_WEEK_POSTED,
  formatRecord,
  GAMES,
  LEAGUE,
  MATCHUPS,
  matchupPath,
  ordinal,
  team,
  teamPath,
  UPCOMING,
  UPCOMING_WEEK,
  USER_TEAM,
  winnerSide,
  type Matchup,
  type MatchupSide,
} from "@/lib/league";
import { buildPreview } from "@/lib/preview";

function signed(n: number) {
  const text = Math.abs(n).toFixed(2);
  if (n > 0) return `+${text}`;
  if (n < 0) return `−${text}`;
  return text;
}

function roastFor(m: Matchup) {
  return WEEK_ROASTS?.matchups.find(
    (row) =>
      (row.home.teamId === m.homeId && row.away.teamId === m.awayId) ||
      (row.home.teamId === m.awayId && row.away.teamId === m.homeId),
  );
}

export const metadata: Metadata = {
  title: "Scores",
  description: `All five week ${LEAGUE.week} matchups in the Chicken league, with live scores, projections, roast cards, and last week's finals.`,
};

function otherSide(m: Matchup, side: MatchupSide) {
  return side.teamId === m.left.teamId ? m.right : m.left;
}

function GameList({ games, linked }: { games: Matchup[]; linked: boolean }) {
  return (
    <ul className="grid gap-5 lg:grid-cols-2">
      {games.map((m) => {
        const preview = linked ? buildPreview(m) : null;
        const roast = linked ? roastFor(m) : undefined;
        const sides = [m.left, m.right];
        const mine = sides.some((s) => s.teamId === USER_TEAM.id);
        const lPts = m.left.points ?? 0;
        const rPts = m.right.points ?? 0;
        const liveSum = lPts + rPts;
        const showLiveBar = m.state !== "projected" && liveSum > 0;

        return (
          <Card key={`${m.week}-${m.slug}`} as="li" accent={mine ? USER_TEAM.color : undefined} bodyClassName="flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <span className="font-display tracking-[0.1em] text-slate-600 uppercase">Week {m.week}</span>
              <span className="flex items-center gap-1.5">
                {mine && <Pill tone="turf">Your game</Pill>}
                {(linked || m.state !== "projected") && <StateBadge state={m.state} />}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl bg-surface-subtle ring-1 ring-line/90">
              <div className="divide-y divide-line/80">
                {sides.map((s) => {
                  const t = team(s.teamId);
                  const other = otherSide(m, s);
                  const emphasis = scoreEmphasis(m.state, s.points ?? null, s.projected ?? null, other.points ?? null, other.projected ?? null);
                  const finalDelta = m.state === "final" && s.points != null && s.projected != null ? s.points - s.projected : null;
                  const role =
                    emphasis === "ahead" && m.state === "final"
                      ? "Winner"
                      : emphasis === "ahead"
                        ? "Ahead"
                        : emphasis === "favorite"
                          ? "Favored"
                          : null;

                  return (
                    <div
                      key={t.id}
                      className={cn("flex items-center gap-3 px-3.5 py-3", emphasis === "ahead" && "bg-white/70")}
                    >
                      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: t.color }} aria-hidden />
                      <TeamAvatar teamId={t.id} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={teamPath(t.id)}
                          className={cn(
                            "block leading-tight font-semibold break-words hover:underline",
                            emphasis === "plain" ? "text-slate-700" : "text-navy",
                          )}
                        >
                          {t.name}
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600">
                          <span>
                            {formatRecord(t)} · {ordinal(t.rank)} · {m.homeId === t.id ? "Home" : "Away"}
                          </span>
                          {role && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide uppercase",
                                emphasis === "ahead" ? "bg-turf-light text-turf-dark" : "bg-surface-muted text-slate-700",
                              )}
                            >
                              {role}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "font-display text-3xl leading-none font-extrabold tabular-nums",
                            emphasis === "ahead" ? "text-turf-dark" : emphasis === "favorite" ? "text-navy" : "text-slate-600",
                          )}
                        >
                          {role && <span className="sr-only">{role}, </span>}
                          <ScoreReadout side={s} state={m.state} bracketClassName="text-slate-500" />
                        </p>
                        {finalDelta != null && (
                          <p className={cn("mt-1 text-xs font-semibold tabular-nums", finalDelta >= 0 ? "text-turf" : "text-loss")}>
                            {signed(finalDelta)} <span className="font-medium text-slate-500">vs proj</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showLiveBar && (
                <div className="flex h-1.5 bg-surface-muted" aria-hidden>
                  <span style={{ width: `${(lPts / liveSum) * 100}%`, background: team(m.left.teamId).color }} />
                  <span className="w-0.5 bg-white" />
                  <span className="flex-1" style={{ background: team(m.right.teamId).color }} />
                </div>
              )}
            </div>

            <PlayoffSeriesNote leftId={m.left.teamId} rightId={m.right.teamId} className="mt-3" />

            {roast ? (
              <RoastCopy roast={roast} />
            ) : preview ? (
              <p className="mt-3.5 border-t border-line pt-3.5 text-sm leading-relaxed text-slate-600">{preview.story[0]}</p>
            ) : null}

            {linked && (
              <div className="mt-auto pt-4">
                <Link
                  href={matchupPath(m)}
                  className="group flex h-10 w-full items-center justify-between rounded-xl bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-2"
                >
                  <span>Preview &amp; lineups</span>
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>
              </div>
            )}
          </Card>
        );
      })}
    </ul>
  );
}

export default function MatchupsPage() {
  const lastWeek = LEAGUE.week - 1;
  const finals = GAMES.filter((g) => g.week === lastWeek);
  const live = MATCHUPS.some((m) => m.state === "live");
  const final = MATCHUPS.length > 0 && MATCHUPS.every((m) => m.state === "final");
  const pulled = roastPulledLabel();

  return (
    <>
      <PageHeader
        eyebrow={`Week ${LEAGUE.week} scoreboard`}
        title="Scores"
        action={
          <Link
            href="/share"
            className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-xs font-bold tracking-wide text-navy uppercase ring-1 ring-line transition-colors hover:bg-surface-subtle"
          >
            Share card →
          </Link>
        }
      >
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          {!CURRENT_WEEK_POSTED
            ? `Week ${LEAGUE.week} is not on the schedule yet.`
            : final
              ? `Week ${LEAGUE.week} is final. Highlighted scores mark each winner, with actual minus projected shown underneath.`
              : live
                ? `All ${MATCHUPS.length} games are underway. Green marks the current leader; bracketed numbers show projected finals while still above live points.`
                : `All ${MATCHUPS.length} games on the slate. Open any matchup for the preview, series history, and starting lineups.`}
        </p>

        {(pulled || LEAGUE.provisionalLabel) && CURRENT_WEEK_POSTED && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ProvisionalNote />
            {pulled && (
              <span className="text-xs font-medium text-slate-600">
                Roast copy pulled {pulled}.
              </span>
            )}
          </div>
        )}
      </PageHeader>

      {CURRENT_WEEK_POSTED && MATCHUPS.length > 0 ? (
        <GameList games={MATCHUPS} linked />
      ) : (
        <Card title={`Week ${LEAGUE.week}`}>
          <p className="text-sm leading-snug text-slate-600">
            Week {LEAGUE.week} scores are not in the file yet. The board stays empty until schedule.week{LEAGUE.week} is posted.
          </p>
        </Card>
      )}

      <SinceUpdate />

      {UPCOMING.length > 0 && (
        <>
          <SectionHeading title={`Week ${UPCOMING_WEEK} pairings`} action="Projected" />
          <GameList games={UPCOMING} linked={false} />
        </>
      )}

      {finals.length > 0 && (
        <>
          <SectionHeading title={`Week ${lastWeek} finals`} action={`${finals.length} games`} />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {finals.map((g) => {
              const w = winnerSide(g);
              return (
                <Card key={`${g.home.teamId}-${g.away.teamId}`} as="li" bodyClassName="p-3.5 sm:p-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <span>Week {lastWeek} final</span>
                    <span className="text-turf-dark tabular-nums">+{g.margin.toFixed(2)}</span>
                  </div>
                  <div className="grid gap-2">
                    {[g.away, g.home].map((s) => {
                      const won = s === w;
                      return (
                        <div key={s.teamId} className="flex items-center gap-2.5 text-sm">
                          <TeamAvatar teamId={s.teamId} size="xs" />
                          <Link
                            href={teamPath(s.teamId)}
                            className={cn("min-w-0 flex-1 truncate hover:underline", won ? "font-semibold text-navy" : "text-slate-600")}
                          >
                            {team(s.teamId).name}
                          </Link>
                          {won && <ResultChip result="W" className="size-4 text-[10px]" />}
                          <span className={cn("font-display text-lg font-bold tabular-nums", won ? "text-navy" : "text-slate-500")}>
                            {s.score.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
