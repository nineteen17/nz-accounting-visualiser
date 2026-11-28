import { PageHeader } from "@/components/learn/bits";
import { GstReturnPractice } from "@/components/study/GstReturn";

export const metadata = { title: "Do the GST return yourself – Kōwhai Café" };

export default function GstReturnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader eyebrow="Practise" title="Do the GST return yourself">
        Take one of Kōwhai&apos;s real two-monthly GST periods, sort its transactions into the return, fill in the GST101A, and compare it with the return Kōwhai filed.
      </PageHeader>
      <GstReturnPractice />
    </div>
  );
}
