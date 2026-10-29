import { BottomNav, TopBar } from "@/components/league/AppNav";
import { BOARDS, getStanding, snapshot } from "@/lib/league";

export default function LeagueLayout({ children }: LayoutProps<"/">) {
  const homeTitle = getStanding(BOARDS[0].focusTeamId)?.teamName ?? "Home";

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-field">
      <TopBar week={snapshot.league.week} season={snapshot.league.season} homeTitle={homeTitle} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 pt-5 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:gap-6 sm:pt-7 md:pb-12">
        {children}
      </main>
      <BottomNav homeTitle={homeTitle} />
    </div>
  );
}
