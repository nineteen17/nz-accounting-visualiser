/**
 * Placeholder shown while a dynamic page's content (which depends on the URL)
 * streams in. Pages are pre-generated, so this is rarely visible.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8" aria-busy="true" aria-label="Loading">
      <div className="mb-8 h-12 rounded-2xl bg-stone-100" />
      <div className="mb-3 h-4 w-32 rounded bg-stone-200" />
      <div className="mb-4 h-9 w-2/3 max-w-xl rounded bg-stone-200" />
      <div className="mb-10 h-5 w-full max-w-3xl rounded bg-stone-100" />
      <div className="h-64 rounded-2xl bg-stone-100" />
    </div>
  );
}
