import Link from "next/link";
import type { ReactNode } from "react";
import { ALL as Y1_ALL, BEFORE_CLOSING as Y1_BEFORE, NET_PROFIT as Y1_NET } from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { balances } from "@/lib/engine/ledger";
import { profitAndLoss } from "@/lib/engine/statements";
import { money, nzDate, pct } from "@/lib/money";
import { KIWISAVER, MINIMUM_WAGE, PAYROLL_2026_27, PAYROLL_2027_28 as Y2R, PROVISIONAL_TAX, RWT } from "@/lib/nz/rates";
import { ChangesInEquityY2, ComparativeBS, ComparativeCashFlow, ComparativePL } from "@/components/visual/Comparatives";
import { TaxRecView } from "@/components/cycle/steps/End";
import { Callout, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";

export const metadata = { title: "The second year, with comparatives – Kōwhai Café" };

const y1Bal = balances(Y1_ALL);
const y2Bal = balances(Y2.WITH_OPENING);
const pl1 = profitAndLoss(balances(Y1_BEFORE));
const pl2 = profitAndLoss(balances(Y2.BEFORE_CLOSING));
const cash = (b: Record<string, number>) => (b["100"] ?? 0) + (b["105"] ?? 0);

function Section({ id, title, children, intro }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold">{title}</h2>
      {intro && <p className="mb-4 mt-1 max-w-3xl text-stone-600">{intro}</p>}
      <div className={intro ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

const Stat = ({ label, now, prev }: { label: string; now: number; prev: number }) => (
  <div className="rounded-xl border border-stone-200 bg-white p-4">
    <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</div>
    <div className="num text-2xl font-black">{money(now, { dp: 0 })}</div>
    <div className="num text-xs text-stone-500">last year {money(prev, { dp: 0 })}</div>
  </div>
);

export default function SecondYearPage() {
  const icaClosing = Y2.YEAR2_FACTS.icaClosing;
  const icaRows = Y2.ICA.map((e, i) => ({ ...e, balance: Y2.ICA.slice(0, i + 1).reduce((s, x) => s + x.credit - x.debit, 0) }));
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
      <div>
        <Link href="/on-the-job?year=2" className="text-sm text-stone-500 underline">← A year on the job</Link>
        <div className="mt-3 text-sm font-semibold uppercase tracking-wider text-kowhai-700">Year 2 · 1 April 2027 – 31 March 2028</div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The second year, with comparatives</h1>
        <p className="mt-2 max-w-3xl text-lg text-stone-600">
          Kōwhai Café&apos;s second year, built from {Y2.ALL.length} journal entries on top of last year&apos;s closing balances. From now on every statement has two columns: this year and last year, called <Term k="comparatives">comparatives</Term>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/on-the-job?year=2" className="rounded-xl bg-kowhai-400 px-5 py-2.5 font-bold text-ink hover:bg-kowhai-300">Work through year 2 task by task →</Link>
          <Link href="/on-the-job" className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold hover:bg-white">Start with year 1</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" now={pl2.revenueTotal} prev={pl1.revenueTotal} />
        <Stat label="Profit before tax" now={pl2.profitBeforeTax} prev={pl1.profitBeforeTax} />
        <Stat label="Income tax" now={pl2.tax} prev={pl1.tax} />
        <Stat label="Profit after tax" now={Y2.NET_PROFIT} prev={Y1_NET} />
      </div>

      <Section id="changed" title="What's new in year 2">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Opening balances", "Balance sheet accounts carry on from 31 March 2027. Income and expenses start at zero. Inventory now has an opening figure, so cost of sales = opening stock + purchases − closing stock.", "/on-the-job?year=2&step=NEW-YEAR"],
            ["Reversing entries", "Last year's accrued income, accrued power, accrued wages and prepaid insurance are reversed on 1 April, so the real invoices and pay runs can be entered normally.", "/on-the-job?year=2&step=REVERSALS"],
            ["Last year's tax falls due", `The final GST return (7 May 2027) and terminal tax (${money(Y2.YEAR2_FACTS.y1Terminal, { dp: 0 })}, due 7 April 2028) belong to year 1 but are paid in year 2.`, "/on-the-job?year=2&step=GST-P6"],
            ["Provisional tax", `Last year's RIT was over $5,000, so tax is paid during the year: ${money(Y2.PROVISIONAL.total, { dp: 0 })} (RIT + 5%) in three instalments.`, "/on-the-job?year=2&step=B08"],
            ["Annual leave taken", "Mia takes the leave she earned last year. It's paid out of the holiday pay accrual, not expensed again. For tax, it's deductible now that it's paid.", `/on-the-job?year=2&step=PAY-2027-07-28`],
            ["Selling an asset", `The old POS system sells for ${money(Y2.DISPOSAL.price, { dp: 0 })}: a ${money(Y2.DISPOSAL.accountingGain, { dp: 0 })} gain in the accounts, ${money(Y2.DISPOSAL.recovered, { dp: 0 })} of depreciation recovery for tax.`, "/on-the-job?year=2&step=B10"],
            ["A dividend", `${money(Y2.DIVIDEND.cash, { dp: 0 })} cash, fully imputed (${money(Y2.DIVIDEND.ic, { dp: 0 })} of credits), with ${money(Y2.DIVIDEND.rwt, { dp: 0 })} of dividend RWT. The directors sign a solvency certificate first.`, "/on-the-job?year=2&step=B17"],
            ["Pay rises & new levy rate", `Mia $27/hr and Leo $25.50/hr. The ACC earners' levy rises to ${pct(Y2R.acc.rate, 2)} on 1 April 2027.`, "/on-the-job?year=2&step=PAY-2027-04-21"],
            ["Comparatives", "Every statement shows last year beside this year, so the reader can see what changed.", "#statements"],
          ].map(([t, d, href]) => (
            <Link key={t} href={href} className="group rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-kowhai-500">
              <div className="font-bold group-hover:underline">{t}</div>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="statements" title="Profit & loss" intro="Sales grew about 6% and catering income included the wedding. Wages are up with the pay rises, and there's a small gain from selling the old POS system. Note the first-ever opening stock in cost of sales.">
        <ComparativePL now={balances(Y2.BEFORE_CLOSING)} prev={balances(Y1_BEFORE)} />
      </Section>

      <Section id="balance-sheet" title="Balance sheet" intro="Income tax payable is higher than last year: it holds BOTH last year's terminal tax (due 7 April 2028) and the part of this year's tax not yet paid. The holiday pay accrual is a new year's worth: last year's leave has been taken.">
        <ComparativeBS now={y2Bal} prev={y1Bal} />
      </Section>

      <Section id="equity" title="Changes in equity" intro="Equity now starts from last year's closing balance. The dividend reduces retained earnings directly: it's a distribution to the owners, not an expense.">
        <ChangesInEquityY2 opening={Y2.OPENING_BALANCES} closing={y2Bal} profitAfterTax={Y2.NET_PROFIT} dividends={Y2.DIVIDEND.cash} />
      </Section>

      <Section id="cash-flow" title="Cash flows" intro="Investing now has an inflow (selling the old POS system) as well as an outflow (the new one). Financing shows the dividend for the first time.">
        <ComparativeCashFlow now={Y2.ALL} prev={Y1_ALL} cashNow={[cash(Y2.OPENING_BALANCES), cash(y2Bal)]} cashPrev={[0, cash(y1Bal)]} />
      </Section>

      <Section id="tax" title="Income tax reconciliation" intro="New lines this year: holiday pay reverses, the asset sale swaps the accounting gain for depreciation recovery, and the new POS system gets Investment Boost.">
        <TaxRecView year={2} />
      </Section>

      <Section id="ica" title="Imputation credit account" intro="A memorandum record, kept for IRD and not part of the ledger. Tax paid adds credits; imputation credits attached to dividends use them up. It mustn't be in debit at 31 March.">
        <div className="max-w-3xl overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-700 bg-stone-50 text-right text-xs uppercase tracking-wider text-stone-500">
                <th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2">Credit</th><th className="px-3 py-2">Debit</th><th className="px-3 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {icaRows.map((e) => {
                return (
                  <tr key={e.date + e.label} className="border-b border-stone-100">
                    <td className="num whitespace-nowrap px-3 py-1">{nzDate(e.date)}</td>
                    <td className="px-3 py-1">{e.label}</td>
                    <td className="num px-3 py-1 text-right">{e.credit ? money(e.credit) : ""}</td>
                    <td className="num px-3 py-1 text-right">{e.debit ? money(e.debit) : ""}</td>
                    <td className="num px-3 py-1 text-right">{money(e.balance)}</td>
                  </tr>
                );
              })}
              <tr className="bg-stone-50 font-bold"><td colSpan={4} className="px-3 py-2 text-right">Balance at 31 March 2028 (credit: OK)</td><td className="num px-3 py-2 text-right">{money(icaClosing)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 max-w-3xl space-y-3">
          <Callout kind="nz" title="Why the ICA matters">Imputation credits can only be attached to a dividend if the company has actually paid that tax. Paying last year&apos;s terminal tax on 7 April 2028 will add another {money(Y2.YEAR2_FACTS.y1Terminal, { dp: 0 })} of credits for future dividends.</Callout>
          <UsNote>A US C-corporation&apos;s profits are taxed twice: corporate tax, then the shareholder&apos;s tax on dividends. NZ&apos;s imputation system passes the company&apos;s tax to shareholders as a credit, so profits are effectively taxed once, at the shareholder&apos;s own rate. US textbooks also often record dividends in a temporary &quot;Dividends&quot; account that&apos;s closed at year end; here they go straight to retained earnings.</UsNote>
        </div>
      </Section>

      <Section id="disposal" title="Selling an asset: accounts vs tax">
        <div className="grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
            <div className="mb-2 font-bold">In the accounts</div>
            <div className="flex justify-between"><span>Cost</span><span className="num">{money(Y2.DISPOSAL.asset.cost)}</span></div>
            <div className="flex justify-between"><span>Less depreciation (year 1 + 6 months)</span><span className="num">{money(-Y2.DISPOSAL.accDepToSale)}</span></div>
            <div className="flex justify-between border-t border-stone-300 font-semibold"><span>Book value at sale</span><span className="num">{money(Y2.DISPOSAL.bookValue)}</span></div>
            <div className="flex justify-between"><span>Sale price (excl GST)</span><span className="num">{money(Y2.DISPOSAL.price)}</span></div>
            <div className="flex justify-between border-t border-stone-300 font-bold"><span>Gain on sale</span><span className="num">{money(Y2.DISPOSAL.accountingGain)}</span></div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
            <div className="mb-2 font-bold">For tax</div>
            <div className="flex justify-between"><span>Cost</span><span className="num">{money(Y2.DISPOSAL.asset.cost)}</span></div>
            <div className="flex justify-between"><span>Less Investment Boost + year-1 tax depreciation</span><span className="num">{money(-Y2.DISPOSAL.taxDepClaimed)}</span></div>
            <div className="flex justify-between border-t border-stone-300 font-semibold"><span>Tax book value (no depreciation in the year of sale)</span><span className="num">{money(Y2.DISPOSAL.taxValue)}</span></div>
            <div className="flex justify-between"><span>Sale price (excl GST)</span><span className="num">{money(Y2.DISPOSAL.price)}</span></div>
            <div className="flex justify-between border-t border-stone-300 font-bold"><span><Term k="depreciation-recovery">Depreciation recovery</Term> income</span><span className="num">{money(Y2.DISPOSAL.recovered)}</span></div>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-stone-600">Recovery is the lesser of (sale price − tax book value) and the depreciation claimed. A sale above the original cost would also have a capital gain, which usually isn&apos;t taxable. Source: IRD&apos;s depreciation guide (IR260).</p>
        <div className="mt-3 max-w-3xl"><UsNote>US tax also &quot;recaptures&quot; depreciation on a sale, but US rules let you depreciate in the year of sale (under the MACRS conventions). NZ allows no tax depreciation in the year an asset is sold.</UsNote></div>
      </Section>

      <Callout kind="nz" title="Rates used in year 2">ACC earners&apos; levy {pct(Y2R.acc.rate, 2)} (max liable earnings {money(Y2R.acc.maxLiableEarnings, { dp: 0 })}) from 1 April 2027; KiwiSaver stays {pct(Y2R.kiwiSaver.employerMinimum)} until {KIWISAVER.futureRate.from}; dividend RWT {pct(RWT.dividendRate, 0)}; provisional tax standard uplift {pct(PROVISIONAL_TAX.standardUplift, 0)}. Both staff are paid above the adult minimum wage ({money(MINIMUM_WAGE.adult)} from {MINIMUM_WAGE.from}).{Y2R.toConfirm.length > 0 && <> Not yet announced for {Y2R.year} when this was written, so carried forward from {PAYROLL_2026_27.year}: {Y2R.toConfirm.join(", ")}.</>}</Callout>
    </div>
  );
}
