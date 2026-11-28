"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFERRED_YEARS } from "@/data/books/deferredTax";
import { COMPANY_TAX_RATE, LARGE_COMPANY } from "@/lib/nz/rates";
import { money, nzDate, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";

const $ = (x: number) => money(x);
const $m = (x: number) => `$${x / 1_000_000} million`;
const RATE = pct(COMPANY_TAX_RATE, 0);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const CAANZ = "https://www.charteredaccountantsanz.com/tools-and-resources/client-service-essentials/reporting/a-special-purpose-financial-reporting-framework-for-use-by-forprofit-entities";
const IAS12 = "https://www.xrb.govt.nz/dmsdocument/1013/";

function Mistake({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm text-rose-800">⚠️ <strong>Common mistake:</strong> {children}</p>;
}

export function DeferredTaxTool() {
  const [key, setKey] = useState<"y1" | "y2">("y1");
  const y = DEFERRED_YEARS.find((x) => x.key === key)!;
  const e = y.expense;
  const flat = y.profitBeforeTax * COMPANY_TAX_RATE;
  const dt = y.diffs;
  const up = e.movement >= 0;

  return (
    <div className="space-y-8">
      <ToolGuide
        what={<>Kōwhai&apos;s tax rate is {RATE}, but its tax expense isn&apos;t {RATE} of its profit. That isn&apos;t a mistake. Some things count in the accounts in one year and on the tax return in another (<strong>temporary differences</strong>), and a few never count for tax at all (<strong>permanent differences</strong>). Big companies record <strong>deferred tax</strong> to even out the timing. Kōwhai doesn&apos;t have to, and this page shows why, and what it would look like if it did.</>}
        steps={[
          <>Pick a <strong>year</strong>.</>,
          <>Start with <strong>the gap</strong>: {RATE} of profit beside the tax Kōwhai actually recorded.</>,
          <>Read <strong>sort the differences</strong>: each line of the tax reconciliation, temporary or permanent.</>,
          <>Look at <strong>the balance sheet view</strong>: each item in the accounts against its value for tax.</>,
          <>Compare <strong>the two methods</strong>: Kōwhai&apos;s real books, and what deferred tax would add.</>,
        ]}
        read={<>All figures come from Kōwhai&apos;s books. A <strong>liability</strong> in the deferred tax column means more tax in later years; an <strong>asset</strong> means less. Kōwhai&apos;s real statements use the taxes payable method: the deferred tax figures are a &ldquo;what if&rdquo;.</>}
        terms={[
          { k: "taxable-income", says: "profit worked out under the tax rules: the figure the 28% applies to." },
          { k: "temporary-difference", says: "the same income or expense, counted in different years by the accounts and by tax." },
          { k: "permanent-difference", says: "something the accounts count but tax never does (or the other way round)." },
          { k: "tax-base", says: "what an asset or liability is worth for tax." },
          { k: "deferred-tax", says: "the tax effect of the temporary differences, recorded now." },
          { k: "taxes-payable-method", says: "tax expense = the tax owed for the year. What Kōwhai uses." },
          { k: "effective-tax-rate", says: "tax expense as a share of profit before tax." },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {DEFERRED_YEARS.map((x) => (
          <button key={x.key} onClick={() => setKey(x.key)}
            className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", x.key === key ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>
            {x.label}: 31 March {x.yearEnd.slice(0, 4)}
          </button>
        ))}
      </div>

      {/* 1. the gap */}
      <section>
        <h2 className="text-xl font-bold">1. The gap</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card><div className="text-sm text-stone-500">Profit before tax</div><div className="num text-xl font-bold">{$(y.profitBeforeTax)}</div></Card>
          <Card><div className="text-sm text-stone-500">{RATE} of that</div><div className="num text-xl font-bold">{$(flat)}</div></Card>
          <Card><div className="text-sm text-stone-500">Tax expense in Kōwhai&apos;s books</div><div className="num text-xl font-bold">{$(e.taxesPayable)}</div><div className="text-sm text-stone-600">{pct(e.effectivePayable, 1)} of profit</div></Card>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed">
          The tax expense is the tax on <Term k="taxable-income">taxable income</Term> ({$(y.taxableIncome)}), not on profit. Taxable income is {$(Math.abs(y.taxableIncome - y.profitBeforeTax))} {y.taxableIncome < y.profitBeforeTax ? "lower" : "higher"} than profit: that&apos;s the lines of the tax reconciliation.{" "}
          {key === "y1"
            ? "In year 1 the tax return deducts more than the accounts do, mostly because Investment Boost and tax depreciation write the new equipment off faster. So the tax is lower than 28% of profit."
            : "In year 2 it goes the other way: last year's holiday pay and ACC levy are deducted now, but the bigger effect is that the equipment's tax deductions have slowed down after Investment Boost. So the tax is higher than 28% of profit."}
        </p>
        <Mistake>Calling the gap an error. Kōwhai&apos;s tax is right: it&apos;s the profit that&apos;s measured differently.</Mistake>
      </section>

      {/* 2. sort the differences */}
      <section>
        <h2 className="text-xl font-bold">2. Sort the differences</h2>
        <p className="mt-1 text-[15px] text-stone-600">Each line of {y.label.toLowerCase()}&apos;s tax reconciliation. <strong>Temporary</strong> ones reverse in a later year. <strong>Permanent</strong> ones never do.</p>
        <ul className="mt-3 space-y-2">
          {y.items.map((i) => (
            <li key={i.label} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{cap(i.label.replace(/^(Add back|Less|Add): /, ""))}</span>
                <span className="flex items-baseline gap-2">
                  <span className={cx("rounded-full px-2 py-0.5 text-xs font-semibold", i.kind === "permanent" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800")}>{i.kind}</span>
                  <span className="num">{i.amount >= 0 ? "+" : "−"}{$(Math.abs(i.amount))}</span>
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-600">{i.why}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Permanent differences</td><td className="num py-1.5 text-right">{$(y.permanent)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Temporary differences, this year</td><td className="num py-1.5 text-right">{$(y.temporary)}</td></tr>
              <tr className="font-semibold"><td className="py-1.5 pr-2">Taxable income less profit</td><td className="num py-1.5 text-right">{$(y.taxableIncome - y.profitBeforeTax)}</td></tr>
            </tbody>
          </table>
        </div>
        <Mistake>Treating entertainment as a timing difference. The non-deductible half is never deducted, in any year.</Mistake>
      </section>

      {/* 3. the balance sheet view */}
      <section>
        <h2 className="text-xl font-bold">3. The balance sheet view, at {nzDate(y.yearEnd)}</h2>
        <p className="mt-1 text-[15px] text-stone-600">Deferred tax is worked out from the balance sheet: each item&apos;s figure in the accounts against its <Term k="tax-base">tax base</Term>. The difference, times {RATE}, is the tax it will bring later.</p>
        <ul className="mt-3 space-y-2">
          {dt.rows.map((r, n) => (
            <li key={r.key} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
              <div className="font-semibold">{r.label}</div>
              {r.explain !== dt.rows[n - 1]?.explain && <p className="mt-0.5 text-sm text-stone-600">{r.explain}</p>}
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-stone-500">In the accounts</dt><dd className="num">{r.side === "liability" ? `(${$(r.carrying)})` : $(r.carrying)}</dd></div>
                <div><dt className="text-xs text-stone-500">Tax base</dt><dd className="num">{$(r.taxBase)}</dd></div>
                <div><dt className="text-xs text-stone-500">Difference</dt><dd className="num">{$(Math.abs(r.diff))} <span className="font-sans text-xs text-stone-500">{r.diff >= 0 ? "taxable later" : "deductible later"}</span></dd></div>
                <div><dt className="text-xs text-stone-500">Deferred tax at {RATE}</dt><dd className="num font-semibold">{$(Math.abs(r.deferred))} <span className="font-sans text-xs font-normal text-stone-500">{r.kind}</span></dd></div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-xl bg-stone-100 p-3 text-sm">
          <div className="flex justify-between gap-2"><span>Deferred tax liabilities</span><span className="num">{$(dt.liabilities)}</span></div>
          <div className="flex justify-between gap-2"><span>Less deferred tax assets</span><span className="num">({$(dt.assets)})</span></div>
          <div className="mt-1 flex justify-between gap-2 border-t border-stone-300 pt-1 font-semibold"><span>Net deferred tax {dt.net >= 0 ? "liability" : "asset"}</span><span className="num">{$(Math.abs(dt.net))}</span></div>
        </div>
        <p className="mt-2 text-sm text-stone-600">Liabilities are shown in brackets. An accrual tax hasn&apos;t deducted yet has a tax base of nil, so all of it is deductible later.</p>
        <Mistake>Thinking a deferred tax liability is tax owed now. Nothing is payable until the differences reverse, in later tax returns.</Mistake>
      </section>

      {/* 4. two methods */}
      <section>
        <h2 className="text-xl font-bold">4. Two methods, side by side</h2>
        <div className="mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-stone-500">
                <th className="py-1 pr-2" />
                <th className="px-2 text-right font-semibold">Taxes payable<span className="block font-normal">Kōwhai&apos;s books</span></th>
                <th className="pl-2 text-right font-semibold">Deferred tax<span className="block font-normal">NZ IAS 12</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Current tax (this year&apos;s return)</td><td className="num px-2 text-right">{$(e.taxesPayable)}</td><td className="num pl-2 text-right">{$(e.taxesPayable)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Deferred tax: change in the year</td><td className="num px-2 text-right">–</td><td className="num pl-2 text-right">{up ? "" : "−"}{$(Math.abs(e.movement))}</td></tr>
              <tr className="border-b border-stone-200 font-semibold"><td className="py-1.5 pr-2">Tax expense</td><td className="num px-2 text-right">{$(e.taxesPayable)}</td><td className="num pl-2 text-right">{$(e.deferredMethod)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Effective tax rate</td><td className="num px-2 text-right">{pct(e.effectivePayable, 1)}</td><td className="num pl-2 text-right">{pct(e.effectiveDeferred, 1)}</td></tr>
              <tr><td className="py-1.5 pr-2">Deferred tax on the balance sheet</td><td className="num px-2 text-right">–</td><td className="num pl-2 text-right">{$(Math.abs(dt.net))} {dt.net >= 0 ? "liability" : "asset"}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed">
          Under the deferred tax method the expense is {RATE} of profit <em>plus the permanent differences</em>: ({$(y.profitBeforeTax)} + {$(y.permanent)}) × {RATE} = {$(e.expected)}. It&apos;s {$(Math.abs(e.expected - e.deferredMethod))} out only because IRD taxes whole dollars. The timing differences have been evened out; only the permanent one is left.
        </p>
        <div className="mt-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">The entry deferred tax would add at {nzDate(y.yearEnd)}</div>
          <table className="mt-2 w-full text-sm">
            <tbody>
              <tr><td className="py-1 pr-2">Dr {up ? "Income tax expense" : "Deferred tax liability"}</td><td className="num text-right">{$(Math.abs(e.movement))}</td></tr>
              <tr><td className="py-1 pr-2 pl-6">Cr {up ? "Deferred tax liability" : "Income tax expense"}</td><td className="num text-right">{$(Math.abs(e.movement))}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-sm text-stone-600">
            {key === "y1"
              ? "Year 1 starts with no deferred tax, so the whole closing balance goes through this year's expense."
              : `Year 2 starts with last year's ${$(y.openingDeferred)} liability and ends with ${$(dt.net)}. The difference reverses through the expense: year 1's timing differences are unwinding.`}
          </p>
        </div>
      </section>

      {/* 5. why Kōwhai doesn't */}
      <section>
        <h2 className="text-xl font-bold">5. Why Kōwhai doesn&apos;t record it</h2>
        <Callout kind="nz" title="Small NZ companies prepare accounts for IRD, not to NZ GAAP">
          <p>Only a <strong>large</strong> company has to prepare financial statements that follow NZ GAAP, which includes deferred tax under NZ IAS 12. &ldquo;Large&rdquo; means more than {$m(LARGE_COMPANY.totalAssets)} of assets or {$m(LARGE_COMPANY.totalRevenue)} of revenue, in each of the two previous years (Financial Reporting Act 2013 s 45; Companies Act ss 200–201). Public entities and companies with 10 or more shareholders that haven&apos;t opted out are caught too.</p>
          <p className="mt-2">Kōwhai is none of these. Its accounts are <strong>special-purpose</strong>: prepared for IRD, to the minimum in the Tax Administration (Financial Statements) Order 2014, which asks for a reconciliation to taxable income but not deferred tax. Most accountants use <a href={CAANZ} target="_blank" rel="noreferrer" className="underline">CA ANZ&apos;s special purpose framework</a>, whose default is the <Term k="taxes-payable-method">taxes payable method</Term>. It allows deferred tax under <a href={IAS12} target="_blank" rel="noreferrer" className="underline">NZ IAS 12</a> as an option.</p>
        </Callout>
        <p className="text-[15px] leading-relaxed">
          For a café, the taxes payable method is simpler, and its tax expense matches the IR4 exactly. The cost is that the effective rate jumps around, as it does here ({pct(DEFERRED_YEARS[0].expense.effectivePayable, 1)} in year 1, {pct(DEFERRED_YEARS[1].expense.effectivePayable, 1)} in year 2). A bank lending to Kōwhai would usually know to look past that.
        </p>
      </section>

      <UsNote>
        Under <strong>US GAAP</strong>, deferred tax is required (ASC 740), for private companies as well as public ones: a learner from a US course would expect it in every set of accounts. The same balance sheet approach is used. A private US company can instead use a <strong>special purpose framework</strong>, such as the tax basis or the AICPA&apos;s FRF for SMEs, which lets it choose the taxes payable method: the same choice a small NZ company has. Where US GAAP has a book-to-tax reconciliation on Schedule M-1 of Form 1120, NZ has the reconciliation the IRD Order asks for.
      </UsNote>

      <p className="text-[15px]">
        See also: <Link href="/nz/income-tax" className="font-semibold underline">Company income tax</Link> · <Link href="/study/ir4" className="font-semibold underline">Do the company tax return yourself</Link>
      </p>
    </div>
  );
}
