import type { Metadata } from "next";
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
  const status = MATCHUPS.every((m) => m.state === "final") ? "Final" : MATCHUPS.some((m) => m.state === "live") ? "In progress" : "This week";
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
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-slate-600">
          A card of this week&apos;s scores. {note} A bracket is a projected final that is still above the points already scored.
        </p>
      </PageHeader>

      <article className="overflow-hidden rounded-2xl bg-navy text-white shadow-lg shadow-navy/15">
        <div className="yard-lines px-5 py-5">
          <p className="text-xs font-bold tracking-wider text-gold uppercase">Chicken League · Week {LEAGUE.week}</p>
          <h2 className="mt-1 font-display text-4xl leading-none font-extrabold">{status}</h2>
          <p className="mt-3 text-sm text-white/90">
            {leader.name} {formatRecord(leader)} leads. {note}
          </p>
        </div>
        <ul className="grid gap-px bg-white/10">
          {MATCHUPS.map((m) => (
            <li key={m.slug} className="grid grid-cols-2 gap-3 bg-navy px-5 py-3">
              {[m.left, m.right].map((s) => (
                <p key={s.teamId} className="flex items-start gap-2 text-sm">
                  <TeamAvatar teamId={s.teamId} size="sm" />
                  <span className="min-w-0 flex-1 break-normal whitespace-normal">{team(s.teamId).name}</span>
                  <span className="font-display text-xl font-bold tabular-nums">
                    {m.state === "projected" ? (s.projected?.toFixed(1) ?? "—") : formatPoints(s.points ?? 0)}
                    {showProjectionBracket(m.state, s.points ?? null, s.projected ?? null) && (
                      <span className="ml-1 font-sans text-xs font-semibold text-white/80">[{s.projected?.toFixed(1)}]</span>
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
