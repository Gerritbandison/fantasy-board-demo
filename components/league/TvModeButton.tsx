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
      className="hidden h-9 shrink-0 items-center gap-2 px-3 font-mono text-[11px] tracking-[0.18em] text-dim uppercase ring-1 ring-white/15 ring-inset transition-colors hover:bg-phos/10 hover:text-phos hover:ring-phos/40 lg:inline-flex"
    >
      {isFull ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
      {isFull ? "Exit wall mode" : "Wall mode"}
    </button>
  );
}
