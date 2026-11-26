import type { ReactNode } from "react";
import { BUSINESS } from "@/data/business";
import type { Balances } from "@/lib/engine/ledger";
import type { Transaction } from "@/lib/engine/types";
import { balanceSheet, cashFlowDirect, changesInEquityFor, profitAndLoss, type Line } from "@/lib/engine/statements";
import { money, num, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Term } from "@/components/learn/Term";

/**
 * Financial statements with comparatives: this year beside last year.
 * Columns: label | this year | last year.
 */

type Pair = { label: ReactNode; key: string; now?: number; prev?: number };

function merge(now: Line[], prev: Line[]): Pair[] {
  const keys = [...new Set([...now.map((l) => l.label), ...prev.map((l) => l.label)])];
  return keys.map((k) => ({ key: k, label: k, now: now.find((l) => l.label === k)?.amount ?? 0, prev: prev.find((l) => l.label === k)?.amount ?? 0 }));
}

function Row({ label, now, prev, bold, indent = 0, total, double }: { label: ReactNode; now?: number; prev?: number; bold?: boolean; indent?: number; total?: boolean; double?: boolean }) {
  const cell = (v?: number, muted?: boolean) => (
    <div className={cx("num text-right", muted && "text-stone-500", total && "border-t border-stone-400", double && "border-b-4 border-double border-stone-500")}>{v === undefined ? "" : Math.abs(v) < 0.005 ? "–" : money(v, { dp: 0 })}</div>
  );
  return (
    <div className={cx("grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] items-baseline gap-2 py-0.5 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_7rem]", bold && "font-semibold")}>
      <div style={{ paddingLeft: indent * 16 }}>{label}</div>
      {cell(now)}
      {cell(prev, true)}
    </div>
  );
}

function Frame({ title, subtitle, years, children }: { title: string; subtitle: string; years: [string, string]; children: ReactNode }) {
  return (
    <div className="doc-paper mx-auto max-w-3xl rounded-sm px-4 py-6 sm:px-10">
      <div className="mb-4 text-center">
        <div className="text-sm font-semibold uppercase tracking-wider text-stone-500">{BUSINESS.name}</div>
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-sm text-stone-500">{subtitle}</div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_5.5rem] gap-2 border-b-2 border-stone-700 pb-1 text-right text-xs font-bold uppercase tracking-wider text-stone-500 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
        <span />
        <span>{years[0]}</span>
        <span>{years[1]}</span>
      </div>
      {children}
    </div>
  );
}

const H = ({ children }: { children: ReactNode }) => <div className="mt-4 border-b border-stone-200 pb-0.5 text-xs font-bold uppercase tracking-wider text-stone-500">{children}</div>;
const YEARS: [string, string] = ["2028", "2027"];

export function ComparativePL({ now, prev }: { now: Balances; prev: Balances }) {
  const a = profitAndLoss(now), b = profitAndLoss(prev);
  const groups = [...new Set([...a.expenseGroups.map((g) => g.group), ...b.expenseGroups.map((g) => g.group)])];
  return (
    <Frame title="Statement of Financial Performance" subtitle="(Profit & Loss) for the year ended 31 March 2028" years={YEARS}>
      <H>Revenue</H>
      {merge(a.revenue, b.revenue).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="Total revenue" now={a.revenueTotal} prev={b.revenueTotal} bold />
      <H>Less <Term k="cost-of-goods-sold">cost of sales</Term></H>
      <Row label="Opening stock" now={a.openingStock} prev={b.openingStock} indent={1} />
      {merge(a.purchases, b.purchases).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="Less closing stock" now={a.stockMovement} prev={b.stockMovement} indent={1} />
      <Row label="Cost of goods sold" now={-a.cogs} prev={-b.cogs} bold />
      <Row label={<>Gross profit <span className="text-xs font-normal text-stone-500">({pct(a.grossMargin)} vs {pct(b.grossMargin)})</span></>} now={a.grossProfit} prev={b.grossProfit} bold total />
      <H>Plus other income</H>
      {merge(a.otherIncome, b.otherIncome).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <H>Less expenses</H>
      {groups.map((g) => {
        const ga = a.expenseGroups.find((x) => x.group === g)?.lines ?? [];
        const gb = b.expenseGroups.find((x) => x.group === g)?.lines ?? [];
        return (
          <div key={g}>
            <div className="pl-4 pt-1 text-xs font-semibold text-stone-500">{g}</div>
            {merge(ga, gb).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={2} />)}
          </div>
        );
      })}
      <Row label="Total expenses" now={-a.expensesTotal} prev={-b.expensesTotal} bold total />
      <Row label="Net profit before tax" now={a.profitBeforeTax} prev={b.profitBeforeTax} bold total />
      <Row label="Less income tax expense" now={-a.tax} prev={-b.tax} indent={1} />
      <Row label={<Term k="net-profit">Net profit after tax</Term>} now={a.profitAfterTax} prev={b.profitAfterTax} bold total double />
    </Frame>
  );
}

export function ComparativeBS({ now, prev }: { now: Balances; prev: Balances }) {
  const a = balanceSheet(now, { splitLoan: true, loanMonthIndex: 24 });
  const b = balanceSheet(prev, { splitLoan: true, loanMonthIndex: 12 });
  const ppe = [...new Set([...a.ppe.map((p) => p.label), ...b.ppe.map((p) => p.label)])];
  return (
    <Frame title="Statement of Financial Position" subtitle="(Balance Sheet) as at 31 March 2028" years={YEARS}>
      <H>Current assets</H>
      {merge(a.currentAssets, b.currentAssets).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="Total current assets" now={a.currentAssetsTotal} prev={b.currentAssetsTotal} bold />
      <H>Non-current assets</H>
      {ppe.map((l) => <Row key={l} label={`${l} (book value)`} now={a.ppe.find((p) => p.label === l)?.nbv ?? 0} prev={b.ppe.find((p) => p.label === l)?.nbv ?? 0} indent={1} />)}
      {merge(a.otherNonCurrent, b.otherNonCurrent).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="Total non-current assets" now={a.nonCurrentTotal} prev={b.nonCurrentTotal} bold />
      <Row label="TOTAL ASSETS" now={a.totalAssets} prev={b.totalAssets} bold total />
      <H>Current liabilities</H>
      {merge(a.currentLiabilities, b.currentLiabilities).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="Total current liabilities" now={a.currentLiabilitiesTotal} prev={b.currentLiabilitiesTotal} bold />
      <H>Non-current liabilities</H>
      {merge(a.nonCurrentLiabilities, b.nonCurrentLiabilities).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="TOTAL LIABILITIES" now={a.totalLiabilities} prev={b.totalLiabilities} bold total />
      <Row label="NET ASSETS" now={a.netAssets} prev={b.netAssets} bold total double />
      <H>Equity</H>
      {merge(a.equityLines, b.equityLines).map((p) => <Row key={p.key} label={p.label} now={p.now} prev={p.prev} indent={1} />)}
      <Row label="TOTAL EQUITY" now={a.equityTotal} prev={b.equityTotal} bold total double />
      <div className={cx("mt-3 rounded-lg px-3 py-2 text-center text-sm font-semibold", a.balanced && b.balanced ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
        {a.balanced && b.balanced ? "✓ Both years balance: net assets = total equity" : "✗ Does not balance"}
      </div>
    </Frame>
  );
}

export function ComparativeCashFlow({ now, prev, cashNow, cashPrev }: { now: Transaction[]; prev: Transaction[]; cashNow: [number, number]; cashPrev: [number, number] }) {
  const a = cashFlowDirect(now), b = cashFlowDirect(prev);
  return (
    <Frame title="Statement of Cash Flows" subtitle="Direct method · year ended 31 March 2028" years={YEARS}>
      {a.sections.map((s, i) => {
        const t = b.sections[i];
        const keys = [...new Set([...s.lines.map((l) => l.key), ...t.lines.map((l) => l.key)])];
        return (
          <div key={s.section}>
            <H>Cash flows from {s.section} activities</H>
            {keys.map((k) => {
              const la = s.lines.find((l) => l.key === k), lb = t.lines.find((l) => l.key === k);
              return <Row key={k} label={(la ?? lb)!.label} now={la?.amount ?? 0} prev={lb?.amount ?? 0} indent={1} />;
            })}
            <Row label={`Net cash from ${s.section} activities`} now={s.total} prev={t.total} bold />
          </div>
        );
      })}
      <Row label="Net increase in cash" now={a.net} prev={b.net} bold total />
      <Row label="Cash at 1 April" now={cashNow[0]} prev={cashPrev[0]} />
      <Row label="Cash at 31 March (bank + till)" now={cashNow[1]} prev={cashPrev[1]} bold double />
    </Frame>
  );
}

export function ChangesInEquityY2({ opening, closing, profitAfterTax, dividends }: { opening: Balances; closing: Balances; profitAfterTax: number; dividends: number }) {
  const ce = changesInEquityFor({ openingLabel: "Opening balance 1 April 2027", opening, closing, profitAfterTax, dividends });
  return (
    <div className="doc-paper mx-auto max-w-3xl rounded-sm px-4 py-6 sm:px-10">
      <div className="mb-4 text-center">
        <div className="text-sm font-semibold uppercase tracking-wider text-stone-500">{BUSINESS.name}</div>
        <h3 className="text-xl font-bold">Statement of Changes in Equity</h3>
        <div className="text-sm text-stone-500">for the year ended 31 March 2028</div>
      </div>
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
          {ce.rows.filter((r) => r.share || r.retained || r.label.startsWith("Opening")).map((r) => (
            <tr key={r.label} className="border-b border-stone-100">
              <td className="py-1">{r.label === "Dividends" ? <Term k="dividend">Dividends paid</Term> : r.label}</td>
              <td className="num py-1 text-right">{num(r.share)}</td>
              <td className="num py-1 text-right">{num(r.retained)}</td>
              <td className="num py-1 text-right">{num(r.share + r.retained)}</td>
            </tr>
          ))}
          <tr className="border-b-4 border-double border-stone-500 font-semibold">
            <td className="py-1">Closing balance 31 March 2028</td>
            <td className="num py-1 text-right">{num(ce.closing.share)}</td>
            <td className="num py-1 text-right">{num(ce.closing.retained)}</td>
            <td className="num py-1 text-right">{num(ce.closing.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
