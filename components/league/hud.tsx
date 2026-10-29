import { cn } from "@/lib/utils";
import { LUCK_TONE, type LuckRow } from "@/lib/intel";

type Tone = "phos" | "sig" | "hot" | "dim";

const TONE_TEXT: { [t in Tone]: string } = {
  phos: "text-phos",
  sig: "text-sig",
  hot: "text-hot",
  dim: "text-dim",
};

const TONE_CORNERS: { [t in Tone]: string } = {
  phos: "hud-corners",
  sig: "hud-corners hud-corners-sig",
  hot: "hud-corners",
  dim: "hud-corners hud-corners-dim",
};

/** Bracketed console panel. `label` renders as a `// LABEL` header; `code` is a short panel id. */
export function Frame({
  label,
  code,
  meta,
  tone = "phos",
  className,
  bodyClassName,
  children,
  as: Tag = "section",
}: {
  label?: string;
  code?: string;
  meta?: React.ReactNode;
  tone?: Tone;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  as?: "section" | "article" | "div" | "li";
}) {
  return (
    <Tag className={cn("relative border border-white/[0.07] bg-panel/85 backdrop-blur-[2px]", TONE_CORNERS[tone], className)}>
      {(label || meta || code) && (
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-3 py-2 sm:px-4">
          <h2 className={cn("flex min-w-0 shrink items-center gap-2 font-mono text-[11px] font-medium tracking-[0.18em] uppercase", TONE_TEXT[tone])}>
            {code && <span className="shrink-0 text-faint">{code}</span>}
            <span className="truncate">{"// "}{label}</span>
          </h2>
          {meta && <span className="max-w-[45%] shrink-[3] truncate font-mono text-[10px] tracking-[0.16em] text-dim uppercase">{meta}</span>}
        </header>
      )}
      <div className={cn("p-3 sm:p-4", bodyClassName)}>{children}</div>
    </Tag>
  );
}

/** Chakra Petch's 0 reads as O, so digits inside display-face names switch to the mono face. */
export function DisplayName({ text }: { text: string }) {
  return text.split(/(\d+)/).map((part, i) =>
    /\d/.test(part) ? (
      <span key={i} className="font-mono font-semibold">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function PageHead({
  code,
  title,
  kicker,
  children,
}: {
  code: string;
  title: React.ReactNode;
  kicker?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-phos uppercase">
        <span className="inline-block size-1.5 bg-phos shadow-[0_0_8px_var(--color-phos)]" aria-hidden />
        {code}
      </p>
      <h1 className="mt-2 font-display text-[2.1rem] leading-[0.95] font-bold tracking-tight break-words text-zinc-50 uppercase sm:text-5xl lg:text-6xl">
        {typeof title === "string" ? <DisplayName text={title} /> : title}
      </h1>
      {kicker && <p className="mt-2 max-w-2xl text-[15px] leading-snug text-zinc-400">{kicker}</p>}
      {children}
    </div>
  );
}

export function Tag({ tone = "dim", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  const tones: { [t in Tone]: string } = {
    phos: "text-phos ring-phos/40 bg-phos/[0.08]",
    sig: "text-sig ring-sig/40 bg-sig/[0.08]",
    hot: "text-hot ring-hot/45 bg-hot/[0.08]",
    dim: "text-zinc-300 ring-white/15 bg-white/[0.03]",
  };
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 px-2 font-mono text-[10.5px] font-medium tracking-[0.12em] whitespace-nowrap uppercase ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Readout({
  label,
  value,
  sub,
  tone = "dim",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-[10px] tracking-[0.18em] text-dim uppercase">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-lg leading-tight font-medium tabular-nums",
          tone === "dim" ? "text-zinc-100" : TONE_TEXT[tone],
        )}
      >
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] tracking-wider text-faint uppercase">{sub}</p>}
    </div>
  );
}

export function LuckChip({ row, withRanks }: { row: LuckRow; withRanks?: boolean }) {
  const t = LUCK_TONE[row.label];
  const delta = row.luckDelta > 0 ? `+${row.luckDelta}` : row.luckDelta === 0 ? "±0" : `−${Math.abs(row.luckDelta)}`;
  return (
    <span
      title={`PF rank ${row.pfRank} vs win rank ${row.winRank}: ${row.label}`}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 px-1.5 font-mono text-[10.5px] font-medium tracking-[0.1em] whitespace-nowrap uppercase ring-1 ring-inset",
        t.tone,
      )}
    >
      {t.short}
      <span className="tabular-nums">{delta}</span>
      {withRanks && (
        <span className="text-faint tabular-nums">
          PF{row.pfRank}/W{row.winRank}
        </span>
      )}
    </span>
  );
}

/** Decorative radar scope; the sweep stops under reduced motion. */
export function Radar({ className, blips = [] }: { className?: string; blips?: { x: number; y: number; tone?: Tone }[] }) {
  return (
    <span className={cn("relative inline-block aspect-square overflow-hidden rounded-full", className)} aria-hidden>
      <span className="absolute inset-0 animate-radar rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_290deg,color-mix(in_oklab,var(--color-phos)_55%,transparent)_360deg)]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-phos)" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="50" cy="50" r="31" fill="none" stroke="var(--color-phos)" strokeOpacity="0.3" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="14" fill="none" stroke="var(--color-phos)" strokeOpacity="0.3" strokeWidth="1.5" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="var(--color-phos)" strokeOpacity="0.25" strokeWidth="1" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="var(--color-phos)" strokeOpacity="0.25" strokeWidth="1" />
        {blips.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="4" fill={b.tone === "sig" ? "var(--color-sig)" : "var(--color-phos)"} />
        ))}
      </svg>
    </span>
  );
}

/** Thin labelled rule used to separate console sections. */
export function Rule({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.22em] text-dim uppercase">
      <span className="shrink-0 text-phos">{"▸"}</span>
      <span className="min-w-0 truncate">{label}</span>
      <span className="h-px min-w-4 flex-1 bg-gradient-to-r from-white/15 to-transparent" />
      {right && <span className="shrink-0 text-faint">{right}</span>}
    </div>
  );
}
