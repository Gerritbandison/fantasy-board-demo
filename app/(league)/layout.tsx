import { BottomNav, TopBar } from "@/components/league/AppNav";
import { LEAGUE } from "@/lib/league";

export default function LeagueLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-field">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-full focus:bg-white focus:px-4 focus:font-semibold focus:text-navy"
      >
        Skip to content
      </a>
      <TopBar week={LEAGUE.week} season={LEAGUE.season} />
      <main id="content" tabIndex={-1} className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 pt-5 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] outline-none sm:gap-6 sm:pt-7 md:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
