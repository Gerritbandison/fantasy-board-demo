import Link from "next/link";
import { formatPoints, team, teamPath, THURSDAY, type ThursdayPlayer } from "@/lib/league";
import { Card, TeamAvatar } from "./ui";

function teamPoints(players: ThursdayPlayer[], teamId: number, started: boolean) {
  return players.filter((p) => p.teamId === teamId && p.started === started).reduce((sum, p) => sum + p.points, 0);
}

/** Thursday scoring for the current week. Every number comes from the committed Thursday block. */
export function ThursdayNight() {
  const night = THURSDAY;
  if (!night || night.players.length === 0) return null;
  const played = [...new Set(night.players.map((p) => p.teamId))];
  const cashed = played
    .map((id) => ({ id, points: teamPoints(night.players, id, true) }))
    .sort((a, b) => b.points - a.points);
  const benched = night.players.filter((p) => !p.started).sort((a, b) => b.points - a.points);
  const blunder = benched[0];
  const blunderStarters = blunder ? night.players.filter((p) => p.started && p.teamId === blunder.teamId) : [];
  const quiet = night.quietTeamIds.map((id) => team(id).name);
  const nfl = night.nfl;
  const quarterTeams = Object.entries(nfl.quarters);

  return (
    <section id="thursday" className="scroll-mt-28">
      <Card
        title="Thursday night"
        action={<span className="font-semibold text-turf">In progress</span>}
        accent="#15803d"
      >
        <p className="font-display text-2xl leading-tight font-extrabold text-navy">
          {team(cashed[0].id).name} cashed {formatPoints(cashed[0].points)}
          {cashed[1] && (
            <>
              . {team(cashed[1].id).name} {formatPoints(cashed[1].points)}
            </>
          )}
          .
        </p>
        {blunder && (
          <p className="mt-2 text-base leading-snug text-slate-700">
            Bench blunder: {team(blunder.teamId).name} left {blunder.name}&apos;s {formatPoints(blunder.points)} on the bench
            {blunderStarters.length > 0 && (
              <>
                {" "}
                while {blunderStarters.map((p) => `${p.name} (${formatPoints(p.points)})`).join(" and ")} started
              </>
            )}
            .
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {nfl.home} {nfl.homeScore}, {nfl.away} {nfl.awayScore} at {nfl.site}. {nfl.home} {nfl.homeRecord}, {nfl.away} {nfl.awayRecord}. Fantasy points are {night.scoring}. Week {night.week} is still in progress, so these points are not in the standings.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {quarterTeams.map(([abbr, qs]) => (
            <div key={abbr} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-line">
              <dt className="text-xs font-bold tracking-wider text-slate-600 uppercase">{abbr} quarters</dt>
              <dd className="font-display text-lg font-bold text-navy tabular-nums">{qs.join("-")}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-4 grid gap-3">
          {cashed.map((row) => {
            const players = night.players.filter((p) => p.teamId === row.id);
            return (
              <li key={row.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-line">
                <div className="flex items-center gap-2">
                  <TeamAvatar teamId={row.id} size="sm" />
                  <Link href={teamPath(row.id)} className="min-w-0 flex-1 font-semibold text-navy hover:underline">
                    {team(row.id).name}
                  </Link>
                  <span className="font-display text-2xl font-bold text-navy tabular-nums">{formatPoints(row.points)}</span>
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {players.map((p) => (
                    <li key={p.name} className="text-sm leading-snug text-slate-700">
                      <span className="font-semibold text-navy">{p.name}</span>{" "}
                      <span className="text-slate-600">
                        {p.position}
                        {p.nflTeam ? ` · ${p.nflTeam}` : ""} · {p.started ? "started" : "bench"} · {formatPoints(p.points)}
                      </span>
                      {p.line && <span className="block text-slate-600">{p.line}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        {quiet.length > 0 && <p className="mt-3 text-sm text-slate-600">Nobody from {quiet.join(", ")} was in the game.</p>}
        <p className="mt-3 text-sm">
          <a href={nfl.source} className="font-semibold text-turf underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
            ESPN box score
          </a>
        </p>
      </Card>
    </section>
  );
}
