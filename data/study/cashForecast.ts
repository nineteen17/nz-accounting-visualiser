/**
 * Cash flow forecast: profit or cash, the bank balance at month end, when GST and tax fall due,
 * paydays, and why the year's cash differed from the forecast. Figures come from Kōwhai's year 2
 * forecast and books (data/books/cashForecast.ts).
 */
import { LINES, MONTH_ROWS, PAY_DAYS, SUMMARY, isMaterial } from "@/data/books/cashForecast";
import { LOAN_SCHEDULE } from "@/data/books/april";
import { $, $$, mc, num, nzDate, pick, r2, type Drill, type Question, type Rng } from "./core";

const BOTH = "Both: a cost in the profit, and cash out of the bank";
const PROFIT = "A cost in the profit, but no cash leaves the bank this year";
const CASH = "Cash out of the bank, but not a cost in the profit";

const LOAN_ROW = LOAN_SCHEDULE.rows[12];

/** things that hit profit, cash, or both: the heart of why profit isn't cash */
const ITEMS: { item: string; answer: string; why: string }[] = [
  { item: `depreciation on the espresso machine and fit-out (${$$(SUMMARY.depreciation)} in year 2)`, answer: PROFIT, why: "The cash went when the assets were bought. Depreciation spreads that cost over their life: an expense with no payment." },
  { item: `the principal part of a loan repayment (${$(LOAN_ROW.principal)} of April 2027's ${$(LOAN_ROW.payment)})`, answer: CASH, why: "Repaying principal reduces what's owed (a liability). It isn't a cost of running the café, so it's not in the profit." },
  { item: `the interest part of a loan repayment (${$(LOAN_ROW.interest)} in April 2027)`, answer: BOTH, why: "Interest is the cost of borrowing: an expense, and paid in cash with each repayment." },
  { item: "GST paid to IRD for a two-month period", answer: CASH, why: "GST was collected from customers on IRD's behalf. Passing it on is cash out, but it was never the café's income or cost." },
  { item: `the ${$$(SUMMARY.dividendPaid)} dividend`, answer: CASH, why: "A dividend shares out profit already made. It's cash out and comes off retained earnings, not an expense." },
  { item: `the shareholder salaries (${$$(SUMMARY.shareholderSalaries)}), credited to Aroha and Ben's current accounts`, answer: PROFIT, why: "They're an expense, but crediting the current account means the company owes it to them: no cash moves until they draw it." },
  { item: "Aroha and Ben's monthly drawings", answer: CASH, why: "Drawings take money the company owes them out of their current accounts. Cash out, not an expense." },
  { item: "holiday pay set aside at year end for leave not yet taken", answer: PROFIT, why: "It's this year's cost (the leave was earned this year), but it's only paid when the leave is taken: an accrual." },
  { item: "buying a new POS system", answer: CASH, why: "A new asset: cash out now, but not an expense. Its cost reaches profit later, through depreciation." },
  { item: "the fortnightly wages", answer: BOTH, why: "Wages are an expense and are paid in cash (to staff, and the PAYE to IRD)." },
  { item: "provisional tax paid to IRD", answer: CASH, why: "It's tax paid in advance: an asset until it's set against the year's tax bill. The tax expense is worked out at year end from the profit." },
];

const months = MONTH_ROWS;

function cashQuestion(rng: Rng): Question {
  const r = rng();

  // profit, cash or both?
  if (r < 0.35) {
    const it = pick(rng, ITEMS);
    return mc(rng, it.answer, [BOTH, PROFIT, CASH].filter((x) => x !== it.answer),
      `In Kōwhai's year 2, what is **${it.item}**?`,
      it.why);
  }

  // bank at the end of the month
  if (r < 0.55) {
    const i = Math.floor(rng() * months.length);
    const m = months[i];
    const start = i === 0 ? SUMMARY.opening : months[i - 1].actualBank;
    const vals = Object.values(m.actual);
    const cashIn = r2(vals.filter((x) => x > 0).reduce((s, x) => s + x, 0));
    const cashOut = r2(-vals.filter((x) => x < 0).reduce((s, x) => s + x, 0));
    return num(`Kōwhai's bank and till held ${$(start)} at the start of ${m.label} ${m.year}. During the month ${$(cashIn)} came in and ${$(cashOut)} went out. What was the balance at the end of ${m.label}?`,
      m.actualBank,
      `Opening + money in − money out: ${$(start)} + ${$(cashIn)} − ${$(cashOut)} = **${$(m.actualBank)}**. Each month's closing balance is the next month's opening: that's how a forecast runs on.`,
      { tolerance: 1, hint: "To the nearest dollar" });
  }

  // when is GST due?
  if (r < 0.7) {
    const periods = SUMMARY.gstDue;
    const p = pick(rng, periods);
    return mc(rng, nzDate(p.due), periods.filter((x) => x.due !== p.due).map((x) => nzDate(x.due)).sort(() => rng() - 0.5).slice(0, 3),
      `Kōwhai files GST every two months. When is the GST for **${p.label}** due, so the forecast puts the payment in that month?`,
      `GST is due on the 28th of the month after the period ends, with two exceptions: the October–November period is due on 15 January, and February–March on 7 May. So ${p.label} is due on **${nzDate(p.due)}**.`);
  }

  // paydays in a month
  if (r < 0.8) {
    const m = pick(rng, months);
    const n = PAY_DAYS.filter((d) => d.startsWith(m.month)).length;
    return num(`Kōwhai pays its staff every second Wednesday, starting ${nzDate(PAY_DAYS[0])}. How many paydays fall in ${m.label} ${m.year}?`,
      n,
      `The paydays in ${m.label}: ${PAY_DAYS.filter((d) => d.startsWith(m.month)).map((d) => nzDate(d)).join(", ")}: **${n}**. Most months have two; a fortnightly payroll gives two months a year a third payday, and the forecast needs the extra wages in those months.`,
      { unit: "" });
  }

  // why did the year differ?
  const explained = LINES.filter((l) => isMaterial(l.diff) && l.why);
  const l = pick(rng, explained);
  return mc(rng, l.why!, explained.filter((x) => x.key !== l.key).map((x) => x.why!).sort(() => rng() - 0.5).slice(0, 3),
    `Over year 2, **${l.label.toLowerCase()}** came out ${$$(Math.abs(l.diff))} ${l.diff > 0 ? "better" : "worse"} for the bank than forecast. Which explains it?`,
    l.why!);
}

export const CASH_FORECAST_DRILLS: Drill[] = [
  { key: "cash-forecast", group: "calculate", part: 4, title: "Cash flow forecast", icon: "🏦", blurb: "Profit or cash, the bank at month end, when GST falls due, paydays, and why the cash differed.", learn: { href: "/explore/cash-forecast", label: "Cash flow forecast" }, make: cashQuestion },
];
