/**
 * "Which structure?": Kōwhai's year 2 profit run through each business structure.
 * The profit and the company's choices come from the year 2 books (via data/books/payYourself.ts); the maths is lib/nz/structures.ts.
 * Plan: docs/STRUCTURES.md.
 */
import { r2 } from "@/lib/money";
import { company, passThrough, type CompanyChoice, type Owner, type StructureResult } from "@/lib/nz/structures";
import { accLevy, accRate, companyTax } from "@/lib/nz/payYourself";
import { ACTUAL, BASE, RATES } from "./payYourself";
import { COMPANY_TAX_RATE } from "@/lib/nz/rates";
import { SHAREHOLDERS } from "../business";

export { RATES };

/** year 2's taxable income before anything is paid to the owners */
export const PROFIT = BASE.taxableBeforeSalaries;
export const RANGE = { min: -60_000, max: 260_000, step: 1_000 };

export const OWNERS: Owner[] = SHAREHOLDERS.map((s) => ({ id: s.id, name: s.name, pct: s.pct, otherIncome: s.otherIncome }));
const aroha = OWNERS.find((o) => o.id === "aroha")!;
/** a sole trader has one owner: Kōwhai as if Aroha owned it alone */
export const SOLE: Owner[] = [{ ...aroha, pct: 1 }];

const actualSalaries = ACTUAL.aroha + ACTUAL.ben;

/**
 * What the company pays its owners at a given profit: the café's real choice ($65,000 and $35,000 salaries and a $20,000
 * dividend), cut back in proportion when the profit can't cover the salaries, and the dividend only out of profit left after tax.
 */
export function companyChoice(profit: number): CompanyChoice {
  // salaries S must leave room for their ACC (a·S) and 28% tax on the rest: S·(0.72 + a) ≤ 0.72·profit
  const scale = Math.min(1, (Math.max(0, profit) * (1 - COMPANY_TAX_RATE)) / (actualSalaries * (1 - COMPANY_TAX_RATE + accRate(RATES))));
  const salaries = { aroha: Math.floor(ACTUAL.aroha * scale), ben: Math.floor(ACTUAL.ben * scale) };
  const s = salaries.aroha + salaries.ben;
  const left = profit - s - companyTax(profit - s) - accLevy(salaries.aroha, RATES) - accLevy(salaries.ben, RATES);
  return { salaries, dividend: Math.max(0, Math.min(ACTUAL.dividend, Math.floor(left))) };
}

export type Key = "partnership" | "company" | "ltc" | "sole";
export const STRUCTURES: { key: Key; label: string; short: string }[] = [
  { key: "partnership", label: "Partnership", short: "Partnership" },
  { key: "company", label: "Company (what Kōwhai is)", short: "Company" },
  { key: "ltc", label: "Look-through company", short: "LTC" },
  { key: "sole", label: "Sole trader (Aroha alone)", short: "Sole trader" },
];

export function compare(profit: number): Record<Key, StructureResult> {
  const p = r2(profit);
  return {
    partnership: passThrough(p, OWNERS, RATES),
    company: company(p, OWNERS, companyChoice(p), BASE.ica, RATES),
    // an LTC is taxed like a partnership (s HB 1); it differs in liability and paperwork, not in the tax sums
    ltc: passThrough(p, OWNERS, RATES),
    sole: passThrough(p, SOLE, RATES),
  };
}

export const PRESETS = [
  { label: "Kōwhai's year 2", profit: PROFIT },
  { label: "A quieter year", profit: 80_000 },
  { label: "A loss year", profit: -40_000 },
];
