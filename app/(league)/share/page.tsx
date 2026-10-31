import type { Metadata } from "next";
import Link from "next/link";
import { ShareButton } from "@/components/league/ShareButton";
import { PageHeader, TeamAvatar } from "@/components/league/ui";
import { formatPoints, formatRecord, LEAGUE, MATCHUPS, STANDINGS, team, THURSDAY } from "@/lib/league";

export const metadata: Metadata = {
  title: "Share card",
  description: `Week ${LEAGUE.week} Chicken League card: in-progress scores and the Thursday slate. Standings are through week ${LEAGUE.week - 1}.`,
};

export default function SharePage() {
  const leader = STANDINGS[0];
  const live = MATCHUPS.some((m) => m.state !== "projected");
  const lines = MATCHUPS.map((m) => {
    const a = team(m.left.teamId);
    const b = team(m.right.teamId);
    if (m.state === "projected") {
      return `${a.abbrev} ${m.left.projected?.toFixed(1) ?? "—"} · ${b.abbrev} ${m.right.projected?.toFixed(1) ?? "—"}`;
    }
    return `${a.abbrev} ${formatPoints(m.left.points ?? 0)} [${m.left.projected?.toFixed(1) ?? "—"}] · ${b.abbrev} ${formatPoints(m.right.points ?? 0)} [${m.right.projected?.toFixed(1) ?? "—"}]`;
  });
  const text = [`Chicken League · Week ${LEAGUE.week}`, `${leader.name} ${formatRecord(leader)} leads after week ${LEAGUE.week - 1}.`, ...lines].join("\n");

  return (
    <>
      <PageHeader eyebrow={`${LEAGUE.season} · Week ${LEAGUE.week}`} title="Share card">
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          A card of this week&apos;s real scores. Brackets are projected finals. Standings stay through week {LEAGUE.week - 1}.
        </p>
      </PageHeader>

      <article className="overflow-hidden rounded-2xl bg-navy text-white shadow-lg shadow-navy/15">
        <div className="yard-lines px-5 py-5">
          <p className="text-xs font-bold tracking-wider text-gold uppercase">Chicken League · Week {LEAGUE.week}</p>
          <h2 className="mt-1 font-display text-4xl leading-none font-extrabold">{live ? "In progress" : "This week"}</h2>
          <p className="mt-3 text-sm text-white/90">
            {leader.name} {formatRecord(leader)} leads after week {LEAGUE.week - 1}.
          </p>
        </div>
        <ul className="grid gap-px bg-white/10">
          {MATCHUPS.map((m) => (
            <li key={m.slug} className="grid grid-cols-2 gap-3 bg-navy px-5 py-3">
              {[m.left, m.right].map((s) => (
                <p key={s.teamId} className="flex items-center gap-2 text-sm">
                  <TeamAvatar teamId={s.teamId} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{team(s.teamId).name}</span>
                  <span className="font-display text-xl font-bold tabular-nums">
                    {m.state === "projected" ? (s.projected?.toFixed(1) ?? "—") : formatPoints(s.points ?? 0)}
                    {m.state !== "projected" && s.projected != null && <span className="ml-1 font-sans text-xs font-semibold text-white/80">[{s.projected.toFixed(1)}]</span>}
                  </span>
                </p>
              ))}
            </li>
          ))}
        </ul>
        {THURSDAY && (
          <p className="px-5 py-4 text-sm leading-snug text-white/90">
            Thursday: {THURSDAY.nfl.home} {THURSDAY.nfl.homeScore}, {THURSDAY.nfl.away} {THURSDAY.nfl.awayScore}. Fantasy points from that game are on the{" "}
            <Link href="/matchups#thursday" className="font-semibold text-gold underline-offset-2 hover:underline">
              Thursday card
            </Link>
            .
          </p>
        )}
      </article>

      <ShareButton title={`Chicken League · Week ${LEAGUE.week}`} text={text} />
    </>
  );
}
