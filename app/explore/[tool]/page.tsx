import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSkeleton } from "@/components/learn/PageSkeleton";
import * as X from "@/components/explore/Tools";
import { PageHeader } from "@/components/learn/bits";
import { EXPLORE_TOOLS } from "../tools";
import { PractiseLinks } from "@/components/study/PractiseLinks";

const TOOLS: Record<string, () => React.ReactNode> = {
  journal: () => <X.JournalTool />,
  ledger: () => <X.LedgerTool />,
  "trial-balance": () => <X.TrialBalanceTool />,
  statements: () => <X.StatementsTool />,
  ratios: () => <X.RatiosTool />,
  loan: () => <X.LoanTool />,
  "break-even": () => <X.BreakEvenTool />,
};

// Only the slugs below exist: any other address gets the built-in 404 page (app/not-found.tsx).
export const dynamicParams = false;

export function generateStaticParams() {
  return EXPLORE_TOOLS.map((t) => ({ tool: t.slug }));
}

// The page reads its slug from the URL, so that part sits inside <Suspense>
// (Next.js instant navigation: URL data must not block the route's shell).
export default function Page({ params }: { params: Promise<{ tool: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const t = EXPLORE_TOOLS.find((x) => x.slug === tool);
  if (!t || !TOOLS[tool]) notFound();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap gap-1">
        {EXPLORE_TOOLS.map((x) => (
          <Link key={x.slug} href={`/explore/${x.slug}`} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${x.slug === tool ? "bg-ink text-white" : "bg-white hover:bg-stone-100"}`}>{x.title}</Link>
        ))}
      </nav>
      <PageHeader eyebrow="Explore the books" title={t.title}>{t.blurb}</PageHeader>
      {TOOLS[tool]()}
      <PractiseLinks href={`/explore/${tool}`} />
    </div>
  );
}
