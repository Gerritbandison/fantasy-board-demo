import { BottomNav, TopBar } from "@/components/league/AppNav";

export default function LeagueLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.10),transparent_50%)]">
      <TopBar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:gap-5 sm:pt-6 md:pb-10 tv:max-w-none tv:gap-8 tv:px-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
