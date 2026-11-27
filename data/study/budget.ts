/**
 * Budget vs actual: favourable or unfavourable, the size of a variance, flexing a budget,
 * and why the big variances happened. Every figure comes from Kōwhai's year 2 budget and books
 * (data/books/budget.ts).
 */
import { BUDGET_LINES, SALES, budgetStatement, isMaterial, variance } from "@/data/books/budget";
import { $, mc, num, pick, r2, type Drill, type Question, type Rng } from "./core";

const lines = (flex: boolean) => budgetStatement(flex).lines;
const kind = (income: boolean) => (income ? "income" : "a cost");

function budgetQuestion(rng: Rng): Question {
  const r = rng();

  // favourable or unfavourable?
  if (r < 0.3) {
    const flex = rng() < 0.3;
    const l = pick(rng, lines(flex).filter((x) => !variance(x, x.budget).nil));
    const v = variance(l, l.budget);
    const fav = v.favourable;
    return mc(rng, fav ? "Favourable" : "Unfavourable", [fav ? "Unfavourable" : "Favourable"],
      `Kōwhai's ${flex ? "flexed " : ""}budget for **${l.label}** in year 2 was ${$(l.budget)}. The actual was ${$(l.actual)}. Is the variance favourable or unfavourable?`,
      `${l.label} is ${kind(l.income)}. ${l.income ? `More income than budgeted helps profit` : `Less cost than budgeted helps profit`}, so ${$(l.actual)} against ${$(l.budget)} is **${fav ? "favourable" : "unfavourable"}** (${fav ? "+" : "−"}${$(Math.abs(v.amount))}).${l.why && isMaterial(v.amount, l.budget) ? ` Why: ${l.why}` : ""}`);
  }

  // how big is it?
  if (r < 0.5) {
    const l = pick(rng, lines(false).filter((x) => Math.abs(variance(x, x.budget).amount) >= 1));
    const v = variance(l, l.budget);
    return num(`Year 2's budget for **${l.label}** was ${$(l.budget)}; the actual was ${$(l.actual)}. What's the variance, in dollars? (Type the size; ignore whether it's good or bad.)`,
      Math.abs(v.amount),
      `Actual − budget: ${$(l.actual)} − ${$(l.budget)} = ${$(r2(l.actual - l.budget))}, so the variance is **${$(Math.abs(v.amount))}**. For ${kind(l.income)}, that's ${v.favourable ? "favourable" : "unfavourable"}.`);
  }

  // flex it
  if (r < 0.7) {
    const l = pick(rng, BUDGET_LINES.filter((x) => x.variable));
    const flexed = r2(l.budget * (SALES.actual / SALES.budget));
    return num(`Kōwhai budgeted **${l.label.toLowerCase()}** at ${$(l.budget)}, for café sales of ${$(SALES.budget)}. Actual café sales were ${$(SALES.actual)}. What's the flexible budget for ${l.label.toLowerCase()}?`,
      flexed,
      `${l.label} moves with sales, so scale it: ${$(l.budget)} × ${$(SALES.actual)} ÷ ${$(SALES.budget)} = **${$(flexed)}**. Compare the actual (${$(l.actual)}) with that, not with the original budget: the extra sales were always going to cost more.`,
      { tolerance: 1, hint: "To the nearest dollar" });
  }

  // fixed or variable?
  if (r < 0.85) {
    const l = pick(rng, BUDGET_LINES.filter((x) => !x.income && x.budget > 0));
    const yes = "Yes: it moves with sales", no = "No: it stays the same whatever is sold";
    return mc(rng, l.variable ? yes : no, [l.variable ? no : yes],
      `When Kōwhai flexes its budget to the actual sales, does the budget for **${l.label}** change?`,
      l.variable
        ? `${l.label} rises and falls with sales, so a flexible budget resizes it. ${l.basis}`
        : `${l.label} doesn't depend on how many coffees are sold, so it's the same in a flexible budget. ${l.basis}`);
  }

  // why did it happen?
  const explained = lines(false).filter((x) => x.why && isMaterial(variance(x, x.budget).amount, x.budget));
  const l = pick(rng, explained);
  const v = variance(l, l.budget);
  return mc(rng, l.why!, explained.filter((x) => x.code !== l.code).map((x) => x.why!).sort(() => rng() - 0.5).slice(0, 3),
    `In year 2, **${l.label}** came in ${$(Math.abs(v.amount))} ${v.favourable ? "better" : "worse"} than budget. Which explains it?`,
    `${l.why} Budget: ${l.basis}`);
}

export const BUDGET_DRILLS: Drill[] = [
  { key: "budget", group: "calculate", part: 4, title: "Budget vs actual", icon: "🎯", blurb: "Favourable or unfavourable, the size of a variance, flexing the budget, and why it happened.", learn: { href: "/explore/budget", label: "Budget vs actual" }, make: budgetQuestion },
];
