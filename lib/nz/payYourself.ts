/**
 * Salary or dividend? The tax on each way profit can reach a company's owners.
 * Pure calculations; Kōwhai's figures are in data/books/payYourself.ts.
 *
 * - Company tax: 28% of taxable income, rounded down to the dollar (as in lib/nz/incomeTax.ts).
 * - Imputation: a dividend may carry credits up to 28/72 of the cash (Income Tax Act s OA 18),
 *   limited by the imputation credit account. Dividend RWT tops the credits up to 33% (schedule 1, part D).
 * - The owner: tax on all their income, less the tax they'd pay anyway on their other income;
 *   credits can't take the tax below zero (unused imputation credits become a loss to carry forward, s LE 2),
 *   but RWT is refundable.
 */
import { r2 } from "@/lib/money";
import { ietcFor, progressiveTax } from "./payroll";
import { ACC_CAFE_LEVIES, COMPANY_TAX_RATE, RWT, type PayrollRates } from "./rates";

/** most credits a dividend can carry, per dollar of cash: 28/72 */
export const MAX_IC_RATIO = COMPANY_TAX_RATE / (1 - COMPANY_TAX_RATE);

export const companyTax = (taxable: number) => r2(Math.max(0, Math.floor(taxable)) * COMPANY_TAX_RATE);

/** the largest dividend the imputation credit account can fully impute */
export const maxFullyImputed = (icaBalance: number) => Math.floor(r2(Math.max(0, icaBalance) / MAX_IC_RATIO));

/** one shareholder's dividend: cash, credits attached, gross, RWT deducted, cash actually paid */
export function dividendShare(cash: number, credits: number) {
  const ic = r2(Math.min(credits, cash * MAX_IC_RATIO));
  const gross = r2(cash + ic);
  const rwt = r2(Math.max(0, gross * RWT.dividendRate - ic));
  return { cash: r2(cash), ic, gross, rwt, paid: r2(cash - rwt) };
}

/** income tax on a year's income, after the IETC */
export function personalTax(income: number, rates: PayrollRates) {
  const whole = Math.max(0, Math.floor(income));
  return r2(Math.max(0, progressiveTax(whole, rates.brackets).total - ietcFor(whole, rates.ietc)));
}

export type OwnerResult = ReturnType<typeof ownerYear>;

/**
 * What one owner's IR3 looks like for the money from the company.
 * `otherIncome` is taxed already (e.g. PAYE on a day job): only the extra tax caused by the company's payments counts here.
 */
export function ownerYear(input: { salary: number; dividend: ReturnType<typeof dividendShare>; otherIncome: number; rates: PayrollRates }) {
  const { salary, dividend, otherIncome, rates } = input;
  const income = r2(otherIncome + salary + dividend.gross);
  const taxOnAll = personalTax(income, rates);
  const taxOnOther = personalTax(otherIncome, rates);
  /** tax on the salary and gross dividend, at this owner's rates */
  const tax = r2(taxOnAll - taxOnOther);
  const icUsed = r2(Math.min(dividend.ic, tax));
  const icUnused = r2(dividend.ic - icUsed);
  /** residual income tax: what's left after the credits; positive = to pay, negative = refund */
  const toPay = r2(tax - icUsed - dividend.rwt);
  const top = [...rates.brackets].find((b) => income <= b.upTo) ?? rates.brackets[rates.brackets.length - 1];
  return {
    salary,
    dividend,
    otherIncome,
    income,
    topRate: top.rate,
    tax,
    icUsed,
    icUnused,
    toPay,
    /** pays personal provisional tax next year if residual income tax is over the threshold (s RC 3) */
    provisional: toPay > 5_000,
    /** extra tax this owner bears personally, on top of what the company already paid through the credits */
    personalTax: r2(tax - icUsed),
    /** cash that ends up with the owner: salary, plus the dividend paid, less what's owed to IRD (or plus a refund) */
    keeps: r2(salary + dividend.paid - toPay),
  };
}

/** every ACC levy rate on a café owner's liable earnings: earners' levy, work levy and working safer levy */
export const accRate = (rates: PayrollRates) => {
  // the café levies for the same levy year as the payroll rates ("2027–28" → the 2027/28 levies)
  const cafe = rates.year.slice(0, 4) === ACC_CAFE_LEVIES.next.levyYear.slice(0, 4) ? ACC_CAFE_LEVIES.next : ACC_CAFE_LEVIES;
  return rates.acc.rate + cafe.work + cafe.workingSafer;
};

/**
 * ACC levies on an owner's liable earnings (a shareholder salary without PAYE, or a self-employed share of profit),
 * capped at the maximum liable earnings. ACC invoices them after the year, from the tax return.
 */
export const accLevy = (earnings: number, rates: PayrollRates) => r2(Math.min(Math.max(0, earnings), rates.acc.maxLiableEarnings) * accRate(rates));
