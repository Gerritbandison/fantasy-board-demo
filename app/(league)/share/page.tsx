import type { Metadata } from "next";
import { StateBadge } from "@/components/league/bits";
import { ShareButton } from "@/components/league/ShareButton";
import { PageHeader, TeamAvatar } from "@/components/league/ui";
import { showProjectionBracket } from "@/lib/score-display";
import { formatPoints, formatRecord, LEAGUE, MATCHUPS, STANDINGS, team } from "@/lib/league";

export const metadata: Metadata = {
  title: "Share card",
  description: `Week ${LEAGUE.week} Chicken League card. ${LEAGUE.provisionalLabel ?? `Week ${LEAGUE.week} is final`}.`,
};

export default function SharePage() {
  const leader = STANDINGS[0];
  const boardState = MATCHUPS.every((m) => m.state === "final") ? "final" : MATCHUPS.some((m) => m.state === "live") ? "live" : "projected";
  const status = boardState === "final" ? "Final" : boardState === "live" ? "In progress" : "This week";
  const note = LEAGUE.provisionalLabel ? `${LEAGUE.provisionalLabel}.` : `Week ${LEAGUE.week} is final.`;
  const sideText = (state: (typeof MATCHUPS)[number]["state"], side: (typeof MATCHUPS)[number]["left"]) => {
    if (state === "projected") return side.projected?.toFixed(1) ?? "—";
    const bracket = showProjectionBracket(state, side.points ?? null, side.projected ?? null) ? ` [${side.projected?.toFixed(1)}]` : "";
    return `${formatPoints(side.points ?? 0)}${bracket}`;
  };
  const lines = MATCHUPS.map((m) => {
    const a = team(m.left.teamId);
    const b = team(m.right.teamId);
    return `${a.abbrev} ${sideText(m.state, m.left)} · ${b.abbrev} ${sideText(m.state, m.right)}`;
  });
  const text = [`Chicken League · Week ${LEAGUE.week}`, `${leader.name} ${formatRecord(leader)} leads. ${note}`, ...lines].join("\n");

  return (
    <>
      <PageHeader eyebrow={`${LEAGUE.season} · Week ${LEAGUE.week}`} title="Share card">
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Shareable scoreboard card for Week {LEAGUE.week}. {note} Bracketed totals indicate projected finals still above points scored.
        </p>
      </PageHeader>

      <article className="overflow-hidden rounded-2xl bg-navy text-white shadow-[0_6px_20px_rgba(12,25,44,0.18)] ring-1 ring-navy-3">
        <div className="border-b border-white/10 yard-lines px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-xs font-bold tracking-[0.14em] text-gold uppercase">Chicken League · Week {LEAGUE.week}</p>
            <StateBadge state={boardState} onDark />
          </div>
          <h2 className="mt-1.5 font-display text-4xl leading-none font-extrabold">{status}</h2>
          <p className="mt-2.5 text-sm text-white/85">
            {leader.name} ({formatRecord(leader)}) leads the standings. {note}
          </p>
        </div>
        <ul className="divide-y divide-white/10">
          {MATCHUPS.map((m) => (
            <li key={m.slug} className="grid gap-2 px-5 py-3.5 sm:grid-cols-2 sm:gap-6 sm:px-6">
              {[m.left, m.right].map((s) => (
                <p key={s.teamId} className="flex items-center gap-2.5 text-sm">
                  <TeamAvatar teamId={s.teamId} size="sm" className="ring-1 ring-white/15" />
                  <span className="min-w-0 flex-1 truncate font-medium text-white/95">{team(s.teamId).name}</span>
                  <span className="font-display text-xl font-bold tabular-nums">
                    {m.state === "projected" ? (s.projected?.toFixed(1) ?? "—") : formatPoints(s.points ?? 0)}
                    {showProjectionBracket(m.state, sidePoints(s), s.projected ?? null) && (
                      <span className="ml-1 font-sans text-xs font-semibold text-white/70">[{s.projected?.toFixed(1)}]</span>
                    )}
                  </span>
                </p>
              ))}
            </li>
          ))}
        </ul>
      </article>

      <ShareButton title={`Chicken League · Week ${LEAGUE.week}`} text={text} />
    </>
  );
}

function sidePoints(s: (typeof MATCHUPS)[number]["left"]) {
  return s.points ?? null;
}
