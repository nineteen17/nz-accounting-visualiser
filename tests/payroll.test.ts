import { describe, expect, it } from "vitest";
import { esctRates, payRuns } from "@/data/books/generator";
import { YEAR1 } from "@/data/books/year";
import { YEAR2 } from "@/data/books/year2";
import { esctOn, payeForPay, studentLoanFor, truncCents } from "@/lib/nz/payroll";
import { PAYROLL_2026_27 } from "@/lib/nz/rates";

/** IRD's Payroll Calculations & Business Rules Specification, 1 April 2026 to 31 March 2027 (v1.0) */
describe("payroll follows IRD's payroll specification", () => {
  it("truncates to cents, never rounds ($75.678 → $75.67, $327.903333 → $327.90)", () => {
    expect(truncCents(75.678)).toBe(75.67);
    expect(truncCents(327.903333)).toBe(327.9);
    expect(truncCents(0.29)).toBe(0.29);
  });
  it("PAYE, code ME, $2,080 a fortnight: worked by hand from the spec's steps", () => {
    // annual 54,080; tax 54,080 × 30% − 7,779.50 = 8,444.50; levy 54,080 × 1.75% = 946.40; IETC 520
    // (8,444.50 + 946.40 − 520) ÷ 52 = 170.594… → 170.59; × 52 ÷ 26 = 341.18
    const p = payeForPay(2080, "ME", 26, PAYROLL_2026_27);
    expect(p.annualised).toBe(54_080);
    expect(p.paye).toBe(341.18);
    expect(p.steps.at(-1)!.value).toBe(341.18);
  });
  it("annual income drops the cents before the tax is worked out", () => {
    expect(payeForPay(793.8, "M", 26, PAYROLL_2026_27).annualised).toBe(20_638); // 793.80 × 26 = 20,638.80
  });
  it("ESCT: IRD's example, $122.50 → $122 × 17.5% = $21.35, so $101.15 goes to the fund", () => {
    expect(esctOn(122.5, 0.175)).toBe(21.35);
    expect(122.5 - esctOn(122.5, 0.175)).toBeCloseTo(101.15, 2);
  });
  it("student loan works on gross pay with the cents dropped", () => {
    // $2,080.90: $2,080 − $928 = $1,152 × 12% = $138.24
    expect(studentLoanFor(2080.9, PAYROLL_2026_27)).toBe(138.24);
    expect(studentLoanFor(900, PAYROLL_2026_27)).toBe(0);
  });
  it("each employee's ESCT rate is set once for the year, not pay by pay", () => {
    for (const cfg of [YEAR1, YEAR2]) {
      const rates = esctRates(cfg);
      for (const run of payRuns(cfg)) for (const r of run.results) expect(r.esctRate).toBe(rates[r.employee.id]);
    }
  });
});
