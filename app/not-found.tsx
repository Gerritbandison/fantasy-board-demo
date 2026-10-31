import Link from "next/link";
import { BottomNav, TopBar } from "@/components/league/AppNav";
import { LEAGUE } from "@/lib/league";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-field">
      <TopBar week={LEAGUE.week} season={LEAGUE.season} />
      <main id="content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-10">
        <p className="text-xs font-bold tracking-wider text-turf uppercase">404</p>
        <h1 className="font-display text-5xl font-extrabold text-navy">That page isn&apos;t on the board</h1>
        <p className="max-w-xl text-base text-slate-700">The link doesn&apos;t match a team, a matchup, or a section of Chicken League.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/" className="inline-flex h-11 items-center rounded-full bg-turf px-4 text-sm font-semibold text-white">
            Teams
          </Link>
          <Link href="/matchups" className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-navy ring-1 ring-line">
            Scores
          </Link>
          <Link href="/history" className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-navy ring-1 ring-line">
            History
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
