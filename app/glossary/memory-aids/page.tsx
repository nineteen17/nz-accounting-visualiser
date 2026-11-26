import { PageHeader } from "@/components/learn/bits";
import { GlossaryTabs } from "@/components/learn/GlossaryTabs";
import { MemoryAid } from "@/components/learn/MemoryAid";
import { AID_GROUPS, MEMORY_AIDS, type AidGroup } from "@/data/memoryAids";

export const metadata = { title: "Memory aids – Kōwhai Café" };

export default function MemoryAidsPage() {
  const groups = Object.keys(AID_GROUPS) as AidGroup[];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader eyebrow="Reference" title="Memory aids">
        Short, catchy ways to remember the ideas beginners mix up most: which side is a debit, what a trial balance can&apos;t catch, how to find the GST in a price, when things are due. Each one says <strong>why it works</strong>, so you understand it rather than just memorise it. You&apos;ll also meet them in the lessons and tasks where they&apos;re used.
      </PageHeader>
      <GlossaryTabs current="aids" />
      <nav className="mb-8 flex flex-wrap gap-2 text-sm" aria-label="Memory aid groups">
        {groups.map((g) => (
          <a key={g} href={`#${g}`} className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-800 ring-1 ring-teal-200 hover:bg-teal-100">{AID_GROUPS[g].title}</a>
        ))}
      </nav>
      {groups.map((g) => (
        <section key={g} id={g} className="mb-10 scroll-mt-24">
          <h2 className="text-xl font-bold">{AID_GROUPS[g].title}</h2>
          <p className="text-sm text-stone-600">{AID_GROUPS[g].blurb}</p>
          <div className="mt-2 grid items-start gap-x-4 md:grid-cols-2">
            {MEMORY_AIDS.filter((a) => a.group === g).map((a) => <MemoryAid key={a.key} k={a.key} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
