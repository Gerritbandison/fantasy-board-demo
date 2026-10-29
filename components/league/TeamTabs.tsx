"use client";

import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TeamTab {
  id: string;
  label: string;
  /** Spoken label when `label` is an abbreviation. */
  title?: string;
  content: ReactNode;
}

const TAB_EVENT = "team-tab";

function subscribe(cb: () => void) {
  const events = ["hashchange", "popstate", TAB_EVENT];
  for (const e of events) window.addEventListener(e, cb);
  return () => {
    for (const e of events) window.removeEventListener(e, cb);
  };
}

const hash = () => window.location.hash.slice(1);
const noHash = () => "";

/**
 * Team page sections as tabs. Every panel is server-rendered; the URL hash (#trades, #h2h...)
 * picks the open one, so tabs can be linked to and survive a reload.
 */
export function TeamTabs({ tabs }: { tabs: TeamTab[] }) {
  const current = useSyncExternalStore(subscribe, hash, noHash);
  const active = tabs.some((t) => t.id === current) ? current : tabs[0].id;
  const anchor = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Keep the open tab visible when the bar scrolls sideways on narrow phones.
  useEffect(() => {
    const bar = list.current;
    const button = bar?.querySelector<HTMLButtonElement>(`[data-tab="${active}"]`);
    if (!bar || !button) return;
    const left = button.offsetLeft - bar.offsetLeft;
    if (left < bar.scrollLeft) bar.scrollLeft = left - 4;
    else if (left + button.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = left + button.offsetWidth - bar.clientWidth + 4;
  }, [active]);

  function select(id: string, focus = false) {
    history.replaceState(null, "", id === tabs[0].id ? window.location.pathname : `#${id}`);
    window.dispatchEvent(new Event(TAB_EVENT));
    if (focus) list.current?.querySelector<HTMLButtonElement>(`[data-tab="${id}"]`)?.focus({ preventScroll: true });
    const top = anchor.current?.getBoundingClientRect().top ?? 0;
    const header = document.querySelector("header.app-chrome")?.getBoundingClientRect().height ?? 0;
    if (top < header) window.scrollTo({ top: window.scrollY + top - header });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.id === active);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length].id, true);
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div ref={anchor} className="-mb-5 sm:-mb-6" aria-hidden />
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mr-[max(1rem,env(safe-area-inset-right))] -ml-[max(1rem,env(safe-area-inset-left))] bg-field/95 py-2 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur-md">
        <div
          ref={list}
          role="tablist"
          aria-label="Team sections"
          onKeyDown={onKeyDown}
          className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`team-tab-${t.id}`}
                data-tab={t.id}
                aria-selected={on}
                aria-controls={`team-panel-${t.id}`}
                aria-label={t.title}
                tabIndex={on ? 0 : -1}
                onClick={() => select(t.id)}
                className={cn(
                  "h-9 flex-1 shrink-0 rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  on ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-navy",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`team-panel-${t.id}`}
          aria-labelledby={`team-tab-${t.id}`}
          hidden={t.id !== active}
          className="flex flex-col gap-5 sm:gap-6"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
