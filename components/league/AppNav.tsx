"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, ChartColumn, ListOrdered, Swords, Trophy, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** `also`: extra paths that light up the item; `phoneAlso` only applies in the bottom bar, where Standings and Trades have no tab of their own. */
const NAV: { href: string; label: string; icon: LucideIcon; phone: boolean; also?: string[]; phoneAlso?: string[] }[] = [
  { href: "/", label: "Teams", icon: Users, phone: true, also: ["/teams/"], phoneAlso: ["/standings"] },
  { href: "/standings", label: "Standings", icon: ListOrdered, phone: false },
  { href: "/matchups", label: "Scores", icon: Swords, phone: true },
  { href: "/insights", label: "Insights", icon: ChartColumn, phone: true },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight, phone: false },
  { href: "/history", label: "History", icon: Trophy, phone: true, phoneAlso: ["/trades"] },
];

function Football({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <ellipse cx="16" cy="16" rx="13" ry="8.5" transform="rotate(-35 16 16)" fill="#8b4513" />
      <ellipse cx="16" cy="16" rx="13" ry="8.5" transform="rotate(-35 16 16)" fill="none" stroke="#5c2d0c" strokeWidth="1" />
      <path d="M11.5 20.5 20.5 11.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${12.6 + i * 2.1} ${17.2 + i * -2.1} l2.2 2.2`} stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function TopBar({ week, season }: { week: number; season: number }) {
  const pathname = usePathname();
  return (
    <header className="app-chrome sticky top-0 z-30 bg-navy yard-lines pt-[env(safe-area-inset-top)] text-white shadow-[0_2px_10px_rgba(15,30,54,0.25)]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Football className="size-7" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-xl font-bold tracking-wide">Chicken League</span>
            <span className="mt-0.5 block text-xs font-medium text-white/80">
              Week {week} · {season} season
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex lg:gap-1">
          {NAV.map((item) => {
            const active = [item.href, ...(item.also ?? [])].some((h) => isActive(pathname, h));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors lg:px-3.5",
                  active ? "bg-white text-navy" : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="size-4 max-lg:hidden" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <span className="shrink-0 rounded-full bg-turf px-2.5 py-1 text-xs font-bold tracking-wide uppercase md:hidden">Wk {week}</span>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(15,30,54,0.06)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        {NAV.filter((n) => n.phone).map((item) => {
          const active = [item.href, ...(item.also ?? []), ...(item.phoneAlso ?? [])].some((h) => isActive(pathname, h));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
                  active ? "text-turf" : "text-slate-600 active:text-navy",
                )}
              >
                {active && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-turf" />}
                <item.icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
