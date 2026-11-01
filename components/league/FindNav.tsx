import Link from "next/link";
import { cn } from "@/lib/utils";

/** Links that are not already a primary tab. `phoneOnly` items are in the desktop bar, so the row hides them from `md` up. */
const LINKS: { href: string; label: string; phoneOnly?: boolean }[] = [
  { href: "/standings", label: "Standings", phoneOnly: true },
  { href: "/insights#power", label: "Power rankings" },
  { href: "/history#awards", label: "Awards" },
  { href: "/history#rivalries", label: "Rivalries" },
  { href: "/trades", label: "Trades", phoneOnly: true },
  { href: "/share", label: "Share card" },
];

/** Phone nav only fits four tabs. This row reaches the rest, without repeating Scores or the playoff simulator. */
export function FindNav() {
  return (
    <nav aria-label="Find" className="mt-4">
      <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Find</p>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((item) => (
          <li key={item.href} className={cn("shrink-0", item.phoneOnly && "md:hidden")}>
            <Link
              href={item.href}
              className="inline-flex h-11 items-center rounded-full bg-white px-3.5 text-sm font-semibold text-navy ring-1 ring-line hover:bg-slate-50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
