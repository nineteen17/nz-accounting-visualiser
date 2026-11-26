"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { APRIL_FEATURED, DURING_YEAR } from "@/data/books";
import { ACCOUNTS, account } from "@/data/chartOfAccounts";
import { BUSINESS, EMPLOYEES, SHAREHOLDERS } from "@/data/business";
import type { Equation } from "@/lib/engine/ledger";
import { money } from "@/lib/money";
import { TYPE_STYLE, cx } from "@/lib/ui";
import { EquationBar } from "@/components/visual/EquationBar";
import { TAccount } from "@/components/visual/TAccount";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { Callout, Card, Quiz, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { Explain } from "@/components/learn/Overlay";
import type { AccountType } from "@/lib/engine/types";

/* ─────────────────────────── 1. What is accounting ─────────────────────────── */

export function WhatIsAccounting() {
  const users = [
    { who: "Aroha & Ben (owners)", q: "Are we making money? Can we afford a second barista? How much can we take out?" },
    { who: "Harbour Bank", q: "Can the café repay the loan? Is it profitable and does it have enough cash?" },
    { who: "Inland Revenue (IRD)", q: "How much GST, PAYE and income tax is owed?" },
    { who: "Employees", q: "Is my pay right? Has my KiwiSaver and PAYE been paid?" },
    { who: "Suppliers", q: "Will the café pay its bills on time if we give it credit?" },
  ];
  return (
    <div className="prose-learn max-w-4xl text-[16px]">
      <p><Term k="accounting">Accounting</Term> is the language of business. It turns thousands of everyday events (a flat white sold, a delivery of milk, a pay run) into a few numbers that answer three questions:</p>
      <div className="not-prose my-6 grid gap-4 md:grid-cols-3">
        {[
          { t: "How did we do?", s: "Profit & loss", d: "Income minus expenses over a period.", c: "border-emerald-400 bg-emerald-50" },
          { t: "Where do we stand?", s: "Balance sheet", d: "What we own and what we owe on a given date.", c: "border-sky-400 bg-sky-50" },
          { t: "Where did the cash go?", s: "Cash flow", d: "Money in and out of the bank.", c: "border-kowhai-400 bg-kowhai-50" },
        ].map((x) => (
          <div key={x.t} className={cx("rounded-xl border-2 p-4", x.c)}>
            <div className="text-lg font-bold">{x.t}</div>
            <div className="text-sm font-semibold text-stone-600">{x.s}</div>
            <div className="mt-1 text-sm">{x.d}</div>
          </div>
        ))}
      </div>
      <h2>Meet the business we&apos;ll follow</h2>
      <p>{BUSINESS.story}</p>
      <div className="not-prose my-4 grid gap-3 sm:grid-cols-2">
        {SHAREHOLDERS.map((s) => (
          <Card key={s.id} className="!p-4"><div className="font-bold">{s.name}</div><div className="text-sm text-stone-600">{s.role} · {s.pct * 100}% shareholder</div></Card>
        ))}
        {EMPLOYEES.map((e) => (
          <Card key={e.id} className="!p-4"><div className="font-bold">{e.name}</div><div className="text-sm text-stone-600">{e.role} · ${e.rate.toFixed(2)}/hr · tax code {e.code}{e.studentLoan ? " SL" : ""}</div></Card>
        ))}
      </div>
      <p>Key facts: GST registered on the <strong>{BUSINESS.gstBasis.toLowerCase()}</strong>, filing <strong>{BUSINESS.gstFrequency.toLowerCase()}</strong>. Balance date <strong>31 March</strong>. The year we follow is the <strong>{BUSINESS.incomeYear}</strong>.</p>
      <h2>Who uses the café&apos;s accounts?</h2>
      <ul>{users.map((u) => <li key={u.who}><strong>{u.who}:</strong> {u.q}</li>)}</ul>
      <h2>Bookkeeping vs accounting</h2>
      <p><strong>Bookkeeping</strong> is recording: entering invoices, coding bank transactions, running payroll. <strong>Accounting</strong> is the bigger job: designing the system, making year-end adjustments, preparing financial statements and tax returns, and interpreting the results. Ben does the bookkeeping. Their chartered accountant, Rata &amp; Co, does the year-end accounts and tax.</p>
      <Callout kind="nz" title="In New Zealand">Most small businesses use cloud software (Xero, MYOB, etc.) linked to their bank, IRD and payroll. The software automates the mechanics, but you still need to understand what it&apos;s doing to code transactions correctly and read the reports. That&apos;s what this tool teaches.</Callout>
    </div>
  );
}

/* ─────────────────────────── 2. Five elements ─────────────────────────── */

const ELEMENTS: { type: AccountType; plain: string; test: string }[] = [
  { type: "asset", plain: "Things the café owns or is owed", test: "Will it bring a future benefit the café controls?" },
  { type: "liability", plain: "Things the café owes others", test: "Does the café have to pay or provide something later?" },
  { type: "equity", plain: "The owners' stake", test: "Is it money from owners, or profit kept in the business?" },
  { type: "income", plain: "Value earned by trading", test: "Did the café earn it by providing goods or services?" },
  { type: "expense", plain: "Costs used up earning income", test: "Was something used up this period to run the business?" },
];

const SORT_ITEMS: { label: string; type: AccountType }[] = [
  { label: "Espresso machine", type: "asset" },
  { label: "Bank loan", type: "liability" },
  { label: "Coffee sales", type: "income" },
  { label: "Wages", type: "expense" },
  { label: "Money Tūī Consulting owes us", type: "asset" },
  { label: "GST owed to IRD", type: "liability" },
  { label: "Shares Aroha bought", type: "equity" },
  { label: "Rent for this month", type: "expense" },
  { label: "Rent paid for NEXT month", type: "asset" },
  { label: "Customer's deposit for a future wedding", type: "liability" },
  { label: "Interest earned on term deposit", type: "income" },
  { label: "Depreciation", type: "expense" },
];

export function FiveElements() {
  const [answers, setAnswers] = useState<Record<string, AccountType>>({});
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Every account in every business, from a café to a bank, belongs to one of just <strong>five types</strong>. Learn these and the rest of accounting falls into place.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {ELEMENTS.map((e) => {
          const s = TYPE_STYLE[e.type];
          const eg = ACCOUNTS.filter((a) => a.type === e.type && !a.contra && a.code !== "320").slice(0, 5);
          return (
            <div key={e.type} className={cx("rounded-xl border-2 p-4", s.border, s.soft)}>
              <div className={cx("text-lg font-bold", s.text)}>{s.label}</div>
              <div className="text-sm font-medium">{e.plain}</div>
              <div className="mt-2 text-xs italic text-stone-600">Test: {e.test}</div>
              <div className="mt-3 text-xs font-semibold text-stone-500">Kōwhai examples</div>
              <ul className="mt-1 space-y-0.5 text-xs">{eg.map((a) => <li key={a.code}>• {a.name}</li>)}</ul>
              <div className="mt-3"><Term k={e.type}>More →</Term></div>
            </div>
          );
        })}
      </div>
      <Callout kind="why" title="Two families">Assets, liabilities and equity are <strong>balance sheet</strong> items: they still exist at the end of the year and carry forward. Income and expenses are <strong>profit &amp; loss</strong> items: they measure one period, then reset to zero. (Profit itself ends up in equity.)</Callout>
      <div className="grid gap-4 md:grid-cols-2">
        <Callout kind="nz" title="What about drawings (withdrawals)?">
          Drawings aren&apos;t a sixth element. They&apos;re money the owner takes out, which <strong>reduces equity</strong>. NZ uses the NZ IFRS / PBE framework, which has exactly five elements, so drawings are a negative equity item. Some textbooks list them separately: the &quot;D&quot; in DEAD CLIC and DEALER is there because drawings are <em>debited</em>, like expenses. &quot;Withdrawals&quot; is the North American word; NZ, Australia and the UK say <strong>drawings</strong>. In a company like Kōwhai, shareholders&apos; drawings go to their <Term k="shareholder-current-account">current accounts</Term>.
        </Callout>
        <Callout kind="nz" title="Income or revenue?">
          Both are used, and they&apos;re not quite the same. Under the NZ IFRS / PBE framework the element is <strong>income</strong>. It has two parts: <strong>revenue</strong>, from ordinary trading (café sales, catering), and <strong>gains</strong> (e.g. selling an old machine for more than its book value). So revenue is a part of income. Kōwhai&apos;s P&amp;L shows &quot;Revenue&quot; for sales, and interest income separately. US GAAP lists revenues and gains as separate elements, which is why American textbooks say &quot;revenue&quot;.
        </Callout>
      </div>
      <Card>
        <h3 className="mb-3 text-lg font-bold">Sort them: what type is each item?</h3>
        <div className="space-y-2">
          {SORT_ITEMS.map((it) => {
            const a = answers[it.label];
            return (
              <div key={it.label} className="flex flex-wrap items-center gap-2">
                <span className="w-72 text-sm">{it.label}</span>
                {ELEMENTS.map((e) => (
                  <button
                    key={e.type}
                    onClick={() => setAnswers({ ...answers, [it.label]: e.type })}
                    className={cx(
                      "rounded border px-2 py-0.5 text-xs",
                      a === e.type ? (a === it.type ? "border-emerald-500 bg-emerald-100" : "border-rose-500 bg-rose-100") : "border-stone-300 bg-white hover:bg-stone-50",
                      a && a !== it.type && e.type === it.type && "ring-2 ring-emerald-400",
                    )}
                  >
                    {TYPE_STYLE[e.type].label}
                  </button>
                ))}
                {a && <span className="text-xs">{a === it.type ? "✓" : "✗"}</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────── 3. Accounting equation (sandbox) ─────────────────────────── */

const SANDBOX: { label: string; d: Partial<Record<"A" | "L" | "C" | "I" | "X", number>>; explain: string }[] = [
  { label: "Owners invest $100,000", d: { A: 100_000, C: 100_000 }, explain: "Bank ↑ (asset) and share capital ↑ (equity)." },
  { label: "Borrow $50,000", d: { A: 50_000, L: 50_000 }, explain: "Bank ↑ and loan ↑. Borrowing isn't income!" },
  { label: "Buy machine $16,000 cash", d: {}, explain: "Machine ↑, bank ↓. One asset swapped for another: totals don't change." },
  { label: "Buy beans $2,000 on credit", d: { L: 2_000, X: 2_000 }, explain: "Purchases (expense) ↑ reduces equity. Creditors (liability) ↑." },
  { label: "Sell coffee $6,000 cash", d: { A: 6_000, I: 6_000 }, explain: "Bank ↑ and sales income ↑, which increases equity." },
  { label: "Pay rent $3,000", d: { A: -3_000, X: 3_000 }, explain: "Bank ↓ and rent expense ↑ (equity ↓)." },
  { label: "Pay the bean supplier $2,000", d: { A: -2_000, L: -2_000 }, explain: "Bank ↓ and creditors ↓. No expense: that was recorded when the beans arrived." },
  { label: "Owner takes $1,500 drawings", d: { A: -1_500, C: -1_500 }, explain: "Bank ↓ and owner's equity ↓. Drawings aren't an expense." },
];

export function AccountingEquation() {
  const [applied, setApplied] = useState<number[]>([]);
  const calc = (ids: number[]): Equation => {
    const t = { A: 0, L: 0, C: 0, I: 0, X: 0 };
    for (const i of ids) for (const [k, v] of Object.entries(SANDBOX[i].d)) t[k as keyof typeof t] += v as number;
    return { assets: t.A, liabilities: t.L, capital: t.C, income: t.I, expenses: t.X, profit: t.I - t.X, equity: t.C + t.I - t.X };
  };
  const eq = calc(applied);
  const prev = applied.length ? calc(applied.slice(0, -1)) : undefined;
  const last = applied[applied.length - 1];
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Everything the café owns was paid for in one of two ways: with <strong>other people&apos;s money</strong> (liabilities) or with <strong>the owners&apos; money</strong> (equity). So:</p>
        <div className="my-4 rounded-2xl bg-ink px-6 py-5 text-center text-2xl font-bold text-white sm:text-3xl">
          <span className="text-sky-300">Assets</span> = <span className="text-rose-300">Liabilities</span> + <span className="text-violet-300">Equity</span>
        </div>
        <p>During the year, profit (income − expenses) belongs to the owners but hasn&apos;t been moved into equity yet. So the expanded form is:</p>
        <p className="text-center text-lg font-semibold">Assets = Liabilities + Capital + (Income − Expenses)</p>
        <p>This equation is <strong>always</strong> true, after every single transaction. That&apos;s what makes <Term k="double-entry">double-entry</Term> bookkeeping self-checking.</p>
      </div>
      <Card>
        <h3 className="mb-1 text-lg font-bold">Sandbox: click transactions and watch the equation</h3>
        <p className="mb-3 text-sm text-stone-600">Add them in any order. The two bars always end up the same length.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {SANDBOX.map((s, i) => (
            <button key={i} onClick={() => setApplied([...applied, i])} className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm hover:border-kowhai-500 hover:bg-kowhai-50">+ {s.label}</button>
          ))}
          <button onClick={() => setApplied([])} className="rounded-lg px-3 py-1.5 text-sm text-stone-500 underline">reset</button>
        </div>
        <EquationBar eq={eq} prev={prev} />
        {last !== undefined && (
          <motion.div key={applied.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-lg bg-kowhai-50 px-4 py-2 text-sm">
            <strong>{SANDBOX[last].label}:</strong> {SANDBOX[last].explain}
          </motion.div>
        )}
      </Card>
      <Quiz q="The café buys a $2,000 laptop with cash. What happens to total assets?" options={["Up $2,000", "Down $2,000", "No change"]} answer={2} explain="Laptop (asset) up $2,000, bank (asset) down $2,000. Total assets stay the same." />
      <Quiz q="The café receives a $500 power bill, to be paid next month. What happens?" options={["Assets ↓, Equity ↓", "Liabilities ↑, Equity ↓", "Liabilities ↑, Assets ↑"]} answer={1} explain="An expense (reducing equity) and a new liability (creditors). No cash has moved yet." />
    </div>
  );
}

/* ─────────────────────────── 4. Double entry ─────────────────────────── */

export function DoubleEntry() {
  const examples = ["A01", "A12", "A17", "A28"].map((id) => DURING_YEAR.find((t) => t.id === id)!);
  const [i, setI] = useState(0);
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Every transaction is an exchange: something comes in, something goes out (or a promise is made). <Term k="double-entry">Double-entry bookkeeping</Term>, used since 15th-century Venice, records <strong>both sides</strong>:</p>
        <ul>
          <li>Every transaction affects <strong>at least two accounts</strong>.</li>
          <li>One side is recorded as a <Term k="debit">debit</Term> (left), the other as a <Term k="credit">credit</Term> (right).</li>
          <li><strong>Total debits always equal total credits.</strong></li>
        </ul>
        <p>Why bother? Because it keeps the accounting equation balanced automatically. It also means every dollar has a source and a destination: if bank goes down, something else must explain why.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {examples.map((t, k) => <button key={t.id} onClick={() => setI(k)} className={cx("rounded-lg px-3 py-1.5 text-sm", i === k ? "bg-ink text-white" : "bg-white hover:bg-stone-100")}>{t.title}</button>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <JournalEntry txn={examples[i]} animate showWhy key={i} />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from(new Set(examples[i].lines.map((l) => l.account))).map((c) => <TAccount key={c + i} code={c} txns={[examples[i]]} highlight={examples[i].id} />)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 5. Debits & credits practice ─────────────────────────── */

export function DebitsCredits() {
  const pool = useMemo(() => APRIL_FEATURED.flatMap((t) => t.lines.map((l) => ({ t, l }))), []);
  const [n, setN] = useState(0);
  const [pick, setPick] = useState<"debit" | "credit" | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const q = pool[(n * 7) % pool.length];
  const a = account(q.l.account);
  const side = q.l.debit ? "debit" : "credit";
  const up = side === a.normal;
  const answer = (s: "debit" | "credit") => {
    if (pick) return;
    setPick(s);
    setScore({ right: score.right + (s === side ? 1 : 0), total: score.total + 1 });
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>&quot;Debit&quot; and &quot;credit&quot; are just <strong>left</strong> and <strong>right</strong>. Forget everyday meanings. What matters is which side makes each type of account <strong>go up</strong>:</p>
          <div className="not-prose my-4 grid grid-cols-2 overflow-hidden rounded-xl border-2 border-ink text-center">
            <div className="border-r-2 border-ink bg-indigo-50 p-3"><div className="text-lg font-black text-indigo-800">DEBIT (left)</div><div className="text-sm">increases</div><div className="font-semibold text-sky-700">Assets</div><div className="font-semibold text-amber-700">Expenses</div><div className="text-xs text-stone-500">(+ Drawings)</div></div>
            <div className="bg-orange-50 p-3"><div className="text-lg font-black text-orange-800">CREDIT (right)</div><div className="text-sm">increases</div><div className="font-semibold text-rose-700">Liabilities</div><div className="font-semibold text-violet-700">Equity</div><div className="font-semibold text-emerald-700">Income</div></div>
          </div>
          <p>The opposite side decreases. So paying out of the bank is a <strong>credit</strong> to Bank (asset going down).</p>
          <Explain title="Why are the rules this way round?" label="Why does it work like that?">
            <p>It comes from the equation <strong>Assets = Liabilities + Equity</strong>. Assets are on the left side of the &quot;=&quot;, so they increase on the left (debit). Liabilities and equity are on the right, so they increase on the right (credit).</p>
            <p>Income increases equity, so income increases with a credit, just like equity. Expenses decrease equity, so they work the opposite way: they increase with a debit.</p>
            <p>That&apos;s the whole system. Five account types and one equation.</p>
          </Explain>
          <Callout kind="warn" title="Your bank statement is backwards (for you)">When your bank &quot;credits&quot; your account, it&apos;s recording that it owes you more: your deposit is the <em>bank&apos;s</em> liability. In your own books the same deposit is a debit to your Bank asset.</Callout>
        </div>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold">Practice: debit or credit?</h3>
            <span className="text-sm text-stone-500">Score {score.right}/{score.total}</span>
          </div>
          <div className="text-sm text-stone-500">Transaction</div>
          <div className="font-semibold">{q.t.title}</div>
          <div className="mt-3 text-sm text-stone-500">Account</div>
          <div className="flex items-center gap-2">
            <span className={cx("rounded px-2 py-0.5 text-xs font-bold text-white", TYPE_STYLE[a.type].bg)}>{TYPE_STYLE[a.type].label}</span>
            <span className="font-semibold">{a.name}</span>
            <span className="num ml-auto">{money(q.l.debit ?? q.l.credit ?? 0)}</span>
          </div>
          <div className="mt-2 text-sm">This account <strong>{up ? "increases ▲" : "decreases ▼"}</strong>. So is it a debit or a credit?</div>
          <div className="mt-3 flex gap-2">
            {(["debit", "credit"] as const).map((s) => (
              <button key={s} onClick={() => answer(s)} className={cx("flex-1 rounded-lg border-2 py-2 font-bold uppercase", !pick ? "border-stone-300 hover:bg-stone-50" : s === side ? "border-emerald-500 bg-emerald-100" : pick === s ? "border-rose-500 bg-rose-100" : "border-stone-200 opacity-50")}>{s}</button>
            ))}
          </div>
          {pick && (
            <div className="mt-3 text-sm">
              {pick === side ? "✓ Correct. " : "✗ Not quite. "}
              {TYPE_STYLE[a.type].label}s {up ? "increase" : "decrease"} on the {side} side. {q.l.why}
              <button onClick={() => { setN(n + 1); setPick(null); }} className="mt-2 block rounded-lg bg-kowhai-400 px-4 py-1.5 font-bold">Next question →</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────── 6. T-accounts ─────────────────────────── */

export function TAccounts() {
  const april = DURING_YEAR.filter((t) => t.date < "2026-05-01");
  const used = ACCOUNTS.filter((a) => april.some((t) => t.lines.some((l) => l.account === a.code)));
  const [code, setCode] = useState("100");
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="prose-learn text-[16px]">
          <p>A <Term k="t-account">T-account</Term> is the simplest picture of an account: a big letter T. The name goes on top, <strong>debits on the left</strong> and <strong>credits on the right</strong>.</p>
          <p>To find the balance, add up each side and subtract the smaller total from the bigger one. The balance sits on the bigger side. An asset normally ends up with more on the debit side; a liability with more on the credit side.</p>
          <h3>&quot;Balancing off&quot; an account</h3>
          <p>On paper, at month end, the balance is written on the smaller side as <strong>&quot;Balance c/d&quot;</strong> (carried down) so both columns total the same. It then appears on the opposite side as <strong>&quot;Balance b/d&quot;</strong> (brought down) to open the next month.</p>
          <Callout kind="tip" title="Accountants still do this">Faced with a tricky entry, even experienced accountants sketch T-accounts on a notepad. It&apos;s the fastest way to see whether an entry makes sense.</Callout>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Pick any of Kōwhai&apos;s accounts in April:</label>
          <select value={code} onChange={(e) => setCode(e.target.value)} className="mb-3 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm">
            {used.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
          </select>
          <TAccount code={code} txns={april} maxRows={14} />
          <p className="mt-2 text-xs text-stone-500">Hover an entry to see the transaction. Entries are labelled by date and reference.</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 7. Chart of accounts ─────────────────────────── */

export function ChartOfAccounts() {
  const [filter, setFilter] = useState<AccountType | "all">("all");
  const list = ACCOUNTS.filter((a) => filter === "all" || a.type === filter);
  return (
    <div className="space-y-4">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>The <Term k="chart-of-accounts">chart of accounts</Term> is the complete, numbered list of accounts the café uses. Codes group the accounts by type, so 1xx is always an asset and 6xx always an expense. Each account also records its <strong>normal balance</strong>, its default <strong>GST treatment</strong> and where it appears in the financial statements.</p>
        <p>Choosing accounts is a design decision. Too few and you can&apos;t see what&apos;s going on (just &quot;Purchases&quot;); too many and the reports become noise. Kōwhai splits purchases into coffee, food, dairy and packaging because Aroha wants to watch each cost.</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {(["all", "asset", "liability", "equity", "income", "expense"] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={cx("rounded-lg px-3 py-1 text-sm font-medium capitalize", filter === t ? "bg-ink text-white" : "bg-white hover:bg-stone-100")}>{t}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500"><th className="px-3 py-2">Code</th><th>Name</th><th>Type</th><th>Normal</th><th>GST</th><th className="px-3">What it&apos;s for</th></tr></thead>
          <tbody>
            {list.map((a) => {
              const s = TYPE_STYLE[a.type];
              return (
                <tr key={a.code} className="border-b border-stone-100 align-top">
                  <td className="num px-3 py-1.5 font-semibold">{a.code}</td>
                  <td className="py-1.5 pr-2 font-medium">{a.name}</td>
                  <td className="py-1.5"><span className={cx("rounded px-1.5 py-0.5 text-xs font-semibold", s.soft, s.text)}>{s.label}{a.contra ? " (contra)" : ""}</span></td>
                  <td className="py-1.5 text-xs capitalize">{a.normal}</td>
                  <td className="py-1.5 text-xs">{a.gst === "standard" ? "15%" : a.gst === "exempt" ? "Exempt" : a.gst === "zero" ? "0%" : "–"}</td>
                  <td className="px-3 py-1.5 text-xs text-stone-600">{a.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── 8. Source documents ─────────────────────────── */

export function SourceDocuments() {
  const ids = ["A05", "A20", "A17", "A18", "A21", "F13", "ADJ09"];
  const all = [...DURING_YEAR];
  const docs = ids.map((id) => all.find((t) => t.id === id)).filter(Boolean);
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>A <Term k="source-document">source document</Term> is the evidence behind each entry. If it isn&apos;t documented, it didn&apos;t happen, as far as IRD is concerned.</p>
        <h3>What must be on a GST invoice in NZ</h3>
        <p>Since 1 April 2023 the law calls these records <Term k="taxable-supply-information">taxable supply information</Term> (TSI). Requirements step up with the value:</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500"><th className="px-3 py-2">Supply value (incl GST)</th><th>Required information</th></tr></thead>
          <tbody>
            <tr className="border-b"><td className="px-3 py-2 font-semibold">$200 or less</td><td className="py-2">Supplier name (or trade name), date, description of goods/services, total amount paid</td></tr>
            <tr className="border-b"><td className="px-3 py-2 font-semibold">Over $200, up to $1,000</td><td className="py-2">All of the above, <strong>plus</strong> the supplier&apos;s GST number, and either the GST amount or a statement that the price includes GST</td></tr>
            <tr><td className="px-3 py-2 font-semibold">Over $1,000</td><td className="py-2">All of the above, <strong>plus</strong> the buyer&apos;s name and at least one identifier (address, phone, email, NZBN, website…)</td></tr>
          </tbody>
        </table>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {docs.map((t) => t && t.doc && (
          <div key={t.id}>
            <div className="mb-1 text-sm font-semibold">{t.id}: {t.title}</div>
            <SourceDoc doc={t.doc} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── 9. Cash vs accrual ─────────────────────────── */

export function CashVsAccrual() {
  const rows = [
    { item: "Rent for Apr–Jun paid 3 April ($9,000)", cash: [-9000, 0, 0], acc: [-3000, -3000, -3000] },
    { item: "Catering for Tūī: done April, paid May ($1,000)", cash: [0, 1000, 0], acc: [1000, 0, 0] },
    { item: "Coffee beans: delivered April, paid 20 May ($2,000)", cash: [0, -2000, 0], acc: [-2000, 0, 0] },
    { item: "Espresso machine bought April ($16,000, lasts years)", cash: [-16000, 0, 0], acc: [-400, -400, -400] },
  ];
  const tot = (k: "cash" | "acc") => [0, 1, 2].map((m) => rows.reduce((s, r) => s + r[k][m], 0));
  const months = ["April", "May", "June"];
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>Two ways to decide <em>when</em> income and expenses count:</p>
        <ul>
          <li><Term k="cash-basis">Cash basis</Term>: when money moves.</li>
          <li><Term k="accrual-basis">Accrual basis</Term>: when it&apos;s <strong>earned</strong> (income) or <strong>used up</strong> (expenses), whenever the cash moves.</li>
        </ul>
        <p>Here are four of Kōwhai&apos;s real April items, measured both ways. Watch how different the monthly results look:</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <th className="px-3 py-2 text-left">Item</th>
              {months.map((m) => <th key={"c" + m} className="px-2 text-right">Cash: {m}</th>)}
              {months.map((m) => <th key={"a" + m} className="bg-emerald-50 px-2 text-right">Accrual: {m}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-b border-stone-100">
                <td className="px-3 py-1.5">{r.item}</td>
                {r.cash.map((v, k) => <td key={k} className="num px-2 text-right">{v ? money(v, { dp: 0 }) : "–"}</td>)}
                {r.acc.map((v, k) => <td key={k} className="num bg-emerald-50/50 px-2 text-right">{v ? money(v, { dp: 0 }) : "–"}</td>)}
              </tr>
            ))}
            <tr className="font-bold">
              <td className="px-3 py-2">Effect on profit</td>
              {tot("cash").map((v, k) => <td key={k} className="num px-2 text-right">{money(v, { dp: 0 })}</td>)}
              {tot("acc").map((v, k) => <td key={k} className="num bg-emerald-50 px-2 text-right">{money(v, { dp: 0 })}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">(Machine depreciation simplified to $400 a month for this comparison.)</p>
      <Callout kind="why" title="Why accrual wins">On a cash basis, April looks like a disaster and May looks odd. That says nothing about how the café is actually trading. The accrual basis matches each cost to the period it helps earn income in, so each month&apos;s result is meaningful. That&apos;s why companies, banks and IRD use it, and it&apos;s why year-end <strong>adjusting entries</strong> exist.</Callout>
      <Callout kind="nz" title="GST has its own basis">Separately from the accounts, a business picks a GST accounting basis: <Term k="invoice-basis">invoice</Term>, <Term k="payments-basis">payments</Term> or hybrid. Kōwhai uses the invoice basis, which lines up with accrual accounting.</Callout>
    </div>
  );
}

/* ─────────────────────────── 10. Business structures ─────────────────────────── */

export function BusinessStructures() {
  const rows = [
    ["Legal identity", "Same person as the owner", "The partners", "Separate legal person", "Separate legal person"],
    ["Liability for debts", "Unlimited: house at risk", "Unlimited, joint", "Limited to share capital (unless guarantees)", "Limited"],
    ["Who pays income tax", "Owner, at personal rates (10.5%–39%)", "Each partner on their share", "Company at 28%; shareholders on salaries/dividends", "Owners, like a partnership"],
    ["Tax return", "IR3", "IR7 + partners' IR3s", "IR4 (+ shareholders' IR3s)", "IR7 + owners' IR3s"],
    ["Owner taking money", "Drawings (not deductible)", "Drawings", "Salary, dividends or current account", "Drawings / current accounts"],
    ["Setup & admin", "Easiest", "Partnership agreement advised", "Companies Office registration, annual return, directors' duties", "Company + LTC election"],
  ];
  return (
    <div className="space-y-6">
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>The legal structure decides how the business is taxed, who&apos;s liable if it fails, and how owners get paid. All of that changes the accounting. NZ&apos;s main options are a <Term k="sole-trader">sole trader</Term>, a <Term k="partnership">partnership</Term>, a <Term k="company">company</Term> and a <Term k="look-through-company">look-through company</Term>.</p>
        <UsNote>
          <p>US → NZ: a <strong>sole proprietorship</strong> is a <strong>sole trader</strong>; a <strong>partnership</strong> is still a partnership; a <strong>corporation</strong> is a <strong>company</strong> (shareholders, not stockholders). The US <strong>S corporation</strong>, which passes profit through to its owners for tax, is closest to NZ&apos;s <strong>look-through company</strong>. An <strong>LLC</strong> has no exact match: in NZ you&apos;d choose between a company and an LTC.</p>
        </UsNote>
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500"><th className="px-3 py-2"></th><th>Sole trader</th><th>Partnership</th><th className="bg-kowhai-100">Company (Kōwhai)</th><th>LTC</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-b border-stone-100 align-top">
                <td className="px-3 py-2 font-semibold">{r[0]}</td>
                <td className="py-2 pr-2">{r[1]}</td>
                <td className="py-2 pr-2">{r[2]}</td>
                <td className="bg-kowhai-50 py-2 pr-2">{r[3]}</td>
                <td className="py-2 pr-2">{r[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prose-learn max-w-4xl text-[16px]">
        <h3>Why Aroha and Ben chose a company</h3>
        <ul>
          <li><strong>Two owners with different stakes</strong>: shares (60/40) make ownership clear.</li>
          <li><strong>Limited liability</strong>: although the bank still wanted personal guarantees for the loan.</li>
          <li><strong>Tax flexibility</strong>: profits kept in the company are taxed at 28%, below Aroha&apos;s top personal rate. Shareholder salaries can be set each year.</li>
        </ul>
        <h3>What changes in the books</h3>
        <ul>
          <li>Owners&apos; money in = <Term k="share-capital">share capital</Term> (equity), or a loan via their current account.</li>
          <li>Owners&apos; money out = <Term k="drawings">drawings</Term> against their <Term k="shareholder-current-account">shareholder current account</Term>, then a <Term k="shareholder-salary">shareholder salary</Term> or a dividend.</li>
          <li>The company pays its own income tax (an expense in its P&amp;L), files an <Term k="ir4">IR4</Term> and a Companies Office annual return.</li>
        </ul>
      </div>
    </div>
  );
}
