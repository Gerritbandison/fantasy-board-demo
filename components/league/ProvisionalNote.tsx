import { LEAGUE } from "@/lib/league";

/** Exact label from the league file while the current week is still being played. */
export function ProvisionalNote({ className = "text-sm font-semibold text-amber-800" }: { className?: string }) {
  if (!LEAGUE.provisionalLabel) return null;
  return <p className={className}>{LEAGUE.provisionalLabel}.</p>;
}
