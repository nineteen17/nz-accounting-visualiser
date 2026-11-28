import { describe, expect, it } from "vitest";
import { DEFERRED_YEARS } from "@/data/books/deferredTax";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { DRILL_MAP } from "@/data/study/drills";
import { seeded } from "@/data/study/core";
import { GLOSSARY } from "@/data/glossary";
import { deferredTax, signedDiff } from "@/lib/nz/deferredTax";
import { COMPANY_TAX_RATE, LARGE_COMPANY } from "@/lib/nz/rates";
import { TOOL_LAW } from "@/lib/nz/law";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

const [y1, y2] = DEFERRED_YEARS;
const close = (a: number, b: number, tol = 0.01) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);

describe("deferred tax maths", () => {
  it("an asset worth more in the accounts than for tax is taxable later; an unpaid accrual is deductible later", () => {
    expect(signedDiff({ key: "a", label: "a", side: "asset", carrying: 100, taxBase: 80, explain: "" })).toBe(20);
    expect(signedDiff({ key: "b", label: "b", side: "liability", carrying: 50, taxBase: 0, explain: "" })).toBe(-50);
    const d = deferredTax([
      { key: "a", label: "a", side: "asset", carrying: 100, taxBase: 80, explain: "" },
      { key: "b", label: "b", side: "liability", carrying: 50, taxBase: 0, explain: "" },
    ], 0.28);
    expect(d.liabilities).toBe(5.6);
    expect(d.assets).toBe(14);
    expect(d.net).toBe(-8.4);
  });
});

describe("Kōwhai's deferred tax", () => {
  it("year 1 has a net deferred tax liability of $989.40", () => {
    expect(y1.diffs.net).toBe(989.4);
    expect(y1.diffs.liabilities).toBe(2403.52);
    expect(y1.diffs.assets).toBe(1414.12);
    expect(y1.expense.deferredMethod).toBe(17835.04);
  });

  it("the deferred tax method lands on 28% of (profit + permanent differences), to within IRD's whole-dollar rounding", () => {
    for (const y of DEFERRED_YEARS) close(y.expense.deferredMethod, y.expense.expected, COMPANY_TAX_RATE);
  });

  it("each year's movement is closing less opening, and year 2 opens with year 1's closing", () => {
    expect(y2.openingDeferred).toBe(y1.diffs.net);
    for (const y of DEFERRED_YEARS) close(y.expense.movement, y.diffs.net - y.openingDeferred);
  });

  it("the timing lines of the tax reconciliations add up to the change in the temporary differences", () => {
    // taxable income − profit = permanent + temporary; temporary = −(change in net taxable differences)
    close(y1.temporary, -(y1.diffs.netDiff - 0));
    close(y2.temporary, -(y2.diffs.netDiff - y1.diffs.netDiff));
    for (const y of DEFERRED_YEARS) close(y.permanent + y.temporary, y.taxableIncome - y.profitBeforeTax);
  });

  it("every reconciliation line is classified, and only entertainment is permanent", () => {
    expect(y1.items).toHaveLength(Y1.TAX.items.length);
    expect(y2.items).toHaveLength(Y2.TAX.items.length);
    for (const y of DEFERRED_YEARS) {
      for (const i of y.items) expect(i.why.length).toBeGreaterThan(20);
      expect(y.items.filter((i) => i.kind === "permanent").map((i) => i.label)).toEqual([expect.stringMatching(/entertainment/)]);
    }
  });

  it("each line gets its own explanation (depreciation isn't explained as an ACC levy)", () => {
    for (const y of DEFERRED_YEARS) {
      for (const i of y.items) {
        if (/depreciation|Boost|sale/i.test(i.label)) expect(i.why).toMatch(/assets/);
        if (/ACC levies/.test(i.label)) expect(i.why).toMatch(/ACC levy/);
      }
    }
  });

  it("the books' current tax is the taxes payable method's whole tax expense", () => {
    expect(y1.expense.taxesPayable).toBe(Y1.TAX.tax);
    expect(y2.expense.taxesPayable).toBe(Y2.TAX.tax);
  });

  it("year 2's asset values match the ledger's net book value", () => {
    const book = Y2.YEAR2_FACTS.assets.reduce((s, a) => s + a.book, 0);
    expect(book).toBeGreaterThan(0);
    close(y2.diffs.rows.filter((r) => r.side === "asset").reduce((s, r) => s + r.carrying, 0), book);
  });
});

describe("the page's supporting pieces", () => {
  it("is registered, with its law and glossary terms", () => {
    expect(EXPLORE_TOOLS.some((t) => t.slug === "deferred-tax")).toBe(true);
    expect(TOOL_LAW["deferred-tax"].map((r) => r.section)).toContain("45");
    expect(LARGE_COMPANY.totalRevenue).toBe(33_000_000);
    for (const k of ["deferred-tax", "temporary-difference", "permanent-difference", "tax-base", "taxes-payable-method", "effective-tax-rate"])
      expect(GLOSSARY.some((g) => g.key === k)).toBe(true);
  });

  it("the drill makes valid questions", () => {
    const d = DRILL_MAP["deferred-tax"];
    const rng = seeded(7);
    for (let i = 0; i < 200; i++) {
      const q = d.make(rng);
      expect(q.explain.length).toBeGreaterThan(10);
      if (q.kind === "choice") expect(q.options[q.answer]).toBeTruthy();
    }
  });
});
