import { ACCOUNTS } from "@/data/chartOfAccounts";
import type { Account, Transaction } from "./types";
import { balances, natural, type Balances } from "./ledger";
import { LOAN_SCHEDULE } from "@/data/books/april";

const c = (x: number) => Math.round(x * 100);
const d = (x: number) => x / 100;
const total = (rows: { amount: number }[]) => d(rows.reduce((s, r) => s + c(r.amount), 0));

export interface Line {
  label: string;
  amount: number;
  account?: Account;
  indent?: boolean;
}

function linesFor(b: Balances, pred: (a: Account) => boolean, sign = 1): Line[] {
  return ACCOUNTS.filter(pred)
    .map((a) => ({ label: a.name, amount: sign * natural(a, b[a.code]), account: a }))
    .filter((l) => Math.abs(l.amount) > 0.004);
}

/** Statement of Financial Performance (Profit & Loss) */
export function profitAndLoss(b: Balances) {
  const revenue = linesFor(b, (a) => a.subtype === "revenue");
  const revenueTotal = total(revenue);
  const purchases = linesFor(b, (a) => a.subtype === "cost-of-sales" && a.code !== "519");
  const purchasesTotal = total(purchases);
  const stockMovement = natural(ACCOUNTS.find((a) => a.code === "519")!, b["519"]); // negative = closing stock
  const cogs = d(c(purchasesTotal) + c(stockMovement));
  const grossProfit = d(c(revenueTotal) - c(cogs));
  const otherIncome = linesFor(b, (a) => a.subtype === "other-income");
  const otherIncomeTotal = total(otherIncome);
  const groups = new Map<string, Line[]>();
  for (const l of linesFor(b, (a) => a.subtype === "operating-expense" || a.subtype === "finance-cost")) {
    const g = l.account!.group ?? "Other";
    groups.set(g, [...(groups.get(g) ?? []), l]);
  }
  const expenseGroups = Array.from(groups.entries()).map(([group, lines]) => ({ group, lines, total: total(lines) }));
  const expensesTotal = d(expenseGroups.reduce((s, g) => s + c(g.total), 0));
  const profitBeforeTax = d(c(grossProfit) + c(otherIncomeTotal) - c(expensesTotal));
  const tax = natural(ACCOUNTS.find((a) => a.code === "690")!, b["690"]);
  const profitAfterTax = d(c(profitBeforeTax) - c(tax));
  return {
    revenue, revenueTotal,
    purchases, purchasesTotal, stockMovement, cogs,
    grossProfit, otherIncome, otherIncomeTotal,
    expenseGroups, expensesTotal,
    profitBeforeTax, tax, profitAfterTax,
    grossMargin: revenueTotal ? grossProfit / revenueTotal : 0,
  };
}

/** Principal due in the next 12 months – shown as a current liability */
export function loanCurrentPortion(asAtMonthIndex = 12) {
  return d(LOAN_SCHEDULE.rows.slice(asAtMonthIndex, asAtMonthIndex + 12).reduce((s, r) => s + c(r.principal), 0));
}

/** Statement of Financial Position (Balance Sheet).
 *  Pass `currentProfit` when income/expense accounts haven't been closed yet. */
export function balanceSheet(b: Balances, opts: { splitLoan?: boolean } = {}) {
  const currentAssets = linesFor(b, (a) => a.subtype === "current-asset");
  const ppe = ACCOUNTS.filter((a) => a.group === "Property, plant & equipment" && !a.contra).map((costAcc) => {
    const accDep = ACCOUNTS.find((x) => x.contra && x.group === costAcc.group && x.code === String(Number(costAcc.code) + 1))!;
    const cost = natural(costAcc, b[costAcc.code]);
    const dep = natural(accDep, b[accDep.code]); // negative
    return { label: costAcc.name.replace(" – cost", ""), cost, accDep: dep, nbv: d(c(cost) + c(dep)) };
  }).filter((x) => Math.abs(x.cost) > 0.004);
  const otherNonCurrent = linesFor(b, (a) => a.subtype === "non-current-asset" && a.group !== "Property, plant & equipment");
  const currentAssetsTotal = total(currentAssets);
  const ppeTotal = d(ppe.reduce((s, x) => s + c(x.nbv), 0));
  const nonCurrentTotal = d(c(ppeTotal) + c(total(otherNonCurrent)));
  const totalAssets = d(c(currentAssetsTotal) + c(nonCurrentTotal));

  const loanBal = -b["250"];
  const loanCurrent = opts.splitLoan && loanBal > 0 ? Math.min(loanBal, loanCurrentPortion()) : 0;
  const currentLiabilities = linesFor(b, (a) => a.subtype === "current-liability");
  if (loanCurrent) currentLiabilities.push({ label: "Bank loan – current portion", amount: loanCurrent });
  const nonCurrentLiabilities: Line[] = Math.abs(loanBal) > 0.004 ? [{ label: loanCurrent ? "Bank loan – non-current portion" : "Bank loan", amount: d(c(loanBal) - c(loanCurrent)) }] : [];
  const currentLiabilitiesTotal = total(currentLiabilities);
  const nonCurrentLiabilitiesTotal = total(nonCurrentLiabilities);
  const totalLiabilities = d(c(currentLiabilitiesTotal) + c(nonCurrentLiabilitiesTotal));
  const netAssets = d(c(totalAssets) - c(totalLiabilities));

  const equityLines = linesFor(b, (a) => a.type === "equity");
  const profit = d(
    ACCOUNTS.filter((a) => a.type === "income").reduce((s, a) => s - c(b[a.code]), 0) -
      ACCOUNTS.filter((a) => a.type === "expense").reduce((s, a) => s + c(b[a.code]), 0),
  );
  if (Math.abs(profit) > 0.004) equityLines.push({ label: "Current year profit (not yet closed)", amount: profit });
  const equityTotal = total(equityLines);
  return {
    currentAssets, currentAssetsTotal, ppe, ppeTotal, otherNonCurrent, nonCurrentTotal, totalAssets,
    currentLiabilities, currentLiabilitiesTotal, nonCurrentLiabilities, nonCurrentLiabilitiesTotal, totalLiabilities,
    netAssets, equityLines, equityTotal,
    balanced: c(netAssets) === c(equityTotal),
  };
}

export function changesInEquity(before: Balances, profitAfterTax: number) {
  const shareCapitalOpening = 0;
  const shareCapitalIssued = -before["300"];
  const retainedOpening = 0;
  return {
    rows: [
      { label: "Opening balance 1 April 2026", share: shareCapitalOpening, retained: retainedOpening },
      { label: "Shares issued", share: shareCapitalIssued, retained: 0 },
      { label: "Profit after tax for the year", share: 0, retained: profitAfterTax },
      { label: "Dividends paid", share: 0, retained: 0 },
    ],
    closing: { share: shareCapitalIssued, retained: profitAfterTax, total: d(c(shareCapitalIssued) + c(profitAfterTax)) },
  };
}

/* ───────────── Cash flow ───────────── */

export const CF_LABELS: Record<string, { label: string; section: "operating" | "investing" | "financing" }> = {
  customers: { label: "Receipts from customers (incl GST)", section: "operating" },
  "interest-received": { label: "Interest received", section: "operating" },
  suppliers: { label: "Payments to suppliers (incl GST)", section: "operating" },
  employees: { label: "Payments to employees (incl PAYE & KiwiSaver)", section: "operating" },
  "interest-paid": { label: "Interest paid", section: "operating" },
  gst: { label: "Net GST (paid to IRD, less GST on asset purchases)", section: "operating" },
  "income-tax": { label: "Income tax paid (incl RWT)", section: "operating" },
  ppe: { label: "Purchase of property, plant & equipment (excl GST)", section: "investing" },
  investments: { label: "Term deposit & lease bond", section: "investing" },
  shares: { label: "Shares issued", section: "financing" },
  borrowings: { label: "Loan drawn / repaid", section: "financing" },
  shareholders: { label: "Shareholder drawings", section: "financing" },
};

const OPERATING = new Set(["customers", "suppliers", "employees", "interest-received", "interest-paid", "income-tax"]);

/** Direct-method cash flow: each cash movement is labelled by the OTHER side of its entry.
 *  GST lines inside an entry are merged into the entry's main category (receipts/payments are shown incl GST). */
export function cashFlowDirect(txns: Transaction[]) {
  const acc = Object.fromEntries(ACCOUNTS.map((a) => [a.code, a]));
  const buckets: Record<string, number> = {};
  for (const t of txns) {
    const cashLines = t.lines.filter((l) => acc[l.account].cf === "cash");
    if (!cashLines.length) continue;
    const others = t.lines.filter((l) => acc[l.account].cf !== "cash");
    const nonGst = others.filter((l) => acc[l.account].cf !== "gst");
    const gstOnly = nonGst.length === 0;
    // allocate GST lines to the largest non-GST line's category
    const main = nonGst.slice().sort((a, b) => Math.abs((b.debit ?? 0) - (b.credit ?? 0)) - Math.abs((a.debit ?? 0) - (a.credit ?? 0)))[0];
    for (const l of others) {
      let tag: string = acc[l.account].cf;
      // GST on operating items is folded into receipts/payments; GST on assets stays in the GST line
      if (tag === "gst" && !gstOnly && OPERATING.has(acc[main.account].cf)) tag = acc[main.account].cf;
      if (tag === "none") tag = acc[main?.account ?? l.account].cf;
      const amt = c(l.credit ?? 0) - c(l.debit ?? 0);
      buckets[tag] = (buckets[tag] ?? 0) + amt;
    }
  }
  const sections = (["operating", "investing", "financing"] as const).map((s) => {
    const lines = Object.entries(CF_LABELS)
      .filter(([, v]) => v.section === s)
      .map(([k, v]) => ({ key: k, label: v.label, amount: d(buckets[k] ?? 0) }))
      .filter((l) => Math.abs(l.amount) > 0.004);
    return { section: s, lines, total: total(lines) };
  });
  const net = d(sections.reduce((s, x) => s + c(x.total), 0));
  return { sections, net };
}

/** Indirect method: start from profit and adjust for non-cash items and working-capital changes */
export function cashFlowIndirect(txns: Transaction[]) {
  const b = balances(txns);
  const profit = d(
    ACCOUNTS.filter((a) => a.type === "income").reduce((s, a) => s - c(b[a.code]), 0) -
      ACCOUNTS.filter((a) => a.type === "expense").reduce((s, a) => s + c(b[a.code]), 0),
  );
  // depreciation (cf "none") and shareholder salaries credited to current accounts are non-cash expenses
  const nonCashItems = ACCOUNTS.filter((a) => a.type === "expense" && (a.cf === "none" || a.cf === "shareholders"))
    .map((a) => ({ label: a.name, amount: d(c(b[a.code])) }))
    .filter((l) => Math.abs(l.amount) > 0.004);
  const nonCash = nonCashItems.reduce((s, l) => s + c(l.amount), 0);
  const opTags = new Set(["customers", "suppliers", "employees", "gst", "income-tax", "interest-received", "interest-paid"]);
  const wc = ACCOUNTS.filter((a) => (a.type === "asset" || a.type === "liability") && opTags.has(a.cf))
    .map((a) => ({
      label: (a.type === "asset" ? (b[a.code] > 0 ? "Increase in " : "Decrease in ") : (b[a.code] < 0 ? "Increase in " : "Decrease in ")) + a.name,
      amount: d(-c(b[a.code])),
      account: a,
    }))
    .filter((l) => Math.abs(l.amount) > 0.004);
  const operating = d(c(profit) + nonCash + wc.reduce((s, l) => s + c(l.amount), 0));
  return { profit, nonCashItems, workingCapital: wc, operating };
}
