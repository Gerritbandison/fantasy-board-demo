import { PlayerHeadshot } from "@/components/league/PlayerHeadshot";
import { SlotChip, StatusChip } from "@/components/league/bits";
import { Card } from "@/components/league/ui";
import type { Player } from "@/lib/league";
import {
  buildRosterBoard,
  formatStat,
  gameStatusLabel,
  opponentLabel,
  type RosterPlayer,
  type StatTotals,
} from "@/lib/roster-board";

function asRoster(player: Player): RosterPlayer {
  return player;
}

function cell(player: RosterPlayer | null, pick: (player: RosterPlayer) => string) {
  if (!player) return "--";
  return pick(player);
}

function PlayerFace({ player }: { player: RosterPlayer }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <PlayerHeadshot id={player.playerId} name={player.name} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1 leading-tight">
          <span className="font-semibold break-words text-navy">{player.name}</span>
          <StatusChip status={player.status} />
        </p>
        <p className="text-xs text-slate-600">
          {[player.nflTeam, player.position].filter(Boolean).join(" · ") || "--"}
        </p>
      </div>
    </div>
  );
}

const STATS: { key: string; label: string; value: (player: RosterPlayer | null) => string; total?: (totals: StatTotals) => string }[] = [
  { key: "opp", label: "Opp", value: (player) => opponentLabel(player) },
  { key: "status", label: "Status", value: (player) => gameStatusLabel(player) },
  { key: "proj", label: "Proj", value: (player) => cell(player, (p) => formatStat(p.projection)), total: (t) => formatStat(t.projection) },
  { key: "score", label: "Score", value: (player) => cell(player, (p) => formatStat(p.score)), total: (t) => formatStat(t.score) },
  { key: "oprk", label: "OPRK", value: (player) => cell(player, (p) => formatStat(p.opponentRank, 0)) },
  { key: "start", label: "%Start", value: (player) => cell(player, (p) => formatStat(p.percentStarted)) },
  { key: "rost", label: "%Rost", value: (player) => cell(player, (p) => formatStat(p.percentRostered)) },
  { key: "prk", label: "PRK", value: (player) => cell(player, (p) => formatStat(p.seasonRank, 0)) },
  { key: "fpts", label: "FPTS", value: (player) => cell(player, (p) => formatStat(p.seasonPoints)), total: (t) => formatStat(t.seasonPoints) },
  { key: "avg", label: "AVG", value: (player) => cell(player, (p) => formatStat(p.seasonAverage)), total: (t) => formatStat(t.seasonAverage) },
  { key: "last", label: "Last", value: (player) => cell(player, (p) => formatStat(p.lastPoints)), total: (t) => formatStat(t.lastPoints) },
];

function PhoneRow({ slot, player }: { slot: string; player: RosterPlayer | null }) {
  return (
    <li className="rounded-xl bg-white p-3 ring-1 ring-line">
      <div className="flex items-center gap-2">
        <SlotChip slot={slot} />
        {player ? <PlayerFace player={player} /> : <span className="text-sm font-semibold text-slate-500">Empty</span>}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1">
        {STATS.map((stat) => (
          <div key={stat.key}>
            <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{stat.label}</dt>
            <dd className="text-sm font-semibold text-navy tabular-nums">{stat.value(player)}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function PhoneTotals({ label, totals }: { label: string; totals: StatTotals }) {
  return (
    <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-line">
      <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">{label} totals</p>
      <dl className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1">
        {STATS.filter((stat) => stat.total).map((stat) => (
          <div key={stat.key}>
            <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{stat.label}</dt>
            <dd className="text-sm font-semibold text-navy tabular-nums">{stat.total!(totals)}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function TableSection({
  title,
  rows,
  totals,
}: {
  title: string;
  rows: { slot: string; player: RosterPlayer | null; key: string }[];
  totals: StatTotals | null;
}) {
  return (
    <>
      <tr className="bg-navy text-white">
        <th colSpan={13} className="px-3 py-2 text-left font-display text-sm tracking-wider uppercase">
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.key} className="border-b border-line">
          <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-normal">
            <SlotChip slot={row.slot} />
          </th>
          <td className="sticky left-14 z-10 min-w-52 bg-white px-2 py-2">
            {row.player ? <PlayerFace player={row.player} /> : <span className="text-sm font-semibold text-slate-500">Empty</span>}
          </td>
          {STATS.map((stat) => (
            <td key={stat.key} className="px-2 py-2 text-right font-semibold text-navy tabular-nums whitespace-nowrap">
              {stat.value(row.player)}
            </td>
          ))}
        </tr>
      ))}
      {totals && (
        <tr className="border-b border-line bg-slate-50 font-bold">
          <th className="sticky left-0 z-10 bg-slate-50 px-2 py-2 text-left text-xs tracking-wider text-slate-600 uppercase">Totals</th>
          <td className="sticky left-14 z-10 bg-slate-50" />
          {STATS.map((stat) => (
            <td key={stat.key} className="px-2 py-2 text-right text-navy tabular-nums">
              {stat.total ? stat.total(totals) : "--"}
            </td>
          ))}
        </tr>
      )}
    </>
  );
}

export function RosterBoard({
  roster,
  week,
  weekLabel,
  season,
}: {
  roster: { starters: Player[]; bench: Player[]; ir: Player[] };
  week: number;
  weekLabel: string | null;
  season: number;
}) {
  const board = buildRosterBoard({
    starters: roster.starters.map(asRoster),
    bench: roster.bench.map(asRoster),
    ir: roster.ir.map(asRoster),
  });
  const starterRows = board.starters.map((row, index) => ({ ...row, key: `${row.slot}-${index}` }));
  const benchRows = board.bench.map((player) => ({ slot: "Bench", player, key: player.name }));
  const irRows = board.ir.length ? board.ir.map((player) => ({ slot: "IR", player, key: player.name })) : [{ slot: "IR", player: null, key: "ir-empty" }];

  return (
    <Card title="Lineup" action={weekLabel ?? `Week ${week}`} bodyClassName="p-0 sm:p-0">
      <p className="px-4 pt-1 text-sm text-slate-600 sm:px-5">
        Week {week}
        {weekLabel ? ` · ${weekLabel}` : ""}. One current roster is stored, so this is the latest lineup.
      </p>
      <div className="mt-3 grid gap-2 px-3 pb-3 md:hidden">
        <p className="px-1 text-xs font-bold tracking-wider text-slate-600 uppercase">Starters</p>
        <ul className="grid gap-2">
          {starterRows.map((row) => (
            <PhoneRow key={row.key} slot={row.slot} player={row.player} />
          ))}
          <PhoneTotals label="Starters" totals={board.starterTotals} />
        </ul>
        <p className="px-1 pt-2 text-xs font-bold tracking-wider text-slate-600 uppercase">Bench</p>
        <ul className="grid gap-2">
          {benchRows.map((row) => (
            <PhoneRow key={row.key} slot={row.player.position} player={row.player} />
          ))}
          <PhoneTotals label="Bench" totals={board.benchTotals} />
        </ul>
        <p className="px-1 pt-2 text-xs font-bold tracking-wider text-slate-600 uppercase">IR</p>
        <ul className="grid gap-2">
          {irRows.map((row) => (
            <PhoneRow key={row.key} slot="IR" player={row.player} />
          ))}
        </ul>
      </div>
      <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-line bg-slate-50 text-xs tracking-wider text-slate-600 uppercase">
              <th rowSpan={2} className="sticky left-0 z-20 bg-slate-50 px-2 py-2 text-left">Slot</th>
              <th rowSpan={2} className="sticky left-14 z-20 min-w-52 bg-slate-50 px-2 py-2 text-left">Player</th>
              <th rowSpan={2} className="px-2 py-2 text-right">Opp</th>
              <th rowSpan={2} className="px-2 py-2 text-right">Status</th>
              <th rowSpan={2} className="px-2 py-2 text-right">Proj</th>
              <th rowSpan={2} className="px-2 py-2 text-right">Score</th>
              <th rowSpan={2} className="px-2 py-2 text-right">OPRK</th>
              <th rowSpan={2} className="px-2 py-2 text-right">%Start</th>
              <th rowSpan={2} className="px-2 py-2 text-right">%Rost</th>
              <th colSpan={4} className="px-2 py-1 text-center">{season} season</th>
            </tr>
            <tr className="border-b border-line bg-slate-50 text-xs tracking-wider text-slate-600 uppercase">
              <th className="px-2 py-1 text-right">PRK</th>
              <th className="px-2 py-1 text-right">FPTS</th>
              <th className="px-2 py-1 text-right">AVG</th>
              <th className="px-2 py-1 text-right">Last</th>
            </tr>
          </thead>
          <tbody>
            <TableSection title="Starters" rows={starterRows} totals={board.starterTotals} />
            <TableSection title="Bench" rows={benchRows} totals={board.benchTotals} />
            <TableSection title="IR" rows={irRows} totals={null} />
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">
        % rostered is the ESPN-wide rate on the roster pull. Opponent, kickoff, projection, score, OPRK, % started, and season rank, points, average, and last game are not in this pull, so those cells are --.
      </p>
    </Card>
  );
}
