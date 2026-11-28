/**
 * Company tax losses (Income Tax Act 2007 subparts IA and IB, and the imputation continuity rule in ss OA 8 and OB 41).
 * Used by the "what if" tax losses tool at /explore/tax-losses. Plan: docs/TAX-LOSSES.md.
 */
import { r2 } from "@/lib/money";
import { LOSS_CONTINUITY } from "@/lib/nz/rates";

export type LossYear = {
  label: string;
  /** net income before any loss is used; negative is a net loss (s BC 4) */
  netIncome: number;
  /** loss balance brought forward from the year before */
  broughtForward: number;
  /** subtracted from this year's net income (s IA 4(1)(a)): as much as it covers, no choice */
  used: number;
  taxableIncome: number;
  tax: number;
  /** this year's own net loss, added to the balance (s IA 2(3)) */
  newLoss: number;
  /** carried forward to next year (s IA 3(4)) */
  carriedForward: number;
};

/**
 * Run net incomes through the loss rules, year by year. `forfeitBefore` is the index of the year from which the
 * loss balance brought forward is lost (a continuity breach the business continuity test doesn't rescue).
 */
export function carryLosses(years: { label: string; netIncome: number }[], rate: number, opts: { openingBalance?: number; forfeitBefore?: number } = {}): LossYear[] {
  let balance = opts.openingBalance ?? 0;
  return years.map((y, i) => {
    if (opts.forfeitBefore !== undefined && i === opts.forfeitBefore) balance = 0;
    const broughtForward = r2(balance);
    const used = y.netIncome > 0 ? r2(Math.min(broughtForward, y.netIncome)) : 0;
    const taxableIncome = y.netIncome > 0 ? r2(y.netIncome - used) : 0;
    const newLoss = y.netIncome < 0 ? r2(-y.netIncome) : 0;
    balance = r2(broughtForward - used + newLoss);
    return { label: y.label, netIncome: y.netIncome, broughtForward, used, taxableIncome, tax: r2(taxableIncome * rate), newLoss, carriedForward: balance };
  });
}

/**
 * The continuity a group of shareholders keeps over a period: each person counts at their LOWEST holding during it
 * (s IA 5(6) for losses; s OA 8 works the same way for imputation credits). Holdings are fractions of the voting interests.
 */
export function continuity(before: Record<string, number>, after: Record<string, number>) {
  const people = new Set([...Object.keys(before), ...Object.keys(after)]);
  let total = 0;
  for (const p of people) total += Math.min(before[p] ?? 0, after[p] ?? 0);
  return r2(total * 10_000) / 10_000;
}

export type NewOwnerPlan = "same" | "related" | "major";

/**
 * Does the loss balance survive an ownership change?
 * 49% continuity keeps it (s IA 5). Without that, the business continuity test (ss IB 3, IB 4) keeps it,
 * unless the business stops or makes a major change in the nature of its activities.
 */
export function lossSurvives(kept: number, plan: NewOwnerPlan) {
  if (kept >= LOSS_CONTINUITY.losses) return { survives: true, by: "shareholder" as const };
  if (plan !== "major") return { survives: true, by: "business" as const };
  return { survives: false, by: "none" as const };
}

/** Imputation credits carry forward only with 66% continuity (s OA 8(2)); otherwise they're debited away (s OB 41). */
export const creditsSurvive = (kept: number) => kept >= LOSS_CONTINUITY.imputation;
