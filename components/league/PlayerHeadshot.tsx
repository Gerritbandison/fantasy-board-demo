"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** ESPN headshot when the roster file has a numeric athlete id. Anything else is initials. */
export function PlayerHeadshot({ id, name, size = "md" }: { id?: string; name: string; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const numeric = id != null && /^\d+$/.test(id);
  const dims = size === "sm" ? "size-8 text-[11px]" : "size-9 text-xs";
  const px = size === "sm" ? 32 : 36;
  if (!numeric || failed) {
    return (
      <span
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-muted font-display font-bold text-navy ring-1 ring-line ring-inset",
          dims,
        )}
        aria-hidden
      >
        {initials(name)}
      </span>
    );
  }
  return (
    // ESPN headshot CDN. next/image would need a remote pattern, and onError has to fall back to initials.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`}
      alt=""
      width={px}
      height={px}
      className={cx("shrink-0 rounded-full bg-surface-subtle object-cover ring-1 ring-line", dims)}
      onError={() => setFailed(true)}
    />
  );
}
