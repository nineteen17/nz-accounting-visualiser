import Link from "next/link";
import { JobYear } from "@/components/job/JobYear";
import { JOB_STEPS } from "@/data/job/steps";

export const metadata = { title: "A year on the job – Kōwhai Café" };

export default function YearOnTheJobPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Link href="/cycle" className="text-sm text-stone-500 underline">← Cycle overview</Link>
        <div className="mt-3 text-sm font-semibold uppercase tracking-wider text-kowhai-700">The accounting cycle, start to finish</div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">A year on the job</h1>
        <p className="mt-2 max-w-3xl text-lg text-stone-600">
          Work through Kōwhai Café&apos;s whole year, {JOB_STEPS.length} tasks in the order the bookkeeper and accountant actually do them, from the first deposit on 1 April 2026 to closing the books and filing the tax return. Every step shows the job, why it&apos;s done, the entry, and the books updating live.
        </p>
      </div>
      <JobYear />
    </div>
  );
}
