import type { Metadata } from "next";
import Link from "next/link";
import { ProvisionalNote } from "@/components/league/ProvisionalNote";
import { StandingsTable, type StandingsRowData } from "@/components/league/StandingsTable";
import { PageHeader } from "@/components/league/ui";
import { TeamsTabs } from "@/components/league/TeamsTabs";
import { formatRecord, LEAGUE, STANDINGS, USER_TEAM } from "@/lib/league";
import { allPlay, luck, LUCK_LABEL, pfRank } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Standings",
  description: `Chicken league standings through Week ${LEAGUE.week}: record, points for and against, all-play record, and luck.${LEAGUE.provisionalLabel ? ` ${LEAGUE.provisionalLabel}.` : ""}`,
};

export default function StandingsPage() {
  const rows: StandingsRowData[] = STANDINGS.map((t) => {
    const lk = luck(t.id);
    const ap = allPlay(t.id);
    return {
      id: t.id,
      name: t.name,
      abbrev: t.abbrev,
      color: t.color,
      owner: t.owner,
      isUser: t.id === USER_TEAM.id,
      rank: t.rank,
      record: formatRecord(t),
      wins: t.wins,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      diff: t.pointsFor - t.pointsAgainst,
      pfRank: pfRank(t.id),
      allPlayRecord: `${ap.wins}-${ap.losses}`,
      allPlayPct: ap.pct,
      luckLabel: lk.label,
      luckText: LUCK_LABEL[lk.label].text,
      luckDelta: lk.delta,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow={`${LEAGUE.season} season · Week ${LEAGUE.week}`}
        title="Standings"
        action={<TeamsTabs active="standings" />}
      >
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          <span className="font-semibold text-gold-ink">Lucky (+)</span> teams hold a better standings place than their scoring rank;{" "}
          <span className="font-semibold text-sky-800">unlucky (−)</span> teams have outscored their current record.
        </p>
        {LEAGUE.provisionalLabel && (
          <div className="mt-3">
            <ProvisionalNote />
          </div>
        )}
      </PageHeader>

      <StandingsTable
        rows={rows}
        caption={`Chicken standings. ${LEAGUE.provisionalLabel ?? `Week ${LEAGUE.week} is final`}.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs text-slate-600">
        <span>
          Default order is wins, then points for. {LEAGUE.provisionalLabel ? `${LEAGUE.provisionalLabel}.` : `Week ${LEAGUE.week} is final.`}
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/playoffs" className="font-semibold text-turf hover:underline">
            Playoff simulator →
          </Link>
          <Link href="/insights" className="font-semibold text-turf hover:underline">
            Power rankings &amp; luck →
          </Link>
        </div>
      </div>
    </>
  );
}
