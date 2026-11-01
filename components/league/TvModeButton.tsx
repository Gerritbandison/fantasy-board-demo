"use client";

import { useCallback, useEffect, useState } from "react";

function FrameIcon({ exit }: { exit: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {exit ? (
        <path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Fullscreen board for a TV or laptop; iPhone Safari can't fullscreen pages, so it's hidden below `lg`. */
export function TvModeButton() {
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const full = Boolean(document.fullscreenElement);
      setIsFull(full);
      if (full) document.documentElement.dataset.tv = "1";
      else delete document.documentElement.dataset.tv;
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden h-9 shrink-0 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-semibold text-navy shadow-sm ring-1 ring-line transition-colors hover:bg-slate-50 lg:inline-flex"
    >
      <FrameIcon exit={isFull} />
      {isFull ? "Exit TV mode" : "TV mode"}
    </button>
  );
}
