/**
 * Which structure? The same business profit run through a partnership, a company, a look-through company (LTC)
 * and a sole trader. Pure calculations; Kōwhai's figures are in data/books/structures.ts. Plan: docs/STRUCTURES.md.
 *
 * - Partnership, LTC and sole trader are transparent for income tax (Income Tax Act ss HG 2, HB 1): each owner is taxed on
 *   their share of the profit at their own rates, drawn or not, and can set a share of a loss against their other income.
 * - Their active owners are self-employed for ACC: levies on their share of the profit.
 * - A company pays 28% itself; its owners are taxed on salaries and dividends (lib/nz/payYourself.ts), and ACC is charged on
 *   salaries only. A company's loss stays in the company, carried forward.
 *
 * Simplifications: owners' levies aren't deducted in working out tax, and a pass-through owner is paid by profit share only
 * (no working-owner salary, which wouldn't change the total tax).
 */
import { r2 } from "@/lib/money";
import { accLevy, companyTax, dividendShare, MAX_IC_RATIO, ownerYear, personalTax } from "./payYourself";
import { COMPANY_TAX_RATE, type PayrollRates } from "./rates";

export type Owner = { id: string; name: string; pct: number; otherIncome: number };

/**
 * The extra tax an owner pays when `amount` (negative for a share of a loss) is added to their other income.
 * Negative means a refund of tax already paid on the other income (e.g. PAYE on a day job).
 * A loss bigger than the other income is carried forward.
 */
export function extraTax(otherIncome: number, amount: number, rates: PayrollRates) {
  const after = otherIncome + amount;
  return {
    tax: r2(personalTax(Math.max(0, after), rates) - personalTax(otherIncome, rates)),
    lossCarried: after < 0 ? r2(-after) : 0,
  };
}

export type StructureResult = {
  owners: { id: string; name: string; pct: number; share: number; salary: number; dividend: number; tax: number; acc: number; keeps: number; lossCarried: number }[];
  companyTax: number;
  /** owners' own income tax (after imputation credits) */
  ownersTax: number;
  acc: number;
  /** income tax paid now, by the company and the owners */
  taxNow: number;
  /** profit left in the business after tax (a company only: in the others, every dollar is already the owners') */
  kept: number;
  /** estimated extra tax when the kept profit is paid out later as a fully imputed dividend */
  taxLater: number;
  ownersKeep: number;
  /** a loss carried forward: in the company, or by owners whose other income couldn't absorb it */
  lossCarried: number;
  /** the tax that loss saves when it's used against future profit, at this year's rates (28% for a company) */
  lossValue: number;
};

/** partnership, LTC or sole trader: every owner taxed on their share now */
export function passThrough(profit: number, owners: Owner[], rates: PayrollRates): StructureResult {
  const rows = owners.map((o) => {
    const share = r2(profit * o.pct);
    const { tax, lossCarried } = extraTax(o.otherIncome, share, rates);
    const acc = accLevy(share, rates);
    return { id: o.id, name: o.name, pct: o.pct, share, salary: 0, dividend: 0, tax, acc, keeps: r2(share - tax - acc), lossCarried };
  });
  const sum = (k: "tax" | "acc" | "keeps" | "lossCarried") => r2(rows.reduce((s, r) => s + r[k], 0));
  // a carried-forward loss saves the tax on the same amount of future income (at this year's rates, on top of the same other income)
  const lossValue = r2(rows.reduce((s, r) => {
    if (!r.lossCarried) return s;
    const o = owners.find((x) => x.id === r.id)!;
    return s + extraTax(o.otherIncome, r.lossCarried, rates).tax;
  }, 0));
  return { owners: rows, companyTax: 0, ownersTax: sum("tax"), acc: sum("acc"), taxNow: sum("tax"), kept: 0, taxLater: 0, ownersKeep: sum("keeps"), lossCarried: sum("lossCarried"), lossValue };
}

export type CompanyChoice = { salaries: Record<string, number>; dividend: number };

/** a company: 28% on what's left after salaries; the owners taxed on salaries and dividends; ACC on salaries only */
export function company(profit: number, owners: Owner[], choice: CompanyChoice, ica: number, rates: PayrollRates): StructureResult {
  const salaries = r2(owners.reduce((s, o) => s + (choice.salaries[o.id] ?? 0), 0));
  const taxable = r2(profit - salaries);
  const tax = companyTax(taxable);
  const credits = r2(Math.min(choice.dividend * MAX_IC_RATIO, ica));
  const rows = owners.map((o) => {
    const salary = choice.salaries[o.id] ?? 0;
    const y = ownerYear({ salary, dividend: dividendShare(choice.dividend * o.pct, credits * o.pct), otherIncome: o.otherIncome, rates });
    return { row: { id: o.id, name: o.name, pct: o.pct, share: 0, salary, dividend: r2(choice.dividend * o.pct), tax: y.personalTax, acc: accLevy(salary, rates), keeps: y.keeps, lossCarried: 0 }, gross: y.dividend.gross };
  });
  const acc = r2(rows.reduce((s, r) => s + r.row.acc, 0));
  const ownersTax = r2(rows.reduce((s, r) => s + r.row.tax, 0));
  // ACC on shareholder salaries is invoiced to the company
  const kept = r2(profit - salaries - tax - choice.dividend - acc);
  // paid out later as a fully imputed dividend, on top of this year's income: the top-up from 28% to each owner's rate
  const taxLater = kept > 0
    ? r2(rows.reduce((s, { row: r, gross }) => {
        const o = owners.find((x) => x.id === r.id)!;
        const cash = kept * r.pct;
        const later = ownerYear({ salary: r.salary, dividend: dividendShare(cash, cash * MAX_IC_RATIO), otherIncome: o.otherIncome + gross, rates });
        const without = ownerYear({ salary: r.salary, dividend: dividendShare(0, 0), otherIncome: o.otherIncome + gross, rates });
        return s + later.personalTax - without.personalTax;
      }, 0))
    : 0;
  const lossCarried = taxable < 0 ? r2(-taxable) : 0;
  return {
    owners: rows.map((r) => r.row),
    companyTax: tax,
    ownersTax,
    acc,
    taxNow: r2(tax + ownersTax),
    kept,
    taxLater,
    ownersKeep: r2(rows.reduce((s, r) => s + r.row.keeps, 0)),
    lossCarried,
    lossValue: r2(lossCarried * COMPANY_TAX_RATE),
  };
}
