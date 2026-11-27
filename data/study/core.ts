/**
 * Shared types and helpers for study drills. See docs/STUDY.md for how the study tool fits together.
 *
 * A drill makes questions with `make(rng)`. There are three kinds of question:
 * - choice: pick one option
 * - number: type an amount or a percentage
 * - entry:  build a journal entry (accounts, debit/credit, amounts)
 */
import type { SourceDoc } from "@/lib/engine/types";

export type Rng = () => number;

interface Base {
  /** what's being asked; supports **bold** and [[glossary]] links */
  prompt: string;
  /** why the answer is right (and the trap in the wrong ones) */
  explain: string;
}

export interface ChoiceQ extends Base {
  kind: "choice";
  options: string[];
  answer: number;
}

export interface NumberQ extends Base {
  kind: "number";
  answer: number;
  unit: "$" | "%" | "";
  /** how far off an answer can be and still count, e.g. 0.01 for cents */
  tolerance: number;
  /** shown under the input, e.g. "to the cent" */
  hint?: string;
}

export interface EntryLine {
  account: string;
  side: "debit" | "credit";
  amount: number;
  why?: string;
}

export interface EntryQ extends Base {
  kind: "entry";
  date: string;
  story: string;
  doc?: SourceDoc;
  /** account codes to choose from (the right ones plus likely mix-ups), in chart order */
  options: string[];
  lines: EntryLine[];
  /** false when some amounts must be added up (e.g. a month's sales): the amounts are then shown up front */
  amountsGiven: boolean;
}

export type Question = ChoiceQ | NumberQ | EntryQ;

export type DrillGroup = "record" | "calculate" | "classify" | "nz";
export const DRILL_GROUPS: Record<DrillGroup, { title: string; blurb: string }> = {
  record: { title: "Record it", blurb: "Write the journal entries, the core skill of bookkeeping." },
  calculate: { title: "Work it out", blurb: "Type the answer. The working is shown afterwards." },
  classify: { title: "Sort it", blurb: "Quick questions about where things belong." },
  nz: { title: "NZ dates & words", blurb: "Due dates and what the terms mean." },
};

export interface Drill {
  key: string;
  title: string;
  icon: string;
  blurb: string;
  part: 1 | 2 | 3 | 4;
  group: DrillGroup;
  learn: { href: string; label: string };
  /** questions per run (default 10) */
  length?: number;
  make: (rng: Rng) => Question;
}

export const pick = <T,>(rng: Rng, xs: readonly T[]) => xs[Math.floor(rng() * xs.length)];
export const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
export function shuffle<T>(rng: Rng, xs: readonly T[]) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** a multiple-choice question with the right answer placed at random */
export function mc(rng: Rng, correct: string, wrong: string[], prompt: string, explain: string): ChoiceQ {
  const options = shuffle(rng, [correct, ...wrong.filter((w, i) => w !== correct && wrong.indexOf(w) === i)]);
  return { kind: "choice", prompt, options, answer: options.indexOf(correct), explain };
}

/** a typed-amount question */
export function num(prompt: string, answer: number, explain: string, opts: { unit?: NumberQ["unit"]; tolerance?: number; hint?: string } = {}): NumberQ {
  const unit = opts.unit ?? "$";
  return { kind: "number", prompt, answer, explain, unit, tolerance: opts.tolerance ?? (unit === "$" ? 0.01 : 0.1), hint: opts.hint ?? (unit === "$" ? "To the cent" : undefined) };
}

export const r2 = (n: number) => Math.round(n * 100) / 100;
export const $ = (n: number) => `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** whole dollars when there are no cents */
export const $$ = (n: number) => (Math.abs(n - Math.round(n)) < 0.005 ? `$${Math.round(n).toLocaleString("en-NZ")}` : $(n));
export const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;
export const article = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");
export const nzDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** read a typed answer such as "$1,234.50", "1234.5", "70.3%" or "-150" */
export function parseAnswer(s: string): number | null {
  const t = s.replace(/[\s$,%]/g, "").replace(/^\((.*)\)$/, "-$1").replace("−", "-");
  if (!/^-?\d*\.?\d+$/.test(t)) return null;
  return Number(t);
}

export function isRight(q: NumberQ, typed: string) {
  const v = parseAnswer(typed);
  return v !== null && Math.abs(v - q.answer) <= q.tolerance + 1e-9;
}

export function formatAnswer(q: NumberQ) {
  if (q.unit === "$") return $(q.answer);
  if (q.unit === "%") return `${q.answer}%`;
  return String(q.answer);
}
