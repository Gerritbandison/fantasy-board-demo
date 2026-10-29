import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Ban,
  ChevronDown,
  Fish,
  Flame,
  Gavel,
  Handshake,
  Megaphone,
  Minus,
  Recycle,
  Repeat,
  Scissors,
  Siren,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { team, teamPath } from "@/lib/league";
import { teamThen } from "@/lib/h2h";
import {
  ALL_TIME,
  assetLabel,
  bySeason,
  COUNTS,
  CURRENT,
  longDate,
  PAST_GRADING,
  pastOutcome,
  pickSwapsFor,
  SEASONS_LABEL,
  shortDate,
  SUPERLATIVES,
  teamTrades,
  tp,
  tradeDate,
  TRADE_SEASON,
  TRADES,
  tv,
  UNKNOWN_SEASONS,
  VALUES_FETCHED,
  verdictWinner,
  windowLabel,
  type Asset,
  type PastOutcome,
  type PlayerTrend,
  type QuietWeek,
  type SideGrade,
  type Trade,
  type TradeSide,
  type Verdict,
} from "@/lib/trades";
import * as roast from "@/lib/roast";
import { Eyebrow, Roast, RoastCard } from "./h2h";
import { Card, Pill, Stat, TeamAvatar } from "./ui";

const sign = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "");
const signed = (v: number) => `${sign(v)}${tp(Math.abs(v))}`;
const signedValue = (v: number) => `${sign(v)}${tv(v)}`;
const signedPct = (v: number) => `${sign(v)}${Math.abs(v)}%`;
const tone = (v: number) => (v > 0 ? "text-turf" : v < 0 ? "text-loss" : "text-slate-700");
/** A team page opened on its Trades tab. */
const tradesPath = (id: number) => `${teamPath(id)}#trades`;
const names = (ids: number[]) => ids.map((id) => team(id).name).join(" & ");
const weeksText = (span: [number, number]) => (span[0] === span[1] ? `week ${span[0]}` : `weeks ${span[0]}–${span[1]}`);
const capitalize = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

const VERDICT = {
  "paying-off": { label: "Paying off", icon: TrendingUp, tone: "turf" },
  even: { label: "Even", icon: Minus, tone: "slate" },
  backfiring: { label: "Backfiring", icon: TrendingDown, tone: "loss" },
} as const;

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <Pill tone={v.tone}>
      <v.icon className="size-3.5" aria-hidden />
      {v.label}
    </Pill>
  );
}

const OUTCOME = {
  won: { label: "Won", icon: TrendingUp, tone: "turf" },
  lost: { label: "Lost", icon: TrendingDown, tone: "loss" },
  even: { label: "Even", icon: Minus, tone: "slate" },
  "too-little-data": { label: "Too little data", icon: Minus, tone: "slate" },
} as const;

/** A past-season side's points-only result; `lopsided` marks a win or loss by the lopsided margin. */
export function OutcomePill({ outcome, lopsided }: { outcome: PastOutcome; lopsided?: boolean }) {
  const o = OUTCOME[outcome];
  return (
    <Pill tone={o.tone}>
      <o.icon className="size-3.5" aria-hidden />
      {lopsided && (outcome === "won" || outcome === "lost") ? `${o.label} big` : o.label}
    </Pill>
  );
}

export function ConfidencePill({ confidence, weeks }: { confidence: string; weeks: number }) {
  return (
    <Pill tone={confidence === "low" ? "sky" : confidence === "medium" ? "gold" : "turf"} className="h-5 px-2 text-[10px] tracking-normal normal-case">
      {capitalize(confidence)} confidence · {weeks === 1 ? "1 week" : `${weeks} weeks`} of data
    </Pill>
  );
}

export function ValueChange({ change, className }: { change: number; className?: string }) {
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : ArrowRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums", tone(change), className)}>
      <Icon className="size-3.5" aria-hidden />
      <span>
        {signedValue(change)}
        <span className="sr-only">{change > 0 ? " value up" : change < 0 ? " value down" : " value unchanged"}</span>
      </span>
    </span>
  );
}

const QUIET: { [k in QuietWeek["kind"]]: string } = { bye: "Bye", out: "Out", "zero-stat": "Zero-stat game" };

function quietLabels(quiet: QuietWeek[]) {
  return (Object.keys(QUIET) as QuietWeek["kind"][]).flatMap((kind) => {
    const weeks = quiet.filter((q) => q.kind === kind).map((q) => q.week);
    return weeks.length ? [`${QUIET[kind]} wk${weeks.length > 1 ? "s" : ""} ${weeks.join(", ")}`] : [];
  });
}

function TrendLine({ tr }: { tr: PlayerTrend }) {
  const labels = quietLabels(tr.quiet);
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
      <span>
        <span className="font-semibold text-slate-700 tabular-nums">{tp(tr.points)}</span> pts for them
      </span>
      {(tr.ppgBefore != null || tr.ppgAfter != null) && (
        <span className="tabular-nums">
          PPG {tr.ppgBefore != null ? tp(tr.ppgBefore) : "—"} → {tr.ppgAfter != null ? tp(tr.ppgAfter) : "—"}
        </span>
      )}
      {tr.valueNow != null && <span className="tabular-nums">Value {tv(tr.valueNow)}</span>}
      {labels.map((l) => (
        <span key={l} className="rounded bg-slate-200/70 px-1.5 text-[11px] leading-4.5 font-semibold text-slate-600">
          {l}
        </span>
      ))}
      {tr.status.kind === "released" && <span className="rounded bg-red-50 px-1.5 text-[11px] leading-4.5 font-semibold text-red-700">Released</span>}
      {tr.status.kind === "flipped" && (
        <span className="rounded bg-amber-50 px-1.5 text-[11px] leading-4.5 font-semibold text-amber-800">Flipped in Trade {tr.status.tradeNum}</span>
      )}
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
      {a.trend && <TrendLine tr={a.trend} />}
    </li>
  );
}

function Figure({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{label}</dt>
      <dd className="text-sm leading-snug font-semibold text-slate-700 tabular-nums">{children}</dd>
      {sub && <dd className="text-[11px] leading-snug text-slate-500">{sub}</dd>}
    </div>
  );
}

function SideFigures({ g, points }: { g: SideGrade; points: number | null }) {
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-2">
      <Figure label="Points for them" sub={<span className={tone(g.pointsGained)}>{signed(g.pointsGained)} vs what they sent</span>}>
        {points != null ? tp(points) : "—"}
      </Figure>
      <Figure label="Value got vs sent" sub={g.valueReceivedAll !== g.valueReceived ? `${tv(g.valueReceivedAll)} counting released players` : "rest of season"}>
        {tv(g.valueReceived)} vs {tv(g.valueSent)}
      </Figure>
      <Figure label="Value edge">
        <span className={tone(g.valueEdge)}>
          {signedValue(g.valueEdge)} ({signedPct(g.valueEdgePct)})
        </span>
      </Figure>
      <Figure
        label="Value since trade"
        sub={g.valueChange ? `got ${signedValue(g.valueChange.received)}, sent ${signedValue(g.valueChange.sent)} (approx.)` : null}
      >
        {g.valueChange ? (
          <ValueChange change={g.valueChange.net} />
        ) : (
          <span className="text-xs leading-snug font-medium text-slate-500">Value at trade date unavailable</span>
        )}
      </Figure>
      {!g.valueChange && (g.ppgTrendReceived != null || g.ppgTrendSent != null) && (
        <div className="col-span-2 text-[11px] leading-snug text-slate-500">
          PPG trend since the deal (after minus before, summed):{" "}
          {g.ppgTrendReceived != null && (
            <>
              got <span className={cn("font-semibold tabular-nums", tone(g.ppgTrendReceived))}>{signed(g.ppgTrendReceived)}</span>
            </>
          )}
          {g.ppgTrendReceived != null && g.ppgTrendSent != null && ", "}
          {g.ppgTrendSent != null && (
            <>
              sent <span className={cn("font-semibold tabular-nums", tone(g.ppgTrendSent))}>{signed(g.ppgTrendSent)}</span>
            </>
          )}
        </div>
      )}
    </dl>
  );
}

function SideBlock({ trade, s, mine }: { trade: Trade; s: TradeSide; mine?: boolean }) {
  const t = trade.past ? teamThen(s.teamId, trade.season) : { name: team(s.teamId).name, alias: null, year: null };
  const outcome = pastOutcome(trade, s.teamId);
  return (
    <div className={cn("min-w-0 rounded-xl p-3 ring-1", mine ? "bg-turf-light/40 ring-green-100" : "bg-slate-50 ring-line")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamAvatar teamId={s.teamId} size="sm" />
          <div className="min-w-0 text-sm leading-tight">
            <Link href={tradesPath(s.teamId)} className="font-semibold break-words text-navy hover:underline">
              {t.name}
            </Link>
            {t.year != null && <span className="text-slate-500"> ({t.year})</span>}
            {t.alias && <p className="text-xs leading-snug text-slate-500">as {t.alias}</p>}
          </div>
        </div>
        {s.grade && <VerdictPill verdict={s.grade.verdict} />}
        {outcome && <OutcomePill outcome={outcome} lopsided={trade.call === "lopsided"} />}
      </div>
      <p className="mt-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Got</p>
      {s.got.length ? (
        <ul className="mt-0.5 grid gap-1.5">
          {s.got.map((a) => (
            <AssetItem key={assetLabel(a)} a={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 text-sm text-slate-500">Nothing ESPN recorded</p>
      )}
      {s.grade && <SideFigures g={s.grade} points={s.points} />}
      {trade.past && (
        <dl className="mt-2 border-t border-line pt-2">
          <Figure label="Points for them" sub={trade.span ? `${weeksText(trade.span)}, all points` : undefined}>
            {s.points != null ? tp(s.points) : "—"}
          </Figure>
        </dl>
      )}
    </div>
  );
}

/** Past seasons: who won on points, from the file's call. */
function PastVerdict({ t }: { t: Trade }) {
  const span = t.span ? ` (${weeksText(t.span)})` : "";
  if (t.call === "too-little-data") return <p className="mt-0.5">Too little data: the deal had one week left to count{span}.</p>;
  if (t.call === "even" || !t.edge) return <p className="mt-0.5">Even: within {tp(t.edge?.points ?? 0)} points{span}.</p>;
  return (
    <p className="mt-0.5">
      {t.call === "lopsided" ? "Lopsided: " : ""}
      <span className="font-semibold text-navy">{team(t.edge.teamId).name}</span> won it by{" "}
      <span className="font-semibold text-turf tabular-nums">{tp(t.edge.points)} points</span>
      {span}.
    </p>
  );
}

function partlyKnown(t: Trade) {
  const [a, b] = t.sides;
  if (t.known === "partial") return "Partly known: ESPN didn't list the pieces, so the pick swap is rebuilt from the 2026 draft board.";
  return `Partly known: ESPN only logged ${team(a.teamId).name}. ${team(b.teamId).name} as the partner and the pick swap are inferred from the 2026 draft board.`;
}

function Verdicts({ t }: { t: Trade }) {
  if (t.ungraded) return <p className="mt-0.5">Not graded. {t.ungraded}</p>;
  const v = verdictWinner(t);
  if (!v) return <p className="mt-0.5">Even for both sides so far{t.span ? ` (${weeksText(t.span)})` : ""}.</p>;
  const g = v.win.grade!;
  return (
    <>
      <p className="mt-0.5">
        {VERDICT[g.verdict].label} for <span className="font-semibold text-navy">{team(v.win.teamId).name}</span>, {VERDICT[v.lose.grade!.verdict].label.toLowerCase()} for{" "}
        <span className="font-semibold text-navy">{team(v.lose.teamId).name}</span>.
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        <span className={cn("font-semibold tabular-nums", tone(g.valueEdge))}>
          {signedValue(g.valueEdge)} value ({signedPct(g.valueEdgePct)})
        </span>
        ;{" "}
        <span className={cn("font-semibold tabular-nums", tone(g.pointsGained))}>{signed(g.pointsGained)} points</span>
        {t.span && ` (${weeksText(t.span)})`}.{g.mixedSignals && " Value and points disagree; value decides."}
      </p>
    </>
  );
}

export function TradeCard({ t, focus }: { t: Trade; focus?: number }) {
  const sides = focus != null && t.sides[1].teamId === focus ? [t.sides[1], t.sides[0]] : t.sides;
  return (
    <Card as="li" accent={team(sides[0].teamId).color} bodyClassName="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Eyebrow icon={ArrowLeftRight}>
          Trade {t.num} · {t.weekLabel}
        </Eyebrow>
        {(t.known === "partial" || t.known === "inferred") && <Pill tone="gold">Partly known</Pill>}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {t.acceptedAt ? `Accepted ${tradeDate(t.acceptedAt)}` : t.window ? `Went through ${windowLabel(t.window)}` : `${t.season} season`}
      </p>

      <div className="mt-3 rounded-xl bg-navy/[0.04] px-3 py-2 text-sm leading-snug text-slate-700 ring-1 ring-navy/10">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {t.past ? "Who won it" : "Who won it so far"}
          {t.confidence && <ConfidencePill confidence={t.confidence} weeks={t.weeksOfData} />}
        </p>
        {t.past ? <PastVerdict t={t} /> : <Verdicts t={t} />}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {sides.map((s) => (
          <SideBlock key={s.teamId} trade={t} s={s} mine={focus === s.teamId} />
        ))}
      </div>

      {(t.known === "partial" || t.known === "inferred") && <p className="mt-2 text-xs leading-snug text-slate-500">{partlyKnown(t)}</p>}
      {t.released.length > 0 && (
        <p className="mt-2 text-xs leading-snug text-slate-500">
          Released in the deal: {t.released.map((p) => `${p.name} (${p.position})`).join(", ")}
        </p>
      )}

      <div className="mt-auto pt-3">
        <Roast className="">{roast.tradeLine(t)}</Roast>
      </div>
    </Card>
  );
}

/** FantasyCalc credit and the one-line method note. */
export function ValuesCredit({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-snug text-slate-500", className)}>
      <a href="https://www.fantasycalc.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-turf hover:underline">
        Values: FantasyCalc redraft{VALUES_FETCHED && `, fetched ${longDate(VALUES_FETCHED)}`}
      </a>
      . Value matters more than points, and early trades are low confidence.
    </p>
  );
}

/** Teams in trade order; `null` marks a gap where the player left by some other route (dropped, kept, drafted). */
function Chain({ path }: { path: (number | null)[] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs leading-snug text-slate-600">
      {path.map((id, i) =>
        id == null ? (
          <span key={`gap-${i}`} className="text-slate-400" title="Left by another route before the next trade">
            · · ·
          </span>
        ) : (
          <span key={`${id}-${i}`} className="inline-flex min-w-0 items-center gap-1">
            {i > 0 && path[i - 1] != null && <span className="text-slate-400">→</span>}
            <Link href={tradesPath(id)} className="font-semibold text-slate-700 hover:underline">
              {team(id).name}
            </Link>
          </span>
        ),
      )}
    </p>
  );
}

/** A player's trades as a chain, with a gap wherever one deal's receiver isn't the next deal's sender. */
function movePath(moves: { from: number; to: number }[]) {
  const path: (number | null)[] = [moves[0].from];
  for (const m of moves) {
    if (path[path.length - 1] !== m.from) path.push(null, m.from);
    path.push(m.to);
  }
  return path;
}

function Ranked({ rows, unit }: { rows: { id: number; n: number }[]; unit: string }) {
  return (
    <ol className="grid gap-1">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 text-sm">
          <TeamAvatar teamId={r.id} size="sm" className="size-5 text-[7px]" />
          <Link href={tradesPath(r.id)} className="min-w-0 flex-1 truncate text-slate-700 hover:underline">
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
  const report = S.report[0]?.backfiring ? S.report[0] : null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RoastCard icon={Handshake} label="Most active trader" tone="gold" accent={team(active.id).color} value={`${active.n} of ${CURRENT.length}`} line={roast.mostActiveLine(active.id, active.n, CURRENT.length)}>
        <p className="text-sm font-semibold text-navy">{team(active.id).name}</p>
        <p className="text-xs text-slate-500">player trades this season</p>
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

      {S.bestValue && (
        <RoastCard
          icon={Trophy}
          label="Best value so far"
          tone="turf"
          accent={team(S.bestValue.side.teamId).color}
          value={signedValue(S.bestValue.grade.valueEdge)}
          valueClassName="text-turf"
          line={roast.bestValueLine(S.bestValue.trade, S.bestValue.side)}
        >
          <p className="text-sm font-semibold break-words text-navy">{team(S.bestValue.side.teamId).name}</p>
          <p className="text-xs text-slate-500">
            Trade {S.bestValue.trade.num}, accepted {shortDate(S.bestValue.trade.acceptedAt!)} · value edge {signedPct(S.bestValue.grade.valueEdgePct)} ·{" "}
            {S.bestValue.grade.confidence} confidence
          </p>
        </RoastCard>
      )}

      {report && (
        <RoastCard
          icon={Flame}
          label="Buyer's remorse"
          tone="loss"
          accent={team(report.id).color}
          value={`${report.backfiring} of ${report.trades}`}
          line={roast.reportLine(report.id, report.trades, report.backfiring, report.payingOff)}
        >
          <ul className="grid gap-1">
            {S.report.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-2 text-sm">
                <TeamAvatar teamId={r.id} size="sm" className="size-5 text-[7px]" />
                <Link href={tradesPath(r.id)} className="min-w-0 flex-1 truncate text-slate-700 hover:underline">
                  {team(r.id).name}
                </Link>
                <span className="shrink-0 text-xs tabular-nums">
                  <span className="font-semibold text-turf">{r.payingOff} paying off</span>
                  {r.even > 0 && <span className="text-slate-500"> · {r.even} even</span>}
                  <span className="text-slate-400"> · </span>
                  <span className="font-semibold text-loss">{r.backfiring} backfiring</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-slate-500">Verdicts per side, player trades only.</p>
        </RoastCard>
      )}

      <RoastCard icon={Ban} label="Repeat customers" value={`${S.distinctPairs} pairs`} line={roast.noRepeatLine(CURRENT.length, S.distinctPairs)}>
        <p className="text-sm text-slate-700">
          {CURRENT.length} player trades, {S.distinctPairs} different pairs of teams. {CURRENT.length === S.distinctPairs ? "No pair has traded twice." : null}
        </p>
      </RoastCard>
    </ul>
  );
}

function recordText(r: { won: number; lost: number; even: number }) {
  return `${r.won}-${r.lost}${r.even ? `-${r.even}` : ""}`;
}

function NetRows({ rows }: { rows: { id: number; net: number; record: { won: number; lost: number; even: number } }[] }) {
  return (
    <ol className="grid gap-1">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 text-sm">
          <TeamAvatar teamId={r.id} size="sm" className="size-5 text-[7px]" />
          <Link href={tradesPath(r.id)} className="min-w-0 flex-1 truncate text-slate-700 hover:underline">
            {team(r.id).name}
          </Link>
          <span className="shrink-0 text-xs text-slate-500 tabular-nums">{recordText(r.record)}</span>
          <span className={cn("w-16 shrink-0 text-right font-semibold tabular-nums", tone(r.net))}>{signed(r.net)}</span>
        </li>
      ))}
    </ol>
  );
}

/** The all-time cards: most active, sharks vs suckers, most-traded player, biggest heist. */
export function AllTimeTradeSuperlatives() {
  const A = ALL_TIME;
  const active = A.mostActive[0];
  const shark = A.sharks[0];
  const sucker = A.suckers[0];
  const traded = A.mostTraded[0];
  const heist = A.heist;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {active && (
        <RoastCard
          icon={Handshake}
          label="Most active trader, all-time"
          tone="gold"
          accent={team(active.id).color}
          value={active.n}
          line={roast.allTimeActiveLine(active.id, active.n, TRADES.length)}
        >
          <Ranked rows={A.mostActive} unit="player trades" />
          <p className="mt-1.5 text-xs text-slate-500">
            Player trades, {SEASONS_LABEL}. {TRADES.length} in the league.
          </p>
        </RoastCard>
      )}

      {shark && (
        <RoastCard icon={Fish} label="Sharks vs suckers" tone="turf" accent={team(shark.id).color} line={roast.sharksLine(shark.id, shark.net, sucker?.id ?? null, sucker?.net ?? null)}>
          <p className="text-[11px] font-semibold tracking-wider text-turf uppercase">Sharks</p>
          <NetRows rows={A.sharks} />
          {A.suckers.length > 0 && (
            <>
              <p className="mt-2 text-[11px] font-semibold tracking-wider text-loss uppercase">Suckers</p>
              <NetRows rows={A.suckers} />
            </>
          )}
          <p className="mt-1.5 text-xs leading-snug text-slate-500">Net points from trades, {SEASONS_LABEL}, with the 2020–2025 won-lost(-even) record on points.</p>
        </RoastCard>
      )}

      {traded && (
        <RoastCard
          icon={Users}
          label="Most-traded player"
          tone="gold"
          value={traded.moves.length}
          line={roast.mostTradedLine(traded.name, traded.moves.length, new Set(traded.moves.flatMap((m) => [m.from, m.to])).size)}
        >
          <ul className="grid gap-2">
            {A.mostTraded
              .filter((p) => p.moves.length === traded.moves.length)
              .map((p) => (
                <li key={p.name}>
                  <p className="text-sm font-semibold text-navy">
                    {p.name}{" "}
                    <span className="text-xs font-medium text-slate-500">
                      · {p.moves.length} trades, {[...new Set(p.moves.map((m) => m.trade.season))].join(", ")}
                    </span>
                  </p>
                  <Chain path={movePath(p.moves)} />
                </li>
              ))}
          </ul>
        </RoastCard>
      )}

      {heist && heist.trade.edge && (
        <RoastCard
          icon={Siren}
          label="Biggest heist"
          tone="loss"
          accent={team(heist.winner.teamId).color}
          value={`+${tp(heist.trade.edge.points)}`}
          valueClassName="text-turf"
          line={roast.heistLine(heist.trade, heist.winner.teamId, heist.loser.teamId)}
        >
          <p className="text-sm leading-snug text-slate-700">
            <span className="font-semibold text-navy">{team(heist.winner.teamId).name}</span> got{" "}
            {heist.winner.got.map((a) => (a.kind === "player" ? a.name : assetLabel(a))).join(", ")} for{" "}
            {heist.loser.got.map((a) => (a.kind === "player" ? a.name : assetLabel(a))).join(", ")}.
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {heist.trade.season}, {heist.trade.weekLabel.toLowerCase()} · {tp(heist.winner.points ?? 0)} vs {tp(heist.loser.points ?? 0)} points for the new teams
            {heist.trade.span ? `, ${weeksText(heist.trade.span)}` : ""}
          </p>
        </RoastCard>
      )}
    </ul>
  );
}

/** Confidence labels with the weeks of data each one covers, as the file assigns them. */
function confidenceScale() {
  const m = new Map<string, Set<number>>();
  for (const t of CURRENT) if (t.confidence) m.set(t.confidence, (m.get(t.confidence) ?? new Set()).add(t.weeksOfData));
  return [...m.entries()]
    .map(([c, w]) => ({ c, weeks: [...w].sort((x, y) => x - y) }))
    .sort((x, y) => x.weeks[0] - y.weeks[0])
    .map(({ c, weeks }) => `${weeks.join(" or ")} ${weeks.length === 1 && weeks[0] === 1 ? "week" : "weeks"}: ${c}`);
}

export function VerdictKey() {
  return (
    <Card title="How the verdicts work">
      <p className="text-sm leading-relaxed text-slate-600">
        Each side is paying off, even or backfiring, judged on two things. <strong className="font-semibold text-slate-700">Value edge</strong>: the FantasyCalc
        rest-of-season value of the players it got that are still on the team (or were flipped in a later trade), minus the value of the players it sent. Released players
        count 0, and within ±10% is even. <strong className="font-semibold text-slate-700">Points</strong>: every point the new players scored for it, started or benched,
        minus what the players it sent scored for the partner over the same weeks. Within ±10 is even. When the two disagree, value wins.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        FantasyCalc only publishes current values, so value since the trade is approximated from its 30-day trend for the Sep 28 trades. The later trades show &quot;value at
        trade date unavailable&quot; and the points-per-game trend instead. Per-game rates only count games actually played, so byes, games missed and zero-stat games are
        labelled and left out.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Confidence follows the weeks of data since the deal ({confidenceScale().join(" · ")}). Only player trades are listed; draft-pick-only swaps are counted but left out.
      </p>
      {PAST && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          <strong className="font-semibold text-slate-700">
            {PAST.first}–{PAST.last}
          </strong>{" "}
          deals are called on points only, with no long-term value: every point the new players scored for their new team, started or benched, from the week after the
          deal through the end of that regular season. Under {PAST_GRADING.evenUnder} points apart is even, {PAST_GRADING.lopsidedFrom} or more is lopsided, and a deal with
          one week left is too little data.
        </p>
      )}
      <ValuesCredit className="mt-3" />
    </Card>
  );
}

function verdictsText(v: { [k in Verdict]: number }) {
  const parts = [`${v["paying-off"]} paying off`, ...(v.even ? [`${v.even} even`] : []), `${v.backfiring} backfiring`];
  return v["paying-off"] + v.even + v.backfiring ? parts.join(" · ") : null;
}

function UnknownSeasons() {
  if (!UNKNOWN_SEASONS.length) return null;
  const first = UNKNOWN_SEASONS[0];
  const last = UNKNOWN_SEASONS[UNKNOWN_SEASONS.length - 1];
  return (
    <p className="rounded-xl bg-white px-3 py-2 text-xs leading-snug text-slate-500 ring-1 ring-line">
      <span className="font-semibold text-slate-700">
        {first}–{last}:
      </span>{" "}
      not on record. ESPN only serves the current season&apos;s transactions, so earlier trades are missing data, not a quiet league.
    </p>
  );
}

const PAST_SEASONS = [...new Set(TRADES.filter((t) => t.past).map((t) => t.season))].sort((x, y) => x - y);
/** The rebuilt seasons, when there are any. */
const PAST = PAST_SEASONS.length ? { first: PAST_SEASONS[0], last: PAST_SEASONS[PAST_SEASONS.length - 1] } : null;

/** The one footnote for rebuilt trades, shown once per list. */
function RebuiltNote() {
  if (!PAST) return null;
  return (
    <p className="text-xs leading-snug text-slate-500">
      {PAST.first}–{PAST.last} trades are rebuilt from weekly rosters: ESPN kept no trade log for those seasons, so dates are windows and the calls are on points only.
      Offseason and player-for-pick deals never show up in weekly rosters, so some trades are missing.
    </p>
  );
}

/** Player trades grouped by season, newest first, each season a dropdown that starts closed. */
export function TradeSeasons({ trades, focus, empty }: { trades: Trade[]; focus?: number; empty?: string }) {
  const groups = bySeason(trades);
  const net = focus != null ? new Map(teamTrades(focus).allTime.bySeason.map((r) => [r.season, r.netPoints])) : null;
  return (
    <div className="grid gap-2.5">
      {groups.length ? (
        groups.map((g) => {
          const n = net?.get(g.season) ?? null;
          return (
            <details key={g.season} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(15,30,54,0.06)] ring-1 ring-line hover:ring-slate-300 [&::-webkit-details-marker]:hidden">
                <span className="font-display text-lg leading-tight font-bold text-navy">{g.season} season</span>
                <span className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  <span className="text-right tabular-nums">
                    {g.trades.length} player {g.trades.length === 1 ? "trade" : "trades"}
                    {n != null && (
                      <>
                        {" · "}
                        <span className={cn("font-semibold", tone(n))}>{signed(n)} pts</span>
                      </>
                    )}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                </span>
              </summary>
              <ul className="mt-3 mb-2 grid gap-4 lg:grid-cols-2">
                {g.trades.map((t) => (
                  <TradeCard key={t.id} t={t} focus={focus} />
                ))}
              </ul>
            </details>
          );
        })
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
      <UnknownSeasons />
      {trades.some((t) => t.past) && <RebuiltNote />}
    </div>
  );
}

function Partner({ fav }: { fav: NonNullable<ReturnType<typeof teamTrades>["favorite"]> | null }) {
  return (
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
                  <Link href={tradesPath(id)} className="hover:underline">
                    {team(id).name}
                  </Link>
                </span>
              ))}
              {fav.teamIds.length > 1 && <span className="font-medium text-slate-500"> (tied)</span>}
            </p>
            <p className="text-xs text-slate-500">
              {fav.basis === "trades" ? `${fav.trades} player ${fav.trades === 1 ? "trade" : "trades"} all-time · ` : "No player trades yet · "}
              {fav.offers} {fav.offers === 1 ? "offer" : "offers"} exchanged in {TRADE_SEASON}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500">Nobody yet. Not a single offer either way.</p>
      )}
    </div>
  );
}

export function TeamTradesSection({ teamId }: { teamId: number }) {
  const s = teamTrades(teamId);
  const swaps = pickSwapsFor(teamId);
  const r = s.allTime.record;
  const called = r.won + r.lost + r.even;
  return (
    <>
      <Card title="All-time" action={SEASONS_LABEL}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Stat label="Player trades" value={s.trades.length} sub={`of ${TRADES.length} in the league`} />
          <Stat
            label="Record"
            value={called ? recordText(r) : "—"}
            sub={
              PAST && (called || r.tooLittleData)
                ? `${r.even ? "won-lost-even" : "won-lost"} on points, ${PAST.first}–${PAST.last}${r.tooLittleData ? ` · ${r.tooLittleData} too little data` : ""}`
                : undefined
            }
          />
          <Stat
            label="Net points"
            value={s.trades.length ? signed(s.allTime.netPoints) : "—"}
            valueClassName={s.allTime.netPoints ? tone(s.allTime.netPoints) : undefined}
            sub={s.trades.length ? "all points, from trades" : undefined}
          />
        </div>
        {s.trades.length > 0 && (
          <dl className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {s.allTime.bySeason.map((x) => (
              <div key={x.season} className="min-w-0 rounded-lg bg-slate-50 px-2 py-1.5 text-center ring-1 ring-line">
                <dt className="text-[10px] font-semibold text-slate-500 tabular-nums">{x.season}</dt>
                <dd className={cn("text-xs font-semibold tabular-nums", x.netPoints != null ? tone(x.netPoints) : "text-slate-400")}>
                  {x.netPoints != null ? signed(x.netPoints) : "—"}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <Partner fav={s.favorite} />
      </Card>

      <Card title={`${TRADE_SEASON} season`} action="long-term value">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Stat label="Player trades" value={s.current.length} sub={verdictsText(s.verdicts) ?? `of ${CURRENT.length} in the league`} />
          <Stat label="Offers sent" value={s.offersSent} />
          <Stat label="Offers received" value={s.offersReceived} />
          <Stat
            label="Net value"
            value={s.netValue != null ? signedValue(s.netValue) : "—"}
            valueClassName={s.netValue ? tone(s.netValue) : undefined}
            sub={s.netValue != null ? "rest-of-season value from trades" : undefined}
          />
          <Stat
            label="Net points"
            value={s.current.length ? signed(s.netPoints) : "—"}
            valueClassName={s.netPoints ? tone(s.netPoints) : undefined}
            sub={s.current.length ? "all points, from trades" : undefined}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">Offer counts only; the contents of pending or declined offers stay private.</p>
        {swaps > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            Plus {swaps === 1 ? "one draft-pick-only swap" : `${swaps} draft-pick-only swaps`}, not listed here.
          </p>
        )}
        {s.netValue != null && <ValuesCredit className="mt-1" />}
      </Card>

      <TradeSeasons trades={s.trades} focus={teamId} empty={`No player trades for ${team(teamId).name} on record.`} />
      <Link href="/trades" className="text-sm font-semibold text-turf hover:underline">
        All trades, {SEASONS_LABEL} →
      </Link>
    </>
  );
}
