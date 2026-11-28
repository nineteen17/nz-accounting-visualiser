import { describe, expect, it } from "vitest";
import { BEAN_EXAMPLE, fifo, lowerOfCostAndNrv, totalCost, weightedAverage } from "@/lib/nz/stock";

describe("valuing stock", () => {
  it("FIFO keeps the latest purchases", () => {
    // 38 kg left: 25 kg @ $40 + 13 kg @ $38
    expect(fifo(BEAN_EXAMPLE, 38).closing).toBe(25 * 40 + 13 * 38);
    expect(fifo(BEAN_EXAMPLE, 0).closing).toBe(0);
    expect(fifo(BEAN_EXAMPLE, 75).closing).toBe(totalCost(BEAN_EXAMPLE));
  });
  it("weighted average spreads the total cost evenly", () => {
    expect(totalCost(BEAN_EXAMPLE)).toBe(2_860);
    expect(weightedAverage(BEAN_EXAMPLE, 38).closing).toBeCloseTo((2_860 / 75) * 38, 2);
  });
  it("closing stock + cost of goods sold = everything bought, both ways", () => {
    for (let left = 0; left <= 75; left += 5) {
      for (const v of [fifo(BEAN_EXAMPLE, left), weightedAverage(BEAN_EXAMPLE, left)]) expect(v.closing + v.cogs).toBeCloseTo(2_860, 2);
    }
  });
  it("with prices rising, FIFO's closing stock is higher; falling, lower", () => {
    const falling = BEAN_EXAMPLE.map((b, i, all) => ({ ...b, price: all[all.length - 1 - i].price }));
    expect(fifo(BEAN_EXAMPLE, 38).closing).toBeGreaterThan(weightedAverage(BEAN_EXAMPLE, 38).closing);
    expect(fifo(falling, 38).closing).toBeLessThan(weightedAverage(falling, 38).closing);
  });
  it("lower of cost and NRV", () => {
    expect(lowerOfCostAndNrv(100, 80)).toBe(80);
    expect(lowerOfCostAndNrv(100, 130)).toBe(100);
  });
});

describe("IRD trading stock thresholds (Income Tax Act 2007)", () => {
  it("low value trading stock: turnover of $1,300,000 or less, closing stock under $10,000 (s EB 23)", async () => {
    const { TRADING_STOCK } = await import("@/lib/nz/rates");
    const qualifies = (turnover: number, stock: number) => turnover <= TRADING_STOCK.lowValue.turnoverUpTo && stock < TRADING_STOCK.lowValue.stockEstimateUnder;
    expect(qualifies(1_300_000, 9_999)).toBe(true);
    expect(qualifies(1_300_001, 9_999)).toBe(false);
    expect(qualifies(1_000_000, 10_000)).toBe(false);
    expect(TRADING_STOCK.lowTurnoverUpTo).toBe(3_000_000);
  });
});
