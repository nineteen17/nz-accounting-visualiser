/**
 * GST on goods and services used partly for taxable supplies: the claim on purchase (s 20(3C), (3CB)–(3CD)),
 * the yearly adjustments (ss 21–21G), the sale adjustment (s 21F), and which rule applies at all.
 * For the tool at /explore/gst-mixed-use. Plan: docs/GST-MIXED-USE.md.
 */
import { r2 } from "@/lib/money";
import { GST, GST_APPORTIONMENT as A } from "@/lib/nz/rates";

/** items of $10,000 or less (excl GST): all or nothing, on whether the principal (main) purpose is taxable */
export const isSmallItem = (costExcl: number) => costExcl <= A.smallItem;

/** the GST claimed when the item is bought */
export function claimOnPurchase(costExcl: number, intendedUse: number) {
  const fullGst = r2(costExcl * GST.rate);
  if (isSmallItem(costExcl)) return { fullGst, claim: intendedUse > 0.5 ? fullGst : 0, rule: "principal-purpose" as const };
  return { fullGst, claim: r2(fullGst * intendedUse), rule: "apportion" as const };
}

/** how many adjustment periods (s 21G(4), (8)): 0 for a small item */
export function adjustmentPeriods(costExcl: number, land = false) {
  if (isSmallItem(costExcl)) return 0;
  if (land) return 10;
  return A.periods.find((p) => costExcl <= p.upTo)!.periods;
}

export type PeriodIn = { months: number; use: number };
export type PeriodOut = PeriodIn & {
  n: number;
  /** actual use since purchase, weighted by months (s 21G(1)(a)) */
  actual: number;
  /** what it's compared with: the intended use, or the actual use at the last adjustment made (s 21C) */
  compareWith: number;
  difference: number;
  /** full GST × difference (s 21D): + an extra claim, − GST paid back */
  amount: number;
  adjusted: boolean;
  reason: string;
};

/** the yearly adjustments, for up to the number of periods the cost allows */
export function adjustments(costExcl: number, intendedUse: number, periods: PeriodIn[]): PeriodOut[] {
  const fullGst = r2(costExcl * GST.rate);
  const count = adjustmentPeriods(costExcl);
  let compareWith = intendedUse, months = 0, weighted = 0;
  return periods.slice(0, count).map((p, i) => {
    months += p.months;
    weighted += p.use * p.months;
    const actual = weighted / months;
    const difference = actual - compareWith;
    const amount = r2(fullGst * difference);
    const small = Math.abs(difference) < A.minPoints - 1e-9 && Math.abs(amount) <= A.minAdjustment;
    const adjusted = !small && Math.abs(amount) >= 0.005;
    const reason = Math.abs(amount) < 0.005 ? "No difference: no adjustment."
      : small ? `Under ${A.minPoints * 100} percentage points and not over $${A.minAdjustment.toLocaleString("en-NZ")}: no adjustment (s 21(2)(c), (d)).`
      : amount > 0 ? "More business use than claimed: an extra GST claim." : "Less business use than claimed: GST paid back as output tax.";
    const out = { ...p, n: i + 1, actual, compareWith, difference, amount: adjusted ? amount : 0, adjusted, reason };
    if (adjusted) compareWith = actual;
    return out;
  });
}

/**
 * Selling it (s 21F): GST is charged on the whole price, then a final adjustment gives back the part for the use
 * that wasn't claimed. `previousUse` is the use last adjusted to (or the intended use, if never adjusted).
 */
export function saleAdjustment(priceIncl: number, previousUse: number) {
  const gstOnSale = r2(priceIncl * GST.fraction);
  const finalAdjustment = r2(priceIncl * GST.fraction * (1 - previousUse));
  return { gstOnSale, finalAdjustment, net: r2(gstOnSale - finalAdjustment) };
}

/* ───────── which rule applies ───────── */

export type Situation = {
  buyer: "company" | "sole-trader";
  /** what the non-taxable use is */
  otherUse: "staff-private" | "owner-private" | "exempt" | "none";
  /** for exempt supplies: the year's exempt and total supplies */
  exempt?: { exemptSupplies: number; totalSupplies: number };
  costExcl: number;
};
export type Rule = "full" | "fbt" | "de-minimis" | "principal-purpose" | "apportion";

/** exempt supplies under the lesser of $90,000 and 5% of all supplies: no apportioning (s 20(3D)) */
export function underDeMinimis(exemptSupplies: number, totalSupplies: number) {
  return exemptSupplies <= Math.min(A.exemptDeMinimis.amount, A.exemptDeMinimis.share * totalSupplies);
}

export function whichRule(s: Situation): Rule {
  if (s.otherUse === "none") return "full";
  // a company's asset used privately by an employee (shareholder-employees included) is a fringe benefit: s 21I
  if (s.otherUse === "staff-private" && s.buyer === "company") return "fbt";
  if (s.otherUse === "exempt" && s.exempt && underDeMinimis(s.exempt.exemptSupplies, s.exempt.totalSupplies)) return "de-minimis";
  if (isSmallItem(s.costExcl)) return "principal-purpose";
  return "apportion";
}
