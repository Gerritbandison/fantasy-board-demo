import { BottomNav, TopBar } from "@/components/league/AppNav";
import { LEAGUE } from "@/lib/league";

export default function LeagueLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-field">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:h-10 focus:items-center focus:rounded-lg focus:bg-white focus:px-4 focus:text-sm focus:font-bold focus:text-navy focus:shadow-md focus:ring-2 focus:ring-turf"
      >
        Skip to content
      </a>
      <TopBar week={LEAGUE.week} season={LEAGUE.season} live={LEAGUE.provisionalLabel != null} />
      <main
        id="content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 pt-6 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.75rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] outline-none sm:gap-7 sm:pt-8 md:pb-14"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
