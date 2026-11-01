import Link from "next/link";
import { cn } from "@/lib/utils";

/** Teams and Standings share one phone tab; this switch moves between them. */
export function TeamsTabs({ active }: { active: "teams" | "standings" }) {
  const tabs = [
    { key: "teams", href: "/teams", label: "Directory" },
    { key: "standings", href: "/standings", label: "Standings" },
  ] as const;
  return (
    <nav aria-label="Teams views" className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-line">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors",
            active === t.key ? "bg-navy text-white" : "text-slate-600 hover:text-navy",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
