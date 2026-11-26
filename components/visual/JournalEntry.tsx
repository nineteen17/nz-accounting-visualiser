"use client";

import { motion } from "motion/react";
import { account } from "@/data/chartOfAccounts";
import type { Transaction } from "@/lib/engine/types";
import { totals } from "@/lib/engine/ledger";
import { nzDate, num } from "@/lib/money";
import { TYPE_STYLE, cx } from "@/lib/ui";

const BOOK_LABEL: Record<string, string> = {
  general: "General journal",
  sales: "Sales journal",
  purchases: "Purchases journal",
  "cash-receipts": "Cash receipts journal",
  "cash-payments": "Cash payments journal",
  payroll: "Payroll journal",
};

export function AccountTag({ code, small }: { code: string; small?: boolean }) {
  const a = account(code);
  const s = TYPE_STYLE[a.type];
  return (
    <span className={cx("inline-flex items-center gap-1.5", small ? "text-xs" : "text-sm")}>
      <span className={cx("num rounded px-1.5 py-0.5 text-[11px] font-semibold text-white", s.bg)}>{a.code}</span>
      <span>{a.name}</span>
    </span>
  );
}

/** A journal entry in the classic layout: credits indented under debits */
export function JournalEntry({ txn, animate, showWhy }: { txn: Transaction; animate?: boolean; showWhy?: boolean }) {
  const t = totals(txn);
  const ordered = [...txn.lines.filter((l) => l.debit), ...txn.lines.filter((l) => l.credit)];
  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-600">
        <span className="font-semibold uppercase tracking-wider">{BOOK_LABEL[txn.book]}</span>
        <span className="num">Ref {txn.id} · {nzDate(txn.date)}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-500">
            <th className="px-4 py-2 font-semibold">Account</th>
            <th className="w-28 px-3 py-2 text-right font-semibold">Debit (Dr)</th>
            <th className="w-28 px-4 py-2 text-right font-semibold">Credit (Cr)</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((l, i) => (
            <motion.tr
              key={i}
              className="border-b border-stone-100 align-top"
              initial={animate ? { opacity: 0, x: -12 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: animate ? i * 0.25 : 0 }}
            >
              <td className={cx("px-4 py-2", l.credit && "pl-10")}>
                <AccountTag code={l.account} />
                {l.memo && <div className="mt-0.5 text-xs text-stone-500">{l.memo}{l.party && !l.memo.includes(l.party) ? ` · ${l.party}` : ""}</div>}
                {!l.memo && l.party && <div className="mt-0.5 text-xs text-stone-500">{l.party}</div>}
                {showWhy && l.why && <div className="mt-1 rounded bg-kowhai-50 px-2 py-1 text-xs leading-snug text-stone-700">{l.why}</div>}
              </td>
              <td className="num px-3 py-2 text-right">{l.debit ? num(l.debit) : ""}</td>
              <td className="num px-4 py-2 text-right">{l.credit ? num(l.credit) : ""}</td>
            </motion.tr>
          ))}
          <tr className="bg-stone-50 font-semibold">
            <td className="px-4 py-2 text-right text-xs uppercase tracking-wider text-stone-500">Totals</td>
            <td className="num border-t-2 border-double border-stone-400 px-3 py-2 text-right">{num(t.debit)}</td>
            <td className="num border-t-2 border-double border-stone-400 px-4 py-2 text-right">{num(t.credit)}</td>
          </tr>
        </tbody>
      </table>
      <div className="border-t border-stone-200 px-4 py-2 text-xs italic text-stone-600">Narration: {txn.title}</div>
    </div>
  );
}
