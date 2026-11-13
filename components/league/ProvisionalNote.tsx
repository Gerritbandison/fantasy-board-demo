import { LEAGUE } from "@/lib/league";
import { cn } from "@/lib/utils";

/** Exact label from the league file while the current week is still being played. */
export function ProvisionalNote({ className }: { className?: string }) {
  if (!LEAGUE.provisionalLabel) return null;
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-warn-light px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn-border",
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
      <span>{LEAGUE.provisionalLabel}.</span>
    </p>
  );
}
