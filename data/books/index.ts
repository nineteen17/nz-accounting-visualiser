import type { Transaction } from "@/lib/engine/types";
import { balances, byDate } from "@/lib/engine/ledger";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { ACCOUNTS } from "../chartOfAccounts";
import { r2 } from "@/lib/money";
import { assetYearOne } from "@/lib/nz/assets";
import { calcPay } from "@/lib/nz/payroll";
import { taxComputation } from "@/lib/nz/incomeTax";
import { BUSINESS, CLOSING_STOCK, CUSTOMERS, EMPLOYEES, FIXED_ASSETS, SHAREHOLDERS } from "../business";
import { APRIL } from "./april";
import { LATER_EVENTS, LEO_HOURS, MIA_HOURS, PAY_RUNS, ROUTINE_AND_PAYROLL, supplierPayments } from "./year";
import { money2 } from "./helpers";
import { closingEntries, gstSettlement } from "./generator";

/* 1. Everything that happened during the year */
const base = [...APRIL, ...LATER_EVENTS, ...ROUTINE_AND_PAYROLL].sort(byDate);
const withAp = [...base, ...supplierPayments(base)].sort(byDate);

/* 2. GST returns P1–P5 are filed & paid during the year (P6 is due 7 May, after year end) */
const gstSettlements: Transaction[] = GST_PERIODS.slice(0, 5).map((p, i) =>
  gstSettlement(p, gstReturn(withAp, p), {
    id: `GST-${p.id}`,
    featured: i < 2,
    story: (r, amt, refund) =>
      refund
        ? `The first GST return covers April–May. Because the café bought so much equipment, the GST it paid (${money2(r.box14)}) is MORE than the GST it collected on sales (${money2(r.box10)}). So IRD refunds the difference, ${money2(amt)}. Ben files the return online in early June and the refund arrives about two weeks later.`
        : `GST return for ${p.label}: GST collected ${money2(r.box10)} − GST claimed ${money2(r.box14)} = ${money2(amt)} to pay, due ${p.due}. Paying it clears the GST liability; GST is never an expense or income for a registered business.`,
  }),
);

export const DURING_YEAR: Transaction[] = [...withAp, ...gstSettlements].sort(byDate);

/* 3. Year-end adjustments */
const YE = BUSINESS.yearEnd;
const pre = balances(DURING_YEAR);
const entertainmentEx = pre["623"];
const entAdj = r2(entertainmentEx * 1.15 * 0.5 * (3 / 23));

const accrualDays = 9; // 23–31 March worked, paid 7 April
const fortnight = EMPLOYEES.map((e) => calcPay(e, e.id === "mia" ? MIA_HOURS : LEO_HOURS["03"]));
const accruedGross = r2(fortnight.reduce((s, p) => s + p.gross, 0) * (accrualDays / 14));
const accruedKs = r2(accruedGross * 0.035);

const miaYearGross = r2(PAY_RUNS.reduce((s, run) => s + run.results[0].gross, 0));
const miaAccruedGross = r2(fortnight[0].gross * (accrualDays / 14));
const holidayAccrual = r2((miaYearGross + miaAccruedGross) * 0.08);

const dep = FIXED_ASSETS.map((a) => ({ a, ...assetYearOne(a) }));
const depTotal = r2(dep.reduce((s, x) => s + x.accounting, 0));
const closingStock = CLOSING_STOCK.reduce((s, x) => s + x.value, 0);
const salaryTotal = SHAREHOLDERS.reduce((s, x) => s + x.salary, 0);

const adj = (t: Omit<Transaction, "date" | "kind" | "book">): Transaction => ({ date: YE, kind: "adjustment", book: "general", ...t });

const ADJ_BEFORE_TAX: Transaction[] = [
  adj({
    id: "ADJ01",
    title: "Write off Pop-Up Events' bad debt",
    story:
      "Pop-Up Events' invoice from October ($920) is 5 months overdue. The company has gone into liquidation and the liquidator says unsecured creditors will get nothing. The debt is [[bad-debt|written off]]: it's removed from debtors and becomes an expense.\n\nGST: the café paid GST on this invoice back in October (invoice basis) but will never collect it. A business can claim that GST back once the debt is actually written off. Here that's $920 × 3/23 = $120.",
    doc: { kind: "internal", title: "Bad debt write-off approval", issuer: BUSINESS.name, date: YE, rows: [{ label: "Customer", value: CUSTOMERS.popup.name }, { label: "Invoice", value: "INV-0003 (9 Oct 2026)" }, { label: "Amount written off", value: "$920.00", strong: true }, { label: "Reason", value: "Customer in liquidation – no dividend expected" }] },
    lines: [
      { account: "624", debit: 800, why: "The lost income (excl GST) is an expense." },
      { account: "210", debit: 120, gst: "adj-input", why: "GST previously paid on the invoice is claimed back (credit adjustment)." },
      { account: "120", credit: 920, party: CUSTOMERS.popup.name, why: "The debtor is removed: it's no longer an asset." },
    ],
    notes: ["For tax, a bad debt is only deductible once it is actually written off in the books before balance date. A 'doubtful debt' provision is NOT deductible."],
    deepDives: [{ href: "/nz/gst", label: "GST on bad debts" }],
  }),
  adj({
    id: "ADJ02",
    title: "GST adjustment for entertainment",
    story: `GST was claimed in full on the client lunch and the Christmas function. But because only 50% of entertainment is deductible for income tax, GST law says 50% of the GST claimed must be paid back. This is done once a year, in the return covering balance date.\n\nEntertainment (excl GST) ${money2(entertainmentEx)} → incl GST ${money2(entertainmentEx * 1.15)} × 50% × 3/23 = ${money2(entAdj)}.`,
    doc: { kind: "internal", title: "Entertainment GST adjustment", issuer: BUSINESS.name, date: YE, rows: [{ label: "Entertainment incl GST", value: money2(entertainmentEx * 1.15) }, { label: "Non-deductible portion 50%", value: money2(entertainmentEx * 1.15 * 0.5) }, { label: "GST adjustment (× 3/23)", value: money2(entAdj), strong: true }] },
    lines: [
      { account: "623", debit: entAdj, why: "The GST paid back becomes part of the cost of entertainment." },
      { account: "210", credit: entAdj, gst: "adj-output", why: "Extra GST owed to IRD (a debit adjustment in box 9)." },
    ],
    deepDives: [{ href: "/nz/income-tax", label: "Entertainment rules" }],
  }),
  adj({
    id: "ADJ03",
    title: "Accrued income: catering done but not yet invoiced",
    story:
      "On 30 March the café catered a staff farewell at Seaview Primary ($600 + GST). The invoice won't be sent until April. The work was done in this year, so the income belongs in this year: [[accrued-income]].\n\nNo GST yet: no invoice has been issued and no payment received, so the GST 'time of supply' hasn't happened. The GST goes in next period's return when the invoice is sent.",
    doc: { kind: "internal", title: "Job sheet (not yet invoiced)", issuer: BUSINESS.name, date: "2027-03-30", rows: [{ label: "Customer", value: CUSTOMERS.school.name }, { label: "Farewell afternoon tea for 40", value: "$600.00 + GST" }, { label: "Status", value: "Delivered 30/3 – invoice to be issued April" }] },
    lines: [
      { account: "125", debit: 600, why: "An asset: the school owes the café for work done." },
      { account: "410", credit: 600, why: "Income earned this year." },
    ],
  }),
  adj({
    id: "ADJ04",
    title: "Accrued expense: March power bill not yet received",
    story:
      "Kahu Energy's March bill won't arrive until 8 April, but the café used the power in March. Ben estimates it from February's bill and the meter reading: about $520 excl GST. This is an [[accrued-expense]].\n\nNo GST claimed: GST can only be claimed when the café holds the tax invoice.",
    doc: { kind: "internal", title: "Accrual working", issuer: BUSINESS.name, date: YE, rows: [{ label: "Meter reading 31/3", value: "≈ 2,040 kWh used in March" }, { label: "Estimated charge excl GST", value: "$520.00", strong: true }] },
    lines: [
      { account: "611", debit: 520, why: "March's power belongs in March's expenses." },
      { account: "205", credit: 520, why: "A liability: the café owes for power it has used." },
    ],
  }),
  adj({
    id: "ADJ05",
    title: "Prepaid insurance: the unused half of the policy",
    story:
      "In October the café paid $2,400 (excl GST) for insurance up to 30 September 2027. By 31 March only 6 of 12 months are used, so the other 6 months ($1,200) belong to next year. The adjustment moves them out of expense into a [[prepayment]] asset.",
    doc: { kind: "internal", title: "Prepayment working", issuer: BUSINESS.name, date: YE, rows: [{ label: "Premium (excl GST)", value: "$2,400.00" }, { label: "Months used (Oct–Mar)", value: "6 of 12" }, { label: "Prepaid (Apr–Sep 2027)", value: "$1,200.00", strong: true }] },
    lines: [
      { account: "136", debit: 1_200, why: "Next year's insurance is an asset." },
      { account: "613", credit: 1_200, why: "This year's insurance expense is reduced to 6 months." },
    ],
  }),
  adj({
    id: "ADJ06",
    title: "Accrued wages for 23–31 March",
    story: `Staff worked 23–31 March, but that time is paid on 7 April. The work happened this year, so the cost belongs here: ${money2(accruedGross)} of wages (${accrualDays}/14 of a fortnight) plus 3.5% employer KiwiSaver.`,
    doc: { kind: "internal", title: "Wages accrual working", issuer: BUSINESS.name, date: YE, rows: [{ label: "Fortnightly gross (Mia + Leo)", value: money2(fortnight.reduce((s, p) => s + p.gross, 0)) }, { label: `× ${accrualDays}/14 days`, value: money2(accruedGross) }, { label: "Employer KiwiSaver 3.5%", value: money2(accruedKs) }, { label: "Total accrued", value: money2(accruedGross + accruedKs), strong: true }] },
    lines: [
      { account: "600", debit: accruedGross },
      { account: "601", debit: accruedKs },
      { account: "206", credit: r2(accruedGross + accruedKs), why: "Owed to staff (and KiwiSaver) at year end." },
    ],
  }),
  adj({
    id: "ADJ07",
    title: "Holiday pay accrual for Mia",
    story: `Mia is permanent full-time. Under the Holidays Act she builds up 4 weeks' annual leave a year (she's entitled to take it from her 12-month anniversary), and she hasn't taken any yet. The café owes her that leave, so it's a liability now. Estimate: 8% of her gross earnings to date = ${money2(holidayAccrual)}.\n\nLeo doesn't need an accrual: as a casual he's paid his 8% with every pay.`,
    doc: { kind: "internal", title: "Leave liability report", issuer: BUSINESS.name, date: YE, rows: [{ label: "Mia – gross earnings to 31 Mar", value: money2(miaYearGross + miaAccruedGross) }, { label: "Holiday pay accrued @ 8%", value: money2(holidayAccrual), strong: true }, { label: "Leo – casual (8% PAYG)", value: "$0.00" }] },
    lines: [
      { account: "602", debit: holidayAccrual },
      { account: "220", credit: holidayAccrual },
    ],
    deepDives: [{ href: "/nz/holidays", label: "Holidays Act explained" }],
  }),
  adj({
    id: "ADJ08",
    title: "Depreciation for the year",
    story:
      "Fixed assets wear out. [[depreciation]] spreads each asset's cost over the years it's used. The café uses the diminishing value (DV) method at IRD's rates, the way most small NZ companies do. Assets bought in April count as 12 months.\n\nThe credit goes to each asset's [[contra-account]] (accumulated depreciation), not to the cost account. That way the balance sheet shows both the original cost and how much has been used up.",
    doc: {
      kind: "internal",
      title: "Fixed asset register – depreciation",
      issuer: BUSINESS.name,
      date: YE,
      rows: [
        ...dep.map((x) => ({ label: `${x.a.name} – ${money2(x.a.cost)} × ${x.a.dvRate * 100}% DV`, value: money2(x.accounting) })),
        { label: "Total depreciation", value: money2(depTotal), strong: true },
      ],
    },
    lines: [
      { account: "626", debit: depTotal, why: "The cost of assets used up this year." },
      ...dep.map((x) => ({ account: x.a.accDepAccount, credit: x.accounting, memo: x.a.name, why: "Builds up accumulated depreciation (reduces the asset's book value)." })),
    ],
    deepDives: [{ href: "/nz/depreciation", label: "Depreciation methods & rates" }],
  }),
  adj({
    id: "ADJ09",
    title: "Stocktake: record closing inventory",
    story: `On the night of 31 March Aroha and Ben count everything on the shelves and value it at cost: ${money2(closingStock)}.\n\nAll year, stock purchases went straight into 'Purchases' (expenses). But some of that stock hasn't been sold, so it isn't a cost of THIS year's sales. This entry takes it out of cost of sales and puts it on the balance sheet as inventory.\n\n[[cost-of-goods-sold|Cost of goods sold]] = opening stock + purchases − closing stock.`,
    doc: { kind: "stocktake", title: "Stocktake sheet – 31 March 2027", issuer: BUSINESS.name, date: YE, items: CLOSING_STOCK.map((s) => ({ desc: `${s.item}`, amount: s.value })), totals: [{ label: "Total stock at cost", value: money2(closingStock), strong: true }], footer: ["Counted by A. Ngata & B. Fraser. Expired/damaged items excluded (wastage is already inside purchases)."] },
    lines: [
      { account: "130", debit: closingStock, why: "Stock on hand is an asset." },
      { account: "519", credit: closingStock, why: "Reduces cost of sales: this stock hasn't been sold yet." },
    ],
    deepDives: [{ href: "/nz/inventory", label: "Inventory methods & trading stock rules" }],
  }),
  adj({
    id: "ADJ10",
    title: "Shareholder salaries for Aroha and Ben",
    story:
      "Aroha and Ben worked in the business all year and took drawings, but no wages through PAYE. The accountant now allocates [[shareholder-salary|shareholder salaries]]: Aroha $60,000 and Ben $30,000. They're credited to their current accounts.\n\nThe company deducts them as an expense, and Aroha and Ben pay tax on them personally in their own IR3 returns. Shifting income this way can use the lower personal tax brackets, but it must reflect the work each person actually did.",
    doc: { kind: "internal", title: "Directors' resolution – shareholder-employee salaries", issuer: BUSINESS.name, date: YE, rows: SHAREHOLDERS.map((s) => ({ label: s.name, value: money2(s.salary) })) },
    lines: [
      { account: "605", debit: salaryTotal, why: "An expense of the company." },
      ...SHAREHOLDERS.map((s) => ({ account: s.currentAccount, credit: s.salary, party: s.name, why: `The company now owes ${s.name.split(" ")[0]} this salary. Credit to the current account.` })),
    ],
    deepDives: [{ href: "/nz/shareholders", label: "Shareholder salaries & current accounts" }],
  }),
];

/* 4. Income tax (needs profit after the other adjustments) */
const afterAdj = balances([...DURING_YEAR, ...ADJ_BEFORE_TAX]);
const incomeTotal = ACCOUNTS.filter((a) => a.type === "income").reduce((s, a) => s - afterAdj[a.code], 0);
const expenseTotal = ACCOUNTS.filter((a) => a.type === "expense").reduce((s, a) => s + afterAdj[a.code], 0);
export const PROFIT_BEFORE_TAX = r2(incomeTotal - expenseTotal);
export const TAX = taxComputation({
  profitBeforeTax: PROFIT_BEFORE_TAX,
  entertainment: afterAdj["623"],
  holidayPayAccrual: holidayAccrual,
  rwt: afterAdj["140"],
  provisional: afterAdj["141"],
});

const ADJ_TAX: Transaction[] = [
  adj({
    id: "ADJ11",
    title: "Income tax expense for the year",
    story: `The company pays 28% tax on its taxable income. Taxable income isn't the same as accounting profit, because some tax rules differ from accounting rules (see the tax reconciliation).\n\nAccounting profit before tax ${money2(PROFIT_BEFORE_TAX)} → taxable income ${money2(TAX.taxableIncome)} → tax ${money2(TAX.tax)}.`,
    doc: { kind: "internal", title: "Income tax computation (summary)", issuer: BUSINESS.name, date: YE, rows: [{ label: "Profit before tax", value: money2(PROFIT_BEFORE_TAX) }, ...TAX.items.map((i) => ({ label: i.label, value: money2(i.amount) })), { label: "Taxable income", value: money2(TAX.taxableIncome), strong: true }, { label: "Tax @ 28%", value: money2(TAX.tax), strong: true }] },
    lines: [
      { account: "690", debit: TAX.tax, why: "This year's tax is an expense of this year." },
      { account: "230", credit: TAX.tax, why: "Owed to IRD." },
    ],
    deepDives: [{ href: "/nz/income-tax", label: "Company income tax & the IR4" }],
  }),
  adj({
    id: "ADJ12",
    title: "Use tax credits against the tax bill",
    story: `Some of the tax has already been paid: ${money2(TAX.rwt)} of RWT deducted by the bank, plus the ${money2(TAX.provisional)} voluntary provisional payment. Those assets are set against the liability. What's left, ${money2(TAX.terminal)}, is [[terminal-tax]], due 7 April 2028 (because the company has a tax agent).`,
    lines: [
      { account: "230", debit: r2(TAX.rwt + TAX.provisional) },
      { account: "140", credit: TAX.rwt },
      { account: "141", credit: TAX.provisional },
    ],
    deepDives: [{ href: "/nz/provisional-tax", label: "Terminal tax and next year's provisional tax" }],
  }),
];

export const ADJUSTMENTS = [...ADJ_BEFORE_TAX, ...ADJ_TAX];
export const BEFORE_CLOSING = [...DURING_YEAR, ...ADJUSTMENTS];

/* 5. Closing entries */
const closed = closingEntries(balances(BEFORE_CLOSING), YE);
export const NET_PROFIT = closed.netProfit;
export const CLOSING: Transaction[] = closed.entries;

export const ALL = [...BEFORE_CLOSING, ...CLOSING];

/** Featured transactions in April, for the step-through */
export const APRIL_FEATURED = DURING_YEAR.filter((t) => t.date < "2026-05-01" && t.kind === "featured");

export const YEAR_FACTS = {
  closingStock,
  depTotal,
  holidayAccrual,
  accruedGross,
  entAdj,
  salaryTotal,
};

export function findTxn(id: string) {
  return ALL.find((t) => t.id === id);
}
