/**
 * Salary or dividend? Imputation credits, dividend RWT, company tax after salaries, the solvency test
 * and shareholder-salary limits. Figures come from Kōwhai's year 2 (data/books/payYourself.ts).
 */
import { BASE } from "@/data/books/payYourself";
import { companyTax, dividendShare, MAX_IC_RATIO, maxFullyImputed } from "@/lib/nz/payYourself";
import { RWT } from "@/lib/nz/rates";
import { $, $$, int, mc, num, pick, r2, type Drill, type Question, type Rng } from "./core";

const SALARY = "Salary: it's taxed only at their own rate, below the company's 28%";
const DIVIDEND = "A dividend: the imputation credits make it cheaper";
const SAME = "It makes no difference: imputation tops a dividend up to their own rate anyway";

const OWNERS: { who: string; rate: number }[] = [
  { who: "an owner whose other income is $20,000 (top rate 17.5%)", rate: 0.175 },
  { who: "an owner whose other income is $10,000 (top rate 10.5%)", rate: 0.105 },
  { who: "an owner on $90,000 from another job (top rate 33%)", rate: 0.33 },
  { who: "an owner on $200,000 from another job (top rate 39%)", rate: 0.39 },
];

function payQuestion(rng: Rng): Question {
  const r = rng();

  // imputation credits on a dividend
  if (r < 0.2) {
    const cash = int(rng, 4, 60) * 500;
    const ic = r2(cash * MAX_IC_RATIO);
    return num(`Kōwhai pays a fully imputed cash dividend of ${$$(cash)}. How much in imputation credits can it attach?`,
      ic,
      `At most 28/72 of the cash (Income Tax Act s OA 18): ${$$(cash)} × 28 ÷ 72 = **${$(ic)}**. That's the company tax already paid on the profit behind it: ${$(cash + ic)} gross × 28% = ${$(ic)}.`);
  }

  // dividend RWT
  if (r < 0.35) {
    const cash = int(rng, 4, 60) * 500;
    const d = dividendShare(cash, cash * MAX_IC_RATIO);
    return num(`A shareholder's fully imputed dividend is ${$$(cash)} cash. How much dividend RWT does Kōwhai deduct?`,
      d.rwt,
      `RWT tops the credits up to ${(RWT.dividendRate * 100).toFixed(0)}% of the gross. Credits ${$(d.ic)}; gross ${$(d.gross)}; 33% × ${$(d.gross)} − ${$(d.ic)} = **${$(d.rwt)}**. The shareholder gets ${$(d.paid)} in their bank.`);
  }

  // the most the credits can cover
  if (r < 0.5) {
    const ica = r2(int(rng, 20, 300) * 50 + int(rng, 0, 99) / 100);
    const max = maxFullyImputed(ica);
    return num(`Kōwhai's imputation credit account has ${$(ica)} in it. What's the largest cash dividend it can fully impute (to the dollar)?`,
      max,
      `Each $72 of cash needs $28 of credits, so the cash can be up to credits × 72 ÷ 28: ${$(ica)} × 72 ÷ 28 = **${$$(max)}** (rounded down). A bigger dividend is only partly imputed, and the owners pay more tax on it.`,
      { tolerance: 1, hint: "To the nearest dollar" });
  }

  // company tax after salaries
  if (r < 0.65) {
    const a = int(rng, 30, 110) * 1_000, b = int(rng, 0, 50) * 1_000;
    const taxable = r2(BASE.taxableBeforeSalaries - a - b);
    const tax = companyTax(taxable);
    return num(`In year 2, Kōwhai's taxable income before any shareholder salaries is ${$(BASE.taxableBeforeSalaries)}. If Aroha takes a ${$$(a)} salary and Ben ${$$(b)}, what's the company's income tax?`,
      tax,
      `Shareholder salaries are deductible: ${$(BASE.taxableBeforeSalaries)} − ${$$(a + b)} = ${$(taxable)}. ${taxable > 0 ? `Tax at 28% on the whole dollars: ${$$(Math.floor(taxable))} × 28% = **${$(tax)}**.` : "That's a loss, so there's **no tax** to pay this year: the loss is carried forward."}`);
  }

  // salary or dividend for this owner?
  if (r < 0.82) {
    const o = pick(rng, OWNERS);
    const answer = o.rate < 0.28 ? SALARY : SAME;
    return mc(rng, answer, [SALARY, DIVIDEND, SAME].filter((x) => x !== answer),
      `Kōwhai has profit to pay out to **${o.who}**. Leaving the lower tax for next year aside, which way costs less tax overall?`,
      o.rate < 0.28
        ? `Salary is deductible to the company, so it's taxed once at ${(o.rate * 100).toFixed(1)}%. A dividend has already borne 28% company tax, and imputation credits beyond the owner's own tax aren't refunded, so a dividend would cost more.`
        : `Imputation means profit paid out is taxed once, at the owner's own rate (${(o.rate * 100).toFixed(0)}%), whichever way it goes: the company's 28% comes back as credits and the owner tops it up. It's about rates and timing, not a second layer of tax.`);
  }

  // solvency
  if (r < 0.92) {
    const bank = int(rng, 30, 120) * 1_000, current = int(rng, 20, 100) * 1_000, div = int(rng, 5, 60) * 1_000;
    const ok = bank - div >= current;
    return mc(rng, ok ? "Yes: it can still pay its debts as they fall due" : "No: it couldn't pay its debts as they fall due",
      [ok ? "No: it couldn't pay its debts as they fall due" : "Yes: it can still pay its debts as they fall due", "Yes: a dividend only needs a profit this year"],
      `A company has ${$$(bank)} in the bank and owes ${$$(current)} within the year (assets are well above liabilities). Can the directors sign the solvency certificate for a ${$$(div)} dividend?`,
      `After the dividend the bank holds ${$$(bank - div)} against ${$$(current)} due. The solvency test (Companies Act s 4) needs both: the company can pay its debts as they fall due, **and** assets exceed liabilities. Profit this year isn't the test.`);
  }

  // shareholder salary limits
  return mc(rng, "Ben's: he isn't full-time in the business, so his salary must be reasonable for the work",
    ["Aroha's: a full-time owner can't take a salary", "Neither: owners can pay themselves any salary they like", "Both: shareholder salaries must equal the market rate exactly"],
    "Aroha runs the café full-time; Ben does weekend shifts and the books. Whose salary could IRD question as too high?",
    `Income Tax Act s GB 25 lets IRD treat an excessive payment to a shareholder-employee as a dividend. Owners working substantially full-time are exempt, so it's Ben's. His work would cost about ${$$(BASE.benWorth)} a year to employ someone for: a salary far above that needs justifying.`);
}

export const PAY_YOURSELF_DRILLS: Drill[] = [
  { key: "pay-yourself", group: "nz", part: 4, title: "Salary or dividend?", icon: "💸", blurb: "Imputation credits, dividend RWT, company tax after salaries, who should take salary, and the solvency test.", learn: { href: "/explore/pay-yourself", label: "Pay yourself" }, make: payQuestion },
];
