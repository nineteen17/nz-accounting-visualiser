import Link from "next/link";
import type { ReactNode } from "react";
import { CYCLE_STEPS, stepIndex } from "@/data/cycle";
import { MarkVisited } from "./CycleWheel";
import { SectionNav } from "@/components/learn/SectionNav";
import { PractiseLinks } from "@/components/study/PractiseLinks";

export function StepShell({ slug, children }: { slug: string; children: ReactNode }) {
  const i = stepIndex(slug);
  const s = CYCLE_STEPS[i];
  const prev = CYCLE_STEPS[i - 1];
  const next = CYCLE_STEPS[i + 1];
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <MarkVisited slug={slug} />
      <SectionNav
        ariaLabel="Accounting cycle steps"
        overview={{ href: "/cycle", label: "Cycle overview" }}
        current={i}
        items={CYCLE_STEPS.map((x) => ({ href: `/cycle/${x.slug}`, n: x.n, label: x.short, title: x.title }))}
      />
      <header className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-wider text-kowhai-700">
          Accounting cycle · Step {s.n} · {s.when === "during" ? "during the year" : "at balance date"}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h1>
        <p className="mt-2 max-w-3xl text-lg text-stone-600">{s.blurb}</p>
      </header>
      {children}
      <PractiseLinks href={`/cycle/${slug}`} part={2} />
      <div className="mt-12 flex items-center justify-between gap-3 border-t border-stone-200 pt-6">
        {prev ? (
          <Link href={`/cycle/${prev.slug}`} className="rounded-xl border border-stone-300 px-4 py-3 text-sm hover:bg-white">
            ← Step {prev.n}: {prev.short}
          </Link>
        ) : (
          <Link href="/foundations" className="rounded-xl border border-stone-300 px-4 py-3 text-sm hover:bg-white">← Foundations</Link>
        )}
        <Link href="/cycle" className="text-sm text-stone-500 underline">Cycle overview</Link>
        {next ? (
          <Link href={`/cycle/${next.slug}`} className="rounded-xl bg-kowhai-400 px-4 py-3 text-sm font-bold hover:bg-kowhai-300">
            Step {next.n}: {next.short} →
          </Link>
        ) : (
          <Link href="/nz" className="rounded-xl bg-kowhai-400 px-4 py-3 text-sm font-bold hover:bg-kowhai-300">NZ tax deep dives →</Link>
        )}
      </div>
    </div>
  );
}
