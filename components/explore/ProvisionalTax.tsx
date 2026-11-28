"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ACTUAL_RIT, BOOKS, LAST_RIT, LAST_SUPPLIES, METHODS, RATIO_OK, TERMINAL_DATE, plans, type Method } from "@/data/books/provisionalTax";
import type { Plan } from "@/lib/nz/provisionalTax";
import { LATE_PAYMENT_PENALTY, PROVISIONAL_TAX } from "@/lib/nz/rates";
import { money, nzDate, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";

const $ = (x: number) => money(x);
const $0 = (x: number) => money(x, { dp: 0 });
const LATE_OPTIONS = [0, 5, 10, 30];

function Slider({ label, hint, value, min, max, step, onChange }: { label: string; hint: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="num text-lg font-bold">{$0(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-kowhai-500" />
      <div className="text-xs text-stone-500">{hint}</div>
    </label>
  );
}

function Schedule({ plan, actualRit }: { plan: Plan; actualRit: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500">
            <th className="py-1 pr-2">Due</th><th className="px-2">For</th><th className="pl-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {plan.instalments.map((x, i) => (
            <tr key={i} className="border-b border-stone-100 align-top">
              <td className="py-1.5 pr-2 whitespace-nowrap">{nzDate(x.date)}</td>
              <td className="px-2 py-1.5">{x.label}{x.paidOn && <span className="block text-xs text-rose-700">paid late, on {nzDate(x.paidOn)}</span>}</td>
              <td className="num py-1.5 pl-2 text-right">{$(x.amount)}</td>
            </tr>
          ))}
          <tr className="border-b border-stone-200 font-semibold">
            <td className="py-1.5 pr-2" colSpan={2}>Paid during the year</td><td className="num py-1.5 pl-2 text-right">{$(plan.paid)}</td>
          </tr>
          <tr className="align-top">
            <td className="py-1.5 pr-2 whitespace-nowrap">{nzDate(TERMINAL_DATE)}</td>
            <td className="px-2 py-1.5">{plan.terminal >= 0 ? "Terminal tax" : "Refund"}<span className="block text-xs text-stone-500">actual RIT {$(actualRit)} − paid {$(plan.paid)}</span></td>
            <td className="num py-1.5 pl-2 text-right font-semibold">{$(Math.abs(plan.terminal))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ProvisionalTaxTool() {
  const [method, setMethod] = useState<Method>("standard");
  const [actualRit, setActualRit] = useState(ACTUAL_RIT);
  const [estimate, setEstimate] = useState(15_000);
  const [lateDays, setLateDays] = useState(0);
  const all = useMemo(() => plans({ actualRit, estimate, late: lateDays ? { index: 1, days: lateDays } : undefined }), [actualRit, estimate, lateDays]);
  const plan = all[method];
  const over = actualRit >= PROVISIONAL_TAX.safeHarbourRit;
  const cost = (p: Plan) => p.interestCharged + p.penalties - p.interestCredited;

  return (
    <div className="space-y-8">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>
          Kōwhai&apos;s first-year <Term k="terminal-tax">residual income tax</Term> (RIT) was {$(LAST_RIT)}, over {$0(PROVISIONAL_TAX.ritThreshold)}, so in year 2 it must pay <Term k="provisional-tax">provisional tax</Term>: the year&apos;s tax in instalments, during the year.
          It used the standard method and paid {$(BOOKS.total)}. The year&apos;s RIT came to {$(ACTUAL_RIT)}. Choose a method, then change how the year turned out.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button key={m.key} onClick={() => setMethod(m.key)} title={m.blurb}
            className={cx("rounded-xl px-4 py-2 text-sm font-semibold ring-1", method === m.key ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
            {m.label}{m.key === "standard" && " (Kōwhai's)"}
          </button>
        ))}
      </div>
      <p className="-mt-5 text-sm text-stone-600">{METHODS.find((m) => m.key === method)!.blurb}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="space-y-5">
          <Slider label="How the year turned out (actual RIT)" value={actualRit} min={0} max={100_000} step={500}
            hint={`Really ${$(ACTUAL_RIT)}. At ${$0(PROVISIONAL_TAX.safeHarbourRit)} or more the standard method charges interest.`}
            onChange={setActualRit} />
          {method === "estimation" && (
            <Slider label="Your estimate of the RIT" value={estimate} min={0} max={100_000} step={500}
              hint="Must be fair and reasonable (s RC 7). You can revise it on or before any instalment date." onChange={setEstimate} />
          )}
          {method === "standard" && (
            <div>
              <div className="font-semibold">Pay the 15 January instalment late?</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {LATE_OPTIONS.map((d) => (
                  <button key={d} onClick={() => setLateDays(d)}
                    className={cx("rounded-lg px-3 py-1.5 text-sm ring-1", lateDays === d ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
                    {d ? `${d} days late` : "On time"}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-xs text-stone-500">Late payment penalty: {pct(LATE_PAYMENT_PENALTY.initial, 0)} the day after the due date, then {pct(LATE_PAYMENT_PENALTY.second, 0)} of the new amount a week later (Tax Administration Act s 139B).</div>
            </div>
          )}
          {method === "ratio" && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <strong>Not available to Kōwhai in year 2.</strong> To use the GST ratio, {RATIO_OK.reasons.join("; ")}. Kōwhai opened in year 1, so it can use the ratio from year 3. The figures show how it would work.
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-bold">{METHODS.find((m) => m.key === method)!.label} method</h3>
          {method === "ratio" && <p className="mt-1 text-xs text-stone-500">Ratio: last year&apos;s RIT {$(LAST_RIT)} ÷ taxable supplies {$0(LAST_SUPPLIES)} = {pct(all.ratio.ratio, 1)}, × each period&apos;s sales excluding GST.</p>}
          {method === "aim" && <p className="mt-1 text-xs text-stone-500">Approximated from the ledger: the profit to each GST period&apos;s end, scaled so the year comes to the real taxable income. Real AIM software applies the tax adjustments as it goes.</p>}
          <div className="mt-3"><Schedule plan={plan} actualRit={actualRit} /></div>
          <dl className="mt-4 space-y-1 rounded-lg bg-stone-50 p-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Use-of-money interest charged</dt><dd className="num">{$(plan.interestCharged)}</dd></div>
            {plan.interestCredited > 0 && <div className="flex justify-between gap-3"><dt>Interest paid to Kōwhai (overpaid)</dt><dd className="num">{$(plan.interestCredited)}</dd></div>}
            {plan.penalties > 0 && <div className="flex justify-between gap-3"><dt>Late payment penalties</dt><dd className="num">{$(plan.penalties)}</dd></div>}
            <div className="flex justify-between gap-3 border-t border-stone-200 pt-1 font-semibold"><dt>Extra cost</dt><dd className="num">{$(cost(plan))}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-stone-500">{plan.rule}</p>
          {plan.steps.length > 0 && (
            <details className="mt-2 text-xs text-stone-600">
              <summary className="cursor-pointer font-semibold">How the interest is worked out</summary>
              <ul className="mt-1 space-y-0.5">
                {plan.steps.map((s, i) => (
                  <li key={i}>{nzDate(s.from)} to {nzDate(s.to)}: {s.balance > 0 ? "underpaid" : "overpaid"} {$(Math.abs(s.balance))} × {pct(s.balance > 0 ? PROVISIONAL_TAX.uomiUnderpaid : PROVISIONAL_TAX.uomiOverpaid, 2)} × {s.days}/365 = {$(Math.abs(s.interest))}</li>
                ))}
              </ul>
              <p className="mt-1">Worked out daily, not compounded. No interest when the gap is {$0(PROVISIONAL_TAX.uomiDeMinimis)} or less.</p>
            </details>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold">All four methods, for this year</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500">
                <th className="py-1 pr-1 sm:pr-2">Method</th><th className="px-1 text-right sm:px-2">Paid in year</th><th className="px-1 text-right sm:px-2">Terminal tax</th><th className="pl-1 text-right sm:pl-2">Interest &amp; penalties</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => {
                const p = all[m.key];
                return (
                  <tr key={m.key} className={cx("border-b border-stone-100", m.key === method && "bg-kowhai-50 font-semibold")}>
                    <td className="py-2 pr-1 sm:pr-2">{m.label}{m.key === "ratio" && <span className="block text-[11px] font-normal text-stone-500">not yet allowed</span>}</td>
                    <td className="num px-1 py-2 text-right sm:px-2">{$0(p.paid)}</td>
                    <td className="num px-1 py-2 text-right sm:px-2">{p.terminal < 0 ? `(${$0(-p.terminal)})` : $0(p.terminal)}</td>
                    <td className="num py-2 pl-1 text-right sm:pl-2">{$0(cost(p))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-stone-500">Brackets: a refund. The estimation row uses your estimate; the standard row includes any late payment you chose.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Callout kind="why" title="What the numbers show">
          {over ? (
            <>At {$0(actualRit)} the RIT is over {$0(PROVISIONAL_TAX.safeHarbourRit)}, so the standard method no longer protects Kōwhai: interest runs from the last instalment on everything it didn&apos;t pay. A business growing this fast is better off with a careful estimate (revised as the year goes) or AIM, which pays as the profit comes in.</>
          ) : (
            <>With RIT under {$0(PROVISIONAL_TAX.safeHarbourRit)}, the standard method is the safe choice: Kōwhai paid a predictable amount and owes <strong>no interest</strong> even though the year beat the last, because interest only starts at the terminal tax date (s 120KE). Estimating lower saves cash during the year, but costs interest if the estimate is short.</>
          )}
        </Callout>
        <UsNote>
          <p>US corporations pay <strong>estimated tax</strong> in four quarterly instalments (Form 1120-W). The &quot;safe harbor&quot; is 100% of last year&apos;s tax (with limits for large corporations), and a shortfall attracts an underpayment penalty worked out like interest.</p>
          <p>NZ has three instalments for most March balance dates, a 5% uplift on last year, and use-of-money interest.</p>
        </UsNote>
      </div>

      <p className="text-xs text-stone-500">
        Interest rates: {pct(PROVISIONAL_TAX.uomiUnderpaid, 2)} charged and {pct(PROVISIONAL_TAX.uomiOverpaid, 2)} paid, from {PROVISIONAL_TAX.uomiFrom}. Terminal tax is due {nzDate(TERMINAL_DATE)} because Kōwhai has a tax agent.
        See also <Link href="/nz/provisional-tax" className="underline">Provisional tax</Link>.
      </p>
    </div>
  );
}
