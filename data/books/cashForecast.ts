/**
 * Kōwhai's cash flow forecast for year 2 (1 April 2027 – 31 March 2028), and what the bank really did.
 *
 * Aroha and Ben made the forecast in March 2027, alongside the budget (./budget.ts). A budget says
 * whether the year will make a profit; a cash forecast says whether there will be money in the bank
 * each month to pay the bills. They start from the same figures, then the forecast moves each one to
 * the month the money actually changes hands, and adds the things that are cash but not profit:
 * GST, loan repayments, tax instalments, drawings.
 *
 * The actual side comes straight from the bank and till entries in the year 2 books, grouped the same
 * way as the cash flow statement (lib/engine/statements.ts).
 */
import { gstPeriodsFor } from "@/lib/engine/gst";
import { cashFlowDirect } from "@/lib/engine/statements";
import type { Transaction } from "@/lib/engine/types";
import { money, monthName, pct, r2 } from "@/lib/money";
import { ACCOUNTS } from "../chartOfAccounts";
import { BEFORE_CLOSING as Y1_BEFORE } from "./index";
import * as Y2 from "./year2";
import { payDates } from "./generator";
import { LOAN_SCHEDULE } from "./april";
import { LOAN } from "../business";
import { BUDGET_LINES, SALES } from "./budget";

const $0 = (x: number) => money(x, { dp: 0 });
const GST_RATE = 0.15;
const GST_SHARE = 3 / 23;

/** the twelve months of year 2, as "2027-04" … "2028-03" */
export const MONTHS = Object.keys(Y2.YEAR2.sales);
const monthOf = (date: string) => date.slice(0, 7);
const Y1_MONTHS = MONTHS.map((m) => `${Number(m.slice(0, 4)) - 1}${m.slice(4)}`);

/* ───────────── the groups money is sorted into ───────────── */

export type Group = "customers" | "suppliers" | "employees" | "loan" | "gst" | "tax" | "drawings" | "dividends" | "assets";

export const GROUPS: { key: Group; label: string; tags: string[] }[] = [
  { key: "customers", label: "Money from customers (incl GST)", tags: ["customers", "interest-received"] },
  { key: "suppliers", label: "Stock and running costs (incl GST)", tags: ["suppliers"] },
  { key: "employees", label: "Wages, PAYE and KiwiSaver", tags: ["employees"] },
  { key: "loan", label: "Loan repayments (interest and principal)", tags: ["interest-paid", "borrowings"] },
  { key: "gst", label: "GST paid to IRD", tags: ["gst"] },
  { key: "tax", label: "Income tax (provisional tax)", tags: ["income-tax"] },
  { key: "drawings", label: "Shareholder drawings", tags: ["shareholders", "shares"] },
  { key: "dividends", label: "Dividend (and its RWT)", tags: ["dividends"] },
  { key: "assets", label: "Assets bought and sold", tags: ["ppe", "investments"] },
];
const groupOfTag = Object.fromEntries(GROUPS.flatMap((g) => g.tags.map((t) => [t, g.key]))) as Record<string, Group>;

type Row = Record<Group, number>;
const zero = (): Row => Object.fromEntries(GROUPS.map((g) => [g.key, 0])) as Row;

/** money in (+) and out (−) for a set of entries, by group */
function byGroup(txns: Transaction[]): Row {
  const row = zero();
  for (const s of cashFlowDirect(txns).sections) for (const l of s.lines) row[groupOfTag[l.key]] = r2(row[groupOfTag[l.key]] + l.amount);
  return row;
}
const inMonth = (txns: Transaction[], m: string) => txns.filter((t) => monthOf(t.date) === m);
const cashIn = (b: Record<string, number>) => r2(ACCOUNTS.filter((a) => a.cf === "cash").reduce((s, a) => s + (b[a.code] ?? 0), 0));

/* ───────────── what the forecast was built from (all known in March 2027) ───────────── */

/** bank and till on 1 April 2027: year 1's closing balance */
export const OPENING_CASH = cashIn(Y2.OPENING_BALANCES);

// year 1's real bank pattern, month by month: when customers paid and when suppliers were paid
const Y1_ROWS = Y1_MONTHS.map((m) => byGroup(inMonth(Y1_BEFORE, m)));
const shares = (g: Group) => {
  const total = Y1_ROWS.reduce((s, r) => s + r[g], 0);
  return Y1_ROWS.map((r) => r[g] / total);
};

const budget = (code: string) => BUDGET_LINES.find((l) => l.code === code)!.budget;
const gstOf = (code: string) => ACCOUNTS.find((a) => a.code === code)?.gst;

// customers: the budgeted café and catering sales, plus GST
const salesInclGst = r2((budget("400") + budget("410")) * (1 + GST_RATE));

// suppliers: budgeted stock purchases (cost of sales, assuming stock stays level) and running costs,
// plus GST on the ones that carry it. Wages, shareholder salaries, depreciation and interest aren't paid to suppliers.
const SUPPLIER_LINES = BUDGET_LINES.filter((l) => !l.income && (l.code === "cos" || ACCOUNTS.find((a) => a.code === l.code)?.cf === "suppliers"));
const supplierStandard = r2(SUPPLIER_LINES.filter((l) => l.code === "cos" || gstOf(l.code) === "standard").reduce((s, l) => s + l.budget, 0));
const supplierOther = r2(SUPPLIER_LINES.filter((l) => l.code !== "cos" && gstOf(l.code) !== "standard").reduce((s, l) => s + l.budget, 0));
const suppliersInclGst = r2(supplierStandard * (1 + GST_RATE) + supplierOther);

// employees: budgeted wages, employer KiwiSaver and holiday pay, paid on each fortnightly payday
const wagesBudget = r2(["600", "601", "602"].reduce((s, c) => s + budget(c), 0));
export const PAY_DAYS = payDates(Y2.YEAR2.firstPayDate, Y2.YEAR2.yearEnd);
const paysIn = (m: string) => PAY_DAYS.filter((d) => monthOf(d) === m).length;

// the loan: months 13–24 of the schedule, one payment a month
const LOAN_ROWS = LOAN_SCHEDULE.rows.slice(12, 24);

// year 1's last GST return (February–March 2027): owed on 31 March, paid 7 May
const GST_OWED_AT_START = r2(-(Y2.OPENING_BALANCES["210"] ?? 0));
const GST_PERIODS = Y2.GST_PERIODS_Y2;
const Y1_LAST_PERIOD = gstPeriodsFor(2026).at(-1)!;

const drawingsPerMonth = r2(Object.values(Y2.YEAR2.drawings).reduce((s, x) => s + x, 0));

/* ───────────── the forecast, month by month ───────────── */

function buildForecast() {
  const cust = shares("customers"), supp = shares("suppliers");
  const rows: Row[] = MONTHS.map((m, i) => {
    const r = zero();
    r.customers = r2(salesInclGst * cust[i]);
    r.suppliers = r2(-suppliersInclGst * supp[i]);
    r.employees = r2(-(wagesBudget / PAY_DAYS.length) * paysIn(m));
    r.loan = r2(-LOAN_ROWS[i].payment);
    r.tax = r2(-Y2.PROVISIONAL.instalments.filter((x) => monthOf(x.date) === m).reduce((s, x) => s + x.amount, 0));
    r.drawings = -drawingsPerMonth;
    return r;
  });
  // GST: 3/23 of what customers pay, less 3/23 of what's paid for standard-rated costs, in each two-month period
  const standardShare = (supplierStandard * (1 + GST_RATE)) / suppliersInclGst;
  const gstFor = (from: string, to: string) =>
    r2(MONTHS.reduce((s, m, i) => (m >= monthOf(from) && m <= monthOf(to) ? s + rows[i].customers * GST_SHARE + rows[i].suppliers * standardShare * GST_SHARE : s), 0));
  const gstDue: { label: string; due: string; amount: number }[] = [
    { label: Y1_LAST_PERIOD.label, due: Y1_LAST_PERIOD.due, amount: GST_OWED_AT_START },
    ...GST_PERIODS.map((p) => ({ label: p.label, due: p.due, amount: gstFor(p.from, p.to) })),
  ];
  for (const g of gstDue) {
    const i = MONTHS.indexOf(monthOf(g.due));
    if (i >= 0) rows[i].gst = r2(rows[i].gst - g.amount);
  }
  return { rows, gstDue };
}
const FORECAST = buildForecast();

/** the actual cash in and out, month by month, from the year 2 books */
const ACTUAL: Row[] = MONTHS.map((m) => byGroup(inMonth(Y2.BEFORE_CLOSING, m)));

const net = (r: Row) => r2(GROUPS.reduce((s, g) => s + r[g.key], 0));
function running(rows: Row[]) {
  let bal = OPENING_CASH;
  return rows.map((r) => (bal = r2(bal + net(r))));
}

/* ───────────── what happened each month (for the notes) ───────────── */

const titleIn = (m: string, re: RegExp) => Y2.BEFORE_CLOSING.filter((t) => monthOf(t.date) === m && re.test(t.title));
function eventsIn(m: string): string[] {
  const out: string[] = [];
  if (paysIn(m) === 3) out.push("Three paydays this month instead of two (pay is fortnightly).");
  const gst = FORECAST.gstDue.find((g) => monthOf(g.due) === m);
  if (gst) out.push(`GST for ${gst.label} is due on the ${Number(gst.due.slice(8))}th.`);
  const prov = Y2.PROVISIONAL.instalments.find((x) => monthOf(x.date) === m);
  if (prov) out.push(`Provisional tax instalment of ${$0(prov.amount)} is due.`);
  if (titleIn(m, /Sell the old POS/).length) out.push(`The old POS system was sold for ${$0(Y2.DISPOSAL.price)} (not in the forecast).`);
  if (titleIn(m, /Buy a new POS/).length) out.push(`A new POS system was bought for ${$0(Y2.NEW_POS.cost)} plus GST (not in the forecast).`);
  if (titleIn(m, /Renew the insurance/).length) out.push("The year's insurance premium is paid in one go.");
  if (titleIn(m, /dividend/i).length) out.push("The dividend was paid (not in the forecast).");
  return out;
}

/* ───────────── why the year's totals differ ───────────── */

const fTotal = (g: Group) => r2(FORECAST.rows.reduce((s, r) => s + r[g], 0));
const aTotal = (g: Group) => r2(ACTUAL.reduce((s, r) => s + r[g], 0));
const dividendPaid = -aTotal("dividends");

const WHY: Partial<Record<Group, string>> = {
  customers: `Café sales came in at ${$0(SALES.actual)} against ${$0(SALES.budget)} budgeted, and the Morgans' wedding made catering bigger than planned.`,
  suppliers: "More sales need more stock: buying beans, milk and food rises with sales. The budget's cost of sales was also set too low (see Budget vs actual).",
  employees: `The forecast copied the budget's wages cost, and that includes ${$0(budget("602"))} of holiday pay set aside at year end for leave the staff have earned but not taken. It's a cost this year, but no cash leaves the bank until the leave is taken. A forecast built from a budget has to take out costs that are only accruals.`,
  gst: "GST follows sales: more sales means more GST collected for IRD. The forecast's GST is an estimate made from the forecast sales and costs.",
  dividends: `The directors decided in February 2028, once they could see the year going well, to pay a ${$0(Y2.DIVIDEND.cash)} dividend. It wasn't planned in March 2027, so it wasn't in the forecast: the biggest single surprise in the year's cash.`,
  assets: "Selling the old POS system and buying a new one weren't planned.",
};

/** big enough to explain: $1,000 or more over the year */
export const isMaterial = (diff: number) => Math.abs(diff) >= 1_000;

export const LINES = GROUPS.map((g) => {
  const forecast = fTotal(g.key), actual = aTotal(g.key);
  return { ...g, forecast, actual, diff: r2(actual - forecast), why: WHY[g.key] };
});

/** how each forecast line was set */
export const BASIS: Record<Group, string> = {
  customers: `The budgeted café and catering sales (${$0(budget("400") + budget("410"))}) plus 15% GST, spread over the months the way customers paid last year.`,
  suppliers: `The budgeted stock purchases and running costs, plus GST where it applies (${$0(suppliersInclGst)} in all), spread the way suppliers were paid last year (the insurance premium lands in October).`,
  employees: `The budgeted wages, KiwiSaver and holiday pay (${$0(wagesBudget)}), split across the ${PAY_DAYS.length} fortnightly paydays. Months with three paydays cost more.`,
  loan: "From the loan schedule: the same payment each month, a little more of it principal each time.",
  gst: `3/23 of what customers pay, less 3/23 of the GST-able costs, for each two-month period, paid when the return is due. May also pays last year's final return (${$0(GST_OWED_AT_START)}).`,
  tax: `Provisional tax, standard option: last year's tax plus 5%, in instalments on 28 August and 15 January (the third is in May, next year).`,
  drawings: `Aroha and Ben's regular drawings: ${$0(drawingsPerMonth)} a month.`,
  dividends: "None planned.",
  assets: "None planned.",
};

export const MONTH_ROWS = MONTHS.map((m, i) => ({
  month: m,
  label: monthName(`${m}-01`),
  year: m.slice(0, 4),
  forecast: FORECAST.rows[i],
  actual: ACTUAL[i],
  forecastNet: net(FORECAST.rows[i]),
  actualNet: net(ACTUAL[i]),
  forecastBank: running(FORECAST.rows)[i],
  actualBank: running(ACTUAL)[i],
  events: eventsIn(m),
}));

const lowest = (k: "forecastBank" | "actualBank") => MONTH_ROWS.reduce((a, b) => (b[k] < a[k] ? b : a));

const y2Profit = Y2.NET_PROFIT;
const cashChange = r2(MONTH_ROWS.at(-1)!.actualBank - OPENING_CASH);

export const SUMMARY = {
  opening: OPENING_CASH,
  forecastClosing: MONTH_ROWS.at(-1)!.forecastBank,
  actualClosing: MONTH_ROWS.at(-1)!.actualBank,
  lowestForecast: lowest("forecastBank"),
  lowestActual: lowest("actualBank"),
  /** months where more went out than came in */
  outflowMonths: MONTH_ROWS.filter((r) => r.actualNet < 0),
  netProfit: y2Profit,
  cashChange,
  dividendPaid,
  gstDue: FORECAST.gstDue,
  terminalTax: { amount: Y2.YEAR2_FACTS.y1Terminal, due: "2028-04-07" },
  thirdInstalment: Y2.PROVISIONAL.instalments[2],
  salesGrowth: pct(SALES.actual / SALES.lastYear - 1),
  loan: { balance: r2(LOAN_ROWS.at(-1)!.closing), rate: LOAN.rate },
  shareholderSalaries: r2(Y2.YEAR2_FACTS.salaries.reduce((s, x) => s + x.salary, 0)),
  depreciation: Y2.YEAR2_FACTS.depTotal,
  /** the bank never went below this, so this much sat unused all year */
  neverNeeded: lowest("actualBank").actualBank,
};
