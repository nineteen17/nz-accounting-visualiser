/**
 * Generate a year of routine books.
 *
 * Both of Kōwhai Café's years are built by these functions, so their routine entries
 * (pay runs, PAYE, monthly bills, sales, banking, supplier payments, GST, closing)
 * follow exactly the same rules. Each year only supplies its own settings and one-off events.
 */
import type { JournalLine, Transaction } from "@/lib/engine/types";
import type { GstPeriod, GstReturn } from "@/lib/engine/gst";
import type { Balances } from "@/lib/engine/ledger";
import { pct, r2, nzDate } from "@/lib/money";
import { calcPay, type Employee, type PayResult } from "@/lib/nz/payroll";
import { HOLIDAYS, type PayrollRates } from "@/lib/nz/rates";
import { BUSINESS, PURCHASE_MIX, SUPPLIERS } from "../business";
import { ACCOUNTS } from "../chartOfAccounts";
import { EFTPOS_SHARE, LOAN_SCHEDULE, MERCHANT_FEE } from "./april";
import { addDays, buyLines, day, gstOf, incl, lastDay, money2, nextMonth } from "./helpers";

export const monthLabel = (ym: string) => nzDate(`${ym}-01`).split(" ").slice(1).join(" ");
const prevMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

export interface PayExtra {
  title?: string;
  /** a featured story for this pay run */
  story?: string;
  /** annual leave taken this fortnight: paid out of the holiday pay accrual, not wages */
  leave?: { employeeId: string; hours: number };
}

export interface YearConfig {
  /** the 12 months of the year, "2026-04" … "2027-03" */
  months: string[];
  yearEnd: string;
  /** year 1 teaches: the first of each kind of entry is featured with a full explanation */
  teach: boolean;
  firstPayDate: string;
  employeesOn: (payDate: string) => Employee[];
  hoursFor: (employeeId: string, payDate: string) => number;
  /** payroll rates for this income year (lib/nz/rates.ts) */
  rates: PayrollRates;
  payId: (i: number, date: string) => string;
  payExtras?: Record<string, PayExtra>;
  /** holiday pay owed at the start of the year (taken leave is paid out of this first) */
  openingHolidayAccrual?: number;
  /** ex-GST café sales by month (months without a figure have their sales entered separately) */
  sales: Record<string, number>;
  /** months whose routine entries (apart from direct debits and fees) are entered separately */
  skipRoutineMonths?: string[];
  power: (ym: string) => { amount: number; winter: boolean };
  /** months whose rent was paid in advance (prepaid rent is used up instead of paid) */
  rentFromPrepaid: string[];
  /** index into the loan schedule of the year's first repayment */
  loanFirstRow: number;
  drawings: { aroha: number; ben: number };
}

/* ───────────────────────── PAYROLL ───────────────────────── */

export interface PayRun {
  date: string;
  periodFrom: string;
  periodTo: string;
  results: PayResult[];
}

export function payDates(first: string, yearEnd: string) {
  const out: string[] = [];
  for (let d = first; d <= yearEnd; d = addDays(d, 14)) out.push(d);
  return out;
}

export function payRuns(cfg: YearConfig): PayRun[] {
  return payDates(cfg.firstPayDate, cfg.yearEnd).map((date) => ({
    date,
    periodFrom: addDays(date, -15),
    periodTo: addDays(date, -2),
    results: cfg.employeesOn(date).map((e) => calcPay(e, cfg.hoursFor(e.id, date), cfg.rates)),
  }));
}

const sumBy = (rs: PayResult[], k: keyof PayResult) => r2(rs.reduce((a, r) => a + (r[k] as number), 0));

function payrollLines(run: PayRun, rates: PayrollRates, leave?: { name: string; pay: number; fromAccrual: number }): JournalLine[] {
  const rs = run.results;
  const er = pct(rates.kiwiSaver.employerMinimum), sl = rates.studentLoan;
  const gross = sumBy(rs, "gross");
  const wageLines: JournalLine[] = leave
    ? [
        { account: "600", debit: r2(gross - leave.pay), memo: "Gross wages for time worked", why: "Wages for hours actually worked are the café's expense." },
        ...(leave.fromAccrual ? [{ account: "220", debit: leave.fromAccrual, memo: `Annual leave – ${leave.name}`, why: "Leave pay comes out of the holiday pay accrual: it was expensed last year, when the leave was earned." }] : []),
        ...(r2(leave.pay - leave.fromAccrual) ? [{ account: "602", debit: r2(leave.pay - leave.fromAccrual), memo: "Leave pay above the amount accrued", why: "The accrual was based on last year's pay rate. Leave is paid at today's rate, so the extra is this year's expense." }] : []),
      ]
    : [{ account: "600", debit: gross, memo: "Gross wages – " + rs.map((r) => `${r.employee.name.split(" ")[0]} ${money2(r.gross)}`).join(", "), why: "The full wage earned (before deductions) is the café's expense." }];
  return [
    ...wageLines,
    { account: "601", debit: sumBy(rs, "ksEmployerGross"), memo: `Employer KiwiSaver ${er} (gross)`, why: "The café's own KiwiSaver contribution is an extra employment cost on top of wages." },
    ...rs.map((r) => ({ account: "100", credit: r.net, party: r.employee.name, memo: `Net pay – ${r.employee.name}`, why: "Take-home pay transferred to the employee's bank account." })),
    { account: "215", credit: sumBy(rs, "paye"), memo: "PAYE (incl ACC earners' levy)", why: "Tax deducted from staff pay. The café collects it for IRD, so it's a liability." },
    ...(sumBy(rs, "studentLoan") ? [{ account: "215", credit: sumBy(rs, "studentLoan"), memo: "Student loan deductions", why: `${pct(sl.rate)} of Mia's pay above the threshold, owed to IRD.` }] : []),
    { account: "215", credit: sumBy(rs, "ksEmployee"), memo: `KiwiSaver – employee ${pct(rs.find((r) => r.employee.kiwiSaver)?.employee.kiwiSaver ?? rates.kiwiSaver.employeeDefault)}`, why: "Deducted from staff pay and passed to IRD for their KiwiSaver." },
    { account: "215", credit: sumBy(rs, "ksEmployerNet"), memo: "KiwiSaver – employer (net of ESCT)", why: "The café's contribution, after tax, goes to IRD → KiwiSaver provider." },
    { account: "215", credit: sumBy(rs, "esct"), memo: "ESCT on employer contribution", why: "Employer superannuation contribution tax is taken out of the employer's contribution." },
  ];
}

export function payslip(r: PayResult, run: PayRun, rates: PayrollRates, leaveHours = 0) {
  const sl = rates.studentLoan;
  return {
    kind: "payslip" as const,
    title: "Payslip",
    issuer: BUSINESS.name,
    recipient: `${r.employee.name} – ${r.employee.role}`,
    ref: `Tax code ${r.employee.code}${r.employee.studentLoan ? " SL" : ""} · IRD ${r.employee.irdNumber}`,
    date: run.date,
    rows: [
      { label: `Pay period`, value: `${nzDate(run.periodFrom)} – ${nzDate(run.periodTo)}` },
      leaveHours
        ? { label: `Annual leave ${leaveHours} hrs × ${money2(r.employee.rate)}`, value: money2(r.ordinary) }
        : { label: `Ordinary time ${r.hours} hrs × ${money2(r.employee.rate)}`, value: money2(r.ordinary) },
      ...(r.holidayPay ? [{ label: `Holiday pay ${pct(HOLIDAYS.payAsYouGoRate)} (pay-as-you-go)`, value: money2(r.holidayPay) }] : []),
      { label: "GROSS PAY", value: money2(r.gross), strong: true },
      { label: "PAYE (income tax)", value: "−" + money2(r.incomeTax) },
      { label: `ACC earners' levy (${pct(rates.acc.rate, 2)})`, value: "−" + money2(r.accLevy) },
      ...(r.studentLoan ? [{ label: `Student loan (${pct(sl.rate)} over ${money2(sl.fortnightlyThreshold).replace(".00", "")}/fn)`, value: "−" + money2(r.studentLoan) }] : []),
      { label: `KiwiSaver employee ${pct(r.employee.kiwiSaver ?? 0)}`, value: "−" + money2(r.ksEmployee) },
      { label: "NET PAY", value: money2(r.net), strong: true },
      { label: `Employer KiwiSaver ${pct(rates.kiwiSaver.employerMinimum)} (gross)`, value: money2(r.ksEmployerGross) },
      { label: `less ESCT @ ${(r.esctRate * 100).toFixed(1)}%`, value: "−" + money2(r.esct) },
      { label: "Employer KiwiSaver paid to your fund", value: money2(r.ksEmployerNet) },
    ],
    footer: r.ietcPerPay ? [`Tax code ME includes the independent earner tax credit (≈${money2(r.ietcPerPay)} per fortnight).`] : [],
  };
}

export function payrollTxns(cfg: YearConfig, runs: PayRun[]): Transaction[] {
  let accrualLeft = cfg.openingHolidayAccrual ?? 0;
  return runs.map((run, i) => {
    const first = i === 0 && cfg.teach;
    const extra = cfg.payExtras?.[run.date];
    const mia = run.results[0];
    let leave: { name: string; pay: number; fromAccrual: number } | undefined;
    if (extra?.leave) {
      const r = run.results.find((x) => x.employee.id === extra.leave!.employeeId)!;
      const pay = r2(extra.leave.hours * r.employee.rate);
      const fromAccrual = r2(Math.min(pay, accrualLeft));
      accrualLeft = r2(accrualLeft - fromAccrual);
      leave = { name: r.employee.name, pay, fromAccrual };
    }
    return {
      id: first ? "A21" : cfg.payId(i, run.date),
      date: run.date,
      title: first ? "First pay run: paying the staff" : extra?.title ?? `Pay run ${i + 1} (${nzDate(run.periodFrom, false)} – ${nzDate(run.periodTo, false)})`,
      kind: first || extra?.story ? "featured" : "routine",
      book: "payroll",
      month: run.date.slice(0, 7),
      story: first
        ? `Payday. Mia (full-time barista) and Leo (casual kitchen hand) are paid fortnightly. This is where NZ payroll gets detailed.\n\nThe café doesn't just pay staff their wage. From each [[gross-pay]] it deducts [[paye]] (which includes the [[acc-earners-levy]]), [[student-loan]] repayments and the employee's [[kiwisaver]] contribution, and passes them all to IRD. On top of the wage, the café must contribute ${pct(cfg.rates.kiwiSaver.employerMinimum)} to KiwiSaver, minus [[esct]].\n\nLeo is casual, so instead of building up annual leave he gets ${pct(HOLIDAYS.payAsYouGoRate)} [[holiday-pay]] added to every pay ("pay-as-you-go").\n\nWithin 2 working days the café must file the [[payday-filing]] (employment information) with IRD. The deductions are paid to IRD by the 20th of next month.`
        : extra?.story ?? `Fortnightly pay run. Mia ${mia.hours} hrs, Leo ${run.results[1].hours} hrs. Same structure as the first pay run.`,
      doc: first || extra?.leave
        ? payslip(extra?.leave ? run.results.find((x) => x.employee.id === extra.leave!.employeeId)! : mia, run, cfg.rates, extra?.leave?.hours)
        : {
            kind: "internal",
            title: "Pay run summary",
            issuer: BUSINESS.name,
            date: run.date,
            rows: run.results.flatMap((r) => [
              { label: `${r.employee.name} – gross`, value: money2(r.gross) },
              { label: `${r.employee.name} – net`, value: money2(r.net) },
            ]),
          },
      lines: payrollLines(run, cfg.rates, leave),
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
        : extra?.leave
          ? [{ href: "/nz/holidays", label: "Annual leave & the Holidays Act" }]
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
}

/** PAYE & deductions paid by the 20th of the following month (includes last year's final month) */
export function payePayments(cfg: YearConfig, payroll: Transaction[]): Transaction[] {
  const out: Transaction[] = [];
  const byMonth: Record<string, number> = {};
  for (const t of payroll) {
    const m = t.date.slice(0, 7);
    byMonth[m] = r2((byMonth[m] ?? 0) + t.lines.filter((l) => l.account === "215").reduce((a, l) => a + (l.credit ?? 0), 0));
  }
  let first = cfg.teach;
  for (const m of Object.keys(byMonth).sort()) {
    const due = day(nextMonth(m), 20);
    if (due < `${cfg.months[0]}-01` || due > cfg.yearEnd) continue;
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

export function monthlyRoutine(cfg: YearConfig): Transaction[] {
  const out: Transaction[] = [];
  const lastMonth = cfg.months[cfg.months.length - 1];

  for (const ym of cfg.months) {
    const end = lastDay(ym);
    const ml = monthLabel(ym);
    const isLast = ym === lastMonth; // balance-date month: some things fall either side of 31 March

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
      kind: isLast ? "featured" : "routine",
      foundInBankRec: isLast,
      book: "cash-payments",
      month: ym,
      story: isLast
        ? "Ben spotted this $25 monthly fee while doing the bank reconciliation. The bank charged it straight to the account, so there's no invoice, and it wasn't in the books until he compared them to the bank statement. This is exactly why we reconcile."
        : "Monthly account-keeping fee charged by the bank (GST-exempt).",
      lines: [
        { account: "621", debit: 25 },
        { account: "100", credit: 25 },
      ],
      deepDives: isLast ? [{ href: "/cycle/bank-reconciliation", label: "Bank reconciliation" }] : undefined,
    });

    if (cfg.skipRoutineMonths?.includes(ym)) continue;

    const salesEx = cfg.sales[ym];
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
    const days = Number(end.slice(8));
    const unsettled = isLast ? r2(eftpos / days) : 0; // 31 March card sales settle on 1 April
    const settled = r2(eftpos - unsettled);
    const fee = r2(settled * MERCHANT_FEE);
    const nightSafe = isLast ? r2(cash / days) : 0;
    out.push({
      id: `BANKING-${ym}`,
      date: end,
      title: `${ml} card settlements & cash banked`,
      kind: "routine",
      book: "cash-receipts",
      month: ym,
      story: isLast
        ? "Card settlements for 1–30 March and cash banked up to 30 March. The card sales from 31 March won't arrive until 1 April, so they stay in EFTPOS clearing at year end."
        : `Card settlements (less merchant fees) and cash deposits for ${ml}.`,
      lines: [
        { account: "100", debit: r2(settled - fee + cash - nightSafe) },
        { account: "622", debit: fee },
        { account: "110", credit: settled },
        { account: "105", credit: r2(cash - nightSafe) },
      ],
    });
    if (isLast) {
      out.push({
        id: `NIGHTSAFE-${ym}`,
        date: end,
        bankDate: addDays(end, 1),
        title: "31 March cash takings put in the bank's night safe",
        kind: "featured",
        book: "cash-receipts",
        month: ym,
        story: `After closing on 31 March, Aroha puts the day's cash (${money2(nightSafe)}) in the bank's night-safe deposit box. The books record it today, but the bank won't process it until 1 April. That makes it a [[deposit-in-transit]] in the year-end bank reconciliation.`,
        doc: { kind: "deposit-slip", title: "Night safe deposit slip", issuer: BUSINESS.bank, date: end, rows: [{ label: "Cash deposited", value: money2(nightSafe), strong: true }] },
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
    if (!isLast) {
      const { amount, winter } = cfg.power(ym);
      out.push({
        id: `POWER-${ym}`,
        date: day(ym, 28),
        title: `${ml} power bill`,
        kind: "routine",
        book: "purchases",
        month: ym,
        story: `Kahu Energy bill for ${ml}${winter ? " (winter heating pushes it up)" : ""}.`,
        lines: buyLines("611", incl(amount), "200", { party: SUPPLIERS.power.name }),
      });
    }

    // Rent: months paid in advance come out of prepaid rent; otherwise paid monthly in advance
    if (cfg.rentFromPrepaid.includes(ym)) {
      out.push({
        id: `RENT-${ym}`,
        date: end,
        title: `${ml} rent used up (from prepaid)`,
        kind: "routine",
        book: "general",
        month: ym,
        story: `Another month of the prepaid rent is used: $3,000 moves from the asset to expense.${ym === cfg.rentFromPrepaid[cfg.rentFromPrepaid.length - 1] ? " Prepaid rent is now zero." : ""}`,
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
    const n = cfg.loanFirstRow + cfg.months.indexOf(ym);
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
        { account: "240", debit: cfg.drawings.aroha, party: "Aroha Ngata" },
        { account: "241", debit: cfg.drawings.ben, party: "Ben Fraser" },
        { account: "100", credit: r2(cfg.drawings.aroha + cfg.drawings.ben) },
      ],
    });
  }
  return out;
}

/* ───────────────────────── AP PAYMENTS (20th of following month) ───────────────────────── */

/** Supplier invoices paid on the 20th of the following month. `base` may include last year's
 *  entries: invoices from the previous March are paid in this year's April. */
export function supplierPayments(cfg: YearConfig, base: Transaction[]): Transaction[] {
  const out: Transaction[] = [];
  let first = cfg.teach;
  for (const m of [prevMonth(cfg.months[0]), ...cfg.months]) {
    const due = day(nextMonth(m), 20);
    if (due < `${cfg.months[0]}-01` || due > cfg.yearEnd) continue;
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

/* ───────────────────────── GST ───────────────────────── */

/** Paying (or receiving a refund for) one GST return */
export function gstSettlement(p: GstPeriod, r: GstReturn, opts: { id: string; featured: boolean; story: (r: GstReturn, amt: number, refund: boolean) => string; deepHref?: string }): Transaction {
  const refund = r.box15 < 0;
  const amt = Math.abs(r.box15);
  const date = refund ? addDays(p.to, 19) : p.due;
  return {
    id: opts.id,
    date,
    title: refund ? `GST refund received – ${p.label}` : `Pay GST – ${p.label}`,
    kind: opts.featured ? "featured" : "routine",
    book: refund ? "cash-receipts" : "cash-payments",
    month: date.slice(0, 7),
    story: opts.story(r, amt, refund),
    doc: {
      kind: "ird",
      title: `GST return ${p.label}`,
      issuer: "Inland Revenue",
      recipient: BUSINESS.name,
      ref: `GST ${BUSINESS.gstNumber}`,
      date,
      rows: [
        { label: "Total GST collected (box 10)", value: money2(r.box10) },
        { label: "Total GST credit (box 14)", value: money2(r.box14) },
        { label: refund ? "Refund due to you (box 15)" : "GST to pay (box 15)", value: money2(amt), strong: true },
      ],
    },
    lines: refund
      ? [
          { account: "100", debit: amt, why: "Refund received from IRD." },
          { account: "210", credit: amt, gst: "settlement", why: "Clears the debit balance (refund owed to us) in the GST account." },
        ]
      : [
          { account: "210", debit: amt, gst: "settlement", why: "Clears the GST owed to IRD for the period." },
          { account: "100", credit: amt, why: "Paid from the bank." },
        ],
    deepDives: [{ href: opts.deepHref ?? `/nz/gst-return?period=${p.id}`, label: "See this GST return box by box" }],
  } satisfies Transaction;
}

/* ───────────────────────── CLOSING ───────────────────────── */

/** Close every income and expense account to the income summary, then profit to retained earnings */
export function closingEntries(fin: Balances, yearEnd: string, idPrefix = "") {
  const incomeAccts = ACCOUNTS.filter((a) => a.type === "income" && Math.abs(fin[a.code] ?? 0) > 0.004);
  const expenseAccts = ACCOUNTS.filter((a) => a.type === "expense" && Math.abs(fin[a.code] ?? 0) > 0.004);
  const incomeSum = r2(incomeAccts.reduce((s, a) => s - fin[a.code], 0));
  const expenseSum = r2(expenseAccts.reduce((s, a) => s + fin[a.code], 0));
  const netProfit = r2(incomeSum - expenseSum);
  const close = (t: Omit<Transaction, "date" | "kind" | "book">): Transaction => ({ date: yearEnd, kind: "closing", book: "general", ...t });
  const entries: Transaction[] = [
    close({
      id: `${idPrefix}CL01`,
      title: "Close income accounts to the income summary",
      story: "Every income account is debited by exactly its balance, which brings it to zero. The total goes to the income summary as a credit.",
      lines: [
        ...incomeAccts.map((a) => ({ account: a.code, debit: r2(-fin[a.code]), why: `Empties ${a.name}.` })),
        { account: "320", credit: incomeSum, why: "All the year's income collected in one place." },
      ],
    }),
    close({
      id: `${idPrefix}CL02`,
      title: "Close expense accounts to the income summary",
      story: "Every expense account is credited by its balance (bringing it to zero). The total is debited to the income summary.",
      lines: [
        { account: "320", debit: expenseSum, why: "All the year's expenses collected in one place." },
        ...expenseAccts.map((a) => ({ account: a.code, credit: r2(fin[a.code]), why: `Empties ${a.name}.` })),
      ],
    }),
    close({
      id: `${idPrefix}CL03`,
      title: "Transfer the profit to retained earnings",
      story: `The income summary now holds the net profit after tax: ${money2(netProfit)}. It moves to [[retained-earnings]], the permanent equity account, and the income summary goes back to zero. The new year starts with all income and expense accounts at $0.`,
      lines: [
        { account: "320", debit: netProfit },
        { account: "310", credit: netProfit },
      ],
    }),
  ];
  return { entries, netProfit };
}

/** Profit (income − expenses) from a set of balances */
export function profitOf(b: Balances) {
  const income = ACCOUNTS.filter((a) => a.type === "income").reduce((s, a) => s - (b[a.code] ?? 0), 0);
  const expense = ACCOUNTS.filter((a) => a.type === "expense").reduce((s, a) => s + (b[a.code] ?? 0), 0);
  return r2(income - expense);
}
