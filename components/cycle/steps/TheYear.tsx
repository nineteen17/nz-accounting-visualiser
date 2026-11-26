"use client";

import { useMemo, useState } from "react";
import { DURING_YEAR } from "@/data/books";
import { PAY_RUNS } from "@/data/books/year";
import type { Transaction } from "@/lib/engine/types";
import { balances, equation } from "@/lib/engine/ledger";
import { GST_PERIODS } from "@/lib/engine/gst";
import { money, monthName, nzDate } from "@/lib/money";
import { cx } from "@/lib/ui";
import { EquationBar } from "@/components/visual/EquationBar";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { RichText } from "@/components/learn/RichText";
import { useOverlay } from "@/components/learn/Overlay";
import { Callout, Card } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { monthsBetween, lastDay, day, nextMonth } from "@/data/books/helpers";

const MONTHS = monthsBetween("2026-04", "2027-03");

export function TxnDetail({ t }: { t: Transaction }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-stone-500">{nzDate(t.date)} · {t.id}</div>
      <RichText text={t.story} />
      {t.doc && <SourceDoc doc={t.doc} />}
      <JournalEntry txn={t} showWhy />
      {t.notes?.map((n, i) => <Callout key={i} kind="why" title="Note"><RichText text={n} /></Callout>)}
    </div>
  );
}

function complianceFor(ym: string) {
  const ev: { date: string; label: string; kind: "pay" | "gst" | "paye" | "tax" }[] = [];
  for (const r of PAY_RUNS) if (r.date.startsWith(ym)) ev.push({ date: r.date, label: "Payday: pay staff & file employment information with IRD (within 2 working days)", kind: "pay" });
  const payeDue = day(ym, 20);
  if (MONTHS.includes(ym) && ym !== "2026-04") ev.push({ date: payeDue, label: `PAYE & deductions from ${monthName(`${MONTHS[MONTHS.indexOf(ym) - 1]}-01`)} pay runs due to IRD`, kind: "paye" });
  for (const p of GST_PERIODS) {
    if (p.to.startsWith(ym)) ev.push({ date: p.to, label: `GST period ends (${p.label}) – return due ${nzDate(p.due)}`, kind: "gst" });
    if (p.due.startsWith(ym)) ev.push({ date: p.due, label: `GST return & payment due (${p.label})`, kind: "gst" });
  }
  if (ym === "2026-08") ev.push({ date: "2026-08-28", label: "1st provisional tax instalment date (not required in the company's first year)", kind: "tax" });
  if (ym === "2027-01") ev.push({ date: "2027-01-15", label: "2nd provisional tax instalment date: the café pays $3,000 voluntarily", kind: "tax" });
  if (ym === "2027-03") ev.push({ date: "2027-03-31", label: "BALANCE DATE: year end. Stocktake tonight!", kind: "tax" });
  return ev.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function TheYear() {
  const [ym, setYm] = useState("2026-04");
  const [showRoutine, setShowRoutine] = useState(true);
  const { openCustom } = useOverlay();

  const stats = useMemo(
    () =>
      MONTHS.map((m) => {
        const inMonth = DURING_YEAR.filter((t) => t.date.startsWith(m));
        const b = balances(inMonth);
        const sales = -(b["400"] + b["410"]);
        const eq = equation(balances(DURING_YEAR.filter((t) => t.date <= lastDay(m))));
        const bank = balances(DURING_YEAR.filter((t) => t.date <= lastDay(m)))["100"];
        const e = equation(b);
        return { m, inMonth, sales, profit: e.profit, eq, bank, count: inMonth.length };
      }),
    [],
  );
  const cur = stats.find((s) => s.m === ym)!;
  const prevEq = stats[MONTHS.indexOf(ym) - 1]?.eq;
  const maxSales = Math.max(...stats.map((s) => s.sales));
  const maxBank = Math.max(...stats.map((s) => s.bank));
  const list = cur.inMonth.filter((t) => showRoutine || t.kind === "featured");
  const events = complianceFor(ym);

  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Steps 1–4 aren&apos;t done once. They&apos;re done for <strong>every</strong> transaction, all year. Kōwhai Café records {DURING_YEAR.length} journal entries between 1 April 2026 and 31 March 2027. Most are <em>routine</em>: monthly sales summaries, supplier invoices, pay runs, rent, loan repayments. A few are <em>new situations</em> worth studying (marked ★).</p>
        <p>Alongside the bookkeeping runs the <strong>NZ compliance calendar</strong>: <Term k="payday-filing">payday filing</Term> every pay run, <Term k="paye">PAYE</Term> by the 20th, and a <Term k="gst-return">GST return</Term> every two months.</p>
      </div>

      {/* month charts: sales (bars) and bank balance (bars) – two separate single-series charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm font-semibold">Monthly sales (café + catering, excl GST)</div>
          <div className="flex h-36 items-end gap-1.5">
            {stats.map((s) => (
              <button key={s.m} onClick={() => setYm(s.m)} className="group relative flex h-full flex-1 flex-col justify-end" aria-label={`${s.m} sales ${money(s.sales, { dp: 0 })}`}>
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">{monthName(`${s.m}-01`)}: {money(s.sales, { dp: 0 })}</span>
                <span className={cx("block rounded-t-[4px] transition", s.m === ym ? "bg-emerald-700" : "bg-emerald-500/70 group-hover:bg-emerald-600")} style={{ height: `${(s.sales / maxSales) * 100}%` }} />
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5 text-center text-[10px] text-stone-500">{stats.map((s) => <span key={s.m} className="flex-1">{monthName(`${s.m}-01`)}</span>)}</div>
        </Card>
        <Card>
          <div className="mb-2 text-sm font-semibold">Bank balance at month end</div>
          <div className="flex h-36 items-end gap-1.5">
            {stats.map((s) => (
              <button key={s.m} onClick={() => setYm(s.m)} className="group relative flex h-full flex-1 flex-col justify-end" aria-label={`${s.m} bank ${money(s.bank, { dp: 0 })}`}>
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">{monthName(`${s.m}-01`)}: {money(s.bank, { dp: 0 })}</span>
                <span className={cx("block rounded-t-[4px] transition", s.m === ym ? "bg-sky-700" : "bg-sky-500/70 group-hover:bg-sky-600")} style={{ height: `${(s.bank / maxBank) * 100}%` }} />
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5 text-center text-[10px] text-stone-500">{stats.map((s) => <span key={s.m} className="flex-1">{monthName(`${s.m}-01`)}</span>)}</div>
        </Card>
      </div>

      {/* month picker */}
      <div className="flex flex-wrap gap-1">
        {stats.map((s) => (
          <button key={s.m} onClick={() => setYm(s.m)} className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", s.m === ym ? "bg-ink text-white" : "bg-white text-stone-700 hover:bg-stone-100")}>
            {monthName(`${s.m}-01`)} {s.m.slice(2, 4)}
          </button>
        ))}
      </div>

      <EquationBar eq={cur.eq} prev={prevEq} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Journal entries in {monthName(`${ym}-01`)} ({cur.count})</h3>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" checked={showRoutine} onChange={(e) => setShowRoutine(e.target.checked)} /> show routine
            </label>
          </div>
          <div className="divide-y divide-stone-100">
            {list.map((t) => (
              <button key={t.id} onClick={() => openCustom(t.title, <TxnDetail t={t} />)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-kowhai-50">
                <span className="num w-14 shrink-0 text-xs text-stone-500">{nzDate(t.date, false)}</span>
                <span className="flex-1 text-sm">
                  {t.kind === "featured" && <span className="mr-1 text-kowhai-600">★</span>}
                  {t.title}
                </span>
                <span className="text-xs text-stone-400">view →</span>
              </button>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 text-lg font-bold">🇳🇿 Compliance calendar</h3>
            {events.length === 0 && <p className="text-sm text-stone-500">Nothing due this month.</p>}
            <ul className="space-y-2">
              {events.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="num w-14 shrink-0 text-xs text-stone-500">{nzDate(e.date, false)}</span>
                  <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", e.kind === "pay" ? "bg-violet-500" : e.kind === "gst" ? "bg-emerald-500" : e.kind === "paye" ? "bg-sky-500" : "bg-rose-500")} />
                  <span>{e.label}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="mb-2 text-lg font-bold">{monthName(`${ym}-01`)} in numbers</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt>Sales (excl GST)</dt><dd className="num">{money(cur.sales)}</dd></div>
              <div className="flex justify-between"><dt>Profit this month*</dt><dd className="num">{money(cur.profit)}</dd></div>
              <div className="flex justify-between"><dt>Bank at month end</dt><dd className="num">{money(cur.bank)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-stone-500">*Before year-end adjustments (depreciation, stock, shareholder salaries…), so monthly profit is overstated. That&apos;s why adjustments matter.</p>
          </Card>
        </div>
      </div>
      <Callout kind="tip" title="Why is the bank growing so fast?">
        Partly because Aroha and Ben only take $5,500 a month in drawings, but mainly because some costs aren&apos;t paid yet: GST for Feb–Mar is due {nzDate(nextMonth("2027-04") + "-07")}, March PAYE and suppliers are paid in April, and income tax isn&apos;t due until 2028. Cash is not profit. The cash flow statement in step 9 explains the difference.
      </Callout>
    </div>
  );
}
