import { BottomNav, TopBar } from "@/components/league/AppNav";
import { intel } from "@/lib/intel";
import { PLAYOFF_SEEDS } from "@/lib/league";

export default function LeagueLayout({ children }: LayoutProps<"/">) {
  const lastChamp = intel.champions[0];
  const feed = [
    `LG ${intel.league.id}`,
    intel.league.format.toUpperCase(),
    `PLAYOFF CUT ▸ SEED ${PLAYOFF_SEEDS}`,
    `${lastChamp.year} CHAMP ▸ ${lastChamp.champion.toUpperCase()}`,
    ...intel.leaguePulse.map((p) => p.title.toUpperCase()),
  ];

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-console">
      <div className="scanlines fixed inset-0 z-40 opacity-60" aria-hidden />
      <TopBar week={intel.league.week} />
      <div className="app-chrome border-b border-white/[0.06] bg-panel/70" aria-label="League status feed">
        <div className="mx-auto flex h-7 max-w-6xl items-center overflow-hidden pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
          <span className="z-10 mr-3 shrink-0 bg-phos px-1.5 font-mono text-[9.5px] leading-4 font-semibold tracking-[0.2em] text-ink">
            FEED
          </span>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
            <div className="flex w-max animate-ticker">
              {[0, 1].map((copy) => (
                <p
                  key={copy}
                  aria-hidden={copy === 1}
                  className="flex shrink-0 items-center gap-5 pr-5 font-mono text-[10px] tracking-[0.16em] whitespace-nowrap text-dim"
                >
                  {feed.map((item) => (
                    <span key={item} className="flex items-center gap-5">
                      <span>{item}</span>
                      <span className="text-phos/60">◆</span>
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 pt-5 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:gap-6 sm:pt-7 md:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
