import { describe, expect, it } from "vitest";
import { balances } from "@/lib/engine/ledger";
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { YEAR_ENDS, post, profitOf, totals } from "@/data/study/yearEnd";

describe("do the year-end yourself", () => {
  it("the unadjusted trial balance balances", () => {
    for (const ye of YEAR_ENDS) {
      const t = totals(ye.unadjusted);
      expect(t.dr, ye.key).toBeCloseTo(t.cr, 2);
    }
  });

  it("posting every right answer gives Kōwhai's real adjusted figures", () => {
    for (const ye of YEAR_ENDS) {
      const done = ye.steps.reduce((b, s) => post(b, s.q.lines), ye.unadjusted);
      expect(profitOf(done, { beforeTax: true }), ye.key).toBeCloseTo(ye.profitBeforeTax, 2);
      expect(profitOf(done), ye.key).toBeCloseTo(ye.netProfit, 2);
      const t = totals(done);
      expect(t.dr).toBeCloseTo(t.cr, 2);
    }
  });

  it("covers every adjustment the accountant made", () => {
    const real = (b: Record<string, number>) => Object.fromEntries(Object.entries(b).filter(([, v]) => Math.abs(v) > 0.004));
    const [y1, y2] = YEAR_ENDS;
    const y1done = y1.steps.reduce((b, s) => post(b, s.q.lines), y1.unadjusted);
    for (const [k, v] of Object.entries(real(balances(Y1.BEFORE_CLOSING)))) expect(y1done[k] ?? 0, k).toBeCloseTo(v, 2);
    const y2done = y2.steps.reduce((b, s) => post(b, s.q.lines), y2.unadjusted);
    for (const [k, v] of Object.entries(real(balances([Y2.OPENING_ENTRY, ...Y2.BEFORE_CLOSING])))) expect(y2done[k] ?? 0, k).toBeCloseTo(v, 2);
  });

  it("every step offers its right accounts", () => {
    for (const ye of YEAR_ENDS) for (const s of ye.steps) for (const l of s.q.lines) expect(s.q.options, s.txn.id).toContain(l.account);
  });
});
