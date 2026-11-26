import { Suspense } from "react";
import { PageHeader } from "@/components/learn/bits";
import { JobYears } from "@/components/job/JobYears";
import { PageSkeleton } from "@/components/learn/PageSkeleton";

export const metadata = { title: "A year on the job – Kōwhai Café" };

export default function YearOnTheJobPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="Part 4 · Putting it all together" title="A year on the job">
        Work through Kōwhai Café&apos;s books task by task, in the order the bookkeeper and accountant actually do them: from the first deposit to closing the books and filing the tax return. Every step shows the job, why it&apos;s done, the entry, and the books updating live. Then carry on into the second year, where last year&apos;s balances, accruals and tax come back around.
      </PageHeader>
      <Suspense fallback={<PageSkeleton />}>
        <JobYears />
      </Suspense>
    </div>
  );
}
