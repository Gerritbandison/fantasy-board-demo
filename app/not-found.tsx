import Link from "next/link";
import { BottomNav, TopBar } from "@/components/league/AppNav";
import { Card } from "@/components/league/ui";
import { LEAGUE } from "@/lib/league";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-clip bg-field">
      <TopBar week={LEAGUE.week} season={LEAGUE.season} live={LEAGUE.provisionalLabel != null} />
      <main id="content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12">
        <Card className="max-w-xl" accent="#15803d">
          <p className="font-display text-xs font-bold tracking-[0.14em] text-turf uppercase">404 · Not on the board</p>
          <h1 className="mt-1 font-display text-4xl leading-tight font-extrabold text-navy sm:text-5xl">That page isn&apos;t on the board</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            The link doesn&apos;t match a franchise, a current matchup, or a section of Chicken League.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/matchups" className="inline-flex h-10 items-center rounded-xl bg-turf px-4 text-sm font-semibold text-white hover:bg-turf-dark">
              Scores
            </Link>
            <Link
              href="/teams"
              className="inline-flex h-10 items-center rounded-xl bg-surface-subtle px-4 text-sm font-semibold text-navy ring-1 ring-line hover:bg-surface-muted"
            >
              Teams
            </Link>
            <Link
              href="/history"
              className="inline-flex h-10 items-center rounded-xl bg-surface-subtle px-4 text-sm font-semibold text-navy ring-1 ring-line hover:bg-surface-muted"
            >
              History
            </Link>
          </div>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
