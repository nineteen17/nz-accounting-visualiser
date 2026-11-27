/**
 * Valuing closing stock when the price paid changes through the period: FIFO and weighted average.
 * (LIFO isn't allowed under NZ IFRS or for NZ tax.)
 */
import { r2 } from "@/lib/money";

export interface Purchase { label: string; qty: number; price: number }

export const totalQty = (buys: Purchase[]) => buys.reduce((s, b) => s + b.qty, 0);
export const totalCost = (buys: Purchase[]) => r2(buys.reduce((s, b) => s + b.qty * b.price, 0));

/** FIFO: the oldest stock is used first, so what's left is from the newest purchases */
export function fifo(buys: Purchase[], closingQty: number) {
  let left = closingQty;
  const layers: (Purchase & { kept: number })[] = [];
  for (const b of [...buys].reverse()) {
    const kept = Math.min(left, b.qty);
    left -= kept;
    layers.unshift({ ...b, kept });
  }
  const closing = r2(layers.reduce((s, l) => s + l.kept * l.price, 0));
  return { layers, closing, cogs: r2(totalCost(buys) - closing) };
}

/** weighted average: every unit costs the same, the total cost ÷ the total quantity */
export function weightedAverage(buys: Purchase[], closingQty: number) {
  const unit = totalCost(buys) / totalQty(buys);
  const closing = r2(closingQty * unit);
  return { unit: r2(unit), closing, cogs: r2(totalCost(buys) - closing) };
}

/** stock is valued at the lower of cost and net realisable value (what it can be sold for, less selling costs) */
export const lowerOfCostAndNrv = (cost: number, nrv: number) => Math.min(cost, nrv);

/** the March coffee-bean example used on the inventory page and in the glossary (prices rising) */
export const BEAN_EXAMPLE: Purchase[] = [
  { label: "1 Mar", qty: 20, price: 36 },
  { label: "10 Mar", qty: 30, price: 38 },
  { label: "20 Mar", qty: 25, price: 40 },
];
