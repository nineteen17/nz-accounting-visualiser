import Link from "next/link";
import { CYCLE_STEPS } from "@/data/cycle";
import { CycleWheel } from "@/components/cycle/CycleWheel";
import { PageHeader } from "@/components/learn/bits";

export const metadata = { title: "The accounting cycle – Kōwhai Café" };

export default function CyclePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Part 2" title="The accounting cycle, step by step">
        Follow Kōwhai Café through a full financial year, from the first share issue on 1 April 2026 to the closing entries on 31 March 2027. Every number comes from the café&apos;s real journal, so you can trace any figure all the way back to its source document.
      </PageHeader>
      <Link href="/cycle/year" className="group mb-10 flex flex-wrap items-center gap-4 rounded-2xl bg-ink p-5 sm:gap-5 sm:p-6 text-white transition hover:shadow-lg">
        <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-kowhai-400 text-2xl text-ink sm:grid">▶</span>
        <span className="min-w-[15rem] flex-1">
          <span className="block text-xl font-bold">Work the whole year: a year on the job</span>
          <span className="block text-stone-300">Every task from 1 April to the tax return, in the order a bookkeeper and accountant really do them. Each step shows the job, why it&apos;s done, the entry, and the books updating live.</span>
        </span>
        <span className="rounded-xl bg-kowhai-400 px-4 py-2 font-bold text-ink group-hover:bg-kowhai-300">Start →</span>
      </Link>
      <h2 className="mb-4 text-xl font-bold">Or study one step at a time</h2>
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
    </div>
  );
}
