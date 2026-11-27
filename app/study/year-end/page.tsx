import { PageHeader } from "@/components/learn/bits";
import { YearEndPractice } from "@/components/study/YearEnd";

export const metadata = { title: "Do the year-end yourself – Kōwhai Café" };

export default function YearEndPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader eyebrow="Practise" title="Do the year-end yourself">
        Start from Kōwhai&apos;s real trial balance on 31 March, before any adjustments. Post every year-end adjustment the accountant made, and see your own trial balance and profit change as you go.
      </PageHeader>
      <YearEndPractice />
    </div>
  );
}
