"use client";

import { useEffect, useState } from "react";
import { ALL, BEFORE_CLOSING, TAX } from "@/data/books";
import { SHAREHOLDERS } from "@/data/business";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { ledger } from "@/lib/engine/ledger";
import { COMPANY_TAX_RATE, DEPRECIATION, GST, INDIVIDUAL_TAX_BRACKETS, PROVISIONAL_TAX, RATES_AS_AT, RECORD_KEEPING_YEARS, RWT } from "@/lib/nz/rates";
import { disposal, schedule } from "@/lib/nz/assets";
import { progressiveTax } from "@/lib/nz/payroll";
import { money, nzDate, num, pct, r2 } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, Tabs, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { useOverlay } from "@/components/learn/Overlay";
import { TxnDetail } from "@/components/cycle/steps/TheYear";
import { TaxRecView } from "@/components/cycle/steps/End";

const input = "w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm"><span className="mb-1 block font-medium text-stone-600">{label}</span>{children}</label>
);

/* ───────────── GST ───────────── */

export function GstTopic() {
  const [amt, setAmt] = useState(115);
  const [isIncl, setIsIncl] = useState(true);
  const exAmt = isIncl ? amt / 1.15 : amt;
  const g = isIncl ? amt * GST.fraction : amt * GST.rate;
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="prose-learn text-[16px]">
          <p><Term k="gst">GST</Term> is a {pct(GST.rate)} tax on almost everything sold in NZ. It&apos;s paid by the <strong>final consumer</strong>, but collected in stages by every GST-registered business along the supply chain.</p>
          <h3>How it flows through Kōwhai</h3>
          <ol>
            <li>Southern Roasters sells beans to Kōwhai for $100 + $15 GST. Kōwhai <strong>claims</strong> the $15 (input tax).</li>
            <li>Kōwhai sells coffee made from those beans for $300 + $45 GST. Kōwhai <strong>collects</strong> $45 (output tax).</li>
            <li>Kōwhai pays IRD $45 − $15 = <strong>$30</strong>. That&apos;s 15% of the value it added ($200).</li>
          </ol>
          <p>So for a registered business, GST is neither income nor expense. It passes through the <strong>GST control account</strong> (210), and the balance is what&apos;s owed to IRD (credit) or due back (debit).</p>
          <h3>Registration</h3>
          <ul>
            <li><strong>Compulsory</strong> once turnover in the last 12 months, or expected in the next 12 months, exceeds <strong>{money(GST.registrationThreshold, { dp: 0 })}</strong>.</li>
            <li><strong>Voluntary</strong> below that, which is useful if you have big start-up costs to claim GST on (like Kōwhai&apos;s fit-out).</li>
          </ul>
                  <UsNote>
            <p>US <strong>sales tax</strong> is set by each state and city, is mostly charged only to the final customer, and a business can&apos;t claim back the tax it pays on its own purchases, so that tax becomes part of its costs.</p>
            <p>NZ <strong>GST</strong> is one 15% rate nationwide, charged at <em>every</em> stage, and registered businesses claim back the GST on their purchases. So in an NZ business&apos;s books, GST never appears as income or an expense. It sits in the GST account until it&apos;s settled with IRD. NZ shelf prices also <em>include</em> GST, so a $5.75 flat white already contains 75c of GST.</p>
          </UsNote>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">GST calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount ($)"><input type="number" className={input} value={amt} onChange={(e) => setAmt(Number(e.target.value) || 0)} /></Field>
            <Field label="The amount is…">
              <select className={input} value={isIncl ? "i" : "e"} onChange={(e) => setIsIncl(e.target.value === "i")}><option value="i">GST inclusive</option><option value="e">GST exclusive</option></select>
            </Field>
          </div>
          <div className="mt-4 flex h-8 overflow-hidden rounded-lg text-xs font-semibold text-white">
            <div className="flex items-center justify-center border-r-2 border-white bg-emerald-600" style={{ width: `${(exAmt / (exAmt + g)) * 100}%` }}>Price excl GST</div>
            <div className="flex items-center justify-center bg-rose-500" style={{ width: `${(g / (exAmt + g)) * 100}%` }}>GST</div>
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Excl GST</dt><dd className="num">{money(exAmt)}</dd></div>
            <div className="flex justify-between"><dt>GST</dt><dd className="num">{money(g)}</dd></div>
            <div className="flex justify-between font-bold"><dt>Incl GST</dt><dd className="num">{money(exAmt + g)}</dd></div>
          </dl>
          <Callout kind="rule" title="The two formulas">
            Adding GST: <strong>× 15%</strong> (or × 1.15 for the total).<br />
            Extracting GST from an inclusive price: <strong>× 3/23</strong> (not 15%!).
          </Callout>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Standard-rated (15%)", c: "border-emerald-300", d: "Most goods and services: café sales, catering, rent on commercial property, equipment, power.", eg: "Kōwhai charges 15% and claims 15%." },
          { t: "Zero-rated (0%)", c: "border-sky-300", d: "Taxable, but at 0%: exports, sale of a going concern between registered businesses, most land sales between registered parties.", eg: "If Kōwhai sold the whole business to another registered buyer, it could be zero-rated. You can still claim GST on related costs." },
          { t: "Exempt (no GST)", c: "border-stone-300", d: "Outside GST entirely: financial services (interest, bank fees, merchant fees, loans), residential rent, donated goods sold by non-profits.", eg: "No GST to claim on Kōwhai's bank fees or loan interest." },
        ].map((x) => (
          <div key={x.t} className={cx("rounded-xl border-2 bg-white p-4", x.c)}>
            <div className="font-bold">{x.t}</div>
            <div className="mt-1 text-sm">{x.d}</div>
            <div className="mt-2 text-xs italic text-stone-600">{x.eg}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h3>Accounting basis: <em>when</em> GST counts</h3>
          <ul>
            <li><Term k="invoice-basis">Invoice basis</Term> (Kōwhai): GST is counted when an invoice is issued or received, or when payment is made if that&apos;s earlier.</li>
            <li><Term k="payments-basis">Payments basis</Term>: GST counts only when cash moves. Available if turnover is ≤ $2m.</li>
            <li><strong>Hybrid</strong>: sales on invoice basis, purchases on payments basis (rarely chosen).</li>
          </ul>
          <h3>Filing frequency</h3>
          <ul>
            <li><strong>Monthly</strong>: required if turnover is over $24m; optional for anyone.</li>
            <li><strong>Two-monthly</strong> (Kōwhai): the default.</li>
            <li><strong>Six-monthly</strong>: if turnover is under $500,000.</li>
          </ul>
          <p>Returns and payments are due on the <strong>28th of the month after</strong> the period ends, except the period ending 31 March (due 7 May) and the period ending 30 November (due 15 January).</p>
        </div>
        <div className="prose-learn text-[16px]">
          <h3>Special GST situations in Kōwhai&apos;s year</h3>
          <ul>
            <li><strong>Start-up refund</strong>: the first return was a refund, because of GST on the fit-out and equipment.</li>
            <li><strong>Bad debts</strong>: when Pop-Up Events&apos; invoice was written off, Kōwhai claimed back the GST it had already paid on it (invoice basis).</li>
            <li><strong>Entertainment</strong>: 50% of the GST claimed on entertainment is paid back in the last return of the year.</li>
            <li><strong>Deposits</strong>: GST on the wedding deposit was due when the money arrived, before any invoice.</li>
            <li><strong>Accruals</strong>: no GST on the March power accrual. GST can&apos;t be claimed until the invoice is held.</li>
            <li><strong>Private use</strong>: if Aroha took coffee beans home, the café would need to pay GST on the private-use adjustment.</li>
          </ul>
          <p>What a GST invoice must show depends on its value: see <Term k="taxable-supply-information">taxable supply information</Term>.</p>
        </div>
      </div>
    </div>
  );
}

export function GstReturnTopic() {
  const [pid, setPid] = useState("P1");
  const { openCustom } = useOverlay();
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("period");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read query string after hydration
    if (p && GST_PERIODS.some((x) => x.id === p)) setPid(p);
  }, []);
  const period = GST_PERIODS.find((p) => p.id === pid)!;
  const r = gstReturn(ALL, period);
  const boxes: { n: number; label: string; v: number; how: string; strong?: boolean }[] = [
    { n: 5, label: "Total sales and income for the period (including GST and any zero-rated supplies)", v: r.box5, how: "All taxable sales incl GST. Worked back from the output GST: output GST × 23/3." },
    { n: 6, label: "Zero-rated supplies included in Box 5", v: r.box6, how: "Kōwhai has none." },
    { n: 7, label: "Subtract Box 6 from Box 5", v: r.box7, how: "Standard-rated sales incl GST." },
    { n: 8, label: "Multiply Box 7 by three (3) and divide by twenty-three (23)", v: r.box8, how: "GST on sales (output tax)." },
    { n: 9, label: "Adjustments from your calculation sheet", v: r.box9, how: "Debit adjustments: extra GST to pay, e.g. the 50% entertainment adjustment or private use." },
    { n: 10, label: "Total GST collected on sales and income (Box 8 + Box 9)", v: r.box10, how: "", strong: true },
    { n: 11, label: "Total purchases and expenses (including GST) for which tax invoicing requirements have been met", v: r.box11, how: "All purchases with claimable GST, incl GST." },
    { n: 12, label: "Multiply Box 11 by three (3) and divide by twenty-three (23)", v: r.box12, how: "GST on purchases (input tax)." },
    { n: 13, label: "Credit adjustments from your calculation sheet", v: r.box13, how: "e.g. GST on bad debts written off." },
    { n: 14, label: "Total GST credit for purchases and expenses (Box 12 + Box 13)", v: r.box14, how: "", strong: true },
    { n: 15, label: "Difference between Box 10 and Box 14", v: Math.abs(r.box15), how: r.box15 >= 0 ? "GST TO PAY" : "REFUND DUE", strong: true },
  ];
  return (
    <div className="space-y-6">
      <p className="max-w-4xl text-[16px] text-stone-700">Each return below is built directly from the GST lines in Kōwhai&apos;s journal. Pick a period. The amounts tie back to individual transactions.</p>
      <Tabs value={pid} onChange={setPid} tabs={GST_PERIODS.map((p) => ({ id: p.id, label: p.label }))} />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="doc-paper rounded-sm px-3 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex flex-wrap justify-between gap-x-4 gap-y-2 border-b-2 border-ink pb-2">
            <div><div className="text-xs font-semibold text-stone-500">Inland Revenue · Te Tari Taake</div><div className="text-xl font-black">GST return (GST101A)</div></div>
            <div className="text-xs sm:text-right"><div>Kōwhai Café Ltd</div><div>Period: {period.label}</div><div>Due: {nzDate(period.due)}</div><div>Basis: invoice</div></div>
          </div>
          {boxes.map((b) => (
            <div key={b.n} className={cx("grid grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-start gap-2 border-b sm:grid-cols-[2.5rem_minmax(0,1fr)_8rem] border-stone-100 py-1.5 text-sm", b.strong && "bg-kowhai-50 font-semibold")}>
              <span className="grid h-6 w-8 place-items-center rounded bg-ink text-xs font-bold text-white">{b.n}</span>
              <span>{b.label}{b.how && <span className="block text-xs font-normal text-stone-500">{b.how}</span>}</span>
              <span className="num rounded border border-stone-300 px-2 py-0.5 text-right">{num(b.v) === "–" ? "0.00" : num(b.v)}</span>
            </div>
          ))}
          <div className={cx("mt-3 rounded-lg px-3 py-2 text-center font-bold", r.box15 >= 0 ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>
            {r.box15 >= 0 ? `Pay IRD ${money(r.box15)} by ${nzDate(period.due)}` : `IRD refunds ${money(-r.box15)}`}
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 font-bold">Where the numbers come from</h3>
            <div className="max-h-[28rem] space-y-3 overflow-y-auto text-xs">
              {[
                { t: "Output GST (box 8)", l: r.outputLines },
                { t: "Input GST (box 12)", l: r.inputLines },
                { t: "Adjustments (boxes 9 & 13)", l: r.adjustments },
              ].map((g) => g.l.length > 0 && (
                <div key={g.t}>
                  <div className="mb-1 font-semibold">{g.t}</div>
                  {g.l.map((x, i) => (
                    <button key={i} onClick={() => openCustom(x.txn.title, <TxnDetail t={x.txn} />)} className="flex w-full justify-between gap-2 border-b border-stone-100 py-0.5 text-left hover:bg-kowhai-50">
                      <span className="truncate"><span className="num text-stone-400">{nzDate(x.txn.date, false)}</span> {x.txn.title}</span>
                      <span className="num">{num(x.gst)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </Card>
          <Callout kind="why" title="Check: does it match the ledger?">The GST control account&apos;s movement for the period (excluding payments to and from IRD) equals box 15. In Explore → Ledger, pick account 210 to see it.</Callout>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Income tax ───────────── */

export function IncomeTaxTopic() {
  const [income, setIncome] = useState(60_000);
  const pt = progressiveTax(income);
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h2>Rates</h2>
          <ul>
            <li><strong>Companies</strong>: flat {pct(COMPANY_TAX_RATE)}.</li>
            <li><strong>Individuals</strong> (sole traders, partners, shareholder-employees): progressive. {INDIVIDUAL_TAX_BRACKETS.map((b, i) => `${pct(b.rate)} ${i === 0 ? "up to" : "to"} ${b.upTo === Infinity ? "above $180,000" : money(b.upTo, { dp: 0 })}`).join(", ")}.</li>
            <li>Trusts: 39% (from 2024–25), with exceptions.</li>
          </ul>
          <h2>The tax year</h2>
          <p>1 April to 31 March, named after the year it ends in. Kōwhai&apos;s first year is the <strong>2027 income year</strong>. The company files an <Term k="ir4">IR4</Term>. Aroha and Ben each file an <Term k="ir3">IR3</Term> for their shareholder salaries.</p>
          <UsNote>
            <p>The US tax year for individuals is the calendar year, and many US businesses use a 1 January – 31 December fiscal year. NZ&apos;s income year runs <strong>1 April – 31 March</strong>, and most NZ businesses use 31 March as their balance date. So year-end adjustments, stocktakes and closing entries happen at the end of March, not December.</p>
            <p>The US company tax return is Form 1120 (to the IRS); the NZ one is the <strong>IR4</strong> (to IRD).</p>
          </UsNote>
          <h2>Deductible or not?</h2>
          <p>An expense is deductible if it&apos;s incurred in earning income or running the business, and isn&apos;t private, capital or specifically denied. Some important NZ rules:</p>
          <ul>
            <li><Term k="entertainment">Entertainment</Term>: 50% deductible (client meals, staff parties). Morning tea at the café is 100%.</li>
            <li><strong>Capital</strong> spending is depreciated, not deducted (apart from low-value assets and Investment Boost).</li>
            <li><strong>Fines and penalties</strong>: not deductible.</li>
            <li><strong>Income tax itself</strong>: not deductible.</li>
            <li><strong>Accrued holiday pay and bonuses</strong>: only if paid within 63 days after balance date.</li>
            <li><strong>Doubtful debts provision</strong>: not deductible. Only actual write-offs count.</li>
            <li><strong>Home office</strong> (sole traders and shareholder-employees): a proportion of home costs, or IRD&apos;s square-metre rate option.</li>
            <li><strong>Motor vehicles</strong>: business-use % (logbook) or kilometre rates.</li>
          </ul>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Personal tax calculator</h3>
          <Field label="Annual taxable income ($)"><input type="number" className={input} value={income} onChange={(e) => setIncome(Number(e.target.value) || 0)} /></Field>
          <div className="mt-4 space-y-1">
            {pt.steps.map((s) => (
              <div key={s.from} className="grid grid-cols-[9rem_3rem_1fr_5rem] items-center gap-2 text-xs">
                <span className="num">{money(s.from, { dp: 0 })}–{s.to === Infinity ? "+" : money(s.to, { dp: 0 })}</span>
                <span>{pct(s.rate)}</span>
                <span className="h-3 rounded bg-rose-100"><span className="block h-3 rounded bg-rose-500" style={{ width: `${(s.taxable / Math.max(income, 1)) * 100}%` }} /></span>
                <span className="num text-right">{money(s.tax)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t pt-2 font-bold"><span>Total tax</span><span className="num">{money(pt.total)}</span></div>
          <div className="flex justify-between text-sm text-stone-600"><span>Average rate</span><span>{pct(pt.total / Math.max(income, 1))}</span></div>
          <div className="flex justify-between text-sm text-stone-600"><span>Same income in a company @ 28%</span><span className="num">{money(income * COMPANY_TAX_RATE)}</span></div>
          <p className="mt-3 text-xs text-stone-500">This is why owners balance shareholder salaries against profit kept in the company. Aroha&apos;s $60,000 salary has an average rate of about {pct(progressiveTax(60000).total / 60000)}.</p>
        </Card>
      </div>
      <div>
        <h2 className="mb-3 text-2xl font-bold">Kōwhai&apos;s tax reconciliation</h2>
        <TaxRecView />
      </div>
    </div>
  );
}

/* ───────────── Provisional tax ───────────── */

export function ProvisionalTaxTopic() {
  const [rit, setRit] = useState(Math.round(TAX.residual));
  const std = rit * (1 + PROVISIONAL_TAX.standardUplift);
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>Employees pay tax every payday through PAYE. Businesses don&apos;t, so without <Term k="provisional-tax">provisional tax</Term> they&apos;d pay a whole year&apos;s tax in one lump, long after earning the income. Provisional tax spreads it across the year.</p>
          <h3>Who pays it?</h3>
          <p>Anyone whose <strong>residual income tax (RIT)</strong> last year was more than <strong>{money(PROVISIONAL_TAX.ritThreshold, { dp: 0 })}</strong>. RIT = tax on the return − tax credits (RWT, PAYE, etc.).</p>
          <p>Kōwhai&apos;s first year: no previous RIT, so it isn&apos;t a provisional taxpayer. It paid $3,000 <em>voluntarily</em>. Its 2027 RIT is <strong>{money(TAX.residual)}</strong>, so from the 2028 year it <strong>must</strong> pay.</p>
          <h3>Methods</h3>
          <ul>
            <li><strong>Standard</strong>: last year&apos;s RIT + 5% (or the year before + 10% if last year&apos;s return isn&apos;t filed yet). Safe harbour: no use-of-money interest until the final instalment if RIT is under {money(PROVISIONAL_TAX.safeHarbourRit, { dp: 0 })}.</li>
            <li><strong>Estimation</strong>: your own estimate. You must estimate fairly and reasonably, and UOMI applies if you&apos;re short.</li>
            <li><strong>AIM (accounting income method)</strong>: approved software calculates tax from actual results each period. You pay as you go, with no UOMI if you follow it.</li>
            <li><strong>Ratio</strong>: based on GST turnover (for those filing GST monthly or two-monthly).</li>
          </ul>
          <h3>Dates (31 March balance date, standard / estimation)</h3>
          <p>Instalments on <strong>{PROVISIONAL_TAX.instalments.join(", ")}</strong>. Then <Term k="terminal-tax">terminal tax</Term> on <strong>7 February</strong> the following year, or <strong>7 April</strong> if you have a tax agent with an extension of time.</p>
          <Callout kind="nz" title="Use-of-money interest"><Term k="uomi">UOMI</Term> from 16 January 2026: {pct(PROVISIONAL_TAX.uomiUnderpaid, 2)} on underpaid tax and {pct(PROVISIONAL_TAX.uomiOverpaid, 2)} on overpaid tax. Late payment penalties are on top.</Callout>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Standard-method calculator</h3>
          <Field label="Last year's residual income tax ($)"><input type="number" className={input} value={rit} onChange={(e) => setRit(Number(e.target.value) || 0)} /></Field>
          {rit <= PROVISIONAL_TAX.ritThreshold ? (
            <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm">RIT is $5,000 or less, so you aren&apos;t a provisional taxpayer. Pay terminal tax only.</p>
          ) : (
            <>
              <div className="mt-4 flex justify-between text-sm"><span>RIT + 5% uplift</span><span className="num font-semibold">{money(std)}</span></div>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1">Instalment</th><th>Due</th><th className="text-right">Amount</th></tr></thead>
                <tbody>
                  {PROVISIONAL_TAX.instalments.map((d, i) => (
                    <tr key={d} className="border-b border-stone-100"><td className="py-1">P{i + 1}</td><td>{d} {i === 0 ? "2027" : "2028"}</td><td className="num text-right">{money(std / 3)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-stone-500">If actual 2028 tax ends up higher, the difference is terminal tax, due 7 April 2029 (with a tax agent).</p>
            </>
          )}
          <div className="mt-6 rounded-lg bg-stone-50 p-3 text-sm">
            <div className="mb-1 font-semibold">Kōwhai&apos;s 2027 tax position</div>
            <div className="flex justify-between"><span>Tax on taxable income</span><span className="num">{money(TAX.tax)}</span></div>
            <div className="flex justify-between"><span>Less RWT</span><span className="num">−{money(TAX.rwt)}</span></div>
            <div className="flex justify-between"><span>= RIT</span><span className="num">{money(TAX.residual)}</span></div>
            <div className="flex justify-between"><span>Less voluntary provisional</span><span className="num">−{money(TAX.provisional)}</span></div>
            <div className="flex justify-between font-bold"><span>Terminal tax due 7 April 2028</span><span className="num">{money(TAX.terminal)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Shareholders ───────────── */

export function ShareholdersTopic() {
  const [div, setDiv] = useState(10_000);
  const [mtr, setMtr] = useState(0.3);
  const credit = div * (COMPANY_TAX_RATE / (1 - COMPANY_TAX_RATE));
  const gross = div + credit;
  const rwt = gross * 0.33 - credit;
  const personal = gross * mtr - credit - rwt;
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>In a small NZ company, the owners are often also the workers. There are four ways money gets from the company to them, and each is taxed differently:</p>
          <ol>
            <li><strong>PAYE wages</strong>: like any employee. Less common for owners because the amount is fixed.</li>
            <li><strong><Term k="shareholder-salary">Shareholder salary</Term></strong>: set (often at year end) once profit is known. It&apos;s deductible to the company, and the shareholder pays tax through their IR3 and personal provisional tax. No PAYE.</li>
            <li><strong><Term k="dividend">Dividends</Term></strong>: a share of after-tax profit, with <Term k="imputation-credit">imputation credits</Term>. Not deductible to the company.</li>
            <li><strong>Repaying a current account credit</strong>: if the company owes the shareholder (from salaries or loans), paying it back isn&apos;t taxed again.</li>
          </ol>
          <h3>The current account</h3>
          <p>During the year Aroha and Ben take <Term k="drawings">drawings</Term>. Those are debited to their <Term k="shareholder-current-account">current accounts</Term>. At year end, the shareholder salary is credited. The account then shows who owes whom.</p>
          <Callout kind="warn" title="Overdrawn current accounts">If drawings exceed what the company owes the shareholder, the shareholder owes the company. IRD then requires interest at the <strong>prescribed rate</strong> on that balance, or the benefit becomes subject to FBT or is treated as a dividend. Accountants watch this closely.</Callout>
        </div>
        <div className="space-y-4">
          {SHAREHOLDERS.map((s) => {
            const rows = ledger(BEFORE_CLOSING, s.currentAccount);
            const bal = rows[rows.length - 1]?.balance ?? 0;
            const drawings = rows.filter((r) => r.debit).reduce((x, r) => x + r.debit, 0);
            return (
              <Card key={s.id}>
                <h3 className="font-bold">{s.name}&apos;s current account</h3>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded bg-rose-50 p-2"><div className="text-xs text-stone-500">Drawings (Dr)</div><div className="num font-semibold">{money(drawings, { dp: 0 })}</div></div>
                  <div className="rounded bg-emerald-50 p-2"><div className="text-xs text-stone-500">Salary (Cr)</div><div className="num font-semibold">{money(s.salary, { dp: 0 })}</div></div>
                  <div className="rounded bg-violet-50 p-2"><div className="text-xs text-stone-500">Company owes</div><div className="num font-semibold">{money(bal, { dp: 0 })}</div></div>
                </div>
                <div className="mt-2 text-xs text-stone-500">During the year the account went overdrawn (drawings before salary). The year-end salary brought it back into credit. Accountants often look at the balance through the year when deciding whether interest is needed.</div>
              </Card>
            );
          })}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h2>Dividends & imputation</h2>
          <p>Company profit is taxed at 28%. Without imputation, a dividend from that profit would be taxed <em>again</em> in the shareholder&apos;s hands. NZ&apos;s imputation system fixes this: the company attaches <strong>imputation credits</strong> for the tax it has already paid, and the shareholder gets credit for it.</p>
          <ul>
            <li>The company keeps an <strong>imputation credit account (ICA)</strong>. Tax paid (provisional, terminal, RWT) adds credits; dividends imputed use them up.</li>
            <li>Maximum credit = dividend × 28/72 (a &quot;fully imputed&quot; dividend).</li>
            <li>The company also deducts <strong>resident withholding tax</strong> on dividends: 33% of the gross dividend, less the imputation credit (5% of gross for a fully imputed dividend).</li>
            <li>A dividend is a distribution of retained earnings: Dr Retained earnings, Cr Bank (and RWT payable). It&apos;s <strong>not</strong> an expense.</li>
          </ul>
                  <UsNote>
            <p>In the US, corporate profit is taxed at 21% federal (plus state tax), and dividends are taxed <em>again</em> in the shareholder&apos;s hands (“double taxation”). NZ&apos;s <strong>imputation</strong> system passes the 28% tax the company already paid to shareholders as a credit, so the profit is effectively taxed once, at the shareholder&apos;s own rate.</p>
            <p>Small NZ company owners are also commonly paid through a <strong>shareholder salary</strong> and <strong>current account</strong> rather than through payroll, which has no close US equivalent.</p>
          </UsNote>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Fully imputed dividend calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cash dividend declared ($)"><input type="number" className={input} value={div} onChange={(e) => setDiv(Number(e.target.value) || 0)} /></Field>
            <Field label="Shareholder's tax rate">
              <select className={input} value={mtr} onChange={(e) => setMtr(Number(e.target.value))}>{INDIVIDUAL_TAX_BRACKETS.map((b) => <option key={b.rate} value={b.rate}>{pct(b.rate)}</option>)}</select>
            </Field>
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Cash dividend</dt><dd className="num">{money(div)}</dd></div>
            <div className="flex justify-between"><dt>+ Imputation credit (28/72)</dt><dd className="num">{money(credit)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>= Gross (taxable) dividend</dt><dd className="num">{money(gross)}</dd></div>
            <div className="flex justify-between"><dt>Dividend RWT deducted by company (33% − credit)</dt><dd className="num">{money(rwt)}</dd></div>
            <div className="flex justify-between"><dt>Cash actually paid to shareholder</dt><dd className="num">{money(div - rwt)}</dd></div>
            <div className="flex justify-between border-t pt-1"><dt>Shareholder&apos;s tax at {pct(mtr)} on gross</dt><dd className="num">{money(gross * mtr)}</dd></div>
            <div className="flex justify-between font-bold"><dt>{personal >= 0 ? "Extra tax to pay in IR3" : "Refund in IR3"}</dt><dd className="num">{money(Math.abs(personal))}</dd></div>
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Depreciation ───────────── */

export function DepreciationTopic() {
  const [cost, setCost] = useState(16_000);
  const [rate, setRate] = useState(0.3);
  const [months, setMonths] = useState(12);
  const [boost, setBoost] = useState(true);
  const [sale, setSale] = useState(9_000);
  const base = boost ? cost * (1 - DEPRECIATION.investmentBoostRate) : cost;
  const dv = schedule(base, rate, "DV", 6, months);
  const slRate = r2(rate / 1.5); // IRD's SL equivalent is roughly DV ÷ 1.5 for most rates
  const sl = schedule(base, slRate, "SL", 6, months);
  const max = Math.max(...dv.map((x) => x.dep), ...sl.map((x) => x.dep));
  const d = disposal(cost, dv[1].closing, sale);
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p><Term k="depreciation">Depreciation</Term> spreads the cost of an asset over its useful life. For tax, NZ businesses must use IRD&apos;s rates (find them in IRD&apos;s <a className="underline" href={DEPRECIATION.source} target="_blank" rel="noreferrer">rate finder</a>). Most small businesses use the same figures in their accounts to keep one set of numbers.</p>
          <h3>Two methods</h3>
          <ul>
            <li><strong>Diminishing value (DV)</strong>: rate × the asset&apos;s <em>remaining</em> (adjusted tax) value. Big deductions early, getting smaller. Most popular.</li>
            <li><strong>Straight line (SL)</strong>: rate × <em>original cost</em> every year. Even deductions.</li>
          </ul>
          <p>Each IRD asset class has a matched DV and SL rate designed to depreciate the asset over the same life. In the year of purchase, you claim for each <strong>whole or part month</strong> owned.</p>
          <h3>Special NZ rules</h3>
          <ul>
            <li><Term k="low-value-asset">Low-value assets</Term> (≤ {money(DEPRECIATION.lowValueAssetThreshold, { dp: 0 })} excl GST) can be expensed immediately.</li>
            <li><Term k="investment-boost">Investment Boost</Term>: an extra {pct(DEPRECIATION.investmentBoostRate)} deduction in year one for new assets first used from {DEPRECIATION.investmentBoostFrom}. Depreciation then runs on the remaining 80%.</li>
            <li><strong>Buildings</strong>: depreciation rate is 0% (from the 2024–25 year), but fit-out is separate and depreciable.</li>
            <li><strong>Pooling</strong>: small assets (≤ $5,000) can be pooled and depreciated together.</li>
          </ul>
                  <UsNote>
            <p>US businesses usually depreciate one way in their accounts (often straight line) and another for tax (MACRS, bonus depreciation, Section 179), so they track two sets of figures. Small NZ businesses normally use <strong>IRD&apos;s rates in their accounts too</strong>, so there&apos;s just one schedule. Investment Boost is the main tax-only extra.</p>
            <p>NZ IFRS also lets businesses <strong>revalue</strong> assets like buildings to fair value; US GAAP doesn&apos;t.</p>
          </UsNote>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Depreciation calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost excl GST ($)"><input type="number" className={input} value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} /></Field>
            <Field label="DV rate"><input type="number" step="0.01" className={input} value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} /></Field>
            <Field label="Months owned in year 1"><input type="number" min={1} max={12} className={input} value={months} onChange={(e) => setMonths(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} /></Field>
            <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} /> Claim Investment Boost</label>
          </div>
          {boost && <div className="mt-3 rounded bg-kowhai-50 px-3 py-2 text-sm">Year 1 Investment Boost deduction: <strong className="num">{money(cost * DEPRECIATION.investmentBoostRate)}</strong>. The depreciable base becomes {money(base)}.</div>}
          <table className="mt-3 w-full text-xs">
            <thead><tr className="border-b text-left uppercase tracking-wider text-stone-500"><th className="py-1">Year</th><th className="text-right">DV {pct(rate)}</th><th className="w-24"></th><th className="text-right">SL {pct(slRate)}</th><th className="w-24"></th><th className="text-right">DV book value</th></tr></thead>
            <tbody>
              {dv.map((row, i) => (
                <tr key={row.year} className="border-b border-stone-100">
                  <td className="py-1">{row.year}</td>
                  <td className="num text-right">{num(row.dep)}</td>
                  <td className="px-2"><span className="block h-2 rounded-r bg-sky-600" style={{ width: `${(row.dep / max) * 100}%` }} /></td>
                  <td className="num text-right">{num(sl[i].dep)}</td>
                  <td className="px-2"><span className="block h-2 rounded-r bg-amber-500" style={{ width: `${(sl[i].dep / max) * 100}%` }} /></td>
                  <td className="num text-right">{num(row.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-500">The SL rate here is approximated as DV ÷ 1.5. Use IRD&apos;s published pair for real calculations.</p>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h2>Selling an asset</h2>
          <p>When an asset is sold, compare the sale price with its <strong>adjusted tax value</strong> (book value):</p>
          <ul>
            <li>Sold for <strong>more</strong> than book value: <strong>depreciation recovered</strong> is taxable income (up to original cost). Anything above cost is a capital gain, which usually isn&apos;t taxed.</li>
            <li>Sold for <strong>less</strong>: a <strong>loss on sale</strong>, which is deductible.</li>
          </ul>
          <p>In the accounts: remove the cost and accumulated depreciation, record the cash received, and the difference is a gain or loss on disposal in the P&amp;L. GST is charged on the sale.</p>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Sale after 2 years</h3>
          <Field label="Sale price excl GST ($)"><input type="number" className={input} value={sale} onChange={(e) => setSale(Number(e.target.value) || 0)} /></Field>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Book value after 2 years (DV)</dt><dd className="num">{money(dv[1].closing)}</dd></div>
            {d.kind === "recovery" ? (
              <>
                <div className="flex justify-between font-semibold text-rose-700"><dt>Depreciation recovered (taxable)</dt><dd className="num">{money(d.recovered)}</dd></div>
                {d.capitalGain > 0 && <div className="flex justify-between"><dt>Capital gain (not taxed)</dt><dd className="num">{money(d.capitalGain)}</dd></div>}
              </>
            ) : (
              <div className="flex justify-between font-semibold text-emerald-700"><dt>Loss on sale (deductible)</dt><dd className="num">{money(d.loss)}</dd></div>
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Inventory ───────────── */

export function InventoryTopic() {
  const buys = [
    { d: "1 Mar", kg: 20, price: 36 },
    { d: "10 Mar", kg: 30, price: 38 },
    { d: "20 Mar", kg: 25, price: 40 },
  ];
  const sold = 37;
  const totalKg = buys.reduce((s, b) => s + b.kg, 0);
  const totalCost = buys.reduce((s, b) => s + b.kg * b.price, 0);
  const closingKg = totalKg - sold;
  const fifoClosing = [...buys].reverse().reduce(
    (acc, b) => {
      const take = Math.min(acc.left, b.kg);
      return { left: acc.left - take, value: acc.value + take * b.price };
    },
    { left: closingKg, value: 0 },
  ).value;
  const wac = totalCost / totalKg;
  const wacClosing = closingKg * wac;
  return (
    <div className="space-y-8">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>For a café, <Term k="inventory">inventory</Term> is small but it matters: it&apos;s the difference between <em>purchases</em> and <em>cost of goods sold</em>.</p>
        <h2>Periodic vs perpetual</h2>
        <ul>
          <li><Term k="periodic-inventory">Periodic</Term> (Kōwhai): purchases are expensed when bought. A <Term k="stocktake">stocktake</Term> at year end measures what&apos;s left. COGS = opening + purchases − closing. Simple, but you only know your true margin after a count.</li>
          <li><strong>Perpetual</strong>: every sale updates stock and COGS in real time (needs recipes linked to the POS). You can compare &quot;what should be there&quot; with the count to measure <strong>wastage and theft</strong>.</li>
        </ul>
        <h2>Valuing closing stock: FIFO vs weighted average</h2>
        <p>Prices change during the year. Which cost do you use for the stock that&apos;s left? Here&apos;s Kōwhai&apos;s coffee beans in March (an illustration):</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-2 font-bold">Purchases</h3>
          <table className="w-full text-sm"><tbody>
            {buys.map((b) => <tr key={b.d} className="border-b border-stone-100"><td className="py-1">{b.d}</td><td className="num text-right">{b.kg} kg</td><td className="num text-right">@ {money(b.price)}</td><td className="num text-right">{money(b.kg * b.price)}</td></tr>)}
            <tr className="font-semibold"><td className="py-1">Total</td><td className="num text-right">{totalKg} kg</td><td /><td className="num text-right">{money(totalCost)}</td></tr>
          </tbody></table>
          <p className="mt-2 text-sm">Used: <strong>{sold} kg</strong>. Left on the shelf: <strong>{closingKg} kg</strong>.</p>
        </Card>
        <Card>
          <h3 className="mb-1 font-bold">FIFO (first in, first out)</h3>
          <p className="text-sm text-stone-600">Assumes the oldest beans are used first, so what&apos;s left is the <em>newest, dearest</em> stock.</p>
          <div className="mt-3 text-sm">Closing stock: <strong className="num">{money(fifoClosing)}</strong></div>
          <div className="text-sm">COGS: <strong className="num">{money(totalCost - fifoClosing)}</strong></div>
        </Card>
        <Card>
          <h3 className="mb-1 font-bold">Weighted average cost</h3>
          <p className="text-sm text-stone-600">Average cost = {money(totalCost)} ÷ {totalKg} kg = {money(wac)}/kg.</p>
          <div className="mt-3 text-sm">Closing stock: <strong className="num">{money(wacClosing)}</strong></div>
          <div className="text-sm">COGS: <strong className="num">{money(totalCost - wacClosing)}</strong></div>
        </Card>
      </div>
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>When prices are rising, FIFO gives a higher closing stock and higher profit. Both methods are acceptable. Pick one and use it consistently. (LIFO isn&apos;t allowed in NZ.) Stock is valued at the <strong>lower of cost and net realisable value</strong>: if milk is about to expire, it&apos;s worth nothing.</p>
        <UsNote>
          <p>US GAAP allows <strong>LIFO</strong> (last in, first out), and American textbooks often teach it alongside FIFO. <strong>LIFO isn&apos;t allowed in NZ</strong>, so use FIFO or weighted average.</p>
          <p>Also, under US GAAP a stock write-down can never be reversed. Under NZ IFRS it can be reversed (up to original cost) if the value recovers.</p>
        </UsNote>
        <h2>IRD trading stock rules</h2>
        <ul>
          <li>Trading stock must be valued at balance date. Options include cost, discounted selling price and market selling value.</li>
          <li><strong>Low-turnover concession</strong>: if turnover is $1.3m or less and closing stock is reasonably estimated at under $10,000, you can use <strong>opening stock value</strong> as closing value instead of doing a full valuation. Kōwhai (about $440k turnover, $3,800 stock) qualifies but chose to count anyway.</li>
          <li><strong>Stock taken for private use</strong> (Aroha takes beans home): treated as sold at market value, with GST payable.</li>
          <li><strong>Wastage</strong> (expired milk, dropped cakes) is simply not in the count, so it ends up in COGS automatically.</li>
        </ul>
        <Callout kind="tip" title="Café rule of thumb">Most cafés aim for a COGS of 28–35% of sales. Kōwhai&apos;s is about 30%. If it creeps up, look at wastage, portion sizes, supplier prices and menu prices.</Callout>
      </div>
    </div>
  );
}

/* ───────────── Other taxes ───────────── */

export function OtherTaxesTopic() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="prose-learn text-[16px]">
        <h2>Resident withholding tax (RWT)</h2>
        <p><Term k="rwt">RWT</Term> is deducted by banks from interest before it&apos;s paid. Companies default to {pct(RWT.companyDefault)}. Individuals choose 10.5%–39% based on their income. With no IRD number, the rate is {pct(RWT.noIrdNumber)}. RWT is a credit against the year&apos;s income tax. Kōwhai&apos;s {money(TAX.rwt)} reduced its tax bill.</p>
        <p>Companies also deduct RWT from <strong>dividends</strong> they pay (33% less imputation credits).</p>
        <h2>Schedular payments (withholding tax for contractors)</h2>
        <p>Certain contractors (e.g. cleaners, promoters, some labour-only building and agricultural work, company directors&apos; fees) have tax withheld by the payer, usually at 10%–20%. The payer files it through payday filing, like PAYE. If Kōwhai hired a contract cleaner covered by the schedule, it would need to deduct withholding tax unless the cleaner had a certificate of exemption.</p>
      </div>
      <div className="prose-learn text-[16px]">
        <h2>Fringe benefit tax (FBT)</h2>
        <p><Term k="fbt">FBT</Term> is paid by the employer on non-cash benefits given to employees: private use of a work vehicle, low-interest loans, subsidised goods above a small threshold, gym memberships, and so on. It&apos;s filed quarterly (or annually for small employers).</p>
        <ul>
          <li>Free coffee for staff on shift? Generally fine. Small on-premises benefits are exempt or under the minimum threshold ($300 per employee per quarter, $22,500 per employer per year).</li>
          <li>A company van Ben takes home at night? That would trigger FBT on private availability, unless it&apos;s a work-related vehicle with restrictions.</li>
          <li>An overdrawn shareholder current account with no interest charged? That&apos;s a low-interest loan: FBT, or a deemed dividend.</li>
        </ul>
        <h2>Non-resident contractors and imports</h2>
        <p>Imported goods attract GST (and possibly duty) at the border, collected by Customs. Overseas digital services (like Kōwhai&apos;s social media ads) include NZ GST when the supplier is registered here.</p>
      </div>
    </div>
  );
}

/* ───────────── Compliance ───────────── */

export function ComplianceTopic() {
  const cal = [
    ["Every payday (+2 working days)", "Payday filing: employment information to IRD"],
    ["20th of every month", "PAYE, student loan, KiwiSaver, ESCT for last month's pays"],
    ["28 June / Aug / Oct / Feb, 15 Jan, 7 May", "Two-monthly GST returns & payments"],
    ["28 August, 15 January, 7 May", "Provisional tax instalments (from the 2028 year)"],
    ["31 March", "Balance date: stocktake, cut-off, year-end adjustments"],
    ["Registration anniversary month", "Companies Office annual return (+ fee)"],
    ["Once a year (around Aug–Sept)", "ACC work levy invoice"],
    ["31 March following year (with agent)", "IR4 company income tax return; financial statements to shareholders"],
    ["7 February (7 April with agent)", "Terminal tax"],
    ["Quarterly / annually if applicable", "FBT returns"],
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h2>Record keeping</h2>
          <p>NZ businesses must keep business records for <strong>{RECORD_KEEPING_YEARS} years</strong>: invoices, receipts, bank statements, payroll records, the ledger, stocktake sheets, contracts and asset registers. They can be electronic, but must be in English or te reo Māori, and kept in NZ unless IRD approves otherwise. Wage, time and holiday records: 6 years (Employment Relations Act / Holidays Act).</p>
          <h2>Financial reporting requirements</h2>
          <ul>
            <li><strong>Small companies like Kōwhai</strong> don&apos;t file financial statements publicly. They must prepare <strong>special-purpose financial statements</strong> meeting IRD&apos;s minimum requirements (Tax Administration (Financial Statements) Order 2014): a balance sheet and P&amp;L on accrual principles (with exceptions), with a reconciliation to taxable income.</li>
            <li><strong>Large companies</strong> (much bigger thresholds by revenue or assets) and those with 10+ shareholders who opt in must prepare <strong>general-purpose financial reports</strong> under XRB standards (NZ IFRS), usually audited.</li>
            <li><strong>Charities</strong> report under XRB&apos;s Tier 1–4 standards, with simpler rules for small charities.</li>
          </ul>
          <h2>Companies Office</h2>
          <p>Every company files an <strong>annual return</strong> confirming directors, shareholders and address details, keeps a <strong>share register</strong> and <strong>minutes</strong>, and directors must meet their duties under the Companies Act 1993. That includes the <strong>solvency test</strong> before paying any dividend. That means the company must be able to pay its debts as they fall due, and its assets must exceed its liabilities (Companies Act 1993 ss 4, 52). The annual return is filed in the month the Registrar allocates to the company (s 214).</p>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Kōwhai&apos;s compliance calendar</h3>
          <ul className="space-y-2 text-sm">
            {cal.map(([w, t]) => (
              <li key={w} className="grid grid-cols-[11rem_1fr] gap-3 border-b border-stone-100 pb-2">
                <span className="font-semibold text-kowhai-700">{w}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">Rates and dates as at {RATES_AS_AT}.</p>
        </Card>
      </div>
    </div>
  );
}
