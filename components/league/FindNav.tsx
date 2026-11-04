"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Links that are not already a primary tab. `phoneOnly` items are in the desktop bar, so the row hides them from `md` up. */
const LINKS: { href: string; label: string; phoneOnly?: boolean }[] = [
  { href: "/standings", label: "Standings", phoneOnly: true },
  { href: "/playoffs", label: "Playoffs" },
  { href: "/moves", label: "Waivers" },
  { href: "/insights#power", label: "Power rankings" },
  { href: "/history#biggest-wins", label: "Biggest wins" },
  { href: "/history#high-scores", label: "High scores" },
  { href: "/history#awards", label: "Awards" },
  { href: "/history#rivalries", label: "Rivalries" },
  { href: "/trades", label: "Trades", phoneOnly: true },
  { href: "/share", label: "Share card" },
];

/** Phone nav only fits four tabs. This row reaches the rest. */
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
    scroller.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  }

  return (
    <nav aria-label="Find" className="relative mt-4">
      <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Find</p>
      <div className="relative mt-2">
        <ul ref={scroller} className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
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
        {edges.left && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="absolute top-0 left-0 flex h-11 items-center rounded-full bg-white/95 px-2 text-navy shadow-sm ring-1 ring-line"
            aria-label="Scroll links left"
          >
            <Chevron direction="left" />
          </button>
        )}
        {edges.right && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="absolute top-0 right-0 flex h-11 items-center rounded-full bg-white/95 px-2 text-navy shadow-sm ring-1 ring-line"
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
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
