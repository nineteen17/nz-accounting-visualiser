"use client";

import { useState } from "react";
import { APRIL_FEATURED, DURING_YEAR } from "@/data/books";
import { Walkthrough } from "@/components/cycle/Walkthrough";
import { Callout, Card } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { TAccount } from "@/components/visual/TAccount";
import { ledger, parties } from "@/lib/engine/ledger";
import { money, nzDate, num } from "@/lib/money";
import { cx } from "@/lib/ui";
import { MemoryAid } from "@/components/learn/MemoryAid";

const EVENTS = [
  { e: "Aroha signs a 6-year lease and pays a $6,000 bond", yes: true, why: "Money leaves the bank and the café gains a refundable bond (an asset)." },
  { e: "A customer phones to ask if the café does gluten-free scones", yes: false, why: "Nothing measurable has changed." },
  { e: "Southern Roasters delivers 50 kg of beans with an invoice", yes: true, why: "The café now has stock costs and owes the supplier." },
  { e: "Aroha hires Mia, starting next week", yes: false, why: "A contract was signed, but no work has been done and no pay is owed yet." },
  { e: "The bank deducts its $25 monthly fee", yes: true, why: "The bank balance drops and there's an expense, even with no invoice." },
  { e: "A competitor opens across the road", yes: false, why: "Important for the business, but not a financial transaction." },
  { e: "Ben takes $2,000 for personal living costs", yes: true, why: "Drawings: money leaves the company for a shareholder." },
  { e: "The espresso machine is now worth less than a year ago", yes: true, why: "Wear and tear is recorded as depreciation at year end (an internal transaction)." },
];

function SortExercise() {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  return (
    <Card>
      <h3 className="mb-1 text-lg font-bold">Try it: transaction or not?</h3>
      <p className="mb-3 text-sm text-stone-600">A transaction must change the business&apos;s financial position and be measurable in dollars.</p>
      <div className="space-y-2">
        {EVENTS.map((x, i) => {
          const a = ans[i];
          const answered = a !== undefined;
          return (
            <div key={i} className={cx("rounded-lg border px-3 py-2", !answered ? "border-stone-200" : a === x.yes ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex-1 text-sm">{x.e}</span>
                <button onClick={() => setAns({ ...ans, [i]: true })} className="rounded border border-stone-300 bg-white px-2 py-0.5 text-xs hover:bg-stone-100">Transaction</button>
                <button onClick={() => setAns({ ...ans, [i]: false })} className="rounded border border-stone-300 bg-white px-2 py-0.5 text-xs hover:bg-stone-100">Not a transaction</button>
              </div>
              {answered && <div className="mt-1 text-xs">{a === x.yes ? "✓ " : "✗ "}{x.why}</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function IdentifyStep() {
  const gallery = ["A12", "A17", "A20", "A21", "A18", "A29"].map((id) => DURING_YEAR.find((t) => t.id === id)!);
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>Accounting starts with one question: <strong>did something happen that changed the business&apos;s money position?</strong> If yes, it&apos;s a <Term k="transaction">transaction</Term>, and it must be recorded.</p>
          <p>Every transaction needs evidence: a <Term k="source-document">source document</Term>. Without one, you can&apos;t prove the entry to IRD, an auditor or yourself in six months&apos; time.</p>
          <h3>What a source document tells you</h3>
          <ul>
            <li><strong>Date</strong>: which period the transaction belongs to</li>
            <li><strong>Who</strong>: the supplier, customer or employee</li>
            <li><strong>What</strong>: goods, a service, an asset, a loan…</li>
            <li><strong>How much</strong>, and how much of that is <Term k="gst">GST</Term></li>
            <li><strong>Paid or on credit</strong>: does money move now or later?</li>
          </ul>
          <Callout kind="nz" title="NZ record-keeping law">
            Businesses must keep records for <strong>7 years</strong> (Tax Administration Act), in English or te reo Māori, and they can be electronic. GST claims also need the right <Term k="taxable-supply-information">taxable supply information</Term>.
          </Callout>
        </div>
        <SortExercise />
      </div>
      <div>
        <h2 className="mb-3 text-2xl font-bold">The café&apos;s source documents</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {gallery.map((t) => (
            <div key={t.id}>
              <div className="mb-1 text-sm font-semibold">{t.id} · {t.title}</div>
              <div className="origin-top scale-[0.92]">{t.doc && <SourceDoc doc={t.doc} />}</div>
            </div>
          ))}
        </div>
      </div>
      <section>
        <h2 className="mb-1 text-2xl font-bold">Step through April, one transaction at a time</h2>
        <p className="mb-4 text-stone-600">Kōwhai Café&apos;s first month, with {APRIL_FEATURED.length} transactions. Each one goes through Identify → Analyse → Journalise → Post. Start with the document.</p>
        <Walkthrough txns={APRIL_FEATURED} initialPhase={0} />
      </section>
    </div>
  );
}

export function AnalyseStep() {
  const rows = [
    { t: "Asset", c: "text-sky-700", up: "Debit", down: "Credit", eg: "Bank, stock, equipment, debtors" },
    { t: "Expense", c: "text-amber-700", up: "Debit", down: "Credit", eg: "Wages, rent, purchases, depreciation" },
    { t: "Liability", c: "text-rose-700", up: "Credit", down: "Debit", eg: "Loan, creditors, GST & PAYE owed" },
    { t: "Equity", c: "text-violet-700", up: "Credit", down: "Debit", eg: "Share capital, retained earnings" },
    { t: "Income", c: "text-emerald-700", up: "Credit", down: "Debit", eg: "Sales, catering, interest" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>Before writing anything down, work out what the transaction does to the accounts. Ask four questions, every time:</p>
          <ol>
            <li><strong>Which accounts</strong> are affected? (at least two)</li>
            <li><strong>What type</strong> is each one: asset, liability, equity, income or expense?</li>
            <li>Does each one go <strong>up or down</strong>?</li>
            <li>So is each one a <strong><Term k="debit">debit</Term> or a <Term k="credit">credit</Term></strong>?</li>
          </ol>
          <p>Question 4 follows automatically from 2 and 3, using the table. It looks arbitrary at first, but it comes straight from the <Term k="accounting-equation">accounting equation</Term>: assets sit on the left of the &quot;=&quot;, so they increase on the left (debit). Liabilities and equity sit on the right, so they increase on the right (credit). Income increases equity, so it&apos;s a credit. Expenses reduce equity, so they&apos;re the opposite: a debit.</p>
        </div>
        <Card>
          <h3 className="mb-3 text-lg font-bold">The debit/credit rules</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1">Type</th><th>Increase</th><th>Decrease</th><th>Examples</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.t} className="border-b border-stone-100">
                  <td className={cx("py-2 font-semibold", r.c)}>{r.t}</td>
                  <td><span className={cx("rounded px-1.5 py-0.5 text-xs font-bold", r.up === "Debit" ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800")}>{r.up}</span></td>
                  <td><span className={cx("rounded px-1.5 py-0.5 text-xs font-bold", r.down === "Debit" ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800")}>{r.down}</span></td>
                  <td className="text-xs text-stone-500">{r.eg}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <MemoryAid k="dead-clic" />
        </Card>
      </div>
      <Callout kind="warn" title="Debit doesn't mean 'bad' and credit doesn't mean 'good'">
        Your bank statement says &quot;credit&quot; when money comes IN. That&apos;s from the <em>bank&apos;s</em> point of view: your money is a liability for the bank. In the café&apos;s own books, money coming into the bank is a <strong>debit</strong> to the Bank account.
      </Callout>
      <section>
        <h2 className="mb-3 text-2xl font-bold">Practise on April&apos;s transactions</h2>
        <Walkthrough txns={APRIL_FEATURED} initialPhase={1} />
      </section>
    </div>
  );
}

export function JournaliseStep() {
  const counts = DURING_YEAR.reduce<Record<string, number>>((a, t) => ({ ...a, [t.book]: (a[t.book] ?? 0) + 1 }), {});
  const books = [
    { k: "sales", n: "Sales journal", d: "Z-reports and catering invoices", sw: "Sales / Invoices" },
    { k: "purchases", n: "Purchases journal", d: "Supplier invoices on credit", sw: "Bills / Purchases" },
    { k: "cash-receipts", n: "Cash receipts journal", d: "Money into the bank: settlements, debtor payments, loans", sw: "Bank → Receive money" },
    { k: "cash-payments", n: "Cash payments journal", d: "Money out: suppliers, rent, drawings, loan repayments", sw: "Bank → Spend money" },
    { k: "payroll", n: "Payroll journal", d: "Every pay run", sw: "Payroll / Pay runs" },
    { k: "general", n: "General journal", d: "Everything else: month-end entries, year-end adjustments, corrections, closing", sw: "Manual journal" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>The <Term k="journal">journal</Term> is the diary of the business: every transaction in date order, showing the accounts debited and credited, the amounts, and a short <strong>narration</strong> (explanation).</p>
          <p>It&apos;s called the &quot;book of original entry&quot; because transactions are recorded here first, before being sorted into accounts. If something looks wrong in an account later, you trace it back to the journal, and from the journal back to the source document. That chain is called the <strong>audit trail</strong>.</p>
          <p>Because some transactions happen hundreds of times a year, businesses split the journal into <Term k="special-journals">special journals</Term>. Accounting software does the same thing behind different screens.</p>
        </div>
        <Card>
          <h3 className="mb-2 text-lg font-bold">Kōwhai&apos;s journals this year</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1">Journal</th><th>Used for</th><th>In software</th><th className="text-right">Entries</th></tr></thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.k} className="border-b border-stone-100 align-top">
                  <td className="py-1.5 font-medium">{b.n}</td>
                  <td className="py-1.5 text-xs text-stone-600">{b.d}</td>
                  <td className="py-1.5 text-xs text-stone-500">{b.sw}</td>
                  <td className="num py-1.5 text-right">{counts[b.k] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-500">Plus 12 year-end adjustments and 3 closing entries in the general journal.</p>
        </Card>
      </div>
      <section>
        <h2 className="mb-3 text-2xl font-bold">Write the entries for April</h2>
        <Walkthrough txns={APRIL_FEATURED} initialPhase={2} />
      </section>
    </div>
  );
}

export function PostStep() {
  const aprilAll = DURING_YEAR.filter((t) => t.date < "2026-05-01");
  const bank = ledger(aprilAll, "100");
  const ap = parties(aprilAll, "200");
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p><strong>Posting</strong> means copying each journal line into its account in the <Term k="ledger">general ledger</Term>. A debit in the journal becomes a debit in the account. A credit becomes a credit.</p>
          <p>After posting, each account shows its complete history and its current <strong>balance</strong>. That answers questions like &quot;how much is in the bank?&quot; or &quot;how much do we owe Southern Roasters?&quot;.</p>
          <p>On paper, accountants sketch accounts as <Term k="t-account">T-accounts</Term> (debits left, credits right). Software and formal ledgers use the <strong>running-balance</strong> format shown on the right.</p>
          <Callout kind="why" title="Subsidiary ledgers">
            Accounts payable shows ONE total, but the café needs to know how much it owes <em>each</em> supplier. A <Term k="subsidiary-ledger">subsidiary ledger</Term> keeps one account per supplier (or customer). Their total must equal the <Term k="control-account">control account</Term>.
          </Callout>
        </div>
        <Card>
          <h3 className="mb-2 text-lg font-bold">Bank account: April (running-balance ledger)</h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white"><tr className="border-b text-left uppercase tracking-wider text-stone-500"><th className="py-1">Date</th><th>Details</th><th className="text-right">Dr</th><th className="text-right">Cr</th><th className="text-right">Balance</th></tr></thead>
              <tbody>
                {bank.map((r, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="num py-1">{nzDate(r.txn.date, false)}</td>
                    <td className="max-w-[14rem] truncate py-1" title={r.txn.title}>{r.txn.title}</td>
                    <td className="num py-1 text-right">{r.debit ? num(r.debit) : ""}</td>
                    <td className="num py-1 text-right">{r.credit ? num(r.credit) : ""}</td>
                    <td className="num py-1 text-right font-medium">{num(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div>
        <h3 className="mb-2 text-lg font-bold">Accounts payable subsidiary ledger at 30 April</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ap.map((p) => {
            const rows = ledger(aprilAll, "200", p);
            return (
              <Card key={p} className="!p-3">
                <div className="text-sm font-semibold">{p}</div>
                <div className="num text-lg">{money(rows[rows.length - 1]?.balance ?? 0)}</div>
                <div className="text-xs text-stone-500">{rows.length} invoice{rows.length === 1 ? "" : "s"}</div>
              </Card>
            );
          })}
          <Card className="!border-ink !p-3">
            <div className="text-sm font-semibold">Control account 200 total</div>
            <div className="num text-lg font-bold">{money(ledger(aprilAll, "200").slice(-1)[0]?.balance ?? 0)}</div>
            <div className="text-xs text-emerald-700">✓ equals the sum of the supplier accounts</div>
          </Card>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["100", "400", "210", "200"].map((c) => <TAccount key={c} code={c} txns={aprilAll} maxRows={7} />)}
      </div>
      <section>
        <h2 className="mb-3 text-2xl font-bold">Post April&apos;s entries yourself</h2>
        <Walkthrough txns={APRIL_FEATURED} initialPhase={3} />
      </section>
    </div>
  );
}
