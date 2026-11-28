"use client";

import { useMemo, useState } from "react";
import { ALL, BEFORE_CLOSING, DURING_YEAR } from "@/data/books";
import { ACCOUNTS, account } from "@/data/chartOfAccounts";
import { LOAN } from "@/data/business";
import { LOAN_SCHEDULE } from "@/data/books/april";
import { balances, equation, ledger, parties, trialBalance } from "@/lib/engine/ledger";
import { balanceSheet, profitAndLoss } from "@/lib/engine/statements";
import { money, nzDate, num, pct } from "@/lib/money";
import { TYPE_STYLE, cx } from "@/lib/ui";
import { EquationBar } from "@/components/visual/EquationBar";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { TAccount } from "@/components/visual/TAccount";
import { BalanceSheetView, ProfitAndLossView, TrialBalanceTable } from "@/components/visual/Statements";
import { Callout, Card, Tabs } from "@/components/learn/bits";
import { useOverlay } from "@/components/learn/Overlay";
import { TxnDetail } from "@/components/cycle/steps/TheYear";
import { RichText } from "@/components/learn/RichText";

export { BudgetTool } from "./Budget";
export { CashForecastTool } from "./CashForecast";
export { PayYourselfTool } from "./PayYourself";
export { StructuresTool } from "./Structures";

const input = "max-w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm";

/* ───────────── Journal ───────────── */

export function JournalTool() {
  const [q, setQ] = useState("");
  const [book, setBook] = useState("all");
  const [kind, setKind] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = ALL.filter(
    (t) =>
      (book === "all" || t.book === book) &&
      (kind === "all" || t.kind === kind) &&
      (!q || `${t.id} ${t.title} ${t.story}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input aria-label="Search the journal" placeholder="Search (e.g. GST, Mia, rent)…" value={q} onChange={(e) => setQ(e.target.value)} className={cx(input, "min-w-64 flex-1")} />
        <select aria-label="Which journal" value={book} onChange={(e) => setBook(e.target.value)} className={input}>
          <option value="all">All journals</option><option value="sales">Sales</option><option value="purchases">Purchases</option><option value="cash-receipts">Cash receipts</option><option value="cash-payments">Cash payments</option><option value="payroll">Payroll</option><option value="general">General</option>
        </select>
        <select aria-label="Which kind of entry" value={kind} onChange={(e) => setKind(e.target.value)} className={input}>
          <option value="all">All kinds</option><option value="featured">★ Featured</option><option value="routine">Routine</option><option value="adjustment">Year-end adjustments</option><option value="closing">Closing entries</option>
        </select>
      </div>
      <div className="text-sm text-stone-500">{list.length} entries</div>
      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {list.map((t) => (
          <div key={t.id}>
            <button onClick={() => setOpen(open === t.id ? null : t.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-kowhai-50">
              <span className="num w-20 shrink-0 text-xs text-stone-500 sm:w-24">{nzDate(t.date)}</span>
              <span className="num hidden w-24 shrink-0 text-xs text-stone-400 sm:inline">{t.id}</span>
              <span className="min-w-0 flex-1">{t.kind === "featured" && "★ "}{t.title}</span>
              <span className="num shrink-0 text-xs text-stone-500">{num(t.lines.reduce((s, l) => s + (l.debit ?? 0), 0))}</span>
            </button>
            {open === t.id && (
              <div className="grid gap-4 bg-stone-50 p-4 lg:grid-cols-2">
                <div className="prose-learn text-sm"><RichText text={t.story} /></div>
                <JournalEntry txn={t} showWhy />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Ledger ───────────── */

export function LedgerTool() {
  const [code, setCode] = useState("100");
  const [party, setParty] = useState("");
  const [closing, setClosing] = useState(false);
  const { openCustom } = useOverlay();
  const txns = closing ? ALL : BEFORE_CLOSING;
  const ps = parties(txns, code);
  const rows = ledger(txns, code, party || undefined);
  const a = account(code);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Account" value={code} onChange={(e) => { setCode(e.target.value); setParty(""); }} className={input}>
          {ACCOUNTS.map((x) => <option key={x.code} value={x.code}>{x.code} {x.name}</option>)}
        </select>
        {ps.length > 0 && (
          <select aria-label="Customer, supplier or shareholder" value={party} onChange={(e) => setParty(e.target.value)} className={input}>
            <option value="">All (control account)</option>
            {ps.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={closing} onChange={(e) => setClosing(e.target.checked)} /> include closing entries</label>
      </div>
      <div className={cx("rounded-xl border px-4 py-3 text-sm", TYPE_STYLE[a.type].border, TYPE_STYLE[a.type].soft)}>
        <strong>{a.code} {a.name}</strong> · {TYPE_STYLE[a.type].label} · normal balance: {a.normal}. {a.description}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="max-h-[36rem] overflow-y-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-stone-50"><tr className="text-left uppercase tracking-wider text-stone-500"><th className="px-3 py-2">Date</th><th>Ref</th><th>Details</th><th>Other side</th><th className="text-right">Dr</th><th className="text-right">Cr</th><th className="px-3 text-right">Balance</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="cursor-pointer border-t border-stone-100 hover:bg-kowhai-50" onClick={() => openCustom(r.txn.title, <TxnDetail t={r.txn} />)}>
                  <td className="num px-3 py-1">{nzDate(r.txn.date, false)}</td>
                  <td className="num text-stone-400">{r.txn.id}</td>
                  <td className="max-w-[14rem] truncate"><button type="button" onClick={(e) => { e.stopPropagation(); openCustom(r.txn.title, <TxnDetail t={r.txn} />); }} className="max-w-full truncate text-left hover:underline">{r.line.memo ?? r.txn.title}</button></td>
                  <td className="max-w-[10rem] truncate text-stone-500">{r.contra}</td>
                  <td className="num text-right">{r.debit ? num(r.debit) : ""}</td>
                  <td className="num text-right">{r.credit ? num(r.credit) : ""}</td>
                  <td className="num px-3 text-right font-medium">{num(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-4 text-sm text-stone-500">No entries.</p>}
        </div>
        <div>
          <TAccount code={code} txns={party ? txns.map((t) => ({ ...t, lines: t.lines.filter((l) => l.account !== code || l.party === party) })) : txns} maxRows={12} title={party ? `${a.code} · ${party}` : undefined} />
          <p className="mt-2 text-xs text-stone-500">Click a row to open the transaction and its source document.</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────── TB at any date ───────────── */

const DATES = Array.from(new Set(DURING_YEAR.map((t) => t.date))).sort();

export function TrialBalanceTool() {
  const [i, setI] = useState(DATES.length - 1);
  const [adj, setAdj] = useState(false);
  const date = DATES[i];
  const txns = useMemo(() => [...DURING_YEAR.filter((t) => t.date <= date), ...(adj && date === "2027-03-31" ? BEFORE_CLOSING.slice(DURING_YEAR.length) : [])], [date, adj]);
  const b = balances(txns);
  const tb = trialBalance(b);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold">As at <span className="num">{nzDate(date)}</span></span>
          <input type="range" aria-label="Date" aria-valuetext={nzDate(DATES[i])} min={0} max={DATES.length - 1} value={i} onChange={(e) => setI(Number(e.target.value))} className="flex-1 accent-kowhai-600" />
          <label className={cx("flex items-center gap-2 text-sm", date !== "2027-03-31" && "opacity-40")}><input type="checkbox" disabled={date !== "2027-03-31"} checked={adj} onChange={(e) => setAdj(e.target.checked)} /> include year-end adjustments</label>
        </div>
      </Card>
      <EquationBar eq={equation(b)} />
      <TrialBalanceTable {...tb} />
    </div>
  );
}

/* ───────────── Statements at any date ───────────── */

export function StatementsTool() {
  const [i, setI] = useState(DATES.length - 1);
  const [tab, setTab] = useState<"pl" | "bs">("pl");
  const date = DATES[i];
  const final = date === "2027-03-31";
  const txns = final ? BEFORE_CLOSING : DURING_YEAR.filter((t) => t.date <= date);
  const b = balances(txns);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold">Period 1 Apr 2026 → <span className="num">{nzDate(date)}</span></span>
          <input type="range" aria-label="Date" aria-valuetext={nzDate(DATES[i])} min={0} max={DATES.length - 1} value={i} onChange={(e) => setI(Number(e.target.value))} className="flex-1 accent-kowhai-600" />
        </div>
        {!final && <p className="mt-2 text-xs text-rose-700">Mid-year figures are <strong>before</strong> year-end adjustments: no depreciation, stocktake, accruals or tax. That&apos;s why profit looks higher. Slide to 31 March to see the final, adjusted statements.</p>}
      </Card>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "pl", label: "Profit & loss" }, { id: "bs", label: "Balance sheet" }]} />
      {tab === "pl" ? <ProfitAndLossView b={b} period={`for the period 1 April 2026 to ${nzDate(date)}`} /> : <BalanceSheetView b={b} date={nzDate(date)} />}
    </div>
  );
}

/* ───────────── Ratios ───────────── */

export function RatiosTool() {
  const b = balances(BEFORE_CLOSING);
  const pl = profitAndLoss(b);
  const bs = balanceSheet(b, { splitLoan: true });
  const wages = b["600"] + b["601"] + b["602"] + b["605"];
  const quickAssets = bs.currentAssetsTotal - b["130"] - b["135"] - b["136"];
  const debtors = b["120"] + b["125"];
  const creditPurch = pl.purchasesTotal;
  const ratios = [
    { name: "Gross margin", v: pct(pl.grossMargin), f: "Gross profit ÷ revenue", m: "How much of each sales dollar is left after the cost of the coffee and food. Cafés typically aim for 65–72%.", good: pl.grossMargin > 0.65 },
    { name: "Net profit margin (after tax)", v: pct(pl.profitAfterTax / pl.revenueTotal), f: "Net profit after tax ÷ revenue", m: "The bottom line per dollar of sales. Small hospitality businesses often run at 5–10%." , good: true },
    { name: "Wages % of sales (incl shareholder salaries)", v: pct(wages / pl.revenueTotal), f: "All wages & salaries ÷ revenue", m: "The biggest cost in hospitality. 30–40% is common, and over 40% is a warning.", good: wages / pl.revenueTotal < 0.42 },
    { name: "Rent % of sales", v: pct(b["610"] / pl.revenueTotal), f: "Rent ÷ revenue", m: "A rule of thumb for cafés is under 10%.", good: b["610"] / pl.revenueTotal < 0.1 },
    { name: "Current ratio", v: (bs.currentAssetsTotal / bs.currentLiabilitiesTotal).toFixed(2) + " : 1", f: "Current assets ÷ current liabilities", m: "Can the café pay what's due in the next 12 months? Above 1.5 is comfortable.", good: bs.currentAssetsTotal / bs.currentLiabilitiesTotal > 1.2 },
    { name: "Quick (acid-test) ratio", v: (quickAssets / bs.currentLiabilitiesTotal).toFixed(2) + " : 1", f: "(Current assets − stock − prepayments) ÷ current liabilities", m: "Like the current ratio but only counting assets that are quickly turned into cash.", good: quickAssets / bs.currentLiabilitiesTotal > 1 },
    { name: "Debt to equity", v: (bs.totalLiabilities / bs.equityTotal).toFixed(2) + " : 1", f: "Total liabilities ÷ total equity", m: "How much of the business is funded by others vs owners. Banks like to see under 2:1.", good: bs.totalLiabilities / bs.equityTotal < 2 },
    { name: "Return on equity", v: pct(pl.profitAfterTax / bs.equityTotal), f: "Net profit after tax ÷ equity", m: "The return the owners earn on the money they've left in the business.", good: true },
    { name: "Debtor days", v: Math.round((debtors / (b["410"] ? -b["410"] : 1)) * 365) + " days", f: "Debtors ÷ credit sales × 365", m: "How long credit customers take to pay. Only catering is on credit here.", good: true },
    { name: "Creditor days", v: Math.round((-b["200"] / (creditPurch * 1.15)) * 365) + " days", f: "Creditors ÷ credit purchases (incl GST) × 365", m: "How long the café takes to pay suppliers. Terms are 20th of the month following (about 35 days).", good: true },
    { name: "Stock turnover", v: Math.round((b["130"] / pl.cogs) * 365) + " days", f: "Closing stock ÷ COGS × 365", m: "How many days of stock is on hand. Cafés turn stock fast; perishables should be days, not weeks.", good: true },
  ];
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-stone-600">Ratios turn the statements into insight by comparing numbers with each other and with industry norms. All of these are calculated from Kōwhai&apos;s final, adjusted figures.</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ratios.map((r) => (
          <Card key={r.name}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold">{r.name}</div>
              <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold", r.good ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>{r.good ? "✓ healthy" : "⚠ watch"}</span>
            </div>
            <div className="num mt-1 text-3xl font-bold">{r.v}</div>
            <div className="mt-1 text-xs font-medium text-stone-500">{r.f}</div>
            <div className="mt-2 text-sm text-stone-700">{r.m}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Loan ───────────── */

export function LoanTool() {
  const rows = LOAN_SCHEDULE.rows;
  const total = rows.reduce((s, r) => s + r.interest, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="prose-learn text-[16px]">
        <p>Kōwhai borrowed <strong>{money(LOAN.principal, { dp: 0 })}</strong> at <strong>{pct(LOAN.rate)}</strong> over <strong>{LOAN.months} months</strong>. It&apos;s a <em>table loan</em>: every repayment is the same ({money(LOAN_SCHEDULE.payment)}), but the split changes. Early on, most of the payment is interest. Later, most of it is principal.</p>
        <p>Total interest over 5 years: <strong>{money(total)}</strong>.</p>
        <Callout kind="rule" title="In the books">Each month: Dr Interest expense (the interest part), Dr Bank loan (the principal part), Cr Bank (the payment). At year end the loan is split on the balance sheet. The next 12 months&apos; principal ({money(rows.slice(12, 24).reduce((s, r) => s + r.principal, 0))}) is a <strong>current liability</strong>, and the rest is non-current.</Callout>
        <Callout kind="nz" title="Tax">Interest on business borrowing is deductible. It&apos;s an exempt financial service, so there&apos;s no GST.</Callout>
      </div>
      <div className="max-h-[36rem] overflow-y-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-stone-50"><tr className="text-left uppercase tracking-wider text-stone-500"><th className="px-3 py-2">#</th><th className="text-right">Opening</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="w-40 px-2">Split of payment</th><th className="px-3 text-right">Closing</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className={cx("border-t border-stone-100", r.n <= 12 && "bg-kowhai-50/60")}>
                <td className="px-3 py-0.5">{r.n}</td>
                <td className="num text-right">{num(r.opening)}</td>
                <td className="num text-right">{num(r.interest)}</td>
                <td className="num text-right">{num(r.principal)}</td>
                <td className="px-2"><div className="flex h-2 overflow-hidden rounded"><span className="bg-amber-500" style={{ width: `${(r.interest / r.payment) * 100}%` }} /><span className="border-l-2 border-white bg-rose-500" style={{ width: `${(r.principal / r.payment) * 100}%` }} /></div></td>
                <td className="num px-3 text-right">{num(r.closing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sticky bottom-0 flex gap-4 border-t bg-white px-3 py-1 text-xs text-stone-600"><span><i className="mr-1 inline-block h-2 w-2 bg-amber-500" />Interest (expense)</span><span><i className="mr-1 inline-block h-2 w-2 bg-rose-500" />Principal (reduces liability)</span><span className="ml-auto">Shaded rows = this financial year</span></div>
      </div>
    </div>
  );
}

/* ───────────── Break-even ───────────── */

export function BreakEvenTool() {
  const b = balances(BEFORE_CLOSING);
  const pl = profitAndLoss(b);
  const varRate0 = (pl.cogs + b["622"]) / pl.revenueTotal;
  const fixedAnnual = pl.expensesTotal - b["622"];
  const [avg, setAvg] = useState(14);
  const [varRate, setVarRate] = useState(Math.round(varRate0 * 100) / 100);
  const [fixed, setFixed] = useState(Math.round(fixedAnnual / 12));
  const cm = 1 - varRate;
  const beSales = fixed / cm;
  const days = 26;
  const perDay = beSales / days / avg;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="prose-learn text-[16px]">
        <p><strong>Break-even</strong> is the level of sales where profit is exactly zero. It splits costs into:</p>
        <ul>
          <li><strong>Variable costs</strong>: rise with every sale (coffee, milk, food, cups, card fees). Kōwhai&apos;s are about {pct(varRate0)} of sales.</li>
          <li><strong>Fixed costs</strong>: the same whether you sell 10 coffees or 1,000 (rent, salaries, insurance, depreciation, loan interest). About {money(fixedAnnual / 12, { dp: 0 })} a month.</li>
        </ul>
        <p>Each sales dollar leaves a <strong>contribution margin</strong> of (1 − variable %) to cover fixed costs. Break-even sales = fixed costs ÷ contribution margin.</p>
        <Callout kind="tip" title="Use it">Try raising the average spend by $1, or adding a $4,000/month barista, and see how many extra customers you need.</Callout>
      </div>
      <Card>
        <h3 className="mb-3 text-lg font-bold">Break-even calculator (monthly)</h3>
        <div className="space-y-3 text-sm">
          <label className="block">Average spend per customer (excl GST): <strong className="num">{money(avg)}</strong><input type="range" min={5} max={30} step={0.5} value={avg} onChange={(e) => setAvg(Number(e.target.value))} className="w-full accent-kowhai-600" /></label>
          <label className="block">Variable costs as % of sales: <strong>{pct(varRate)}</strong><input type="range" min={0.15} max={0.6} step={0.01} value={varRate} onChange={(e) => setVarRate(Number(e.target.value))} className="w-full accent-kowhai-600" /></label>
          <label className="block">Fixed costs per month: <strong className="num">{money(fixed, { dp: 0 })}</strong><input type="range" min={5000} max={40000} step={250} value={fixed} onChange={(e) => setFixed(Number(e.target.value))} className="w-full accent-kowhai-600" /></label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-kowhai-50 p-3"><div className="text-xs text-stone-500">Break-even sales / month</div><div className="num text-2xl font-bold">{money(beSales, { dp: 0 })}</div></div>
          <div className="rounded-xl bg-kowhai-50 p-3"><div className="text-xs text-stone-500">Customers per day ({days} trading days)</div><div className="num text-2xl font-bold">{Math.ceil(perDay)}</div></div>
        </div>
        <p className="mt-3 text-xs text-stone-500">Actual average monthly sales this year: {money(pl.revenueTotal / 12, { dp: 0 })}, which is {pct(pl.revenueTotal / 12 / beSales - 1)} {pl.revenueTotal / 12 > beSales ? "above" : "below"} break-even at these settings.</p>
      </Card>
    </div>
  );
}
