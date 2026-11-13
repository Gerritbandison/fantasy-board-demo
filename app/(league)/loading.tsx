export default function Loading() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading Chicken League</p>
      <div className="grid gap-2">
        <div className="h-3.5 w-28 animate-pulse rounded bg-surface-muted" />
        <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
        <div className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      </div>
    </div>
  );
}
