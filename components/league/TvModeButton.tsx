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
      className="hidden h-9 shrink-0 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-semibold text-navy shadow-sm ring-1 ring-line transition-colors hover:bg-slate-50 lg:inline-flex"
    >
      {isFull ? <Minimize className="size-3.5" aria-hidden /> : <Maximize className="size-3.5" aria-hidden />}
      {isFull ? "Exit TV mode" : "TV mode"}
    </button>
  );
}
