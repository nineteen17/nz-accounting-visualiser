import { ACCOUNTS, ACCOUNT_MAP, account } from "@/data/chartOfAccounts";
import type { Account, JournalLine, Transaction } from "./types";

/** cents helpers – all engine maths is done in integer cents */
const c = (x = 0) => Math.round(x * 100);
const d = (cents: number) => cents / 100;

export const lineNet = (l: JournalLine) => c(l.debit) - c(l.credit);

export function isBalanced(t: Transaction) {
  return t.lines.reduce((a, l) => a + lineNet(l), 0) === 0;
}

export function totals(t: Transaction) {
  const dr = t.lines.reduce((a, l) => a + c(l.debit), 0);
  const cr = t.lines.reduce((a, l) => a + c(l.credit), 0);
  return { debit: d(dr), credit: d(cr) };
}

export type Balances = Record<string, number>; // net DEBIT balance in dollars (credit balances negative)

/** Net debit balance for every account after applying `txns` */
export function balances(txns: Transaction[]): Balances {
  const b: Record<string, number> = {};
  for (const a of ACCOUNTS) b[a.code] = 0;
  for (const t of txns) for (const l of t.lines) b[l.account] = (b[l.account] ?? 0) + lineNet(l);
  const out: Balances = {};
  for (const k in b) out[k] = d(b[k]);
  return out;
}

/** Balance expressed on the account's normal side (positive = normal) */
export function normalBalance(a: Account, netDebit: number) {
  return a.normal === "debit" ? netDebit : -netDebit;
}

/** "Natural" sign for statements: assets/expenses positive when debit, others positive when credit.
 *  Contra assets (accumulated depreciation) come out negative. */
export function natural(a: Account, netDebit: number) {
  return a.type === "asset" || a.type === "expense" ? netDebit : -netDebit;
}

export interface TBRow {
  account: Account;
  debit: number;
  credit: number;
}

export function trialBalance(b: Balances): { rows: TBRow[]; debit: number; credit: number } {
  const rows: TBRow[] = [];
  let dr = 0;
  let cr = 0;
  for (const a of ACCOUNTS) {
    const v = c(b[a.code]);
    if (v === 0) continue;
    rows.push({ account: a, debit: v > 0 ? d(v) : 0, credit: v < 0 ? d(-v) : 0 });
    if (v > 0) dr += v;
    else cr -= v;
  }
  return { rows, debit: d(dr), credit: d(cr) };
}

export interface Equation {
  assets: number;
  liabilities: number;
  capital: number; // share capital + retained earnings (+ income summary)
  income: number;
  expenses: number;
  profit: number;
  equity: number; // capital + profit
}

export function equation(b: Balances): Equation {
  let A = 0, L = 0, E = 0, I = 0, X = 0;
  for (const a of ACCOUNTS) {
    const v = c(b[a.code]);
    if (a.type === "asset") A += v;
    else if (a.type === "liability") L -= v;
    else if (a.type === "equity") E -= v;
    else if (a.type === "income") I -= v;
    else X += v;
  }
  return { assets: d(A), liabilities: d(L), capital: d(E), income: d(I), expenses: d(X), profit: d(I - X), equity: d(E + I - X) };
}

export interface LedgerRow {
  txn: Transaction;
  line: JournalLine;
  debit: number;
  credit: number;
  balance: number; // running, on normal side
  contra: string; // the other account(s)
}

/** General ledger for one account (optionally filtered to a party for subsidiary ledgers) */
export function ledger(txns: Transaction[], code: string, party?: string): LedgerRow[] {
  const a = account(code);
  let run = 0;
  const rows: LedgerRow[] = [];
  for (const t of txns) {
    for (const l of t.lines) {
      if (l.account !== code) continue;
      if (party && l.party !== party) continue;
      run += lineNet(l);
      const others = Array.from(new Set(t.lines.filter((o) => o.account !== code && Math.sign(lineNet(o)) !== Math.sign(lineNet(l))).map((o) => ACCOUNT_MAP[o.account].name)));
      rows.push({
        txn: t,
        line: l,
        debit: l.debit ?? 0,
        credit: l.credit ?? 0,
        balance: normalBalance(a, d(run)),
        contra: others.length > 2 ? `${others[0]} + ${others.length - 1} more` : others.join(", "),
      });
    }
  }
  return rows;
}

/** Parties appearing in an account (for subsidiary ledgers) */
export function parties(txns: Transaction[], code: string) {
  const s = new Set<string>();
  for (const t of txns) for (const l of t.lines) if (l.account === code && l.party) s.add(l.party);
  return Array.from(s);
}

export const byDate = (a: Transaction, b: Transaction) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

export function upTo(txns: Transaction[], iso: string) {
  return txns.filter((t) => t.date <= iso);
}

export function sumAccounts(b: Balances, pred: (a: Account) => boolean) {
  return d(ACCOUNTS.filter(pred).reduce((acc, a) => acc + c(natural(a, b[a.code])), 0));
}
