import { describe, expect, it } from "vitest";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances } from "@/lib/engine/ledger";
import * as Y2 from "@/data/books/year2";
import { LOAN_SCHEDULE } from "@/data/books/april";
import { BUDGET_LINES } from "@/data/books/budget";
import { GROUPS, LINES, MONTH_ROWS, PAY_DAYS, SUMMARY, isMaterial } from "@/data/books/cashForecast";

const CASH = ACCOUNTS.filter((a) => a.cf === "cash").map((a) => a.code);
const cashMoved = (txns: typeof Y2.BEFORE_CLOSING) =>
  txns.flatMap((t) => t.lines).filter((l) => CASH.includes(l.account)).reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0);

describe("cash flow forecast (year 2)", () => {
  it("starts from year 1's closing bank and till", () => {
    expect(SUMMARY.opening).toBeCloseTo(CASH.reduce((s, c) => s + (Y2.OPENING_BALANCES[c] ?? 0), 0), 2);
  });

  it("the actual side is the real bank and till, month by month", () => {
    for (const r of MONTH_ROWS) expect(r.actualNet, r.month).toBeCloseTo(cashMoved(Y2.BEFORE_CLOSING.filter((t) => t.date.startsWith(r.month))), 2);
    const closing = CASH.reduce((s, c) => s + (Y2.OPENING_BALANCES[c] ?? 0) + (balances(Y2.BEFORE_CLOSING)[c] ?? 0), 0);
    expect(SUMMARY.actualClosing).toBeCloseTo(closing, 2);
  });

  it("the forecast's sales are the budget's, plus GST", () => {
    const b = (c: string) => BUDGET_LINES.find((l) => l.code === c)!.budget;
    expect(LINES.find((l) => l.key === "customers")!.forecast).toBeCloseTo((b("400") + b("410")) * 1.15, 0);
  });

  it("known dates and amounts are exact: loan, provisional tax, drawings", () => {
    MONTH_ROWS.forEach((r, i) => expect(-r.forecast.loan).toBeCloseTo(LOAN_SCHEDULE.rows[12 + i].payment, 2));
    const prov = Y2.PROVISIONAL.instalments.filter((x) => x.date <= Y2.YEAR2.yearEnd).reduce((s, x) => s + x.amount, 0);
    expect(-LINES.find((l) => l.key === "tax")!.forecast).toBeCloseTo(prov, 2);
    for (const k of ["loan", "tax", "drawings"] as const) expect(LINES.find((l) => l.key === k)!.diff, k).toBeCloseTo(0, 2);
  });

  it("pays fall fortnightly, two or three a month", () => {
    expect(PAY_DAYS.length).toBe(26);
    for (const r of MONTH_ROWS) expect([2, 3]).toContain(PAY_DAYS.filter((d) => d.startsWith(r.month)).length);
  });

  it("explains every big difference over the year", () => {
    for (const l of LINES) if (isMaterial(l.diff)) expect(l.why, `${l.key}: ${l.diff}`).toBeTruthy();
  });

  it("every group's months add up to its year total", () => {
    for (const g of GROUPS) {
      const l = LINES.find((x) => x.key === g.key)!;
      expect(MONTH_ROWS.reduce((s, r) => s + r.actual[g.key], 0)).toBeCloseTo(l.actual, 1);
      expect(MONTH_ROWS.reduce((s, r) => s + r.forecast[g.key], 0)).toBeCloseTo(l.forecast, 1);
    }
  });
});
