import Link from "next/link";
import { notFound } from "next/navigation";
import * as X from "@/components/explore/Tools";
import { PageHeader } from "@/components/learn/bits";
import { EXPLORE_TOOLS } from "../tools";

const TOOLS: Record<string, () => React.ReactNode> = {
  journal: () => <X.JournalTool />,
  ledger: () => <X.LedgerTool />,
  "trial-balance": () => <X.TrialBalanceTool />,
  statements: () => <X.StatementsTool />,
  ratios: () => <X.RatiosTool />,
  loan: () => <X.LoanTool />,
  "break-even": () => <X.BreakEvenTool />,
};

export function generateStaticParams() {
  return EXPLORE_TOOLS.map((t) => ({ tool: t.slug }));
}

export default async function Page({ params }: { params: Promise<{ tool: string }> }) {
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
    </div>
  );
}
