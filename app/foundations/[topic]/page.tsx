import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/learn/PageSkeleton";
import type { Metadata } from "next";
import { FOUNDATIONS } from "@/data/topics";
import * as L from "@/components/foundations/Lessons";
import { PageHeader } from "@/components/learn/bits";
import { SectionNav } from "@/components/learn/SectionNav";
import { UsVsNz } from "@/components/usnz/UsVsNz";

const LESSONS: Record<string, () => React.ReactNode> = {
  "what-is-accounting": () => <L.WhatIsAccounting />,
  "five-elements": () => <L.FiveElements />,
  "accounting-equation": () => <L.AccountingEquation />,
  "double-entry": () => <L.DoubleEntry />,
  "debits-credits": () => <L.DebitsCredits />,
  "t-accounts": () => <L.TAccounts />,
  "chart-of-accounts": () => <L.ChartOfAccounts />,
  "source-documents": () => <L.SourceDocuments />,
  "cash-vs-accrual": () => <L.CashVsAccrual />,
  "business-structures": () => <L.BusinessStructures />,
  "us-vs-nz": () => <UsVsNz />,
};

// Only the slugs below exist: any other address gets the built-in 404 page (app/not-found.tsx).
export const dynamicParams = false;

export function generateStaticParams() {
  return FOUNDATIONS.map((f) => ({ topic: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  return { title: `${FOUNDATIONS.find((f) => f.slug === topic)?.title ?? "Foundations"} – Kōwhai Café` };
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
  const i = FOUNDATIONS.findIndex((f) => f.slug === topic);
  if (i < 0 || !LESSONS[topic]) notFound();
  const f = FOUNDATIONS[i];
  const prev = FOUNDATIONS[i - 1];
  const next = FOUNDATIONS[i + 1];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SectionNav
        ariaLabel="Foundations lessons"
        overview={{ href: "/foundations", label: "Foundations" }}
        current={i}
        items={FOUNDATIONS.map((x, k) => ({ href: `/foundations/${x.slug}`, n: k + 1, label: x.short, title: x.title }))}
      />
      <PageHeader eyebrow={`Lesson ${i + 1}`} title={f.title}>{f.blurb}</PageHeader>
      {LESSONS[topic]()}
      <div className="mt-12 flex justify-between border-t border-stone-200 pt-6">
        {prev ? <Link href={`/foundations/${prev.slug}`} className="rounded-xl border border-stone-300 px-4 py-3 text-sm hover:bg-white">← {prev.title}</Link> : <span />}
        {next ? (
          <Link href={`/foundations/${next.slug}`} className="rounded-xl bg-kowhai-400 px-4 py-3 text-sm font-bold hover:bg-kowhai-300">Next: {next.title} →</Link>
        ) : (
          <Link href="/cycle" className="rounded-xl bg-kowhai-400 px-4 py-3 text-sm font-bold hover:bg-kowhai-300">Start the accounting cycle →</Link>
        )}
      </div>
    </div>
  );
}
