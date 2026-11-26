import Link from "next/link";
import { PageHeader } from "@/components/learn/bits";
import { UsVsNz } from "@/components/usnz/UsVsNz";

export const metadata = { title: "US GAAP vs NZ: every difference – Kōwhai Café" };

export default function UsVsNzPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader eyebrow="🇺🇸 → 🇳🇿 Reference" title="US GAAP vs New Zealand: every difference in one place">
        Learned the basics from an American source? This page translates everything: words, statements, tax, payroll, assets and business structures, with worked examples from Kōwhai Café.
      </PageHeader>
      <UsVsNz />
      <p className="mt-10 text-xs text-stone-500">
        US figures are general federal positions as a learning comparison; US state rules vary. NZ figures are for the 2026–27 year. This is a learning tool, not tax advice.{" "}
        <Link href="/foundations" className="underline">Back to Foundations</Link>
      </p>
    </div>
  );
}
