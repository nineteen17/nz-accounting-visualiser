/**
 * Kōwhai's budget for year 2 (1 April 2027 – 31 March 2028), and how the year actually went.
 *
 * Aroha and Ben set the budget in March 2027 from year 1's actual figures plus what they
 * already knew (the pay rises, the lease, the loan schedule). Every budget figure is worked
 * out here from the books, with the reason it was set that way. Every big difference from
 * the actual result is explained from the year 2 transactions.
 */
import { balances, type Balances } from "@/lib/engine/ledger";
import { money, pct, r2 } from "@/lib/money";
import { assetYear, assetYearOne } from "@/lib/nz/assets";
import { COMPANY_TAX_RATE } from "@/lib/nz/rates";
import { ACCOUNTS } from "../chartOfAccounts";
import { FIXED_ASSETS } from "../business";
import { BEFORE_CLOSING as Y1_BEFORE } from "./index";
import * as Y2 from "./year2";
import { PAY_RUNS as Y1_PAY_RUNS } from "./year";
import { LOAN_SCHEDULE } from "./april";

/** the café's own planning assumptions (not official rates) */
export const ASSUMPTIONS = {
  /** café sales growth: a full year of regulars plus a small price rise */
  salesGrowth: 0.05,
  /** general price rises on running costs */
  inflation: 0.03,
};

const y1 = balances(Y1_BEFORE);
const y2 = balances(Y2.BEFORE_CLOSING);
const $0 = (x: number) => money(x, { dp: 0 });
const round = (x: number, to = 1) => Math.round(x / to) * to;

/** income accounts hold credits (negative), so flip them to show as positive amounts */
const amount = (b: Balances, code: string) => {
  const a = ACCOUNTS.find((x) => x.code === code)!;
  return r2((a.type === "income" ? -1 : 1) * (b[code] ?? 0));
};
const COS_CODES = ["510", "511", "512", "513", "518", "519"];
const cos = (b: Balances) => r2(COS_CODES.reduce((s, c) => s + (b[c] ?? 0), 0));

/* ───────────── what the budget was built from ───────────── */

const salesY1 = amount(y1, "400");
const salesBudget = round(salesY1 * (1 + ASSUMPTIONS.salesGrowth), 100);
const salesActual = amount(y2, "400");
/** cost of sales and card fees move with sales */
const cosRate = cos(y1) / salesY1;
const feeRate = amount(y1, "622") / salesY1;
/** purchases alone, and how much stock grew (stock built up comes off cost of sales) */
const PURCHASE_CODES = ["510", "511", "512", "513"];
const purchases = (b: Balances) => r2(PURCHASE_CODES.reduce((s, c) => s + (b[c] ?? 0), 0));
const stockGrowth = (b: Balances) => r2(-((b["518"] ?? 0) + (b["519"] ?? 0)));
export const STOCK = {
  purchasesShare: { y1: purchases(y1) / salesY1, y2: purchases(y2) / salesActual },
  growth: { y1: stockGrowth(y1), y2: stockGrowth(y2) },
  cosShare: { y1: cos(y1) / salesY1, y2: cos(y2) / salesActual },
};

// pay rises from 6 April 2027, weighted by what each person earned in year 1
const y1Gross = (id: string) => Y1_PAY_RUNS.reduce((s, run) => s + run.results.filter((r) => r.employee.id === id).reduce((t, r) => t + r.gross, 0), 0);
const payRise = Y2.RAISED.reduce((s, e) => s + y1Gross(e.id) * (e.rate / Y1_PAY_RUNS[0].results.find((r) => r.employee.id === e.id)!.employee.rate), 0)
  / Y2.RAISED.reduce((s, e) => s + y1Gross(e.id), 0);
const rateChange = (id: string) => {
  const was = Y1_PAY_RUNS[0].results.find((r) => r.employee.id === id)!.employee.rate;
  const now = Y2.RAISED.find((e) => e.id === id)!.rate;
  return `${money(was)} → ${money(now)}`;
};

// depreciation planned on the assets owned at 1 April 2027, with no sales or purchases
const depBudget = round(FIXED_ASSETS.reduce((s, a) => {
  const one = assetYearOne(a);
  return s + assetYear(a, { openingBook: one.closingBookValue, openingTax: one.closingTaxValue, firstYear: false, yearEnd: "2028-03-31" }).accounting;
}, 0));
const interestBudget = r2(LOAN_SCHEDULE.rows.slice(12, 24).reduce((s, r) => s + r.interest, 0));

// facts from the year 2 books, for the explanations
const y2Payroll = Y2.BEFORE_CLOSING.filter((t) => t.book === "payroll");
const leaveFromAccrual = r2(y2Payroll.flatMap((t) => t.lines).filter((l) => l.account === "220").reduce((s, l) => s + (l.debit ?? 0), 0));
const posBought = Y2.BEFORE_CLOSING.flatMap((t) => t.lines).some((l) => l.account === "175" && (l.debit ?? 0) > 0);

/* ───────────── the lines ───────────── */

export type Section = "Revenue" | "Cost of sales" | "Other income" | "Expenses";

export interface BudgetLine {
  code: string;
  label: string;
  section: Section;
  income: boolean;
  lastYear: number;
  budget: number;
  actual: number;
  /** how the budget figure was set */
  basis: string;
  /** why the actual result differs (for the big differences) */
  why?: string;
  /** moves with sales: a flexible budget scales it to the actual sales */
  variable?: boolean;
  /** the explanation once the budget is flexed, if it's different */
  whyFlexed?: string;
}

type Spec = { budget: number; basis: string; why?: string; variable?: boolean; whyFlexed?: string };
const same = (code: string, basis = "Same as last year."): Spec => ({ budget: round(amount(y1, code)), basis });
const plusInflation = (code: string): Spec => ({ budget: round(amount(y1, code) * (1 + ASSUMPTIONS.inflation)), basis: `Last year plus ${pct(ASSUMPTIONS.inflation, 0)} for price rises.` });

const wagesBudget = round(amount(y1, "600") * payRise);

const SPECS: Record<string, Spec> = {
  "400": {
    budget: salesBudget,
    basis: `Last year (${$0(salesY1)}) plus ${pct(ASSUMPTIONS.salesGrowth, 0)}: a full year of regulars and a small price rise, rounded to the nearest $100.`,
    why: `Sales grew ${pct(salesActual / salesY1 - 1)} on last year, a little more than the ${pct(ASSUMPTIONS.salesGrowth, 0)} planned.`,
  },
  "410": {
    ...same("410", "Same as last year: catering jobs are hard to predict."),
    why: "The Morgans' wedding (80 guests, $4,000) made catering a bigger year than last.",
  },
  cos: {
    budget: round(salesBudget * cosRate),
    variable: true,
    basis: `Last year's cost of sales was ${pct(cosRate)} of café sales; the same share of budgeted sales.`,
    why: `Partly because sales were higher: more coffee sold needs more beans and milk (flex the budget to take that out). The rest is a budgeting trap, explained when you flex.`,
    whyFlexed: `Purchases were ${pct(STOCK.purchasesShare.y1)} of sales in year 1 and ${pct(STOCK.purchasesShare.y2)} in year 2: no real change. But in year 1 the café built up ${$0(STOCK.growth.y1)} of stock from nothing, and stock built up comes off cost of sales, so year 1's ${pct(STOCK.cosShare.y1)} was flattered. This year stock grew by only ${$0(STOCK.growth.y2)}. The budget copied a first-year figure that couldn't repeat.`,
  },
  "450": { budget: 0, basis: "None: the term deposit matured in February 2027 and wasn't renewed." },
  "460": { budget: 0, basis: "None: selling the old POS system wasn't planned.", why: "The old POS system sold for more than its book value: a gain nobody budgets for." },
  "600": {
    budget: wagesBudget,
    basis: `Last year's wages plus the pay rises from 6 April (Mia ${rateChange("mia")}, Leo ${rateChange("leo")} an hour): ${pct(payRise - 1)} more.`,
    why: `Mia's annual leave (${money(leaveFromAccrual)}) was paid out of the holiday pay set aside last year, so it isn't in this year's wages: it was last year's cost, when she earned it.`,
  },
  "601": { budget: round(wagesBudget * Y2.YEAR2.rates.kiwiSaver.employerMinimum), basis: `${pct(Y2.YEAR2.rates.kiwiSaver.employerMinimum)} of the budgeted wages.` },
  "602": { budget: round(amount(y1, "602") * payRise), basis: "Last year plus the pay rises." },
  "605": {
    ...same("605", "Same as last year: shareholder salaries are decided at year end."),
    why: "The directors set higher shareholder salaries at year end because the café did better.",
  },
  "610": same("610", "The lease: fixed at the same rent."),
  "611": plusInflation("611"),
  "612": same("612", "Same as last year: a fixed monthly plan."),
  "613": plusInflation("613"),
  "614": same("614", "Same as last year: a fixed monthly contract."),
  "615": same("615", "Same as last year: a fixed monthly contract."),
  "616": { ...same("616"), why: "Nothing needed fixing this year." },
  "617": { ...same("617"), why: "No advertising was bought this year." },
  "618": {
    ...same("618"),
    why: "Last year only had the accountant's set-up fees. This year brought the first full bill for the annual accounts and tax returns (June). A new cost the budget missed.",
  },
  "619": same("619", "Same as last year: fixed subscriptions."),
  "620": { ...same("620"), why: "Last year's licence fee (registering the food control plan) wasn't charged again this year." },
  "621": same("621", "Same as last year: fixed monthly fees."),
  "622": { budget: round(salesBudget * feeRate), variable: true, basis: `Last year's card fees were ${pct(feeRate, 2)} of café sales; the same share of budgeted sales.` },
  "623": same("623"),
  "624": { budget: 0, basis: "None: last year's bad debt was a one-off." },
  "625": { budget: 0, basis: "None: last year's small items were part of setting up." },
  "626": {
    budget: depBudget,
    basis: "Each asset's book value at 1 April × its diminishing value rate, with no assets bought or sold.",
    why: posBought ? "The old POS system was sold halfway through the year (so only six months' depreciation) and a new one bought in October." : undefined,
  },
  "630": { budget: interestBudget, basis: "From the loan schedule: the interest in months 13–24." },
};

const LABELS: Record<string, string> = { cos: "Cost of sales" };
const section = (code: string): Section => {
  if (code === "cos") return "Cost of sales";
  const a = ACCOUNTS.find((x) => x.code === code)!;
  return a.subtype === "revenue" ? "Revenue" : a.subtype === "other-income" ? "Other income" : "Expenses";
};

export const SECTIONS: Section[] = ["Revenue", "Cost of sales", "Other income", "Expenses"];

export const BUDGET_LINES: BudgetLine[] = Object.entries(SPECS).map(([code, s]) => ({
  code,
  label: LABELS[code] ?? ACCOUNTS.find((a) => a.code === code)!.name,
  section: section(code),
  income: code !== "cos" && ACCOUNTS.find((a) => a.code === code)!.type === "income",
  lastYear: code === "cos" ? cos(y1) : amount(y1, code),
  actual: code === "cos" ? cos(y2) : amount(y2, code),
  ...s,
})).sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) || a.code.localeCompare(b.code));

/** every income and expense account used in either year is in the budget */
export const BUDGET_CODES = new Set([...Object.keys(SPECS).filter((c) => c !== "cos"), ...COS_CODES, "690"]);

export const SALES = { budget: salesBudget, actual: salesActual, lastYear: salesY1 };

/** a budget figure, flexed to the actual sales when asked (only lines that move with sales change) */
export const budgetFor = (l: BudgetLine, flex: boolean) => (flex && l.variable ? round(l.budget * (salesActual / salesBudget)) : l.budget);

/** actual minus budget, signed so that positive is good for profit */
export function variance(l: Pick<BudgetLine, "income" | "actual">, budget: number) {
  const v = r2(l.income ? l.actual - budget : budget - l.actual);
  return { amount: v, favourable: v > 0.004, nil: Math.abs(v) < 0.005 };
}

/** big enough to explain: $500 or more, or 10% or more of the budget (and at least $100) */
export const isMaterial = (v: number, budget: number) => Math.abs(v) >= 500 || (Math.abs(v) >= 100 && Math.abs(v) >= Math.abs(budget) * 0.1);

/** the whole budget statement: lines, subtotals, tax and profit */
export function budgetStatement(flex: boolean) {
  const lines = BUDGET_LINES.map((l) => ({ ...l, budget: budgetFor(l, flex), why: flex && l.whyFlexed ? l.whyFlexed : l.why }));
  const sum = (sec: Section, k: "budget" | "actual") => r2(lines.filter((l) => l.section === sec).reduce((s, l) => s + l[k], 0));
  const totals = (k: "budget" | "actual") => {
    const revenue = sum("Revenue", k);
    const grossProfit = r2(revenue - sum("Cost of sales", k));
    const otherIncome = sum("Other income", k);
    const expenses = sum("Expenses", k);
    const profitBeforeTax = r2(grossProfit + otherIncome - expenses);
    return { revenue, grossProfit, otherIncome, expenses, profitBeforeTax };
  };
  const budget = totals("budget"), actual = totals("actual");
  const tax = {
    budget: round(budget.profitBeforeTax * COMPANY_TAX_RATE),
    actual: amount(y2, "690"),
  };
  return {
    lines,
    budget: { ...budget, tax: tax.budget, profitAfterTax: r2(budget.profitBeforeTax - tax.budget) },
    actual: { ...actual, tax: tax.actual, profitAfterTax: r2(actual.profitBeforeTax - tax.actual) },
    taxBasis: `${pct(COMPANY_TAX_RATE, 0)} of budgeted profit before tax. The real tax is worked out on taxable income, after the tax adjustments (see the tax return).`,
  };
}
