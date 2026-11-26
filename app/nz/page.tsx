import Link from "next/link";
import { NZ_TOPICS } from "@/data/topics";
import { PageHeader } from "@/components/learn/bits";
import { RATES_AS_AT } from "@/lib/nz/rates";

export const metadata = { title: "NZ tax & rules – Kōwhai Café" };

export default function NzPage() {
  const groups = Array.from(new Set(NZ_TOPICS.map((t) => t.group)));
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader eyebrow="Part 3" title="New Zealand tax & rules, in depth">
        Everything specific to running the books for a small NZ business: GST, payroll, income tax, depreciation and compliance. Each page has calculators, and examples drawn from Kōwhai Café&apos;s real ledger. Rates as at {RATES_AS_AT}.
      </PageHeader>
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-3 text-xl font-bold">{g}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {NZ_TOPICS.filter((t) => t.group === g).map((t) => (
                <Link key={t.slug} href={`/nz/${t.slug}`} className="group rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-kowhai-500 hover:shadow">
                  <div className="text-lg font-semibold group-hover:underline">{t.title}</div>
                  <div className="text-sm text-stone-600">{t.blurb}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
