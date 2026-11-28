import { describe, expect, it } from "vitest";
import { compare, companyChoice, OWNERS, PROFIT, RATES } from "@/data/books/structures";
import { ACTUAL, payYourself } from "@/data/books/payYourself";
import { accLevy, accRate, personalTax } from "@/lib/nz/payYourself";
import { extraTax, passThrough } from "@/lib/nz/structures";

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

describe("which structure: Kōwhai's year 2", () => {
  const all = compare(PROFIT);
  it("the company is the café's real choice, and matches the pay yourself tool", () => {
    const c = companyChoice(PROFIT);
    expect(c).toEqual({ salaries: { aroha: ACTUAL.aroha, ben: ACTUAL.ben }, dividend: ACTUAL.dividend });
    const py = payYourself(ACTUAL);
    expect(all.company.companyTax).toBeCloseTo(py.company.tax, 2);
    expect(all.company.ownersTax).toBeCloseTo(py.totals.ownersTax, 2);
    expect(all.company.ownersKeep).toBeCloseTo(py.totals.ownersKeep, 2);
    expect(all.company.acc).toBeCloseTo(py.totals.acc, 2);
  });
  it("every structure accounts for the whole profit: kept + tax + levies + kept in the business", () => {
    for (const r of Object.values(all)) expect(r.ownersKeep + r.taxNow + r.acc + r.kept).toBeCloseTo(PROFIT, 1);
  });
  it("partners' shares add up to the profit, 60/40", () => {
    expect(sum(all.partnership.owners.map((o) => o.share))).toBeCloseTo(PROFIT, 1);
    expect(all.partnership.owners.find((o) => o.id === "aroha")!.share).toBeCloseTo(PROFIT * 0.6, 1);
  });
  it("a partnership and an LTC pay the same tax (an LTC is taxed like a partnership)", () => {
    expect(all.ltc.taxNow).toBe(all.partnership.taxNow);
    expect(all.ltc.ownersKeep).toBe(all.partnership.ownersKeep);
  });
  it("a sole trader's tax is Aroha's personal tax on the whole profit", () => {
    expect(all.sole.taxNow).toBeCloseTo(personalTax(PROFIT, RATES), 2);
  });
  it("Ben's share is taxed on top of his IT salary: all at 33%", () => {
    const ben = all.partnership.owners.find((o) => o.id === "ben")!;
    expect(ben.tax).toBeCloseTo(ben.share * 0.33, 0);
  });
  it("the company holds profit at 28%, with more tax to come when it's paid out", () => {
    expect(all.company.kept).toBeGreaterThan(0);
    expect(all.company.taxLater).toBeGreaterThan(0);
    expect(all.company.taxNow).toBeLessThan(all.partnership.taxNow);
  });
});

describe("which structure: a loss year", () => {
  const all = compare(-40_000);
  it("in a partnership, Ben's share of the loss gets PAYE back on his IT salary", () => {
    const ben = all.partnership.owners.find((o) => o.id === "ben")!;
    expect(ben.share).toBe(-16_000);
    expect(ben.tax).toBeLessThan(0);
    // his $90,000 drops to $74,000: the refund is the difference in tax
    expect(-ben.tax).toBeCloseTo(personalTax(90_000, RATES) - personalTax(74_000, RATES), 2);
  });
  it("Aroha has no other income, so her share is carried forward", () => {
    const a = all.partnership.owners.find((o) => o.id === "aroha")!;
    expect(a.tax).toBe(0);
    expect(a.lossCarried).toBe(24_000);
  });
  it("the company carries its loss forward, worth 28% later, and pays no salaries", () => {
    expect(all.company.lossCarried).toBe(40_000);
    expect(all.company.lossValue).toBeCloseTo(11_200, 2);
    expect(all.company.taxNow).toBe(0);
    expect(companyChoice(-40_000).salaries).toEqual({ aroha: 0, ben: 0 });
  });
  it("nobody pays ACC on a loss", () => {
    for (const r of Object.values(all)) expect(r.acc).toBe(0);
  });
});

describe("which structure: the rules", () => {
  it("a loss bigger than the other income is carried forward", () => {
    expect(extraTax(10_000, -25_000, RATES)).toEqual({ tax: -personalTax(10_000, RATES), lossCarried: 15_000 });
  });
  it("ACC stops at the maximum liable earnings", () => {
    expect(accLevy(1_000_000, RATES)).toBeCloseTo(RATES.acc.maxLiableEarnings * accRate(RATES), 2);
    const big = passThrough(1_000_000, [{ ...OWNERS[0], pct: 1 }], RATES);
    expect(big.acc).toBeCloseTo(RATES.acc.maxLiableEarnings * accRate(RATES), 2);
  });
  it("in a smaller year the company still covers its salaries and their ACC", () => {
    for (const p of [20_000, 60_000, 80_000, 101_000]) expect(compare(p).company.kept).toBeGreaterThanOrEqual(-0.01);
  });
});
