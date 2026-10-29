import type { Metadata } from "next";
import Link from "next/link";
import { DisplayName, Frame, LuckChip, PageHead, Rule, Tag } from "@/components/league/hud";
import { MiniTrail } from "@/components/league/trail";
import { cn } from "@/lib/utils";
import { callsign, getLuck, intel, teamIdByName, trailStats, weekCode } from "@/lib/intel";
import { BOARDS, boardForTeam, boardInvolving, formatRecord, getStanding, snapshot } from "@/lib/league";

export const metadata: Metadata = {
  title: "Insights",
  description: "Week 8 intel for the Chicken league: matchup dispatches, league pulse, luck index, and franchise signatures.",
};

const LUCK_SPAN = 6;

export default function InsightsPage() {
  const wk = weekCode(intel.league.week);
  const ceilings = intel.franchises
    .flatMap((f) => f.weekly2026.map((w) => ({ ...w, teamId: f.teamId, team: f.name })))
    .sort((a, b) => b.pf - a.pf)
    .slice(0, 5);

  return (
    <>
      <PageHead
        code={`INTEL-${wk} // League pulse`}
        title={`Week ${wk} intel`}
        kicker={`Read off the Chicken archive: ${intel.champions.length} champions on file, ${intel.franchises.length} tracked franchise trails, and the luck index after week ${intel.league.week - 1}.`}
      />

      <Rule label="Dispatch // this week's ops" right={`${intel.matchupBriefs.length} ops`} />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {intel.matchupBriefs.map((b) => {
          const proj = intel.week8Projections[b.slug];
          const board = BOARDS.find((x) => x.slug === b.slug);
          const homeId = proj ? teamIdByName(proj.home) : undefined;
          const awayId = proj ? teamIdByName(proj.away) : undefined;
          return (
            <Frame
              key={b.slug}
              as="article"
              label={homeId && awayId ? `${callsign(awayId)} @ ${callsign(homeId)}` : "Dispatch"}
              code={`OP-${weekCode(b.week)}`}
              meta={board ? `${board.manager}` : undefined}
              tone="phos"
            >
              <h3 className="mb-3 font-display text-xl leading-tight font-semibold tracking-wide text-zinc-50 uppercase">
                <DisplayName text={b.title} />
              </h3>
              {proj && homeId && awayId && (
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-dashed border-white/10 pb-3 font-mono tabular-nums">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[11px] tracking-wider text-dim">{callsign(homeId)}</span>
                    <span className={cn("text-2xl", proj.homeProj >= proj.awayProj ? "text-phos glow-phos" : "text-zinc-400")}>
                      {proj.homeProj.toFixed(1)}
                    </span>
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-faint">PROJ</span>
                  <span className="flex items-baseline gap-2">
                    <span className={cn("text-2xl", proj.awayProj > proj.homeProj ? "text-phos glow-phos" : "text-zinc-400")}>
                      {proj.awayProj.toFixed(1)}
                    </span>
                    <span className="text-[11px] tracking-wider text-dim">{callsign(awayId)}</span>
                  </span>
                </div>
              )}
              <p className="text-[15px] leading-relaxed text-zinc-200">{b.story}</p>
              <p className="mt-3 text-sm leading-snug text-zinc-400">
                <span className="font-mono text-[10px] tracking-[0.18em] text-hot uppercase">Must-win · </span>
                {b.mustWin}
              </p>
              {board && (
                <Link
                  href={board.path}
                  className="mt-4 inline-flex h-9 items-center gap-2 px-3 font-mono text-[11px] tracking-[0.18em] text-phos uppercase ring-1 ring-phos/40 ring-inset transition-colors hover:bg-phos/10"
                >
                  Open op board ▸
                </Link>
              )}
            </Frame>
          );
        })}
      </div>

      <Rule label="Pulse // league signals" right={`${intel.leaguePulse.length} items`} />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {intel.leaguePulse.map((p, i) => (
          <Frame
            key={p.title}
            as="li"
            tone={p.tone === "alert" ? "phos" : "sig"}
            label={p.tone === "alert" ? "Alert" : "Signal"}
            code={`P-${String(i + 1).padStart(2, "0")}`}
          >
            <p className="font-display text-xl leading-tight font-semibold tracking-wide text-zinc-50 uppercase">
              <DisplayName text={p.title} />
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
          </Frame>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-5">
        <Frame label="Luck index" code="LCK" meta="PF rank − win rank">
          <ol className="grid gap-3">
            {intel.luckIndex.map((l) => {
              const pct = (Math.min(LUCK_SPAN, Math.abs(l.luckDelta)) / LUCK_SPAN) * 50;
              const tone = l.luckDelta > 0 ? "phos" : l.luckDelta < 0 ? "sig" : "dim";
              const name = getStanding(l.teamId)?.teamName ?? l.team;
              return (
                <li key={l.teamId}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="w-8 shrink-0 font-mono text-[10.5px] tracking-wider text-faint">{callsign(l.teamId)}</span>
                      <span className="truncate text-sm text-zinc-200">{name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] tracking-wider text-dim tabular-nums">
                      {l.record} · PF{l.pfRank} W{l.winRank}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-[minmax(0,1fr)_3.25rem] items-center gap-2">
                    <div className="relative h-3 border border-white/[0.07] bg-ink" aria-hidden>
                      <span className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
                      {l.luckDelta !== 0 && (
                        <span
                          className={cn("absolute inset-y-0.5", tone === "phos" ? "left-1/2 bg-phos" : "right-1/2 bg-sig")}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                    <LuckChip row={l} />
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-white/[0.06] pt-3 font-mono text-[10.5px] leading-relaxed tracking-wide text-dim">
            <span className="text-phos">HOT</span> record is outrunning scoring. <span className="text-sig">DUE</span> scoring better than
            the record shows; first in line if variance evens out.
          </p>
        </Frame>

        <div className="grid content-start gap-4 lg:gap-5">
          <Frame label="Ceiling board" code="CEIL" meta="Top 5 weeks">
            <ol className="grid gap-px bg-white/[0.05]">
              {ceilings.map((c, i) => (
                <li key={`${c.teamId}-${c.week}`} className="grid grid-cols-[1.5rem_2.5rem_minmax(0,1fr)_auto] items-center gap-2 bg-panel py-2">
                  <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                  <Tag tone={i === 0 ? "phos" : "dim"} className="justify-center px-1">
                    {callsign(c.teamId)}
                  </Tag>
                  <span className="min-w-0 truncate font-mono text-[11px] tracking-wide text-dim uppercase">
                    W{c.week} v {c.opp} · {c.result}
                  </span>
                  <span className={cn("font-mono text-lg tabular-nums", i === 0 ? "text-phos glow-phos" : "text-zinc-100")}>
                    {c.pf.toFixed(2)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 font-mono text-[10.5px] tracking-wide text-faint">
              Across the {intel.franchises.map((f) => callsign(f.teamId)).join(", ")} weekly trails, weeks 1–{intel.league.week - 1}.
            </p>
          </Frame>

          <Frame label="Threat board" code="THR" meta="Power order" tone="sig">
            <ol className="grid gap-3">
              {snapshot.insights.power.map((p, i) => {
                const id = teamIdByName(p.team);
                const s = id ? getStanding(id) : undefined;
                const luck = id ? getLuck(id) : undefined;
                const board = id ? boardForTeam(id) : undefined;
                return (
                  <li key={p.team} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2.5">
                    <span className={cn("font-display text-3xl leading-none font-bold", i === 0 ? "text-sig glow-sig" : "text-faint")}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight font-semibold tracking-wide text-zinc-50 uppercase">
                        {board ? (
                          <Link href={board.path} className="underline decoration-sig/50 underline-offset-4">
                            <DisplayName text={p.team} />
                          </Link>
                        ) : (
                          <DisplayName text={p.team} />
                        )}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-zinc-400">{p.why}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {s && <Tag>{formatRecord(s)}</Tag>}
                        {s && <Tag>Seed {s.playoffSeed}</Tag>}
                        {luck && <LuckChip row={luck} />}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Frame>
        </div>
      </div>

      <Rule label="Signatures // tracked franchises" right="2026 trail" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {intel.franchises.map((f, i) => {
          const st = trailStats(f);
          const board = boardInvolving(f.teamId);
          const tone = i % 2 ? "sig" : "phos";
          return (
            <Frame key={f.teamId} as="li" label={f.name} code={callsign(f.teamId)} meta={f.ownerLabel} tone={tone}>
              <div className="flex items-center justify-between gap-3">
                <MiniTrail franchise={f} tone={tone} className="h-10 w-36" />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[10.5px] tracking-wider uppercase">
                  <dt className="text-faint">Rec</dt>
                  <dd className="text-right text-zinc-200 tabular-nums">{st.record}</dd>
                  <dt className="text-faint">Med</dt>
                  <dd className="text-right text-zinc-200 tabular-nums">{st.median.toFixed(1)}</dd>
                  <dt className="text-faint">High</dt>
                  <dd className={cn("text-right tabular-nums", tone === "phos" ? "text-phos" : "text-sig")}>{st.high.pf.toFixed(1)}</dd>
                </dl>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{f.signature}</p>
              {board && (
                <Link href={board.path} className="mt-2 inline-block font-mono text-[10.5px] tracking-[0.16em] text-dim uppercase hover:text-zinc-100">
                  Op board ▸
                </Link>
              )}
            </Frame>
          );
        })}
      </ul>

      <p className="font-mono text-[10px] tracking-wider text-faint uppercase">{snapshot.displayNote}</p>
    </>
  );
}
