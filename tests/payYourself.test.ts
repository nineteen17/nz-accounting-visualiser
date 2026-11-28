import { describe, expect, it } from "vitest";
import { ACTUAL, BASE, PRESETS, RATES, payYourself } from "@/data/books/payYourself";
import * as Y2 from "@/data/books/year2";
import { companyTax, dividendShare, MAX_IC_RATIO, maxFullyImputed, ownerYear } from "@/lib/nz/payYourself";
import { RWT } from "@/lib/nz/rates";

const noDiv = dividendShare(0, 0);

describe("pay yourself: the café's actual choice matches the books", () => {
  const r = payYourself(ACTUAL);
  it("company tax, taxable income and profit", () => {
    expect(r.company.tax).toBeCloseTo(Y2.TAX.tax, 2);
    expect(r.company.taxable).toBeCloseTo(Y2.TAX.taxableIncome, 2);
    expect(r.company.profitAfterTax).toBeCloseTo(Y2.NET_PROFIT, 2);
  });
  it("the dividend's credits and RWT", () => {
    expect(r.company.credits).toBeCloseTo(Y2.DIVIDEND.ic, 1);
    expect(r.owners.reduce((s, o) => s + o.dividend.rwt, 0)).toBeCloseTo(Y2.DIVIDEND.rwt, 1);
    for (const o of r.owners) {
      const book = Y2.DIVIDEND.shares.find((s) => s.id === o.id)!;
      expect(o.dividend.paid).toBeCloseTo(book.paid, 2);
    }
  });
  it("the year-end balance sheet is the real one, and passes the solvency test", () => {
    expect(r.yearEnd.bank).toBeCloseTo(BASE.bank, 2);
    expect(r.yearEnd.solvent).toBe(true);
    expect(r.yearEnd.liquid).toBe(true);
  });
  it("Ben's credits exactly cover the tax on his dividend (his IT salary puts him on 33%)", () => {
    const ben = r.owners.find((o) => o.id === "ben")!;
    const withoutDiv = ownerYear({ salary: ben.salary, dividend: noDiv, otherIncome: ben.otherIncome, rates: RATES });
    expect(ben.toPay).toBeCloseTo(withoutDiv.toPay, 1);
  });
  it("Aroha's credits cover the tax on her dividend, but it costs her the IETC, so she pays a little more", () => {
    const a = r.owners.find((o) => o.id === "aroha")!;
    const withoutDiv = ownerYear({ salary: a.salary, dividend: noDiv, otherIncome: 0, rates: RATES });
    const extra = a.toPay - withoutDiv.toPay;
    expect(extra).toBeGreaterThan(0);
    expect(extra).toBeLessThan(RATES.ietc.annual);
    const notes = JSON.stringify(Y2.ALL);
    expect(notes).toContain("IETC limit");
  });
});

describe("pay yourself: the tax rules", () => {
  it("company tax is 28% of taxable income, rounded down to the dollar; never negative", () => {
    expect(companyTax(1000.99)).toBe(280);
    expect(companyTax(-5000)).toBe(0);
  });
  it("a fully imputed dividend carries 28/72 credits, and RWT tops them up to 33% of the gross", () => {
    const d = dividendShare(7_200, 99_999);
    expect(d.ic).toBeCloseTo(2_800, 2);
    expect(d.ic + d.rwt).toBeCloseTo(d.gross * RWT.dividendRate, 2);
  });
  it("the imputation credit account limits the fully imputed dividend", () => {
    expect(maxFullyImputed(2_800)).toBe(7_200);
    const r = payYourself({ aroha: 0, ben: 0, dividend: BASE.maxFullyImputed + 10_000 });
    expect(r.company.fullyImputed).toBe(false);
    expect(r.company.credits).toBeCloseTo(BASE.ica, 2);
  });
  it("for an owner taxed at 28%, salary or dividend makes no difference", () => {
    const flat28 = { ...RATES, brackets: [{ upTo: Infinity, rate: 0.28 }], ietc: { ...RATES.ietc, annual: 0 } };
    const cash = 72_000;
    const viaSalary = ownerYear({ salary: cash / 0.72, dividend: noDiv, otherIncome: 0, rates: flat28 });
    const viaDividend = ownerYear({ salary: 0, dividend: dividendShare(cash, cash * MAX_IC_RATIO), otherIncome: 0, rates: flat28 });
    // salary: the company pays no tax; dividend: 28% company tax, credited in full
    expect(viaSalary.personalTax).toBeCloseTo(companyTax(cash / 0.72), 0);
    expect(viaDividend.personalTax).toBeCloseTo(0, 0);
    expect(viaSalary.keeps).toBeCloseTo(viaDividend.keeps, 0);
  });
  it("unused credits aren't refunded; RWT is", () => {
    const low = ownerYear({ salary: 0, dividend: dividendShare(10_000, 10_000 * MAX_IC_RATIO), otherIncome: 0, rates: RATES });
    expect(low.icUnused).toBeGreaterThan(0);
    expect(low.toPay).toBeCloseTo(-low.dividend.rwt, 2);
  });
});

describe("pay yourself: presets and warnings", () => {
  it("lowest tax is no worse than any other preset", () => {
    const lowest = payYourself(PRESETS.find((p) => p.key === "lowest")!.choice).totals.tax;
    for (const p of PRESETS) expect(lowest).toBeLessThanOrEqual(payYourself(p.choice).totals.tax + 0.01);
  });
  it("lowest tax keeps Ben's salary within what his work is worth", () => {
    expect(PRESETS.find((p) => p.key === "lowest")!.choice.ben).toBeLessThanOrEqual(BASE.benWorth);
  });
  it("all salary leaves the company with no tax to pay", () => {
    expect(payYourself(PRESETS.find((p) => p.key === "all-salary")!.choice).company.tax).toBe(0);
  });
  it("a huge dividend fails the solvency test", () => {
    const r = payYourself({ ...ACTUAL, dividend: BASE.bank + 50_000 });
    expect(r.yearEnd.liquid).toBe(false);
  });
  it("Ben's salary ratio is measured against his work", () => {
    expect(payYourself({ ...ACTUAL, ben: BASE.benWorth * 2 }).benRatio).toBeCloseTo(2, 2);
  });
});
