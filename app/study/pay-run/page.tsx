import { PageHeader } from "@/components/learn/bits";
import { LawBox } from "@/components/nz/LawBox";
import { PayRunPractice } from "@/components/study/PayRun";

export const metadata = { title: "Do a pay run yourself – Kōwhai Café" };

export default function PayRunPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader eyebrow="Practise" title="Do a pay run yourself">
        Take one of Kōwhai&apos;s real fortnightly pay runs: work out Mia&apos;s and Leo&apos;s payslips, record the pay run in the books, and do the payday filing.
      </PageHeader>
      <PayRunPractice />
      <div className="mt-10 space-y-6">
        <LawBox topic="paye" />
        <LawBox topic="kiwisaver" />
      </div>
    </div>
  );
}
