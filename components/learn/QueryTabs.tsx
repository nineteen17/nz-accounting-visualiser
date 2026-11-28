"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cx } from "@/lib/ui";

export type QueryTab = { id: string; label: ReactNode; title: string; content: ReactNode };

/**
 * Splits a long page into tabs, one per section, and renders only the chosen one. The choice lives in the address
 * (?view=gst), so a tab can be linked to and the back button works. Previous / next links at the bottom.
 */
export function QueryTabs(props: { tabs: QueryTab[]; param?: string; label: string }) {
  // before the address is read (static HTML, or no JavaScript), the first tab shows
  return (
    <Suspense fallback={<Tabs {...props} current={props.tabs[0].id} />}>
      <FromAddress {...props} />
    </Suspense>
  );
}

function FromAddress(props: { tabs: QueryTab[]; param?: string; label: string }) {
  const q = useSearchParams().get(props.param ?? "view");
  const current = props.tabs.some((t) => t.id === q) ? q! : props.tabs[0].id;
  return <Tabs {...props} current={current} />;
}

function Tabs({ tabs, param = "view", label, current }: { tabs: QueryTab[]; param?: string; label: string; current: string }) {
  const path = usePathname();
  const href = (id: string) => (id === tabs[0].id ? path : `${path}?${param}=${id}`);
  const i = tabs.findIndex((t) => t.id === current);
  const tab = tabs[i], prev = tabs[i - 1], next = tabs[i + 1];
  return (
    <div>
      <nav aria-label={label} className="rounded-2xl border border-stone-200 bg-white p-2">
        <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <Link key={t.id} href={href(t.id)} scroll={false} role="tab" aria-selected={t.id === current}
              className={cx("rounded-lg px-2.5 py-1 text-sm font-semibold transition", t.id === current ? "bg-ink text-white" : "text-stone-700 hover:bg-stone-100")}>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <div role="tabpanel" aria-label={tab.title} className="mt-6">{tab.content}</div>
      <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-4 text-sm">
        {prev ? <Link href={href(prev.id)} className="font-semibold text-stone-600 hover:underline">← {prev.title}</Link> : <span />}
        {next ? <Link href={href(next.id)} className="font-semibold text-kowhai-700 hover:underline">{next.title} →</Link> : <span />}
      </div>
    </div>
  );
}
