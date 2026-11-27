import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances } from "@/lib/engine/ledger";
import { profitAndLoss } from "@/lib/engine/statements";
import * as Y2 from "@/data/books/year2";
import { BEFORE_CLOSING as Y1_BEFORE } from "@/data/books";
import { BUDGET_CODES, BUDGET_LINES, SALES, budgetStatement, isMaterial, variance } from "@/data/books/budget";

describe("budget vs actual (year 2)", () => {
  const s = budgetStatement(false);

  it("the actual column is year 2's real profit and loss", () => {
    const pl = profitAndLoss(balances(Y2.BEFORE_CLOSING));
    expect(s.actual.revenue).toBeCloseTo(pl.revenueTotal, 2);
    expect(s.actual.grossProfit).toBeCloseTo(pl.grossProfit, 2);
    expect(s.actual.expenses).toBeCloseTo(pl.expensesTotal, 2);
    expect(s.actual.profitBeforeTax).toBeCloseTo(Y2.PROFIT_BEFORE_TAX, 2);
    expect(s.actual.profitAfterTax).toBeCloseTo(Y2.NET_PROFIT, 2);
  });

  it("every income and expense account used in either year has a budget line", () => {
    const used = (b: Record<string, number>) => ACCOUNTS.filter((a) => (a.type === "income" || a.type === "expense") && Math.abs(b[a.code] ?? 0) > 0.004).map((a) => a.code);
    for (const code of [...used(balances(Y1_BEFORE)), ...used(balances(Y2.BEFORE_CLOSING))]) expect(BUDGET_CODES.has(code), code).toBe(true);
  });

  it("explains every big difference, with or without flexing", () => {
    for (const flex of [false, true]) {
      for (const l of budgetStatement(flex).lines) {
        const v = variance(l, l.budget);
        if (isMaterial(v.amount, l.budget)) expect(l.why, `${l.label}: ${v.amount}`).toBeTruthy();
      }
    }
  });

  it("flexing changes only the lines that move with sales, in proportion to sales", () => {
    const f = budgetStatement(true);
    for (const [a, b] of BUDGET_LINES.map((l, i) => [l, f.lines[i]] as const)) {
      if (!a.variable) expect(b.budget).toBe(a.budget);
      else expect(b.budget / a.budget).toBeCloseTo(SALES.actual / SALES.budget, 3);
    }
  });

  it("signs variances so favourable means better for profit", () => {
    expect(variance({ income: true, actual: 110 }, 100)).toMatchObject({ amount: 10, favourable: true });
    expect(variance({ income: false, actual: 110 }, 100)).toMatchObject({ amount: -10, favourable: false });
    expect(variance({ income: false, actual: 90 }, 100)).toMatchObject({ amount: 10, favourable: true });
  });

  it("budgets the loan interest straight from the loan schedule", () => {
    const interest = BUDGET_LINES.find((l) => l.code === "630")!;
    expect(interest.budget).toBeCloseTo(interest.actual, 2);
  });
});
