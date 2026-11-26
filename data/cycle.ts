export interface CycleStep {
  slug: string;
  n: string;
  title: string;
  short: string;
  blurb: string;
  when: "during" | "end";
}

export const CYCLE_STEPS: CycleStep[] = [
  { slug: "identify", n: "1", title: "Identify transactions & source documents", short: "Identify", when: "during", blurb: "Spot what counts as a transaction and collect the evidence: invoices, receipts, payslips, statements." },
  { slug: "analyse", n: "2", title: "Analyse each transaction", short: "Analyse", when: "during", blurb: "Which accounts change? Up or down? So debit or credit?" },
  { slug: "journalise", n: "3", title: "Record it in the journal", short: "Journalise", when: "during", blurb: "Write the entry in date order, in the right journal, with debits = credits." },
  { slug: "post", n: "4", title: "Post to the ledger", short: "Post", when: "during", blurb: "Copy each journal line into its account in the general ledger (and subsidiary ledgers)." },
  { slug: "the-year", n: "4½", title: "Interlude: the rest of the year", short: "The year", when: "during", blurb: "Steps 1–4 repeat all year: 196 transactions, 25 pay runs, 5 GST returns. Watch the year unfold month by month." },
  { slug: "unadjusted-tb", n: "5", title: "Unadjusted trial balance", short: "Trial balance", when: "end", blurb: "List every balance at 31 March and check debits = credits." },
  { slug: "bank-reconciliation", n: "6", title: "Bank reconciliation", short: "Bank rec", when: "end", blurb: "Match the books to the bank statement and explain every difference." },
  { slug: "adjustments", n: "7", title: "Adjusting entries", short: "Adjust", when: "end", blurb: "Accruals, prepayments, depreciation, stock, bad debts, holiday pay, shareholder salaries, tax." },
  { slug: "adjusted-tb", n: "8", title: "Adjusted trial balance (the worksheet)", short: "Adjusted TB", when: "end", blurb: "See every adjustment flow into the final balances, split between P&L and balance sheet." },
  { slug: "statements", n: "9", title: "Prepare the financial statements", short: "Statements", when: "end", blurb: "Profit & loss, balance sheet, changes in equity, cash flow, tax reconciliation and notes." },
  { slug: "closing", n: "10", title: "Closing entries", short: "Close", when: "end", blurb: "Zero the income and expense accounts and move the profit into retained earnings." },
  { slug: "post-closing", n: "11", title: "Post-closing trial balance & the new year", short: "New year", when: "end", blurb: "Only balance-sheet accounts remain. Then come the filings and payments after year end." },
];

export const stepIndex = (slug: string) => CYCLE_STEPS.findIndex((s) => s.slug === slug);
