"use client";

import type { ReactNode } from "react";
import { BUSINESS } from "@/data/business";
import type { Balances, TBRow } from "@/lib/engine/ledger";
import type { Transaction } from "@/lib/engine/types";
import { balanceSheet, cashFlowDirect, cashFlowIndirect, changesInEquity, profitAndLoss } from "@/lib/engine/statements";
import { money, num, pct } from "@/lib/money";
import { TYPE_STYLE, cx } from "@/lib/ui";
import { Term } from "@/components/learn/Term";

function Row({ label, amount, bold, indent, total, double, note, sub }: { label: ReactNode; amount?: number; bold?: boolean; indent?: number; total?: boolean; double?: boolean; note?: ReactNode; sub?: number }) {
  return (
    <div className={cx("grid grid-cols-[1fr_7rem_7rem] items-baseline gap-2 py-0.5 text-sm", bold && "font-semibold")}>
      <div style={{ paddingLeft: (indent ?? 0) * 16 }}>
        {label}
        {note && <span className="ml-2 text-xs font-normal text-stone-500">{note}</span>}
      </div>
      <div className="num text-right text-stone-600">{sub !== undefined ? money(sub) : ""}</div>
      <div className={cx("num text-right", total && "border-t border-stone-400", double && "border-b-4 border-double border-stone-500")}>{amount !== undefined ? money(amount) : ""}</div>
    </div>
  );
}

function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="doc-paper mx-auto max-w-3xl rounded-sm px-6 py-6 sm:px-10">
      <div className="mb-4 text-center">
        <div className="text-sm font-semibold uppercase tracking-wider text-stone-500">{BUSINESS.name}</div>
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-sm text-stone-500">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

const H = ({ children }: { children: ReactNode }) => <div className="mt-4 border-b border-stone-200 pb-0.5 text-xs font-bold uppercase tracking-wider text-stone-500">{children}</div>;

export function ProfitAndLossView({ b, period = "for the year ended 31 March 2027" }: { b: Balances; period?: string }) {
  const pl = profitAndLoss(b);
  return (
    <Frame title="Statement of Financial Performance" subtitle={`(Profit & Loss) ${period}`}>
      <H>Revenue</H>
      {pl.revenue.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="Total revenue" amount={pl.revenueTotal} bold />
      <H>Less <Term k="cost-of-goods-sold">cost of sales</Term></H>
      <Row label="Opening stock" sub={0} indent={1} />
      {pl.purchases.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="Less closing stock" sub={pl.stockMovement} indent={1} note="(from the stocktake)" />
      <Row label="Cost of goods sold" amount={-pl.cogs} bold />
      <Row label={<Term k="gross-profit">Gross profit</Term>} amount={pl.grossProfit} bold total note={`${pct(pl.grossMargin)} gross margin`} />
      {pl.otherIncome.length > 0 && (
        <>
          <H>Plus other income</H>
          {pl.otherIncome.map((l) => <Row key={l.label} label={l.label} amount={l.amount} indent={1} />)}
        </>
      )}
      <H>Less expenses</H>
      {pl.expenseGroups.map((g) => (
        <div key={g.group}>
          <div className="pl-4 pt-1 text-xs font-semibold text-stone-500">{g.group}</div>
          {g.lines.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={2} />)}
        </div>
      ))}
      <Row label="Total expenses" amount={-pl.expensesTotal} bold total />
      <Row label="Net profit before tax" amount={pl.profitBeforeTax} bold total />
      <Row label="Less income tax expense" amount={-pl.tax} indent={1} />
      <Row label={<Term k="net-profit">Net profit after tax</Term>} amount={pl.profitAfterTax} bold total double />
    </Frame>
  );
}

export function BalanceSheetView({ b, date = "31 March 2027" }: { b: Balances; date?: string }) {
  const bs = balanceSheet(b, { splitLoan: true });
  return (
    <Frame title="Statement of Financial Position" subtitle={`(Balance Sheet) as at ${date}`}>
      <H>Current assets</H>
      {bs.currentAssets.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="Total current assets" amount={bs.currentAssetsTotal} bold />
      <H>Non-current assets</H>
      {bs.ppe.map((p) => (
        <div key={p.label}>
          <Row label={p.label} indent={1} note={`cost ${money(p.cost, { dp: 0 })} less acc. depn ${money(-p.accDep, { dp: 0 })}`} sub={p.nbv} />
        </div>
      ))}
      {bs.otherNonCurrent.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="Total non-current assets" amount={bs.nonCurrentTotal} bold />
      <Row label="TOTAL ASSETS" amount={bs.totalAssets} bold total />
      <H>Current liabilities</H>
      {bs.currentLiabilities.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="Total current liabilities" amount={bs.currentLiabilitiesTotal} bold />
      <H>Non-current liabilities</H>
      {bs.nonCurrentLiabilities.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="Total non-current liabilities" amount={bs.nonCurrentLiabilitiesTotal} bold />
      <Row label="TOTAL LIABILITIES" amount={bs.totalLiabilities} bold total />
      <Row label="NET ASSETS" amount={bs.netAssets} bold total double />
      <H>Equity</H>
      {bs.equityLines.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
      <Row label="TOTAL EQUITY" amount={bs.equityTotal} bold total double />
      <div className={cx("mt-3 rounded-lg px-3 py-2 text-center text-sm font-semibold", bs.balanced ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
        {bs.balanced ? "✓ Net assets = Total equity: the balance sheet balances" : "✗ Does not balance"}
      </div>
    </Frame>
  );
}

export function CashFlowView({ txns, b }: { txns: Transaction[]; b: Balances }) {
  const direct = cashFlowDirect(txns);
  const ind = cashFlowIndirect(txns);
  const opening = 0;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Frame title="Statement of Cash Flows" subtitle="Direct method · year ended 31 March 2027">
        {direct.sections.map((s) => (
          <div key={s.section}>
            <H>Cash flows from {s.section} activities</H>
            {s.lines.map((l) => <Row key={l.key} label={l.label} sub={l.amount} indent={1} />)}
            <Row label={`Net cash from ${s.section} activities`} amount={s.total} bold />
          </div>
        ))}
        <Row label="Net increase in cash" amount={direct.net} bold total />
        <Row label="Cash at 1 April 2026" amount={opening} />
        <Row label="Cash at 31 March 2027 (bank + till)" amount={b["100"] + b["105"]} bold double />
      </Frame>
      <Frame title="Operating cash flow" subtitle="Indirect method (reconciliation from profit)">
        <Row label="Net profit after tax" amount={ind.profit} bold />
        <H>Add back non-cash expenses</H>
        {ind.nonCashItems.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} note={l.label.startsWith("Shareholder") ? "(credited to current accounts, not paid in cash)" : undefined} />)}
        <H>Movements in working capital</H>
        {ind.workingCapital.map((l) => <Row key={l.label} label={l.label} sub={l.amount} indent={1} />)}
        <Row label="Net cash from operating activities" amount={ind.operating} bold total double />
        <p className="mt-4 text-sm text-stone-600">
          The two methods arrive at the same operating cash flow. The direct method shows <em>where</em> cash came from. The indirect method explains <em>why profit ≠ cash</em>: an increase in an asset (like stock) uses cash, and an increase in a liability (like GST owed) keeps cash in the bank for now.
        </p>
      </Frame>
    </div>
  );
}

export function ChangesInEquityView({ b, profitAfterTax }: { b: Balances; profitAfterTax: number }) {
  const ce = changesInEquity(b, profitAfterTax);
  return (
    <Frame title="Statement of Changes in Equity" subtitle="for the year ended 31 March 2027">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-stone-700 text-right text-xs uppercase tracking-wider text-stone-500">
            <th className="py-1 text-left"></th>
            <th className="py-1">Share capital</th>
            <th className="py-1">Retained earnings</th>
            <th className="py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {ce.rows.map((r) => (
            <tr key={r.label} className="border-b border-stone-100">
              <td className="py-1">{r.label}</td>
              <td className="num py-1 text-right">{num(r.share)}</td>
              <td className="num py-1 text-right">{num(r.retained)}</td>
              <td className="num py-1 text-right">{num(r.share + r.retained)}</td>
            </tr>
          ))}
          <tr className="border-b-4 border-double border-stone-500 font-semibold">
            <td className="py-1">Closing balance 31 March 2027</td>
            <td className="num py-1 text-right">{num(ce.closing.share)}</td>
            <td className="num py-1 text-right">{num(ce.closing.retained)}</td>
            <td className="num py-1 text-right">{num(ce.closing.total)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-sm text-stone-600">No <Term k="dividend">dividends</Term> were declared this year, so all the profit is retained.</p>
    </Frame>
  );
}

export function TrialBalanceTable({ rows, debit, credit, highlight }: { rows: TBRow[]; debit: number; credit: number; highlight?: Set<string> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-stone-700 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <th className="px-3 py-2 text-left">Code</th>
            <th className="px-3 py-2 text-left">Account</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-right">Debit</th>
            <th className="px-3 py-2 text-right">Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = TYPE_STYLE[r.account.type];
            return (
              <tr key={r.account.code} className={cx("border-b border-stone-100", highlight?.has(r.account.code) && "bg-kowhai-100")}>
                <td className="num px-3 py-1">{r.account.code}</td>
                <td className="px-3 py-1">{r.account.name}</td>
                <td className="px-3 py-1"><span className={cx("rounded px-1.5 py-0.5 text-[11px] font-semibold", s.soft, s.text)}>{s.label}</span></td>
                <td className="num px-3 py-1 text-right">{r.debit ? num(r.debit) : ""}</td>
                <td className="num px-3 py-1 text-right">{r.credit ? num(r.credit) : ""}</td>
              </tr>
            );
          })}
          <tr className="bg-stone-50 font-bold">
            <td colSpan={3} className="px-3 py-2 text-right">TOTALS</td>
            <td className="num border-b-4 border-double border-stone-500 px-3 py-2 text-right">{num(debit)}</td>
            <td className="num border-b-4 border-double border-stone-500 px-3 py-2 text-right">{num(credit)}</td>
          </tr>
        </tbody>
      </table>
      <div className={cx("px-3 py-2 text-center text-sm font-semibold", Math.abs(debit - credit) < 0.005 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
        {Math.abs(debit - credit) < 0.005 ? "✓ Total debits = total credits" : `✗ Out of balance by ${money(debit - credit)}`}
      </div>
    </div>
  );
}
