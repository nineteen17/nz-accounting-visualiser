import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_PAYROLL, KIWISAVER, MINIMUM_WAGE, PAYROLL_2026_27, PAYROLL_2027_28, PROVISIONAL_TAX } from "@/lib/nz/rates";
import { calcPay, payeForPay } from "@/lib/nz/payroll";
import { EMPLOYEES } from "@/data/business";
import { YEAR1 } from "@/data/books/year";
import { YEAR2 } from "@/data/books/year2";

/** every source file outside the rates file itself */
function sources(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx?$/.test(f) && !p.replace(/\\/g, "/").endsWith("lib/nz/rates.ts")) out.push(p);
  }
  return out;
}
const FILES = ["app", "components", "data", "lib"].flatMap((d) => sources(d)).map((p) => ({ p, text: readFileSync(p, "utf8") }));
const thousands = (n: number) => n.toLocaleString("en-NZ");
const pctText = (x: number) => `${+(x * 100).toFixed(2)}%`;

describe("rates live in one place", () => {
  // when a rate changes, changing lib/nz/rates.ts must be enough: none of these may be typed in anywhere else
  const figures: [string, string][] = [
    ["adult minimum wage", `$${MINIMUM_WAGE.adult.toFixed(2)}`],
    ["starting-out wage", `$${MINIMUM_WAGE.startingOut.toFixed(2)}`],
    ["ACC max liable earnings", thousands(CURRENT_PAYROLL.acc.maxLiableEarnings)],
    ["ACC levy per $100", `$${(CURRENT_PAYROLL.acc.rate * 100).toFixed(2)} per`],
    ["year-2 ACC max liable earnings", thousands(PAYROLL_2027_28.acc.maxLiableEarnings)],
    ["student loan threshold", thousands(CURRENT_PAYROLL.studentLoan.annualThreshold)],
    ["UOMI underpaid", pctText(PROVISIONAL_TAX.uomiUnderpaid)],
    ["KiwiSaver rate", pctText(KIWISAVER.employerMinimum)],
    ["KiwiSaver rate as a number", String(KIWISAVER.employerMinimum)],
  ];
  for (const [name, text] of figures) {
    it(`doesn't type the ${name} (${text}) outside lib/nz/rates.ts`, () => {
      const hits = FILES.filter((f) => f.text.includes(text)).map((f) => f.p);
      expect(hits).toEqual([]);
    });
  }
});

describe("each café year keeps its own payroll rates", () => {
  it("year 1 uses 2026–27 and year 2 uses 2027–28", () => {
    expect(YEAR1.rates).toBe(PAYROLL_2026_27);
    expect(YEAR2.rates).toBe(PAYROLL_2027_28);
  });
  it("a different year's rates change the pay, so pinning matters", () => {
    const mia = EMPLOYEES[0];
    const y1 = calcPay(mia, 80, PAYROLL_2026_27);
    const y2 = calcPay(mia, 80, PAYROLL_2027_28);
    expect(y2.accLevy).toBeGreaterThan(y1.accLevy);
    expect(y1.gross).toBe(y2.gross);
  });
  it("lists what a carried-forward year still needs confirming", () => {
    expect(PAYROLL_2026_27.toConfirm).toEqual([]);
    for (const k of PAYROLL_2027_28.toConfirm) expect(typeof k).toBe("string");
  });
  it("the lessons' current year defaults the calculators", () => {
    expect(payeForPay(1000, "M").paye).toBe(payeForPay(1000, "M", undefined, CURRENT_PAYROLL).paye);
  });
});
