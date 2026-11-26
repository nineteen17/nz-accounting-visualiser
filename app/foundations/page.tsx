import Link from "next/link";
import { FOUNDATIONS } from "@/data/topics";
import { PageHeader } from "@/components/learn/bits";

export const metadata = { title: "Foundations – Kōwhai Café" };

export default function FoundationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader eyebrow="Part 1" title="Foundations">
        Start here if you&apos;ve never done accounting before. Eleven short lessons build the mental model you need for the accounting cycle: what the numbers mean, why debits and credits exist, and how a business&apos;s records are organised.
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {FOUNDATIONS.map((f, i) => (
          <Link key={f.slug} href={`/foundations/${f.slug}`} className="group flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-kowhai-500 hover:shadow">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-kowhai-100 font-black text-kowhai-700">{i + 1}</span>
            <span>
              <span className="block text-lg font-semibold group-hover:underline">{f.title}</span>
              <span className="text-sm text-stone-600">{f.blurb}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
