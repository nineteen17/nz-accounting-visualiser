import type { Transaction } from "./types";

const c = (x = 0) => Math.round(x * 100);
const d = (x: number) => x / 100;

export interface BankItem {
  txn: Transaction;
  amount: number; // + into bank, - out
  bookDate: string;
  bankDate: string;
}

/** Everything that touched account 100 */
export function bankItems(txns: Transaction[]): BankItem[] {
  const out: BankItem[] = [];
  for (const t of txns) {
    const amt = t.lines.filter((l) => l.account === "100").reduce((s, l) => s + c(l.debit) - c(l.credit), 0);
    if (amt === 0) continue;
    out.push({ txn: t, amount: d(amt), bookDate: t.date, bankDate: t.bankDate ?? t.date });
  }
  return out;
}

/** Year-end bank reconciliation for a month */
export function bankReconciliation(txns: Transaction[], from: string, to: string) {
  const items = bankItems(txns);
  // Cashbook = what the café had recorded BEFORE looking at the statement
  const cashbookItems = items.filter((i) => !i.txn.foundInBankRec);
  const cashbookOpening = d(cashbookItems.filter((i) => i.bookDate < from).reduce((s, i) => s + c(i.amount), 0));
  const cashbookMonth = cashbookItems.filter((i) => i.bookDate >= from && i.bookDate <= to);
  const cashbookClosing = d(c(cashbookOpening) + cashbookMonth.reduce((s, i) => s + c(i.amount), 0));

  // Bank statement = what the bank processed (by bank date)
  const statementOpening = d(items.filter((i) => i.bankDate < from).reduce((s, i) => s + c(i.amount), 0));
  const statementMonth = items.filter((i) => i.bankDate >= from && i.bankDate <= to);
  const statementClosing = d(c(statementOpening) + statementMonth.reduce((s, i) => s + c(i.amount), 0));

  const bankOnly = statementMonth.filter((i) => i.txn.foundInBankRec);
  const depositsInTransit = cashbookMonth.filter((i) => i.amount > 0 && i.bankDate > to);
  const unpresented = cashbookMonth.filter((i) => i.amount < 0 && i.bankDate > to);
  const adjustedCashbook = d(c(cashbookClosing) + bankOnly.reduce((s, i) => s + c(i.amount), 0));
  const reconciled = d(
    c(statementClosing) + depositsInTransit.reduce((s, i) => s + c(i.amount), 0) + unpresented.reduce((s, i) => s + c(i.amount), 0),
  );
  return {
    cashbookOpening, cashbookMonth, cashbookClosing,
    statementOpening, statementMonth, statementClosing,
    bankOnly, depositsInTransit, unpresented,
    adjustedCashbook, reconciled,
    ok: c(adjustedCashbook) === c(reconciled),
  };
}
