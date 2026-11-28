import { describe, expect, it } from "vitest";
import { CAR, KOWHAI } from "@/data/books/gstMixedUse";
import * as Y1 from "@/data/books";
import { balances } from "@/lib/engine/ledger";
import { DRILL_MAP } from "@/data/study/drills";
import { seeded } from "@/data/study/core";
import { GLOSSARY_MAP } from "@/data/glossary";
import { adjustmentPeriods, adjustments, claimOnPurchase, saleAdjustment, underDeMinimis, whichRule } from "@/lib/nz/gstMixedUse";
import { TOOL_LAW } from "@/lib/nz/law";
import { EXPLORE_TOOLS } from "@/app/explore/tools";

describe("the claim on purchase (s 20(3C), (3CB))", () => {
  it("apportions items over $10,000", () => {
    expect(claimOnPurchase(28_000, 0.6)).toEqual({ fullGst: 4_200, claim: 2_520, rule: "apportion" });
  });
  it("items of $10,000 or less are all or nothing on principal purpose", () => {
    expect(claimOnPurchase(2_400, 0.7).claim).toBe(360);
    expect(claimOnPurchase(2_400, 0.4).claim).toBe(0);
    expect(claimOnPurchase(10_000, 0.5).claim).toBe(0);
    expect(claimOnPurchase(10_000.01, 0.5).rule).toBe("apportion");
  });
});

describe("adjustment periods (ss 21–21G)", () => {
  it("2, 5 or 10 periods by cost; none for a small item", () => {
    expect(adjustmentPeriods(10_000)).toBe(0);
    expect(adjustmentPeriods(15_000)).toBe(2);
    expect(adjustmentPeriods(20_000)).toBe(2);
    expect(adjustmentPeriods(20_001)).toBe(5);
    expect(adjustmentPeriods(500_001)).toBe(10);
    expect(adjustmentPeriods(50_000, true)).toBe(10);
  });

  it("reproduces IRD's boat example: actual use is weighted by months since purchase", () => {
    // IRD: $800,000 boat, 100% intended, 6 months at 100% then 12 at 80% → 86.67% → $16,000 paid back
    // (IRD's page shows $16,008 because it rounds the use to 86.66% first)
    const [p1, p2] = adjustments(800_000, 1, [{ months: 6, use: 1 }, { months: 12, use: 0.8 }]);
    expect(p1.adjusted).toBe(false);
    expect(p2.actual).toBeCloseTo(0.8667, 4);
    expect(p2.amount).toBe(-16_000);
  });

  it("skips changes under 10 points unless over $1,000, and compares later years with the last adjustment", () => {
    const ps = adjustments(28_000, 0.6, CAR.defaultUses.map((use) => ({ months: 12, use })));
    expect(ps.map((p) => p.amount)).toEqual([-420, 0, 0, 420, 0]);
    expect(ps[1].compareWith).toBe(0.5);
    expect(ps[4].compareWith).toBeCloseTo(0.6, 9);
    // a big item: 5 points is over $1,000, so it's adjusted
    expect(adjustments(200_000, 0.6, [{ months: 12, use: 0.55 }])[0].amount).toBe(-1_500);
  });

  it("only checks as many periods as the cost allows", () => {
    expect(adjustments(15_000, 0.6, Array(5).fill({ months: 12, use: 0.2 }))).toHaveLength(2);
    expect(adjustments(5_000, 0.6, [{ months: 12, use: 0.2 }])).toHaveLength(0);
  });
});

describe("the sale (s 21F)", () => {
  it("charges GST on the whole price and gives back the unclaimed share", () => {
    expect(saleAdjustment(15_000, 0.5)).toEqual({ gstOnSale: 1_956.52, finalAdjustment: 978.26, net: 978.26 });
    expect(saleAdjustment(15_000, 1).finalAdjustment).toBe(0);
  });
});

describe("which rule applies", () => {
  it("company staff private use is FBT; small items are all or nothing; exempt supplies under the de minimis need nothing", () => {
    expect(whichRule({ buyer: "company", otherUse: "staff-private", costExcl: 30_000 })).toBe("fbt");
    expect(whichRule({ buyer: "sole-trader", otherUse: "owner-private", costExcl: 30_000 })).toBe("apportion");
    expect(whichRule({ buyer: "sole-trader", otherUse: "owner-private", costExcl: 3_000 })).toBe("principal-purpose");
    expect(whichRule({ buyer: "company", otherUse: "exempt", exempt: { exemptSupplies: 20_800, totalSupplies: 490_000 }, costExcl: 30_000 })).toBe("de-minimis");
    expect(whichRule({ buyer: "company", otherUse: "exempt", exempt: { exemptSupplies: 52_000, totalSupplies: 490_000 }, costExcl: 30_000 })).toBe("apportion");
    expect(whichRule({ buyer: "company", otherUse: "none", costExcl: 30_000 })).toBe("full");
  });
  it("the de minimis is the lesser of $90,000 and 5%", () => {
    expect(underDeMinimis(90_000, 5_000_000)).toBe(true);
    expect(underDeMinimis(90_001, 5_000_000)).toBe(false);
    expect(underDeMinimis(5_001, 100_000)).toBe(false);
  });
  it("Kōwhai's bank interest is under the de minimis, from its books", () => {
    const b1 = balances(Y1.BEFORE_CLOSING);
    expect(KOWHAI.interestY1).toBe(-b1["450"]);
    expect(KOWHAI.interestY1).toBeGreaterThan(0);
    expect(KOWHAI.underDeMinimis).toBe(true);
  });
});

describe("supporting pieces", () => {
  it("the tool, law and glossary terms exist, and the glossary's figures match", () => {
    expect(EXPLORE_TOOLS.some((t) => t.slug === "gst-mixed-use")).toBe(true);
    expect(TOOL_LAW["gst-mixed-use"].map((r) => r.section)).toEqual(expect.arrayContaining(["20", "21", "21D", "21F", "21G", "21I"]));
    for (const k of ["gst-apportionment", "adjustment-period", "percentage-use", "principal-purpose-gst"]) expect(GLOSSARY_MAP[k]).toBeTruthy();
    expect(GLOSSARY_MAP["gst-apportionment"].example).toContain("$2,520");
  });

  it("the drill makes valid questions", () => {
    const rng = seeded(5);
    for (let i = 0; i < 300; i++) {
      const q = DRILL_MAP["gst-mixed-use"].make(rng);
      expect(q.explain.length).toBeGreaterThan(10);
      if (q.kind === "choice") expect(q.options[q.answer]).toBeTruthy();
    }
  });
});
