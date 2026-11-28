/**
 * The tax losses "what if": a year 3 (2028–29) in which roadworks close Kōwhai's street, built from year 2's real books.
 * Kōwhai's actual books stay profitable. Logic: lib/nz/taxLosses.ts. Page: components/explore/TaxLosses.tsx.
 */
import * as Y2 from "@/data/books/year2";
import { SHAREHOLDERS } from "@/data/business";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances } from "@/lib/engine/ledger";
import { r2 } from "@/lib/money";
import { carryLosses, continuity, creditsSurvive, lossSurvives, type NewOwnerPlan } from "@/lib/nz/taxLosses";
import { COMPANY_TAX_RATE } from "@/lib/nz/rates";

const b2 = balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]);
const cafeSales = r2(-b2["400"]);
const allSales = r2(-b2["400"] - (b2["410"] ?? 0));
const costOfSales = r2(ACCOUNTS.filter((a) => a.subtype === "cost-of-sales").reduce((s, a) => s + (b2[a.code] ?? 0), 0));
const entertainment = Y2.TAX.items.find((i) => /entertainment/i.test(i.label))?.amount ?? 0;

/** how far café sales fall while the street is closed */
export const SALES_DROP = 0.6;

export const BASE = {
  /** year 2's café sales (account 400), per month */
  monthlySales: r2(cafeSales / 12),
  /** cost of sales as a share of all sales: it falls with sales; nearly every other cost doesn't */
  costRatio: costOfSales / allSales,
  profitBeforeTax: Y2.PROFIT_BEFORE_TAX,
  /** the one permanent tax adjustment, carried into the scenario years */
  entertainment,
  /** a normal year's net income: year 2's taxable income */
  normalNetIncome: Y2.TAX.taxableIncome,
  /** imputation credits at 31 March 2028, plus year 2's terminal tax paid on 7 April 2029 */
  icaAtBreach: r2(Y2.YEAR2_FACTS.icaClosing + Y2.TAX.terminal),
  icaClosingY2: Y2.YEAR2_FACTS.icaClosing,
  terminalY2: Y2.TAX.terminal,
  terminalDueY2: Y2.YEAR2_FACTS.terminalDue,
};

/** year 3: the street closed for `months` */
export function badYear(months: number) {
  const lostSales = r2(BASE.monthlySales * months * SALES_DROP);
  const savedCost = r2(lostSales * BASE.costRatio);
  const profit = r2(BASE.profitBeforeTax - lostSales + savedCost);
  return { months, lostSales, savedCost, lostGross: r2(lostSales - savedCost), profit, netIncome: r2(profit + BASE.entertainment) };
}

export const OWNERSHIP = Object.fromEntries(SHAREHOLDERS.map((o) => [o.id, o.pct])) as Record<string, number>;

export const SALES = {
  none: { label: "Nobody sells", after: { ...OWNERSHIP } },
  benHalf: { label: "Ben sells half his shares", after: { aroha: OWNERSHIP.aroha, ben: OWNERSHIP.ben / 2, newOwner: OWNERSHIP.ben / 2 } },
  ben: { label: "Ben sells all his shares", after: { aroha: OWNERSHIP.aroha, ben: 0, newOwner: OWNERSHIP.ben } },
  aroha: { label: "Aroha sells all her shares", after: { aroha: 0, ben: OWNERSHIP.ben, newOwner: OWNERSHIP.aroha } },
  both: { label: "Both sell everything", after: { aroha: 0, ben: 0, newOwner: 1 } },
} as const;
export type SaleKey = keyof typeof SALES;

export const PLANS: Record<NewOwnerPlan, { label: string; why: string }> = {
  same: { label: "Keeps running the café as it is", why: "The same business, with the same assets: no change in the nature of its activities." },
  related: { label: "Adds evening wine and tapas", why: "New products related to what the café already sells. IRD lists this as a change that's allowed." },
  major: { label: "Closes the café and runs an IT consultancy", why: "A different business, with the café's assets sold: a major change in the nature of its activities." },
};

/** the whole scenario: year 3 loss, years 4 and 5 normal, an ownership change partway through year 4 */
export function scenario(months: number, sale: SaleKey, plan: NewOwnerPlan) {
  const y3 = badYear(months);
  const kept = continuity(OWNERSHIP, SALES[sale].after);
  const loss = lossSurvives(kept, plan);
  const credits = creditsSurvive(kept);
  const incomes = [
    { label: "Year 3 (2028–29)", netIncome: y3.netIncome },
    { label: "Year 4 (2029–30)", netIncome: BASE.normalNetIncome },
    { label: "Year 5 (2030–31)", netIncome: BASE.normalNetIncome },
  ];
  const years = carryLosses(incomes, COMPANY_TAX_RATE, { forfeitBefore: loss.survives ? undefined : 1 });
  const noChange = carryLosses(incomes, COMPANY_TAX_RATE);
  const taxSaved = r2(years.reduce((s, y) => s + y.used, 0) * COMPANY_TAX_RATE);
  return { y3, kept, loss, credits, years, noChange, taxSaved, creditsLost: credits ? 0 : BASE.icaAtBreach };
}
