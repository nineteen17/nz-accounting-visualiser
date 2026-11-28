import { describe, expect, it } from "vitest";
import { ACTUAL_RIT, AIM_PERIODS, BOOKS, DATES, LAST_RIT, RATIO_OK, TERMINAL_DATE, plans } from "@/data/books/provisionalTax";
import { daysBetween, estimation, interest, latePenalty, ratioEligibility, standard } from "@/lib/nz/provisionalTax";
import { PROVISIONAL_TAX } from "@/lib/nz/rates";

describe("provisional tax: Kōwhai's real year 2", () => {
  const p = plans({ actualRit: ACTUAL_RIT, estimate: ACTUAL_RIT });
  it("the standard method reproduces the books", () => {
    expect(p.standard.instalments.map((i) => i.amount)).toEqual(BOOKS.instalments.map((i) => i.amount));
    expect(p.standard.paid).toBeCloseTo(BOOKS.total, 2);
    expect(p.standard.terminal).toBeCloseTo(3_318.9, 2);
  });
  it("RIT under $60,000 on the standard method: no interest", () => {
    expect(ACTUAL_RIT).toBeLessThan(PROVISIONAL_TAX.safeHarbourRit);
    expect(p.standard.interestCharged).toBe(0);
  });
  it("an estimate equal to the actual RIT costs no interest", () => {
    expect(p.estimation.interestCharged).toBe(0);
    expect(p.estimation.terminal).toBeCloseTo(0, 2);
  });
  it("AIM's payments add up to the year's tax", () => {
    expect(p.aim.paid).toBeCloseTo(ACTUAL_RIT, 0);
    expect(AIM_PERIODS).toHaveLength(6);
  });
  it("the GST ratio is refused for year 2: the business began operating in year 1", () => {
    expect(RATIO_OK.ok).toBe(false);
    expect(RATIO_OK.reasons.join(" ")).toContain("RC 16(2)(b)");
  });
});

describe("provisional tax: the rules", () => {
  it("interest is daily and not compounded, and matches a hand calculation", () => {
    const i = interest([{ date: "2028-05-07", due: 10_000, paid: 0 }], "2029-04-07");
    expect(daysBetween("2028-05-07", "2029-04-07")).toBe(335);
    expect(i.charged).toBeCloseTo((10_000 * PROVISIONAL_TAX.uomiUnderpaid * 335) / 365, 2);
  });
  it("no interest on a gap of $100 or less", () => {
    expect(interest([{ date: "2028-05-07", due: 100, paid: 0 }], "2029-04-07").charged).toBe(0);
  });
  it("RIT of $60,000 or more: interest from the last instalment date only", () => {
    const s = standard({ lastRit: LAST_RIT, actualRit: 70_000, dates: DATES, terminalDate: TERMINAL_DATE });
    const gap = 70_000 - s.paid;
    expect(s.interestCharged).toBeCloseTo((gap * PROVISIONAL_TAX.uomiUnderpaid * daysBetween(DATES[2], TERMINAL_DATE)) / 365, 2);
  });
  it("a short estimate is charged interest from each instalment date", () => {
    const e = estimation({ estimate: 15_000, actualRit: ACTUAL_RIT, dates: DATES, terminalDate: TERMINAL_DATE });
    expect(e.interestCharged).toBeGreaterThan(0);
    const over = estimation({ estimate: 30_000, actualRit: ACTUAL_RIT, dates: DATES, terminalDate: TERMINAL_DATE });
    expect(over.interestCharged).toBe(0);
    expect(over.interestCredited).toBeGreaterThan(0);
  });
  it("late payment penalty: 1% the day after, then 4% of the new amount after a week (IR289's example)", () => {
    // IR289: $7,600 due 7 May; 1% on 8 May ($76), then 4% of $7,676 on 15 May ($307.04)
    expect(latePenalty(7_600, 5)).toBeCloseTo(76, 2);
    expect(latePenalty(7_600, 7)).toBeCloseTo(76, 2);
    expect(latePenalty(7_600, 8)).toBeCloseTo(76 + 307.04, 2);
    expect(latePenalty(7_600, 0)).toBe(0);
  });
  it("a late instalment under $60,000 still gets the penalty, but no interest", () => {
    const s = standard({ lastRit: LAST_RIT, actualRit: ACTUAL_RIT, dates: DATES, terminalDate: TERMINAL_DATE, late: { index: 1, days: 10 } });
    expect(s.penalties).toBeGreaterThan(0);
    expect(s.interestCharged).toBe(0);
  });
  it("the GST ratio needs RIT in range, registration all last year, no new business, and 1- or 2-monthly GST", () => {
    expect(ratioEligibility({ lastRit: 20_000, registeredAllLastYear: true, beganOperatingLastYear: false, gstMonths: 2 }).ok).toBe(true);
    expect(ratioEligibility({ lastRit: 200_000, registeredAllLastYear: true, beganOperatingLastYear: false, gstMonths: 2 }).ok).toBe(false);
    expect(ratioEligibility({ lastRit: 20_000, registeredAllLastYear: true, beganOperatingLastYear: false, gstMonths: 6 }).ok).toBe(false);
  });
});
