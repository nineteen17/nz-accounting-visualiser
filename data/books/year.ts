import type { JournalLine, Transaction } from "@/lib/engine/types";
import { r2, nzDate } from "@/lib/money";
import { calcPay, type PayResult } from "@/lib/nz/payroll";
import { BUSINESS, CUSTOMERS, EMPLOYEES, MONTHLY_SALES, PURCHASE_MIX, SUPPLIERS } from "../business";
import { EFTPOS_SHARE, LOAN_SCHEDULE, MERCHANT_FEE } from "./april";
import { addDays, buyLines, day, gstOf, incl, lastDay, money2, monthsBetween, nextMonth, salesInvoice, supplierInvoice } from "./helpers";

const ALL_MONTHS = monthsBetween("2026-04", "2027-03");
const LATER_MONTHS = ALL_MONTHS.slice(1);
const monthLabel = (ym: string) => nzDate(`${ym}-01`).split(" ").slice(1).join(" ");

/* ───────────────────────── PAYROLL ───────────────────────── */

export const LEO_HOURS: Record<string, number> = {
  "04": 30, "05": 30, "06": 24, "07": 24, "08": 26, "09": 30, "10": 30, "11": 34, "12": 44, "01": 44, "02": 36, "03": 30,
};
export const MIA_HOURS = 80;

export function payDates() {
  const out: string[] = [];
  let dte = "2026-04-22";
  while (dte <= "2027-03-31") {
    out.push(dte);
    dte = addDays(dte, 14);
  }
  return out;
}

export interface PayRun {
  date: string;
  periodFrom: string;
  periodTo: string;
  results: PayResult[];
}

export const PAY_RUNS: PayRun[] = payDates().map((date) => {
  const mm = date.slice(5, 7);
  return {
    date,
    periodFrom: addDays(date, -15),
    periodTo: addDays(date, -2),
    results: EMPLOYEES.map((e) => calcPay(e, e.id === "mia" ? MIA_HOURS : LEO_HOURS[mm])),
  };
});

const sumBy = (rs: PayResult[], k: keyof PayResult) => r2(rs.reduce((a, r) => a + (r[k] as number), 0));

function payrollLines(run: PayRun): JournalLine[] {
  const rs = run.results;
  return [
    { account: "600", debit: sumBy(rs, "gross"), memo: "Gross wages – " + rs.map((r) => `${r.employee.name.split(" ")[0]} ${money2(r.gross)}`).join(", "), why: "The full wage earned (before deductions) is the café's expense." },
    { account: "601", debit: sumBy(rs, "ksEmployerGross"), memo: "Employer KiwiSaver 3.5% (gross)", why: "The café's own KiwiSaver contribution is an extra employment cost on top of wages." },
    ...rs.map((r) => ({ account: "100", credit: r.net, party: r.employee.name, memo: `Net pay – ${r.employee.name}`, why: "Take-home pay transferred to the employee's bank account." })),
    { account: "215", credit: sumBy(rs, "paye"), memo: "PAYE (incl ACC earners' levy)", why: "Tax deducted from staff pay. The café collects it for IRD, so it's a liability." },
    ...(sumBy(rs, "studentLoan") ? [{ account: "215", credit: sumBy(rs, "studentLoan"), memo: "Student loan deductions", why: "12% of Mia's pay above the threshold, owed to IRD." }] : []),
    { account: "215", credit: sumBy(rs, "ksEmployee"), memo: "KiwiSaver – employee 3.5%", why: "Deducted from staff pay and passed to IRD for their KiwiSaver." },
    { account: "215", credit: sumBy(rs, "ksEmployerNet"), memo: "KiwiSaver – employer (net of ESCT)", why: "The café's contribution, after tax, goes to IRD → KiwiSaver provider." },
    { account: "215", credit: sumBy(rs, "esct"), memo: "ESCT on employer contribution", why: "Employer superannuation contribution tax is taken out of the employer's contribution." },
  ];
}

function payslip(r: PayResult, run: PayRun) {
  return {
    kind: "payslip" as const,
    title: "Payslip",
    issuer: BUSINESS.name,
    recipient: `${r.employee.name} – ${r.employee.role}`,
    ref: `Tax code ${r.employee.code}${r.employee.studentLoan ? " SL" : ""} · IRD ${r.employee.irdNumber}`,
    date: run.date,
    rows: [
      { label: `Pay period`, value: `${nzDate(run.periodFrom)} – ${nzDate(run.periodTo)}` },
      { label: `Ordinary time ${r.hours} hrs × ${money2(r.employee.rate)}`, value: money2(r.ordinary) },
      ...(r.holidayPay ? [{ label: "Holiday pay 8% (pay-as-you-go)", value: money2(r.holidayPay) }] : []),
      { label: "GROSS PAY", value: money2(r.gross), strong: true },
      { label: "PAYE (income tax)", value: "−" + money2(r.incomeTax) },
      { label: "ACC earners' levy (1.75%)", value: "−" + money2(r.accLevy) },
      ...(r.studentLoan ? [{ label: "Student loan (12% over $928/fn)", value: "−" + money2(r.studentLoan) }] : []),
      { label: "KiwiSaver employee 3.5%", value: "−" + money2(r.ksEmployee) },
      { label: "NET PAY", value: money2(r.net), strong: true },
      { label: "Employer KiwiSaver 3.5% (gross)", value: money2(r.ksEmployerGross) },
      { label: `less ESCT @ ${(r.esctRate * 100).toFixed(1)}%`, value: "−" + money2(r.esct) },
      { label: "Employer KiwiSaver paid to your fund", value: money2(r.ksEmployerNet) },
    ],
    footer: r.ietcPerPay ? [`Tax code ME includes the independent earner tax credit (≈${money2(r.ietcPerPay)} per fortnight).`] : [],
  };
}

const PAYROLL_TXNS: Transaction[] = PAY_RUNS.map((run, i) => {
  const first = i === 0;
  const mia = run.results[0];
  return {
    id: first ? "A21" : `PAY-${String(i + 1).padStart(2, "0")}`,
    date: run.date,
    title: first ? "First pay run: paying the staff" : `Pay run ${i + 1} (${nzDate(run.periodFrom, false)} – ${nzDate(run.periodTo, false)})`,
    kind: first ? "featured" : "routine",
    book: "payroll",
    month: run.date.slice(0, 7),
    story: first
      ? `Payday. Mia (full-time barista) and Leo (casual kitchen hand) are paid fortnightly. This is where NZ payroll gets detailed.\n\nThe café doesn't just pay staff their wage. From each [[gross-pay]] it deducts [[paye]] (which includes the [[acc-earners-levy]]), [[student-loan]] repayments and the employee's [[kiwisaver]] contribution, and passes them all to IRD. On top of the wage, the café must contribute 3.5% to KiwiSaver, minus [[esct]].\n\nLeo is casual, so instead of building up annual leave he gets 8% [[holiday-pay]] added to every pay ("pay-as-you-go").\n\nWithin 2 working days the café must file the [[payday-filing]] (employment information) with IRD. The deductions are paid to IRD by the 20th of next month.`
      : `Fortnightly pay run. Mia ${MIA_HOURS} hrs, Leo ${run.results[1].hours} hrs. Same structure as the first pay run.`,
    doc: first ? payslip(mia, run) : {
      kind: "internal",
      title: "Pay run summary",
      issuer: BUSINESS.name,
      date: run.date,
      rows: run.results.flatMap((r) => [
        { label: `${r.employee.name} – gross`, value: money2(r.gross) },
        { label: `${r.employee.name} – net`, value: money2(r.net) },
      ]),
    },
    lines: payrollLines(run),
    notes: first
      ? [
          `Leo's payslip: gross ${money2(run.results[1].gross)} (incl ${money2(run.results[1].holidayPay)} holiday pay), PAYE ${money2(run.results[1].paye)}, KiwiSaver ${money2(run.results[1].ksEmployee)}, net ${money2(run.results[1].net)}.`,
          `Total cost to the café: ${money2(sumBy(run.results, "employerCost"))} (gross wages + employer KiwiSaver).`,
          "The café files 'employment information' with IRD (payday filing) within 2 working days of payday.",
        ]
      : undefined,
    deepDives: first
      ? [
          { href: "/nz/paye", label: "PAYE, tax codes & payday filing" },
          { href: "/nz/kiwisaver", label: "KiwiSaver & ESCT" },
          { href: "/nz/holidays", label: "Holidays Act & 8% holiday pay" },
        ]
      : undefined,
    quiz: first
      ? {
          q: "Mia's PAYE has been deducted but not yet paid to IRD. What is it in the café's books?",
          options: ["An expense", "A liability", "An asset"],
          answer: 1,
          explain: "The PAYE is part of Mia's wage (already in Wages expense). The café is holding it for IRD, so until it's paid it's a liability.",
        }
      : undefined,
  } satisfies Transaction;
});

/** PAYE & deductions paid by the 20th of the following month */
function payePayments(): Transaction[] {
  const out: Transaction[] = [];
  const byMonth: Record<string, number> = {};
  for (const t of PAYROLL_TXNS) {
    const m = t.date.slice(0, 7);
    byMonth[m] = r2((byMonth[m] ?? 0) + t.lines.filter((l) => l.account === "215").reduce((a, l) => a + (l.credit ?? 0), 0));
  }
  let first = true;
  for (const m of Object.keys(byMonth).sort()) {
    const due = day(nextMonth(m), 20);
    if (due > "2027-03-31") continue;
    out.push({
      id: `PAYE-${m}`,
      date: due,
      title: `Pay ${monthLabel(m)} PAYE & deductions to IRD`,
      kind: first ? "featured" : "routine",
      book: "cash-payments",
      month: due.slice(0, 7),
      story: first
        ? `It's the 20th, so the deductions held from April's pay runs must go to IRD. It's one payment covering PAYE, student loan, KiwiSaver (employee + employer) and ESCT. Paying it clears the liability; it is NOT a new expense, because the cost was recorded when the wages were.`
        : `Monthly payment of deductions from ${monthLabel(m)}'s pay runs.`,
      doc: { kind: "ird", title: "Employer deductions payment", issuer: "Inland Revenue", recipient: BUSINESS.name, ref: `Employer deductions ${monthLabel(m)}`, date: due, rows: [{ label: "Amount paid", value: money2(byMonth[m]), strong: true }] },
      lines: [
        { account: "215", debit: byMonth[m], why: "Liability to IRD cleared." },
        { account: "100", credit: byMonth[m], why: "Paid from the bank." },
      ],
      deepDives: first ? [{ href: "/nz/paye", label: "PAYE due dates" }] : undefined,
    });
    first = false;
  }
  return out;
}

/* ───────────────────────── ROUTINE MONTHLY ───────────────────────── */

function monthlyRoutine(): Transaction[] {
  const out: Transaction[] = [];

  for (const ym of ALL_MONTHS) {
    const end = lastDay(ym);
    const ml = monthLabel(ym);
    const isMarch = ym === "2027-03";

    // Direct debits & card purchases (all months)
    out.push({
      id: `DD-${ym}`,
      date: day(ym, 15),
      title: `${ml} direct debits & card purchases`,
      kind: "routine",
      book: "cash-payments",
      month: ym,
      story: "Regular automatic payments: broadband, accounting software subscription, rubbish collection and cleaning supplies.",
      lines: [
        { account: "612", debit: 100, memo: SUPPLIERS.internet.name },
        { account: "619", debit: 75, memo: SUPPLIERS.software.name },
        { account: "615", debit: 80, memo: SUPPLIERS.waste.name },
        { account: "614", debit: 150, memo: SUPPLIERS.cleaning.name },
        { account: "210", debit: r2(405 * 0.15), gst: "input", memo: "GST claimable" },
        { account: "100", credit: r2(405 * 1.15) },
      ],
    });

    // Bank fees (exempt) – March's are only discovered on the bank statement
    out.push({
      id: `FEE-${ym}`,
      date: end,
      title: `${ml} bank account fees`,
      kind: isMarch ? "featured" : "routine",
      foundInBankRec: isMarch,
      book: "cash-payments",
      month: ym,
      story: isMarch
        ? "Ben spotted this $25 monthly fee while doing the bank reconciliation. The bank charged it straight to the account, so there's no invoice, and it wasn't in the books until he compared them to the bank statement. This is exactly why we reconcile."
        : "Monthly account-keeping fee charged by the bank (GST-exempt).",
      lines: [
        { account: "621", debit: 25 },
        { account: "100", credit: 25 },
      ],
      deepDives: isMarch ? [{ href: "/cycle/bank-reconciliation", label: "Bank reconciliation" }] : undefined,
    });

    if (ym === "2026-04") continue; // rest of April is featured

    const salesEx = MONTHLY_SALES[ym];
    const salesIncl = incl(salesEx);
    const eftpos = r2(salesIncl * EFTPOS_SHARE);
    const cash = r2(salesIncl - eftpos);

    out.push({
      id: `SALES-${ym}`,
      date: end,
      title: `${ml} café sales (Z-reports)`,
      kind: "routine",
      book: "sales",
      month: ym,
      story: `All daily Z-reports for ${ml}: ${money2(salesIncl)} incl GST.`,
      doc: { kind: "z-report", title: `Z-REPORT SUMMARY ${ml}`, issuer: BUSINESS.tradingAs, date: end, rows: [{ label: "Gross sales incl GST", value: money2(salesIncl), strong: true }, { label: "EFTPOS / card", value: money2(eftpos) }, { label: "Cash", value: money2(cash) }] },
      lines: [
        { account: "110", debit: eftpos },
        { account: "105", debit: cash },
        { account: "400", credit: salesEx },
        { account: "210", credit: gstOf(salesIncl), gst: "output" },
      ],
    });

    // Banking
    const unsettled = isMarch ? r2(eftpos / 31) : 0; // 31 March card sales settle on 1 April
    const settled = r2(eftpos - unsettled);
    const fee = r2(settled * MERCHANT_FEE);
    const nightSafe = isMarch ? r2(cash / 31) : 0;
    out.push({
      id: `BANKING-${ym}`,
      date: end,
      title: `${ml} card settlements & cash banked`,
      kind: "routine",
      book: "cash-receipts",
      month: ym,
      story: isMarch
        ? "Card settlements for 1–30 March and cash banked up to 30 March. The card sales from 31 March won't arrive until 1 April, so they stay in EFTPOS clearing at year end."
        : `Card settlements (less merchant fees) and cash deposits for ${ml}.`,
      lines: [
        { account: "100", debit: r2(settled - fee + cash - nightSafe) },
        { account: "622", debit: fee },
        { account: "110", credit: settled },
        { account: "105", credit: r2(cash - nightSafe) },
      ],
    });
    if (isMarch) {
      out.push({
        id: "NIGHTSAFE-2027-03",
        date: "2027-03-31",
        bankDate: "2027-04-01",
        title: "31 March cash takings put in the bank's night safe",
        kind: "featured",
        book: "cash-receipts",
        month: ym,
        story: `After closing on 31 March, Aroha puts the day's cash (${money2(nightSafe)}) in the bank's night-safe deposit box. The books record it today, but the bank won't process it until 1 April. That makes it a [[deposit-in-transit]] in the year-end bank reconciliation.`,
        doc: { kind: "deposit-slip", title: "Night safe deposit slip", issuer: BUSINESS.bank, date: "2027-03-31", rows: [{ label: "Cash deposited", value: money2(nightSafe), strong: true }] },
        lines: [
          { account: "100", debit: nightSafe },
          { account: "105", credit: nightSafe },
        ],
      });
    }

    // Stock purchases on credit
    const p = {
      coffee: r2(salesEx * PURCHASE_MIX.coffee),
      food: r2(salesEx * PURCHASE_MIX.food),
      dairy: r2(salesEx * PURCHASE_MIX.dairy),
      packaging: r2(salesEx * PURCHASE_MIX.packaging),
    };
    const pTot = r2(p.coffee + p.food + p.dairy + p.packaging);
    out.push({
      id: `PURCH-${ym}`,
      date: end,
      title: `${ml} stock purchases on credit`,
      kind: "routine",
      book: "purchases",
      month: ym,
      story: `Supplier invoices for beans, food, milk and packaging received during ${ml}, all on 20th-of-month-following terms.`,
      lines: [
        { account: "510", debit: p.coffee },
        { account: "511", debit: p.food },
        { account: "512", debit: p.dairy },
        { account: "513", debit: p.packaging },
        { account: "210", debit: r2(pTot * 0.15), gst: "input" },
        { account: "200", credit: incl(p.coffee), party: SUPPLIERS.roaster.name },
        { account: "200", credit: incl(p.food), party: SUPPLIERS.food.name },
        { account: "200", credit: incl(p.dairy), party: SUPPLIERS.dairy.name },
        { account: "200", credit: incl(p.packaging), party: SUPPLIERS.packaging.name },
      ],
    });

    // Power bill (March bill hasn't arrived by year end → accrued instead)
    if (!isMarch) {
      const winter = ["2026-06", "2026-07", "2026-08"].includes(ym);
      const amt = winter ? 650 : 500;
      out.push({
        id: `POWER-${ym}`,
        date: day(ym, 28),
        title: `${ml} power bill`,
        kind: "routine",
        book: "purchases",
        month: ym,
        story: `Kahu Energy bill for ${ml}${winter ? " (winter heating pushes it up)" : ""}.`,
        lines: buyLines("611", incl(amt), "200", { party: SUPPLIERS.power.name }),
      });
    }

    // Rent: May & June come out of prepaid rent; from July paid monthly in advance
    if (ym === "2026-05" || ym === "2026-06") {
      out.push({
        id: `RENT-${ym}`,
        date: end,
        title: `${ml} rent used up (from prepaid)`,
        kind: "routine",
        book: "general",
        month: ym,
        story: `Another month of the prepaid rent is used: $3,000 moves from the asset to expense.${ym === "2026-06" ? " Prepaid rent is now zero." : ""}`,
        lines: [
          { account: "610", debit: 3_000 },
          { account: "135", credit: 3_000 },
        ],
      });
    } else {
      out.push({
        id: `RENT-${ym}`,
        date: day(ym, 1),
        title: `${ml} rent paid`,
        kind: "routine",
        book: "cash-payments",
        month: ym,
        story: "Rent paid on the 1st for the month ahead, used up in the same month, so it goes straight to expense.",
        lines: buyLines("610", 3_450, "100"),
      });
    }

    // Loan repayment
    const n = ALL_MONTHS.indexOf(ym);
    const row = LOAN_SCHEDULE.rows[n];
    out.push({
      id: `LOAN-${ym}`,
      date: end,
      title: `${ml} loan repayment`,
      kind: "routine",
      book: "cash-payments",
      month: ym,
      story: `Repayment ${n + 1} of 60: interest ${money2(row.interest)}, principal ${money2(row.principal)}. As the loan shrinks, the interest part shrinks too.`,
      lines: [
        { account: "630", debit: row.interest },
        { account: "250", debit: row.principal },
        { account: "100", credit: row.payment },
      ],
    });

    // Drawings
    out.push({
      id: `DRAW-${ym}`,
      date: day(ym, 15),
      title: `${ml} shareholder drawings`,
      kind: "routine",
      book: "cash-payments",
      month: ym,
      story: "Aroha and Ben take their regular drawings.",
      lines: [
        { account: "240", debit: 3_500, party: "Aroha Ngata" },
        { account: "241", debit: 2_000, party: "Ben Fraser" },
        { account: "100", credit: 5_500 },
      ],
    });
  }
  return out;
}

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

/* ───────────────────────── AP PAYMENTS (20th of following month) ───────────────────────── */

export function supplierPayments(base: Transaction[]): Transaction[] {
  const out: Transaction[] = [];
  let first = true;
  for (const m of ALL_MONTHS) {
    const due = day(nextMonth(m), 20);
    if (due > "2027-03-31") continue;
    const byParty: Record<string, number> = {};
    for (const t of base) {
      if (t.date.slice(0, 7) !== m) continue;
      for (const l of t.lines) if (l.account === "200" && l.credit) byParty[l.party!] = r2((byParty[l.party!] ?? 0) + l.credit);
    }
    const parties = Object.keys(byParty);
    if (!parties.length) continue;
    const total = r2(parties.reduce((a, p) => a + byParty[p], 0));
    out.push({
      id: `APPAY-${m}`,
      date: due,
      title: `Pay suppliers for ${monthLabel(m)} invoices`,
      kind: first ? "featured" : "routine",
      book: "cash-payments",
      month: due.slice(0, 7),
      story: first
        ? "It's the 20th, so Ben pays every supplier invoice from April. Paying a bill is NOT an expense. The expense was recorded when the goods arrived. Paying just clears the liability (accounts payable) and reduces the bank."
        : `Supplier invoices from ${monthLabel(m)} paid on the 20th.`,
      doc: { kind: "bank-transfer", title: "Batch payment", issuer: BUSINESS.bank, date: due, rows: [...parties.map((p) => ({ label: p, value: money2(byParty[p]) })), { label: "Total", value: money2(total), strong: true }] },
      lines: [
        ...parties.map((p) => ({ account: "200", debit: byParty[p], party: p, why: "Amount owed to this supplier cleared." })),
        { account: "100", credit: total, why: "Paid from the bank." },
      ],
      quiz: first ? { q: "Paying a supplier invoice is…", options: ["An expense", "Reducing a liability", "Reducing income"], answer: 1, explain: "The expense was recognised when the invoice was received. Payment reduces accounts payable." } : undefined,
    });
    first = false;
  }
  return out;
}

export const ROUTINE_AND_PAYROLL = [...PAYROLL_TXNS, ...payePayments(), ...monthlyRoutine()];
export const TERM_DEPOSIT = { ...td, interest: tdInterest, rwt: tdRwt };
export { LATER_MONTHS };
