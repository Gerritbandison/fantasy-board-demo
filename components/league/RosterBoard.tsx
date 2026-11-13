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

interface StatCol {
  key: string;
  label: string;
  group?: "season";
  highlight?: boolean;
  present: (p: RosterPlayer) => boolean;
  value: (player: RosterPlayer | null) => string;
  total?: (totals: StatTotals) => string;
}

const ALL_STATS: StatCol[] = [
  { key: "opp", label: "Opp", present: (p) => p.opponent != null, value: (player) => opponentLabel(player) },
  { key: "status", label: "Status", present: (p) => p.gameStatus != null, value: (player) => gameStatusLabel(player) },
  { key: "proj", label: "Proj", present: (p) => p.projection != null, value: (player) => cell(player, (p) => formatStat(p.projection)), total: (t) => formatStat(t.projection) },
  { key: "score", label: "Score", highlight: true, present: (p) => p.score != null, value: (player) => cell(player, (p) => formatStat(p.score)), total: (t) => formatStat(t.score) },
  { key: "oprk", label: "OPRK", present: (p) => p.opponentRank != null, value: (player) => cell(player, (p) => formatStat(p.opponentRank, 0)) },
  { key: "start", label: "%Start", present: (p) => p.percentStarted != null, value: (player) => cell(player, (p) => formatStat(p.percentStarted)) },
  { key: "rost", label: "%Rost", present: (p) => p.percentRostered != null, value: (player) => cell(player, (p) => formatStat(p.percentRostered)) },
  { key: "prk", label: "PRK", group: "season", present: (p) => p.seasonRank != null, value: (player) => cell(player, (p) => formatStat(p.seasonRank, 0)) },
  { key: "fpts", label: "FPTS", group: "season", present: (p) => p.seasonPoints != null, value: (player) => cell(player, (p) => formatStat(p.seasonPoints)), total: (t) => formatStat(t.seasonPoints) },
  { key: "avg", label: "AVG", group: "season", present: (p) => p.seasonAverage != null, value: (player) => cell(player, (p) => formatStat(p.seasonAverage)), total: (t) => formatStat(t.seasonAverage) },
  { key: "last", label: "Last", group: "season", present: (p) => p.lastPoints != null, value: (player) => cell(player, (p) => formatStat(p.lastPoints)), total: (t) => formatStat(t.lastPoints) },
];

function PhoneRow({ slot, player, secondaryCols }: { slot: string; player: RosterPlayer | null; secondaryCols: StatCol[] }) {
  const scoreVal = player ? formatStat(player.score) : "--";
  const projVal = player ? formatStat(player.projection) : "--";

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

      {player && secondaryCols.length > 0 && (
        <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/70 pt-2">
          {secondaryCols.map((stat) => {
            const val = stat.value(player);
            return (
              <div key={stat.key} className="flex items-baseline gap-1 text-xs">
                <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{stat.label}</dt>
                <dd className={cn("tabular-nums", val === "--" ? "text-slate-400" : "font-semibold text-navy")}>{val}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </li>
  );
}

function PhoneTotals({ label, totals, cols }: { label: string; totals: StatTotals; cols: StatCol[] }) {
  const totalCols = cols.filter((stat) => stat.total);
  if (totalCols.length === 0) return null;
  return (
    <li className="rounded-xl bg-surface-subtle px-3.5 py-2.5 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xs font-bold tracking-wider text-navy uppercase">{label} totals</p>
        <dl className="flex flex-wrap items-center gap-4">
          {totalCols.map((stat) => {
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
  cols,
  primary = false,
}: {
  title: string;
  rows: { slot: string; player: RosterPlayer | null; key: string }[];
  totals: StatTotals | null;
  cols: StatCol[];
  primary?: boolean;
}) {
  return (
    <>
      <tr className={primary ? "bg-navy text-white" : "bg-navy-2 text-white"}>
        <th colSpan={2 + cols.length} className="px-4 py-2 text-left font-display text-xs font-bold tracking-[0.1em] uppercase">
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.key} className="group border-b border-line transition-colors hover:bg-surface-subtle/70">
          <th className="sticky left-0 z-10 w-16 bg-white px-3 py-2.5 text-left font-normal group-hover:bg-surface-subtle">
            <SlotChip slot={row.slot} />
          </th>
          <td className="min-w-52 bg-white px-2.5 py-2.5 group-hover:bg-surface-subtle">
            {row.player ? <PlayerFace player={row.player} /> : <span className="text-sm font-medium text-slate-400">Empty slot</span>}
          </td>
          {cols.map((stat) => {
            const val = stat.value(row.player);
            return (
              <td
                key={stat.key}
                className={cn(
                  "px-3 py-2.5 text-right tabular-nums whitespace-nowrap",
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
          <td className="bg-surface-subtle" />
          {cols.map((stat) => {
            const val = stat.total ? stat.total(totals) : "";
            return (
              <td
                key={stat.key}
                className={cn(
                  "px-3 py-2.5 text-right tabular-nums",
                  !val || val === "--" ? "font-normal text-slate-400" : "font-display text-base font-bold text-navy",
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
  season,
}: {
  roster: { starters: Player[]; bench: Player[]; ir: Player[] };
  week: number;
  weekLabel?: string | null;
  season: number;
}) {
  const allPlayers = [...roster.starters, ...roster.bench, ...roster.ir].map(asRoster);
  const cols = ALL_STATS.filter((col) => allPlayers.some((p) => col.present(p)));
  const seasonCols = cols.filter((c) => c.group === "season");
  const baseCols = cols.filter((c) => c.group !== "season");
  const secondaryPhoneCols = cols.filter((c) => c.key !== "score" && c.key !== "proj");

  const board = buildRosterBoard({
    starters: roster.starters.map(asRoster),
    bench: roster.bench.map(asRoster),
    ir: roster.ir.map(asRoster),
  });
  const starterRows = board.starters.map((row, index) => ({ ...row, key: `${row.slot}-${index}` }));
  const benchRows = board.bench.map((player) => ({ slot: "Bench", player, key: player.name }));
  const irRows = board.ir.map((player) => ({ slot: "IR", player, key: player.name }));

  const countSummary = [
    `${starterRows.filter((r) => r.player).length} starters`,
    `${benchRows.length} bench`,
    irRows.length > 0 ? `${irRows.length} IR` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card title={`Week ${week} lineup`} action={countSummary} bodyClassName="p-0 sm:p-0">
      <div className="grid gap-2.5 bg-surface-subtle/45 px-3 py-3 md:hidden">
        <p className="px-1 font-display text-xs font-bold tracking-[0.1em] text-navy uppercase">Starters</p>
        <ul className="grid gap-2">
          {starterRows.map((row) => (
            <PhoneRow key={row.key} slot={row.slot} player={row.player} secondaryCols={secondaryPhoneCols} />
          ))}
          <PhoneTotals label="Starters" totals={board.starterTotals} cols={cols} />
        </ul>

        <p className="px-1 pt-2 font-display text-xs font-bold tracking-[0.1em] text-navy uppercase">Bench</p>
        <ul className="grid gap-2">
          {benchRows.map((row) => (
            <PhoneRow key={row.key} slot={row.player.position} player={row.player} secondaryCols={secondaryPhoneCols} />
          ))}
          <PhoneTotals label="Bench" totals={board.benchTotals} cols={cols} />
        </ul>

        {irRows.length > 0 && (
          <>
            <p className="px-1 pt-2 font-display text-xs font-bold tracking-[0.1em] text-navy uppercase">Injured reserve</p>
            <ul className="grid gap-2">
              {irRows.map((row) => (
                <PhoneRow key={row.key} slot="IR" player={row.player} secondaryCols={secondaryPhoneCols} />
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-[11px] font-bold tracking-wider text-slate-600 uppercase">
              <th rowSpan={seasonCols.length > 0 ? 2 : 1} className="sticky left-0 z-20 w-16 bg-surface-subtle px-3 py-2.5 text-left">
                Slot
              </th>
              <th rowSpan={seasonCols.length > 0 ? 2 : 1} className="min-w-52 bg-surface-subtle px-2.5 py-2.5 text-left">
                Player
              </th>
              {baseCols.map((col) => (
                <th
                  key={col.key}
                  rowSpan={seasonCols.length > 0 ? 2 : 1}
                  className={cn("px-3 py-2.5 text-right", col.highlight && "bg-surface-muted/60 text-navy")}
                >
                  {col.label}
                </th>
              ))}
              {seasonCols.length > 0 && (
                <th colSpan={seasonCols.length} className="border-b border-line/80 px-3 py-1.5 text-center text-navy">
                  {season} season
                </th>
              )}
            </tr>
            {seasonCols.length > 0 && (
              <tr className="border-b border-line bg-surface-subtle text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                {seasonCols.map((col) => (
                  <th key={col.key} className="px-3 py-1.5 text-right">
                    {col.label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            <TableSection title="Starters" rows={starterRows} totals={board.starterTotals} cols={cols} primary />
            <TableSection title="Bench" rows={benchRows} totals={board.benchTotals} cols={cols} />
            {irRows.length > 0 && <TableSection title="Injured reserve" rows={irRows} totals={null} cols={cols} />}
          </tbody>
        </table>
      </div>

      <p className="bg-surface-subtle/50 px-4 py-2.5 text-xs text-slate-600 sm:px-5">
        %Start and %Rost reflect platform-wide ESPN rates.
      </p>
    </Card>
  );
}
