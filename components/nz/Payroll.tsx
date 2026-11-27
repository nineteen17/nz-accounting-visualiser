"use client";

import { useState } from "react";
import Link from "next/link";
import { PAY_RUNS } from "@/data/books/year";
import { EMPLOYEES } from "@/data/business";
import { ACC_EARNERS_LEVY, CURRENT_PAYROLL, ESCT_BANDS, HOLIDAYS, IETC, INDIVIDUAL_TAX_BRACKETS, KIWISAVER, MINIMUM_WAGE, STUDENT_LOAN } from "@/lib/nz/rates";
import { TAX_CODES, esctRateFor, ietcFor, progressiveTax, type TaxCode } from "@/lib/nz/payroll";
import { money, pct, r2 } from "@/lib/money";
import { cx } from "@/lib/ui";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { DURING_YEAR } from "@/data/books";
import { MemoryAid } from "@/components/learn/MemoryAid";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm"><span className="mb-1 block font-medium text-stone-600">{label}</span>{children}</label>
);
const input = "w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm";

/* ───────────── PAYE ───────────── */

export function PayeTopic() {
  const [gross, setGross] = useState(2080);
  const [freq, setFreq] = useState(26);
  const [code, setCode] = useState<TaxCode>("ME");
  const [sl, setSl] = useState(true);
  const [ks, setKs] = useState(KIWISAVER.employeeDefault);
  const annual = gross * freq;
  const flat = TAX_CODES[code].flat;
  const pt = progressiveTax(annual);
  const taxAnnual = flat !== undefined ? annual * flat : pt.total;
  const ietc = code === "ME" ? ietcFor(annual) : 0;
  const accAnnual = Math.min(annual, ACC_EARNERS_LEVY.maxLiableEarnings) * ACC_EARNERS_LEVY.rate;
  const incomeTax = r2((taxAnnual - ietc) / freq);
  const acc = r2(accAnnual / freq);
  const slThreshold = STUDENT_LOAN.annualThreshold / freq;
  const slAmt = sl ? r2(Math.max(0, gross - slThreshold) * STUDENT_LOAN.rate) : 0;
  const ksAmt = r2(gross * ks);
  const net = r2(gross - incomeTax - acc - slAmt - ksAmt);
  const erGross = ks > 0 ? r2(gross * KIWISAVER.employerMinimum) : 0;
  const esctRate = esctRateFor(annual + erGross * freq);
  const esct = r2(erGross * esctRate);
  const segments = [
    { l: "Take-home", v: net, c: "bg-emerald-500" },
    { l: "PAYE tax", v: incomeTax, c: "bg-rose-500" },
    { l: "ACC levy", v: acc, c: "bg-rose-300" },
    { l: "Student loan", v: slAmt, c: "bg-violet-500" },
    { l: "KiwiSaver", v: ksAmt, c: "bg-sky-500" },
  ];
  const first = DURING_YEAR.find((t) => t.id === "A21")!;
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>Employers in NZ are unpaid tax collectors. Every payday they calculate <Term k="paye">PAYE</Term> (Pay As You Earn) on each employee&apos;s wages, deduct it, and pay it to IRD with any student loan and KiwiSaver deductions.</p>
          <h3>How PAYE is worked out</h3>
          <ol>
            <li>Take the <strong>gross pay</strong> for the period (hours × rate + any extras).</li>
            <li><strong>Annualise</strong> it (× 52 weekly, × 26 fortnightly, × 12 monthly).</li>
            <li>Apply the <strong>tax brackets</strong> (or a flat rate for secondary codes).</li>
            <li>Subtract the <Term k="ietc">IETC</Term> if the code is ME.</li>
            <li>Add the <Term k="acc-earners-levy">ACC earners&apos; levy</Term> ({pct(ACC_EARNERS_LEVY.rate, 2)}).</li>
            <li>Divide back to the pay period.</li>
          </ol>
          <p>IRD publishes exact PAYE tables and rounding rules. Payroll software follows them, so results can differ from this calculator by a few cents.</p>
          <h3>Tax codes</h3>
          <p>New employees complete an <strong>IR330</strong> tax code declaration. Without one, the employer must deduct at the 45% <strong>non-declaration rate</strong>.</p>
          <div className="not-prose grid gap-1 text-sm">
            {Object.entries(TAX_CODES).map(([k, v]) => <div key={k}><strong className="inline-block w-12">{k}</strong>{v.explain}</div>)}
            <div><strong className="inline-block w-12">+ SL</strong>Has a student loan: deduct {pct(STUDENT_LOAN.rate)} of earnings over {money(STUDENT_LOAN.annualThreshold, { dp: 0 })}/yr.</div>
          </div>
                  <UsNote>
            <p>There&apos;s no <strong>FICA</strong> (Social Security and Medicare) in NZ, and the employer pays no social-security tax or unemployment tax on wages. The employee&apos;s <strong>PAYE</strong> covers income tax and the ACC earners&apos; levy. The employer&apos;s extra cost is the compulsory <strong>{pct(KIWISAVER.employerMinimum)} KiwiSaver</strong> contribution (and the annual ACC work levy).</p>
            <p>Instead of a <strong>W-4</strong>, NZ employees fill in an <strong>IR330</strong>. Instead of a year-end <strong>W-2</strong>, employers report every pay run to IRD through payday filing. And most NZ employees never file a tax return, because PAYE is designed to deduct exactly the right amount.</p>
          </UsNote>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Payslip calculator</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gross pay per period ($)"><input type="number" className={input} value={gross} onChange={(e) => setGross(Number(e.target.value) || 0)} /></Field>
            <Field label="Pay frequency">
              <select className={input} value={freq} onChange={(e) => setFreq(Number(e.target.value))}><option value={52}>Weekly</option><option value={26}>Fortnightly</option><option value={12}>Monthly</option></select>
            </Field>
            <Field label="Tax code">
              <select className={input} value={code} onChange={(e) => setCode(e.target.value as TaxCode)}>{Object.keys(TAX_CODES).map((k) => <option key={k}>{k}</option>)}</select>
            </Field>
            <Field label="KiwiSaver (employee)">
              <select className={input} value={ks} onChange={(e) => setKs(Number(e.target.value))}><option value={0}>Not a member</option>{KIWISAVER.otherEmployeeRates.map((r) => <option key={r} value={r}>{pct(r)}</option>)}</select>
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={sl} onChange={(e) => setSl(e.target.checked)} /> Has a student loan (SL)</label>
          </div>
          <div className="mt-4 flex h-8 overflow-hidden rounded-lg" aria-hidden="true">
            {segments.filter((s) => s.v > 0).map((s) => <div key={s.l} className={cx(s.c, "border-r-2 border-white last:border-r-0")} style={{ width: `${(s.v / gross) * 100}%` }} title={`${s.l}: ${money(s.v)}`} />)}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-600">{segments.map((s) => <span key={s.l}><i className={cx("mr-1 inline-block h-2 w-2 rounded-sm", s.c)} />{s.l}</span>)}</div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between font-semibold"><dt>Gross pay</dt><dd className="num">{money(gross)}</dd></div>
            <div className="flex justify-between"><dt>PAYE income tax{ietc ? ` (after IETC ${money(ietc / freq)})` : ""}</dt><dd className="num">−{money(incomeTax)}</dd></div>
            <div className="flex justify-between"><dt>ACC earners&apos; levy</dt><dd className="num">−{money(acc)}</dd></div>
            <div className="flex justify-between"><dt>Student loan</dt><dd className="num">−{money(slAmt)}</dd></div>
            <div className="flex justify-between"><dt>KiwiSaver employee</dt><dd className="num">−{money(ksAmt)}</dd></div>
            <div className="flex justify-between border-t border-stone-300 pt-1 text-base font-bold"><dt>Net (take-home) pay</dt><dd className="num">{money(net)}</dd></div>
            {ks > 0 && <div className="flex justify-between pt-2 text-stone-600"><dt>Employer KiwiSaver {pct(KIWISAVER.employerMinimum)} less ESCT {pct(esctRate)}</dt><dd className="num">{money(erGross)} − {money(esct)} = {money(erGross - esct)}</dd></div>}
            <div className="flex justify-between text-stone-600"><dt>Total employer cost</dt><dd className="num">{money(gross + erGross)}</dd></div>
          </dl>
          {flat === undefined && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">Annualised {money(annual, { dp: 0 })} through the brackets</div>
              {pt.steps.map((s) => (
                <div key={s.from} className="grid grid-cols-[8rem_3rem_1fr_5rem] items-center gap-2 text-xs">
                  <span className="num">{money(s.from, { dp: 0 })}–{s.to === Infinity ? "+" : money(s.to, { dp: 0 })}</span>
                  <span>{pct(s.rate)}</span>
                  <span className="h-2 rounded bg-rose-200"><span className="block h-2 rounded bg-rose-500" style={{ width: `${(s.taxable / annual) * 100}%` }} /></span>
                  <span className="num text-right">{money(s.tax, { dp: 0 })}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h2>Payday filing</h2>
          <p>Within <strong>2 working days</strong> of each payday, the employer files <strong>employment information</strong> with IRD: each employee&apos;s gross pay, PAYE, student loan, KiwiSaver and ESCT. New and departing employees are also reported. This is <Term k="payday-filing">payday filing</Term>, and payroll software sends it automatically through myIR.</p>
          <h2>Paying IRD</h2>
          <p>Small employers (less than $500,000 PAYE + ESCT a year) pay once a month, by the <strong>20th of the following month</strong>. Larger employers pay twice monthly. Late payment brings penalties and interest.</p>
          <h2>The accounting entry</h2>
          <p>The pay run is a single compound entry: wages expense at <strong>gross</strong>, employer KiwiSaver as an extra expense, net pay out of the bank, and every deduction credited to a liability until it&apos;s paid to IRD.</p>
          <Callout kind="warn" title="Common mistake">Recording only the net pay as &quot;wages&quot;. The expense is the gross. The deductions are still part of the employee&apos;s wage; the café just pays that part to IRD on their behalf.</Callout>
        </div>
        <div className="space-y-4">
          {first.doc && <SourceDoc doc={first.doc} />}
          <JournalEntry txn={first} />
        </div>
      </div>
      <MemoryAid k="paye-20th" link={false} />
    </div>
  );
}

/* ───────────── KiwiSaver ───────────── */

export function KiwiSaverTopic() {
  const [salary, setSalary] = useState(54_080);
  const er = salary * KIWISAVER.employerMinimum;
  const rate = esctRateFor(salary + er);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="prose-learn text-[16px]">
        <p><Term k="kiwisaver">KiwiSaver</Term> is NZ&apos;s workplace retirement savings scheme. New employees aged 18–65 are automatically enrolled and can opt out between weeks 2 and 8.</p>
        <h3>Contribution rates (from 1 April 2026)</h3>
        <ul>
          <li><strong>Employee</strong>: chooses {KIWISAVER.otherEmployeeRates.map((r) => pct(r)).join(", ")} of gross pay. The default rose from {pct(KIWISAVER.previousDefault)} to <strong>{pct(KIWISAVER.employeeDefault)}</strong> on 1 April 2026 and will be 4% from {KIWISAVER.futureRate.from}. Employees can apply for a temporary rate reduction to stay at {pct(KIWISAVER.previousDefault)}.</li>
          <li><strong>Employer</strong>: at least <strong>{pct(KIWISAVER.employerMinimum)}</strong> of gross pay on top of wages, for members aged 16 and over who are contributing.</li>
          <li>The test is the <strong>pay date</strong>: pays dated on or after 1 April 2026 use the new rate.</li>
        </ul>
        <h3>ESCT: tax on the employer contribution</h3>
        <p>The employer&apos;s contribution is taxed with <Term k="esct">ESCT</Term>, deducted from the contribution itself. The rate depends on the employee&apos;s salary plus employer contributions for the previous year (or an estimate for a new employee).</p>
        <Callout kind="why" title="In the café's books">Employer KiwiSaver is debited to <strong>601 KiwiSaver employer contributions</strong> (an expense) at the <em>gross</em> amount. Both the net contribution and the ESCT are credited to <strong>215 PAYE &amp; payroll deductions payable</strong>, and everything is paid to IRD together. IRD passes the money on to the employee&apos;s KiwiSaver provider.</Callout>
        <Callout kind="nz" title="Total remuneration (salary sacrifice)">Some employment agreements say the employer contribution comes <em>out of</em> an agreed total package instead of on top. That&apos;s allowed only if it&apos;s agreed in good faith, and the employee can&apos;t be paid less than minimum wage because of it.</Callout>
      </div>
      <Card>
        <h3 className="mb-3 text-lg font-bold">ESCT rate finder</h3>
        <Field label="Employee's annual salary ($)"><input type="number" className={input} value={salary} onChange={(e) => setSalary(Number(e.target.value) || 0)} /></Field>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1">Salary + employer contributions</th><th className="text-right">ESCT rate</th></tr></thead>
          <tbody>
            {ESCT_BANDS.map((b, i) => {
              const from = i === 0 ? 0 : ESCT_BANDS[i - 1].upTo + 1;
              return (
                <tr key={b.rate} className={cx("border-b border-stone-100", b.rate === rate && "bg-kowhai-100 font-semibold")}>
                  <td className="num py-1">{money(from, { dp: 0 })} – {b.upTo === Infinity ? "and over" : money(b.upTo, { dp: 0 })}</td>
                  <td className="text-right">{pct(b.rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm">
          <div className="flex justify-between"><span>Employer contribution {pct(KIWISAVER.employerMinimum)}</span><span className="num">{money(er)}/yr</span></div>
          <div className="flex justify-between"><span>ESCT @ {pct(rate)}</span><span className="num">−{money(er * rate)}</span></div>
          <div className="flex justify-between font-semibold"><span>Reaches the KiwiSaver account</span><span className="num">{money(er * (1 - rate))}</span></div>
        </div>
        <p className="mt-3 text-xs text-stone-500">Mia earns about $54,080 a year, so her ESCT rate is 17.5%. Check the current bands on ird.govt.nz.</p>
      </Card>
    </div>
  );
}

/* ───────────── Holidays ───────────── */

export function HolidaysTopic() {
  const mia = EMPLOYEES[0];
  const miaYear = PAY_RUNS.reduce((s, r) => s + r.results[0].gross, 0);
  const owp = mia.rate * 40;
  const awe = miaYear / 52;
  const holidays2026 = [
    ["New Year's Day", "Thu 1 Jan 2026"], ["Day after New Year's", "Fri 2 Jan"], ["Waitangi Day", "Fri 6 Feb"], ["Good Friday", "Fri 3 Apr"], ["Easter Monday", "Mon 6 Apr"],
    ["Anzac Day", "Sat 25 Apr (Mondayised to Mon 27 Apr)"], ["King's Birthday", "Mon 1 Jun"], ["Matariki", "Fri 10 Jul 2026"], ["Labour Day", "Mon 26 Oct"],
    ["Christmas Day", "Fri 25 Dec"], ["Boxing Day", "Sat 26 Dec (Mondayised to Mon 28 Dec)"], ["Wellington Anniversary", "Mon 19 Jan 2026 / Mon 25 Jan 2027"],
  ];
  return (
    <div className="space-y-6">
      <Callout kind="warn" title="Check for changes">The Holidays Act 2003 still applies. In August 2026 Parliament passed the Employment Leave Bill, which will replace it with an hours-based system (leave builds up for each hour worked). The new rules are expected to take effect in 2028, after a two-year lead-in, and until then employers must keep following the Holidays Act (employment.govt.nz). Kōwhai&apos;s years (2026–28) all fall under the Holidays Act. The concepts below are what matter for the accounts. Section references are to the Holidays Act 2003 (legislation.govt.nz).</Callout>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <h2>Annual leave</h2>
          <p>After <strong>12 months</strong> of continuous employment, an employee is entitled to <strong>{HOLIDAYS.annualLeaveWeeks} weeks&apos; paid annual leave</strong> (s 16). Leave is paid at the greater of (s 21):</p>
          <ul>
            <li><strong>Ordinary weekly pay (OWP)</strong>: what they normally earn in a week.</li>
            <li><strong>Average weekly earnings (AWE)</strong>: gross earnings over the last 12 months ÷ 52.</li>
          </ul>
          <h2>8% pay-as-you-go</h2>
          <p>For <strong>casual</strong> employees, or fixed-term employees on contracts under 12 months, the employer may pay <strong>8% of gross earnings</strong> as holiday pay with every pay, but only if the employment agreement says so and it shows as a separate, identifiable amount on the payslip (s 28). Leo is paid this way, so the café never owes him accrued leave.</p>
          <h2>Public holidays</h2>
          <p>NZ has {HOLIDAYS.publicHolidays} public holidays, including <strong>Matariki</strong> (since 2022) and a regional anniversary day. If an employee works on a public holiday that would otherwise be a working day for them, they get <strong>time and a half</strong> (s 50) plus an <strong>alternative holiday</strong>, a day in lieu (s 56). Cafés trade on most public holidays, so this matters.</p>
          <h2>Sick &amp; bereavement leave</h2>
          <p>After 6 months: <strong>{HOLIDAYS.sickLeaveDays} days&apos; sick leave</strong> a year (s 65). Up to 10 unused days carry over, to a maximum of 20 days&apos; entitlement in any year (s 66). Bereavement leave is {HOLIDAYS.bereavementDays} (s 70). Sick leave isn&apos;t accrued as a liability, because it&apos;s only paid if someone is sick.</p>
        </div>
        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 text-lg font-bold">Mia&apos;s annual leave pay</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt>Ordinary weekly pay (40 hrs × {money(mia.rate)})</dt><dd className="num">{money(owp)}</dd></div>
              <div className="flex justify-between"><dt>Average weekly earnings (last year ÷ 52)</dt><dd className="num">{money(awe)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Pay per week of leave (greater of)</dt><dd className="num">{money(Math.max(owp, awe))}</dd></div>
              <div className="flex justify-between"><dt>4 weeks</dt><dd className="num">{money(Math.max(owp, awe) * 4)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-stone-500">At year end the café accrues 8% of her earnings ({money(miaYear * 0.08)}) as a holiday pay liability (adjustment ADJ07). For tax, accrued holiday pay is only deductible if it&apos;s paid within 63 days of balance date.</p>
          </Card>
          <Card>
            <h3 className="mb-2 text-lg font-bold">Public holidays (Wellington)</h3>
            <ul className="space-y-0.5 text-sm">{holidays2026.map(([n, d]) => <li key={n} className="flex justify-between gap-3"><span>{n}</span><span className="text-stone-500">{d}</span></li>)}</ul>
            <p className="mt-2 text-xs text-stone-500">Matariki 2027 falls on Friday 25 June 2027.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Employment basics ───────────── */

export function EmploymentTopic() {
  return (
    <div className="prose-learn max-w-4xl text-[16px]">
      <h2>Minimum wage (from {MINIMUM_WAGE.from})</h2>
      <ul>
        <li>Adult minimum wage: <strong>{money(MINIMUM_WAGE.adult)}</strong> an hour (up from {money(MINIMUM_WAGE.previousAdult)}).</li>
        <li>Starting-out and training minimum wage: <strong>{money(MINIMUM_WAGE.startingOut)}</strong> (80% of the adult rate).</li>
      </ul>
      <p>Mia ($26.00) and Leo ($24.50) are both above the adult minimum. The minimum applies <em>after</em> any deductions the employer makes for its own benefit, so you can&apos;t, for example, deduct a uniform cost that pushes pay below minimum.</p>
      <h2>What an employer must keep</h2>
      <ul>
        <li>A signed <strong>written employment agreement</strong> for every employee.</li>
        <li><strong>Wage and time records</strong> (hours worked each day, pay) and <strong>holiday and leave records</strong>, kept for 6 years (Employment Relations Act 2000 s 130; Holidays Act 2003 s 81).</li>
        <li>The employee&apos;s <strong>IR330</strong> tax code declaration and <strong>KS1</strong> KiwiSaver deduction form.</li>
        <li>Proof of the right to work in NZ.</li>
      </ul>
      <h2>Employee vs contractor</h2>
      <p>Getting this wrong is expensive. Employees get PAYE, KiwiSaver, leave and minimum wage. Contractors invoice the business (possibly with GST) and pay their own tax, though some contractors have <Link href="/nz/other-taxes" className="underline">schedular payments withholding tax</Link> deducted. The test is the <em>real nature</em> of the relationship, not the label.</p>
      <Callout kind="why" title="Where it hits the accounts">Wages, KiwiSaver, holiday pay accruals, ACC levies and payroll liabilities. Every one of these appears in Kōwhai&apos;s accounts. Underpaying employees creates a liability for arrears, often going back years.</Callout>
    </div>
  );
}

/* ───────────── ACC ───────────── */

export function AccTopic() {
  return (
    <div className="prose-learn max-w-4xl text-[16px]">
      <p>ACC (the Accident Compensation Corporation) provides no-fault injury cover for everyone in NZ. Businesses meet it in two ways:</p>
      <h2>1. Earners&apos; levy: through PAYE</h2>
      <p>Funds non-work injury cover for employees. It&apos;s included in PAYE: {pct(ACC_EARNERS_LEVY.rate, 2)} of earnings (incl GST) for {CURRENT_PAYROLL.year}, up to maximum liable earnings of {money(ACC_EARNERS_LEVY.maxLiableEarnings, { dp: 0 })}. The employer just deducts it with PAYE. There&apos;s no separate entry.</p>
      <h2>2. Work levy: invoiced to the business</h2>
      <p>Covers workplace injuries. ACC invoices the business once a year based on total payroll (and, for shareholder-employees, their shareholder salaries) and the business&apos;s <strong>levy risk classification</strong> (cafés have their own code). There&apos;s also the Working Safer levy.</p>
      <ul>
        <li>The <strong>first invoice</strong> is usually provisional, based on an estimate. It&apos;s then squared up once actual earnings are known from the IR4/IR3 and payroll filing.</li>
        <li>Self-employed people and shareholder-employees also pay an <strong>earners&apos; levy on their own income</strong> through the ACC invoice (not PAYE).</li>
      </ul>
      <Callout kind="why" title="In the books">The ACC invoice is debited to an ACC levies expense account. The work levy is GST-inclusive and claimable. Kōwhai&apos;s first invoice will arrive in its second year, based on the first year&apos;s earnings. At year end the accountant may accrue an estimate.</Callout>
      <p>Earners&apos; levy maximum annual deduction: {money(ACC_EARNERS_LEVY.maxLiableEarnings * ACC_EARNERS_LEVY.rate)}. IETC used in PAYE: {money(IETC.annual)} a year.</p>
      <p className="text-sm text-stone-500">Individual tax brackets for reference: {INDIVIDUAL_TAX_BRACKETS.map((b) => `${pct(b.rate)} to ${b.upTo === Infinity ? "∞" : money(b.upTo, { dp: 0 })}`).join(" · ")}</p>
    </div>
  );
}
