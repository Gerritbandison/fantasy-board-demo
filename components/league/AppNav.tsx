import type { ReactNode } from "react";
import Link from "next/link";
import { BottomNavLink, TopNavLink } from "./NavLink";

/** Crisp inline strokes so the icon library stays off the client bundle. */
function NavIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle cx="9" cy="7" r="4" />
    </NavIcon>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="M11 5h10" />
      <path d="M11 12h10" />
      <path d="M11 19h10" />
      <path d="M4 4h1v5" />
      <path d="M4 9h2" />
      <path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" />
    </NavIcon>
  );
}

function SwordsIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="m13 19 6-6" />
      <path d="M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5" />
      <path d="m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586" />
      <path d="m16 16 4 4" />
      <path d="m19 21 2-2" />
      <path d="m5 14 4 4" />
      <path d="m5 21-2-2" />
      <path d="M7.5 16.5 4 20" />
    </NavIcon>
  );
}

function WireIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M21 3 13.5 10.5" />
      <path d="M3 21l7.5-7.5" />
    </NavIcon>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </NavIcon>
  );
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </NavIcon>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <NavIcon className={className}>
      <path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />
      <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />
      <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />
    </NavIcon>
  );
}

/** `also`: extra paths that light up the item; `phoneAlso` only applies in the bottom bar. */
const NAV: { href: string; label: string; icon: typeof UsersIcon; phone: boolean; also?: string[]; phoneAlso?: string[] }[] = [
  { href: "/matchups", label: "Scores", icon: SwordsIcon, phone: true },
  { href: "/teams", label: "Teams", icon: UsersIcon, phone: true, phoneAlso: ["/standings", "/moves", "/playoffs"] },
  { href: "/standings", label: "Standings", icon: ListIcon, phone: false },
  { href: "/moves", label: "Waivers", icon: WireIcon, phone: false },
  { href: "/insights", label: "Insights", icon: ChartIcon, phone: true },
  { href: "/trades", label: "Trades", icon: SwapIcon, phone: false },
  { href: "/history", label: "History", icon: TrophyIcon, phone: true, phoneAlso: ["/trades"] },
];

function FootballCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <ellipse cx="16" cy="16" rx="12.5" ry="8" transform="rotate(-35 16 16)" fill="#b45309" stroke="#f59e0b" strokeWidth="1.2" />
      <path d="M11.6 20.4 20.4 11.6" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${12.7 + i * 2.05} ${17.1 + i * -2.05} l2.2 2.2`} stroke="white" strokeWidth="1.35" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function TopBar({ week, season, live = false }: { week: number; season: number; live?: boolean }) {
  return (
    <header className="app-chrome sticky top-0 z-30 border-b border-white/10 bg-navy yard-lines pt-[env(safe-area-inset-top)] text-white shadow-[0_1px_8px_rgba(12,25,44,0.22)]">
      <div className="mx-auto flex h-15 w-full max-w-6xl items-center justify-between gap-3 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
        <Link href="/matchups" className="group flex min-w-0 items-center gap-2.5 rounded-lg py-1">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-2 ring-1 ring-white/15 transition-colors group-hover:ring-gold/50">
            <FootballCrest className="size-6" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-[1.3rem] font-extrabold tracking-[0.03em] uppercase">Chicken League</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/75">
              {live && <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />}
              <span>
                Week {week} · {season}
              </span>
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex lg:gap-1">
          {NAV.map((item) => (
            <TopNavLink key={item.href} href={item.href} also={item.also}>
              <item.icon className="size-3.5 opacity-80 max-lg:hidden" aria-hidden />
              {item.label}
            </TopNavLink>
          ))}
        </nav>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-navy-2 px-2.5 py-1 font-display text-xs font-bold tracking-wider text-white uppercase ring-1 ring-white/15 md:hidden">
          {live && <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />}
          Wk {week}
        </span>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="app-chrome fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(12,25,44,0.06)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        {NAV.filter((item) => item.phone).map((item) => (
          <li key={item.href}>
            <BottomNavLink
              href={item.href}
              also={[...(item.also ?? []), ...(item.phoneAlso ?? [])]}
              label={item.label}
              icon={<item.icon className="size-5" aria-hidden />}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
