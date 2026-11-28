/**
 * "Do the company tax return yourself": sort the year's items into tax adjustments, work out taxable income,
 * fill in the IR4's boxes, and answer the dates. Each box is marked against the learner's own earlier boxes,
 * so one slip doesn't make everything after it wrong. Plan: docs/IR4.md. Data: data/study/ir4.ts.
 */
import { r2 } from "@/lib/money";
import { COMPANY_TAX_RATE, PROVISIONAL_TAX } from "@/lib/nz/rates";
import type { Ir4, Ir4BoxKey } from "@/lib/engine/ir4";

export type Dir = "add" | "deduct" | "none";
export const DIRS: { key: Dir; label: string; answer: string }[] = [
  { key: "add", label: "Add back", answer: "added back" },
  { key: "deduct", label: "Deduct", answer: "deducted" },
  { key: "none", label: "No adjustment", answer: "no adjustment" },
];

/** one item from the year: a real tax adjustment, or one that needs none */
export type AdjItem = { id: string; title: string; amount: number; dir: Dir; why: string };

/** a question about dates and what the return means */
export type DateQ = { id: string; q: string; options: string[]; answer: number; why: string };

export type Ir4Exercise = {
  key: string;
  year: string;
  title: string;
  blurb: string;
  level: "simpler" | "harder";
  /** accounting profit before tax, from the statements */
  profitBeforeTax: number;
  items: AdjItem[];
  ret: Ir4;
  questions: DateQ[];
};

/** taxable income from a sorting: profit + everything sorted as "add back" − everything sorted as "deduct" */
export function taxableFrom(ex: Ir4Exercise, sort: Record<string, Dir>) {
  const sum = (d: Dir) => ex.items.filter((i) => sort[i.id] === d).reduce((s, i) => s + i.amount, 0);
  return r2(ex.profitBeforeTax + sum("add") - sum("deduct"));
}

export const answerKey = (ex: Ir4Exercise) => Object.fromEntries(ex.items.map((i) => [i.id, i.dir])) as Record<string, Dir>;

/** the boxes the learner fills in, grouped as on the form. "40B:0" is the first shareholder's Box 40B. */
export type EntryKey = Ir4BoxKey | `40B:${number}` | `40E:${number}`;

export function entryGroups(ex: Ir4Exercise): { title: string; keys: EntryKey[] }[] {
  const sh = ex.ret.shareholders.map((_, i) => i);
  return [
    { title: "Income (Questions 13 to 29)", keys: ["13A", "13B", "17A", "20B", "29"] },
    { title: "Tax calculation (Question 30)", keys: ["30A", "30B", "30I", "30J", "30K", "30L"] },
    { title: `${ex.ret.year + 1} provisional tax (Question 33)`, keys: ["33B"] },
    { title: "Shareholder details (Question 40)", keys: [...sh.map((i) => `40B:${i}` as const), ...sh.map((i) => `40E:${i}` as const)] },
    { title: "Annual imputation return (Questions 41 to 44)", keys: ["41", "42A", "42B", "43B", "44"] },
  ];
}

/** "$1,234.50" or "1234.5" → 1234.5; blank or nonsense → null */
export function readAmount(s: string | undefined) {
  if (s === undefined) return null;
  const t = s.replace(/[$,\s]/g, "");
  if (t === "" || !/^-?\d*\.?\d*$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * What each box should hold, given the learner's own taxable income (step 1) and their own earlier boxes.
 * Boxes that come straight from the records (interest, provisional tax paid, salaries, the ICA) are fixed.
 */
export function expected(ex: Ir4Exercise, ownTaxable: number, typed: Partial<Record<EntryKey, string>>): Record<EntryKey, number> {
  const b = ex.ret.boxes;
  const want = {} as Record<EntryKey, number>;
  const got = (k: EntryKey) => readAmount(typed[k]) ?? want[k];
  want["13A"] = b["13A"];
  want["13B"] = b["13B"];
  want["17A"] = got("13A");
  want["20B"] = r2(ownTaxable - got("13B"));
  want["29"] = r2(got("13B") + got("20B"));
  want["30A"] = Math.floor(got("29") + 1e-9);
  want["30B"] = r2(got("30A") * COMPANY_TAX_RATE);
  want["30I"] = got("17A");
  want["30J"] = r2(got("30B") - got("30I"));
  want["30K"] = b["30K"];
  want["30L"] = r2(Math.abs(got("30J") - got("30K")));
  want["33B"] = Math.floor(got("30J") * (1 + PROVISIONAL_TAX.standardUplift) + 1e-9);
  ex.ret.shareholders.forEach((s, i) => { want[`40B:${i}`] = s.salary; want[`40E:${i}`] = s.currentAccount; });
  want["41"] = b["41"];
  want["42A"] = b["42A"];
  want["42B"] = b["42B"];
  want["43B"] = b["43B"];
  want["44"] = r2(got("41") + got("42A") + got("42B") - got("43B"));
  return want;
}

/** is 30L tax to pay, by the learner's own 30J and 30K? */
export function ownPay(ex: Ir4Exercise, ownTaxable: number, typed: Partial<Record<EntryKey, string>>) {
  const w = expected(ex, ownTaxable, typed);
  const j = readAmount(typed["30J"]) ?? w["30J"];
  const k = readAmount(typed["30K"]) ?? w["30K"];
  return j - k >= 0;
}

export const isRight = (typed: string | undefined, want: number) => {
  const n = readAmount(typed);
  return n !== null && Math.abs(n - want) < 0.015;
};

/* progress on this device: the best result per return */
export const PROGRESS_KEY = "ir4-v1";
export type Progress = Record<string, { sorted: number; of: number; boxes: number; ofBoxes: number; dates: number; done: string }>;
type Store = Pick<Storage, "getItem" | "setItem">;
export function loadProgress(store: Store | undefined): Progress {
  try { return JSON.parse(store?.getItem(PROGRESS_KEY) ?? "{}") as Progress; } catch { return {}; }
}
export function saveProgress(store: Store | undefined, key: string, result: Progress[string]) {
  const all = loadProgress(store);
  const prev = all[key];
  const score = (r: Progress[string]) => r.sorted + r.boxes + r.dates;
  if (!prev || score(result) >= score(prev)) all[key] = result;
  store?.setItem(PROGRESS_KEY, JSON.stringify(all));
  return all;
}
