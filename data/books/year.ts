import type { Transaction } from "@/lib/engine/types";
import { r2 } from "@/lib/money";
import { ACC_EARNERS_LEVY } from "@/lib/nz/rates";
import { BUSINESS, CUSTOMERS, EMPLOYEES, MONTHLY_SALES } from "../business";
import { buyLines, money2, monthsBetween, salesInvoice, supplierInvoice } from "./helpers";
import { monthlyRoutine, payePayments, payRuns, payrollTxns, supplierPayments as payAll, type YearConfig } from "./generator";

const ALL_MONTHS = monthsBetween("2026-04", "2027-03");
const LATER_MONTHS = ALL_MONTHS.slice(1);

/* ───────────────────────── YEAR 1 SETTINGS ───────────────────────── */

export const LEO_HOURS: Record<string, number> = {
  "04": 30, "05": 30, "06": 24, "07": 24, "08": 26, "09": 30, "10": 30, "11": 34, "12": 44, "01": 44, "02": 36, "03": 30,
};
export const MIA_HOURS = 80;

export const YEAR1: YearConfig = {
  months: ALL_MONTHS,
  yearEnd: "2027-03-31",
  teach: true,
  firstPayDate: "2026-04-22",
  employeesOn: () => EMPLOYEES,
  hoursFor: (id, date) => (id === "mia" ? MIA_HOURS : LEO_HOURS[date.slice(5, 7)]),
  acc: ACC_EARNERS_LEVY,
  payId: (i) => `PAY-${String(i + 1).padStart(2, "0")}`,
  sales: MONTHLY_SALES,
  skipRoutineMonths: ["2026-04"], // the rest of April is featured, entry by entry
  power: (ym) => {
    const winter = ["2026-06", "2026-07", "2026-08"].includes(ym);
    return { amount: winter ? 650 : 500, winter };
  },
  rentFromPrepaid: ["2026-05", "2026-06"],
  loanFirstRow: 0,
  drawings: { aroha: 3_500, ben: 2_000 },
};

export const PAY_RUNS = payRuns(YEAR1);
export const PAYROLL_TXNS = payrollTxns(YEAR1, PAY_RUNS);

/* ───────────────────────── NOTABLE EVENTS AFTER APRIL ───────────────────────── */

const td = { amount: 20_000, rate: 0.045, days: 150 };
const tdInterest = r2((td.amount * td.rate * td.days) / 365);
const tdRwt = r2(tdInterest * 0.28);

export const LATER_EVENTS: Transaction[] = [
  {
    id: "F01",
    date: "2026-05-08",
    title: "Tūī Consulting pays its invoice",
    kind: "featured",
    book: "cash-receipts",
    story: "The $1,150 from Tūī Consulting arrives in the bank. This is NOT income. The income was recorded on 18 April when the job was done. Today one asset (debtor) simply turns into another (bank).",
    doc: { kind: "bank-statement", title: "Bank statement line", issuer: BUSINESS.bank, date: "2026-05-08", rows: [{ label: "Credit – TUI CONSULTING INV-0001", value: "$1,150.00", strong: true }] },
    lines: [
      { account: "100", debit: 1_150, why: "Bank up." },
      { account: "120", credit: 1_150, party: CUSTOMERS.tui.name, why: "Debtor cleared: Tūī no longer owes anything." },
    ],
    quiz: { q: "Does receiving this payment increase profit?", options: ["Yes, $1,000", "Yes, $1,150", "No"], answer: 2, explain: "Profit was recognised when the invoice was raised. Collecting cash just swaps one asset for another." },
  },
  {
    id: "F02",
    date: "2026-08-11",
    title: "Social media advertising",
    kind: "featured",
    book: "cash-payments",
    story: "Winter is quiet, so Ben runs a month of targeted social media ads: $400 + GST on the business card. The ads are billed from overseas, but the provider charges NZ GST because it's registered here under the remote services rules.",
    doc: { kind: "receipt", title: "Receipt", issuer: "Online ad platform (NZ GST registered)", date: "2026-08-11", items: [{ desc: "Campaign: 'Winter warmers'", amount: 400 }], totals: [{ label: "GST", value: "$60.00" }, { label: "Total", value: "$460.00", strong: true }] },
    lines: buyLines("617", 460, "100", { why: "Advertising expense.", creditWhy: "Card payment." }),
  },
  {
    id: "F03",
    date: "2026-08-14",
    title: "Catering for Seaview Primary School",
    kind: "featured",
    book: "sales",
    story: "Morning tea for the school's open day: $600 + GST, invoiced on 20th-of-month terms.",
    doc: salesInvoice("school", "INV-0002", "2026-08-14", [{ desc: "Morning tea platters (serves 60)", qty: 6, unit: 100, amount: 600 }]),
    lines: [
      { account: "120", debit: 690, party: CUSTOMERS.school.name },
      { account: "410", credit: 600 },
      { account: "210", credit: 90, gst: "output" },
    ],
  },
  {
    id: "F04",
    date: "2026-09-10",
    title: "School pays its invoice",
    kind: "routine",
    book: "cash-receipts",
    story: "Seaview Primary pays INV-0002.",
    lines: [
      { account: "100", debit: 690 },
      { account: "120", credit: 690, party: CUSTOMERS.school.name },
    ],
  },
  {
    id: "F05",
    date: "2026-10-01",
    title: "Renew insurance for 12 months",
    kind: "featured",
    book: "cash-payments",
    story:
      "The six-month policy runs out, and Aroha renews for a full year (1 Oct 2026 – 30 Sep 2027): $2,400 + GST.\n\nIt's recorded as an expense today. But by 31 March only 6 of the 12 months will be used, so a year-end [[adjusting-entry]] moves the unused half ($1,200) into a Prepaid insurance asset.",
    doc: supplierInvoice("insurer", "POL-91233", "2026-10-01", [{ desc: "Business package policy 1 Oct 2026 – 30 Sep 2027", qty: 1, unit: 2_400, amount: 2_400 }], { paid: "PAID 1/10/26" }),
    lines: buyLines("613", 2_760, "100", { why: "Recorded as expense for now (adjusted at year end).", creditWhy: "Paid from the bank." }),
  },
  {
    id: "F06",
    date: "2026-10-01",
    title: "Put spare cash on term deposit",
    kind: "featured",
    book: "cash-payments",
    story: "The bank balance is healthy, so Ben moves $20,000 into a 150-day term deposit at 4.5%. Cash becomes a different asset; there's no income yet.",
    doc: { kind: "agreement", title: "Term Deposit Confirmation", issuer: BUSINESS.bank, recipient: BUSINESS.name, date: "2026-10-01", rows: [{ label: "Principal", value: "$20,000.00", strong: true }, { label: "Rate", value: "4.50% p.a." }, { label: "Term", value: "150 days – matures 28 Feb 2027" }, { label: "RWT rate", value: "28% (company)" }] },
    lines: [
      { account: "115", debit: 20_000 },
      { account: "100", credit: 20_000 },
    ],
  },
  {
    id: "F07",
    date: "2026-10-09",
    title: "Catering for Pop-Up Events",
    kind: "featured",
    book: "sales",
    story: "A festival organiser orders coffee carts and food for a weekend event: $800 + GST, on credit. (Remember this one…)",
    doc: salesInvoice("popup", "INV-0003", "2026-10-09", [{ desc: "Coffee cart & barista – 2 days", qty: 2, unit: 300, amount: 600 }, { desc: "Food boxes", qty: 20, unit: 10, amount: 200 }]),
    lines: [
      { account: "120", debit: 920, party: CUSTOMERS.popup.name },
      { account: "410", credit: 800 },
      { account: "210", credit: 120, gst: "output" },
    ],
  },
  {
    id: "F08",
    date: "2026-11-12",
    title: "Grinder repair",
    kind: "featured",
    book: "cash-payments",
    story: "The grinder burr set is replaced: $300 + GST. A repair that restores the asset to working order is an expense. If it had IMPROVED the asset (more capacity, longer life), it would be capitalised.",
    doc: supplierInvoice("machine", "BMS-11904", "2026-11-12", [{ desc: "Replace burr set & service", qty: 1, unit: 300, amount: 300 }], { paid: "PAID 12/11/26" }),
    lines: buyLines("616", 345, "100", { why: "Repairs & maintenance expense.", creditWhy: "Paid from the bank." }),
  },
  {
    id: "F09",
    date: "2026-12-15",
    title: "Christmas catering for Harbour Law",
    kind: "featured",
    book: "sales",
    story: "The lunch with the law firm in April paid off: a big Christmas function order of $3,000 + GST.",
    doc: salesInvoice("harbourLaw", "INV-0004", "2026-12-15", [{ desc: "Christmas canapés (120 guests)", qty: 120, unit: 20, amount: 2_400 }, { desc: "Barista service & staff", qty: 1, unit: 600, amount: 600 }]),
    lines: [
      { account: "120", debit: 3_450, party: CUSTOMERS.harbourLaw.name },
      { account: "410", credit: 3_000 },
      { account: "210", credit: 450, gst: "output" },
    ],
  },
  {
    id: "F10",
    date: "2026-12-18",
    title: "Staff Christmas function",
    kind: "featured",
    book: "cash-payments",
    story: "Dinner for the team at a local restaurant: $600 + GST. It's [[entertainment]], so it's only 50% deductible for tax.",
    doc: { kind: "receipt", title: "Tax Invoice", issuer: "Bayside Bistro Ltd", recipient: BUSINESS.name, date: "2026-12-18", items: [{ desc: "Set menu × 6, drinks", amount: 600 }], totals: [{ label: "GST", value: "$90.00" }, { label: "Total", value: "$690.00", strong: true }] },
    lines: buyLines("623", 690, "100", { why: "Entertainment expense.", creditWhy: "Card payment." }),
  },
  {
    id: "F11",
    date: "2027-01-15",
    title: "Voluntary provisional tax payment",
    kind: "featured",
    book: "cash-payments",
    story:
      "In its first year the company isn't required to pay [[provisional-tax]]: there's no previous year's tax bill to base it on. But Rata & Co can see the café is profitable, so they suggest paying $3,000 now. That avoids one big bill later and earns IRD credit interest instead of risking use-of-money interest.\n\nIt isn't an expense. It's tax paid in advance: an asset that will be used against the final tax bill.",
    doc: { kind: "ird", title: "Income tax payment", issuer: "Inland Revenue", recipient: BUSINESS.name, ref: "Provisional tax – 2027 income year", date: "2027-01-15", rows: [{ label: "Amount", value: "$3,000.00", strong: true }] },
    lines: [
      { account: "141", debit: 3_000 },
      { account: "100", credit: 3_000 },
    ],
    deepDives: [{ href: "/nz/provisional-tax", label: "Provisional tax explained" }],
  },
  {
    id: "F12",
    date: "2027-01-20",
    title: "Harbour Law pays",
    kind: "routine",
    book: "cash-receipts",
    story: "Harbour Law pays INV-0004 in full.",
    lines: [
      { account: "100", debit: 3_450 },
      { account: "120", credit: 3_450, party: CUSTOMERS.harbourLaw.name },
    ],
  },
  {
    id: "F13",
    date: "2027-02-28",
    title: "Term deposit matures (with RWT deducted)",
    kind: "featured",
    book: "cash-receipts",
    story: `The term deposit matures. Interest earned: ${money2(tdInterest)}. But the bank pays only ${money2(r2(tdInterest - tdRwt))} of it, because it deducts 28% [[rwt]] and sends that to IRD on the café's behalf.\n\nThe café's income is the FULL ${money2(tdInterest)}. The RWT is income tax already paid, so it's recorded as an asset (a tax credit) and used against the year's tax bill.`,
    doc: { kind: "bank-statement", title: "Term deposit maturity advice", issuer: BUSINESS.bank, recipient: BUSINESS.name, date: "2027-02-28", rows: [{ label: "Principal returned", value: "$20,000.00" }, { label: "Gross interest", value: money2(tdInterest) }, { label: "RWT deducted @ 28%", value: "−" + money2(tdRwt) }, { label: "Paid to account", value: money2(r2(20_000 + tdInterest - tdRwt)), strong: true }] },
    lines: [
      { account: "100", debit: r2(20_000 + tdInterest - tdRwt) },
      { account: "140", debit: tdRwt, why: "Tax already paid to IRD on the café's behalf." },
      { account: "115", credit: 20_000 },
      { account: "450", credit: tdInterest, why: "Gross interest is income (GST-exempt)." },
    ],
  },
  {
    id: "F14",
    date: "2027-03-25",
    title: "Wedding deposit received in advance",
    kind: "featured",
    book: "cash-receipts",
    story:
      "A couple books catering for their wedding on 17 April 2027 and pays a $1,150 deposit.\n\nThe café hasn't done the work, so this isn't income yet. It owes the couple a service, which makes it a liability: [[income-in-advance]]. It becomes income in April when the wedding happens.\n\nGST twist: under GST law, the time of supply is the EARLIER of the invoice or payment. Payment has been received, so the GST must be returned now, even though the income isn't recognised yet.",
    doc: { kind: "receipt", title: "Receipt for deposit", issuer: BUSINESS.name, recipient: CUSTOMERS.wedding.name, date: "2027-03-25", rows: [{ label: "Deposit – wedding catering 17 April 2027", value: "$1,150.00", strong: true }, { label: "Includes GST", value: "$150.00" }] },
    lines: [
      { account: "100", debit: 1_150 },
      { account: "225", credit: 1_000, why: "A liability: the café owes the couple a service." },
      { account: "210", credit: 150, gst: "output", why: "GST time of supply has been triggered by the payment." },
    ],
  },
  {
    id: "F15",
    date: "2027-03-31",
    bankDate: "2027-04-01",
    title: "Pay the shopfitter for a small repair",
    kind: "featured",
    book: "cash-payments",
    story: "Totara Shopfitters fix a loose counter panel ($200 + GST). Ben pays online at 9pm on 31 March. The books record it today, but the bank won't process it until 1 April, so it becomes an [[unpresented-payment]] in the bank reconciliation.",
    doc: supplierInvoice("builder", "TS-6120", "2027-03-31", [{ desc: "Refix counter panel", qty: 1, unit: 200, amount: 200 }], { paid: "PAID online 31/3/27" }),
    lines: buyLines("616", 230, "100", { why: "Repair expense.", creditWhy: "Paid online (bank processes it 1 April)." }),
  },
];

export function supplierPayments(base: Transaction[]): Transaction[] {
  return payAll(YEAR1, base);
}

export const ROUTINE_AND_PAYROLL = [...PAYROLL_TXNS, ...payePayments(YEAR1, PAYROLL_TXNS), ...monthlyRoutine(YEAR1)];
export const TERM_DEPOSIT = { ...td, interest: tdInterest, rwt: tdRwt };
export { LATER_MONTHS };
