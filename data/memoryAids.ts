/**
 * Memory aids: short, sticky ways to remember the ideas beginners mix up most.
 * Every aid has a "why it works" line, so it builds understanding instead of replacing it.
 * Shown inline where each idea is taught (<MemoryAid k="..." />), on the cheat sheet
 * (/glossary/memory-aids), in the glossary panel for related terms, and on matching tasks
 * in "A year on the job".
 *
 * Text supports **bold** and [[glossary-key|links]].
 * NZ dates checked against IRD (Nov 2026):
 *  - GST: ird.govt.nz/gst/filing-and-paying-gst-and-refunds (28th; 7 May and 15 January exceptions)
 *  - PAYE / payday filing: ird.govt.nz/employing-staff/payday-filing/paying-deductions-to-inland-revenue
 *  - Provisional tax: lib/nz/rates.ts PROVISIONAL.instalments (standard option, 31 March balance date)
 */

export type AidGroup = "basics" | "statements" | "process" | "nz";

export interface MemoryAid {
  key: string;
  group: AidGroup;
  /** what it helps you remember */
  topic: string;
  /** the memorable bit itself */
  hook: string;
  /** optional breakdown, one line per letter or part */
  parts?: [string, string][];
  /** why it works / what it means */
  why: string;
  /** Kōwhai Café example */
  example?: string;
  /** glossary terms this aid belongs to (shown in their glossary panels) */
  terms: string[];
  /** where it's taught in full */
  learn: { href: string; label: string };
}

export const AID_GROUPS: Record<AidGroup, { title: string; blurb: string }> = {
  basics: { title: "Debits, credits & the equation", blurb: "The rules every entry follows." },
  statements: { title: "The financial statements", blurb: "What each report shows, and how they differ." },
  process: { title: "The process", blurb: "The order of the work, and the year-end jobs." },
  nz: { title: "NZ tax numbers & dates", blurb: "The figures and deadlines you'll use every month." },
};

export const MEMORY_AIDS: MemoryAid[] = [
  /* ── Debits, credits & the equation ── */
  {
    key: "equation", group: "basics", topic: "The accounting equation",
    hook: "What you own = what you owe + what's yours",
    parts: [["Own", "Assets"], ["Owe", "Liabilities"], ["Yours", "Equity"]],
    why: "Everything the business owns was paid for by someone: either lenders and suppliers (what it owes) or the owners (what's theirs). So the two sides must always be equal. Every entry keeps them equal.",
    example: "At 31 March 2027 Kōwhai Café owns $256,486, owes $109,217, and $147,269 belongs to Aroha and Ben. $109,217 + $147,269 = $256,486.",
    terms: ["accounting-equation", "asset", "liability", "equity"],
    learn: { href: "/foundations/accounting-equation", label: "The accounting equation" },
  },
  {
    key: "dead-clic", group: "basics", topic: "Which side increases each account",
    hook: "DEAD CLIC",
    parts: [["D", "Debits increase:"], ["E", "Expenses"], ["A", "Assets"], ["D", "Drawings"], ["C", "Credits increase:"], ["L", "Liabilities"], ["I", "Income"], ["C", "Capital (equity)"]],
    why: "Each account sits on the side that increases it (its [[normal-balance|normal balance]]). To decrease it, use the other side. Expenses and drawings sit with assets because they all use up or take out what the business has.",
    example: "Kōwhai buys coffee beans on credit: an expense goes up (debit, the **E** in DEAD) and money owed to the roaster goes up (credit, the **L** in CLIC).",
    terms: ["debit", "credit", "normal-balance", "double-entry"],
    learn: { href: "/foundations/debits-credits", label: "Debits & credits" },
  },
  {
    key: "credit-right", group: "basics", topic: "Which side is which",
    hook: "cRedit has an R for Right",
    why: "Debit is the **left** column and credit is the **right** column, nothing more. \"Debit\" doesn't mean bad and \"credit\" doesn't mean good: they're just sides.",
    terms: ["debit", "credit", "t-account"],
    learn: { href: "/foundations/t-accounts", label: "T-accounts" },
  },

  /* ── The financial statements ── */
  {
    key: "movie-photo", group: "statements", topic: "P&L vs balance sheet",
    hook: "The P&L is a movie, the balance sheet is a photo",
    why: "The [[profit-and-loss|profit & loss]] covers a **period**: what happened over the year (\"for the year ended 31 March\"). The [[balance-sheet|balance sheet]] shows **one moment**: what the business has and owes on a single day (\"as at 31 March\").",
    example: "Kōwhai's P&L adds up 12 months of café sales. Its balance sheet shows the bank balance on the night of 31 March only.",
    terms: ["profit-and-loss", "balance-sheet", "financial-statements"],
    learn: { href: "/cycle/statements", label: "Step 9 · Financial statements" },
  },
  {
    key: "trip-meter", group: "statements", topic: "Which accounts reset each year",
    hook: "Income and expenses are a trip meter. The balance sheet is the odometer.",
    why: "A car's trip meter goes back to zero for each new trip; the odometer keeps the total. Income and expense accounts measure **one year**, so [[closing-entries|closing entries]] reset them to zero and move the year's profit into [[retained-earnings|retained earnings]]. Assets, liabilities and equity carry on into next year.",
    example: "On 1 April 2027 Kōwhai's café sales start again at $0, but its bank balance carries on from $200,510.",
    terms: ["closing-entries", "retained-earnings", "income-summary"],
    learn: { href: "/cycle/closing", label: "Step 10 · Closing entries" },
  },
  {
    key: "profit-cash", group: "statements", topic: "Why profit isn't cash",
    hook: "Profit is an opinion, cash is a fact",
    why: "Profit includes estimates and timing choices: depreciation, accruals, prepayments, holiday pay. The bank balance is just what's there. That's why there's a separate [[cash-flow-statement|cash flow statement]], and why a profitable business can still run out of cash.",
    example: "Kōwhai's depreciation reduces profit every year, but no money leaves the bank for it. The cash went out when the equipment was bought.",
    terms: ["cash-flow-statement", "accrual-basis", "net-profit"],
    learn: { href: "/foundations/cash-vs-accrual", label: "Cash vs accrual" },
  },
  {
    key: "current-12", group: "statements", topic: "Current vs non-current",
    hook: "Current means within 12 months",
    why: "On the balance sheet, **current** assets turn into cash, and current liabilities must be paid, within the next 12 months. Everything else is **non-current**. It shows whether the business can pay what's due soon.",
    example: "Kōwhai's bank loan is split in two: the repayments due in the next 12 months ($9,929 at 31 March 2028) are current; the rest is non-current.",
    terms: ["balance-sheet", "working-capital"],
    learn: { href: "/cycle/statements", label: "Step 9 · Financial statements" },
  },

  /* ── The process ── */
  {
    key: "cycle-order", group: "process", topic: "The order of the accounting cycle",
    hook: "Did Jack Leave The Accounts Sitting Closed?",
    parts: [["D", "Documents"], ["J", "Journal"], ["L", "Ledger"], ["T", "Trial balance"], ["A", "Adjustments"], ["S", "Statements"], ["C", "Close"]],
    why: "Each step uses the one before it: documents prove what happened, the journal records it, the ledger sorts it by account, the trial balance checks it, adjustments fix the timing at year end, statements report it, and closing resets for next year. (The bank reconciliation and the extra trial balances are checks along the way.)",
    terms: ["accounting-cycle", "source-document", "journal", "ledger", "trial-balance"],
    learn: { href: "/cycle", label: "Part 2 · The accounting cycle" },
  },
  {
    key: "accrued-prepaid", group: "process", topic: "Accrued vs prepaid",
    hook: "Accrued: used it, not billed yet. Prepaid: paid it, not used yet.",
    why: "Both fix timing at year end, in opposite directions. An [[accrued-expense|accrual]] adds a cost you've already had but haven't been billed for (a liability). A [[prepayment]] holds back a cost you've paid for but not used yet (an asset).",
    example: "At 31 March 2027 Kōwhai has used March's power but the bill comes in April: accrue $520. It has paid insurance for April–September already: $1,200 is prepaid.",
    terms: ["accrued-expense", "prepayment", "accrued-income", "income-in-advance", "adjusting-entry"],
    learn: { href: "/cycle/adjustments", label: "Step 7 · Adjusting entries" },
  },
  {
    key: "never-bank", group: "process", topic: "Year-end adjustments",
    hook: "Adjustments never touch the bank",
    why: "An [[adjusting-entry|adjusting entry]] moves an amount into the right year. Almost every one pairs **a P&L account with a balance sheet account**, and none of them touches cash: if money moved, it's a normal transaction, not an adjustment.",
    example: "Kōwhai's depreciation, accrued power, prepaid insurance and holiday pay adjustments all pair a P&L account with a balance sheet account. None of them touches the bank account.",
    terms: ["adjusting-entry", "accrual-basis"],
    learn: { href: "/cycle/adjustments", label: "Step 7 · Adjusting entries" },
  },
  {
    key: "cropoc", group: "process", topic: "What a trial balance can't catch",
    hook: "CROPOC",
    parts: [
      ["C", "Commission: right amount, right type of account, wrong one (paid supplier A, posted to supplier B)"],
      ["R", "Reversal: debit and credit swapped"],
      ["O", "Omission: the whole entry left out"],
      ["P", "Principle: wrong type of account (an oven posted to repairs)"],
      ["O", "Original entry: the wrong amount on both sides ($540 typed as $450)"],
      ["C", "Compensating: two errors that cancel out"],
    ],
    why: "A [[trial-balance|trial balance]] only proves debits = credits. All six of these errors still balance, so they slip through. The bank reconciliation and reviewing the accounts catch them.",
    terms: ["trial-balance", "bank-reconciliation"],
    learn: { href: "/cycle/unadjusted-tb", label: "Step 5 · Trial balance" },
  },
  {
    key: "bank-side", group: "process", topic: "Why bank statements look backwards",
    hook: "Your bank statement is written from the bank's side",
    why: "To the bank, your money is a **debt it owes you**: a liability in its books. So a deposit is a **credit** on your statement, even though in your books it's a **debit** to the bank account. Same money, opposite sides.",
    example: "When Kōwhai banks $1,000 of cash takings, the statement shows a $1,000 credit. In Kōwhai's books it's a debit to the bank account.",
    terms: ["bank-reconciliation"],
    learn: { href: "/cycle/bank-reconciliation", label: "Step 6 · Bank reconciliation" },
  },
  {
    key: "dv-sl", group: "process", topic: "Diminishing value vs straight line",
    hook: "DV: same percentage, shrinking amount. SL: same amount every year.",
    why: "**Diminishing value** takes a percentage of what's left, so the charge shrinks each year. **Straight line** takes a percentage of the original cost, so the charge stays the same until the asset is written off.",
    example: "For example, a $1,000 asset at 20%: DV is $200 in year 1, then $160 (20% of $800), then $128. SL is $200 every year for five years.",
    terms: ["depreciation", "book-value"],
    learn: { href: "/nz/depreciation", label: "Depreciation & Investment Boost" },
  },

  /* ── NZ tax numbers & dates ── */
  {
    key: "gst-3-23", group: "nz", topic: "Finding the GST in a price",
    hook: "GST inside a price: × 3/23",
    parts: [["Add GST", "× 1.15"], ["Remove GST", "÷ 1.15"], ["GST inside a price", "× 3/23"]],
    why: "NZ prices include 15% [[gst|GST]], so a GST-inclusive price is 115% of the price before GST. The GST part is 15/115 of the total, which simplifies to **3/23**. Taking 15% of the inclusive price is the classic mistake: it's too much.",
    example: "A $5.75 flat white: $5.75 × 3/23 = $0.75 GST, leaving $5.00. (15% of $5.75 would be $0.86, which is wrong.)",
    terms: ["gst", "output-tax", "input-tax", "gst-return"],
    learn: { href: "/nz/gst", label: "GST" },
  },
  {
    key: "gst-due", group: "nz", topic: "When the GST return is due",
    hook: "GST: the 28th, except 7 May and 15 January",
    why: "A GST return and payment are due on the **28th of the month after the period ends**. Two periods end at holiday time, so they get longer: a period ending 31 March is due **7 May**, and one ending 30 November is due **15 January**.",
    example: "Kōwhai files every 2 months. Its periods end in May, July, September, November, January and March, so it pays on 28 June, 28 August, 28 October, 15 January, 28 February and 7 May.",
    terms: ["gst-return", "gst"],
    learn: { href: "/nz/gst-return", label: "The GST return" },
  },
  {
    key: "paye-20th", group: "nz", topic: "Payroll deadlines",
    hook: "File within 2 working days. Pay by the 20th.",
    why: "Two deadlines. [[payday-filing|Payday filing]]: the employment information for each pay run goes to IRD within **2 working days** of payday. Payment: the month's [[paye|PAYE]] and deductions are paid by the **20th of the next month** (for employers deducting under $500,000 a year).",
    example: "Kōwhai pays fortnightly. After each payday it files within 2 working days, then pays all of April's PAYE, KiwiSaver and student loan deductions by 20 May.",
    terms: ["paye", "payday-filing", "kiwisaver", "esct"],
    learn: { href: "/nz/paye", label: "PAYE & payday filing" },
  },
  {
    key: "provisional-dates", group: "nz", topic: "Provisional tax instalments",
    hook: "Provisional tax rides with GST: 28 August, 15 January, 7 May",
    why: "For a 31 March balance date, the three [[provisional-tax|provisional tax]] instalments fall on 28 August, 15 January and 7 May: roughly every four months. All three are also GST due dates, so a business pays both on the same day.",
    example: "In its second year Kōwhai pays $5,859.73 on 28 August 2027, $5,859.73 on 15 January 2028 and $5,859.72 on 7 May 2028.",
    terms: ["provisional-tax", "terminal-tax"],
    learn: { href: "/nz/provisional-tax", label: "Provisional & terminal tax" },
  },
  {
    key: "imputation-28-72", group: "nz", topic: "Imputation credits on a dividend",
    hook: "28/72: for every $72 of dividend, up to $28 of credit",
    why: "The company has already paid 28% tax on its profit. $100 of profit becomes $28 of tax and $72 left to pay out. So a fully imputed dividend carries up to 28/72 of the cash as [[imputation-credit|imputation credits]], and the shareholder isn't taxed twice.",
    example: "Kōwhai's $20,000 dividend carries $20,000 × 28/72 = $7,777.78 of imputation credits.",
    terms: ["imputation-credit", "imputation-credit-account", "dividend"],
    learn: { href: "/nz/shareholders", label: "Shareholders, dividends & imputation" },
  },
];

export const AID_MAP: Record<string, MemoryAid> = Object.fromEntries(MEMORY_AIDS.map((a) => [a.key, a]));

/** aids that belong to a glossary term (for the glossary panel) */
export const aidsForTerm = (term: string) => MEMORY_AIDS.filter((a) => a.terms.includes(term));

/** aids that fit a task in "A year on the job", from its id and title */
export function aidsForStep(id: string, title: string): string[] {
  if (/^GSTRET/.test(id)) return ["gst-3-23", "gst-due"];
  if (/^GST-/.test(id)) return ["gst-due"];
  if (/^PAYE-/.test(id) || id === "A21" || id === "PAY-2027-04-07") return ["paye-20th"];
  if (/^REC-/.test(id)) return ["bank-side"];
  if (id === "TB-UNADJ") return ["cropoc"];
  if (/ADJ\d/.test(id)) {
    if (/depreciation/i.test(title)) return ["never-bank", "dv-sl"];
    if (/accru|prepa/i.test(title)) return ["accrued-prepaid", "never-bank"];
    return ["never-bank"];
  }
  if (id === "REVERSALS") return ["accrued-prepaid"];
  if (id === "STATEMENTS") return ["movie-photo", "profit-cash", "current-12"];
  if (/(^|-)CL01$/.test(id)) return ["trip-meter"];
  if (id === "NEW-YEAR") return ["trip-meter"];
  if (id === "B08" || id === "B15" || id === "PROV-3") return ["provisional-dates"];
  if (id === "B17") return ["imputation-28-72"];
  if (id === "A01") return ["equation", "dead-clic"];
  return [];
}
