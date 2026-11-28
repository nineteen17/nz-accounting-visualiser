"use client";

import Link from "next/link";
import { useState } from "react";
import { BASE, PLANS, SALES, SALES_DROP, scenario, type SaleKey } from "@/data/books/taxLosses";
import { COMPANY_TAX_RATE, LOSS_CONTINUITY, PROVISIONAL_TAX } from "@/lib/nz/rates";
import type { NewOwnerPlan } from "@/lib/nz/taxLosses";
import { money, nzDate, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";

const $ = (x: number) => money(x);
const RATE = pct(COMPANY_TAX_RATE, 0);
const P49 = pct(LOSS_CONTINUITY.losses, 0), P66 = pct(LOSS_CONTINUITY.imputation, 0);

function Mistake({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm text-rose-800">⚠️ <strong>Common mistake:</strong> {children}</p>;
}

function Verdict({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl p-4 ring-1", ok ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200")}>
      <div className={cx("font-bold", ok ? "text-emerald-900" : "text-rose-900")}>{ok ? "✓" : "✗"} {title}</div>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.key} type="button" aria-pressed={o.key === value} onClick={() => onChange(o.key)}
            className={cx("rounded-lg px-3 py-1.5 text-left text-sm font-semibold", o.key === value ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function TaxLossesTool() {
  const [months, setMonths] = useState(6);
  const [sale, setSale] = useState<SaleKey>("none");
  const [plan, setPlan] = useState<NewOwnerPlan>("same");
  const s = scenario(months, sale, plan);
  const y3 = s.y3;
  const loss = y3.netIncome < 0;
  const after = SALES[sale].after as Record<string, number>;
  const lostLoss = s.years[0].carriedForward > 0 && !s.loss.survives;
  const taxNoChange = s.noChange.reduce((t, y) => t + y.tax, 0);
  const taxNow = s.years.reduce((t, y) => t + y.tax, 0);

  return (
    <div className="space-y-8">
      <ToolGuide
        what={<>Kōwhai has made a profit every year so far. This &ldquo;what if&rdquo; gives it a bad year: roadworks close the street in year 3, and the company makes a <strong>loss</strong>. You&apos;ll see what happens to that loss (it isn&apos;t refunded, it&apos;s carried forward), and what can wipe it out when an owner sells their shares.</>}
        steps={[
          <>Set <strong>how long the street is closed</strong>. Around 3 months, Kōwhai still makes a small profit; from about 5, it makes a loss.</>,
          <>Read <strong>carrying it forward</strong>: the loss comes off the next years&apos; income, first and automatically.</>,
          <>Then <strong>change the owners</strong>: pick who sells in year 4 and what the new owner does, and see which of the two continuity tests pass.</>,
        ]}
        read={<>Years 3 to 5 are made up, built from year 2&apos;s real books: café sales fall by {pct(SALES_DROP, 0)} while the street is closed, cost of sales falls with them, and the other costs (wages, rent, loan) carry on. Years 4 and 5 trade like year 2. The only tax adjustment carried over is the non-deductible half of entertainment.</>}
        terms={[
          { k: "net-loss", says: "deductions bigger than income: the company pays no tax, and the loss is carried forward." },
          { k: "tax-loss", says: "a net loss plus any loss brought forward: the balance a company carries from year to year." },
          { k: "shareholder-continuity", says: `the same people must keep ${P49} of the shares to keep a loss, and ${P66} to keep imputation credits.` },
          { k: "business-continuity-test", says: "keeps a loss after an ownership change, if the business carries on without a major change." },
          { k: "imputation-credit", says: "tax the company has paid, passed to shareholders with dividends." },
        ]}
      />

      {/* 1. a bad year */}
      <section>
        <h2 className="text-xl font-bold">1. A bad year</h2>
        <label className="mt-3 block max-w-md">
          <span className="text-sm font-semibold">Street closed for roadworks: {months} month{months === 1 ? "" : "s"}</span>
          <input type="range" min={0} max={12} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-1 w-full accent-kowhai-500" />
          <span className="text-xs text-stone-500">Café sales fall {pct(SALES_DROP, 0)} in each month it&apos;s closed.</span>
        </label>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Year 2&apos;s profit before tax (a normal year)</td><td className="num text-right">{$(BASE.profitBeforeTax)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Less: café sales lost ({$(BASE.monthlySales)} a month × {months} × {pct(SALES_DROP, 0)})</td><td className="num text-right">({$(y3.lostSales)})</td></tr>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Add: cost of sales saved ({pct(BASE.costRatio, 1)} of those sales)</td><td className="num text-right">{$(y3.savedCost)}</td></tr>
              <tr className="border-b border-stone-200 font-semibold"><td className="py-1.5 pr-2">Year 3 profit (loss) before tax</td><td className="num text-right">{y3.profit < 0 ? `(${$(-y3.profit)})` : $(y3.profit)}</td></tr>
              <tr className="border-b border-stone-100"><td className="py-1.5 pr-2">Add back: 50% of entertainment</td><td className="num text-right">{$(BASE.entertainment)}</td></tr>
              <tr className="font-semibold"><td className="py-1.5 pr-2">{loss ? <>Net loss (s BC 4)</> : "Net income"}</td><td className="num text-right">{loss ? `(${$(-y3.netIncome)})` : $(y3.netIncome)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed">
          {loss
            ? <>Kōwhai&apos;s deductions are more than its income, so it has a <Term k="net-loss">net loss</Term> of {$(-y3.netIncome)}. It pays <strong>no income tax</strong> for year 3, and IRD doesn&apos;t pay it anything either: the loss is entered on the IR4 as a net loss to carry forward.</>
            : <>Kōwhai still makes a profit, so there&apos;s no loss to carry forward. Move the slider to 5 months or more.</>}
        </p>
        <Mistake>Expecting a refund for a loss. A NZ company can only carry a loss forward, against future profit. (A carry-back was allowed only for the 2019–20 and 2020–21 years, during COVID-19: s IZ 8.)</Mistake>
      </section>

      {/* 2. carrying it forward */}
      <section>
        <h2 className="text-xl font-bold">2. Carrying it forward</h2>
        <p className="mt-1 text-[15px] text-stone-600">Each year, the loss balance brought forward comes off that year&apos;s net income first, as far as it goes (s IA 4). Anything left carries on to the next year (s IA 3(4)), with no time limit.</p>
        <LossTable years={s.noChange} />
        <p className="mt-3 text-[15px] leading-relaxed">
          {loss
            ? <>The loss saves Kōwhai {$(s.noChange.reduce((t, y) => t + y.used, 0) * COMPANY_TAX_RATE)} of tax: the loss × {RATE}. It doesn&apos;t make the bad year free; it means the company isn&apos;t taxed on profit it later earns just to make up for it. Try 12 months: the loss is then bigger than year 4&apos;s income, and the rest is used in year 5.</>
            : <>No loss, so nothing to carry.</>}
        </p>
        <Mistake>Thinking you can choose when to use a loss, and save it for a year with a higher tax rate. It must come off the next year&apos;s net income, as far as it goes.</Mistake>
      </section>

      {/* 3. provisional tax */}
      <section>
        <h2 className="text-xl font-bold">3. What happens to provisional tax</h2>
        <Callout kind="nz" title="A loss year has no residual income tax">
          <p>Under the standard method, each year&apos;s provisional tax is last year&apos;s residual income tax plus {pct(PROVISIONAL_TAX.standardUplift, 0)}. Year 3&apos;s RIT is nil, so <strong>year 4 has no provisional tax instalments</strong>, and all of year 4&apos;s tax ({$(s.noChange[1].tax)}) falls due as terminal tax, a year later. With RIT under {money(PROVISIONAL_TAX.safeHarbourRit, { dp: 0 })} on the standard method, there&apos;s no use-of-money interest for waiting.</p>
          <p className="mt-2">In year 3 itself, Kōwhai would have been due to pay instalments based on year 2&apos;s tax. Once the roadworks were announced, it should switch to the <strong>estimation method</strong> and estimate nil, rather than pay tax on a loss and wait for a refund. The scenario assumes it does.</p>
          <p className="mt-2"><Link href="/explore/provisional-tax" className="font-semibold underline">Provisional tax planner</Link></p>
        </Callout>
      </section>

      {/* 4. change the owners */}
      <section>
        <h2 className="text-xl font-bold">4. Change the owners</h2>
        <p className="mt-1 text-[15px] text-stone-600">Now say some shares are sold partway through year 4, before the loss is used. Aroha owns {pct(BASE_HOLD.aroha, 0)} and Ben {pct(BASE_HOLD.ben, 0)}.</p>
        <div className="mt-3 space-y-3">
          <Choice label="Who sells?" value={sale} onChange={setSale} options={(Object.keys(SALES) as SaleKey[]).map((k) => ({ key: k, label: SALES[k].label }))} />
          <Choice label="What does the new owner do with the business?" value={plan} onChange={setPlan} options={(Object.keys(PLANS) as NewOwnerPlan[]).map((k) => ({ key: k, label: PLANS[k].label }))} />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-stone-500"><th className="py-1 pr-2">Shareholder</th><th className="px-2 text-right">Before</th><th className="px-2 text-right">After</th><th className="pl-2 text-right">Lowest</th></tr>
            </thead>
            <tbody>
              {["aroha", "ben", "newOwner"].map((p) => (
                <tr key={p} className="border-b border-stone-100">
                  <td className="py-1.5 pr-2">{p === "newOwner" ? "The new owner" : p === "aroha" ? "Aroha" : "Ben"}</td>
                  <td className="num px-2 text-right">{pct(BASE_HOLD[p] ?? 0, 0)}</td>
                  <td className="num px-2 text-right">{pct(after[p] ?? 0, 0)}</td>
                  <td className="num pl-2 text-right">{pct(Math.min(BASE_HOLD[p] ?? 0, after[p] ?? 0), 0)}</td>
                </tr>
              ))}
              <tr className="font-semibold"><td className="py-1.5 pr-2" colSpan={3}>Continuity kept</td><td className="num pl-2 text-right">{pct(s.kept, 0)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-stone-600">Each person counts at their <strong>lowest</strong> holding over the whole period. The new owner held nothing before, so they add nothing, however much they buy.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Verdict ok={s.loss.survives} title={s.loss.survives ? "The loss carries forward" : "The loss is lost"}>
            {s.kept >= LOSS_CONTINUITY.losses
              ? <>{pct(s.kept, 0)} continuity is at least {P49}, so the shareholder continuity test is met (s IA 5). What the new owner does doesn&apos;t matter for the loss.</>
              : <>{pct(s.kept, 0)} is under {P49}, so the shareholder continuity test fails. The <Term k="business-continuity-test">business continuity test</Term> decides instead (ss IB 3, IB 4): {PLANS[plan].why} {s.loss.survives ? "So the loss survives." : "So the loss is gone."}</>}
          </Verdict>
          <Verdict ok={s.credits} title={s.credits ? "The imputation credits carry forward" : "The imputation credits are lost"}>
            {s.credits
              ? <>{pct(s.kept, 0)} is at least {P66}, so the credits stay (s OA 8).</>
              : <>{pct(s.kept, 0)} is under {P66}. The {$(BASE.icaAtBreach)} in the imputation credit account is debited away when the shares change hands (s OB 41): {$(BASE.icaClosingY2)} at 31 March 2028, plus year 2&apos;s terminal tax of {$(BASE.terminalY2)} paid on {nzDate(BASE.terminalDueY2)}. There&apos;s no business continuity test for credits.</>}
          </Verdict>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Card><div className="text-sm text-stone-500">Tax, years 3 to 5</div><div className="num text-xl font-bold">{$(taxNow)}</div></Card>
          <Card><div className="text-sm text-stone-500">Tax saved by the loss</div><div className="num text-xl font-bold">{$(s.taxSaved)}</div>{lostLoss && <div className="text-sm text-rose-700">{$(taxNow - taxNoChange)} more tax than if nobody had sold</div>}</Card>
          <Card><div className="text-sm text-stone-500">Imputation credits lost</div><div className="num text-xl font-bold">{$(s.creditsLost)}</div></Card>
        </div>
        {lostLoss && <LossTable years={s.years} />}
        {lostLoss && <p className="mt-2 text-sm text-stone-600">Not modelled: Kōwhai&apos;s income in year 4 <em>before</em> the sale could still use the loss, if it prepared part-year financial statements (ss IP 3, IP 3B).</p>}

        <Mistake>Thinking the two tests are the same. Losses need {P49}; imputation credits need {P66}. So Ben selling his 40% keeps the loss but loses the credits.</Mistake>
        <Mistake>Thinking the business continuity test always saves the loss. It doesn&apos;t if the business stops, or changes the nature of what it does.</Mistake>
      </section>

      {/* 5. deferred tax */}
      <section>
        <h2 className="text-xl font-bold">5. Is the loss an asset?</h2>
        <p className="text-[15px] leading-relaxed">
          A loss carried forward will cut future tax, so under NZ IAS 12 it can be a <Term k="deferred-tax">deferred tax</Term> asset ({loss ? <>{$(-y3.netIncome * COMPANY_TAX_RATE)} here</> : `the loss × ${RATE}`}), if future profit to use it against is probable. Kōwhai uses the <Term k="taxes-payable-method">taxes payable method</Term>, so it isn&apos;t recorded at all; the unused loss is disclosed in a note instead. See <Link href="/explore/deferred-tax" className="font-semibold underline">Tax: accounts vs return</Link>.
        </p>
      </section>

      <UsNote>
        In the US a company&apos;s <strong>net operating loss</strong> (NOL) from 2018 on also carries forward with no time limit, but it can only cover <strong>80%</strong> of a year&apos;s taxable income, so some tax is still paid in the recovery year. Carry-back isn&apos;t generally allowed (farming losses are the main exception). An ownership change of more than 50 percentage points over 3 years doesn&apos;t wipe the loss out; § 382 caps how much can be used each year instead. NZ&apos;s test is all-or-nothing at {P49}, rescued by the business continuity test. The US has no imputation credits, so there&apos;s nothing like the {P66} rule.
      </UsNote>

      <p className="text-[15px]">
        See also: <Link href="/nz/income-tax" className="font-semibold underline">Company income tax</Link> · <Link href="/explore/structures" className="font-semibold underline">Which structure?</Link> (a look-through company passes losses to its owners instead)
      </p>
    </div>
  );
}

const BASE_HOLD: Record<string, number> = SALES.none.after;

function LossTable({ years }: { years: ReturnType<typeof scenario>["years"] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[22rem] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-stone-500">
            <th className="py-1 pr-2" />
            {years.map((y) => <th key={y.label} className="px-1 text-right font-semibold">{y.label.replace(/ \(.*\)/, "")}</th>)}
          </tr>
        </thead>
        <tbody>
          <Row label="Net income (loss)" vals={years.map((y) => y.netIncome)} />
          <Row label="Loss brought forward" vals={years.map((y) => y.broughtForward)} />
          <Row label="Less: loss used" vals={years.map((y) => -y.used)} />
          <Row label="Taxable income" vals={years.map((y) => y.taxableIncome)} bold />
          <Row label={`Tax at ${RATE}`} vals={years.map((y) => y.tax)} />
          <Row label="Loss carried forward" vals={years.map((y) => y.carriedForward)} bold />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, vals, bold }: { label: string; vals: number[]; bold?: boolean }) {
  return (
    <tr className={cx("border-b border-stone-100", bold && "font-semibold")}>
      <td className="py-1.5 pr-2">{label}</td>
      {vals.map((v, i) => <td key={i} className="num px-1 text-right">{v < 0 ? `(${money(-v, { dp: 0 })})` : money(v, { dp: 0 })}</td>)}
    </tr>
  );
}
