import Link from "next/link";
import { ArrowDownRight, ArrowLeftRight, ArrowRight, ArrowUpRight, Ban, Gavel, Handshake, Megaphone, Minus, Recycle, Repeat, Scissors, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { team, teamPath } from "@/lib/league";
import {
  assetLabel,
  COUNTS,
  EARLY_WEEKS,
  GRADE_STEPS,
  shortDate,
  SUPERLATIVES,
  teamTrades,
  tp,
  tradeDate,
  TRADES,
  TRADES_LABEL,
  type Asset,
  type Grade,
  type Outlook,
  type Trade,
  type TradeSide,
} from "@/lib/trades";
import * as roast from "@/lib/roast";
import { Eyebrow, Roast, RoastCard } from "./h2h";
import { Card, Pill, SectionHeading, Stat, TeamAvatar } from "./ui";

const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${tp(Math.abs(v))}`;
const names = (ids: number[]) => ids.map((id) => team(id).name).join(" & ");

function gradeTone(g: Grade) {
  if (g.startsWith("A")) return "bg-turf text-white";
  if (g.startsWith("B")) return "bg-sky-600 text-white";
  if (g.startsWith("C")) return "bg-amber-500 text-white";
  if (g === "INC") return "bg-slate-200 text-slate-600";
  return "bg-loss text-white";
}

export function GradeBadge({ grade, early, className }: { grade: Grade; early?: boolean; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl font-display font-extrabold", grade === "INC" ? "text-xs" : "text-xl", gradeTone(grade), className)}
      aria-label={grade === "INC" ? "Grade: incomplete" : `Grade: ${grade}${early ? ", early" : ""}`}
      title={early ? "Early grade" : undefined}
    >
      {grade}
      {early && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-navy px-1 text-[8px] leading-3.5 font-bold tracking-wide text-white uppercase">early</span>}
    </span>
  );
}

function AssetItem({ a }: { a: Asset }) {
  if (a.kind === "pick")
    return (
      <li className="text-sm leading-snug text-slate-700">
        <span className="font-semibold">{assetLabel(a)}</span>
      </li>
    );
  return (
    <li className="text-sm leading-snug text-slate-700">
      <span className="font-semibold">{a.name}</span>{" "}
      <span className="text-xs text-slate-500">
        {a.position}
        {a.nflTeam && ` · ${a.nflTeam}`}
      </span>
    </li>
  );
}

const VERDICT = {
  "paying-off": { label: "Paying off", icon: TrendingUp, tone: "turf" },
  even: { label: "Even", icon: Minus, tone: "slate" },
  backfiring: { label: "Backfiring", icon: TrendingDown, tone: "loss" },
} as const;

export function VerdictPill({ verdict }: { verdict: Outlook["verdict"] }) {
  const v = VERDICT[verdict];
  return (
    <Pill tone={v.tone}>
      <v.icon className="size-3.5" aria-hidden />
      {v.label}
    </Pill>
  );
}

export function ValueChange({ change }: { change: number }) {
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : ArrowRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", change > 0 ? "text-turf" : change < 0 ? "text-loss" : "text-slate-500")}>
      <Icon className="size-3.5" aria-hidden />
      <span>
        {signed(change)}
        <span className="sr-only">{change > 0 ? " value up" : change < 0 ? " value down" : " value unchanged"}</span>
      </span>
    </span>
  );
}

function OutlookRow({ o }: { o: Outlook }) {
  return (
    <div className="mt-2 border-t border-line pt-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <VerdictPill verdict={o.verdict} />
        {o.valueChange != null && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            Value since the deal <ValueChange change={o.valueChange} />
          </span>
        )}
      </div>
      {(o.ppgBefore != null || o.ppgAfter != null || o.restOfSeason != null) && (
        <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
          {o.ppgBefore != null && o.ppgAfter != null && (
            <div className="flex gap-1">
              <dt>PPG</dt>
              <dd className="font-semibold text-slate-700 tabular-nums">
                {tp(o.ppgBefore)} → {tp(o.ppgAfter)}
              </dd>
            </div>
          )}
          {o.restOfSeason != null && (
            <div className="flex gap-1">
              <dt>Rest of season</dt>
              <dd className="font-semibold text-slate-700 tabular-nums">{tp(o.restOfSeason)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function SideBlock({ s, early, mine }: { s: TradeSide; early: boolean; mine?: boolean }) {
  const t = team(s.teamId);
  return (
    <div className={cn("min-w-0 rounded-xl p-3 ring-1", mine ? "bg-turf-light/40 ring-green-100" : "bg-slate-50 ring-line")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamAvatar teamId={t.id} size="sm" />
          <Link href={teamPath(t.id)} className="min-w-0 text-sm leading-tight font-semibold break-words text-navy hover:underline">
            {t.name}
          </Link>
        </div>
        <GradeBadge grade={s.grade} early={early && s.grade !== "INC"} />
      </div>
      <p className="mt-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Got</p>
      {s.got.length ? (
        <ul className="mt-0.5 grid gap-0.5">
          {s.got.map((a) => (
            <AssetItem key={assetLabel(a)} a={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 text-sm text-slate-500">Nothing ESPN recorded</p>
      )}
      {s.points != null && (
        <p className="mt-2 text-xs text-slate-500">
          Points for them since: <span className="font-semibold text-slate-700 tabular-nums">{tp(s.points)}</span>
        </p>
      )}
      {s.outlook && <OutlookRow o={s.outlook} />}
    </div>
  );
}

function weeksText(span: [number, number]) {
  return span[0] === span[1] ? `week ${span[0]}` : `weeks ${span[0]}–${span[1]}`;
}

function partlyKnown(t: Trade) {
  const [a, b] = t.sides;
  if (t.known === "partial") return "Partly known: ESPN didn't list the pieces, so the pick swap is rebuilt from the 2026 draft board.";
  return `Partly known: ESPN only logged ${team(a.teamId).name}. ${team(b.teamId).name} as the partner and the pick swap are inferred from the 2026 draft board.`;
}

export function TradeCard({ t, focus }: { t: Trade; focus?: number }) {
  const sides = focus != null && t.sides[1].teamId === focus ? [t.sides[1], t.sides[0]] : t.sides;
  const winner = t.edge ? team(t.edge.teamId) : null;
  return (
    <Card as="li" accent={team(sides[0].teamId).color} bodyClassName="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Eyebrow icon={ArrowLeftRight}>
          Trade {t.num} · {t.weekLabel}
        </Eyebrow>
        {t.known !== "full" && <Pill tone="gold">Partly known</Pill>}
      </div>
      <p className="mt-1 text-xs text-slate-500">Accepted {tradeDate(t.acceptedAt)}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {sides.map((s) => (
          <SideBlock key={s.teamId} s={s} early={t.early} mine={focus === s.teamId} />
        ))}
      </div>

      {t.known !== "full" && <p className="mt-2 text-xs leading-snug text-slate-500">{partlyKnown(t)}</p>}
      {t.released.length > 0 && (
        <p className="mt-2 text-xs leading-snug text-slate-500">
          Released in the deal: {t.released.map((p) => `${p.name} (${p.position})`).join(", ")}
        </p>
      )}

      <div className="mt-3 rounded-xl bg-navy/[0.04] px-3 py-2 text-sm leading-snug text-slate-700 ring-1 ring-navy/10">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Who won it so far
          {t.early && <Pill tone="sky" className="h-5 px-2 text-[10px] tracking-normal normal-case">Early: {t.weeksCounted === 1 ? "1 week" : `${t.weeksCounted} weeks`} of data</Pill>}
        </p>
        {t.span && winner ? (
          <p className="mt-0.5">
            <span className="font-semibold text-navy">{winner.name}</span>, by <span className="font-semibold tabular-nums">{tp(t.edge!.points)}</span> points ({weeksText(t.span)}).
          </p>
        ) : t.span ? (
          <p className="mt-0.5">Dead even so far ({weeksText(t.span)}).</p>
        ) : (
          <p className="mt-0.5">No points to compare: draft picks only.</p>
        )}
      </div>

      <div className="mt-auto pt-3">
        <Roast className="">{roast.tradeLine(t)}</Roast>
      </div>
    </Card>
  );
}

function Chain({ path }: { path: number[] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-snug text-slate-600">
      {path.map((id, i) => (
        <span key={`${id}-${i}`} className="inline-flex min-w-0 items-center gap-1">
          {i > 0 && <span className="text-slate-400">→</span>}
          <Link href={teamPath(id)} className="font-semibold text-slate-700 hover:underline">
            {team(id).name}
          </Link>
        </span>
      ))}
    </p>
  );
}

function Ranked({ rows, unit }: { rows: { id: number; n: number }[]; unit: string }) {
  return (
    <ol className="grid gap-1">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 text-sm">
          <TeamAvatar teamId={r.id} size="sm" className="size-5 text-[7px]" />
          <Link href={teamPath(r.id)} className="min-w-0 flex-1 truncate text-slate-700 hover:underline">
            {team(r.id).name}
          </Link>
          <span className="shrink-0 font-semibold text-navy tabular-nums">
            {r.n}
            <span className="sr-only"> {unit}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function TradeSuperlatives() {
  const S = SUPERLATIVES;
  const active = S.mostActive;
  const sent = S.offersSent;
  const neg = S.negotiated;
  const veto = S.vetoVotes;
  const fastest = S.hotPotatoes[0];
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RoastCard icon={Handshake} label="Most active trader" tone="gold" accent={team(active.id).color} value={`${active.n} of ${COUNTS.accepted}`} line={roast.mostActiveLine(active.id, active.n, COUNTS.accepted)}>
        <p className="text-sm font-semibold text-navy">{team(active.id).name}</p>
        <p className="text-xs text-slate-500">accepted trades this season</p>
      </RoastCard>

      <RoastCard icon={Megaphone} label="Most offers sent" accent={team(sent[0].id).color} value={sent[0].n} line={roast.offersSentLine(sent[0].id, sent[0].n)}>
        <Ranked rows={sent.slice(0, 3)} unit="offers" />
        <p className="mt-1.5 text-xs text-slate-500">
          Counts only. {S.offersWithKnownSender} of {COUNTS.offers} offers have a known sender.
        </p>
      </RoastCard>

      {neg && (
        <RoastCard icon={Repeat} label="Most negotiated pair" accent={team(neg.ids[0]).color} value={neg.offers} line={roast.negotiatedLine(neg.ids[0], neg.ids[1], neg.offers, neg.trades)}>
          <p className="text-sm font-semibold break-words text-navy">{names(neg.ids)}</p>
          <p className="text-xs text-slate-500">
            offers between them · {neg.trades} accepted
          </p>
        </RoastCard>
      )}

      <RoastCard icon={Gavel} label="Veto votes logged" value={COUNTS.vetoVotes} line={roast.vetoLine(veto[0].id, veto[0].n)}>
        <Ranked rows={veto.slice(0, 3)} unit="veto votes logged" />
        <p className="mt-1.5 text-xs leading-snug text-slate-500">
          ESPN logs one team per veto row and doesn&apos;t say whether that team cast it, so these aren&apos;t proof of who voted. Every trade on this page still went through.
        </p>
      </RoastCard>

      {fastest && (
        <RoastCard icon={Recycle} label="Player hot potato" tone="loss" value={`${fastest.days} days`} line={roast.hotPotatoLine(fastest.name, fastest.days, fastest.path.length)}>
          <ul className="grid gap-2">
            {S.hotPotatoes.map((h) => (
              <li key={h.name}>
                <p className="text-sm font-semibold text-navy">
                  {h.name} <span className="text-xs font-medium text-slate-500">· {h.days} days</span>
                </p>
                <Chain path={h.path} />
              </li>
            ))}
          </ul>
        </RoastCard>
      )}

      {S.tradeAndCut && (
        <RoastCard icon={Scissors} label="Trade-and-cut" tone="loss" accent={team(S.tradeAndCut.side.teamId).color} value={tp(0)} line={roast.tradeAndCutLine()}>
          <p className="text-sm leading-snug text-slate-700">{S.tradeAndCut.note}</p>
          <p className="mt-1 text-xs text-slate-500">Points the trade got {team(S.tradeAndCut.side.teamId).name}</p>
        </RoastCard>
      )}

      {S.fleece && (
        <RoastCard icon={Trophy} label="Biggest win so far" tone="turf" accent={team(S.fleece.edge!.teamId).color} value={`+${tp(S.fleece.edge!.points)}`} valueClassName="text-turf" line={roast.fleeceLine(S.fleece)}>
          <p className="text-sm font-semibold text-navy">{team(S.fleece.edge!.teamId).name}</p>
          <p className="text-xs text-slate-500">
            Trade {S.fleece.num}, accepted {shortDate(S.fleece.acceptedAt)} · points edge
          </p>
        </RoastCard>
      )}

      <RoastCard icon={Ban} label="Repeat customers" value={`${S.distinctPairs} pairs`} line={roast.noRepeatLine(COUNTS.accepted, S.distinctPairs)}>
        <p className="text-sm text-slate-700">
          {COUNTS.accepted} accepted trades, {S.distinctPairs} different pairs of teams. {COUNTS.accepted === S.distinctPairs ? "No pair has traded twice." : null}
        </p>
      </RoastCard>
    </ul>
  );
}

export function GradeKey() {
  const steps = GRADE_STEPS.map((s, i) => {
    const prev = GRADE_STEPS[i - 1];
    return `${s.grade} ${prev ? `${signed(s.min)} to ${signed(prev.min)}` : `${signed(s.min)} or more`}`;
  });
  return (
    <Card title="How the grades work">
      <p className="text-sm leading-relaxed text-slate-600">
        Each side gets every fantasy point its new players scored for it, started or benched, from the first week after the trade through the last completed week, minus
        what the other side got the same way, divided by the weeks counted. Weeks after a player left are not counted.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Per-week edge: {steps.join(" · ")} · D below that. F means the side got zero points from its new players while the other side scored. INC: draft picks only, no points
        to compare. Grades covering {EARLY_WEEKS} weeks or fewer are tagged early.
      </p>
    </Card>
  );
}

export function TeamTradesSection({ teamId }: { teamId: number }) {
  const s = teamTrades(teamId);
  const fav = s.favorite;
  return (
    <>
      <SectionHeading title="Trades" action={TRADES_LABEL} />
      <Card className="-mt-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Stat label="Accepted trades" value={s.trades.length} sub={`of ${TRADES.length} in the league`} />
          <Stat label="Offers sent" value={s.offersSent} />
          <Stat label="Offers received" value={s.offersReceived} />
          <Stat
            label="Net points"
            value={s.trades.length ? signed(s.net) : "—"}
            valueClassName={s.net > 0 ? "text-turf" : s.net < 0 ? "text-loss" : undefined}
            sub={s.trades.length ? "from players traded for" : undefined}
          />
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{fav?.basis === "offers" ? "Most offers exchanged with" : "Favorite trading partner"}</p>
          {fav ? (
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="flex shrink-0 -space-x-1.5">
                {fav.teamIds.map((id) => (
                  <TeamAvatar key={id} teamId={id} size="sm" className="ring-2 ring-white" />
                ))}
              </span>
              <div className="min-w-0 text-sm leading-tight">
                <p className="font-semibold break-words text-navy">
                  {fav.teamIds.map((id, i) => (
                    <span key={id}>
                      {i > 0 && <span className="font-medium text-slate-500"> & </span>}
                      <Link href={teamPath(id)} className="hover:underline">
                        {team(id).name}
                      </Link>
                    </span>
                  ))}
                  {fav.teamIds.length > 1 && <span className="font-medium text-slate-500"> (tied)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {fav.basis === "trades" ? `${fav.trades} ${fav.trades === 1 ? "trade" : "trades"} · ` : "No accepted trades yet · "}
                  {fav.offers} {fav.offers === 1 ? "offer" : "offers"} exchanged
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Nobody yet. Not a single offer either way.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">Offer counts only; the contents of pending or declined offers stay private.</p>
      </Card>

      {s.trades.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {s.trades.map((t) => (
            <TradeCard key={t.id} t={t} focus={teamId} />
          ))}
        </ul>
      ) : (
        <p className="-mt-1 text-sm text-slate-500">No accepted trades for {team(teamId).name} this season.</p>
      )}
      <Link href="/trades" className="-mt-2 text-sm font-semibold text-turf hover:underline">
        All {TRADES_LABEL} →
      </Link>
    </>
  );
}
