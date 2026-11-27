"use client";

import { Fragment, useState, type ReactNode } from "react";
import { ASSUMPTIONS, SALES, SECTIONS, budgetStatement, isMaterial, variance, type BudgetLine } from "@/data/books/budget";
import { money, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";

const $0 = (x: number) => money(x, { dp: 0 });
const GRID = "grid grid-cols-[minmax(0,1fr)_4.4rem_4.4rem_5.4rem] items-baseline gap-x-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_7.5rem]";

/** "+$4,500 F" in green, "−$2,000 U" in red, "–" when on budget */
function Variance({ amount, nil }: { amount: number; nil?: boolean }) {
  if (nil || Math.abs(amount) < 0.5) return <span className="text-stone-400">–</span>;
  const fav = amount > 0;
  return (
    <span className={cx("font-semibold", fav ? "text-emerald-700" : "text-rose-700")}>
      {fav ? "+" : "−"}{$0(Math.abs(amount))}<span className="ml-1 text-[11px]" title={fav ? "Favourable" : "Unfavourable"}>{fav ? "F" : "U"}</span>
    </span>
  );
}

function Row({ label, budget, actual, income, bold, note, rule }: { label: ReactNode; budget: number; actual: number; income: boolean; bold?: boolean; note?: ReactNode; rule?: boolean }) {
  const v = variance({ income, actual }, budget);
  return (
    <div className={cx("py-1", rule && "border-t border-stone-300", bold && "font-semibold")}>
      <div className={cx(GRID, "text-[13px] sm:text-sm")}>
        <span className="min-w-0">{label}</span>
        <span className="num text-right text-stone-500">{$0(budget)}</span>
        <span className="num text-right">{$0(actual)}</span>
        <span className="num text-right"><Variance amount={v.amount} nil={v.nil} /></span>
      </div>
      {note && <div className="mt-0.5 pr-1 text-xs leading-snug text-stone-500">{note}</div>}
    </div>
  );
}

export function BudgetTool() {
  const [flex, setFlex] = useState(false);
  const [basis, setBasis] = useState(false);
  const s = budgetStatement(flex);
  const big = s.lines
    .map((l) => ({ l, v: variance(l, l.budget) }))
    .filter(({ l, v }) => isMaterial(v.amount, l.budget))
    .sort((a, b) => Math.abs(b.v.amount) - Math.abs(a.v.amount));
  const pbt = variance({ income: true, actual: s.actual.profitBeforeTax }, s.budget.profitBeforeTax);

  const note = (l: BudgetLine) => {
    const v = variance(l, l.budget);
    const why = isMaterial(v.amount, l.budget) && l.why;
    if (!basis && !why) return undefined;
    return (
      <>
        {basis && <span className="block"><span className="font-semibold text-stone-600">Budget: </span>{l.basis}{flex && l.variable ? ` Flexed to actual sales: ${$0(l.budget)}.` : ""}</span>}
        {why && <span className={cx("block", v.favourable ? "text-emerald-800" : "text-rose-800")}><span className="font-semibold">Why: </span>{l.why}</span>}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="prose-learn text-[16px]">
          <p>A <Term k="budget">budget</Term> is the plan for the year in numbers. In March 2027 Aroha and Ben planned year 2 line by line: last year&apos;s actual figures, plus what they already knew was coming (the pay rises, the fixed rent, the loan repayments). Now the year is over, they compare it with what really happened.</p>
          <p>Each difference is a <Term k="variance">variance</Term>: actual minus budget. It&apos;s <strong className="text-emerald-700">favourable (F)</strong> when it helps profit (more income, or less cost than planned) and <strong className="text-rose-700">unfavourable (U)</strong> when it hurts. The point isn&apos;t the arithmetic: it&apos;s asking <em>why</em>, for the big ones.</p>
          <p>Some costs move with sales. If more coffee is sold, more beans are bought, and that isn&apos;t overspending. A <Term k="flexible-budget">flexible budget</Term> resizes those lines to the sales actually made, so what&apos;s left is the real story.</p>
        </div>
        <Card>
          <h3 className="text-lg font-bold">Year 2 at a glance</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Tile label="Budgeted profit before tax" value={$0(s.budget.profitBeforeTax)} />
            <Tile label="Actual" value={$0(s.actual.profitBeforeTax)} />
            <Tile label="Difference" value={<Variance amount={pbt.amount} />} />
          </div>
          <div className="mt-4 text-sm font-semibold text-stone-600">The biggest differences</div>
          <ul className="mt-1 space-y-1.5 text-sm">
            {big.slice(0, 4).map(({ l, v }) => (
              <li key={l.code} className="flex gap-2">
                <span className="num w-24 shrink-0 text-right"><Variance amount={v.amount} /></span>
                <span className="min-w-0">{l.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">Sales budget {$0(SALES.budget)} (last year {$0(SALES.lastYear)} + {pct(ASSUMPTIONS.salesGrowth, 0)}); actual {$0(SALES.actual)}.</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-2xl bg-stone-100 px-4 py-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={flex} onChange={(e) => setFlex(e.target.checked)} className="h-4 w-4 accent-kowhai-600" />
          <span><strong>Flex the budget</strong> to the actual sales (cost of sales and card fees)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={basis} onChange={(e) => setBasis(e.target.checked)} className="h-4 w-4 accent-kowhai-600" />
          <span>Show how each budget figure was set</span>
        </label>
      </div>

      <div className="doc-paper mx-auto max-w-3xl rounded-sm px-3 py-5 sm:px-8">
        <div className="mb-3 text-center">
          <h3 className="text-lg font-bold">Budget vs actual: year ended 31 March 2028</h3>
          <div className="text-sm text-stone-500">{flex ? "Flexible budget: variable costs resized to actual sales" : "The budget as set in March 2027"}</div>
        </div>
        <div className={cx(GRID, "border-b-2 border-stone-700 pb-1 text-right text-[11px] font-bold uppercase tracking-wider text-stone-500")}>
          <span />
          <span>Budget</span>
          <span>Actual</span>
          <span>Variance</span>
        </div>
        {SECTIONS.map((sec) => (
          <Fragment key={sec}>
            <div className="mt-3 border-b border-stone-200 pb-0.5 text-xs font-bold uppercase tracking-wider text-stone-500">{sec}</div>
            {s.lines.filter((l) => l.section === sec).map((l) => (
              <Row key={l.code} label={l.label} budget={l.budget} actual={l.actual} income={l.income} note={note(l)} />
            ))}
            {sec === "Cost of sales" && <Row label="Gross profit" budget={s.budget.grossProfit} actual={s.actual.grossProfit} income bold rule />}
            {sec === "Expenses" && <Row label="Total expenses" budget={s.budget.expenses} actual={s.actual.expenses} income={false} bold rule />}
          </Fragment>
        ))}
        <div className="mt-3" />
        <Row label="Profit before tax" budget={s.budget.profitBeforeTax} actual={s.actual.profitBeforeTax} income bold rule />
        <Row label="Income tax" budget={s.budget.tax} actual={s.actual.tax} income={false} note={basis ? <><span className="font-semibold text-stone-600">Budget: </span>{s.taxBasis}</> : undefined} />
        <Row label="Profit after tax" budget={s.budget.profitAfterTax} actual={s.actual.profitAfterTax} income bold rule />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout kind="tip" title="What it tells Aroha and Ben">
          Profit came in under budget mostly because of a decision, not a surprise: higher shareholder salaries. The lessons for next year&apos;s budget are about how it was built: year 1&apos;s cost of sales was flattered by the café stocking up for the first time (flex the budget to see it), and the first full accountant&apos;s bill wasn&apos;t planned for. Budgeting from a first year&apos;s figures needs care.
        </Callout>
        <div>
          <UsNote>
            <p>Same idea, US spelling: <em>favorable</em> and <em>unfavorable</em> variances. US managerial accounting courses go further, splitting variances into price and quantity (or rate and efficiency) parts. NZ small businesses usually stop at budget vs actual, often in Xero or MYOB&apos;s budget report.</p>
          </UsNote>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-kowhai-50 p-2">
      <div className="text-[11px] leading-tight text-stone-500">{label}</div>
      <div className="num mt-1 text-base font-bold sm:text-lg">{value}</div>
    </div>
  );
}
