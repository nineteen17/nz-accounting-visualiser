import Link from "next/link";
import { CYCLE_STEPS } from "@/data/cycle";
import { CycleWheel } from "@/components/cycle/CycleWheel";
import { MemoryAid } from "@/components/learn/MemoryAid";
import { PageHeader } from "@/components/learn/bits";
import { SystemFlow } from "@/components/job/SystemFlow";
import { PractiseLinks } from "@/components/study/PractiseLinks";

export const metadata = { title: "The accounting cycle – Kōwhai Café" };

export default function CyclePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Part 2" title="The accounting cycle, step by step">
        Follow Kōwhai Café through a full financial year, from the first share issue on 1 April 2026 to the closing entries on 31 March 2027. Every number comes from the café&apos;s real journal, so you can trace any figure all the way back to its source document.
      </PageHeader>
      <MemoryAid k="cycle-order" link={false} className="mb-8" />
      <section className="mb-10 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-bold">🗺️ How it all fits together</h2>
        <p className="mb-4 mt-1 text-sm text-stone-600">Every step below is one part of this system. Documents become journal entries, entries are posted to the ledger, and at balance date the ledger becomes the financial statements. The checks and IRD filings read the books along the way.</p>
        <SystemFlow linked note="Click any box to open the step or topic that explains it." />
      </section>
      <h2 className="mb-4 text-xl font-bold">The steps</h2>
      <div className="grid items-start gap-10 lg:grid-cols-[auto_1fr]">
        <CycleWheel size={520} />
        <ol className="space-y-2">
          {CYCLE_STEPS.map((s) => (
            <li key={s.slug}>
              <Link href={`/cycle/${s.slug}`} className="group flex gap-4 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-kowhai-500 hover:shadow">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-kowhai-100 font-black text-kowhai-700">{s.n}</span>
                <span>
                  <span className="block font-semibold group-hover:underline">{s.title}</span>
                  <span className="block text-sm text-stone-600">{s.blurb}</span>
                  <span className="mt-1 inline-block text-xs font-semibold uppercase tracking-wider text-stone-400">{s.when === "during" ? "every day, all year" : "at balance date (31 March)"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <PractiseLinks href="/cycle" part={2} />
      <p className="mt-10 border-t border-stone-200 pt-6 text-sm text-stone-600">
        Once you know the steps, see them all in action in <Link href="/on-the-job" className="font-semibold text-kowhai-700 underline">Part 4 · A year on the job</Link>: every task of two full years, in the order the work is really done.
      </p>
    </div>
  );
}
