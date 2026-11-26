import Link from "next/link";
import { PageHeader } from "@/components/learn/bits";
import { EXPLORE_TOOLS } from "./tools";
import { ALL } from "@/data/books";

export const metadata = { title: "Explore the books – Kōwhai Café" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader eyebrow="Explore" title="Explore Kōwhai Café's books">
        The complete set of books: {ALL.length} journal entries, one source of truth. Every tool below is built from the same journal, so the numbers always agree.
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXPLORE_TOOLS.map((t) => (
          <Link key={t.slug} href={`/explore/${t.slug}`} className="group rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-kowhai-500 hover:shadow">
            <div className="text-3xl">{t.icon}</div>
            <div className="mt-2 text-lg font-semibold group-hover:underline">{t.title}</div>
            <div className="text-sm text-stone-600">{t.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
