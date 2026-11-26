/**
 * "A year on the job", year 2 (1 April 2027 – 31 March 2028).
 *
 * Routine jobs work exactly as in year 1, so they point back to their full explanation there.
 * The new jobs (reversals, provisional tax, annual leave, an asset sale, a dividend,
 * comparatives) are explained in full here.
 */
import { GST_PERIODS } from "@/lib/engine/gst";
import { money, nzDate } from "@/lib/money";
import { ADJUSTMENTS, CLOSING, DISPOSAL, DIVIDEND, DURING_YEAR, GST_PERIODS_Y2, PROVISIONAL, TAX, YEAR2_FACTS } from "@/data/books/year2";
import { KIND_HOME_Y1, duringSteps, monthLabel, type JobStep } from "./steps";

function build(): JobStep[] {
  const opening: JobStep = {
    id: "NEW-YEAR",
    date: "2027-04-01",
    phase: "during",
    who: "Ben (bookkeeper)",
    category: "setup",
    title: "A new year: the books carry forward",
    txns: [],
    intro:
      "1 April 2027, the first day of the café's second financial year. Nothing needs to be entered to start it: the ledger simply carries on.\n\n• **Balance sheet accounts carry forward.** The bank, debtors, assets, loan, GST owed and equity all start the year where they ended. These are the **permanent** accounts.\n• **Income and expense accounts start at zero.** They were closed to retained earnings, so this year's profit is measured from scratch. These are the **temporary** accounts.\n\nThe trial balance on the right is the opening position: last year's post-closing trial balance.\n\nNew in year 2: last year's loose ends (accruals, the final GST return, terminal tax), provisional tax, staff taking annual leave, selling an asset and the first dividend. Routine jobs work just as in year 1, so use **⏩ Skip routine** to jump between the new ones.",
    skippable: false,
    panel: { kind: "tb", stage: "opening" },
    deep: { href: "/cycle/post-closing", label: "Post-closing trial balance" },
  };

  const ir4Early: JobStep = {
    id: "IR4-Y1",
    date: "2027-07-15",
    phase: "during",
    who: "Rata & Co (accountant)",
    category: "tax",
    title: "File last year's tax return (IR4) early",
    txns: [],
    intro: `With last year's accounts finished, Rata & Co file Kōwhai's 2027 [[ir4]], and Aroha's and Ben's IR3s for their shareholder salaries. They had until 31 March 2028, but filing now fixes last year's **residual income tax (RIT)** at ${money(PROVISIONAL.y1Rit)}.\n\nThat number decides this year's provisional tax. Under the **standard option**, the company pays last year's RIT + 5% = ${money(PROVISIONAL.total)} in three instalments: 28 August, 15 January and 7 May.\n\nFiling early doesn't change when last year's **terminal tax** (${money(YEAR2_FACTS.y1Terminal)}) is due: still 7 April 2028.`,
    skippable: false,
    deep: { href: "/nz/provisional-tax", label: "Provisional tax options" },
  };

  const steps = duringSteps({
    during: DURING_YEAR,
    firstMonth: "2027-04",
    lastMonth: "2028-03",
    lastRecDate: "2028-04-03",
    periods: [GST_PERIODS[5], ...GST_PERIODS_Y2],
    teach: false,
    gstIntro: (pid, p) =>
      pid === "P6"
        ? `Last year's final GST return (${p.label}) is due on **${nzDate(p.due)}**: the period ending in March gets until 7 May. Ben files it now. It includes last year's year-end GST adjustments: the bad debt written off (box 13) and the entertainment adjustment (box 9).`
        : `Ben prepares and files the GST return for ${p.label}, due **${nzDate(p.due)}**: output tax on sales minus input tax on purchases, plus any adjustments.${pid === "Y2-P3" ? " This one includes GST on selling the old POS system and the GST claimed on the new one." : ""}`,
    gstDeep: () => "/nz/gst-return",
    recIntro: (ym, kind) =>
      kind === "last"
        ? "The year-end reconciliation, done when March's statement arrives. As last year, the books and the statement don't agree straight away:\n\n• A **bank fee** charged on 31 March that isn't in the books yet. Ben records it now (the entry below).\n• A **deposit in transit**: the 31 March takings went into the night safe and were processed on 1 April.\n\nOnly the fee needs an entry. The deposit is a timing difference."
        : kind === "first"
          ? "April's reconciliation has a link to last year. The two timing differences at 31 March, the night-safe deposit and the late payment to the shopfitter, both show up on April's statement. Ben ticks them off against last year's reconciliation, and from then on the cashbook and the statement agree line by line."
          : `Month-end bank reconciliation for ${monthLabel(ym)}: everything matches, so there's nothing to record.`,
    overrides: {
      B08: { category: "tax" },
      B10: { category: "event" },
      B11: { category: "event" },
      B15: { category: "tax" },
      B17: { who: "Aroha & Ben (owners)", category: "event" },
      B18: { category: "tax" },
    },
    extras: [ir4Early],
    kindHome: KIND_HOME_Y1,
  });

  // (repeatOf is an index: remember which step it pointed to before moving steps around)
  const ids = steps.map((s) => s.id);
  // The four reversals are one job: show them together
  const revIdx = steps.findIndex((s) => s.id.startsWith("REV-"));
  const revs = steps.filter((s) => s.id.startsWith("REV-"));
  const reversals: JobStep = {
    id: "REVERSALS",
    date: "2027-04-01",
    phase: "during",
    who: "Rata & Co (accountant)",
    category: "event",
    title: "Reverse last year's accruals and prepayment",
    txns: revs.flatMap((s) => s.txns),
    intro:
      "Last year's books ended with four **estimates** of things that happen this year: catering income not yet invoiced, power not yet billed, wages not yet paid, and insurance paid in advance. Now the real invoices and pay runs are about to arrive.\n\nThe accountant posts [[reversing-entry|reversing entries]]: the same four adjustments with debits and credits swapped, dated 1 April. Ben can then enter the real documents **the normal way**, and nothing is counted twice:\n\n• Catering income: −$600 now, +$600 when the invoice is sent → $0 this year (it was last year's).\n• Power: −$520 now, + the real bill → only the estimate's error lands this year.\n• Wages: the 7 April pay run is entered in full, and the reversal cancels the 9 days worked last year.\n• Insurance: the $1,200 prepaid for April–September becomes this year's expense.\n\nReversals are optional: the accountant could leave the accruals and have Ben remember to code each bill against them. Reversing is simpler and less error-prone.",
    skippable: false,
    deep: { href: "/cycle/adjustments", label: "Last year's adjustments" },
  };
  steps.splice(revIdx, revs.length, reversals);
  steps.unshift(opening);
  for (const st of steps) if (st.repeatOf !== undefined) st.repeatOf = steps.findIndex((x) => x.id === ids[st.repeatOf!]);

  /* ── Year end ── */
  const ye = (s: Omit<JobStep, "phase" | "skippable"> & { skippable?: boolean }) => steps.push({ phase: "year-end", skippable: false, ...s });
  ye({
    id: "BALANCE-DATE", date: "2028-03-31", who: "Ben (bookkeeper)", category: "year-end",
    title: "31 March 2028: balance date again",
    txns: [],
    intro: "The second balance date. The checklist is the same as last year, plus a few things that are new because the business is older: leave owing to staff, an asset register with a sale and a purchase, and tax already paid in advance.",
    panel: { kind: "checklist", items: [
      "Count the stock and write up the stocktake sheets",
      "Count the till and put the takings in the night safe",
      "Cut-off: last invoices received and issued, staff days worked but not yet paid",
      "Update the asset register: the old POS system sold, the new one bought",
      "Leave report: annual leave Mia has earned but not yet taken",
      "Gather the provisional tax receipts and the dividend paperwork for the accountant",
    ] },
  });
  const recIdx = steps.findIndex((s) => s.id === "REC-2028-03");
  const [marchRec] = steps.splice(recIdx, 1);
  steps.push(marchRec);

  ye({
    id: "TB-UNADJ", date: "2028-04-05", doneLabel: "Early April 2028", who: "Rata & Co (accountant)", category: "year-end",
    title: "Run the unadjusted trial balance",
    txns: [],
    intro: "As last year, the accountant starts from the unadjusted [[trial-balance]]. Two things look different. **Inventory** still shows last year's stocktake ($3,800): with periodic inventory it's only updated at year end. And the **holiday pay accrual** is at zero: Mia's leave used it up.",
    panel: { kind: "tb", stage: "unadjusted" },
    deep: { href: "/cycle/unadjusted-tb", label: "Trial balance step" },
  });
  const isTax = (id: string) => id === "Y2-ADJ09" || id === "Y2-ADJ10";
  for (const t of ADJUSTMENTS.filter((t) => !isTax(t.id))) {
    ye({ id: t.id, date: t.date, doneLabel: "Done in April–May 2028, dated 31 March 2028", who: "Rata & Co (accountant)", category: "year-end", title: `Adjustment: ${t.title}`, txns: [t], intro: t.story, deep: { href: "/cycle/adjustments", label: "All adjustments" } });
  }
  ye({
    id: "TAX-CALC", date: "2028-05-15", doneLabel: "May 2028", who: "Rata & Co (accountant)", category: "tax",
    title: "Work out the company's income tax",
    txns: [],
    intro: `This year's tax reconciliation has new lines. **Holiday pay** reverses: last year's accrual was added back, and now that Mia has taken the leave it's deducted. The **asset sale** swaps the accounting gain for depreciation recovery. And the **new POS system** gets Investment Boost.\n\nTaxable income ${money(TAX.taxableIncome)} × 28% = **${money(TAX.tax)}**. Provisional tax of ${money(PROVISIONAL.total)} covers most of it, so terminal tax of **${money(TAX.terminal)}** is due 7 April 2029.`,
    panel: { kind: "tax" },
    deep: { href: "/nz/income-tax", label: "Income tax in depth" },
  });
  for (const t of ADJUSTMENTS.filter((t) => isTax(t.id))) {
    ye({ id: t.id, date: t.date, doneLabel: "Dated 31 March 2028", who: "Rata & Co (accountant)", category: "tax", title: `Adjustment: ${t.title}`, txns: [t], intro: t.story, deep: { href: "/nz/provisional-tax", label: "Provisional & terminal tax" } });
  }
  ye({
    id: "TB-ADJ", date: "2028-05-20", doneLabel: "May 2028", who: "Rata & Co (accountant)", category: "year-end",
    title: "Run the adjusted trial balance",
    txns: [],
    intro: "Every adjustment is in. The adjusted trial balance is the source for this year's statements.",
    panel: { kind: "tb", stage: "adjusted" },
    deep: { href: "/cycle/adjusted-tb", label: "10-column worksheet" },
  });
  ye({
    id: "STATEMENTS", date: "2028-05-25", doneLabel: "May 2028", who: "Rata & Co (accountant)", category: "year-end",
    title: "Prepare the financial statements, with comparatives",
    txns: [],
    intro: "From the second year on, every statement shows **two columns**: this year and last year. These are called [[comparatives]]. They let Aroha, Ben and the bank see at a glance what changed: sales up, wages up, a gain on sale, a dividend paid.\n\nThe statement of changes in equity now starts from last year's closing equity, and shows the dividend as a reduction in retained earnings.",
    panel: { kind: "statements" },
    deep: { href: "/on-the-job/year-2-statements", label: "Year 2 statements with comparatives" },
  });
  for (const t of CLOSING) {
    steps.push({ id: t.id, date: t.date, doneLabel: "Dated 31 March 2028", phase: "year-end", who: "Rata & Co (accountant)", category: "closing", title: t.title, txns: [t], intro: t.story, skippable: false, deep: { href: "/cycle/closing", label: "Closing entries" } });
  }
  ye({
    id: "TB-POST", date: "2028-05-31", doneLabel: "May 2028", who: "Rata & Co (accountant)", category: "closing",
    title: "Post-closing trial balance: two years done",
    txns: [],
    intro: `Income and expenses are back to zero. Retained earnings now hold two years of profit, less the dividend: last year's ${money(YEAR2_FACTS.y1NetProfit)} + this year's profit − ${money(DIVIDEND.cash)}. These balances open the 2029 income year.`,
    panel: { kind: "tb", stage: "post-closing" },
    deep: { href: "/on-the-job/year-2-statements", label: "Year 2 statements" },
  });

  /* ── After year end ── */
  const after = (s: Omit<JobStep, "phase" | "skippable" | "txns">) => steps.push({ phase: "after", skippable: false, txns: [], ...s });
  after({
    id: "TERMINAL-Y1", date: "2028-04-07", who: "Ben (bookkeeper)", category: "after",
    title: "Pay last year's terminal tax",
    intro: `Last year's terminal tax (${money(YEAR2_FACTS.y1Terminal)}) is due today: 7 April of the year after the next, because the company has a tax agent. It's been sitting in income tax payable on both balance sheets. Paying it is the first entry of the 2029 year.\n\nIt also credits the imputation credit account, ready for future dividends.`,
    deep: { href: "/nz/provisional-tax", label: "Terminal tax" },
  });
  after({
    id: "GSTRET-Y2-P6", date: "2028-05-07", who: "Ben (bookkeeper)", category: "after",
    title: "File the last GST return of the year (February–March 2028)",
    intro: "As last year, the final period's return is due 7 May. It includes this year's entertainment adjustment (box 9).",
    panel: { kind: "gst", period: "Y2-P6" },
    deep: { href: "/nz/gst-return", label: "GST return, box by box" },
  });
  after({
    id: "PROV-3", date: PROVISIONAL.instalments[2].date, who: "Ben (bookkeeper)", category: "after",
    title: "Third provisional tax instalment",
    intro: `The last instalment for the 2028 year (${money(PROVISIONAL.instalments[2].amount)}) is due 7 May, after balance date. It's included in income tax payable at 31 March.`,
    deep: { href: "/nz/provisional-tax", label: "Provisional tax" },
  });
  after({
    id: "ANNUAL-RETURN", date: "2028-06-15", who: "Aroha & Ben (owners)", category: "after",
    title: "Companies Office annual return",
    intro: "The company confirms its directors, shareholders and addresses with the Companies Office, as every year.",
    deep: { href: "/nz/compliance", label: "Compliance calendar" },
  });
  after({
    id: "IR4", date: "2029-03-31", doneLabel: "By 31 March 2029 (with the accountant's extension of time)", who: "Rata & Co (accountant)", category: "after",
    title: "File the 2028 IR4 and the owners' IR3s",
    intro: `The company's IR4 now also shows the **dividend** and the imputation credits attached. Aroha and Ben include their gross dividends and credits in their IR3s, alongside their shareholder salaries.\n\nThe sale of the POS system appears as ${money(DISPOSAL.recovered)} of depreciation recovery income. Terminal tax of ${money(TAX.terminal)} is due 7 April 2029.`,
    deep: { href: "/nz/income-tax", label: "Income tax in depth" },
  });
  return steps;
}

export const JOB_STEPS_Y2: JobStep[] = build();

/** NZ deadlines during year 2 (for the "coming up" box) */
export const DEADLINES_Y2: { date: string; label: string }[] = [
  ...[GST_PERIODS[5], ...GST_PERIODS_Y2].map((p) => ({ date: p.due, label: `GST return & payment (${p.label})` })),
  ...Array.from({ length: 12 }, (_, k) => {
    const d = new Date(Date.UTC(2027, 4 + k, 20));
    return { date: d.toISOString().slice(0, 10), label: "PAYE & deductions to IRD" };
  }),
  ...PROVISIONAL.instalments.map((i, n) => ({ date: i.date, label: `Provisional tax instalment ${n + 1}` })),
  { date: "2028-03-20", label: "Dividend RWT to IRD" },
  { date: "2028-03-31", label: "Balance date: stocktake and year end" },
  { date: "2028-04-07", label: "Last year's terminal tax" },
  { date: YEAR2_FACTS.terminalDue, label: "This year's terminal tax (with tax agent)" },
];
