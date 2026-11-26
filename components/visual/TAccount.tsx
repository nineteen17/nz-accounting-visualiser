"use client";

import { motion } from "motion/react";
import { account } from "@/data/chartOfAccounts";
import type { Transaction } from "@/lib/engine/types";
import { lineNet } from "@/lib/engine/ledger";
import { nzDate, num } from "@/lib/money";
import { TYPE_STYLE, cx } from "@/lib/ui";

interface Entry {
  id: string;
  date: string;
  label: string;
  amount: number;
}

/** A T-account built from transactions. `highlight` marks entries from one transaction. */
export function TAccount({ code, txns, highlight, maxRows = 8, title }: { code: string; txns: Transaction[]; highlight?: string; maxRows?: number; title?: string }) {
  const a = account(code);
  const s = TYPE_STYLE[a.type];
  const dr: Entry[] = [];
  const cr: Entry[] = [];
  for (const t of txns) {
    for (const l of t.lines) {
      if (l.account !== code) continue;
      const e = { id: t.id, date: t.date, label: t.title, amount: l.debit ?? l.credit ?? 0 };
      (l.debit ? dr : cr).push(e);
    }
  }
  const net = txns.reduce((acc, t) => acc + t.lines.filter((l) => l.account === code).reduce((x, l) => x + lineNet(l), 0), 0) / 100;
  const drTot = dr.reduce((x, e) => x + e.amount, 0);
  const crTot = cr.reduce((x, e) => x + e.amount, 0);

  const trim = (es: Entry[]) => {
    if (es.length <= maxRows) return { shown: es, hidden: 0, hiddenSum: 0 };
    const keep = es.slice(-maxRows + 1);
    const gone = es.slice(0, es.length - keep.length);
    return { shown: keep, hidden: gone.length, hiddenSum: gone.reduce((x, e) => x + e.amount, 0) };
  };
  const L = trim(dr);
  const R = trim(cr);
  const balSide = net > 0.004 ? "debit" : net < -0.004 ? "credit" : "nil";

  const side = (t: ReturnType<typeof trim>, side: "dr" | "cr") => (
    <div className={cx("min-h-[3rem] px-2 py-1", side === "dr" ? "border-r-2 border-ink" : "")}>
      {t.hidden > 0 && (
        <div className="flex justify-between gap-2 py-0.5 text-xs text-stone-400">
          <span>{t.hidden} earlier entries</span>
          <span className="num">{num(t.hiddenSum)}</span>
        </div>
      )}
      {t.shown.map((e, i) => (
        <motion.div
          key={e.id + i}
          initial={e.id === highlight ? { opacity: 0, y: -10, backgroundColor: "rgb(250 219 95)" } : false}
          animate={{ opacity: 1, y: 0, backgroundColor: e.id === highlight ? "rgb(255 243 196)" : "rgba(0,0,0,0)" }}
          transition={{ duration: 0.6 }}
          className="flex justify-between gap-2 rounded px-1 py-0.5 text-xs"
          title={e.label}
        >
          <span className="truncate text-stone-600">
            <span className="num text-stone-400">{nzDate(e.date, false)}</span> {e.id}
          </span>
          <span className="num font-medium">{num(e.amount)}</span>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className={cx("overflow-hidden rounded-xl border bg-white", s.border)}>
      <div className={cx("flex items-center justify-between px-3 py-1.5 text-sm font-semibold", s.soft, s.text)}>
        <span>{title ?? `${a.code} ${a.name}`}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{s.label}{a.contra ? " (contra)" : ""}</span>
      </div>
      <div className="grid grid-cols-2 border-b-2 border-ink text-center text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        <div className="border-r-2 border-ink py-1">Debit</div>
        <div className="py-1">Credit</div>
      </div>
      <div className="grid grid-cols-2">
        {side(L, "dr")}
        {side(R, "cr")}
      </div>
      <div className="grid grid-cols-2 border-t border-stone-200 text-xs">
        <div className="num border-r-2 border-ink px-3 py-1 text-right text-stone-500">{num(drTot)}</div>
        <div className="num px-3 py-1 text-right text-stone-500">{num(crTot)}</div>
      </div>
      <div className={cx("px-3 py-1.5 text-xs font-semibold", balSide === "nil" ? "bg-stone-50 text-stone-500" : s.soft)}>
        {balSide === "nil" ? "Balance: nil" : (
          <>
            Balance: <span className="num">{num(Math.abs(net))}</span> {balSide === "debit" ? "Dr" : "Cr"}
            {balSide !== a.normal && <span className="ml-1 text-rose-700">(opposite of normal: {a.code === "210" ? "a GST refund is due" : "check!"})</span>}
          </>
        )}
      </div>
    </div>
  );
}
