import { Medal, Trophy } from "lucide-react";
import { TeamPlayoffHistory } from "./playoff-h2h";
import { RosterBoard } from "@/components/league/RosterBoard";
import { Card, Pill, SectionHeading, Stat } from "@/components/league/ui";
import { cn } from "@/lib/utils";
import { formatRecord, LEAGUE, ordinal, type Team } from "@/lib/league";

export function TeamRoster({ team }: { team: Team }) {
  return <RosterBoard roster={team.roster} week={LEAGUE.week} weekLabel={LEAGUE.provisionalLabel} season={LEAGUE.season} />;
}

function winPct(record: { wins: number; losses: number; ties: number }) {
  const games = record.wins + record.losses + record.ties;
  return games ? (record.wins + record.ties / 2) / games : 0;
}

export function TeamHistory({ team }: { team: Team }) {
  const history = team.history;
  return (
    <>
      <SectionHeading title="Franchise history" action={`${history.seasons[0]?.season}–${history.seasons[history.seasons.length - 1]?.season}`} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card title="Trophy case">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Titles" value={history.titles} valueClassName={history.titles ? "text-gold-ink" : "text-slate-600"} sub={history.titleYears.join(", ") || undefined} />
            <Stat label="Finals" value={history.finalsYears.length} sub={history.finalsYears.join(", ") || undefined} />
            {history.bestFinish != null && <Stat label="Best finish" value={ordinal(history.bestFinish)} />}
            <Stat label="#1 seeds" value={history.number1Seeds.length} sub={history.number1Seeds.join(", ") || undefined} />
            {history.allTime && <Stat label="Reg. season" value={formatRecord(history.allTime)} sub={`${(winPct(history.allTime) * 100).toFixed(0)}% wins, 2020–25`} />}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {history.titleYears.map((year) => (
              <Pill key={`t${year}`} tone="gold">
                <Trophy className="size-3" /> {year} champion
              </Pill>
            ))}
            {history.finalsYears
              .filter((year) => !history.titleYears.includes(year))
              .map((year) => (
                <Pill key={`f${year}`}>
                  <Medal className="size-3" /> {year} runner-up
                </Pill>
              ))}
          </div>
        </Card>

        <Card title="Season by season" bodyClassName="p-0 sm:p-0" className="overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-y border-line bg-slate-50 text-left text-xs font-bold tracking-wider text-slate-600 uppercase">
                <th className="w-14 py-2 pl-4 sm:pl-5">Year</th>
                <th className="py-2">Team name</th>
                <th className="w-12 py-2 text-right">W-L</th>
                <th className="w-11 py-2 text-right">Seed</th>
                <th className="w-[4.5rem] py-2 pr-4 text-right sm:pr-5">Finish</th>
              </tr>
            </thead>
            <tbody>
              {[...history.seasons].reverse().map((season) => {
                const runnerUp = history.finalsYears.includes(season.season) && !season.champion;
                return (
                  <tr key={season.season} className={cn("border-b border-line last:border-0", season.champion && "bg-gold-light/60")}>
                    <td className="py-2.5 pl-4 font-display font-bold text-navy sm:pl-5">{season.season}</td>
                    <td className="py-2.5 pr-2">
                      <span className="block leading-tight break-words text-slate-700">{season.name}</span>
                      {season.pointsFor != null && <span className="text-xs text-slate-600 tabular-nums">{season.pointsFor.toFixed(1)} PF</span>}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-navy tabular-nums">{formatRecord(season)}</td>
                    <td className="py-2.5 text-right text-slate-600 tabular-nums">{season.seed ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-right sm:pr-5">
                      {season.champion ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Trophy className="size-3.5" /> 1st
                        </span>
                      ) : runnerUp ? (
                        <span className="font-semibold text-slate-700">2nd</span>
                      ) : season.finish != null ? (
                        <span className="text-slate-600 tabular-nums">{ordinal(season.finish)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">
            History follows ESPN team slot {team.id} across seasons. Names are as shown that season; the owner may have changed along the way.
          </p>
        </Card>
      </div>
      <TeamPlayoffHistory teamId={team.id} />
    </>
  );
}
