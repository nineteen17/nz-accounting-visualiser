import { PageHeader } from "@/components/learn/bits";
import { Study } from "@/components/study/Study";

export const metadata = { title: "Study – Kōwhai Café" };

export default function StudyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader eyebrow="Practise" title="Study">
        Make it stick. <strong>Flashcards</strong> test you on the glossary terms and bring each one back just before you&apos;d forget it.{" "}
        <strong>Drills</strong> are quick, auto-marked questions made from Kōwhai&apos;s books: debit or credit, which statement, GST maths, due dates.
      </PageHeader>
      <Study />
    </div>
  );
}
