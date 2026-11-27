"use client";

import { motion } from "motion/react";
import type { Equation } from "@/lib/engine/ledger";
import { money } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Term } from "@/components/learn/Term";

function Delta({ now, before }: { now: number; before?: number }) {
  if (before === undefined) return null;
  const d = Math.round((now - before) * 100) / 100;
  if (Math.abs(d) < 0.005) return <span className="text-xs text-stone-400">no change</span>;
  return <span className={cx("text-xs font-semibold", d > 0 ? "text-emerald-700" : "text-rose-700")}>{money(d, { sign: true, brackets: false })}</span>;
}

/** The accounting equation as two bars that must always be the same length */
export function EquationBar({ eq, prev, compact }: { eq: Equation; prev?: Equation; compact?: boolean }) {
  const max = Math.max(eq.assets, eq.liabilities + eq.equity, 1);
  const w = (x: number) => `${Math.max(0, (x / max) * 100)}%`;
  const profitPos = Math.max(0, eq.profit);
  const capital = eq.capital + Math.min(0, eq.profit);
  return (
    <div className={cx("rounded-2xl border border-stone-200 bg-white", compact ? "p-3" : "p-4")}>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-stone-500">The <Term k="accounting-equation">accounting equation</Term>:</span>
        <span className="font-semibold text-sky-700">Assets</span>
        <span className="num">{money(eq.assets, { dp: 0 })}</span>
        <Delta now={eq.assets} before={prev?.assets} />
        <span className="text-lg font-bold">=</span>
        <span className="font-semibold text-rose-700">Liabilities</span>
        <span className="num">{money(eq.liabilities, { dp: 0 })}</span>
        <Delta now={eq.liabilities} before={prev?.liabilities} />
        <span className="text-lg font-bold">+</span>
        <span className="font-semibold text-violet-700">Equity</span>
        <span className="num">{money(eq.equity, { dp: 0 })}</span>
        <Delta now={eq.equity} before={prev?.equity} />
        {Math.abs(eq.assets - eq.liabilities - eq.equity) < 0.01 ? (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">✓ balanced</span>
        ) : (
          <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">✗ not balanced</span>
        )}
      </div>
      {/* the bars repeat the figures above as a picture */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="flex h-6 overflow-hidden rounded-md bg-stone-100">
          <motion.div className="h-full bg-sky-600" animate={{ width: w(eq.assets) }} transition={{ type: "spring", damping: 25 }} title="Assets" />
        </div>
        <div className="flex h-6 overflow-hidden rounded-md bg-stone-100">
          <motion.div className="h-full bg-rose-500" animate={{ width: w(eq.liabilities) }} transition={{ type: "spring", damping: 25 }} title="Liabilities" />
          <motion.div className="h-full bg-violet-600" animate={{ width: w(capital) }} transition={{ type: "spring", damping: 25 }} title="Owners' capital" />
          <motion.div className="h-full bg-emerald-500" animate={{ width: w(profitPos) }} transition={{ type: "spring", damping: 25 }} title="Profit so far" />
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-sky-600" />Assets (what the café owns)</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-rose-500" />Liabilities (what it owes)</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-violet-600" />Owners&apos; capital</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Profit so far (income − expenses {money(eq.income, { dp: 0 })} − {money(eq.expenses, { dp: 0 })})</span>
        </div>
      )}
    </div>
  );
}
