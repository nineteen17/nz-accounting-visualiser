import { PageHeader } from "@/components/learn/bits";
import { LawBox } from "@/components/nz/LawBox";
import { Ir4Practice } from "@/components/study/Ir4Return";

export const metadata = { title: "Do the company tax return yourself – Kōwhai Café" };

export default function Ir4Page() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader eyebrow="Practise" title="Do the company tax return yourself">
        Turn Kōwhai&apos;s profit into taxable income, fill in its real IR4 for either year (including the annual imputation return), and know when it&apos;s due and paid.
      </PageHeader>
      <Ir4Practice />
      <div className="mt-10 space-y-6">
        <LawBox topic="income-tax" />
        <LawBox topic="shareholders" />
        <LawBox topic="provisional-tax" />
      </div>
    </div>
  );
}
