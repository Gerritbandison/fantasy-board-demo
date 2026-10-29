"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

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
      className="hidden h-10 items-center gap-2 rounded-lg px-3 font-display text-sm font-semibold uppercase tracking-widest text-zinc-400 ring-1 ring-white/10 transition-colors hover:bg-white/5 hover:text-zinc-100 lg:inline-flex tv:h-14 tv:text-xl"
    >
      {isFull ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
      {isFull ? "Exit TV mode" : "TV mode"}
    </button>
  );
}
