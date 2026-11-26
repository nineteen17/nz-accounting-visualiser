import { r2 } from "@/lib/money";
import { DEPRECIATION } from "./rates";

export interface FixedAsset {
  id: string;
  name: string;
  costAccount: string;
  accDepAccount: string;
  cost: number;
  acquired: string; // ISO date
  /** diminishing value rate used in this example (check IRD rate finder for real rates) */
  dvRate: number;
  slRate: number;
  investmentBoost: boolean;
}

/** Months owned in the income year (IRD counts the month of purchase as a full month) */
export function monthsOwned(acquiredIso: string, yearEndIso = "2027-03-31") {
  const [ay, am] = acquiredIso.split("-").map(Number);
  const [ey, em] = yearEndIso.split("-").map(Number);
  return Math.min(12, (ey - ay) * 12 + (em - am) + 1);
}

/** Diminishing value: rate × opening book value × months/12 */
export function dvDepreciation(bookValue: number, rate: number, months = 12) {
  return r2(bookValue * rate * (months / 12));
}

/** Straight line: rate × cost × months/12 */
export function slDepreciation(cost: number, rate: number, months = 12) {
  return r2(cost * rate * (months / 12));
}

/** A multi-year schedule (for the depreciation deep-dive page) */
export function schedule(cost: number, rate: number, method: "DV" | "SL", years = 6, firstYearMonths = 12) {
  const rows: { year: number; opening: number; dep: number; closing: number }[] = [];
  let bv = cost;
  for (let y = 1; y <= years; y++) {
    const months = y === 1 ? firstYearMonths : 12;
    let dep = method === "DV" ? dvDepreciation(bv, rate, months) : slDepreciation(cost, rate, months);
    dep = Math.min(dep, bv);
    rows.push({ year: y, opening: r2(bv), dep, closing: r2(bv - dep) });
    bv = r2(bv - dep);
  }
  return rows;
}

/** Accounting depreciation vs tax depreciation with Investment Boost for one asset, year 1 */
export function assetYearOne(a: FixedAsset) {
  const months = monthsOwned(a.acquired);
  const accounting = dvDepreciation(a.cost, a.dvRate, months);
  const boost = a.investmentBoost ? r2(a.cost * DEPRECIATION.investmentBoostRate) : 0;
  const taxBase = r2(a.cost - boost);
  const taxDep = dvDepreciation(taxBase, a.dvRate, months);
  return { months, accounting, boost, taxBase, taxDep, closingBookValue: r2(a.cost - accounting), closingTaxValue: r2(taxBase - taxDep) };
}

/**
 * One asset for any year, carrying values forward.
 * - accounting: diminishing value on opening book value, for the months held (to the month of sale if sold)
 * - tax: no depreciation in the year of disposal (IR260); Investment Boost only in the year bought
 */
export function assetYear(a: FixedAsset, opts: { openingBook: number; openingTax: number; firstYear: boolean; yearEnd: string; soldMonths?: number }) {
  const months = opts.soldMonths ?? monthsOwned(a.acquired, opts.yearEnd);
  const accounting = dvDepreciation(opts.openingBook, a.dvRate, months);
  const boost = opts.firstYear && a.investmentBoost ? r2(a.cost * DEPRECIATION.investmentBoostRate) : 0;
  const taxBase = r2(opts.openingTax - boost);
  const taxDep = opts.soldMonths !== undefined ? 0 : dvDepreciation(taxBase, a.dvRate, months);
  return { months, accounting, boost, taxBase, taxDep, closingBookValue: r2(opts.openingBook - accounting), closingTaxValue: r2(taxBase - taxDep) };
}

/** Selling an asset: compare sale price to tax book value */
export function disposal(cost: number, taxBookValue: number, salePrice: number) {
  if (salePrice > taxBookValue) {
    const recovered = Math.min(salePrice, cost) - taxBookValue;
    const capitalGain = Math.max(0, salePrice - cost);
    return { kind: "recovery" as const, recovered: r2(recovered), capitalGain: r2(capitalGain), loss: 0 };
  }
  return { kind: "loss" as const, recovered: 0, capitalGain: 0, loss: r2(taxBookValue - salePrice) };
}
