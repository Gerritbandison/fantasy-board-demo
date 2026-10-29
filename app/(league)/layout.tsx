import { BottomNav, TopBar } from "@/components/league/AppNav";
import { LEAGUE, USER_TEAM } from "@/lib/league";

export default function LeagueLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-field">
      <TopBar week={LEAGUE.week} season={LEAGUE.season} homeTitle={USER_TEAM.name} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 pt-5 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:gap-6 sm:pt-7 md:pb-12">
        {children}
      </main>
      <BottomNav homeTitle={USER_TEAM.name} />
    </div>
  );
}
