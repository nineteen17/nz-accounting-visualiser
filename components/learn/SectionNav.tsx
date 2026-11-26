import Link from "next/link";
import { cx } from "@/lib/ui";

export interface SectionNavItem {
  href: string;
  n: string | number;
  label: string;
  title?: string;
}

/**
 * The selector shown at the top of every Foundations lesson and cycle step:
 * an overview link, previous/next arrows and every item as a numbered pill.
 * Items before the current one are tinted (done), the current one is dark, later ones are white.
 */
export function SectionNav({ overview, items, current, ariaLabel }: { overview: { href: string; label: string }; items: SectionNavItem[]; current: number; ariaLabel: string }) {
  const prev = items[current - 1];
  const next = items[current + 1];
  const arrow = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-stone-100";
  return (
    <nav aria-label={ariaLabel} className="mb-8 flex flex-wrap items-start gap-1 rounded-2xl sm:flex-nowrap border border-stone-200 bg-white p-2">
      <Link href={overview.href} className="shrink-0 rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-kowhai-500 hover:bg-kowhai-50">
        ☰ {overview.label}
      </Link>
      {prev ? <Link href={prev.href} aria-label={`Previous: ${prev.title ?? prev.label}`} className={arrow}>←</Link> : <span className="h-8 w-8 shrink-0" />}
      {/* phones: overview + arrows on the first row, every item below at full width */}
      <div className="order-last flex min-w-0 basis-full flex-wrap gap-1 pt-1 sm:order-none sm:flex-1 sm:basis-auto sm:pt-0">
        {items.map((x, k) => (
          <Link
            key={x.href}
            href={x.href}
            title={x.title}
            aria-current={k === current ? "page" : undefined}
            className={cx(
              "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
              k === current ? "border-ink bg-ink text-white" : k < current ? "border-kowhai-300 bg-kowhai-50 text-kowhai-800 hover:border-kowhai-500" : "border-stone-200 bg-white text-stone-700 hover:border-kowhai-500",
            )}
          >
            <span className="num mr-1 opacity-60">{x.n}</span>{x.label}
          </Link>
        ))}
      </div>
      {next ? <Link href={next.href} aria-label={`Next: ${next.title ?? next.label}`} className={cx(arrow, "ml-auto sm:ml-0")}>→</Link> : <span className="ml-auto h-8 w-8 shrink-0 sm:ml-0" />}
    </nav>
  );
}
