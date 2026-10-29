"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bird, Crown, ListOrdered, Sparkles, Swords, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; short: string; icon: LucideIcon }[] = [
  { href: "/", label: "Golden Goose", short: "Goose", icon: Bird },
  { href: "/bibis", label: "Bibi's Boys", short: "Bibi's", icon: Crown },
  { href: "/matchups", label: "Matchups", short: "Games", icon: Swords },
  { href: "/standings", label: "Standings", short: "Table", icon: ListOrdered },
  { href: "/insights", label: "Insights", short: "Pulse", icon: Sparkles },
];

export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="app-chrome sticky top-0 z-30 border-b border-white/5 bg-[#07090d]/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] tv:h-20 tv:max-w-none tv:px-16">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-lg ring-1 ring-emerald-400/30">
            🐔
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-lg font-bold uppercase tracking-[0.18em] text-zinc-100 tv:text-2xl">
              Chicken League
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.28em] text-emerald-400/90 tv:text-xs">
              Week 8 · 2026
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg px-3 font-display text-sm font-semibold uppercase tracking-widest transition-colors tv:h-12 tv:text-lg",
                  active ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <span className="hidden shrink-0 rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-sky-300 ring-1 ring-sky-400/25 min-[360px]:inline-flex md:hidden">
          Snapshot
        </span>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0e14]/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  active ? "text-emerald-300" : "text-zinc-500 active:text-zinc-200",
                )}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />}
                <item.icon className="size-5" />
                {item.short}
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
