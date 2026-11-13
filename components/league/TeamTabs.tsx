"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";

const TABS = [
  { id: "overview", label: "Overview", path: "" },
  { id: "roster", label: "Roster", path: "/roster" },
  { id: "trades", label: "Trades", path: "/trades" },
  { id: "h2h", label: "H2H", path: "/h2h", title: "Head-to-head" },
  { id: "history", label: "History", path: "/history" },
] as const;

/** Old hash links (`/teams/7#trades`) open the matching route. */
export function LegacyTeamHash({ id }: { id: number }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== `/teams/${id}`) return;
    const hash = window.location.hash.replace("#", "");
    if (TABS.some((tab) => tab.id === hash && tab.path)) router.replace(`/teams/${id}/${hash}`);
  }, [id, pathname, router]);
  return null;
}

/** Team sections are separate routes so the first page does not ship the closed tabs. */
export function TeamSectionNav({ id }: { id: number }) {
  const pathname = usePathname();
  const list = useRef<HTMLDivElement>(null);
  const active = TABS.find((tab) => pathname === `/teams/${id}${tab.path}`)?.id ?? "overview";

  useEffect(() => {
    const bar = list.current;
    const button = bar?.querySelector<HTMLAnchorElement>(`[data-tab="${active}"]`);
    if (!bar || !button) return;
    const left = button.offsetLeft - bar.offsetLeft;
    if (left < bar.scrollLeft) bar.scrollLeft = left - 4;
    else if (left + button.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = left + button.offsetWidth - bar.clientWidth + 4;
  }, [active]);

  return (
    <nav
      aria-label="Team sections"
      className="sticky top-[calc(3.75rem+env(safe-area-inset-top))] z-20 -mr-[max(1rem,env(safe-area-inset-right))] -ml-[max(1rem,env(safe-area-inset-left))] bg-field/95 py-2 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]"
    >
      <div ref={list} className="flex gap-1 overflow-x-auto rounded-xl bg-surface-muted p-1 shadow-xs ring-1 ring-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const on = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={`/teams/${id}${tab.path}`}
              data-tab={tab.id}
              aria-current={on ? "page" : undefined}
              className={cx(
                "flex h-9 flex-1 shrink-0 items-center justify-center rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
                on ? "bg-navy text-white shadow-xs" : "text-slate-600 hover:bg-white/70 hover:text-navy",
              )}
            >
              {tab.label}
              {"title" in tab && <span className="sr-only"> ({tab.title})</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
