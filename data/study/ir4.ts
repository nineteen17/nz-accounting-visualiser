/**
 * "Do the company tax return yourself": Kōwhai's two IR4s, built from the books (data/books).
 * The logic is lib/study/ir4.ts; the form is lib/engine/ir4.ts. Plan: docs/IR4.md.
 */
import { SHAREHOLDERS } from "@/data/business";
import { BEFORE_CLOSING as Y1_BEFORE, DURING_YEAR as Y1_DURING, PROFIT_BEFORE_TAX as Y1_PBT, TAX as Y1_TAX } from "@/data/books";
import { BEFORE_CLOSING as Y2_BEFORE, DURING_YEAR as Y2_DURING, ICA, OPENING_ENTRY, PROFIT_BEFORE_TAX as Y2_PBT, TAX as Y2_TAX, YEAR2_FACTS } from "@/data/books/year2";
import { balances } from "@/lib/engine/ledger";
import { ir4Return, type Ir4 } from "@/lib/engine/ir4";
import type { TaxItem } from "@/lib/nz/incomeTax";
import type { Transaction } from "@/lib/engine/types";
import { money, nzDate, r2 } from "@/lib/money";
import { PROVISIONAL_TAX } from "@/lib/nz/rates";
import type { AdjItem, DateQ, Ir4Exercise } from "@/lib/study/ir4";

/**
 * The books' tax reconciliation labels say "Add back" or "Less", which gives the answer away: these titles are neutral.
 * Where the books' note leans on the line next to it, the exercise has its own reason.
 */
const NEUTRAL: [RegExp, string, string?][] = [
  [/entertainment/i, "Entertainment: the half that's only 50% deductible"],
  [/last year's holiday pay/i, "Last year's holiday pay accrual, taken as leave this year"],
  [/holiday pay/i, "Holiday pay accrued at 31 March, not paid within 63 days"],
  [/accounting depreciation/i, "Depreciation in the accounts",
    "Tax doesn't use the accounts' depreciation: it has its own, worked out on each asset's tax value at IRD's rates. So the accounts' figure is added back, and the tax figure is deducted instead (another item in this list)."],
  [/tax depreciation/i, "Depreciation worked out under the tax rules",
    "This replaces the accounts' depreciation. It's a different figure because Investment Boost takes its share off an asset's tax value first, and no tax depreciation is claimed on an asset in the year it's sold."],
  [/investment boost/i, "Investment Boost on new assets"],
  [/accounting gain/i, "Accounting gain on selling the old POS system",
    "The accounts measure the gain against the asset's book value. Tax measures the sale against its tax value instead, which gives the depreciation recovered (another item in this list). So the accounting gain is taken out."],
  [/depreciation recovery/i, "Depreciation recovered on the old POS system"],
];

/** "…replaced by tax depreciation…" → a whole sentence */
const sentence = (s: string) => { const t = s.replace(/^[…]+|[…]+$/g, "").trim(); return /[.!?)]$/.test(t) ? t : `${t}.`; };

function realItems(items: TaxItem[], year: string): AdjItem[] {
  return items.map((it, n) => {
    const [, title, own] = NEUTRAL.find(([re]) => re.test(it.label)) ?? [null, it.label];
    const add = it.amount > 0;
    return { id: `${year}-real-${n}`, title, amount: Math.abs(it.amount), dir: add ? "add" : "deduct",
      why: `${sentence(own ?? it.explain)} Taxable income goes ${add ? "up" : "down"} by ${money(Math.abs(it.amount))}.` };
  });
}

const sumDebits = (txns: Transaction[], code: string) => r2(txns.reduce((s, t) => s + t.lines.filter((l) => l.account === code).reduce((a, l) => a + (l.debit ?? 0), 0), 0));

/** items from the year that need no tax adjustment: the distractors (only those Kōwhai actually has that year) */
function noAdjustment(year: string, b: Record<string, number>, during: Transaction[]): AdjItem[] {
  const list: AdjItem[] = [
    { id: `${year}-salaries`, title: "Shareholder salaries for Aroha and Ben", amount: r2(b["605"] ?? 0), dir: "none",
      why: "Shareholder salaries are deductible like any pay, as long as they're paid or credited (here, to the current accounts) during the year or before the return is due (IR4 guide, Question 40). Profit already has them right." },
    { id: `${year}-bad-debt`, title: "A customer's invoice written off as a bad debt", amount: r2(b["624"] ?? 0), dir: "none",
      why: "A bad debt actually written off is deductible, so profit already has it right. Only a general provision for doubtful debts would be added back." },
    { id: `${year}-interest`, title: "Interest on the bank loan", amount: r2(b["630"] ?? 0), dir: "none",
      why: "Interest on money borrowed for the business is deductible, so profit already has it right." },
    { id: `${year}-tax`, title: "Income tax expense", amount: r2(b["690"] ?? 0), dir: "none",
      why: "You start from profit before tax, so the income tax expense isn't in the starting figure. (Starting from profit after tax, you'd add it back: income tax isn't deductible, s DB 1.)" },
    { id: `${year}-principal`, title: "Bank loan principal repaid", amount: sumDebits(during, "250"), dir: "none",
      why: "Repaying a loan isn't an expense: it reduces the liability, so it's not in profit at all. Only the interest part is an expense." },
    { id: `${year}-dividend`, title: "Dividend paid to Aroha and Ben", amount: sumDebits(during, "310"), dir: "none",
      why: "A dividend shares out profit to the owners. It's not an expense, so it's not in profit, and it isn't deductible either." },
  ];
  return list.filter((i) => i.amount > 0.004);
}

const $0 = (n: number) => money(n, { dp: 0 });

function questions(ret: Ir4): DateQ[] {
  const y = ret.year;
  const rit = ret.boxes["30J"];
  return [
    { id: "file", q: `When must Kōwhai file its ${y} IR4?`, options: [`7 July ${y}`, `31 March ${y + 1}`, `7 April ${y + 1}`, `30 June ${y}`], answer: 1,
      why: `Income tax returns are due by 7 July (Tax Administration Act s 37). But Kōwhai's accountant is a tax agent, and IRD gives agents' clients an extension of time: for a 31 March balance date, to 31 March ${y + 1}.` },
    { id: "terminal", q: `When must the terminal tax in Box 30L be paid?`, options: [`7 February ${y + 1}`, `7 April ${y + 1}`, `31 March ${y + 1}`, `28 August ${y}`], answer: 1,
      why: `Terminal tax is due on 7 February after the year ends, or 7 April if the company has a tax agent with an extension of time. Kōwhai has one, so 7 April ${y + 1}. Paying late adds a late payment penalty, and interest above the safe harbour.` },
    { id: "provisional", q: `Box 30J, the residual income tax, is ${money(rit)}. What does that mean for the ${y + 1} year?`,
      options: [
        `Nothing: provisional tax only starts once RIT is over ${$0(PROVISIONAL_TAX.safeHarbourRit)}`,
        `Kōwhai must pay provisional tax, because RIT is over ${$0(PROVISIONAL_TAX.ritThreshold)}. On the standard option it's ${$0(ret.boxes["33B"])} (RIT + ${Math.round(PROVISIONAL_TAX.standardUplift * 100)}%), in three instalments`,
        `Kōwhai must pay this year's RIT again, all at once on 7 April`,
        "Nothing: companies only pay income tax after the year ends",
      ],
      answer: 1,
      why: `Anyone whose RIT is over ${$0(PROVISIONAL_TAX.ritThreshold)} pays provisional tax the next year (Income Tax Act s RC 3). On the standard option it's last year's RIT plus ${Math.round(PROVISIONAL_TAX.standardUplift * 100)}%, and that's the figure in Box 33B. ${$0(PROVISIONAL_TAX.safeHarbourRit)} is a different line: under it, no interest is charged until terminal tax is due.` },
  ];
}

/* ───────── Year 1: the 2027 return ───────── */

const b1 = balances(Y1_BEFORE);
const startDate = Y1_DURING.find((t) => t.lines.some((l) => l.account === "400" && l.credit))!.date;
const Y1_RETURN = ir4Return({
  year: 2027,
  taxableIncome: Y1_TAX.taxableIncome,
  interest: -(b1["450"] ?? 0),
  rwt: Y1_TAX.rwt,
  provisionalPaid: Y1_TAX.provisional,
  startDate,
  shareholders: SHAREHOLDERS.map((s) => ({ name: s.name, salary: s.salary, currentAccount: -(b1[s.currentAccount] ?? 0) })),
  ica: ICA,
});

/* ───────── Year 2: the 2028 return ───────── */

const b2 = balances(Y2_BEFORE);
const b2Open = balances([OPENING_ENTRY, ...Y2_BEFORE]);
const Y2_RETURN = ir4Return({
  year: 2028,
  taxableIncome: Y2_TAX.taxableIncome,
  interest: -(b2["450"] ?? 0),
  rwt: Y2_TAX.rwt,
  provisionalPaid: Y2_TAX.provisional,
  shareholders: YEAR2_FACTS.salaries.map((s) => ({ name: s.name, salary: s.salary, currentAccount: -(b2Open[s.currentAccount] ?? 0) })),
  ica: ICA,
});

const byTitle = (a: AdjItem, b: AdjItem) => a.title.localeCompare(b.title);

export const IR4_EXERCISES: Ir4Exercise[] = [
  { key: "y1", year: "Year 1", title: "The 2027 return", level: "simpler",
    blurb: `Kōwhai's first IR4: interest with RWT taken off, one voluntary provisional tax payment, five tax adjustments, and Box 32 (it started trading on ${nzDate(startDate)}).`,
    profitBeforeTax: Y1_PBT, items: [...realItems(Y1_TAX.items, "y1"), ...noAdjustment("y1", b1, Y1_DURING)].sort(byTitle), ret: Y1_RETURN, questions: questions(Y1_RETURN) },
  { key: "y2", year: "Year 2", title: "The 2028 return", level: "harder",
    blurb: "Last year's holiday pay reverses, the old POS system is sold, three provisional tax instalments, and a dividend in the imputation return.",
    profitBeforeTax: Y2_PBT, items: [...realItems(Y2_TAX.items, "y2"), ...noAdjustment("y2", b2, Y2_DURING)].sort(byTitle), ret: Y2_RETURN, questions: questions(Y2_RETURN) },
];
