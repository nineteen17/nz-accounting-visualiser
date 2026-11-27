/**
 * "Do the year-end yourself": start from Kōwhai's real unadjusted trial balance, post each of the
 * year's real adjustments in order, and see your own adjusted trial balance and profit beside the
 * real ones. The entries are the books' own (data/books), turned into questions by entryQuestion.
 */
import * as Y1 from "@/data/books";
import * as Y2 from "@/data/books/year2";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { balances, type Balances } from "@/lib/engine/ledger";
import type { Transaction } from "@/lib/engine/types";
import { r2 } from "@/lib/money";
import { seeded, type EntryLine, type EntryQ } from "./core";
import { entryQuestion, netLines } from "./entries";

export interface YearEnd {
  key: "y1" | "y2";
  label: string;
  date: string;
  /** balances before any year-end adjustment */
  unadjusted: Balances;
  steps: { txn: Transaction; q: EntryQ }[];
  /** the real figures, to compare with at the end */
  profitBeforeTax: number;
  netProfit: number;
}

function build(key: YearEnd["key"], label: string, date: string, before: Transaction[], adjustments: Transaction[], profitBeforeTax: number, netProfit: number): YearEnd {
  const steps = adjustments
    .filter((t) => netLines(t).length >= 2)
    // the same seed every time, so the account choices don't move between visits
    .map((txn, i) => ({ txn, q: entryQuestion(seeded(1000 + i), txn) }));
  return { key, label, date, unadjusted: balances(before), steps, profitBeforeTax, netProfit };
}

export const YEAR_ENDS: YearEnd[] = [
  build("y1", "Year 1", "2027-03-31", Y1.DURING_YEAR, Y1.ADJUSTMENTS, Y1.PROFIT_BEFORE_TAX, Y1.NET_PROFIT),
  build("y2", "Year 2", "2028-03-31", [Y2.OPENING_ENTRY, ...Y2.DURING_YEAR], Y2.ADJUSTMENTS, Y2.PROFIT_BEFORE_TAX, Y2.NET_PROFIT),
];

/** add entry lines to a set of balances (debits positive, credits negative, like the ledger) */
export function post(b: Balances, lines: EntryLine[]): Balances {
  const out = { ...b };
  for (const l of lines) out[l.account] = r2((out[l.account] ?? 0) + (l.side === "debit" ? l.amount : -l.amount));
  return out;
}

const INCOME_EXPENSE = ACCOUNTS.filter((a) => a.type === "income" || a.type === "expense");

/** profit from a set of balances: income (credits) less expenses (debits) */
export function profitOf(b: Balances, opts: { beforeTax?: boolean } = {}) {
  return r2(-INCOME_EXPENSE.filter((a) => !(opts.beforeTax && a.code === "690")).reduce((s, a) => s + (b[a.code] ?? 0), 0));
}

/** debits and credits of a trial balance */
export function totals(b: Balances) {
  let dr = 0, cr = 0;
  for (const v of Object.values(b)) {
    if (v > 0) dr += v;
    else cr -= v;
  }
  return { dr: r2(dr), cr: r2(cr) };
}

/** how an entry changes profit (before tax): + raises it, − lowers it */
export const profitEffect = (lines: EntryLine[]) => r2(profitOf(post({}, lines), { beforeTax: true }));
