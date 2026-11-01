import Link from "next/link";

const LINKS = [
  { href: "/matchups", label: "Scores" },
  { href: "/matchups#thursday", label: "Thursday" },
  { href: "/playoffs", label: "Playoffs" },
  { href: "/standings", label: "Standings" },
  { href: "/insights#power", label: "Power rankings" },
  { href: "/history#awards", label: "Awards" },
  { href: "/history#rivalries", label: "Rivalries" },
  { href: "/trades", label: "Trades" },
  { href: "/share", label: "Share card" },
];

/** Phone nav only fits four tabs. This row reaches the rest. */
export function FindNav() {
  return (
    <nav aria-label="Find" className="mt-4">
      <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Find</p>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((item) => (
          <li key={item.href} className="shrink-0">
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
