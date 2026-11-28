/**
 * The year-end checklist: every job from just before 31 March to the next April's terminal tax, for Kōwhai's
 * two years, with its real dates and figures from the books. The page is components/explore/YearEnd.tsx;
 * the logic is lib/yearEndChecklist.ts. Plan: docs/YEAR-END-CHECKLIST.md.
 */
import { FIXED_ASSETS } from "@/data/business";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { IR4_EXERCISES } from "@/data/study/ir4";
import { YEAR_ENDS } from "@/data/study/yearEnd";
import { GST_PERIODS, gstReturn } from "@/lib/engine/gst";
import { balances } from "@/lib/engine/ledger";
import { profitOf } from "@/data/study/yearEnd";
import type { Transaction } from "@/lib/engine/types";
import { money, nzDate, r2 } from "@/lib/money";
import { COMPANIES_OFFICE, GST, PROVISIONAL_TAX, RECORD_KEEPING_YEARS } from "@/lib/nz/rates";

export type Section = "before" | "on" | "after" | "accounts" | "tax" | "keep";

export const SECTIONS: { key: Section; title: string; blurb: string; mistake: string }[] = [
  { key: "before", title: "Before 31 March: tidy up", blurb: "A few things only count for the year if they're done before it ends.",
    mistake: "Writing off a bad debt in April. It's then next year's deduction, not this year's." },
  { key: "on", title: "On 31 March: count and cut off", blurb: "Balance date: freeze the picture of what the café has and owes.",
    mistake: "Counting the stock a week later and not adjusting for what was sold and bought in between." },
  { key: "after", title: "April and May: close the books and pay what's due", blurb: "The day-to-day payments from March still fall due, alongside the year-end work.",
    mistake: "Confusing the Companies Office annual return with the tax return. They're different: one confirms the company's details, the other is the IR4." },
  { key: "accounts", title: "The accounts and the company's paperwork", blurb: "The accountant prepares the statements; the directors sign off the year.",
    mistake: "Thinking a small company must have its accounts audited, or file them publicly. Kōwhai does neither: its accounts are for IRD and its owners." },
  { key: "tax", title: "Tax returns and payments", blurb: "The company's return, the owners' own returns, and the tax that follows.",
    mistake: "Forgetting the shareholders. Their salaries had no PAYE taken off, so they have tax of their own to file and pay." },
  { key: "keep", title: "Keep", blurb: "", mistake: "Throwing away the stocktake sheets and receipts once the return is filed." },
];

export type CheckItem = {
  id: string;
  section: Section;
  /** the date it's due (or happens), for the timeline */
  date: string;
  /** how the date is described: "By 7 May 2027", "During April 2027" */
  when: string;
  title: string;
  /** Kōwhai's own figure or fact for this year */
  figure?: string;
  /** why it matters, in plain English */
  why: string;
  /** the law or source, as a short citation */
  law?: string;
  link?: { href: string; label: string };
  /** something a real café would have that Kōwhai's books leave out */
  gap?: string;
};

export type Checklist = { key: "y1" | "y2"; label: string; yearEnd: string; items: CheckItem[] };

const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const $ = (n: number) => money(n);
const debitTo = (txns: Transaction[], code: string) => txns.find((t) => t.lines.some((l) => l.account === code && l.debit));

function build(key: "y1" | "y2"): Checklist {
  const y1 = key === "y1";
  const y = y1 ? 2027 : 2028;
  const ye = `${y}-03-31`;
  const before = y1 ? Y1.BEFORE_CLOSING : Y2.BEFORE_CLOSING;
  const b = y1 ? balances(Y1.BEFORE_CLOSING) : balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]);
  const yearEnd = YEAR_ENDS.find((e) => e.key === key)!;
  const ir4 = IR4_EXERCISES.find((e) => e.key === key)!.ret;
  const gstP6 = y1 ? gstReturn(Y1.ALL, GST_PERIODS[5]) : gstReturn(Y2.LEDGER, Y2.GST_PERIODS_Y2[5]);
  const gstDue = y1 ? GST_PERIODS[5].due : Y2.GST_PERIODS_Y2[5].due;
  const badDebt = debitTo(before, "624");
  const accruals = yearEnd.steps.map((s) => s.txn.title).filter((t) => /accrued|prepaid/i.test(t));
  const salaries = ir4.shareholders.map((s) => `${s.name.split(" ")[0]} ${money(s.salary, { dp: 0 })}`).join(", ");
  const nextYear = y + 1;
  // next year's standard-method provisional tax: this year's RIT + 5%, in three instalments (the last takes the cents)
  const provTotal = y1 ? Y2.PROVISIONAL.total : r2(ir4.boxes["30J"] * (1 + PROVISIONAL_TAX.standardUplift));
  const third = (n: number) => r2(provTotal / 3) * n;
  const instalments = y1 ? Y2.PROVISIONAL.instalments : [
    { date: `${y}-08-28`, amount: r2(provTotal / 3) },
    { date: `${nextYear}-01-15`, amount: r2(provTotal / 3) },
    { date: `${nextYear}-05-07`, amount: r2(provTotal - third(2)) },
  ];
  const fee = COMPANIES_OFFICE.annualReturnFee;

  const items: CheckItem[] = [
    /* ── before 31 March ── */
    badDebt
      ? { id: "bad-debts", section: "before", date: ye, when: `By 31 March ${y}`, title: "Write off the debts you won't collect",
          figure: `${badDebt.title.replace(/^Write off /i, "").replace(/^./, (c) => c.toUpperCase())}: ${$(badDebt.lines.find((l) => l.account === "624")!.debit!)} plus GST, written off on ${nzDate(badDebt.date)}.`,
          why: "Only a debt written off as bad during the year can be deducted that year. Its GST is claimed back in the GST return too.",
          law: "Income Tax Act s DB 31", link: { href: "/study/year-end", label: "Do the year-end yourself" } }
      : { id: "bad-debts", section: "before", date: ye, when: `By 31 March ${y}`, title: "Review the debtors: any you won't collect?",
          figure: "None this year: every customer paid.",
          why: "Only a debt written off as bad during the year can be deducted that year, so the review has to happen before balance date.",
          law: "Income Tax Act s DB 31", link: { href: "/explore/ledger", label: "See the debtors in the ledger" } },
    { id: "assets", section: "before", date: ye, when: `By 31 March ${y}`, title: "Update the fixed asset register",
      figure: y1 ? `${FIXED_ASSETS.length} assets bought in the first year, costing ${money(FIXED_ASSETS.reduce((s, a) => s + a.cost, 0), { dp: 0 })} in all.` : "The old POS system sold, and a new one bought.",
      why: "Depreciation, Investment Boost and any gain or loss on a sale all come from the register, for the accounts and for tax. Anything sold or thrown out comes off it.",
      link: { href: "/nz/depreciation", label: "Depreciation" } },

    /* ── on 31 March ── */
    { id: "stocktake", section: "on", date: ye, when: `31 March ${y}`, title: "Count the stock",
      figure: `Closing stock: ${$(b["130"])}.`,
      why: "Stock still on the shelves isn't this year's cost. Counting it is how the café knows what it really used, its cost of goods sold.",
      link: { href: "/nz/inventory", label: "Inventory and the stocktake" } },
    { id: "cut-off", section: "on", date: ye, when: `31 March ${y}`, title: "Cut-off: catch what belongs to this year",
      figure: accruals.join(" · "),
      why: "Costs and income belong to the year they happen in, not the year the invoice arrives. Anything earned, used or paid in advance across 31 March needs an adjustment.",
      link: { href: "/cycle/adjustments", label: "Adjusting entries" } },
    { id: "bank", section: "on", date: ye, when: `31 March ${y}`, title: "Count the till and reconcile the bank",
      figure: `Bank ${$(b["100"])}; till ${$(b["105"] ?? 0)}.`,
      why: "The cash in the books has to match the bank statement and the till, with every difference explained.",
      link: { href: "/cycle/bank-reconciliation", label: "Bank reconciliation" } },

    /* ── April and May ── */
    { id: "reverse", section: "after", date: `${y}-04-01`, when: `1 April ${y}`, title: "Reverse the accruals (optional)",
      figure: "Kōwhai reverses them on the first day of the new year.",
      why: "So when the real bill or invoice arrives in April it can be entered as normal, without counting it twice.",
      link: { href: "/on-the-job", label: "On the job: year 2" } },
    { id: "adjust", section: "after", date: `${y}-04-30`, when: `During April ${y}`, title: "Make the year-end adjustments",
      figure: `${yearEnd.steps.length} adjustments: profit before tax goes from ${$(profitOf(yearEnd.unadjusted, { beforeTax: true }))} to ${$(yearEnd.profitBeforeTax)}.`,
      why: "Until the adjustments are made the figures aren't finished: depreciation, the stock count, accruals, salaries and tax are all still missing.",
      link: { href: "/study/year-end", label: "Do the year-end yourself" } },
    { id: "annual-return", section: "after", date: `${y}-04-30`, when: `During April ${y} (Kōwhai's filing month)`, title: "File the Companies Office annual return",
      figure: `${money(r2(fee * (1 + GST.rate)))} (${$(fee)} plus GST).${y1 ? " Kōwhai's first: none was needed in 2026, the year it was registered." : ""}`,
      why: "It confirms the company's addresses, directors and shareholders are right. It isn't a tax return. A company that doesn't file can be removed from the register.",
      law: "Companies Act s 214", link: { href: "/nz/compliance", label: "Compliance" },
      gap: "The fee isn't in Kōwhai's books. A real café records it as an expense." },
    { id: "paye", section: "after", date: `${y}-04-20`, when: `By 20 April ${y}`, title: "Pay March's PAYE and deductions",
      figure: `${$(-b["215"])}.`,
      why: "Tax and KiwiSaver taken from March's pays are paid to IRD by the 20th of the next month, year end or not.",
      link: { href: "/study/pay-run", label: "Do a pay run yourself" } },
    { id: "gst", section: "after", date: gstDue, when: `By ${nzDate(gstDue)}`, title: "File and pay the February–March GST return",
      figure: `${$(gstP6.box15)} to pay.`,
      why: "The last GST period of the year is due on 7 May, not the 28th: IRD gives the year-end period extra time.",
      link: { href: "/study/gst-return", label: "Do the GST return yourself" } },
    ...(y1 ? [] : [{ id: "instalment-3", section: "after" as const, date: Y2.PROVISIONAL.instalments[2].date, when: `By ${nzDate(Y2.PROVISIONAL.instalments[2].date)}`,
      title: "Pay the third provisional tax instalment",
      figure: `${$(Y2.PROVISIONAL.instalments[2].amount)}: the last of this year's provisional tax.`,
      why: "Provisional tax for the year is paid in three instalments; the last falls after balance date.",
      link: { href: "/explore/provisional-tax", label: "Plan the provisional tax" } }]),
    { id: "holiday-pay", section: "after", date: addDays(ye, 63), when: `By ${nzDate(addDays(ye, 63))} (63 days)`, title: "Holiday pay accrued at year end: paid within 63 days?",
      figure: `${$(-b["220"])} accrued for Mia. She takes the leave later, so it's added back for tax this year.`,
      why: "Accrued holiday pay is deductible this year only if it's paid within 63 days of balance date. Otherwise it's deducted when it's paid.",
      law: "Income Tax Act s EA 4", link: { href: "/study/ir4", label: "Do the company tax return yourself" } },

    /* ── the accounts and the company ── */
    { id: "statements", section: "accounts", date: `${nextYear}-03-31`, when: "Before the IR4 is filed", title: "Prepare the financial statements",
      figure: y1 ? "The first year, so there are no comparatives." : "With year 1's figures beside this year's.",
      why: "IRD sets the minimum: a balance sheet and profit and loss on the accrual basis, the accounting policies, whether figures include GST, last year's comparatives, interest before RWT, a reconciliation to taxable income, and a tax fixed asset schedule.",
      law: "Tax Administration (Financial Statements) Order 2014, cl 8",
      link: y1 ? { href: "/cycle/statements", label: "Year 1's statements" } : { href: "/on-the-job/year-2-statements", label: "Year 2's statements" } },
    { id: "resolution", section: "accounts", date: `${y}-09-30`, when: `By 30 September ${y} (6 months after balance date)`, title: "The directors and shareholders sign off the year",
      figure: `Salaries: ${salaries}, credited to their current accounts.${y1 ? "" : ` The ${money(Y2.DIVIDEND.cash, { dp: 0 })} dividend was approved before it was paid, with the solvency test.`}`,
      why: "The annual meeting can be a written resolution signed by Aroha and Ben, or skipped if the board resolves there's nothing to decide. A small company like Kōwhai doesn't need an annual report.",
      law: "Companies Act ss 120, 122 and 208", link: { href: "/nz/shareholders", label: "Shareholders" } },
    { id: "ica", section: "accounts", date: ye, when: `At 31 March ${y}`, title: "Check the imputation credit account is in credit",
      figure: `${$(ir4.boxes["44"])} in credit.`,
      why: "If it's in debit at 31 March (more credits passed on with dividends than tax paid), the company owes further income tax and a penalty.",
      law: "Income Tax Act s OB 1", link: { href: "/study/ir4", label: "The imputation return" } },
    { id: "current-accounts", section: "accounts", date: ye, when: `At 31 March ${y}`, title: "Check the shareholders' current accounts",
      figure: ir4.shareholders.map((s) => `${s.name.split(" ")[0]} ${$(s.currentAccount)} in credit`).join(", ") + ": the company owes them.",
      why: "An overdrawn current account is a loan from the company to its owner, and can bring interest or FBT. In credit, it's money the company owes them.",
      link: { href: "/nz/shareholders", label: "Shareholders" } },

    /* ── tax ── */
    ...instalments.map((ins, n) => ({ id: `next-prov-${n + 1}`, section: "tax" as const, date: ins.date, when: `By ${nzDate(ins.date)}`,
      title: `${nextYear} provisional tax: instalment ${n + 1} of 3`,
      figure: `${$(ins.amount)} (this year's RIT + ${Math.round(PROVISIONAL_TAX.standardUplift * 100)}%, in three).`,
      why: `This year's residual income tax was over ${money(PROVISIONAL_TAX.ritThreshold, { dp: 0 })}, so the company pays next year's tax as it goes. The first instalment is due before this year's return is even filed.`,
      link: { href: "/explore/provisional-tax", label: "Plan the provisional tax" } })),
    { id: "acc", section: "tax", date: `${y}-07-31`, when: `Around July ${y} (and September)`, title: "ACC levy invoices",
      figure: "The employer invoice comes around July; Aroha's and Ben's own come around September, after their tax returns.",
      why: "ACC invoices the employer once a year: last year's levy on the actual payroll, plus an estimate for this year. Shareholder-employees' levies are worked out from their salaries.",
      gap: "ACC levies aren't in Kōwhai's books. A real café records the work levy as an expense." },
    { id: "ir4", section: "tax", date: `${nextYear}-03-31`, when: `By 31 March ${nextYear} (with a tax agent)`, title: "File the IR4, with the annual imputation return",
      figure: `Taxable income ${$(ir4.boxes["29"])}; tax ${$(ir4.boxes["30B"])}.`,
      why: "The company's income tax return. Without a tax agent it's due 7 July; Kōwhai's accountant gets the extension of time.",
      law: "Tax Administration Act ss 33 and 37", link: { href: "/study/ir4", label: "Do the company tax return yourself" } },
    { id: "ir3", section: "tax", date: `${nextYear}-03-31`, when: `By 31 March ${nextYear} (with a tax agent)`, title: "Aroha's and Ben's own IR3s",
      figure: `Including their shareholder salaries: ${salaries}.`,
      why: "No PAYE was taken off their salaries, so each pays their own tax on them, and can become a provisional taxpayer personally.",
      link: { href: "/explore/pay-yourself", label: "Salary or dividend?" } },
    { id: "terminal", section: "tax", date: `${nextYear}-04-07`, when: `By 7 April ${nextYear}`, title: "Pay the terminal tax",
      figure: `${$(ir4.boxes["30L"])}.`,
      why: "The rest of the year's tax, after RWT and provisional tax. With a tax agent it's due 7 April; otherwise 7 February.",
      link: { href: "/study/ir4", label: "Do the company tax return yourself" } },

    /* ── keep ── */
    { id: "records", section: "keep", date: `${y + RECORD_KEEPING_YEARS}-03-31`, when: `Until 31 March ${y + RECORD_KEEPING_YEARS}`, title: `Keep every record for ${RECORD_KEEPING_YEARS} years`,
      figure: "Invoices, receipts, bank statements, payroll, the stocktake sheets, the asset register, the ledger and the returns.",
      why: `IRD can ask for them for ${RECORD_KEEPING_YEARS} years after the end of the income year. They can be electronic.`,
      law: "Tax Administration Act s 22; GST Act s 75", link: { href: "/nz/compliance", label: "Compliance" } },
  ];
  return { key, label: y1 ? `Year 1: 31 March ${y}` : `Year 2: 31 March ${y}`, yearEnd: ye, items };
}

export const CHECKLISTS: Checklist[] = [build("y1"), build("y2")];
