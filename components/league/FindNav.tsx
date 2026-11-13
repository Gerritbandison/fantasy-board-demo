import Link from "next/link";
import { cn } from "@/lib/utils";

/** Links that are not already a primary phone tab. `phoneOnly` items live in the desktop bar, so the strip hides them from `md` up. */
const LINKS: { href: string; label: string; phoneOnly?: boolean }[] = [
  { href: "/standings", label: "Standings", phoneOnly: true },
  { href: "/playoffs", label: "Playoff simulator" },
  { href: "/moves", label: "Waivers", phoneOnly: true },
  { href: "/insights#power", label: "Power rankings" },
  { href: "/history#biggest-wins", label: "Biggest wins" },
  { href: "/history#high-scores", label: "High scores" },
  { href: "/history#awards", label: "Awards" },
  { href: "/history#rivalries", label: "Rivalries" },
  { href: "/trades", label: "Trades", phoneOnly: true },
  { href: "/share", label: "Share card" },
];

/** Pure server-rendered quick-jump strip — zero client JS or resize listeners. */
export function FindNav() {
  return (
    <nav aria-label="Quick links" className="mt-4 rounded-xl bg-surface-subtle p-2.5 ring-1 ring-line">
      <div className="flex items-center gap-2">
        <span className="shrink-0 pl-1 font-display text-xs font-bold tracking-[0.12em] text-slate-600 uppercase">Jump to</span>
        <span className="h-4 w-px shrink-0 bg-line" aria-hidden />
        <ul className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5 md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((item) => (
            <li key={item.href} className={cn("shrink-0", item.phoneOnly && "md:hidden")}>
              <Link
                href={item.href}
                className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-semibold text-navy ring-1 ring-line transition-colors hover:bg-surface-muted/70 hover:ring-line-strong"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
