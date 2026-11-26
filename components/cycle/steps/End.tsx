"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ADJUSTMENTS, ALL, BEFORE_CLOSING, CLOSING, DURING_YEAR, NET_PROFIT, PROFIT_BEFORE_TAX, TAX } from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { ACCOUNTS, account } from "@/data/chartOfAccounts";
import { BUSINESS } from "@/data/business";
import { balances, equation, natural, trialBalance } from "@/lib/engine/ledger";
import { bankReconciliation } from "@/lib/engine/bankrec";
import { profitAndLoss } from "@/lib/engine/statements";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { money, nzDate, num } from "@/lib/money";
import { TYPE_STYLE, cx } from "@/lib/ui";
import { PROVISIONAL_TAX } from "@/lib/nz/rates";
import { EquationBar } from "@/components/visual/EquationBar";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { BalanceSheetView, CashFlowView, ChangesInEquityView, ProfitAndLossView, TrialBalanceTable } from "@/components/visual/Statements";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { RichText } from "@/components/learn/RichText";
import { Callout, Card, DeepDives, Tabs, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { Explain } from "@/components/learn/Overlay";
import { MemoryAid } from "@/components/learn/MemoryAid";

const UNADJ = DURING_YEAR.filter((t) => !t.foundInBankRec);
const BANK_FOUND = DURING_YEAR.filter((t) => t.foundInBankRec);

/* ───────────── 5. Unadjusted TB ───────────── */

const ERRORS = [
  { name: "Error of omission", eg: "Forgetting to enter the April power bill at all.", shows: false },
  { name: "Error of commission", eg: "Posting the power bill to Internet & phone. Right type, wrong account.", shows: false },
  { name: "Error of principle", eg: "Recording the espresso machine as Repairs (an expense) instead of an asset.", shows: false },
  { name: "Error of original entry", eg: "Keying Southern Roasters' $2,300 invoice as $3,200 on both sides.", shows: false },
  { name: "Complete reversal", eg: "Debiting Sales and crediting Bank for a cash sale.", shows: false },
  { name: "Compensating errors", eg: "Sales overstated by $100 AND rent overstated by $100.", shows: false },
  { name: "One-sided entry", eg: "Debiting Rent $3,000 but forgetting the credit to Bank.", shows: true },
  { name: "Transposition (one side)", eg: "Debit $5,470.32 but credit $5,740.32. The difference ($270) divides exactly by 9!", shows: true },
];

export function UnadjustedTBStep() {
  const tb = trialBalance(balances(UNADJ));
  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h2 className="mb-2 text-xl font-bold">Kōwhai Café Ltd: unadjusted trial balance as at 31 March 2027</h2>
        <TrialBalanceTable {...tb} />
      </div>
      <div className="space-y-4">
        <div className="prose-learn text-[16px]">
          <p>At balance date, the first check is a <Term k="trial-balance">trial balance</Term>: every account with a balance, listed in a debit or credit column. Because every entry had equal debits and credits, the columns <strong>must</strong> agree.</p>
          <p>It&apos;s called <em>unadjusted</em> because the year-end adjustments (depreciation, stock, accruals…) haven&apos;t been made yet. Look closely and you can see the problems: there&apos;s no depreciation, no inventory, insurance paid for next year is all in expenses, and there&apos;s no income tax.</p>
        </div>
        <Card>
          <h3 className="mb-2 font-bold">What a balancing TB does NOT prove</h3>
          <div className="space-y-1.5">
            {ERRORS.map((e) => (
              <div key={e.name} className="flex gap-2 text-sm">
                <span className={cx("mt-0.5 shrink-0 rounded px-1.5 text-[10px] font-bold uppercase", e.shows ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>{e.shows ? "TB catches" : "TB misses"}</span>
                <span><strong>{e.name}:</strong> {e.eg}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">If a TB doesn&apos;t balance and you can&apos;t find why, old-school bookkeepers parked the difference in a <em>suspense account</em> until it was found. Modern software won&apos;t let you post an unbalanced entry, so most errors now are the &quot;TB misses&quot; kind, which is why reviews and reconciliations matter.</p>
        </Card>
      </div>
      <MemoryAid k="cropoc" link={false} />
    </div>
  );
}

/* ───────────── 6. Bank reconciliation ───────────── */

export function BankRecStep() {
  const rec = bankReconciliation(DURING_YEAR, "2027-03-01", "2027-03-31");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const toggle = (id: string) => {
    const s = new Set(ticked);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setTicked(s);
  };
  const statementIds = new Set(rec.statementMonth.map((i) => i.txn.id));
  const bookIds = new Set(rec.cashbookMonth.map((i) => i.txn.id));
  const status = (id: string, side: "book" | "bank") => {
    if (!revealed && !ticked.has(id)) return "";
    const matched = side === "book" ? statementIds.has(id) : bookIds.has(id);
    return matched ? "matched" : side === "book" ? "books-only" : "bank-only";
  };
  const Row = ({ id, date, title, amount, side }: { id: string; date: string; title: string; amount: number; side: "book" | "bank" }) => {
    const st = status(id, side);
    return (
      <button onClick={() => toggle(id)} className={cx("grid w-full grid-cols-[3.5rem_1fr_6.5rem] gap-2 border-b border-stone-100 px-2 py-1 text-left text-xs", st === "matched" && "bg-emerald-50", st === "books-only" && "bg-kowhai-100", st === "bank-only" && "bg-rose-100")}>
        <span className="num text-stone-500">{nzDate(date, false)}</span>
        <span className="truncate" title={title}>{st === "matched" ? "✓ " : st ? "⚑ " : ""}{title}</span>
        <span className={cx("num text-right", amount < 0 && "text-rose-700")}>{num(amount)}</span>
      </button>
    );
  };
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>The bank account in the books (the <strong>cashbook</strong>) and the bank&apos;s own statement should tell the same story, but they rarely match exactly on any given day. A <Term k="bank-reconciliation">bank reconciliation</Term> ticks off every item that appears in both and explains whatever is left:</p>
        <ul>
          <li><strong>Timing differences</strong>, recorded in the books but not yet processed by the bank: a <Term k="deposit-in-transit">deposit in transit</Term> and an <Term k="unpresented-payment">unpresented payment</Term>. No entry needed.</li>
          <li><strong>Items only the bank knows about</strong>: fees, interest, direct debits, dishonoured payments. These must be <strong>entered in the books</strong>.</li>
        </ul>
        <p><strong>Try it:</strong> click lines to tick them off, or press &quot;Show me&quot;. Then look at what&apos;s left.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRevealed(true)} className="rounded-lg bg-kowhai-400 px-4 py-2 text-sm font-bold">Show me</button>
        <button onClick={() => { setRevealed(false); setTicked(new Set()); }} className="rounded-lg border border-stone-300 px-4 py-2 text-sm">Reset</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!p-0">
          <div className="border-b border-stone-200 bg-stone-50 px-3 py-2 text-sm font-bold">📒 Cashbook (account 100), March 2027</div>
          <div className="max-h-80 overflow-y-auto">
            {rec.cashbookMonth.map((i) => <Row key={i.txn.id} id={i.txn.id} date={i.bookDate} title={i.txn.title} amount={i.amount} side="book" />)}
          </div>
          <div className="flex justify-between border-t border-stone-200 px-3 py-2 text-sm font-semibold"><span>Cashbook balance 31 Mar</span><span className="num">{money(rec.cashbookClosing)}</span></div>
        </Card>
        <Card className="!p-0">
          <div className="border-b border-stone-200 bg-stone-50 px-3 py-2 text-sm font-bold">🏦 {BUSINESS.bank} statement, March 2027</div>
          <div className="max-h-80 overflow-y-auto">
            {rec.statementMonth.map((i) => <Row key={i.txn.id} id={i.txn.id} date={i.bankDate} title={i.txn.title.toUpperCase()} amount={i.amount} side="bank" />)}
          </div>
          <div className="flex justify-between border-t border-stone-200 px-3 py-2 text-sm font-semibold"><span>Statement balance 31 Mar</span><span className="num">{money(rec.statementClosing)}</span></div>
        </Card>
      </div>
      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
            <div className="doc-paper rounded-sm px-6 py-5">
              <h3 className="mb-3 text-center text-lg font-bold">Bank reconciliation statement as at 31 March 2027</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between font-semibold"><span>Balance per cashbook (before reconciling)</span><span className="num">{money(rec.cashbookClosing)}</span></div>
                {rec.bankOnly.map((i) => <div key={i.txn.id} className="flex justify-between pl-4"><span>Less: {i.txn.title} (on statement, not in books)</span><span className="num">{money(i.amount)}</span></div>)}
                <div className="flex justify-between border-t border-stone-400 pt-1 font-bold"><span>Corrected cashbook balance</span><span className="num">{money(rec.adjustedCashbook)}</span></div>
                <div className="h-3" />
                <div className="flex justify-between font-semibold"><span>Balance per bank statement</span><span className="num">{money(rec.statementClosing)}</span></div>
                {rec.depositsInTransit.map((i) => <div key={i.txn.id} className="flex justify-between pl-4"><span>Add: deposit in transit ({i.txn.title})</span><span className="num">{money(i.amount)}</span></div>)}
                {rec.unpresented.map((i) => <div key={i.txn.id} className="flex justify-between pl-4"><span>Less: unpresented payment ({i.txn.title})</span><span className="num">{money(i.amount)}</span></div>)}
                <div className="flex justify-between border-t border-stone-400 pt-1 font-bold"><span>Reconciled balance</span><span className="num">{money(rec.reconciled)}</span></div>
              </div>
              <div className={cx("mt-3 rounded px-3 py-2 text-center text-sm font-semibold", rec.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>{rec.ok ? "✓ Reconciled: both routes arrive at the same balance" : "✗ Unreconciled difference"}</div>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold">The entry the reconciliation produced</h3>
              {BANK_FOUND.map((t) => <JournalEntry key={t.id} txn={t} />)}
              <Callout kind="nz" title="Modern NZ reality">
                Software like Xero or MYOB pulls in a <strong>bank feed</strong> every day and suggests matches, so reconciling becomes a daily habit instead of a month-end chore. The thinking is exactly the same. Also: NZ banks phased out cheques in 2021, so &quot;unpresented cheques&quot; are now mostly late online payments.
              </Callout>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <MemoryAid k="bank-side" link={false} />
    </div>
  );
}

/* ───────────── 7. Adjustments ───────────── */

export function AdjustmentsStep() {
  const [i, setI] = useState(0);
  const base = [...DURING_YEAR];
  const before = useMemo(() => [...base, ...ADJUSTMENTS.slice(0, i)], [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const after = useMemo(() => [...base, ...ADJUSTMENTS.slice(0, i + 1)], [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const bB = balances(before);
  const bA = balances(after);
  const eqB = equation(bB);
  const eqA = equation(bA);
  const adj = ADJUSTMENTS[i];
  const codes = Array.from(new Set(adj.lines.map((l) => l.account)));
  const profitStart = equation(balances(DURING_YEAR)).profit;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="prose-learn text-[16px]">
          <p>During the year, the books mostly follow documents and cash. At balance date, <Term k="adjusting-entry">adjusting entries</Term> make the accounts follow the <Term k="accrual-basis">accrual principle</Term>: every dollar of income and expense ends up in the year it belongs to, and every asset and liability is stated correctly.</p>
          <p>Kōwhai needs {ADJUSTMENTS.length} adjustments. Watch the profit change with each one. Before adjustments it looks like the café made <strong>{money(profitStart, { dp: 0 })}</strong>, but the real figure is very different.</p>
        </div>
        <Card>
          <div className="mb-2 text-sm font-semibold">Profit as adjustments are made</div>
          <div className="space-y-1">
            {[{ id: "start", title: "Before adjustments", p: profitStart }, ...ADJUSTMENTS.map((a, k) => ({ id: a.id, title: a.title, p: equation(balances([...DURING_YEAR, ...ADJUSTMENTS.slice(0, k + 1)])).profit }))].map((x, k) => (
              <button key={x.id} onClick={() => k > 0 && setI(k - 1)} className={cx("flex w-full items-center gap-2 rounded px-1 text-left text-xs", k - 1 === i && "bg-kowhai-100")}>
                <span className="w-40 truncate">{x.title}</span>
                <span className="relative h-2.5 flex-1 rounded-full bg-stone-100">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: `${Math.max(0, x.p / profitStart) * 100}%` }} />
                </span>
                <span className="num w-20 text-right">{money(x.p, { dp: 0 })}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1">
        {ADJUSTMENTS.map((a, k) => (
          <button key={a.id} onClick={() => setI(k)} className={cx("rounded-lg px-2.5 py-1 text-xs font-semibold", k === i ? "bg-ink text-white" : "bg-white hover:bg-stone-100")}>{a.id}</button>
        ))}
      </div>

      <EquationBar eq={eqA} prev={eqB} />

      <AnimatePresence mode="wait">
        <motion.div key={adj.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-kowhai-700">{adj.id} · 31 March 2027</div>
              <h2 className="text-2xl font-bold">{adj.title}</h2>
            </div>
            <div className="prose-learn text-[15px]"><RichText text={adj.story} /></div>
            {adj.notes?.map((n, k) => <Callout key={k} kind="nz" title="Tax note"><RichText text={n} /></Callout>)}
            {adj.deepDives && <DeepDives links={adj.deepDives} />}
          </div>
          <div className="space-y-4">
            {adj.doc && <SourceDoc doc={adj.doc} />}
            <JournalEntry txn={adj} animate showWhy />
            <Card className="!p-3">
              <div className="mb-1 text-sm font-semibold">Effect on the accounts</div>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-stone-500"><th>Account</th><th className="text-right">Before</th><th className="text-right">After</th></tr></thead>
                <tbody>
                  {codes.map((c) => {
                    const a = account(c);
                    return (
                      <tr key={c} className="border-t border-stone-100">
                        <td className="py-1"><span className={cx("mr-1 rounded px-1 text-[10px] font-bold text-white", TYPE_STYLE[a.type].bg)}>{c}</span>{a.name}</td>
                        <td className="num py-1 text-right">{num(natural(a, bB[c]))}</td>
                        <td className="num py-1 text-right font-semibold">{num(natural(a, bA[c]))}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-stone-300 font-semibold"><td className="py-1">Profit so far</td><td className="num text-right">{num(eqB.profit)}</td><td className="num text-right">{num(eqA.profit)}</td></tr>
                </tbody>
              </table>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-between">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-30">← Previous adjustment</button>
        <button disabled={i === ADJUSTMENTS.length - 1} onClick={() => setI(i + 1)} className="rounded-lg bg-kowhai-400 px-4 py-2 text-sm font-bold disabled:opacity-30">Next adjustment →</button>
      </div>
      <MemoryAid k="accrued-prepaid" link={false} />
      <MemoryAid k="never-bank" link={false} />
    </div>
  );
}

/* ───────────── 8. Adjusted TB worksheet ───────────── */

export function AdjustedTBStep() {
  const u = balances(UNADJ);
  const adjTx = [...BANK_FOUND, ...ADJUSTMENTS];
  const a = balances(BEFORE_CLOSING);
  const ad = (code: string) => {
    let dr = 0, cr = 0;
    for (const t of adjTx) for (const l of t.lines) if (l.account === code) { dr += l.debit ?? 0; cr += l.credit ?? 0; }
    return { dr, cr };
  };
  const rows = ACCOUNTS.filter((x) => Math.abs(u[x.code]) > 0.004 || Math.abs(a[x.code]) > 0.004 || ad(x.code).dr || ad(x.code).cr);
  const col = (v: number, side: "dr" | "cr") => (side === "dr" ? (v > 0.004 ? num(v) : "") : v < -0.004 ? num(-v) : "");
  const sums = { uDr: 0, uCr: 0, aDr: 0, aCr: 0, jDr: 0, jCr: 0, pDr: 0, pCr: 0, bDr: 0, bCr: 0 };
  for (const x of rows) {
    const j = ad(x.code);
    if (u[x.code] > 0) sums.uDr += u[x.code]; else sums.uCr -= u[x.code];
    if (a[x.code] > 0) sums.aDr += a[x.code]; else sums.aCr -= a[x.code];
    sums.jDr += j.dr; sums.jCr += j.cr;
    const pl = x.type === "income" || x.type === "expense";
    if (pl) { if (a[x.code] > 0) sums.pDr += a[x.code]; else sums.pCr -= a[x.code]; }
    else { if (a[x.code] > 0) sums.bDr += a[x.code]; else sums.bCr -= a[x.code]; }
  }
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Accountants used to do this on a big sheet of paper called the <strong>worksheet</strong>. It&apos;s still the clearest way to see the whole year-end process on one page: start with the unadjusted trial balance, add the adjustments, and get the adjusted trial balance. Then each balance is carried across to either the <strong>profit &amp; loss</strong> columns (income and expenses) or the <strong>balance sheet</strong> columns (everything else).</p>
        <p>The P&amp;L columns don&apos;t balance on their own. The difference <em>is</em> the net profit, and the same figure balances the balance-sheet columns. That&apos;s the link between the two main statements.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-300 bg-white">
        <table className="w-full min-w-[1100px] text-xs">
          <thead>
            <tr className="bg-stone-100 text-center font-semibold">
              <th className="px-2 py-1 text-left" rowSpan={2}>Account</th>
              <th colSpan={2} className="border-l border-stone-300">Unadjusted TB</th>
              <th colSpan={2} className="border-l border-stone-300 bg-kowhai-100">Adjustments</th>
              <th colSpan={2} className="border-l border-stone-300">Adjusted TB</th>
              <th colSpan={2} className="border-l border-stone-300 bg-emerald-50">Profit &amp; loss</th>
              <th colSpan={2} className="border-l border-stone-300 bg-sky-50">Balance sheet</th>
            </tr>
            <tr className="bg-stone-50 text-right text-[10px] uppercase tracking-wider text-stone-500">
              {Array.from({ length: 5 }).flatMap((_, k) => [<th key={`d${k}`} className="border-l border-stone-300 px-2 py-1">Dr</th>, <th key={`c${k}`} className="px-2 py-1">Cr</th>])}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const j = ad(x.code);
              const pl = x.type === "income" || x.type === "expense";
              return (
                <tr key={x.code} className={cx("border-t border-stone-100", (j.dr || j.cr) && "bg-kowhai-50/60")}>
                  <td className="whitespace-nowrap px-2 py-0.5"><span className={cx("mr-1 rounded px-1 text-[10px] font-bold text-white", TYPE_STYLE[x.type].bg)}>{x.code}</span>{x.name}</td>
                  <td className="num border-l border-stone-200 px-2 text-right">{col(u[x.code], "dr")}</td>
                  <td className="num px-2 text-right">{col(u[x.code], "cr")}</td>
                  <td className="num border-l border-stone-200 px-2 text-right font-semibold text-kowhai-700">{j.dr ? num(j.dr) : ""}</td>
                  <td className="num px-2 text-right font-semibold text-kowhai-700">{j.cr ? num(j.cr) : ""}</td>
                  <td className="num border-l border-stone-200 px-2 text-right">{col(a[x.code], "dr")}</td>
                  <td className="num px-2 text-right">{col(a[x.code], "cr")}</td>
                  <td className="num border-l border-stone-200 px-2 text-right">{pl ? col(a[x.code], "dr") : ""}</td>
                  <td className="num px-2 text-right">{pl ? col(a[x.code], "cr") : ""}</td>
                  <td className="num border-l border-stone-200 px-2 text-right">{!pl ? col(a[x.code], "dr") : ""}</td>
                  <td className="num px-2 text-right">{!pl ? col(a[x.code], "cr") : ""}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-stone-500 font-bold">
              <td className="px-2 py-1">Totals</td>
              {[sums.uDr, sums.uCr, sums.jDr, sums.jCr, sums.aDr, sums.aCr, sums.pDr, sums.pCr, sums.bDr, sums.bCr].map((v, k) => <td key={k} className={cx("num px-2 text-right", k % 2 === 0 && "border-l border-stone-200")}>{num(v)}</td>)}
            </tr>
            <tr className="font-bold text-emerald-800">
              <td className="px-2 py-1">Net profit after tax</td>
              <td colSpan={6} />
              <td className="num border-l border-stone-200 px-2 text-right">{num(NET_PROFIT)}</td>
              <td />
              <td className="border-l border-stone-200" />
              <td className="num px-2 text-right">{num(NET_PROFIT)}</td>
            </tr>
            <tr className="border-b-4 border-double border-stone-500 font-bold">
              <td className="px-2 py-1">Balanced</td>
              <td colSpan={6} />
              <td className="num border-l border-stone-200 px-2 text-right">{num(sums.pDr + NET_PROFIT)}</td>
              <td className="num px-2 text-right">{num(sums.pCr)}</td>
              <td className="num border-l border-stone-200 px-2 text-right">{num(sums.bDr)}</td>
              <td className="num px-2 text-right">{num(sums.bCr + NET_PROFIT)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Callout kind="why" title="Why does the net profit balance both sides?">
        Profit hasn&apos;t been moved into equity yet. In the balance sheet columns, equity is &quot;short&quot; by exactly the profit, and in the P&amp;L columns income exceeds expenses by exactly the profit. Adding it to both is what the closing entries (step 10) will do for real.
      </Callout>
    </div>
  );
}

/* ───────────── 9. Statements ───────────── */

export function StatementsStep() {
  const [tab, setTab] = useState<"pl" | "bs" | "eq" | "cf" | "tax" | "notes" | "links">("pl");
  const b = balances(BEFORE_CLOSING);
  const pl = profitAndLoss(b);
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>The adjusted trial balance is rearranged into the <Term k="financial-statements">financial statements</Term>. NZ small companies prepare <strong>special-purpose financial statements</strong> that meet IRD&apos;s minimum requirements (Tax Administration (Financial Statements) Order 2014). Banks also ask for them before lending.</p>
        <UsNote>
          <p>Same statements, different names: the US <strong>income statement</strong> is NZ&apos;s <strong>statement of financial performance</strong> (or P&amp;L); the <strong>balance sheet</strong> is formally the <strong>statement of financial position</strong>; the <strong>statement of retained earnings / stockholders&apos; equity</strong> is the <strong>statement of changes in equity</strong>. The cash flow statement keeps its name.</p>
          <p>One rule difference you&apos;ll see here: US GAAP always puts interest paid under operating activities, while NZ IFRS lets you choose operating or financing (Kōwhai uses operating).</p>
        </UsNote>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "links", label: "How they link" },
          { id: "pl", label: "Profit & loss" },
          { id: "bs", label: "Balance sheet" },
          { id: "eq", label: "Changes in equity" },
          { id: "cf", label: "Cash flow" },
          { id: "tax", label: "Tax reconciliation" },
          { id: "notes", label: "Notes" },
        ]}
      />
      {tab === "pl" && (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <ProfitAndLossView b={b} />
          <div className="space-y-3">
            <Callout kind="why" title="Reading the P&L">The <Term k="profit-and-loss">P&amp;L</Term> covers a <strong>period</strong> (the whole year). It answers: did the café make money? Gross margin of {(pl.grossMargin * 100).toFixed(1)}% means about {Math.round(pl.grossMargin * 100)}c of every sales dollar is left after paying for the coffee, food and cups.</Callout>
            <Callout kind="warn" title="Shareholder salaries">The café&apos;s profit is after paying Aroha and Ben $90,000 in shareholder salaries. Without them, profit would look much higher, but they&apos;d have worked for free.</Callout>
          </div>
        </div>
      )}
      {tab === "bs" && (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <BalanceSheetView b={b} />
          <div className="space-y-3">
            <Callout kind="why" title="Reading the balance sheet">The <Term k="balance-sheet">balance sheet</Term> is a <strong>snapshot</strong> on one date. Current items are due or usable within 12 months. The loan is split: the principal due in the next 12 months is current, and the rest is non-current.</Callout>
            <Callout kind="tip" title="Working capital">Current assets − current liabilities = <Term k="working-capital">working capital</Term>. A positive figure means the café can pay its short-term bills.</Callout>
            <Callout kind="nz" title="Accumulated depreciation">Fixed assets show cost, less accumulated depreciation, giving <Term k="book-value">book value</Term>.</Callout>
          </div>
        </div>
      )}
      {tab === "eq" && <ChangesInEquityView b={b} profitAfterTax={NET_PROFIT} />}
      {tab === "cf" && <CashFlowView txns={BEFORE_CLOSING} b={b} />}
      {tab === "tax" && <TaxRecView />}
      {tab === "notes" && <NotesView />}
      {tab === "links" && <LinksView />}
      <MemoryAid k="movie-photo" link={false} />
      <MemoryAid k="profit-cash" />
      <MemoryAid k="current-12" link={false} />
    </div>
  );
}

export function TaxRecView({ year = 1 }: { year?: 1 | 2 }) {
  const y2 = year === 2;
  const tax = y2 ? Y2.TAX : TAX;
  const pbt = y2 ? Y2.PROFIT_BEFORE_TAX : PROFIT_BEFORE_TAX;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="doc-paper rounded-sm px-6 py-5">
        <h3 className="mb-3 text-center text-lg font-bold">Income tax reconciliation: {y2 ? "2028" : "2027"} income year (IR4)</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between font-semibold"><span>Net profit before tax (per accounts)</span><span className="num">{money(pbt)}</span></div>
          {tax.items.map((i) => (
            <div key={i.label} className="flex items-start justify-between gap-3 pl-4">
              <span>
                {i.label}{" "}
                <Explain title={i.label} label="why?" className="text-xs text-kowhai-700 underline">
                  <p>{i.explain}</p>
                </Explain>
              </span>
              <span className="num">{money(i.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-stone-400 pt-1 font-bold"><span>Taxable income</span><span className="num">{money(tax.taxableIncome)}</span></div>
          <div className="flex justify-between font-semibold"><span>Tax at 28%</span><span className="num">{money(tax.tax)}</span></div>
          {!y2 && <div className="flex justify-between pl-4"><span>Less RWT deducted by the bank</span><span className="num">{money(-tax.rwt)}</span></div>}
          <div className="flex justify-between border-t border-stone-300 pt-1"><span>Residual income tax (RIT)</span><span className="num">{money(tax.residual)}</span></div>
          <div className="flex justify-between pl-4"><span>{y2 ? "Less provisional tax (3 instalments: 2 paid, 1 due 7 May 2028)" : "Less provisional tax paid"}</span><span className="num">{money(-tax.provisional)}</span></div>
          <div className="flex justify-between border-b-4 border-double border-stone-500 pt-1 font-bold"><span>{tax.terminal >= 0 ? "Terminal tax to pay" : "Refund due"} (due 7 April {y2 ? "2029" : "2028"})</span><span className="num">{money(Math.abs(tax.terminal))}</span></div>
        </div>
      </div>
      <div className="space-y-3">
        <Callout kind="why" title="Why taxable income ≠ accounting profit">Accounting rules aim to show the true economic result. Tax rules carry policy choices: limit entertainment, encourage investment (Investment Boost), only allow holiday pay that&apos;s actually paid soon. So there&apos;s always a reconciliation.</Callout>
        <Card>
          <div className="mb-2 text-sm font-semibold">Accounting vs tax depreciation, asset by asset</div>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-stone-500"><th>Asset</th><th className="text-right">Cost</th><th className="text-right">Acctg dep</th><th className="text-right">Boost</th><th className="text-right">Tax dep</th></tr></thead>
            <tbody>
              {tax.assets.map((x) => (
                <tr key={x.asset.id} className="border-t border-stone-100">
                  <td className="py-1">{x.asset.name}{"note" in x && x.note && <span className="block text-[10px] text-stone-500">{x.note}</span>}</td>
                  <td className="num text-right">{num(x.asset.cost)}</td>
                  <td className="num text-right">{num(x.accounting)}</td>
                  <td className="num text-right">{num(x.boost)}</td>
                  <td className="num text-right">{num(x.taxDep)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {y2 ? (
          <Callout kind="nz" title="Provisional tax: the safe harbour">This year&apos;s tax was worked out on last year&apos;s RIT + 5% ({money(Y2.PROVISIONAL.total, { dp: 0 })}). The real tax turned out {money(Y2.TAX.residual - Y2.PROVISIONAL.total, { dp: 0 })} higher. Because RIT is under {money(PROVISIONAL_TAX.safeHarbourRit, { dp: 0 })} and every instalment was paid on time, there&apos;s no <Term k="uomi">use-of-money interest</Term>: the difference is simply paid as terminal tax.</Callout>
        ) : (
          <Callout kind="nz" title="Next year: provisional tax">RIT is {money(TAX.residual, { dp: 0 })}, which is over the {money(PROVISIONAL_TAX.ritThreshold, { dp: 0 })} threshold. So for the 2028 year the company becomes a <Term k="provisional-tax">provisional taxpayer</Term>. Standard method: {money(TAX.residual * 1.05, { dp: 0 })} (RIT + 5%) in 3 instalments.</Callout>
        )}
      </div>
    </div>
  );
}

function NotesView() {
  const notes = [
    ["Reporting entity", `${BUSINESS.name} is a company registered under the Companies Act 1993. These are special-purpose financial statements prepared for tax purposes and for the shareholders and bank. They meet the minimum requirements of the Tax Administration (Financial Statements) Order 2014.`],
    ["Measurement basis", "Accrual basis and historical cost, on the assumption that the business is a going concern."],
    ["GST", "All amounts are shown excluding GST, except debtors and creditors, which include GST."],
    ["Property, plant & equipment", "Recorded at cost less accumulated depreciation. Depreciation uses Inland Revenue's diminishing value rates. Assets costing $1,000 or less are expensed."],
    ["Inventory", "Valued at the lower of cost and net realisable value, using a first-in first-out basis, from a physical stocktake at balance date."],
    ["Income tax", "The income tax expense is the tax payable on taxable income for the year. Deferred tax is not recognised (permitted for special-purpose statements)."],
    ["Bank loan", `$50,000 from ${BUSINESS.bank}, 8.5% fixed, 60 monthly repayments, secured by a general security agreement and directors' personal guarantees.`],
    ["Related parties", "Shareholders Aroha Ngata (60%) and Ben Fraser (40%) are directors. Shareholder salaries of $60,000 and $30,000 were paid via current accounts. Current accounts are unsecured, interest-free and repayable on demand."],
    ["Commitments", "Lease of premises for 6 years from 1 April 2026 at $36,000 + GST a year."],
    ["Events after balance date", "A wedding catering job (deposit received) was completed on 17 April 2027."],
  ];
  return (
    <div className="doc-paper mx-auto max-w-3xl rounded-sm px-8 py-6">
      <h3 className="mb-4 text-center text-lg font-bold">Notes to the financial statements</h3>
      <ol className="list-decimal space-y-3 pl-5 text-sm">
        {notes.map(([t, d]) => <li key={t}><strong>{t}.</strong> {d}</li>)}
      </ol>
    </div>
  );
}

function LinksView() {
  const b = balances(BEFORE_CLOSING);
  const pl = profitAndLoss(b);
  const box = "rounded-xl border-2 p-4 text-center";
  return (
    <div className="space-y-4">
      <div className="grid items-center gap-4 md:grid-cols-3">
        <div className={cx(box, "border-emerald-400 bg-emerald-50")}>
          <div className="text-xs font-semibold uppercase text-emerald-700">Profit & loss</div>
          <div className="text-sm">Income − expenses for the year</div>
          <div className="num mt-1 text-xl font-bold">{money(pl.profitAfterTax, { dp: 0 })}</div>
        </div>
        <div className="text-center text-sm text-stone-500">profit flows into equity →</div>
        <div className={cx(box, "border-violet-400 bg-violet-50")}>
          <div className="text-xs font-semibold uppercase text-violet-700">Changes in equity</div>
          <div className="text-sm">Opening equity + shares + profit − dividends</div>
          <div className="num mt-1 text-xl font-bold">{money(100_000 + pl.profitAfterTax, { dp: 0 })}</div>
        </div>
        <div className={cx(box, "border-sky-400 bg-sky-50")}>
          <div className="text-xs font-semibold uppercase text-sky-700">Cash flow</div>
          <div className="text-sm">Explains the change in cash</div>
          <div className="num mt-1 text-xl font-bold">{money(b["100"] + b["105"], { dp: 0 })}</div>
        </div>
        <div className="text-center text-sm text-stone-500">← closing cash = cash on the balance sheet<br />closing equity = equity on the balance sheet ↓</div>
        <div className={cx(box, "border-ink bg-white")}>
          <div className="text-xs font-semibold uppercase">Balance sheet</div>
          <div className="text-sm">Assets − liabilities = equity</div>
          <div className="num mt-1 text-xl font-bold">{money(equation(b).equity, { dp: 0 })}</div>
        </div>
      </div>
      <Callout kind="why" title="One set of numbers, four views">Every statement is built from the same adjusted trial balance. The P&amp;L explains the change in retained earnings. The cash flow explains the change in the bank. The balance sheet shows where everything ended up.</Callout>
    </div>
  );
}

/* ───────────── 10. Closing ───────────── */

export function ClosingStep() {
  const [stage, setStage] = useState(0); // 0 = before, 1..3 = after CL01..CL03
  const txns = [...BEFORE_CLOSING, ...CLOSING.slice(0, stage)];
  const b = balances(txns);
  const temp = ACCOUNTS.filter((a) => a.type === "income" || a.type === "expense" || a.code === "320");
  const shown = temp.filter((a) => Math.abs(balances(BEFORE_CLOSING)[a.code]) > 0.004 || a.code === "320");
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Income and expense accounts measure <strong>one year</strong>. Next year&apos;s sales must start from $0, otherwise you couldn&apos;t tell this year&apos;s performance from next year&apos;s. So at year end they&apos;re <Term k="closing-entries">closed</Term>: each is emptied into the <Term k="income-summary">income summary</Term>, and the profit moves to <Term k="retained-earnings">retained earnings</Term>.</p>
        <p>Balance-sheet accounts are <strong>permanent</strong>. The café still has the bank balance, the loan and the equipment on 1 April, so they carry forward.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Before closing", "CL01: close income", "CL02: close expenses", "CL03: profit → retained earnings"].map((l, k) => (
          <button key={l} onClick={() => setStage(k)} className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", stage === k ? "bg-ink text-white" : "bg-white hover:bg-stone-100")}>{l}</button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-2">
            {shown.map((a) => {
              const v = natural(a, b[a.code]);
              return (
                <motion.div key={a.code} layout className={cx("flex justify-between rounded px-2 py-1 text-xs", a.code === "320" ? "col-span-2 border-2 border-violet-400 bg-violet-50 font-semibold" : TYPE_STYLE[a.type].soft)}>
                  <span className="truncate">{a.code} {a.name}</span>
                  <motion.span key={v} initial={{ scale: 1.4, color: "#b44d12" }} animate={{ scale: 1, color: "#1c2330" }} className="num">{num(a.code === "320" ? -b[a.code] : v)}</motion.span>
                </motion.div>
              );
            })}
            <div className="col-span-2 mt-2 flex justify-between rounded border-2 border-violet-600 px-2 py-1.5 text-sm font-bold">
              <span>310 Retained earnings</span>
              <span className="num">{num(-b["310"])}</span>
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          {stage === 0 ? (
            <Callout kind="why" title="Ready to close">Press the buttons in order and watch the income (green) and expense (amber) accounts drop to zero.</Callout>
          ) : (
            <>
              <div className="prose-learn text-[15px]"><RichText text={CLOSING[stage - 1].story} /></div>
              <JournalEntry txn={CLOSING[stage - 1]} animate />
            </>
          )}
        </div>
      </div>
      <MemoryAid k="trip-meter" link={false} />
    </div>
  );
}

/* ───────────── 11. Post-closing ───────────── */

export function PostClosingStep() {
  const tb = trialBalance(balances(ALL));
  const p6 = gstReturn(ALL, GST_PERIODS[5]);
  const b = balances(ALL);
  const after = [
    { d: "2027-04-01", t: "Optional reversing entries for accruals (power, wages, accrued income), so April's actual bills aren't double-counted." },
    { d: "2027-04-07", t: `Pay accrued wages for 23 March – 5 April. The accrued wages liability (${money(-b["206"])}) is cleared.` },
    { d: "2027-04-20", t: `Pay March PAYE & deductions (${money(-b["215"])}) and March supplier invoices (${money(-b["200"])}).` },
    { d: "2027-05-07", t: `File the Feb–Mar GST return (includes the bad debt and entertainment adjustments): pay ${money(p6.box15)}.` },
    { d: "2027-05-31", t: "Companies Office annual return (in the company's registration month) and update the share register." },
    { d: "2027-07-07", t: "Aroha & Ben's personal IR3 returns, including shareholder salaries (or later via their tax agent)." },
    { d: "2027-08-28", t: `1st provisional tax instalment for the 2028 year (standard method ≈ ${money((TAX.residual * 1.05) / 3, { dp: 0 })}).` },
    { d: "2027-09-01", t: "ACC invoices the company's work levy, based on wages and shareholder salaries." },
    { d: "2028-03-31", t: "IR4 company tax return due (with the tax agent's extension of time)." },
    { d: "2028-04-07", t: `Terminal tax for the 2027 year due: ${money(TAX.terminal)}.` },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <h2 className="mb-2 text-xl font-bold">Post-closing trial balance as at 31 March 2027</h2>
        <TrialBalanceTable {...tb} />
        <p className="mt-2 text-sm text-stone-600">Only <strong>permanent</strong> (balance sheet) accounts remain. These become the <strong>opening balances</strong> on 1 April 2027. Retained earnings now holds this year&apos;s profit of {money(NET_PROFIT)}.</p>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">After balance date: the NZ to-do list</h2>
        <ol className="relative space-y-3 border-l-2 border-kowhai-400 pl-5">
          {after.map((x) => (
            <li key={x.d} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-kowhai-500" />
              <div className="num text-xs font-semibold text-kowhai-700">{nzDate(x.d)}</div>
              <div className="text-sm">{x.t}</div>
            </li>
          ))}
        </ol>
        <Callout kind="tip" title="Should the company pay a dividend?">
          The company has a lot of cash and {money(NET_PROFIT, { dp: 0 })} of retained earnings. It could pay a <Term k="dividend">dividend</Term> with <Term k="imputation-credit">imputation credits</Term> attached for the tax it has paid. Or Aroha and Ben could withdraw the credit balances in their current accounts tax-free (that income has already been taxed as salary). <Link className="underline" href="/nz/shareholders">See shareholders &amp; dividends →</Link>
        </Callout>
        <Callout kind="why" title="And then…">On 1 April 2027 the cycle starts again at step 1, with opening balances instead of zeros.</Callout>
      </div>
    </div>
  );
}
