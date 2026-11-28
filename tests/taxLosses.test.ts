import { describe, expect, it } from "vitest";
import { BASE, badYear, scenario } from "@/data/books/taxLosses";
import * as Y2 from "@/data/books/year2";
import { DRILL_MAP } from "@/data/study/drills";
import { seeded } from "@/data/study/core";
import { GLOSSARY_MAP } from "@/data/glossary";
import { carryLosses, continuity, creditsSurvive, lossSurvives } from "@/lib/nz/taxLosses";
import { TOOL_LAW } from "@/lib/nz/law";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

describe("carrying a loss forward (ss IA 3, IA 4)", () => {
  it("a loss is used first, only as far as net income goes, and the rest carries on with no time limit", () => {
    const ys = carryLosses([
      { label: "1", netIncome: -100_000 }, { label: "2", netIncome: 30_000 }, { label: "3", netIncome: 0 }, { label: "4", netIncome: 50_000 }, { label: "5", netIncome: 50_000 },
    ], 0.28);
    expect(ys.map((y) => y.used)).toEqual([0, 30_000, 0, 50_000, 20_000]);
    expect(ys.map((y) => y.carriedForward)).toEqual([100_000, 70_000, 70_000, 20_000, 0]);
    expect(ys.map((y) => y.taxableIncome)).toEqual([0, 0, 0, 0, 30_000]);
    expect(ys[4].tax).toBe(8_400);
  });

  it("a second loss adds to the balance", () => {
    const ys = carryLosses([{ label: "1", netIncome: -10_000 }, { label: "2", netIncome: -5_000 }], 0.28);
    expect(ys[1].carriedForward).toBe(15_000);
  });

  it("a forfeited balance is gone from that year on", () => {
    const ys = carryLosses([{ label: "1", netIncome: -10_000 }, { label: "2", netIncome: 50_000 }], 0.28, { forfeitBefore: 1 });
    expect(ys[1].used).toBe(0);
    expect(ys[1].taxableIncome).toBe(50_000);
  });
});

describe("continuity (ss IA 5, IB 3, OA 8)", () => {
  const before = { aroha: 0.6, ben: 0.4 };
  it("counts each person at their lowest holding; a new owner adds nothing", () => {
    expect(continuity(before, { aroha: 0.6, ben: 0, newOwner: 0.4 })).toBe(0.6);
    expect(continuity(before, { aroha: 0, ben: 0.4, newOwner: 0.6 })).toBe(0.4);
    expect(continuity(before, { newOwner: 1 })).toBe(0);
  });
  it("49% exactly keeps a loss; just under doesn't, unless the business continues", () => {
    expect(lossSurvives(0.49, "major").survives).toBe(true);
    expect(lossSurvives(0.489, "major").survives).toBe(false);
    expect(lossSurvives(0.489, "same")).toEqual({ survives: true, by: "business" });
    expect(lossSurvives(0.489, "related").survives).toBe(true);
  });
  it("imputation credits need 66%", () => {
    expect(creditsSurvive(0.66)).toBe(true);
    expect(creditsSurvive(0.6)).toBe(false);
  });
});

describe("Kōwhai's what-if", () => {
  it("builds on year 2's books", () => {
    expect(BASE.profitBeforeTax).toBe(Y2.PROFIT_BEFORE_TAX);
    expect(BASE.normalNetIncome).toBe(Y2.TAX.taxableIncome);
    expect(BASE.icaAtBreach).toBeCloseTo(Y2.YEAR2_FACTS.icaClosing + Y2.TAX.terminal, 2);
    expect(badYear(0).profit).toBe(Y2.PROFIT_BEFORE_TAX);
  });

  it("makes a loss from about 5 months closed (what the page says)", () => {
    expect(badYear(4).netIncome).toBeGreaterThan(0);
    expect(badYear(5).netIncome).toBeLessThan(0);
  });

  it("Ben selling keeps the loss but loses the credits; Aroha selling relies on the business continuing", () => {
    const ben = scenario(6, "ben", "major");
    expect(ben.loss.survives).toBe(true);
    expect(ben.credits).toBe(false);
    expect(ben.creditsLost).toBe(BASE.icaAtBreach);
    expect(scenario(6, "aroha", "same").loss.by).toBe("business");
    const gone = scenario(6, "aroha", "major");
    expect(gone.loss.survives).toBe(false);
    expect(gone.taxSaved).toBe(0);
    expect(scenario(6, "benHalf", "major").credits).toBe(true);
  });

  it("the tax saved is the loss used × 28%", () => {
    const s = scenario(6, "none", "same");
    expect(s.taxSaved).toBeCloseTo(-s.y3.netIncome * 0.28, 2);
    const big = scenario(12, "none", "same");
    expect(big.years[1].taxableIncome).toBe(0);
    expect(big.years[2].used).toBeGreaterThan(0);
  });

  it("the glossary's hand-typed example figures match the scenario", () => {
    const s = scenario(6, "none", "same");
    expect(Math.round(-s.y3.netIncome / 1000)).toBe(24);
    expect(Math.round(s.years[1].taxableIncome / 100) * 100).toBe(50_500);
    expect(GLOSSARY_MAP["tax-loss"].example).toMatch(/\$24,000.*\$74,600.*\$50,500/);
  });
});

describe("supporting pieces", () => {
  it("the tool, law and glossary terms exist", () => {
    expect(EXPLORE_TOOLS.some((t) => t.slug === "tax-losses")).toBe(true);
    expect(TOOL_LAW["tax-losses"].map((r) => r.section)).toEqual(expect.arrayContaining(["IA 4", "IA 5", "IB 3", "OA 8", "OB 41"]));
    for (const k of ["net-loss", "tax-loss", "shareholder-continuity", "business-continuity-test", "us-nol"]) expect(GLOSSARY_MAP[k]).toBeTruthy();
  });

  it("the drill makes valid questions", () => {
    const rng = seeded(11);
    for (let i = 0; i < 300; i++) {
      const q = DRILL_MAP["tax-losses"].make(rng);
      expect(q.explain.length).toBeGreaterThan(10);
      if (q.kind === "choice") expect(q.options[q.answer]).toBeTruthy();
    }
  });
});
