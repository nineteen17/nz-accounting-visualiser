import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/learn/PageSkeleton";
import type { Metadata } from "next";
import { CYCLE_STEPS } from "@/data/cycle";
import { StepShell } from "@/components/cycle/StepShell";
import { AnalyseStep, IdentifyStep, JournaliseStep, PostStep } from "@/components/cycle/steps/During";
import { TheYear } from "@/components/cycle/steps/TheYear";
import { AdjustedTBStep, AdjustmentsStep, BankRecStep, ClosingStep, PostClosingStep, StatementsStep, UnadjustedTBStep } from "@/components/cycle/steps/End";

const STEPS: Record<string, () => React.ReactNode> = {
  identify: () => <IdentifyStep />,
  analyse: () => <AnalyseStep />,
  journalise: () => <JournaliseStep />,
  post: () => <PostStep />,
  "the-year": () => <TheYear />,
  "unadjusted-tb": () => <UnadjustedTBStep />,
  "bank-reconciliation": () => <BankRecStep />,
  adjustments: () => <AdjustmentsStep />,
  "adjusted-tb": () => <AdjustedTBStep />,
  statements: () => <StatementsStep />,
  closing: () => <ClosingStep />,
  "post-closing": () => <PostClosingStep />,
};

export function generateStaticParams() {
  return CYCLE_STEPS.map((s) => ({ step: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const { step } = await params;
  const s = CYCLE_STEPS.find((x) => x.slug === step);
  return { title: s ? `Step ${s.n}: ${s.short} – Kōwhai Café` : "Accounting cycle" };
}

// The page reads its slug from the URL, so that part sits inside <Suspense>
// (Next.js instant navigation: URL data must not block the route's shell).
export default function Page({ params }: { params: Promise<{ step: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const render = STEPS[step];
  if (!render) notFound();
  return <StepShell slug={step}>{render()}</StepShell>;
}
