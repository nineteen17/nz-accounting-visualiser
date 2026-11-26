import { PageHeader } from "@/components/learn/bits";
import { GlossaryList } from "@/components/GlossaryList";

export const metadata = { title: "Glossary – Kōwhai Café" };

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader eyebrow="Reference" title="Glossary">
        Every term used in this tool, in plain English. Click any term for the full explanation, a café example and the common mistakes.
      </PageHeader>
      <GlossaryList />
    </div>
  );
}
