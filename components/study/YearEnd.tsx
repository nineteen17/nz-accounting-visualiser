"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import type { EntryLine } from "@/data/study/core";
import { YEAR_ENDS, post, profitEffect, profitOf, totals, type YearEnd } from "@/data/study/yearEnd";
import type { Balances } from "@/lib/engine/ledger";
import { money, nzDate } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, Tabs } from "@/components/learn/bits";
import { RichText } from "@/components/learn/RichText";
import { ToolGuide } from "@/components/learn/ToolGuide";
import { EntryView } from "./DrillRun";

type Answer = { right: boolean; entered: EntryLine[] };

const signed = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${money(Math.abs(x))}`;

export function YearEndPractice() {
  const [year, setYear] = useState<YearEnd["key"]>("y1");
  const ye = YEAR_ENDS.find((y) => y.key === year)!;
  return (
    <div className="space-y-6">
      <ToolGuide
        what={<>On 31 March the day-to-day bookkeeping is done, but the figures aren&apos;t finished. Some costs belong to the year but haven&apos;t been billed yet, some bills cover next year too, equipment has worn out a bit, and the stock on the shelves has to be counted. The <strong>year-end adjustments</strong> fix all that, so the profit is right. Here you make Kōwhai&apos;s real adjustments yourself.</>}
        steps={[
          <>Choose <strong>year 1</strong> or <strong>year 2</strong> with the tabs. Year 1 has more adjustments.</>,
          <>Press <strong>Start the year-end</strong>. You get one fact at a time, such as &quot;the March power bill hasn&apos;t arrived&quot;.</>,
          <>Write the journal entry for each one: pick the accounts, Dr or Cr, and the amounts. Tick <strong>Harder</strong> to work out the amounts yourself.</>,
          <>Watch your trial balance update. At the end, compare your profit and balance sheet with Kōwhai&apos;s.</>,
        ]}
        read={<><strong>Your trial balance</strong> uses what <em>you</em> entered, right or wrong. Highlighted rows are the accounts your last entry changed. Under each entry, the line on profit shows how much that one adjustment moved the year&apos;s profit. Most adjustments lower it, which is why the unadjusted profit looks too good.</>}
        terms={[
          { k: "adjusting-entry", label: "Adjustment", says: "an entry at year end so the figures belong to the right year." },
          { k: "accrual-basis", says: "income counts when it's earned and costs when they're incurred, not when cash moves. This is why adjustments are needed." },
          { k: "accrued-expense", says: "a cost of this year that hasn't been billed or paid yet." },
          { k: "accrued-income", says: "income earned this year but not invoiced yet." },
          { k: "prepayment", says: "something paid for in advance: the part for next year is an asset, not an expense." },
          { k: "depreciation", says: "spreading the cost of equipment over the years it's used." },
          { k: "stocktake", says: "counting the stock on hand at 31 March, to work out what was really used." },
          { k: "bad-debt", says: "money a customer owes that will never be paid, written off as an expense." },
          { k: "holiday-pay", label: "Holiday pay accrual", says: "annual leave staff have earned but not taken yet: a cost of this year." },
          { k: "adjusted-trial-balance", says: "the trial balance after every adjustment: the figures the statements are made from." },
        ]}
      />
      <Tabs tabs={YEAR_ENDS.map((y) => ({ id: y.key, label: `${y.label}: ${nzDate(y.date)}` }))} value={year} onChange={setYear} />
      <Run key={year} ye={ye} />
    </div>
  );
}

function Run({ ye }: { ye: YearEnd }) {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hard, setHard] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const finished = answers.length === ye.steps.length;
  const answered = answers.length > i;

  // your trial balance: the unadjusted balances plus every entry as you wrote it
  const mine = useMemo(() => answers.reduce<Balances>((b, a) => post(b, a.entered), ye.unadjusted), [answers, ye]);
  const lastChanged = new Set(answered ? answers[i].entered.map((l) => l.account) : []);

  useEffect(() => { if (started) heading.current?.focus(); }, [i, started, finished]);

  if (!started) {
    const t = totals(ye.unadjusted);
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="prose-learn text-[16px]">
          <p>It&apos;s {nzDate(ye.date)}: the end of Kōwhai&apos;s {ye.label.toLowerCase()}. Every day-to-day transaction has been recorded and the trial balance balances: {money(t.dr)} of debits and credits. But it isn&apos;t finished. Some costs haven&apos;t been billed yet, some payments cover next year, the assets have worn down, and the stock hasn&apos;t been counted.</p>
          <p>You&apos;ll get the year-end facts one at a time, <strong>{ye.steps.length} adjustments</strong>, the same ones Kōwhai&apos;s accountant made. Write each entry. Your trial balance updates with what <em>you</em> enter, right or wrong, and at the end you&apos;ll see your profit beside the real one.</p>
          <p>Before adjustments, profit looks like <strong>{money(profitOf(ye.unadjusted, { beforeTax: true }))}</strong> before tax. Let&apos;s see where it really ends up.</p>
          <button onClick={() => setStarted(true)} className="mt-2 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Start the year-end</button>
        </div>
        <TrialBalance b={ye.unadjusted} title="Unadjusted trial balance" />
      </div>
    );
  }

  if (finished) return <Results ye={ye} answers={answers} mine={mine} onAgain={() => { setAnswers([]); setI(0); }} heading={heading} />;

  const step = ye.steps[i];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-stone-500">
          <span>Adjustment {i + 1} of {ye.steps.length}</span>
          <span>{answers.filter((a) => a.right).length} right so far</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-stone-200" aria-hidden><div className="h-1.5 rounded-full bg-kowhai-500" style={{ width: `${(answers.length / ye.steps.length) * 100}%` }} /></div>
        <h2 ref={heading} tabIndex={-1} className="mt-4 text-xl font-bold"><RichText text={step.q.prompt} inlineOnly /></h2>
        <EntryView key={`${ye.key}-${i}`} q={step.q} hard={hard} onHard={setHard}
          onAnswer={(right, entered) => setAnswers((all) => [...all.slice(0, i), { right, entered }])} />
        {answered && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-stone-600">Your entry changed profit before tax by <strong>{signed(profitEffect(answers[i].entered))}</strong>{answers[i].right ? "." : `; the right entry changes it by ${signed(profitEffect(step.q.lines))}.`}</p>
            <button autoFocus onClick={() => setI(i + 1)} className="ml-auto rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">
              {i + 1 < ye.steps.length ? "Next adjustment" : "See my year-end"}
            </button>
          </div>
        )}
      </div>
      <TrialBalance b={mine} title="Your trial balance" changed={lastChanged} />
    </div>
  );
}

function TrialBalance({ b, title, changed }: { b: Balances; title: string; changed?: Set<string> }) {
  const rows = ACCOUNTS.filter((a) => Math.abs(b[a.code] ?? 0) > 0.004);
  const t = totals(b);
  const balanced = Math.abs(t.dr - t.cr) < 0.005;
  return (
    <Card className="h-fit p-4 lg:sticky lg:top-20">
      <details open className="group">
        <summary className="cursor-pointer list-none font-bold [&::-webkit-details-marker]:hidden">
          {title} <span className="text-xs font-normal text-stone-500 group-open:hidden">(show)</span>
        </summary>
        <div className="mt-2 max-h-[55vh] overflow-y-auto pr-1 text-[13px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-white text-[11px] uppercase tracking-wider text-stone-500">
              <tr><th className="py-1 text-left font-semibold">Account</th><th className="text-right font-semibold">Dr</th><th className="text-right font-semibold">Cr</th></tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const v = b[a.code];
                return (
                  <tr key={a.code} className={cx("border-t border-stone-100", changed?.has(a.code) && "bg-kowhai-100")}>
                    <td className="py-0.5 pr-1">{a.name}</td>
                    <td className="num text-right">{v > 0 ? money(v) : ""}</td>
                    <td className="num pl-1 text-right">{v < 0 ? money(-v) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 border-t-2 border-stone-700 pt-1 text-[13px]">
          <div className="flex justify-between font-semibold"><span>Totals</span><span className="num">{money(t.dr)} · {money(t.cr)}</span></div>
          <div className={cx("mt-0.5 font-semibold", balanced ? "text-emerald-700" : "text-rose-700")}>{balanced ? "Balances ✓" : `Out by ${money(Math.abs(t.dr - t.cr))}`}</div>
          <div className="mt-1 flex justify-between"><span>Profit before tax</span><span className="num font-semibold">{money(profitOf(b, { beforeTax: true }))}</span></div>
        </div>
      </details>
    </Card>
  );
}

function Results({ ye, answers, mine, onAgain, heading }: { ye: YearEnd; answers: Answer[]; mine: Balances; onAgain: () => void; heading: React.RefObject<HTMLHeadingElement | null> }) {
  const right = answers.filter((a) => a.right).length;
  const yourPbt = profitOf(mine, { beforeTax: true });
  const yourNet = profitOf(mine);
  const gap = yourPbt - ye.profitBeforeTax;
  const t = totals(mine);
  const balanced = Math.abs(t.dr - t.cr) < 0.005;
  return (
    <div className="space-y-6">
      <div>
        <h2 ref={heading} tabIndex={-1} className="text-2xl font-bold">Your {ye.label.toLowerCase()} year-end</h2>
        <p className="mt-1 text-stone-600" role="status">{right} of {ye.steps.length} adjustments right.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Your profit before tax" value={money(yourPbt)} />
        <Stat label="Kōwhai's real profit before tax" value={money(ye.profitBeforeTax)} />
        <Stat label="Difference" value={Math.abs(gap) < 0.005 ? "None ✓" : signed(gap)} tone={Math.abs(gap) < 0.005 ? "good" : "bad"} />
      </div>
      <p className="text-sm text-stone-600">Profit after tax: yours {money(yourNet)}, the real one {money(ye.netProfit)}. Your trial balance {balanced ? "balances" : <strong className="text-rose-700">is out by {money(Math.abs(t.dr - t.cr))}: at least one of your entries didn&apos;t balance</strong>}.</p>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead><tr className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500"><th className="px-3 py-2">Adjustment</th><th className="px-3 py-2 text-right">Your effect on profit</th><th className="px-3 py-2 text-right">The real effect</th></tr></thead>
            <tbody>
              {ye.steps.map((s, n) => {
                const a = answers[n];
                return (
                  <tr key={s.txn.id} className="border-t border-stone-100">
                    <td className="px-3 py-2"><span className={cx("mr-1.5 font-bold", a.right ? "text-emerald-700" : "text-rose-700")}>{a.right ? "✓" : "✗"}</span><RichText text={s.q.prompt.replace(/\s*\(.*\)$/, "")} inlineOnly /></td>
                    <td className="num px-3 py-2 text-right">{signed(profitEffect(a.entered))}</td>
                    <td className="num px-3 py-2 text-right">{signed(profitEffect(s.q.lines))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Callout kind="why" title="What the adjustments did">
        Before the year-end, profit before tax looked like {money(profitOf(ye.unadjusted, { beforeTax: true }))}. The adjustments moved it to {money(ye.profitBeforeTax)}. That&apos;s why accounts aren&apos;t finished when the last invoice is entered: accruals, prepayments, depreciation and the stocktake put each cost and each dollar of income in the year it belongs to.
      </Callout>

      <div className="flex flex-wrap gap-3">
        <button onClick={onAgain} className="rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Do it again</button>
        <Link href="/cycle/adjustments" className="rounded-xl bg-stone-100 px-5 py-3 font-semibold hover:bg-stone-200">Read about adjustments</Link>
        <Link href="/study?drill=adjustment-entry" className="rounded-xl bg-stone-100 px-5 py-3 font-semibold hover:bg-stone-200">Drill single adjustments</Link>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-xl bg-kowhai-50 p-3 text-center">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={cx("num mt-1 text-lg font-bold", tone === "good" && "text-emerald-700", tone === "bad" && "text-rose-700")}>{value}</div>
    </div>
  );
}
