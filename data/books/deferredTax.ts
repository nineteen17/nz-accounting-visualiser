/**
 * Kōwhai's deferred tax, worked out as a "what if": the books use the taxes payable method (tax expense = the tax
 * owed for the year), and this shows what NZ IAS 12's deferred tax method would add. The page is
 * components/explore/DeferredTax.tsx; the maths is lib/nz/deferredTax.ts. Plan: docs/DEFERRED-TAX.md.
 */
import { FIXED_ASSETS } from "@/data/business";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { balances } from "@/lib/engine/ledger";
import { r2 } from "@/lib/money";
import { assetYearOne } from "@/lib/nz/assets";
import { deferredTax, taxExpense, type TempDiff } from "@/lib/nz/deferredTax";
import type { TaxItem } from "@/lib/nz/incomeTax";
import { COMPANY_TAX_RATE } from "@/lib/nz/rates";

/** each line of the tax reconciliation: does it reverse in a later year (temporary), or never (permanent)? */
export type Classified = TaxItem & { kind: "temporary" | "permanent"; why: string };

const PERMANENT = /entertainment/i;

function classify(items: TaxItem[]): Classified[] {
  return items.map((i) => {
    if (PERMANENT.test(i.label))
      return { ...i, kind: "permanent", why: "Half of entertainment is never deductible, in any year. The accounts and the tax return will always differ by this much." };
    if (/holiday pay/i.test(i.label))
      return { ...i, kind: "temporary", why: "Holiday pay is deducted for tax when it's paid, not when it's accrued. Same total over the years, different timing." };
    if (/ACC/.test(i.label))
      return { ...i, kind: "temporary", why: "An ACC levy is deducted for tax when it's invoiced, not when it's accrued. Same total over the years, different timing." };
    return { ...i, kind: "temporary", why: "Tax and the accounts write assets off at different speeds (Investment Boost and IRD's rates), and measure a sale against different values. Over an asset's life both deduct its cost less what it sells for: only the timing differs." };
  });
}

const accrual = (label: string, key: string, carrying: number, explain: string): TempDiff => ({ key, label, side: "liability", carrying, taxBase: 0, explain });
const assetDiff = (id: string, name: string, book: number, tax: number): TempDiff => ({
  key: id, label: name, side: "asset", carrying: book, taxBase: tax,
  explain: "Worth more in the accounts than for tax: tax has already deducted more of its cost (Investment Boost and IRD's depreciation), so there's less left to deduct later.",
});

/* ───────── Year 1 ───────── */
const b1 = balances(Y1.BEFORE_CLOSING);
const y1Diffs: TempDiff[] = [
  ...FIXED_ASSETS.map((a) => { const y = assetYearOne(a); return assetDiff(a.id, a.name, y.closingBookValue, y.closingTaxValue); }),
  accrual("Holiday pay accrued", "holiday", r2(-b1["220"]), "Expensed in the accounts, but deductible for tax only when Mia takes the leave."),
  accrual("ACC levies accrued", "acc", Y1.YEAR_FACTS.acc.accrual, "Expensed in the accounts, but deductible for tax only when ACC invoices it."),
];

/* ───────── Year 2 ───────── */
const b2 = balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING]);
const accY2 = r2(Y2.YEAR2_FACTS.acc.shareholdersY1 + Y2.YEAR2_FACTS.acc.accrual);
const y2Diffs: TempDiff[] = [
  ...Y2.YEAR2_FACTS.assets.map((a) => assetDiff(a.id, a.name, a.book, a.tax)),
  accrual("Holiday pay accrued", "holiday", r2(-b2["220"]), "This year's accrual: last year's was paid out as Mia took her leave, and reversed."),
  accrual("ACC levies accrued", "acc", accY2, "The staff wash-up and both years' shareholder levies: ACC hasn't invoiced them yet."),
];

function year(key: "y1" | "y2", label: string, yearEnd: string, profitBeforeTax: number, tax: { items: TaxItem[]; tax: number; taxableIncome: number }, diffs: TempDiff[], openingDeferred: number) {
  const dt = deferredTax(diffs, COMPANY_TAX_RATE);
  const items = classify(tax.items);
  const permanent = r2(items.filter((i) => i.kind === "permanent").reduce((s, i) => s + i.amount, 0));
  const temporary = r2(items.filter((i) => i.kind === "temporary").reduce((s, i) => s + i.amount, 0));
  const expense = taxExpense({ profitBeforeTax, currentTax: tax.tax, openingDeferred, closingDeferred: dt.net, permanent, rate: COMPANY_TAX_RATE });
  return { key, label, yearEnd, profitBeforeTax, taxableIncome: tax.taxableIncome, currentTax: tax.tax, items, permanent, temporary, diffs: dt, openingDeferred, expense };
}

const YEAR_1 = year("y1", "Year 1", "2027-03-31", Y1.PROFIT_BEFORE_TAX, Y1.TAX, y1Diffs, 0);
const YEAR_2 = year("y2", "Year 2", "2028-03-31", Y2.PROFIT_BEFORE_TAX, Y2.TAX, y2Diffs, YEAR_1.diffs.net);

export type DeferredYear = typeof YEAR_1;
export const DEFERRED_YEARS: DeferredYear[] = [YEAR_1, YEAR_2];
