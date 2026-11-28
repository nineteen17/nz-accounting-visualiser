/**
 * Valuing stock: FIFO and weighted average from a run of purchases at changing prices, which
 * method gives the higher profit, lower of cost and NRV, and IRD's low value trading stock rule.
 * Purchases are generated; the maths is lib/nz/stock.ts.
 */
import { TRADING_STOCK } from "@/lib/nz/rates";
import { fifo, totalCost, totalQty, weightedAverage, type Purchase } from "@/lib/nz/stock";
import { $, $$, int, mc, num, pick, r2, type Drill, type Question, type Rng } from "./core";

const ITEMS = [
  { name: "coffee beans", unit: "kg", lo: 30, step: 1 },
  { name: "oat milk", unit: "cartons", lo: 3, step: 0.2 },
  { name: "takeaway cups", unit: "boxes", lo: 60, step: 2 },
];
const DATES = ["3 March", "12 March", "24 March"];

function purchases(rng: Rng) {
  const item = pick(rng, ITEMS);
  const rising = rng() < 0.6;
  const base = item.lo + int(rng, 0, 6) * item.step;
  const steps = [0, int(rng, 1, 3), int(rng, 4, 6)].map((k) => r2(base + k * item.step));
  const prices = rising ? steps : [...steps].reverse();
  const buys: Purchase[] = DATES.map((label, i) => ({ label, qty: int(rng, 2, 8) * 5, price: prices[i] }));
  const closing = int(rng, 1, totalQty(buys) / 5 - 1) * 5;
  return { item, rising, buys, closing };
}

const list = (buys: Purchase[], unit: string) => buys.map((b) => `${b.label}: ${b.qty} ${unit} at ${$(b.price)}`).join("; ");

function stockQuestion(rng: Rng): Question {
  const r = rng();
  const { item, rising, buys, closing } = purchases(rng);
  const setup = `Kōwhai bought ${item.name} in March (${list(buys, item.unit)}). At the stocktake on 31 March, **${closing} ${item.unit}** are left.`;
  const f = fifo(buys, closing);
  const w = weightedAverage(buys, closing);

  // FIFO closing stock
  if (r < 0.25) {
    const kept = f.layers.filter((l) => l.kept > 0);
    return num(`${setup} What's the closing stock value under **FIFO**?`,
      f.closing,
      `FIFO uses the oldest stock first, so the ${closing} ${item.unit} left come from the latest purchases: ${kept.map((l) => `${l.kept} × ${$(l.price)}`).join(" + ")} = **${$(f.closing)}**.`,
      { tolerance: 0.01, hint: "To the cent" });
  }

  // weighted average unit cost
  if (r < 0.4) {
    const exact = totalCost(buys) / totalQty(buys);
    return num(`${setup} What's the **weighted average cost** per ${item.unit === "kg" ? "kg" : item.unit.replace(/s$/, "")}?`,
      r2(exact),
      `Total cost ÷ total quantity: ${$(totalCost(buys))} ÷ ${totalQty(buys)} = **${$(r2(exact))}** each. Every unit, used or left, carries that cost.`,
      { tolerance: 0.01, hint: "To the cent" });
  }

  // weighted average closing stock
  if (r < 0.55) {
    return num(`${setup} What's the closing stock value using **weighted average cost**?`,
      w.closing,
      `Average cost: ${$(totalCost(buys))} ÷ ${totalQty(buys)} = ${$(totalCost(buys) / totalQty(buys))} each (unrounded). Closing stock: ${closing} × that = **${$(w.closing)}**.`,
      { tolerance: Math.max(0.05, closing * 0.005), hint: "To the nearest few cents" });
  }

  // FIFO cost of goods sold
  if (r < 0.65) {
    return num(`${setup} Under **FIFO**, what's the cost of the ${item.name} used in March (cost of goods sold)?`,
      f.cogs,
      `Everything bought cost ${$(totalCost(buys))}. FIFO values what's left at ${$(f.closing)} (the latest prices), so the cost of what was used is ${$(totalCost(buys))} − ${$(f.closing)} = **${$(f.cogs)}**.`,
      { tolerance: 0.01, hint: "To the cent" });
  }

  // which gives the higher profit?
  if (r < 0.78) {
    const higher = f.closing > w.closing ? "FIFO" : f.closing < w.closing ? "Weighted average" : "Neither: they're the same";
    return mc(rng, higher, ["FIFO", "Weighted average", "Neither: they're the same"].filter((x) => x !== higher),
      `${setup} Prices were **${rising ? "rising" : "falling"}**. Which method gives the higher profit for March?`,
      `FIFO leaves the latest (${rising ? "dearest" : "cheapest"}) stock on the shelf: closing stock ${$(f.closing)} under FIFO against ${$(w.closing)} under weighted average. A higher closing stock means a lower cost of goods sold, so **${higher === "FIFO" ? "FIFO" : higher === "Weighted average" ? "weighted average" : "neither"}** gives the higher profit. When prices are ${rising ? "rising" : "falling"}, that's always ${rising ? "FIFO" : "weighted average"}.`);
  }

  // lower of cost and NRV
  if (r < 0.88) {
    const cost = int(rng, 8, 30) * 10;
    const price = r2(cost * pick(rng, [0.4, 0.6, 0.8, 1.2, 1.5]));
    const sellCost = r2(price * pick(rng, [0.05, 0.1, 0.15]));
    const nrv = r2(price - sellCost);
    const value = Math.min(cost, nrv);
    return num(`Some cakes in the freezer cost Kōwhai ${$(cost)} to make. They can now be sold for ${$(price)}, and selling them will cost ${$(sellCost)} (packaging and delivery). What value goes into closing stock?`,
      value,
      `Net realisable value = selling price − selling costs = ${$(price)} − ${$(sellCost)} = ${$(nrv)}. Stock is valued at the **lower of cost (${$(cost)}) and NRV**: **${$(value)}**.${nrv < cost ? " The write-down shows the loss now, not when the cakes are sold." : " Stock is never written up above what it cost."}`,
      { tolerance: 0.01, hint: "To the cent" });
  }

  // can it skip the count?
  const lv = TRADING_STOCK.lowValue;
  const sales = pick(rng, [450_000, 900_000, 1_250_000, 1_300_000, 1_400_000, 2_500_000]);
  const stock = pick(rng, [4_000, 8_500, 9_800, 12_000, 15_000]);
  const ok = sales <= lv.turnoverUpTo && stock < lv.stockEstimateUnder;
  const yes = "Yes: it can keep last year's stock value", no = "No: it must value its closing stock";
  return mc(rng, ok ? yes : no, [ok ? no : yes],
    `A café has turnover of ${$$(sales)} this year and reasonably estimates its closing stock at ${$$(stock)}. Under IRD's low value trading stock rule, can it skip valuing its stock at year end?`,
    `The rule needs **both**: turnover of ${$$(lv.turnoverUpTo)} or less and a reasonable estimate of closing stock under ${$$(lv.stockEstimateUnder)}. ${ok ? "Both are met, so closing stock can stay at its opening value, with no count." : `${sales > lv.turnoverUpTo ? `Turnover of ${$$(sales)} is too high` : `Stock of ${$$(stock)} is too much`}, so it has to value its stock.`}`);
}

export const STOCK_DRILLS: Drill[] = [
  { key: "stock-valuation", group: "calculate", part: 3, title: "Valuing stock", icon: "📦", blurb: "FIFO and weighted average, which gives the higher profit, lower of cost and NRV, and IRD's low value stock rule.", learn: { href: "/nz/inventory", label: "Inventory & trading stock" }, make: stockQuestion },
];
