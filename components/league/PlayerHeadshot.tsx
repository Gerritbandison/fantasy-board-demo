"use client";

import { useState } from "react";

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** ESPN headshot when the roster file has a numeric athlete id. Anything else is initials. */
export function PlayerHeadshot({ id, name }: { id?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const numeric = id != null && /^\d+$/.test(id);
  if (!numeric || failed) {
    return (
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 font-display text-xs font-bold text-navy" aria-hidden>
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
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-full bg-slate-100 object-cover"
      onError={() => setFailed(true)}
    />
  );
}
