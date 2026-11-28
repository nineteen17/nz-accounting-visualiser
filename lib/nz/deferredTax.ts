/**
 * Deferred tax under the balance sheet approach (NZ IAS 12; US ASC 740 works the same way).
 * Kōwhai doesn't record it (it uses the taxes payable method, like most small NZ companies):
 * these functions work out what it WOULD be, for the explainer at /explore/deferred-tax.
 */
import { r2 } from "@/lib/money";

export type TempDiff = {
  key: string;
  label: string;
  /** is the item an asset or a liability on the balance sheet */
  side: "asset" | "liability";
  /** its figure in the accounts (a positive number either way) */
  carrying: number;
  /** what the tax rules say it's worth: the deductions still to come for an asset; nil for an accrual not yet deductible */
  taxBase: number;
  explain: string;
};

/**
 * The temporary difference, signed: + is TAXABLE (more tax later: a deferred tax liability),
 * − is DEDUCTIBLE (less tax later: a deferred tax asset).
 * An asset worth more in the accounts than for tax has been deducted faster for tax: taxable later.
 * A liability the accounts have already expensed but tax hasn't deducted: deductible later.
 */
export const signedDiff = (d: TempDiff) => r2(d.side === "asset" ? d.carrying - d.taxBase : -(d.carrying - d.taxBase));

export function deferredTax(diffs: TempDiff[], rate: number) {
  const rows = diffs.map((d) => {
    const diff = signedDiff(d);
    return { ...d, diff, deferred: r2(diff * rate), kind: diff >= 0 ? ("liability" as const) : ("asset" as const) };
  });
  const netDiff = r2(rows.reduce((s, x) => s + x.diff, 0));
  return {
    rows,
    netDiff,
    /** + a net deferred tax liability, − a net deferred tax asset */
    net: r2(netDiff * rate),
    liabilities: r2(rows.filter((x) => x.diff > 0).reduce((s, x) => s + x.deferred, 0)),
    assets: r2(-rows.filter((x) => x.diff < 0).reduce((s, x) => s + x.deferred, 0)),
  };
}

/**
 * The year's tax expense both ways. Under the deferred tax method it's current tax plus the change in deferred tax,
 * which comes out at the tax rate × (profit + permanent differences), give or take IRD's whole-dollar rounding.
 */
export function taxExpense(input: { profitBeforeTax: number; currentTax: number; openingDeferred: number; closingDeferred: number; permanent: number; rate: number }) {
  const movement = r2(input.closingDeferred - input.openingDeferred);
  const deferredMethod = r2(input.currentTax + movement);
  return {
    movement,
    taxesPayable: input.currentTax,
    deferredMethod,
    effectivePayable: input.currentTax / input.profitBeforeTax,
    effectiveDeferred: deferredMethod / input.profitBeforeTax,
    /** what the deferred tax method should land on */
    expected: r2((input.profitBeforeTax + input.permanent) * input.rate),
  };
}
