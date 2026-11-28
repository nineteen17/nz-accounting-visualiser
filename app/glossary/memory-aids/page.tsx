import { Suspense } from "react";
import { PageHeader } from "@/components/learn/bits";
import { GlossaryTabs } from "@/components/learn/GlossaryTabs";
import { MemoryAidGroups } from "@/components/learn/MemoryAidGroups";

export const metadata = { title: "Memory aids – Kōwhai Café" };

export default function MemoryAidsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader eyebrow="Reference" title="Memory aids">
        Short, catchy ways to remember the ideas beginners mix up most: which side is a debit, what a trial balance can&apos;t catch, how to find the GST in a price, when things are due. Each one says <strong>why it works</strong>, so you understand it rather than just memorise it. You&apos;ll also meet them in the lessons and tasks where they&apos;re used. Pick a group below.
      </PageHeader>
      <GlossaryTabs current="aids" />
      <Suspense fallback={null}>
        <MemoryAidGroups />
      </Suspense>
    </div>
  );
}
