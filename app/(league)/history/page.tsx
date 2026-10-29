import type { Metadata } from "next";
import Link from "next/link";
import { DisplayName, Frame, PageHead, Rule, Tag } from "@/components/league/hud";
import { MiniTrail } from "@/components/league/trail";
import { cn } from "@/lib/utils";
import {
  archiveHits,
  callsign,
  championSeeds,
  intel,
  teamIdByName,
  titleBoard,
  trailStats,
  type ArchiveRole,
} from "@/lib/intel";
import { boardInvolving } from "@/lib/league";

export const metadata: Metadata = {
  title: "History",
  description: "The Chicken league archive: champions 2022–2025, the all-time title board, and franchise arcs.",
};

const ROLE: { [r in ArchiveRole]: { short: string; cell: string } } = {
  champion: { short: "CHAMP", cell: "bg-phos text-ink font-semibold" },
  "runner-up": { short: "FINAL", cell: "bg-sig/15 text-sig ring-1 ring-inset ring-sig/40" },
  mentioned: { short: "FILE", cell: "bg-white/[0.04] text-zinc-300 ring-1 ring-inset ring-white/15" },
};

export default function HistoryPage() {
  const seeds = championSeeds();
  const board = titleBoard();
  const years = intel.league.seasonsOnRecord;
  const firstChamp = Math.min(...intel.champions.map((c) => c.year));
  const lastChamp = Math.max(...intel.champions.map((c) => c.year));
  const midSeed = intel.leaguePulse.find((p) => /mid-seed/i.test(p.title));
  const distinct = new Set(intel.champions.map((c) => c.champion)).size;

  return (
    <>
      <PageHead
        code={`ARC // Archive ${years[0]}–${years[years.length - 1]}`}
        title="The Chicken record"
        kicker={`${intel.champions.length} title games on file, ${firstChamp}–${lastChamp}. ${distinct} different champions${distinct === intel.champions.length ? ", and nobody has repeated" : ""}.`}
      />

      <ol className="grid grid-cols-7 gap-px border border-white/[0.07] bg-white/[0.07]" aria-label="Seasons on record">
        {years.map((y) => {
          const c = intel.champions.find((x) => x.year === y);
          const champId = c ? teamIdByName(c.champion) : undefined;
          const live = y === intel.league.season;
          return (
            <li key={y} className={cn("bg-panel px-0.5 py-2 text-center", live && "bg-phos/[0.07]")}>
              <span className={cn("block font-mono text-[10px] tracking-wider", live ? "text-phos" : "text-dim")}>&apos;{String(y).slice(2)}</span>
              <span
                className={cn(
                  "mt-0.5 block font-mono text-[10.5px] font-semibold tracking-wider",
                  c ? "text-zinc-50" : live ? "animate-blink text-phos" : "text-faint",
                )}
              >
                {c && champId ? callsign(champId) : live ? `W${String(intel.league.week).padStart(2, "0")}` : "N/F"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="-mt-3 font-mono text-[10px] tracking-wider text-faint uppercase">
        Seasons on record · champion call sign · N/F = no title file · {intel.league.season} in progress
      </p>

      {midSeed && (
        <div className="border-l-2 border-sig bg-sig/[0.05] px-3 py-2.5">
          <p className="font-mono text-[10.5px] tracking-[0.2em] text-sig uppercase">Pattern ▸ {midSeed.title}</p>
          <p className="mt-1 text-sm leading-snug text-zinc-300">{midSeed.body}</p>
        </div>
      )}

      <Rule label="Champions // title games" right={`${intel.champions.length} on file`} />
      <ol className="relative grid gap-4 pl-6 before:absolute before:inset-y-2 before:left-[7px] before:w-px before:bg-gradient-to-b before:from-phos/60 before:via-white/15 before:to-transparent lg:grid-cols-2 lg:gap-5 lg:pl-0 lg:before:hidden">
        {intel.champions.map((c) => {
          const champId = teamIdByName(c.champion);
          const ruId = teamIdByName(c.runnerUp);
          const seed = seeds.get(c.year);
          return (
            <li key={c.year} className="relative">
              <span
                className="absolute top-4 -left-6 size-[15px] border border-phos bg-ink shadow-[0_0_10px_var(--color-phos)] lg:hidden"
                aria-hidden
              >
                <span className="absolute inset-[3px] bg-phos" />
              </span>
              <Frame as="article" label="Title game" code={String(c.year)} meta={seed ? `Won as ${seed}-seed` : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-phos uppercase">Champion</p>
                    <p className="font-display text-2xl leading-tight font-bold tracking-wide break-words text-zinc-50 uppercase sm:text-3xl">
                      <DisplayName text={c.champion} />
                    </p>
                    <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-dim uppercase">Runner-up</p>
                    <p className="text-[15px] leading-tight text-zinc-300">{c.runnerUp}</p>
                  </div>
                  <span className="shrink-0 font-display text-5xl leading-none font-bold text-phos/15 tabular-nums select-none sm:text-6xl" aria-hidden>
                    {String(c.year).slice(2)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {champId && <Tag tone="phos">★ {callsign(champId)}</Tag>}
                  {ruId && <Tag tone="sig">◇ {callsign(ruId)}</Tag>}
                </div>
                <p className="mt-3 border-t border-dashed border-white/10 pt-3 text-sm leading-relaxed text-zinc-400">{c.note}</p>
              </Frame>
            </li>
          );
        })}
      </ol>

      <Rule label="Title board // all time on file" right="★ title · ◇ final" />
      <Frame label="Rings & finals" code="TTL" meta={`${firstChamp}–${lastChamp}`} bodyClassName="p-0 sm:p-0">
        <ol>
          {board.map((r, i) => (
            <li
              key={r.team}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 border-b border-white/[0.05] px-3 py-3 last:border-0 sm:grid-cols-[1.5rem_minmax(0,14rem)_6rem_minmax(0,1fr)] sm:items-center sm:px-4"
            >
              <span className="pt-0.5 font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className={cn("block font-display text-lg leading-tight font-semibold tracking-wide break-words uppercase", r.titles ? "text-zinc-50" : "text-zinc-400")}>
                  <DisplayName text={r.team} />
                </span>
                <span className="block font-mono text-[10px] tracking-wider text-faint uppercase">
                  {r.titleYears.length ? `Won ${r.titleYears.join(", ")}` : "No title on file"}
                  {r.runnerUpYears.length ? ` · RU ${r.runnerUpYears.join(", ")}` : ""}
                </span>
              </span>
              <span className="flex items-center gap-1 pt-1 font-mono text-sm sm:justify-start sm:pt-0" aria-label={`${r.titles} titles, ${r.finals} finals`}>
                {Array.from({ length: r.titles }, (_, k) => (
                  <span key={`t${k}`} className="text-phos glow-phos">★</span>
                ))}
                {Array.from({ length: r.finals - r.titles }, (_, k) => (
                  <span key={`f${k}`} className="text-sig">◇</span>
                ))}
                {r.finals === 0 && <span className="text-faint">—</span>}
              </span>
              <span className="col-span-2 col-start-2 text-sm leading-snug text-zinc-400 sm:col-span-1 sm:col-start-auto">
                {r.note ?? (r.runnerUpYears.length > 1 ? `${r.runnerUpYears.length}× runner-up, still hunting the first ring` : "")}
              </span>
            </li>
          ))}
        </ol>
      </Frame>

      <Rule label="Franchise arcs // tracked" right={`${intel.franchises.length} files`} />
      <ul className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {intel.franchises.map((f, i) => {
          const hits = archiveHits(f);
          const st = trailStats(f);
          const op = boardInvolving(f.teamId);
          const tone = i % 2 ? "sig" : "phos";
          const span = [...intel.champions.map((c) => c.year)].sort((a, b) => a - b);
          return (
            <Frame key={f.teamId} as="li" label={f.name} code={callsign(f.teamId)} meta={f.ownerLabel} tone={tone}>
              <ol className="grid grid-cols-5 gap-px bg-white/[0.06]" aria-label={`${f.name} by season`}>
                {span.map((y) => {
                  const hit = hits.find((h) => h.year === y);
                  return (
                    <li key={y} className="bg-panel p-1 text-center">
                      <span className="block font-mono text-[9.5px] tracking-wider text-faint">{y}</span>
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 items-center justify-center font-mono text-[9.5px] tracking-wider",
                          hit ? ROLE[hit.role].cell : "text-faint",
                        )}
                      >
                        {hit ? ROLE[hit.role].short : "—"}
                      </span>
                    </li>
                  );
                })}
                <li className="bg-phos/[0.06] p-1 text-center">
                  <span className="block font-mono text-[9.5px] tracking-wider text-phos">{intel.league.season}</span>
                  <span className="mt-0.5 flex h-5 items-center justify-center font-mono text-[10px] font-semibold tracking-wider text-zinc-50 tabular-nums">
                    {st.record}
                  </span>
                </li>
              </ol>

              <p className="mt-3 text-[15px] leading-relaxed text-zinc-200">{f.arc}</p>

              {hits.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {hits.map((h) => (
                    <li key={h.year} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2 text-sm leading-snug">
                      <span className={cn("font-mono text-[11px] tracking-wider", h.role === "champion" ? "text-phos" : "text-dim")}>{h.year}</span>
                      <span className="text-zinc-400">
                        {h.role === "champion" && <span className="text-zinc-200">Beat {h.runnerUp} in the final. </span>}
                        {h.role === "runner-up" && <span className="text-zinc-200">Lost the final to {h.champion}. </span>}
                        {h.note}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-dim uppercase">{intel.league.season} trail · med {st.median.toFixed(0)}</p>
                  <p className="font-mono text-[10px] tracking-wider text-faint uppercase">
                    Playoffs {f.playoffAppearancesRecent} · {f.titles} title{f.titles === 1 ? "" : "s"}
                  </p>
                </div>
                <MiniTrail franchise={f} tone={tone} />
              </div>
              {op && (
                <Link href={op.path} className="mt-2 inline-block font-mono text-[10.5px] tracking-[0.16em] text-dim uppercase hover:text-zinc-100">
                  Week {intel.league.week} op ▸
                </Link>
              )}
            </Frame>
          );
        })}
      </ul>
    </>
  );
}
