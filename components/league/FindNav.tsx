"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Links that are not already a primary tab. `phoneOnly` items are in the desktop bar, so the row hides them from `md` up. */
const LINKS: { href: string; label: string; phoneOnly?: boolean }[] = [
  { href: "/standings", label: "Standings", phoneOnly: true },
  { href: "/playoffs", label: "Playoffs" },
  { href: "/moves", label: "Waivers", phoneOnly: true },
  { href: "/insights#power", label: "Power rankings" },
  { href: "/history#biggest-wins", label: "Biggest wins" },
  { href: "/history#high-scores", label: "High scores" },
  { href: "/history#awards", label: "Awards" },
  { href: "/history#rivalries", label: "Rivalries" },
  { href: "/trades", label: "Trades", phoneOnly: true },
  { href: "/share", label: "Share card" },
];

/** Phone nav only fits four tabs. This quick-jump strip reaches every secondary view and record anchor. */
export function FindNav() {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ left: false, right: true });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      setEdges({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  function scrollBy(direction: number) {
    scroller.current?.scrollBy({ left: direction * 200, behavior: "smooth" });
  }

  return (
    <nav aria-label="Find" className="mt-4 rounded-xl bg-surface-subtle p-2.5 ring-1 ring-line">
      <div className="flex items-center gap-2">
        <span className="shrink-0 pl-1 font-display text-xs font-bold tracking-[0.12em] text-slate-600 uppercase">Jump to</span>
        <span className="h-4 w-px shrink-0 bg-line" aria-hidden />
        {edges.left && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-navy ring-1 ring-line transition-colors hover:bg-surface-muted"
            aria-label="Scroll links left"
          >
            <Chevron direction="left" />
          </button>
        )}
        <ul ref={scroller} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((item) => (
            <li key={item.href} className={cn("shrink-0", item.phoneOnly && "md:hidden")}>
              <Link
                href={item.href}
                className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-semibold text-navy ring-1 ring-line transition-colors hover:border-line-strong hover:bg-surface-muted/70"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {edges.right && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-navy ring-1 ring-line transition-colors hover:bg-surface-muted"
            aria-label="Scroll links right"
          >
            <Chevron direction="right" />
          </button>
        )}
      </div>
    </nav>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
