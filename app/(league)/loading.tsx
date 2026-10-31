export default function Loading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading Chicken League</p>
      <div className="h-16 w-48 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
        <div className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-line" />
      </div>
    </div>
  );
}
