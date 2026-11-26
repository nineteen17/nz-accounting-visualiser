/**
 * "A year on the job": the café's whole year as an ordered list of tasks,
 * the way the bookkeeper (Ben) and the accountant (Rata & Co) would actually work through it.
 *
 * Every journal entry in the books is posted by exactly one step (checked in tests).
 * Steps without entries are real jobs that don't change the ledger: reconciling the bank,
 * filing GST returns, reviewing trial balances, preparing statements, filing tax returns.
 */
import { ADJUSTMENTS, CLOSING, DURING_YEAR, TAX } from "@/data/books";
import { GST_PERIODS, type GstPeriod } from "@/lib/engine/gst";
import { money, nzDate } from "@/lib/money";
import type { Transaction } from "@/lib/engine/types";

export type Who = "Ben (bookkeeper)" | "Aroha & Ben (owners)" | "Rata & Co (accountant)";
export type Category = "setup" | "sales" | "purchases" | "payments" | "banking" | "payroll" | "tax" | "monthly" | "event" | "year-end" | "closing" | "after";
export type Phase = "during" | "year-end" | "after";

export type JobPanel =
  | { kind: "bankrec"; from: string; to: string; month: string }
  | { kind: "gst"; period: string }
  | { kind: "tb"; stage: "opening" | "unadjusted" | "adjusted" | "post-closing" }
  | { kind: "statements" }
  | { kind: "tax" }
  | { kind: "checklist"; items: string[] };

export interface JobStep {
  id: string;
  /** date shown on the step (when the work is done, or the entry date) */
  date: string;
  /** e.g. "Done in May 2027, dated 31 March 2027" */
  doneLabel?: string;
  phase: Phase;
  who: Who;
  category: Category;
  title: string;
  /** journal entries posted by this step */
  txns: Transaction[];
  /** the task: what we're doing and why (supports [[glossary]] and **bold**) */
  intro: string;
  /** index of the first step of the same kind, if this is a repeat */
  repeatOf?: number;
  /** repeats of routine work can be fast-forwarded */
  skippable: boolean;
  /** side jobs done with this step */
  also?: string[];
  panel?: JobPanel;
  deep?: { href: string; label: string };
}

/* ───────────── Explanations for each kind of recurring task ───────────── */

interface KindInfo {
  who: Who;
  category: Category;
  first: string;
  repeat: string;
  also?: string[];
  deep?: { href: string; label: string };
}

const KIND: Record<string, KindInfo> = {
  PAY: {
    who: "Ben (bookkeeper)", category: "payroll",
    first: "Every second Wednesday is payday. Ben enters each person's hours into the payroll software, which works out every payslip: gross pay, [[paye]] (including the [[acc-earners-levy]]), student loan, [[kiwisaver]] and [[esct]].\n\nThe entry follows one rule: **the expense is the gross pay**. Employer KiwiSaver is an extra expense on top. Only the **net pay** leaves the bank today. Everything deducted is credited to **215 PAYE & deductions payable**, because the café now owes it to IRD until it's paid on the 20th of next month.",
    repeat: "Another fortnightly pay run, with the same structure as the first: wages expense at gross, employer KiwiSaver on top, net pay out of the bank, and all deductions owed to IRD in account 215. Leo's hours change each fortnight, so his pay does too. Mia's is the same every time.",
    also: ["Payday filing: send this pay's employment information to IRD within 2 working days."],
    deep: { href: "/nz/paye", label: "PAYE & payday filing" },
  },
  PAYE: {
    who: "Ben (bookkeeper)", category: "tax",
    first: "By the **20th of the month**, the café pays IRD everything it deducted from last month's pay runs: PAYE, student loan, both KiwiSaver amounts and ESCT. That clears account 215 back to zero for those pays.\n\nThere's **no expense** in this entry: the expense was recorded at each pay run. This is just settling a debt. Paying late brings penalties and interest, so it goes in the calendar.",
    repeat: "The monthly payment to IRD of last month's payroll deductions (PAYE, student loan, KiwiSaver, ESCT). It clears account 215; no expense.",
    deep: { href: "/nz/paye", label: "Paying IRD" },
  },
  APPAY: {
    who: "Ben (bookkeeper)", category: "payments",
    first: "Suppliers give **20th-of-the-month-following** terms, so on the 20th Ben pays all of last month's invoices in one online-banking batch. Each payment reduces what the café owes that supplier in [[accounts-payable]] (and in its [[subsidiary-ledger]]) and reduces the bank.\n\nThere's **no expense and no GST** in this entry. Both were recorded when the invoices arrived. Paying a bill is just swapping one asset (cash) for one less liability.",
    repeat: "The 20th: pay last month's supplier invoices in one batch. Accounts payable down, bank down, no expense and no GST (both were recorded when the invoices arrived).",
    deep: { href: "/explore/ledger", label: "Creditors ledger" },
  },
  DD: {
    who: "Ben (bookkeeper)", category: "monthly",
    first: "On the 15th the bank automatically pays the café's regular bills by direct debit: broadband, accounting software, rubbish collection and cleaning supplies. Ben codes each one from the bank feed to the right expense account.\n\nAll four suppliers are GST-registered, so the GST inside each payment (3/23 of it) goes to the **GST account as claimable input tax**, not into the expense.",
    repeat: "The monthly direct debits: each bill to its expense account, GST claimable, bank credited.",
  },
  FEE: {
    who: "Ben (bookkeeper)", category: "banking",
    first: "The bank charges a monthly account fee. Ben only finds out from the bank statement, so he records it from there.\n\nBank fees are a **financial service, which is exempt from GST**, so there's no GST to claim: the whole $25 is an expense.",
    repeat: "The monthly bank fee from the statement: an expense with no GST (financial services are exempt).",
  },
  DRAW: {
    who: "Aroha & Ben (owners)", category: "payments",
    first: "Aroha and Ben take money out for living costs. Because the café is a **company**, this isn't wages and it isn't an expense. It's debited to each owner's [[shareholder-current-account]] (240 Aroha, 241 Ben).\n\nThose accounts go overdrawn during the year: the owners have taken money the company hasn't yet decided to pay them. At year end the accountant credits their **shareholder salaries** to these accounts (adjustment ADJ10), which puts them back in credit.",
    repeat: "The owners' monthly drawings, debited to their shareholder current accounts: not wages and not an expense.",
    deep: { href: "/nz/shareholders", label: "Shareholders & current accounts" },
  },
  POWER: {
    who: "Ben (bookkeeper)", category: "purchases",
    first: "The power bill arrives. On the [[accrual-basis]] it's recorded **when the invoice is received**, not when it's paid: power expense plus claimable GST, owed to Kahu Energy until the 20th of next month.\n\nMarch's bill won't arrive until April, so at year end the accountant will estimate it and record it as an accrued expense (ADJ04).",
    repeat: "This month's power bill: expense plus claimable GST, owed to Kahu Energy until the 20th.",
  },
  SALES: {
    who: "Ben (bookkeeper)", category: "sales",
    first: "At the end of every trading day the POS prints a [[z-report]]: the day's sales, split by payment type. From May on, the app records a month of Z-reports as one summary entry. In April you saw them week by week; the entry is the same.\n\n• Card sales go to **110 EFTPOS clearing** until the bank pays them out.\n• Cash goes to **105 Cash on hand** until it's banked.\n• The GST inside the takings (**3/23** of the total, because NZ prices include GST) is owed to IRD.\n• The rest is **café sales** income.",
    repeat: "The month's Z-reports: card sales to EFTPOS clearing, cash to cash on hand, 3/23 of the total to GST owed, the rest to café sales.",
    deep: { href: "/nz/gst", label: "GST on sales" },
  },
  BANKING: {
    who: "Ben (bookkeeper)", category: "banking",
    first: "The money from sales reaches the bank. The card company pays out card sales **minus its merchant fees**, and Ben deposits the cash. This empties EFTPOS clearing and cash on hand into the bank account.\n\n[[merchant-fees]] are a financial service, **exempt from GST**: an expense with nothing to claim.",
    repeat: "Card settlements (less merchant fees) and cash deposits for the month: EFTPOS clearing and cash on hand emptied into the bank.",
  },
  PURCH: {
    who: "Ben (bookkeeper)", category: "purchases",
    first: "All the month's stock invoices are entered: coffee beans, food, dairy and packaging, each to its own purchases account so Aroha can watch each cost.\n\nKōwhai uses [[periodic-inventory]]: stock is expensed as it's bought, and the year-end stocktake (ADJ09) corrects for what's left on the shelves. GST is claimable, and each supplier is owed until the 20th of next month.",
    repeat: "The month's stock invoices: purchases by type, GST claimable, owed to each supplier until the 20th.",
  },
  "RENT-PREPAID": {
    who: "Ben (bookkeeper)", category: "monthly",
    first: "In April the café paid three months' rent up front. That was recorded as an asset, [[prepayment|prepaid rent]], because the café hadn't used it yet.\n\nNow a month has been used, so **$3,000 moves from the asset to rent expense**. No cash moves at all. This entry exists only to match the expense to the month it belongs to.",
    repeat: "Another month of the prepaid rent used up: $3,000 from prepaid rent (asset) to rent expense. No cash moves.",
  },
  "RENT-PAID": {
    who: "Ben (bookkeeper)", category: "monthly",
    first: "The prepaid months have run out, so from July rent is paid on the 1st for the month ahead. Because it's used up in that same month, it's simply an **expense**, with GST claimable on the landlord's invoice. No prepayment is needed.",
    repeat: "Rent paid on the 1st and used up the same month: rent expense plus claimable GST.",
  },
  LOAN: {
    who: "Ben (bookkeeper)", category: "payments",
    first: "The bank takes the loan repayment. Every repayment is the same amount, but it's split two ways:\n\n• **Interest**: the cost of borrowing, an expense.\n• **Principal**: repaying the loan itself, which reduces the liability.\n\nInterest is an exempt financial service, so there's no GST. As the loan shrinks, the interest part shrinks each month and the principal part grows.",
    repeat: "The monthly loan repayment: interest to expense, principal off the loan. The interest part is a little smaller every month.",
    deep: { href: "/explore/loan", label: "Loan schedule" },
  },
};

const featuredWho = (t: Transaction): Who => (["A01", "A02"].includes(t.id) ? "Aroha & Ben (owners)" : "Ben (bookkeeper)");
const bookCategory: Record<string, Category> = { sales: "sales", purchases: "purchases", "cash-receipts": "banking", "cash-payments": "payments", payroll: "payroll", general: "event" };

export function kindKey(t: Transaction): string | null {
  if (t.id === "A21") return "PAY";
  if (/^[A-Z]\d\d$/.test(t.id) || t.id.startsWith("NIGHTSAFE") || t.id.startsWith("GST-")) return null; // one-off, explained by its own story
  const p = t.id.split("-")[0];
  if (p === "RENT") return /prepaid/i.test(t.title) ? "RENT-PREPAID" : "RENT-PAID";
  if (p === "APPAY" && t.id === "APPAY-2026-04") return "APPAY";
  return KIND[p] ? p : null;
}

/* ───────────── Build the steps ───────────── */

export const lastDayOf = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(d).padStart(2, "0")}`;
};
export const monthLabel = (ym: string) => nzDate(`${ym}-01`).replace(/^1 /, "");
const nextYm = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

/** Settings for building one year's "during the year" steps */
export interface DuringConfig {
  during: Transaction[];
  firstMonth: string;
  lastMonth: string;
  /** when the balance-date bank reconciliation is done (the statement arrives in April) */
  lastRecDate: string;
  periods: GstPeriod[];
  /** year 1 teaches each kind of job in full the first time; later years point back to it */
  teach: boolean;
  gstIntro: (pid: string, p: GstPeriod) => string;
  gstDeep: (pid: string) => string;
  recIntro: (ym: string, kind: "first" | "repeat" | "last") => string;
  overrides?: Record<string, { who?: Who; category?: Category }>;
  /** jobs with no entry, slotted in by date */
  extras?: JobStep[];
  /** where each kind of routine job is explained in full (for years that don't teach) */
  kindHome?: Record<string, string>;
}

export function duringSteps(cfg: DuringConfig): JobStep[] {
  const steps: JobStep[] = [];
  const firstOf: Record<string, number> = {};
  const bankFound = cfg.during.filter((t) => t.foundInBankRec);
  const normal = cfg.during.filter((t) => !t.foundInBankRec);
  const extras = [...(cfg.extras ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  let recFirst: number | undefined;

  const bankRec = (ym: string) => {
    const isLast = ym === cfg.lastMonth;
    const step: JobStep = {
      id: `REC-${ym}`,
      date: isLast ? cfg.lastRecDate : lastDayOf(ym),
      doneLabel: isLast ? "Done when the March statement arrives in early April" : undefined,
      phase: isLast ? "year-end" : "during",
      who: "Ben (bookkeeper)",
      category: "banking",
      title: `Reconcile the bank account for ${monthLabel(ym)}`,
      txns: isLast ? bankFound : [],
      intro: cfg.recIntro(ym, isLast ? "last" : recFirst === undefined ? "first" : "repeat"),
      repeatOf: isLast ? undefined : recFirst,
      skippable: !isLast && recFirst !== undefined,
      panel: { kind: "bankrec", from: `${ym}-01`, to: lastDayOf(ym), month: monthLabel(ym) },
      deep: { href: "/cycle/bank-reconciliation", label: "Bank reconciliation step" },
    };
    if (!isLast && recFirst === undefined) recFirst = steps.length;
    steps.push(step);
  };

  let currentYm = cfg.firstMonth;
  for (const t of normal) {
    const ym = t.date.slice(0, 7);
    while (ym > currentYm && currentYm < cfg.lastMonth) {
      bankRec(currentYm);
      currentYm = nextYm(currentYm);
    }
    while (extras.length && extras[0].date < t.date) steps.push(extras.shift()!);

    // GST return is prepared and filed just before the settlement entry
    if (t.id.startsWith("GST-")) {
      const pid = t.id.replace("GST-", "");
      const p = cfg.periods.find((x) => x.id === pid)!;
      steps.push({
        id: `GSTRET-${pid}`,
        date: t.date,
        phase: "during",
        who: "Ben (bookkeeper)",
        category: "tax",
        title: `Prepare and file the GST return for ${p.label}`,
        txns: [],
        intro: cfg.gstIntro(pid, p),
        skippable: false,
        panel: { kind: "gst", period: pid },
        deep: { href: cfg.gstDeep(pid), label: "GST return, box by box" },
      });
    }

    const key = kindKey(t);
    const info = key ? KIND[key] : undefined;
    const repeatOf = key !== null && key in firstOf ? firstOf[key] : undefined;
    const isFirst = key !== null && repeatOf === undefined;
    if (isFirst) firstOf[key!] = steps.length;
    const featured = t.kind === "featured";
    const ov = cfg.overrides?.[t.id];
    const home = !cfg.teach && isFirst && key ? cfg.kindHome?.[key] : undefined;
    steps.push({
      id: t.id,
      date: t.date,
      phase: "during",
      who: ov?.who ?? info?.who ?? featuredWho(t),
      category: ov?.category ?? info?.category ?? (t.id.startsWith("GST-") ? "tax" : t.id.startsWith("A0") && Number(t.id.slice(1)) <= 4 ? "setup" : bookCategory[t.book] ?? "event"),
      title: t.title,
      txns: [t],
      // featured entries have their own detailed story; routine ones get the task explanation
      intro: featured && !(key === "PAY" && isFirst && cfg.teach) ? t.story : info ? (isFirst && cfg.teach ? info.first : info.repeat) : t.story,
      repeatOf,
      skippable: cfg.teach ? repeatOf !== undefined && !featured : key !== null && !featured,
      also: info?.also,
      deep: home ? { href: home, label: "First time, explained in full (year 1)" } : info?.deep,
    });
  }
  steps.push(...extras);
  bankRec(cfg.lastMonth);
  return steps;
}

function build(): JobStep[] {
  const steps = duringSteps({
    during: DURING_YEAR,
    firstMonth: "2026-04",
    lastMonth: "2027-03",
    lastRecDate: "2027-04-02",
    periods: GST_PERIODS,
    teach: true,
    gstIntro: (pid, p) =>
      pid === "P1"
        ? `The first two-monthly GST period has ended. Ben prepares the [[gst-return]] from the GST account: GST on sales, called [[output-tax]], minus GST on purchases, called [[input-tax]]. He files it in myIR by **${nzDate(p.due)}**.\n\nBecause the café spent so much on its fit-out and equipment, it claimed more GST than it collected. This first return is a **refund**.`
        : `Two months are up, so Ben prepares and files the GST return for ${p.label}: output tax on sales minus input tax on purchases, plus any adjustments. It's due **${nzDate(p.due)}**. Filing the return doesn't change the books; paying it (the next step) does.`,
    gstDeep: (pid) => `/nz/gst-return?period=${pid}`,
    recIntro: (ym, kind) =>
      kind === "last"
        ? "The most important bank reconciliation of the year, because the balance sheet's bank figure has to be right. This time the statement and the cashbook **don't** agree straight away. Ben works through every difference:\n\n• A **bank fee** on the statement that isn't in the books yet. He records it now (that's the entry below).\n• A **deposit in transit**: the 31 March takings went in the night safe, but the bank processed them on 1 April.\n• An **unpresented payment**: the shopfitter was paid late on 31 March and it cleared on 1 April.\n\nOnly the bank fee needs an entry. The other two are timing differences: the books are right, the bank is just a day behind. They're listed on the reconciliation to prove the difference is explained."
        : kind === "first"
          ? "At month end Ben reconciles the bank: he compares every line in the café's cashbook (account 100) with the bank statement, ticks off each match and investigates anything that doesn't match.\n\nNo entry is needed when everything agrees, but the job still matters. Doing it **every month** catches mistakes, missed transactions and fraud while they're small and easy to fix."
          : `Month-end bank reconciliation for ${monthLabel(ym)}: the cashbook and the bank statement are compared line by line. This month they agree, so there's nothing to record.`,
  });

  /* ── Year end ── */
  const ye = (s: Omit<JobStep, "phase" | "skippable"> & { skippable?: boolean }) => steps.push({ phase: "year-end", skippable: false, ...s });

  ye({
    id: "BALANCE-DATE", date: "2027-03-31", who: "Ben (bookkeeper)", category: "year-end",
    title: "31 March: balance date",
    txns: [],
    intro: "The last day of the financial year, the [[balance-date]]. Before closing up tonight, the café does the jobs that can only be done on this exact date. Then Ben hands everything to the accountant, Rata & Co, who does the year-end work over April and May.",
    panel: { kind: "checklist", items: [
      "Count the stock on the shelves (beans, milk, food, packaging) and write it on stocktake sheets",
      "Count the till and put the takings in the night safe",
      "Cut-off: note the last invoice received and issued, so everything lands in the right year",
      "Note the catering job done but not yet invoiced, and work done by staff but not yet paid",
      "Gather everything for the accountant: bank statements, the stocktake, the asset register, loan statements and payroll reports",
    ] },
  });
  // March bank rec was pushed above with phase year-end; move it after balance date for the right story order
  const recIdx = steps.findIndex((s) => s.id === "REC-2027-03");
  const [marchRec] = steps.splice(recIdx, 1);
  steps.push(marchRec);

  ye({
    id: "TB-UNADJ", date: "2027-04-05", doneLabel: "Early April 2027", who: "Rata & Co (accountant)", category: "year-end",
    title: "Run the unadjusted trial balance",
    txns: [],
    intro: "The accountant starts by listing every account balance in the [[trial-balance]]. Debits equal credits, so the double entry is arithmetically right.\n\nBut these balances are still **unadjusted**. They mostly reflect documents and cash, so some are wrong on the accrual basis: no depreciation yet, purchases instead of cost of goods sold, a bad debt still counted as owing, and the owners' salaries not recorded. The adjustments fix that.",
    panel: { kind: "tb", stage: "unadjusted" },
    deep: { href: "/cycle/unadjusted-tb", label: "Trial balance step" },
  });

  const beforeTax = ADJUSTMENTS.filter((t) => !["ADJ11", "ADJ12"].includes(t.id));
  const tax = ADJUSTMENTS.filter((t) => ["ADJ11", "ADJ12"].includes(t.id));
  for (const t of beforeTax) {
    ye({ id: t.id, date: t.date, doneLabel: "Done in April–May 2027, dated 31 March 2027", who: "Rata & Co (accountant)", category: "year-end", title: `Adjustment: ${t.title}`, txns: [t], intro: t.story, deep: { href: "/cycle/adjustments", label: "All adjustments" } });
  }
  ye({
    id: "TAX-CALC", date: "2027-05-15", doneLabel: "May 2027", who: "Rata & Co (accountant)", category: "tax",
    title: "Work out the company's income tax",
    txns: [],
    intro: `With every adjustment except tax done, the accounting profit is final. But tax isn't simply 28% of accounting profit. The accountant reconciles accounting profit to **taxable income**: half of entertainment is added back, depreciation is swapped for tax depreciation plus Investment Boost, and so on.\n\nTaxable income ${money(TAX.taxableIncome)} × 28% = **${money(TAX.tax)}**. After the RWT already deducted by the bank and the $3,000 voluntary payment, **${money(TAX.terminal)}** is left to pay as terminal tax.`,
    panel: { kind: "tax" },
    deep: { href: "/nz/income-tax", label: "Income tax in depth" },
  });
  for (const t of tax) {
    ye({ id: t.id, date: t.date, doneLabel: "Dated 31 March 2027", who: "Rata & Co (accountant)", category: "tax", title: `Adjustment: ${t.title}`, txns: [t], intro: t.story, deep: { href: "/nz/provisional-tax", label: "Provisional & terminal tax" } });
  }
  ye({
    id: "TB-ADJ", date: "2027-05-20", doneLabel: "May 2027", who: "Rata & Co (accountant)", category: "year-end",
    title: "Run the adjusted trial balance",
    txns: [],
    intro: "Every adjustment is in, so the accountant runs the trial balance again. This **adjusted trial balance** is the source for the financial statements: every income and expense figure is now on the accrual basis, and every asset and liability is stated correctly at 31 March.",
    panel: { kind: "tb", stage: "adjusted" },
    deep: { href: "/cycle/adjusted-tb", label: "10-column worksheet" },
  });
  ye({
    id: "STATEMENTS", date: "2027-05-25", doneLabel: "May 2027", who: "Rata & Co (accountant)", category: "year-end",
    title: "Prepare the financial statements",
    txns: [],
    intro: "The adjusted trial balance is rearranged into the [[financial-statements]]. Income and expenses make up the **profit & loss**; assets, liabilities and equity make up the **balance sheet**.\n\nKōwhai's are special-purpose statements meeting IRD's minimum requirements. Aroha and Ben review them, the bank asks for a copy, and they support the tax return.",
    panel: { kind: "statements" },
    deep: { href: "/cycle/statements", label: "All statements & notes" },
  });
  for (const t of CLOSING) {
    steps.push({ id: t.id, date: t.date, doneLabel: "Dated 31 March 2027", phase: "year-end", who: "Rata & Co (accountant)", category: "closing", title: t.title, txns: [t], intro: t.story, skippable: false, deep: { href: "/cycle/closing", label: "Closing entries" } });
  }
  ye({
    id: "TB-POST", date: "2027-05-31", doneLabel: "May 2027", who: "Rata & Co (accountant)", category: "closing",
    title: "Post-closing trial balance: ready for the new year",
    txns: [],
    intro: "After closing, every income and expense account is back to zero, and the year's profit sits in **retained earnings**. Only balance sheet accounts are left.\n\nThese balances carry forward as the opening balances of the 2028 year. The books are closed.",
    panel: { kind: "tb", stage: "post-closing" },
    deep: { href: "/cycle/post-closing", label: "Post-closing trial balance" },
  });

  /* ── After year end ── */
  const after = (s: Omit<JobStep, "phase" | "skippable" | "txns">) => steps.push({ phase: "after", skippable: false, txns: [], ...s });
  after({
    id: "GSTRET-P6", date: "2027-05-07", who: "Ben (bookkeeper)", category: "after",
    title: "File the last GST return of the year (February–March 2027)",
    intro: "The final GST period ended on 31 March. Its return is due on **7 May** (not the 28th: the period ending in March gets extra time). It includes the 50% entertainment adjustment (ADJ02).\n\nIn the books, this GST is already owed: it's the credit balance left in the GST account at 31 March. Paying it is the first entry of the new year.",
    panel: { kind: "gst", period: "P6" },
    deep: { href: "/nz/gst-return?period=P6", label: "GST return, box by box" },
  });
  after({
    id: "ANNUAL-RETURN", date: "2027-06-15", who: "Aroha & Ben (owners)", category: "after",
    title: "Companies Office annual return",
    intro: "Every company confirms its details with the Companies Office once a year, in the month it was allocated: its directors, shareholders and addresses, plus a fee. It's not a tax return and there's no entry beyond the fee, but missing it can get the company removed from the register.",
    deep: { href: "/nz/compliance", label: "Compliance calendar" },
  });
  after({
    id: "IR4", date: "2028-03-31", doneLabel: "By 31 March 2028 (with the accountant's extension of time)", who: "Rata & Co (accountant)", category: "after",
    title: "File the company tax return (IR4) and the owners' IR3s",
    intro: `The accountant files Kōwhai's [[ir4]] with the financial statements summary. Aroha and Ben each file an [[ir3]] for their shareholder salaries, paying personal tax on them.\n\n**Terminal tax** of ${money(TAX.terminal)} is due on **7 April 2028**, because Kōwhai has a tax agent. Because its tax for this year was over $5,000, the café will have to pay **provisional tax** in instalments during the 2028 year.`,
    deep: { href: "/nz/provisional-tax", label: "Provisional & terminal tax" },
  });
  return steps;
}

export const JOB_STEPS: JobStep[] = build();

/** Every entry in posting order, and the number posted after step i (inclusive) */
export function postingOf(steps: JobStep[]) {
  const posted = steps.flatMap((s) => s.txns);
  const cum = steps.reduce<number[]>((acc, s, i) => [...acc, (i ? acc[i - 1] : 0) + s.txns.length], []);
  return { posted, cum };
}

/** Every entry in posting order */
export const JOB_POSTED: Transaction[] = postingOf(JOB_STEPS).posted;
/** number of entries posted after step i (inclusive) */
export const JOB_CUM: number[] = postingOf(JOB_STEPS).cum;

/** Where each kind of routine job is first explained in full (year 1), for later years to link back to */
export const KIND_HOME_Y1: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const st of JOB_STEPS) {
    const t = st.txns[0];
    const k = t && kindKey(t);
    if (k && !out[k]) out[k] = `/on-the-job?year=1&step=${st.id}`;
  }
  return out;
})();

export const CATEGORY_STYLE: Record<Category, { label: string; cls: string }> = {
  setup: { label: "Setting up", cls: "bg-violet-100 text-violet-800" },
  sales: { label: "Sales", cls: "bg-emerald-100 text-emerald-800" },
  purchases: { label: "Purchases", cls: "bg-amber-100 text-amber-800" },
  payments: { label: "Payments", cls: "bg-rose-100 text-rose-800" },
  banking: { label: "Banking", cls: "bg-sky-100 text-sky-800" },
  payroll: { label: "Payroll", cls: "bg-indigo-100 text-indigo-800" },
  tax: { label: "Tax & IRD", cls: "bg-orange-100 text-orange-800" },
  monthly: { label: "Monthly bills", cls: "bg-stone-200 text-stone-700" },
  event: { label: "One-off event", cls: "bg-fuchsia-100 text-fuchsia-800" },
  "year-end": { label: "Year end", cls: "bg-kowhai-100 text-kowhai-800" },
  closing: { label: "Closing", cls: "bg-kowhai-200 text-kowhai-900" },
  after: { label: "After year end", cls: "bg-stone-200 text-stone-700" },
};

/** Timeline buckets: each month of the year, then year end and after */
export function bucketsOf(steps: JobStep[]): { key: string; label: string; first: number }[] {
  const out: { key: string; label: string; first: number }[] = [];
  steps.forEach((s, i) => {
    const key = s.phase === "during" ? s.date.slice(0, 7) : s.phase;
    if (out.some((b) => b.key === key)) return;
    const label = s.phase === "during" ? monthLabel(key).slice(0, 3) : s.phase === "year-end" ? "Year end" : "After";
    out.push({ key, label, first: i });
  });
  return out;
}
export const JOB_BUCKETS = bucketsOf(JOB_STEPS);
export const bucketOf = (s: JobStep) => (s.phase === "during" ? s.date.slice(0, 7) : s.phase);

/** Upcoming NZ deadlines after a date (for the "coming up" box) */
export function upcomingDeadlines(iso: string, n = 3): { date: string; label: string }[] {
  const list: { date: string; label: string }[] = [];
  for (const p of GST_PERIODS) list.push({ date: p.due, label: `GST return & payment (${p.label})` });
  for (let m = 5; m <= 16; m++) {
    const y = m > 12 ? 2027 : 2026;
    const mm = String(((m - 1) % 12) + 1).padStart(2, "0");
    list.push({ date: `${y}-${mm}-20`, label: "PAYE & deductions to IRD" });
  }
  list.push({ date: "2027-03-31", label: "Balance date: stocktake and year end" });
  list.push({ date: "2028-04-07", label: "Terminal tax (with tax agent)" });
  return list.filter((d) => d.date > iso).sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
}
