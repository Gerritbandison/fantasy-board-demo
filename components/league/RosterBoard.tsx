import { PlayerHeadshot } from "@/components/league/PlayerHeadshot";
import { ByeChip, SlotChip, StatusChip } from "@/components/league/bits";
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
import { cn } from "@/lib/utils";

function asRoster(player: Player): RosterPlayer {
  return player;
}

function cell(player: RosterPlayer | null, pick: (player: RosterPlayer) => string) {
  if (!player) return "--";
  return pick(player);
}

function PlayerFace({ player }: { player: RosterPlayer }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PlayerHeadshot id={player.playerId} name={player.name} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 leading-tight">
          <span className="font-semibold break-words text-navy">{player.name}</span>
          <StatusChip status={player.status} />
          <ByeChip onBye={player.onBye} />
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-600">
          {[player.nflTeam, player.position].filter(Boolean).join(" · ") || "--"}
        </p>
      </div>
    </div>
  );
}

const STATS: { key: string; label: string; highlight?: boolean; value: (player: RosterPlayer | null) => string; total?: (totals: StatTotals) => string }[] = [
  { key: "opp", label: "Opp", value: (player) => opponentLabel(player) },
  { key: "status", label: "Status", value: (player) => gameStatusLabel(player) },
  { key: "proj", label: "Proj", value: (player) => cell(player, (p) => formatStat(p.projection)), total: (t) => formatStat(t.projection) },
  { key: "score", label: "Score", highlight: true, value: (player) => cell(player, (p) => formatStat(p.score)), total: (t) => formatStat(t.score) },
  { key: "oprk", label: "OPRK", value: (player) => cell(player, (p) => formatStat(p.opponentRank, 0)) },
  { key: "start", label: "%Start", value: (player) => cell(player, (p) => formatStat(p.percentStarted)) },
  { key: "rost", label: "%Rost", value: (player) => cell(player, (p) => formatStat(p.percentRostered)) },
  { key: "prk", label: "PRK", value: (player) => cell(player, (p) => formatStat(p.seasonRank, 0)) },
  { key: "fpts", label: "FPTS", value: (player) => cell(player, (p) => formatStat(p.seasonPoints)), total: (t) => formatStat(t.seasonPoints) },
  { key: "avg", label: "AVG", value: (player) => cell(player, (p) => formatStat(p.seasonAverage)), total: (t) => formatStat(t.seasonAverage) },
  { key: "last", label: "Last", value: (player) => cell(player, (p) => formatStat(p.lastPoints)), total: (t) => formatStat(t.lastPoints) },
];

const SECONDARY_PHONE_STATS = STATS.filter((s) => s.key !== "score" && s.key !== "proj");

function PhoneRow({ slot, player }: { slot: string; player: RosterPlayer | null }) {
  const scoreVal = STATS.find((s) => s.key === "score")!.value(player);
  const projVal = STATS.find((s) => s.key === "proj")!.value(player);

  return (
    <li className="rounded-xl bg-white p-3 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SlotChip slot={slot} />
          {player ? <PlayerFace player={player} /> : <span className="text-sm font-medium text-slate-400">Empty slot</span>}
        </div>
        <div className="shrink-0 text-right tabular-nums">
          <p className={cn("font-display text-xl leading-none font-bold", scoreVal === "--" ? "text-slate-400" : "text-navy")}>
            {scoreVal}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">Proj {projVal}</p>
        </div>
      </div>

      {player && (
        <dl className="mt-2.5 grid grid-cols-5 gap-x-2 gap-y-1.5 border-t border-line/70 pt-2">
          {SECONDARY_PHONE_STATS.map((stat) => {
            const val = stat.value(player);
            return (
              <div key={stat.key} className="min-w-0">
                <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{stat.label}</dt>
                <dd className={cn("truncate text-xs tabular-nums", val === "--" ? "text-slate-400" : "font-semibold text-navy")}>{val}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </li>
  );
}

function PhoneTotals({ label, totals }: { label: string; totals: StatTotals }) {
  return (
    <li className="rounded-xl bg-surface-subtle px-3.5 py-2.5 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xs font-bold tracking-wider text-navy uppercase">{label} totals</p>
        <dl className="flex flex-wrap items-center gap-4">
          {STATS.filter((stat) => stat.total).map((stat) => {
            const val = stat.total!(totals);
            return (
              <div key={stat.key} className="text-right">
                <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{stat.label}</dt>
                <dd className={cn("font-display text-base leading-tight font-bold tabular-nums", val === "--" ? "text-slate-400" : "text-navy")}>{val}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </li>
  );
}

function TableSection({
  title,
  rows,
  totals,
  primary = false,
}: {
  title: string;
  rows: { slot: string; player: RosterPlayer | null; key: string }[];
  totals: StatTotals | null;
  primary?: boolean;
}) {
  return (
    <>
      <tr className={primary ? "bg-navy text-white" : "bg-navy-2 text-white"}>
        <th colSpan={13} className="px-4 py-2 text-left font-display text-xs font-bold tracking-[0.1em] uppercase">
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.key} className="group border-b border-line transition-colors hover:bg-surface-subtle/70">
          <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-normal group-hover:bg-surface-subtle">
            <SlotChip slot={row.slot} />
          </th>
          <td className="sticky left-16 z-10 min-w-56 bg-white px-2.5 py-2.5 group-hover:bg-surface-subtle">
            {row.player ? <PlayerFace player={row.player} /> : <span className="text-sm font-medium text-slate-400">Empty slot</span>}
          </td>
          {STATS.map((stat) => {
            const val = stat.value(row.player);
            return (
              <td
                key={stat.key}
                className={cn(
                  "px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap",
                  stat.highlight && "bg-surface-subtle/50",
                  val === "--" ? "font-normal text-slate-400" : stat.highlight ? "font-display text-base font-bold text-navy" : "font-semibold text-navy",
                )}
              >
                {val}
              </td>
            );
          })}
        </tr>
      ))}
      {totals && (
        <tr className="border-b border-line bg-surface-subtle font-bold">
          <th className="sticky left-0 z-10 bg-surface-subtle px-3 py-2.5 text-left font-display text-xs tracking-wider text-slate-600 uppercase">Totals</th>
          <td className="sticky left-16 z-10 bg-surface-subtle" />
          {STATS.map((stat) => {
            const val = stat.total ? stat.total(totals) : "--";
            return (
              <td
                key={stat.key}
                className={cn(
                  "px-2.5 py-2.5 text-right tabular-nums",
                  val === "--" ? "font-normal text-slate-400" : "font-display text-base font-bold text-navy",
                )}
              >
                {val}
              </td>
            );
          })}
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
      <p className="border-b border-line/70 px-4 py-2.5 text-xs font-medium text-slate-600 sm:px-5">
        Week {week}
        {weekLabel ? ` · ${weekLabel}` : ""}. One current roster is stored, so this is the latest lineup.
      </p>

      <div className="grid gap-2.5 bg-surface-subtle/45 px-3 py-3 md:hidden">
        <p className="px-1 font-display text-xs font-bold tracking-[0.1em] text-navy uppercase">Starters</p>
        <ul className="grid gap-2">
          {starterRows.map((row) => (
            <PhoneRow key={row.key} slot={row.slot} player={row.player} />
          ))}
          <PhoneTotals label="Starters" totals={board.starterTotals} />
        </ul>

        <p className="px-1 pt-2 font-display text-xs font-bold tracking-[0.1em] text-navy uppercase">Bench</p>
        <ul className="grid gap-2">
          {benchRows.map((row) => (
            <PhoneRow key={row.key} slot={row.player.position} player={row.player} />
          ))}
          <PhoneTotals label="Bench" totals={board.benchTotals} />
        </ul>

        <p className="px-1 pt-2 font-display text-xs font-bold tracking-[0.1em] text-navy uppercase">Injured reserve</p>
        <ul className="grid gap-2">
          {irRows.map((row) => (
            <PhoneRow key={row.key} slot="IR" player={row.player} />
          ))}
        </ul>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              <th rowSpan={2} className="sticky left-0 z-20 bg-surface-subtle px-3 py-2 text-left">
                Slot
              </th>
              <th rowSpan={2} className="sticky left-16 z-20 min-w-56 bg-surface-subtle px-2.5 py-2 text-left">
                Player
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-right">
                Opp
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-right">
                Status
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-right">
                Proj
              </th>
              <th rowSpan={2} className="bg-surface-muted/60 px-2.5 py-2 text-right text-navy">
                Score
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-right">
                OPRK
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-right">
                %Start
              </th>
              <th rowSpan={2} className="px-2.5 py-2 text-right">
                %Rost
              </th>
              <th colSpan={4} className="border-b border-line/80 px-2.5 py-1.5 text-center text-navy">
                {season} season
              </th>
            </tr>
            <tr className="border-b border-line bg-surface-subtle text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              <th className="px-2.5 py-1.5 text-right">PRK</th>
              <th className="px-2.5 py-1.5 text-right">FPTS</th>
              <th className="px-2.5 py-1.5 text-right">AVG</th>
              <th className="px-2.5 py-1.5 text-right">Last</th>
            </tr>
          </thead>
          <tbody>
            <TableSection title="Starters" rows={starterRows} totals={board.starterTotals} primary />
            <TableSection title="Bench" rows={benchRows} totals={board.benchTotals} />
            <TableSection title="Injured reserve" rows={irRows} totals={null} />
          </tbody>
        </table>
      </div>

      <p className="bg-surface-subtle/50 px-4 py-3 text-xs leading-relaxed text-slate-600 sm:px-5">
        % rostered is the ESPN-wide rate on the roster pull. Cells marked <span className="font-mono text-slate-500">--</span> are not included in this snapshot.
      </p>
    </Card>
  );
}
