"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Bird, Crown, ListOrdered, Radar as RadarIcon, Swords, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Radar } from "./hud";

const NAV: { href: string; label: string; code: string; icon: LucideIcon; phone: boolean }[] = [
  { href: "/", label: "Goose", code: "01", icon: Bird, phone: true },
  { href: "/bibis", label: "Bibi", code: "02", icon: Crown, phone: true },
  { href: "/standings", label: "Standings", code: "03", icon: ListOrdered, phone: true },
  { href: "/insights", label: "Insights", code: "04", icon: RadarIcon, phone: true },
  { href: "/history", label: "History", code: "05", icon: Archive, phone: true },
  { href: "/matchups", label: "Slate", code: "06", icon: Swords, phone: false },
];

export function TopBar({ week }: { week: number }) {
  const pathname = usePathname();
  const wk = String(week).padStart(2, "0");
  return (
    <header className="app-chrome sticky top-0 z-30 border-b border-phos/15 bg-ink/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Chicken Command home">
          <Radar className="size-9 shrink-0 bg-phos/[0.04]" blips={[{ x: 66, y: 34 }, { x: 36, y: 62, tone: "sig" }]} />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-[17px] font-bold tracking-[0.14em] text-zinc-50 uppercase">
              Chicken <span className="text-phos glow-phos">Command</span>
            </span>
            <span className="mt-1 block font-mono text-[10px] tracking-[0.24em] text-dim uppercase">
              Week {wk} · Ops
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 items-center gap-1.5 px-3 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors",
                  active ? "text-phos" : "text-dim hover:text-zinc-100",
                )}
              >
                <span className="text-faint">{item.code}</span>
                {active ? `[ ${item.label} ]` : item.label}
                {active && <span className="absolute inset-x-3 bottom-0 h-px bg-phos shadow-[0_0_10px_var(--color-phos)]" />}
              </Link>
            );
          })}
        </nav>

        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-sig uppercase md:hidden">
          <span className="size-1.5 animate-blink rounded-full bg-sig" aria-hidden />
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
      className="app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-phos/20 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        {NAV.filter((n) => n.phone).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 font-mono text-[10px] tracking-[0.06em] uppercase transition-colors",
                  active ? "bg-phos/[0.06] text-phos" : "text-dim active:text-zinc-200",
                )}
              >
                {active && <span className="absolute inset-x-3 top-0 h-0.5 bg-phos shadow-[0_0_12px_var(--color-phos)]" />}
                <item.icon className="size-5" strokeWidth={active ? 2 : 1.5} />
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
