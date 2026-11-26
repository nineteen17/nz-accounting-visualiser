/**
 * Kōwhai Café's SECOND year: 1 April 2027 – 31 March 2028.
 *
 * Built with the same generator as year 1, starting from year 1's closing balances.
 * New this year: reversing entries, last year's GST and terminal tax falling due,
 * provisional tax, annual leave taken, selling an asset, and a dividend with imputation credits.
 */
import type { JournalLine, Transaction } from "@/lib/engine/types";
import { balances, byDate, type Balances } from "@/lib/engine/ledger";
import { GST_PERIODS, gstPeriodsFor, gstReturn } from "@/lib/engine/gst";
import { r2, nzDate } from "@/lib/money";
import { assetYear, assetYearOne, disposal, type FixedAsset } from "@/lib/nz/assets";
import { calcPay, type Employee } from "@/lib/nz/payroll";
import { taxFromItems, type TaxAssetRow, type TaxItem } from "@/lib/nz/incomeTax";
import { ACC_EARNERS_LEVY_2027_28, COMPANY_TAX_RATE, PROVISIONAL_TAX, RWT } from "@/lib/nz/rates";
import { ACCOUNTS } from "../chartOfAccounts";
import { BUSINESS, CUSTOMERS, EMPLOYEES, FIXED_ASSETS, SHAREHOLDERS } from "../business";
import { ADJUSTMENTS as Y1_ADJUSTMENTS, ALL as Y1_ALL, NET_PROFIT as Y1_NET_PROFIT, TAX as Y1_TAX, YEAR_FACTS as Y1_FACTS } from "./index";
import { LEO_HOURS, PAYROLL_TXNS as Y1_PAYROLL } from "./year";
import { MERCHANT_FEE } from "./april";
import { buyLines, money2, monthsBetween, salesInvoice, supplierInvoice } from "./helpers";
import { closingEntries, gstSettlement, monthlyRoutine, payePayments, payRuns, payrollTxns, profitOf, supplierPayments, type YearConfig } from "./generator";

const START = "2027-04-01";
const YE = "2028-03-31";
const MONTHS = monthsBetween("2027-04", "2028-03");

/* ───────────────────────── 0. Opening balances ───────────────────────── */

/** Year 1's post-closing balances: only balance sheet accounts are left */
export const OPENING_BALANCES: Balances = balances(Y1_ALL);

/** One entry that brings every balance forward (what the books look like on 1 April 2027) */
export const OPENING_ENTRY: Transaction = {
  id: "OPEN-2027",
  date: START,
  title: "Opening balances brought forward from 31 March 2027",
  kind: "opening",
  book: "general",
  story: "Every balance sheet account starts the new year where it finished the last one. Income and expense accounts start at zero: they were closed to retained earnings.",
  lines: ACCOUNTS.filter((a) => Math.abs(OPENING_BALANCES[a.code] ?? 0) > 0.004).map((a) => {
    const v = OPENING_BALANCES[a.code];
    return v > 0 ? { account: a.code, debit: r2(v) } : { account: a.code, credit: r2(-v) };
  }),
};

/* ───────────────────────── 1. This year's settings ───────────────────────── */

/** Pay rises from the pay period starting 6 April 2027 */
const RAISED: Employee[] = EMPLOYEES.map((e) => ({ ...e, rate: e.id === "mia" ? 27 : 25.5 }));
const RAISE_FROM = "2027-04-21";

/** Mia's annual leave: two fortnights, paid out of last year's holiday pay accrual */
const LEAVE_DATES = ["2027-07-28", "2028-02-23"];

export const YEAR2: YearConfig = {
  months: MONTHS,
  yearEnd: YE,
  teach: false,
  firstPayDate: "2027-04-07",
  employeesOn: (date) => (date < RAISE_FROM ? EMPLOYEES : RAISED),
  hoursFor: (id, date) => (id === "mia" ? 80 : LEO_HOURS[date.slice(5, 7)]),
  acc: ACC_EARNERS_LEVY_2027_28,
  payId: (_, date) => `PAY-${date}`,
  openingHolidayAccrual: Y1_FACTS.holidayAccrual,
  payExtras: {
    "2027-04-07": {
      title: "First pay run of the new year",
      story:
        "This pay covers 23 March – 5 April, so 9 of its 14 days were worked last year. Those 9 days were accrued at year end (ADJ06), and the accrual was reversed on 1 April. So this entry can be recorded the normal way, in full, and the year-1 part nets off automatically.\n\nThe ACC earners' levy rose to 1.83% on 1 April 2027, so the payroll software uses the new rate from this pay on. PAYE is worked out on the rates in force on payday.",
    },
    "2027-04-21": {
      title: "Pay rises take effect",
      story: "Aroha gives both staff a pay rise from the pay period starting 6 April: Mia $26 → $27 an hour and Leo $24.50 → $25.50. Both are above the adult minimum wage. (The rate from 1 April 2027 hadn't been announced when this example was written, so this assumes it stays at or below $23.95.)",
    },
    [LEAVE_DATES[0]]: {
      title: "Mia takes annual leave",
      leave: { employeeId: "mia", hours: 80 },
      story:
        "Mia has worked here 12 months, so she's entitled to 4 weeks' annual leave. She takes 2 weeks now.\n\nUnder the Holidays Act her leave is paid at the greater of her ordinary weekly pay and her average weekly earnings: here, her normal $27 an hour. Her payslip looks the same, but the entry is different. **The leave pay isn't a new expense.** It was expensed last year, when she earned the leave (ADJ07). So it's debited to the **holiday pay accrual** (liability), not to wages.",
    },
    [LEAVE_DATES[1]]: {
      title: "Mia takes the rest of her annual leave",
      leave: { employeeId: "mia", hours: 80 },
      story:
        "Mia takes her other 2 weeks. Last year's accrual (8% of her pay at $26 an hour) runs out partway through this pay, because she's now paid at $27. The part of her leave pay **above** the accrual is an expense this year (holiday pay expense). An accrual is an estimate, and the difference is simply this year's cost.",
    },
  },
  sales: {
    "2027-04": 39_000, "2027-05": 36_000, "2027-06": 33_000, "2027-07": 32_000, "2027-08": 33_500, "2027-09": 36_000,
    "2027-10": 39_000, "2027-11": 41_500, "2027-12": 46_500, "2028-01": 43_500, "2028-02": 42_500, "2028-03": 40_500,
  },
  power: (ym) => {
    const winter = ["2027-06", "2027-07", "2027-08"].includes(ym);
    return { amount: winter ? 690 : 530, winter };
  },
  rentFromPrepaid: [],
  loanFirstRow: 12,
  drawings: { aroha: 3_800, ben: 2_200 },
};

const RUNS = payRuns(YEAR2);
const PAYROLL = payrollTxns(YEAR2, RUNS);

/* ───────────────────────── 2. Reversing entries on 1 April ───────────────────────── */

const y1Adj = (id: string) => Y1_ADJUSTMENTS.find((t) => t.id === id)!;
const flip = (lines: JournalLine[]): JournalLine[] =>
  lines.map((l) => ({ account: l.account, debit: l.credit, credit: l.debit, party: l.party, memo: l.memo }));

function reversal(id: string, title: string, story: string, why: Record<string, string>): Transaction {
  const original = y1Adj(id);
  return {
    id: `REV-${id}`,
    date: START,
    title,
    kind: "featured",
    book: "general",
    story,
    lines: flip(original.lines).map((l) => ({ ...l, why: why[l.account] })),
    deepDives: [{ href: "/cycle/adjustments", label: `The original adjustment (${id})` }],
  };
}

const REVERSALS: Transaction[] = [
  reversal(
    "ADJ03",
    "Reverse last year's accrued catering income",
    "On 31 March the accountant recorded $600 of catering income that hadn't been invoiced yet (ADJ03). Today that entry is turned around: a [[reversing-entry]].\n\nWhy? When Ben sends the invoice next week he can record it the normal way (debtor, income, GST) without having to remember that the income was already counted last year. The reversal takes $600 out of this year's income, and the invoice puts it back, so this year's net is zero, which is right: the work was done last year.",
    { "410": "Takes the income back out of this year (it belonged to last year).", "125": "The accrued income asset is cleared: the real invoice will replace it." },
  ),
  reversal(
    "ADJ04",
    "Reverse last year's accrued power",
    "Last year's March power bill was estimated at $520 (ADJ04). Reversing it now means the real bill, when it arrives, can be entered normally. Power expense starts the year $520 in credit, and the actual bill cancels it out.",
    { "205": "The accrued expense liability is cleared.", "611": "A temporary credit in power expense, cancelled when the real March bill is entered." },
  ),
  reversal(
    "ADJ05",
    "Prepaid insurance: this year's six months",
    "Last year $1,200 of the insurance premium was moved into a prepayment (ADJ05): it covered April to September 2027. Those months are all in this year, so the whole $1,200 goes back to insurance expense today. Reversing the adjustment does exactly that.",
    { "613": "This year's share of the premium paid last October.", "136": "The prepayment is used up." },
  ),
  reversal(
    "ADJ06",
    "Reverse last year's accrued wages",
    "At year end the accountant accrued 9 days of wages (23–31 March) that are paid on 7 April (ADJ06). Reversing that accrual today means Ben can record the 7 April pay run in full, the normal way. The reversal credit cancels the year-1 part of it, so this year's wages only include days worked this year.\n\nReversing entries are optional. They exist to make the bookkeeper's life easier, and the payroll software doesn't need to know anything about accruals.",
    { "206": "The accrued wages liability is cleared.", "600": "Cancels the 9 days of last year's work inside the 7 April pay.", "601": "Same for the employer KiwiSaver on those days." },
  ),
];

/* ───────────────────────── 3. Tax set up from year 1 ───────────────────────── */

/** Provisional tax, standard option: last year's residual income tax + 5%, in three instalments */
const PROV_TOTAL = r2(Y1_TAX.residual * (1 + PROVISIONAL_TAX.standardUplift));
const INSTALMENT = r2(PROV_TOTAL / 3);
export const PROVISIONAL = {
  y1Rit: Y1_TAX.residual,
  total: PROV_TOTAL,
  instalments: [
    { date: "2027-08-28", amount: INSTALMENT },
    { date: "2028-01-15", amount: INSTALMENT },
    { date: "2028-05-07", amount: r2(PROV_TOTAL - 2 * INSTALMENT) },
  ],
};

const provPayment = (id: string, n: number, story: string): Transaction => {
  const i = PROVISIONAL.instalments[n];
  return {
    id,
    date: i.date,
    title: `Provisional tax: instalment ${n + 1} of 3`,
    kind: "featured",
    book: "cash-payments",
    story,
    doc: { kind: "ird", title: "Income tax payment", issuer: "Inland Revenue", recipient: BUSINESS.name, ref: "Provisional tax – 2028 income year", date: i.date, rows: [{ label: "Last year's residual income tax", value: money2(PROVISIONAL.y1Rit) }, { label: "+ 5% (standard option)", value: money2(PROVISIONAL.total) }, { label: `Instalment ${n + 1} (one third)`, value: money2(i.amount), strong: true }] },
    lines: [
      { account: "141", debit: i.amount, why: "Tax paid in advance: an asset until it's used against this year's tax bill." },
      { account: "100", credit: i.amount, why: "Paid from the bank." },
    ],
    deepDives: [{ href: "/nz/provisional-tax", label: "Provisional tax options" }],
  };
};

/* ───────────────────────── 4. Selling the old POS system ───────────────────────── */

const Y1_ASSET = Object.fromEntries(FIXED_ASSETS.map((a) => [a.id, assetYearOne(a)]));
const OLD_POS = FIXED_ASSETS.find((a) => a.id === "computers")!;
export const NEW_POS: FixedAsset = { id: "pos2", name: "New POS system & tablets", costAccount: "175", accDepAccount: "176", cost: 2_800, acquired: "2027-10-01", dvRate: 0.5, slRate: 0.4, investmentBoost: true };
const SALE_DATE = "2027-09-30";
const SALE_PRICE = 900;
const oldPosYear = assetYear(OLD_POS, { openingBook: Y1_ASSET.computers.closingBookValue, openingTax: Y1_ASSET.computers.closingTaxValue, firstYear: false, yearEnd: YE, soldMonths: 6 });
const oldPosBookAtSale = oldPosYear.closingBookValue;
const accountingGain = r2(SALE_PRICE - oldPosBookAtSale);
const taxDisposal = disposal(OLD_POS.cost, Y1_ASSET.computers.closingTaxValue, SALE_PRICE);
export const DISPOSAL = {
  asset: OLD_POS,
  price: SALE_PRICE,
  accDepToSale: r2(Y1_ASSET.computers.accounting + oldPosYear.accounting),
  depThisYear: oldPosYear.accounting,
  bookValue: oldPosBookAtSale,
  accountingGain,
  taxValue: Y1_ASSET.computers.closingTaxValue,
  taxDepClaimed: r2(Y1_ASSET.computers.boost + Y1_ASSET.computers.taxDep),
  recovered: taxDisposal.recovered,
};

/* ───────────────────────── 5. The year's one-off events ───────────────────────── */

const eftposCarry = OPENING_BALANCES["110"];
const eftposFee = r2(eftposCarry * MERCHANT_FEE);

const EVENTS: Transaction[] = [
  ...REVERSALS,
  {
    id: "B01",
    date: START,
    title: "31 March card sales arrive in the bank",
    kind: "routine",
    book: "cash-receipts",
    story: `The card sales from the last day of last year (${money2(eftposCarry)}) were still in EFTPOS clearing at year end. The bank pays them out today, less its merchant fee.`,
    lines: [
      { account: "100", debit: r2(eftposCarry - eftposFee) },
      { account: "622", debit: eftposFee },
      { account: "110", credit: eftposCarry },
    ],
  },
  {
    id: "B02",
    date: "2027-04-08",
    title: "March's power bill finally arrives",
    kind: "featured",
    book: "purchases",
    story: "Kahu Energy's bill for March arrives: $538 + GST. The accountant estimated $520. Because that accrual was reversed on 1 April, Ben just enters the bill the normal way. Power expense nets to $18 for April so far: the error in last year's estimate.\n\nThat $18 isn't corrected in last year's accounts. Estimates are expected to be slightly off, and a small difference simply lands in the year it's found. GST is claimed now, because the tax invoice has arrived.",
    doc: supplierInvoice("power", "KE-2027-0331", "2027-04-08", [{ desc: "Electricity & gas, 1–31 March 2027", qty: 1, unit: 538, amount: 538 }]),
    lines: buyLines("611", 618.7, "200", { party: "Kahu Energy Ltd", why: "March's real cost; the reversal already took the $520 estimate out.", creditWhy: "Owed to Kahu Energy until the 20th of next month." }),
  },
  {
    id: "B03",
    date: "2027-04-09",
    title: "Invoice the school for March's farewell",
    kind: "featured",
    book: "sales",
    story: "Ben sends Seaview Primary the invoice for the farewell catered on 30 March. It's recorded like any sale: debtor, income and GST. GST is returned now, because issuing the invoice is the GST time of supply.\n\nThe $600 of income cancels the reversal from 1 April, so none of it counts in this year's profit. It was counted last year.",
    doc: salesInvoice("school", "INV-0005", "2027-04-09", [{ desc: "Farewell afternoon tea for 40 (30 March)", qty: 1, unit: 600, amount: 600 }]),
    lines: [
      { account: "120", debit: 690, party: CUSTOMERS.school.name },
      { account: "410", credit: 600, why: "Cancels the 1 April reversal: the income was last year's." },
      { account: "210", credit: 90, gst: "output", why: "GST is due now the invoice is issued." },
    ],
  },
  {
    id: "B04",
    date: "2027-04-17",
    title: "The wedding: deposit becomes income",
    kind: "featured",
    book: "sales",
    story: "The Morgans' wedding happens today. The full catering price is $4,000 + GST. They paid a $1,150 deposit in March, which has been sitting in [[income-in-advance]] as a liability.\n\nNow that the work is done, all $4,000 becomes income: $1,000 from the deposit (the liability is cleared) and $3,000 invoiced for the balance. GST on the deposit was already returned in March, so only the balance's $450 of GST is added now.",
    doc: salesInvoice("wedding", "INV-0006", "2027-04-17", [{ desc: "Wedding catering for 80 guests", qty: 1, unit: 4_000, amount: 4_000 }, { desc: "Less deposit received 25 March (excl GST)", qty: 1, unit: -1_000, amount: -1_000 }]),
    lines: [
      { account: "225", debit: 1_000, why: "The deposit is now earned: the liability is cleared." },
      { account: "120", debit: 3_450, party: CUSTOMERS.wedding.name, why: "The balance still to be paid." },
      { account: "410", credit: 4_000, why: "All the catering income is earned today." },
      { account: "210", credit: 450, gst: "output", why: "GST on the balance only. The deposit's GST was returned in March." },
    ],
  },
  { id: "B05", date: "2027-05-04", title: "The Morgans pay the wedding balance", kind: "routine", book: "cash-receipts", story: "INV-0006 paid in full.", lines: [{ account: "100", debit: 3_450 }, { account: "120", credit: 3_450, party: CUSTOMERS.wedding.name }] },
  { id: "B06", date: "2027-05-10", title: "School pays its invoice", kind: "routine", book: "cash-receipts", story: "Seaview Primary pays INV-0005.", lines: [{ account: "100", debit: 690 }, { account: "120", credit: 690, party: CUSTOMERS.school.name }] },
  {
    id: "B07",
    date: "2027-06-10",
    title: "The accountant's bill for last year's accounts",
    kind: "featured",
    book: "purchases",
    story: "Rata & Co invoice $3,200 + GST for preparing last year's financial statements and tax return.\n\nIt's an expense of **this** year, even though it's about last year's accounts. The work was done this year (April–June), and on the accrual basis expenses go where the service is received.",
    doc: supplierInvoice("accountant", "RC-2027-118", "2027-06-10", [{ desc: "Annual financial statements y/e 31 March 2027", qty: 1, unit: 2_400, amount: 2_400 }, { desc: "Company income tax return (IR4) & shareholders' IR3s", qty: 1, unit: 800, amount: 800 }]),
    lines: buyLines("618", 3_680, "200", { party: "Rata & Co Chartered Accountants", why: "Accounting fees are deductible business expenses.", creditWhy: "Owed until the 20th of next month." }),
  },
  provPayment(
    "B08",
    0,
    `Last year's [[terminal-tax|residual income tax]] was ${money2(PROVISIONAL.y1Rit)}. That's over $5,000, so this year Kōwhai is a [[provisional-tax|provisional taxpayer]]: it pays this year's tax during the year, in three instalments.\n\nRata & Co use the **standard option**: last year's RIT plus 5% = ${money2(PROVISIONAL.total)}, split into thirds. It's simple and safe: with RIT under $60,000, if every instalment is paid on time IRD charges no [[uomi|use-of-money interest]] (the "safe harbour"), even if this year's tax turns out higher.\n\nThe payment is an asset (tax paid in advance), not an expense.`,
  ),
  {
    id: "B09",
    date: SALE_DATE,
    title: "Depreciate the old POS system up to the sale",
    kind: "featured",
    book: "general",
    story: `Before an asset is sold, its accounting depreciation is brought up to date, so the book value is right on the day of sale. The old POS system was used for 6 months this year: ${money2(Y1_ASSET.computers.closingBookValue)} × 50% × 6/12 = ${money2(oldPosYear.accounting)}.\n\nTax works differently: no tax depreciation is claimed in the year an asset is sold (IR260). The sale itself sorts out any difference.`,
    lines: [
      { account: "626", debit: oldPosYear.accounting, why: "Six months of use this year." },
      { account: "176", credit: oldPosYear.accounting, why: "Accumulated depreciation brought up to the date of sale." },
    ],
    deepDives: [{ href: "/nz/depreciation", label: "Depreciation & disposals" }],
  },
  {
    id: "B10",
    date: SALE_DATE,
    title: "Sell the old POS system",
    kind: "featured",
    book: "cash-receipts",
    story: `The café upgrades its till system and sells the old one to a second-hand dealer for ${money2(SALE_PRICE)} + GST.\n\n**In the accounts**: the asset's cost (${money2(OLD_POS.cost)}) and its accumulated depreciation (${money2(DISPOSAL.accDepToSale)}) are both removed. Book value was ${money2(oldPosBookAtSale)}, so selling for ${money2(SALE_PRICE)} is a **gain on sale** of ${money2(accountingGain)}.\n\n**For tax**: the tax book value is ${money2(DISPOSAL.taxValue)} (lower, because of Investment Boost). Selling for more than that means some of the tax depreciation claimed wasn't really lost value, so IRD takes it back as [[depreciation-recovery|depreciation recovery income]]: ${money2(DISPOSAL.recovered)}.\n\n**GST**: selling a business asset is a taxable supply. The café charges GST on the sale and returns it.`,
    doc: { kind: "tax-invoice-out", title: "Tax invoice – sale of equipment", issuer: BUSINESS.name, recipient: "Second Life Electronics Ltd", date: SALE_DATE, items: [{ desc: "Used POS terminal, laptop & receipt printer", amount: SALE_PRICE }], totals: [{ label: "GST", value: money2(SALE_PRICE * 0.15) }, { label: "Total", value: money2(SALE_PRICE * 1.15), strong: true }] },
    lines: [
      { account: "100", debit: r2(SALE_PRICE * 1.15), why: "Sale price received, including GST." },
      { account: "176", debit: DISPOSAL.accDepToSale, why: "Removes all the depreciation built up on this asset." },
      { account: "175", credit: OLD_POS.cost, why: "Removes the asset's original cost." },
      { account: "460", credit: accountingGain, why: "Sold for more than book value: a gain (other income)." },
      { account: "210", credit: r2(SALE_PRICE * 0.15), gst: "output", why: "GST on selling a business asset." },
    ],
    quiz: { q: "Is the $900 sale price income?", options: ["Yes, all $900", "No: only the gain above book value is income", "No: selling assets never affects profit"], answer: 1, explain: "The asset's book value leaves the balance sheet. Only the difference between the price and book value is a gain (or loss) in the P&L." },
    deepDives: [{ href: "/nz/depreciation", label: "Depreciation recovery" }],
  },
  {
    id: "B11",
    date: "2027-10-01",
    title: "Buy a new POS system",
    kind: "featured",
    book: "cash-payments",
    story: `The new till system and two tablets cost ${money2(NEW_POS.cost)} + GST. That's over the $1,000 low-value asset limit, so it's capitalised as a fixed asset (computer equipment), not expensed.\n\nIt's a new asset bought after 22 May 2025, so it qualifies for [[investment-boost]]: an extra 20% tax deduction this year.`,
    doc: supplierInvoice("tech", "TT-4471", "2027-10-01", [{ desc: "POS terminal, 2 tablets & printer, installed", qty: 1, unit: 2_800, amount: 2_800 }], { paid: "PAID 1/10/27" }),
    lines: buyLines("175", 3_220, "100", { why: "A fixed asset at cost (excl GST).", creditWhy: "Paid from the bank." }),
  },
  {
    id: "B12",
    date: "2027-10-01",
    title: "Renew the insurance",
    kind: "featured",
    book: "cash-payments",
    story: "The policy is renewed for 1 October 2027 – 30 September 2028: $2,600 + GST, up $200 on last year. As before, it's expensed now, and at year end the unused 6 months move to prepaid insurance.",
    doc: supplierInvoice("insurer", "POL-91233-R1", "2027-10-01", [{ desc: "Business package policy 1 Oct 2027 – 30 Sep 2028", qty: 1, unit: 2_600, amount: 2_600 }], { paid: "PAID 1/10/27" }),
    lines: buyLines("613", 2_990, "100", { why: "Expensed now, adjusted at year end.", creditWhy: "Paid from the bank." }),
  },
  {
    id: "B13",
    date: "2027-12-14",
    title: "Christmas catering for Harbour Law again",
    kind: "routine",
    book: "sales",
    story: "Harbour Law books its Christmas function again: $3,400 + GST, on credit.",
    doc: salesInvoice("harbourLaw", "INV-0007", "2027-12-14", [{ desc: "Christmas canapés (130 guests)", qty: 130, unit: 20, amount: 2_600 }, { desc: "Barista service & staff", qty: 1, unit: 800, amount: 800 }]),
    lines: [
      { account: "120", debit: 3_910, party: CUSTOMERS.harbourLaw.name },
      { account: "410", credit: 3_400 },
      { account: "210", credit: 510, gst: "output" },
    ],
  },
  {
    id: "B14",
    date: "2027-12-17",
    title: "Staff Christmas function",
    kind: "routine",
    book: "cash-payments",
    story: "The team's Christmas dinner: $700 + GST. Entertainment again, so only 50% deductible.",
    lines: buyLines("623", 805, "100", { why: "Entertainment expense.", creditWhy: "Card payment." }),
  },
  provPayment("B15", 1, `The second provisional instalment: another third of ${money2(PROVISIONAL.total)}. The third is due on 7 May 2028, after year end.`),
  { id: "B16", date: "2028-01-21", title: "Harbour Law pays", kind: "routine", book: "cash-receipts", story: "Harbour Law pays INV-0007.", lines: [{ account: "100", debit: 3_910 }, { account: "120", credit: 3_910, party: CUSTOMERS.harbourLaw.name }] },
];

/* ───────────────────────── 6. During the year ───────────────────────── */

const base = [...EVENTS, ...PAYROLL, ...payePayments(YEAR2, [...Y1_PAYROLL, ...PAYROLL]), ...monthlyRoutine(YEAR2)].sort(byDate);
const withAp = [...base, ...supplierPayments(YEAR2, [...Y1_ALL, ...base])].sort(byDate);

export const GST_PERIODS_Y2 = gstPeriodsFor(2027, "Y2-");
const gstY1P6 = gstSettlement(GST_PERIODS[5], gstReturn(Y1_ALL, GST_PERIODS[5]), {
  id: "GST-P6",
  featured: true,
  story: (r, amt) =>
    `Last year's final GST return (February–March 2027) is due today, 7 May. It includes the year-end GST adjustments: the bad debt (box 13) and the entertainment adjustment (box 9). GST to pay: ${money2(amt)}.\n\nThis GST was already owed at 31 March: it was the credit balance in the GST account on last year's balance sheet. Paying it is just settling that liability.`,
});
const gstSettlements = GST_PERIODS_Y2.slice(0, 5).map((p) =>
  gstSettlement(p, gstReturn(withAp, p), {
    id: `GST-${p.id}`,
    featured: false,
    deepHref: "/nz/gst-return",
    story: (r, amt, refund) => `GST return for ${p.label}: GST collected ${money2(r.box10)} − GST claimed ${money2(r.box14)} = ${money2(amt)} ${refund ? "refunded" : "to pay"}.`,
  }),
);

const preDividend = [...withAp, gstY1P6, ...gstSettlements].sort(byDate);

/* ───────────────────────── 7. The dividend ───────────────────────── */

const DIV_DATE = "2028-02-15";
const DIV_CASH = 20_000;
const icRate = COMPANY_TAX_RATE / (1 - COMPANY_TAX_RATE); // 28/72
const divShare = SHAREHOLDERS.map((s) => {
  const cash = r2(DIV_CASH * s.pct);
  const ic = r2(cash * icRate);
  const gross = r2(cash + ic);
  const rwt = r2(gross * RWT.dividendRate - ic);
  return { ...s, cash, ic, gross, rwt, paid: r2(cash - rwt) };
});
const DIV_IC = r2(divShare.reduce((s, x) => s + x.ic, 0));
const DIV_RWT = r2(divShare.reduce((s, x) => s + x.rwt, 0));

/** Imputation credit account: a memorandum record (not part of the ledger) of tax paid that can be passed to shareholders */
export const ICA: { date: string; label: string; credit: number; debit: number }[] = [
  { date: "2027-01-15", label: "Voluntary provisional tax paid (year 1)", credit: 3_000, debit: 0 },
  { date: "2027-02-28", label: "RWT deducted from term deposit interest (year 1)", credit: Y1_TAX.rwt, debit: 0 },
  ...PROVISIONAL.instalments.filter((i) => i.date <= YE).map((i, n) => ({ date: i.date, label: `Provisional tax instalment ${n + 1}`, credit: i.amount, debit: 0 })),
  { date: DIV_DATE, label: "Imputation credits attached to the dividend", credit: 0, debit: DIV_IC },
].sort((a, b) => a.date.localeCompare(b.date));
const icaBefore = (iso: string) => r2(ICA.filter((e) => e.date < iso).reduce((s, e) => s + e.credit - e.debit, 0));

const solvency = (() => {
  const b = balances([OPENING_ENTRY, ...preDividend.filter((t) => t.date < DIV_DATE)]);
  // a liability account in debit (e.g. an overdrawn shareholder current account) is really money owed TO the company
  const liab = ACCOUNTS.filter((a) => a.type === "liability");
  const owedTo = r2(liab.reduce((s, a) => s + Math.max(0, b[a.code] ?? 0), 0));
  const assets = r2(ACCOUNTS.filter((a) => a.type === "asset").reduce((s, a) => s + (b[a.code] ?? 0), 0) + owedTo);
  const liabilities = r2(liab.reduce((s, a) => s - Math.min(0, b[a.code] ?? 0), 0));
  const current = r2(liab.filter((a) => a.subtype === "current-liability").reduce((s, a) => s - Math.min(0, b[a.code] ?? 0), 0));
  return { assets, liabilities, bank: r2(b["100"]), current };
})();

export const DIVIDEND = { date: DIV_DATE, cash: DIV_CASH, ic: DIV_IC, rwt: DIV_RWT, shares: divShare, icaBefore: icaBefore(DIV_DATE), solvency };

const DIVIDEND_TXNS: Transaction[] = [
  {
    id: "B17",
    date: DIV_DATE,
    title: "Pay a fully imputed dividend",
    kind: "featured",
    book: "cash-payments",
    story: `The café has had two profitable years, so the directors pay the shareholders a [[dividend]] of ${money2(DIV_CASH)}, split 60/40 by shareholding.\n\n**1. Solvency.** Before any dividend, under the [[solvency-test]], the directors must be satisfied that the company can pay its debts as they fall due, and that its assets exceed its liabilities, after the dividend (Companies Act 1993, s 4 and s 52). They sign a certificate saying so.\n\n**2. Imputation credits.** The company has already paid tax on its profits. It passes that credit to the shareholders as [[imputation-credit|imputation credits]]: up to 28/72 of the cash dividend, here ${money2(DIV_IC)}. The [[imputation-credit-account]] holds ${money2(DIVIDEND.icaBefore)} of credits from tax paid so far, so there's enough. NZ does this so company profits aren't taxed twice.\n\n**3. Dividend RWT.** Shareholders are taxed at up to 33%, so the company must deduct [[rwt|RWT]] of 33% of the gross dividend (cash + imputation credits), less the imputation credits: ${money2(DIV_RWT)} in total. It's paid to IRD by the 20th of next month.\n\nIn the books, a dividend is **not an expense**. It's a distribution of profit to the owners, so it reduces retained earnings directly.`,
    doc: {
      kind: "internal",
      title: "Directors' resolution & solvency certificate",
      issuer: BUSINESS.name,
      date: DIV_DATE,
      rows: [
        { label: "Dividend (cash), fully imputed", value: money2(DIV_CASH), strong: true },
        { label: "Total assets before the dividend", value: money2(solvency.assets) },
        { label: "Total liabilities", value: money2(solvency.liabilities) },
        { label: "Assets exceed liabilities after the dividend?", value: `Yes (by ${money2(solvency.assets - DIV_CASH - solvency.liabilities)})` },
        { label: "Able to pay debts as they fall due?", value: "Yes" },
        { label: "  Bank balance", value: money2(solvency.bank) },
        { label: "  Current liabilities", value: money2(solvency.current) },
        ...divShare.map((s) => ({ label: `${s.name}: cash ${money2(s.cash)} + IC ${money2(s.ic)} = ${money2(s.gross)}; RWT ${money2(s.rwt)}`, value: `paid ${money2(s.paid)}` })),
      ],
      footer: ["Signed by both directors. The board is satisfied on reasonable grounds that the company will meet the solvency test immediately after the distribution (Companies Act 1993 s 52)."],
    },
    lines: [
      { account: "310", debit: DIV_CASH, why: "A dividend is a distribution of profit, not an expense: retained earnings go down." },
      ...divShare.map((s) => ({ account: "100", credit: s.paid, party: s.name, memo: `Dividend to ${s.name} (after RWT)`, why: "Cash dividend less the RWT deducted." })),
      { account: "216", credit: DIV_RWT, why: "RWT deducted from the dividends, owed to IRD by 20 March." },
    ],
    notes: [
      `${divShare[0].name.split(" ")[0]}'s side: she includes the gross dividend (${money2(divShare[0].gross)}) in her IR3 and gets credit for ${money2(divShare[0].ic)} of imputation credits plus ${money2(divShare[0].rwt)} of RWT: ${money2(divShare[0].ic + divShare[0].rwt)}, which is 33% of the gross. Her top tax rate is 33%, so she has nothing more to pay on it.`,
      `${divShare[1].name.split(" ")[0]}'s side: his total income is lower, so his top rate is 17.5%. His credits (33%) are more than the tax on the dividend. The extra imputation credits reduce the tax on his salary, and the extra RWT is refunded.`,
      "US contrast: a US C-corporation's dividends are taxed twice (corporate tax, then the shareholder's dividend tax). NZ's imputation system gives shareholders credit for the company's tax.",
    ],
    deepDives: [{ href: "/nz/shareholders", label: "Dividends, imputation & current accounts" }],
  },
  {
    id: "B18",
    date: "2028-03-20",
    title: "Pay the dividend RWT to IRD",
    kind: "featured",
    book: "cash-payments",
    story: `The ${money2(DIV_RWT)} of RWT deducted from February's dividend is due by the 20th. The café also files the investment income information, so IRD can credit each shareholder with the RWT taken from their dividend.`,
    doc: { kind: "ird", title: "RWT on dividends", issuer: "Inland Revenue", recipient: BUSINESS.name, ref: "Investment income – February 2028", date: "2028-03-20", rows: [{ label: "Dividend RWT deducted", value: money2(DIV_RWT), strong: true }] },
    lines: [
      { account: "216", debit: DIV_RWT, why: "The RWT liability is cleared." },
      { account: "100", credit: DIV_RWT, why: "Paid from the bank." },
    ],
  },
];

export const DURING_YEAR: Transaction[] = [...preDividend, ...DIVIDEND_TXNS].sort(byDate);

/* ───────────────────────── 8. Year-end adjustments ───────────────────────── */

const pre = balances(DURING_YEAR);
const adj = (t: Omit<Transaction, "date" | "kind" | "book">): Transaction => ({ date: YE, kind: "adjustment", book: "general", ...t });

const entertainmentEx = pre["623"];
const entAdj = r2(entertainmentEx * 1.15 * 0.5 * (3 / 23));
const powerEstimate = 550;
const prepaidIns = 1_300;

const ACCRUAL_DAYS = 11; // 21–31 March worked, paid 5 April 2028
const lastRun = RUNS[RUNS.length - 1];
const fortnight = RAISED.map((e) => calcPay(e, YEAR2.hoursFor(e.id, "2028-04-05"), YEAR2.acc));
const fortnightGross = r2(fortnight.reduce((s, p) => s + p.gross, 0));
const accruedGross = r2(fortnightGross * (ACCRUAL_DAYS / 14));
const accruedKs = r2(accruedGross * 0.035);

const miaYearGross = r2(RUNS.reduce((s, run) => s + run.results[0].gross, 0));
const miaAccruedGross = r2(fortnight[0].gross * (ACCRUAL_DAYS / 14));
const holidayTarget = r2((miaYearGross + miaAccruedGross) * 0.08);
const holidayBalance = r2(-(OPENING_BALANCES["220"] + pre["220"])); // what's left of last year's accrual (normally 0)
const holidayAdj = r2(holidayTarget - holidayBalance);

const ASSETS_Y2 = [
  ...FIXED_ASSETS.filter((a) => a.id !== "computers").map((a) => ({ a, ...assetYear(a, { openingBook: Y1_ASSET[a.id].closingBookValue, openingTax: Y1_ASSET[a.id].closingTaxValue, firstYear: false, yearEnd: YE }) })),
  { a: NEW_POS, ...assetYear(NEW_POS, { openingBook: NEW_POS.cost, openingTax: NEW_POS.cost, firstYear: true, yearEnd: YE }) },
];
const depTotal = r2(ASSETS_Y2.reduce((s, x) => s + x.accounting, 0));

export const CLOSING_STOCK_Y2 = [
  { item: "Coffee beans (42 kg)", qty: "42 kg", value: 1_596 },
  { item: "Dry goods & frozen food", qty: "various", value: 1_610 },
  { item: "Milk & dairy (unopened, in date)", qty: "various", value: 240 },
  { item: "Takeaway cups, lids & bags", qty: "4 cartons", value: 760 },
];
const openingStock = OPENING_BALANCES["130"];
const closingStock = CLOSING_STOCK_Y2.reduce((s, x) => s + x.value, 0);
const SALARIES = [{ ...SHAREHOLDERS[0], salary: 65_000 }, { ...SHAREHOLDERS[1], salary: 35_000 }];
const salaryTotal = SALARIES.reduce((s, x) => s + x.salary, 0);

const ADJ_BEFORE_TAX: Transaction[] = [
  adj({
    id: "Y2-ADJ01",
    title: "GST adjustment for entertainment",
    story: `As last year: only 50% of entertainment is deductible, so half the GST claimed on it is paid back in the return covering balance date.\n\nEntertainment (excl GST) ${money2(entertainmentEx)} → incl GST ${money2(entertainmentEx * 1.15)} × 50% × 3/23 = ${money2(entAdj)}.`,
    lines: [
      { account: "623", debit: entAdj, why: "The GST paid back becomes part of the cost of entertainment." },
      { account: "210", credit: entAdj, gst: "adj-output", why: "Extra GST owed to IRD (box 9)." },
    ],
  }),
  adj({
    id: "Y2-ADJ02",
    title: "Accrued expense: March power",
    story: `March's power bill won't arrive until April again. Estimate: ${money2(powerEstimate)} excl GST, a little higher than last year (prices went up). This [[accrued-expense]] will be reversed on 1 April 2028.`,
    lines: [
      { account: "611", debit: powerEstimate, why: "March's power belongs in March." },
      { account: "205", credit: powerEstimate, why: "Owed for power used." },
    ],
  }),
  adj({
    id: "Y2-ADJ03",
    title: "Prepaid insurance: the unused half",
    story: `October's premium (${money2(2_600)} excl GST) covers to 30 September 2028. Six months are unused at 31 March, so ${money2(prepaidIns)} moves to a [[prepayment]].`,
    lines: [
      { account: "136", debit: prepaidIns, why: "Next year's insurance is an asset." },
      { account: "613", credit: prepaidIns, why: "This year's insurance reduced to what was used." },
    ],
  }),
  adj({
    id: "Y2-ADJ04",
    title: `Accrued wages for 21–31 March`,
    story: `The next pay (5 April 2028) covers 21 March – 3 April. ${ACCRUAL_DAYS} of those days are in this year: ${money2(accruedGross)} of wages (${ACCRUAL_DAYS}/14 of a fortnight at the new rates) plus 3.5% employer KiwiSaver.`,
    doc: { kind: "internal", title: "Wages accrual working", issuer: BUSINESS.name, date: YE, rows: [{ label: "Fortnightly gross (Mia + Leo)", value: money2(fortnightGross) }, { label: `× ${ACCRUAL_DAYS}/14 days`, value: money2(accruedGross) }, { label: "Employer KiwiSaver 3.5%", value: money2(accruedKs) }, { label: "Total accrued", value: money2(accruedGross + accruedKs), strong: true }] },
    lines: [
      { account: "600", debit: accruedGross },
      { account: "601", debit: accruedKs },
      { account: "206", credit: r2(accruedGross + accruedKs), why: "Owed to staff (and KiwiSaver) at year end." },
    ],
  }),
  adj({
    id: "Y2-ADJ05",
    title: "Holiday pay accrual for Mia",
    story: `Mia used up last year's leave this year. Since her anniversary she has earned another 4 weeks, which she'll take next year: 8% of her gross earnings this year = ${money2(holidayTarget)}.${Math.abs(holidayBalance) > 0.004 ? ` ${money2(holidayBalance)} was still in the accrual, so only the difference is added.` : " Last year's accrual is fully used, so the whole amount is this year's expense."}`,
    doc: { kind: "internal", title: "Leave liability report", issuer: BUSINESS.name, date: YE, rows: [{ label: "Mia – gross earnings this year", value: money2(miaYearGross + miaAccruedGross) }, { label: "Annual leave owing @ 8%", value: money2(holidayTarget), strong: true }, { label: "Already in the accrual", value: money2(holidayBalance) }] },
    lines: [
      { account: "602", debit: holidayAdj },
      { account: "220", credit: holidayAdj },
    ],
  }),
  adj({
    id: "Y2-ADJ06",
    title: "Depreciation for the year",
    story: `Diminishing value again, but now on each asset's **opening book value** (cost less last year's depreciation), so each year's charge is smaller than the last. The new POS system was bought in October, so it gets 6 months. The old one's depreciation was already charged up to its sale (B09).`,
    doc: { kind: "internal", title: "Fixed asset register – depreciation", issuer: BUSINESS.name, date: YE, rows: [...ASSETS_Y2.map((x) => ({ label: `${x.a.name}: ${money2(r2(x.closingBookValue + x.accounting))} × ${x.a.dvRate * 100}%${x.months < 12 ? ` × ${x.months}/12` : ""}`, value: money2(x.accounting) })), { label: "Total depreciation", value: money2(depTotal), strong: true }] },
    lines: [
      { account: "626", debit: depTotal, why: "The cost of assets used up this year." },
      ...ASSETS_Y2.map((x) => ({ account: x.a.accDepAccount, credit: x.accounting, memo: x.a.name, why: "Builds up accumulated depreciation." })),
    ],
    deepDives: [{ href: "/nz/depreciation", label: "Depreciation methods & rates" }],
  }),
  adj({
    id: "Y2-ADJ07",
    title: "Stocktake: last year's stock out, this year's in",
    story: `In year 1 there was no opening stock. Now there is: the ${money2(openingStock)} counted on 31 March 2027 was sold during this year, so it's part of this year's cost of sales. This year's count is ${money2(closingStock)}.\n\nThe entry does both: last year's stock leaves inventory and becomes **opening stock** (cost of sales), and this year's count goes back in.\n\n[[cost-of-goods-sold|Cost of goods sold]] = opening stock + purchases − closing stock.`,
    doc: { kind: "stocktake", title: "Stocktake sheet – 31 March 2028", issuer: BUSINESS.name, date: YE, items: CLOSING_STOCK_Y2.map((s) => ({ desc: s.item, amount: s.value })), totals: [{ label: "Total stock at cost", value: money2(closingStock), strong: true }] },
    lines: [
      { account: "518", debit: openingStock, why: "Last year's stock was sold this year: it's a cost of this year's sales." },
      { account: "130", credit: openingStock, why: "Last year's stock figure is removed…" },
      { account: "130", debit: closingStock, why: "…and replaced by this year's count." },
      { account: "519", credit: closingStock, why: "Unsold stock comes out of cost of sales." },
    ],
    deepDives: [{ href: "/nz/inventory", label: "Inventory & cost of sales" }],
  }),
  adj({
    id: "Y2-ADJ08",
    title: "Shareholder salaries",
    story: `The accountant allocates this year's [[shareholder-salary|shareholder salaries]]: Aroha ${money2(SALARIES[0].salary)} and Ben ${money2(SALARIES[1].salary)}, credited to their current accounts. They're higher than last year because the café is doing better.`,
    doc: { kind: "internal", title: "Directors' resolution – shareholder-employee salaries", issuer: BUSINESS.name, date: YE, rows: SALARIES.map((s) => ({ label: s.name, value: money2(s.salary) })) },
    lines: [
      { account: "605", debit: salaryTotal, why: "An expense of the company." },
      ...SALARIES.map((s) => ({ account: s.currentAccount, credit: s.salary, party: s.name, why: `Owed to ${s.name.split(" ")[0]}: credited to the current account.` })),
    ],
  }),
];

/* ───────────────────────── 9. Income tax ───────────────────────── */

const afterAdj = balances([...DURING_YEAR, ...ADJ_BEFORE_TAX]);
export const PROFIT_BEFORE_TAX = profitOf(afterAdj);
const provisionalPaid = r2(afterAdj["141"]);

const taxAssets: TaxAssetRow[] = [
  { asset: OLD_POS, accounting: oldPosYear.accounting, boost: 0, taxDep: 0, note: "sold: no tax depreciation in the year of sale" },
  ...ASSETS_Y2.map((x) => ({ asset: x.a, accounting: x.accounting, boost: x.boost, taxDep: x.taxDep })),
];
const accountingDepAll = r2(taxAssets.reduce((s, x) => s + x.accounting, 0));
const taxDepAll = r2(taxAssets.reduce((s, x) => s + x.taxDep, 0));
const boostAll = r2(taxAssets.reduce((s, x) => s + x.boost, 0));
const openingHoliday = Y1_FACTS.holidayAccrual;

const items: TaxItem[] = [
  { label: "Add back: 50% of entertainment", amount: r2(afterAdj["623"] * 0.5), explain: "Food and drink with a private or social element is only 50% deductible." },
  { label: "Add back: holiday pay accrued at year end", amount: holidayTarget, explain: "Accrued holiday pay is only deductible when it's paid (or if paid within 63 days of balance date). Mia takes this leave next year." },
  { label: "Less: last year's holiday pay accrual, paid out this year", amount: -openingHoliday, explain: "Last year this was added back because it hadn't been paid. Mia took the leave this year, so it's deductible now. Over the two years, the whole amount is deducted exactly once." },
  { label: "Add back: accounting depreciation", amount: accountingDepAll, explain: "The accounts' depreciation (including the 6 months on the POS system that was sold) is replaced by tax depreciation…" },
  { label: "Less: tax depreciation", amount: -taxDepAll, explain: "…on each asset's adjusted tax value. No tax depreciation is claimed on an asset in the year it's sold." },
  { label: "Less: Investment Boost on the new POS system", amount: -boostAll, explain: "20% of the cost of the new asset, deducted up front." },
  { label: "Less: accounting gain on sale (not taxable as such)", amount: -accountingGain, explain: "The accounting gain is measured against book value. For tax, the sale is measured against tax book value instead (next line)." },
  { label: "Add: depreciation recovery income", amount: DISPOSAL.recovered, explain: "Sold for more than its tax book value, so the excess tax depreciation is clawed back as income (capped at the depreciation claimed, including Investment Boost)." },
];

export const TAX = taxFromItems({ profitBeforeTax: PROFIT_BEFORE_TAX, items, assets: taxAssets, rwt: 0, provisional: PROVISIONAL.total });

const ADJ_TAX: Transaction[] = [
  adj({
    id: "Y2-ADJ09",
    title: "Income tax expense for the year",
    story: `Accounting profit before tax ${money2(PROFIT_BEFORE_TAX)} → taxable income ${money2(TAX.taxableIncome)} → tax at 28% = ${money2(TAX.tax)}. See the tax reconciliation for each difference.`,
    doc: { kind: "internal", title: "Income tax computation (summary)", issuer: BUSINESS.name, date: YE, rows: [{ label: "Profit before tax", value: money2(PROFIT_BEFORE_TAX) }, ...TAX.items.map((i) => ({ label: i.label, value: money2(i.amount) })), { label: "Taxable income", value: money2(TAX.taxableIncome), strong: true }, { label: "Tax @ 28%", value: money2(TAX.tax), strong: true }] },
    lines: [
      { account: "690", debit: TAX.tax, why: "This year's tax is this year's expense." },
      { account: "230", credit: TAX.tax, why: "Owed to IRD." },
    ],
    deepDives: [{ href: "/nz/income-tax", label: "Company income tax & the IR4" }],
  }),
  adj({
    id: "Y2-ADJ10",
    title: "Use the provisional tax paid against the tax bill",
    story: `Two instalments (${money2(provisionalPaid)}) were paid during the year. They're set against the liability. The third instalment (${money2(PROVISIONAL.instalments[2].amount)}, due 7 May 2028) and any terminal tax are still owed.\n\nIncome tax payable now also still includes **last year's** terminal tax of ${money2(Y1_TAX.terminal)}, due 7 April 2028, a week after balance date.`,
    lines: [
      { account: "230", debit: provisionalPaid },
      { account: "141", credit: provisionalPaid },
    ],
    deepDives: [{ href: "/nz/provisional-tax", label: "Provisional & terminal tax" }],
  }),
];

export const ADJUSTMENTS = [...ADJ_BEFORE_TAX, ...ADJ_TAX];
export const BEFORE_CLOSING = [...DURING_YEAR, ...ADJUSTMENTS];

/* ───────────────────────── 10. Closing ───────────────────────── */

const closed = closingEntries(balances(BEFORE_CLOSING), YE, "Y2-");
export const NET_PROFIT = closed.netProfit;
export const CLOSING: Transaction[] = closed.entries;
export const ALL = [...BEFORE_CLOSING, ...CLOSING];

/** Year 1 and year 2 together: the café's full ledger (for bank recs and GST returns that span the two) */
export const LEDGER = [...Y1_ALL, ...ALL];
/** Opening entry + this year's entries: balances at any point in year 2 */
export const WITH_OPENING = [OPENING_ENTRY, ...ALL];

export const YEAR2_FACTS = {
  start: START,
  yearEnd: YE,
  y1NetProfit: Y1_NET_PROFIT,
  y1Terminal: Y1_TAX.terminal,
  provisionalPaid,
  openingStock,
  closingStock,
  depTotal: r2(depTotal + oldPosYear.accounting),
  holidayTarget,
  accruedGross,
  accrualDays: ACCRUAL_DAYS,
  entAdj,
  salaries: SALARIES,
  lastPayDate: lastRun.date,
  thirdInstalment: PROVISIONAL.instalments[2],
  terminalDue: "2029-04-07",
  icaClosing: r2(ICA.reduce((s, e) => s + e.credit - e.debit, 0)),
  firstPayDate: nzDate(YEAR2.firstPayDate),
};
