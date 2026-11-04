import type { Metadata } from "next";
import Link from "next/link";
import { ScoreReadout } from "@/components/league/bits";
import { SinceUpdate } from "@/components/league/ScoreStrips";
import { Card, PageHeader, Pill, SectionHeading, TeamAvatar } from "@/components/league/ui";
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

function stateLabel(state: Matchup["state"]) {
  if (state === "final") return "Final";
  if (state === "live") return "In progress";
  return "Projected";
}

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
        return (
          <Card key={`${m.week}-${m.slug}`} as="li" accent={mine ? USER_TEAM.color : undefined}>
            <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <span className="tracking-wider uppercase">Week {m.week}</span>
              <span className="flex items-center gap-1.5">
                {mine && <Pill tone="turf">Your game</Pill>}
                <span>{stateLabel(m.state)}</span>
              </span>
            </div>
            <div className="grid gap-3">
              {sides.map((s) => {
                const t = team(s.teamId);
                const other = otherSide(m, s);
                const emphasis = scoreEmphasis(m.state, s.points ?? null, s.projected ?? null, other.points ?? null, other.projected ?? null);
                const delta = m.state !== "projected" && s.points != null && s.projected != null ? s.points - s.projected : null;
                const role = emphasis === "ahead" && m.state === "final" ? "Winner" : emphasis === "ahead" ? "Ahead" : emphasis === "favorite" ? "Favored" : null;
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <TeamAvatar teamId={t.id} />
                    <div className="min-w-0 flex-1">
                      <Link href={teamPath(t.id)} className={cn("leading-tight font-semibold break-words hover:underline", emphasis === "plain" ? "text-slate-600" : "text-navy")}>
                        {t.name}
                      </Link>
                      <p className="text-xs text-slate-600">
                        {formatRecord(t)} · {ordinal(t.rank)} · {m.homeId === t.id ? "Home" : "Away"}
                        {role && <span className={cn("font-bold", emphasis === "ahead" ? "text-turf" : "text-slate-700")}> · {role}</span>}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("font-display text-3xl leading-none font-bold tabular-nums", emphasis === "ahead" ? "text-turf" : "text-slate-600")}>
                        {role && <span className="sr-only">{role}, </span>}
                        <ScoreReadout side={s} state={m.state} bracketClassName="text-slate-600" />
                      </p>
                      {delta != null && (
                        <p className={cn("mt-1 text-xs font-semibold tabular-nums", delta >= 0 ? "text-turf" : "text-loss")}>
                          {signed(delta)} <span className="font-medium text-slate-600">vs proj</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {roast ? <RoastCopy roast={roast} /> : preview ? <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-slate-600">{preview.story[0]}</p> : null}
            {linked && (
              <Link href={matchupPath(m)} className="mt-4 inline-flex h-11 items-center rounded-full bg-turf px-4 text-sm font-semibold text-white hover:bg-turf-dark">
                Preview & lineups →
              </Link>
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
      <PageHeader eyebrow={`Week ${LEAGUE.week} scoreboard`} title="Scores">
        <p className="mt-2 text-[15px] text-slate-600">
          {!CURRENT_WEEK_POSTED
            ? `Week ${LEAGUE.week} is not on the schedule yet.`
            : final
              ? `Week ${LEAGUE.week} is final. Green is the winner. The small number is the score minus the projection.`
              : live
                ? `All ${MATCHUPS.length} games are in progress. Green is the side ahead. A bracket is the projection, and it comes off once the score passes it.`
                : `All ${MATCHUPS.length} games. Tap one for the preview and the lineups.`}
        </p>
      </PageHeader>

      {pulled && CURRENT_WEEK_POSTED && (
        <p className="-mt-2 text-sm leading-snug text-slate-600">
          Roast copy is the {pulled} snapshot.
          {LEAGUE.provisionalLabel ? ` ${LEAGUE.provisionalLabel}. The scores above are the live totals.` : " The scores above are the finals."}
        </p>
      )}

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
                        <Link href={teamPath(s.teamId)} className={cn("min-w-0 flex-1 break-normal whitespace-normal hover:underline", s === w ? "font-semibold text-navy" : "text-slate-600")}>
                          {team(s.teamId).name}
                        </Link>
                        <span className={cn("font-display text-lg font-bold tabular-nums", s === w ? "text-navy" : "text-slate-600")}>{s.score.toFixed(2)}</span>
                      </p>
                    ))}
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
