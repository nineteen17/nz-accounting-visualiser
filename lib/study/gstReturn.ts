/**
 * "Do the GST return yourself": a period's transactions to sort into the GST101A, then the boxes to fill in,
 * marked against the learner's own sorting and against Kōwhai's real return (lib/engine/gst.ts). Plan: docs/GST-RETURN.md.
 */
import { gstReturn, type GstPeriod, type GstReturn } from "@/lib/engine/gst";
import type { Transaction } from "@/lib/engine/types";

export type Place = "sale" | "purchase" | "debit-adj" | "credit-adj" | "none";
export const PLACES: { key: Place; label: string; box: string; answer: string }[] = [
  { key: "sale", label: "Sale", box: "Box 5", answer: "a sale (Box 5)" },
  { key: "purchase", label: "Purchase", box: "Box 11", answer: "a purchase (Box 11)" },
  { key: "debit-adj", label: "Extra GST to pay", box: "Box 9", answer: "extra GST to pay (Box 9)" },
  { key: "credit-adj", label: "GST to claim back", box: "Box 13", answer: "GST to claim back (Box 13)" },
  { key: "none", label: "Not in the return", box: "", answer: "not in the return" },
];

export type Item = {
  id: string;
  date: string;
  title: string;
  story?: string;
  /** what the learner sees: the amount including GST for a sale or purchase, the GST itself for an adjustment, the transaction total otherwise */
  amount: number;
  place: Place;
  /** the GST in it (0 when not in the return) */
  gst: number;
  why: string;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const total = (t: Transaction) => r2(t.lines.reduce((s, l) => s + (l.debit ?? 0), 0));
const has = (t: Transaction, ...codes: string[]) => t.lines.some((l) => codes.includes(l.account));

/** why a transaction stays out of the return, by the accounts it touches (first match wins) */
const NOT_IN: { kind: string; test: (t: Transaction) => boolean; why: string }[] = [
  { kind: "wages", test: (t) => has(t, "600", "601") && has(t, "100", "215"), why: "Wages: working for an employer isn't a taxable activity (GST Act s 6(3)(b)), so a pay run has no GST." },
  { kind: "paye", test: (t) => has(t, "215") && has(t, "100"), why: "Paying PAYE and deductions to IRD is paying over tax, not buying anything." },
  { kind: "gst-paid", test: (t) => has(t, "210") && has(t, "100"), why: "Paying GST to IRD (or getting a refund) is the result of an earlier return, not part of this one." },
  { kind: "income-tax", test: (t) => has(t, "141", "230", "690"), why: "Income tax and provisional tax are tax payments, not purchases." },
  { kind: "dividend", test: (t) => has(t, "216") || (has(t, "310") && has(t, "240", "241")), why: "A dividend shares out profit to the owners. Nothing is supplied, so there's no GST." },
  { kind: "drawings", test: (t) => has(t, "240", "241") && has(t, "100"), why: "Drawings: the owners taking money the company owes them. No supply, no GST." },
  { kind: "shares", test: (t) => has(t, "300"), why: "Shareholders paying for shares put capital in. Issuing shares is an exempt financial service, so it's not a sale." },
  { kind: "loan", test: (t) => has(t, "250"), why: "Borrowing or repaying a loan isn't a supply, and the interest is an exempt financial service (s 14): no GST either way." },
  { kind: "interest", test: (t) => has(t, "450", "140"), why: "Interest earned is an exempt financial service (s 14), so it stays out of Box 5." },
  { kind: "card-settlement", test: (t) => has(t, "110") && has(t, "622"), why: "The bank paying out card sales: the sales were counted when they were made. The merchant fee it keeps is charged without GST here (an exempt financial service), so there's nothing to claim." },
  { kind: "bank-fees", test: (t) => has(t, "621", "622"), why: "Bank and card fees are charged as exempt financial services here, so there's no GST to claim." },
  { kind: "supplier-paid", test: (t) => has(t, "200") && has(t, "100"), why: "Paying a supplier's invoice: on the invoice basis the GST was claimed in the period the invoice arrived, not when it's paid." },
  { kind: "customer-paid", test: (t) => has(t, "120") && has(t, "100", "110"), why: "A customer paying an invoice: on the invoice basis the GST was counted when the invoice was issued." },
  { kind: "own-money", test: (t) => has(t, "115", "105", "110"), why: "Moving the café's own money between accounts (bank, till, term deposit, card settlements) isn't a supply." },
  { kind: "bond", test: (t) => has(t, "150"), why: "A lease bond is a deposit held as security, not payment for anything, so there's no GST on it." },
  { kind: "journal", test: () => true, why: "A journal (an accrual, reversal, depreciation or stock entry) isn't a dealing with anyone. Any GST is on the real invoice, in the period it's dated." },
];
export const notInReason = (t: Transaction) => NOT_IN.find((k) => k.test(t))!;

export type Exercise = {
  key: string;
  year: string;
  period: GstPeriod;
  items: Item[];
  real: GstReturn;
  /** a refund or adjustments make it harder */
  level: "simpler" | "harder";
  tags: string[];
};

/**
 * The period's GST transactions, plus up to `distractors` without GST (one of each kind, the earliest of each),
 * in date order.
 */
export function buildExercise(key: string, year: string, txns: Transaction[], period: GstPeriod, distractors = 8): Exercise {
  const real = gstReturn(txns, period);
  const items = new Map<string, Item>();
  const add = (t: Transaction, place: Place, gst: number, why: string) => {
    const prev = items.get(t.id);
    const g = r2((prev?.gst ?? 0) + gst);
    const amount = place === "debit-adj" || place === "credit-adj" ? g : r2((g * 23) / 3);
    items.set(t.id, { id: t.id, date: t.date, title: t.title, story: t.story, amount, place, gst: g, why });
  };
  for (const l of real.outputLines) add(l.txn, "sale", l.gst, "A sale with GST: the amount including GST goes in Box 5.");
  for (const l of real.inputLines) add(l.txn, "purchase", l.gst, "A purchase with GST to claim: the amount including GST goes in Box 11.");
  for (const a of real.adjustments) add(a.txn, a.type === "debit" ? "debit-adj" : "credit-adj", a.gst,
    a.type === "debit" ? "A debit adjustment: extra GST to pay, entered as the GST amount in Box 9." : "A credit adjustment: GST to claim back, entered as the GST amount in Box 13 (e.g. the GST on a bad debt written off, GST Act s 26).");

  const seen = new Set<string>();
  const others = txns
    .filter((t) => t.date >= period.from && t.date <= period.to && !items.has(t.id) && total(t) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const t of others) {
    if (seen.size >= distractors) break;
    const k = notInReason(t);
    if (seen.has(k.kind)) continue;
    seen.add(k.kind);
    items.set(t.id, { id: t.id, date: t.date, title: t.title, story: t.story, amount: total(t), place: "none", gst: 0, why: k.why });
  }

  const list = [...items.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const tags = [real.box15 < 0 ? "refund" : "", real.adjustments.length ? "adjustments" : ""].filter(Boolean);
  return { key, year, period, items: list, real, level: tags.length ? "harder" : "simpler", tags };
}

export type Boxes = { box5: number; box6: number; box7: number; box8: number; box9: number; box10: number; box11: number; box12: number; box13: number; box14: number; box15: number };

/** the return a sorting leads to, worked out the way the form does it (Box 8 = Box 7 × 3/23) */
export function boxesFor(items: Item[], sort: Record<string, Place>): Boxes {
  // each item counts at the amount shown on it, in whichever box the learner put it
  const sum = (p: Place) => r2(items.filter((i) => sort[i.id] === p).reduce((s, i) => s + i.amount, 0));
  const box5 = sum("sale"), box6 = 0, box7 = r2(box5 - box6);
  const box8 = r2((box7 * 3) / 23), box9 = sum("debit-adj"), box10 = r2(box8 + box9);
  const box11 = sum("purchase"), box12 = r2((box11 * 3) / 23), box13 = sum("credit-adj"), box14 = r2(box12 + box13);
  return { box5, box6, box7, box8, box9, box10, box11, box12, box13, box14, box15: r2(box10 - box14) };
}

/** the right sorting */
export const answerKey = (ex: Exercise) => Object.fromEntries(ex.items.map((i) => [i.id, i.place])) as Record<string, Place>;

/** the boxes the learner types, in the form's order */
export const ENTER: (keyof Boxes)[] = ["box5", "box6", "box8", "box9", "box11", "box12", "box13", "box15"];

/** a typed box is right if it matches the learner's own sorting to the cent (Box 15: the size; pay or refund is asked separately) */
export function markBox(key: keyof Boxes, typed: number | null, own: Boxes) {
  if (typed === null || Number.isNaN(typed)) return false;
  const want = key === "box15" ? Math.abs(own.box15) : own[key];
  return Math.abs(typed - want) < 0.015;
}

/* progress on this device: the best result per period */
export const PROGRESS_KEY = "gst-return-v1";
export type Progress = Record<string, { sorted: number; of: number; boxes: number; done: string }>;
type Store = Pick<Storage, "getItem" | "setItem">;
export function loadProgress(store: Store | undefined): Progress {
  try { return JSON.parse(store?.getItem(PROGRESS_KEY) ?? "{}") as Progress; } catch { return {}; }
}
export function saveProgress(store: Store | undefined, key: string, result: Progress[string]) {
  const all = loadProgress(store);
  const prev = all[key];
  // keep the better attempt: more sorted right, then more boxes right
  if (!prev || result.sorted > prev.sorted || (result.sorted === prev.sorted && result.boxes >= prev.boxes)) all[key] = result;
  store?.setItem(PROGRESS_KEY, JSON.stringify(all));
  return all;
}
