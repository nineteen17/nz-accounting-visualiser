import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/learn/PageSkeleton";
import type { Metadata } from "next";
import { NZ_TOPICS } from "@/data/topics";
import * as P from "@/components/nz/Payroll";
import * as T from "@/components/nz/Tax";
import { PageHeader } from "@/components/learn/bits";
import { SectionNav } from "@/components/learn/SectionNav";
import { RATES_AS_AT } from "@/lib/nz/rates";

const PAGES: Record<string, () => React.ReactNode> = {
  gst: () => <T.GstTopic />,
  "gst-return": () => <T.GstReturnTopic />,
  paye: () => <P.PayeTopic />,
  kiwisaver: () => <P.KiwiSaverTopic />,
  holidays: () => <P.HolidaysTopic />,
  employment: () => <P.EmploymentTopic />,
  acc: () => <P.AccTopic />,
  "income-tax": () => <T.IncomeTaxTopic />,
  "provisional-tax": () => <T.ProvisionalTaxTopic />,
  shareholders: () => <T.ShareholdersTopic />,
  depreciation: () => <T.DepreciationTopic />,
  inventory: () => <T.InventoryTopic />,
  "other-taxes": () => <T.OtherTaxesTopic />,
  compliance: () => <T.ComplianceTopic />,
};

export function generateStaticParams() {
  return NZ_TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  return { title: `${NZ_TOPICS.find((t) => t.slug === topic)?.title ?? "NZ"} – Kōwhai Café` };
}

// The page reads its slug from the URL, so that part sits inside <Suspense>
// (Next.js instant navigation: URL data must not block the route's shell).
export default function Page({ params }: { params: Promise<{ topic: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = NZ_TOPICS.find((x) => x.slug === topic);
  if (!t || !PAGES[topic]) notFound();
  const i = NZ_TOPICS.indexOf(t);
  const prev = NZ_TOPICS[i - 1];
  const next = NZ_TOPICS[i + 1];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SectionNav
        ariaLabel="NZ tax and rules topics"
        overview={{ href: "/nz", label: "NZ tax & rules" }}
        current={i}
        items={NZ_TOPICS.map((x, k) => ({ href: `/nz/${x.slug}`, n: k + 1, label: x.short, title: x.title }))}
      />
      <PageHeader eyebrow={`🇳🇿 ${t.group}`} title={t.title}>{t.blurb}</PageHeader>
      {PAGES[topic]()}
      <p className="mt-10 text-xs text-stone-500">Rates as at {RATES_AS_AT}. This is a learning tool, not tax advice. Check ird.govt.nz, employment.govt.nz and acc.co.nz.</p>
      <div className="mt-6 flex justify-between border-t border-stone-200 pt-6">
        {prev ? <Link href={`/nz/${prev.slug}`} className="rounded-xl border border-stone-300 px-4 py-3 text-sm hover:bg-white">← {prev.title}</Link> : <span />}
        {next ? (
          <Link href={`/nz/${next.slug}`} className="rounded-xl bg-kowhai-400 px-4 py-3 text-sm font-bold hover:bg-kowhai-300">Next: {next.title} →</Link>
        ) : (
          <Link href="/explore" className="rounded-xl bg-kowhai-400 px-4 py-3 text-sm font-bold hover:bg-kowhai-300">Explore the books →</Link>
        )}
      </div>
    </div>
  );
}
