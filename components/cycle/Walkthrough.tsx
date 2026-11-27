"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DURING_YEAR } from "@/data/books";
import { account } from "@/data/chartOfAccounts";
import type { Transaction } from "@/lib/engine/types";
import { balances, equation } from "@/lib/engine/ledger";
import { money, nzDate } from "@/lib/money";
import { TYPE_STYLE, cx, pageKey } from "@/lib/ui";
import { EquationBar } from "@/components/visual/EquationBar";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { TAccount } from "@/components/visual/TAccount";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { RichText } from "@/components/learn/RichText";
import { Callout, DeepDives, Quiz } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";

export const PHASES = [
  { id: 0, short: "Document", title: "① Identify: read the source document", hint: "What happened? Who, when, how much, any GST?" },
  { id: 1, short: "Analyse", title: "② Analyse: which accounts change, and how?", hint: "Name the accounts, their type, and whether each goes up or down." },
  { id: 2, short: "Journalise", title: "③ Journalise: write the entry", hint: "Debits first, credits indented underneath. Totals must match." },
  { id: 3, short: "Post", title: "④ Post: update the ledger accounts", hint: "Each line goes into its T-account. Watch the balances and the equation." },
];

function Analysis({ txn }: { txn: Transaction }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
              <th className="px-3 py-2">Account affected</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Effect</th>
              <th className="px-3 py-2">So we…</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {txn.lines.map((l, i) => {
              const a = account(l.account);
              const s = TYPE_STYLE[a.type];
              const side = l.debit ? "debit" : "credit";
              const up = side === a.normal;
              return (
                <motion.tr key={i} className="border-b border-stone-100 align-top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{a.name}</div>
                    {l.why && <div className="mt-0.5 text-xs leading-snug text-stone-500">{l.why}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cx("rounded px-1.5 py-0.5 text-xs font-semibold", s.soft, s.text)}>{s.label}{a.contra ? " (contra)" : ""}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={cx("text-lg font-bold", up ? "text-emerald-600" : "text-rose-600")}>{up ? "▲" : "▼"}</span>{" "}
                    {up ? "increases" : "decreases"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={cx("rounded-md px-2 py-0.5 text-xs font-bold uppercase", side === "debit" ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800")}>
                      {side}
                    </span>
                  </td>
                  <td className="num px-3 py-2 text-right">{money(l.debit ?? l.credit ?? 0)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Callout kind="rule" title="How to decide debit or credit">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div><strong className="text-indigo-800">DEBIT</strong> increases <span className="text-sky-700">Assets</span> and <span className="text-amber-700">Expenses</span> (and drawings), and decreases the others.</div>
          <div><strong className="text-orange-800">CREDIT</strong> increases <span className="text-rose-700">Liabilities</span>, <span className="text-violet-700">Equity</span> and <span className="text-emerald-700">Income</span>, and decreases the others.</div>
        </div>
        <div className="mt-1 text-xs text-stone-600">Remember: debit = left, credit = right. Nothing more mysterious than that. <Term k="debit">More on debits</Term></div>
      </Callout>
      {txn.gstNote && <Callout kind="nz" title="GST treatment"><RichText text={txn.gstNote} /></Callout>}
      {txn.quiz && <Quiz key={txn.id} {...txn.quiz} />}
    </div>
  );
}

export function Walkthrough({ txns, initialPhase = 0, storageKey = "walk" }: { txns: Transaction[]; initialPhase?: number; storageKey?: string }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(initialPhase);

  useEffect(() => {
    const saved = Number(localStorage.getItem(`${storageKey}-idx`));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore progress after hydration
    if (saved > 0 && saved < txns.length) setIdx(saved);
  }, [storageKey, txns.length]);
  useEffect(() => {
    localStorage.setItem(`${storageKey}-idx`, String(idx));
  }, [idx, storageKey]);

  const txn = txns[idx];
  const pos = DURING_YEAR.findIndex((t) => t.id === txn.id);
  const before = useMemo(() => DURING_YEAR.slice(0, pos), [pos]);
  const after = useMemo(() => DURING_YEAR.slice(0, pos + 1), [pos]);
  const eqBefore = useMemo(() => equation(balances(before)), [before]);
  const eqAfter = useMemo(() => equation(balances(after)), [after]);
  const codes = Array.from(new Set(txn.lines.map((l) => l.account)));

  const next = () => {
    if (phase < 3) setPhase(phase + 1);
    else if (idx < txns.length - 1) {
      setIdx(idx + 1);
      setPhase(0);
    }
  };
  const prev = () => {
    if (phase > 0) setPhase(phase - 1);
    else if (idx > 0) {
      setIdx(idx - 1);
      setPhase(3);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pageKey(e)) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="space-y-4">
      {/* transaction picker & progress */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
        <div className="text-sm font-semibold text-stone-500">
          Transaction {idx + 1} of {txns.length}
        </div>
        <select
          aria-label="Choose a transaction"
          value={idx}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setPhase(0);
          }}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
        >
          {txns.map((t, i) => (
            <option key={t.id} value={i}>
              {t.id} · {nzDate(t.date, false)} · {t.title}
            </option>
          ))}
        </select>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-full bg-kowhai-500 transition-all" style={{ width: `${((idx * 4 + phase + 1) / (txns.length * 4)) * 100}%` }} />
        </div>
      </div>

      <EquationBar eq={phase >= 2 ? eqAfter : eqBefore} prev={phase >= 2 ? eqBefore : undefined} />

      {/* phase tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-stone-100 p-1">
        {PHASES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={cx("rounded-lg px-2 py-2 text-sm font-semibold transition", phase === p.id ? "bg-ink text-white shadow" : phase > p.id ? "bg-white/70 text-stone-600" : "text-stone-500 hover:bg-white/60")}
          >
            <span className="hidden sm:inline">{["①", "②", "③", "④"][p.id]} </span>
            {p.short}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${txn.id}-${phase}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          <div className="mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-kowhai-700">{nzDate(txn.date)} · {txn.id}</div>
            <h2 className="text-2xl font-bold">{txn.title}</h2>
            <div className="mt-1 text-sm text-stone-500">{PHASES[phase].title}: {PHASES[phase].hint}</div>
          </div>

          {phase === 0 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <div className="prose-learn text-[15px]">
                <RichText text={txn.story} />
              </div>
              <div>{txn.doc ? <SourceDoc doc={txn.doc} /> : <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-stone-500">No external document: this is an internal entry.</div>}</div>
            </div>
          )}

          {phase === 1 && <Analysis txn={txn} />}

          {phase === 2 && (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <JournalEntry txn={txn} animate showWhy />
              <div className="space-y-3 text-[15px]">
                <Callout kind="rule" title="Journal entry format">
                  Debit lines come first. Credit lines are indented underneath. The narration says what happened. <strong>Total debits must equal total credits</strong>, or the entry is wrong.
                </Callout>
                {txn.notes?.map((n, i) => <Callout key={i} kind="why" title="Note"><RichText text={n} /></Callout>)}
              </div>
            </div>
          )}

          {phase === 3 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {codes.map((c) => <TAccount key={c} code={c} txns={after} highlight={txn.id} maxRows={6} />)}
              </div>
              <Callout kind="why" title="What just happened?">
                Each journal line was copied into its account (highlighted). The equation bar above shows the change, and it still balances. Every transaction keeps <strong>Assets = Liabilities + Equity</strong> true.
              </Callout>
              {txn.deepDives && <DeepDives links={txn.deepDives} />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-3 z-10 flex items-center justify-between rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-lg backdrop-blur">
        <button onClick={prev} disabled={idx === 0 && phase === 0} className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-stone-100 disabled:opacity-30">
          ← Back
        </button>
        <span className="hidden text-xs text-stone-400 sm:block">Tip: use the ← → arrow keys</span>
        <button onClick={next} disabled={idx === txns.length - 1 && phase === 3} className="rounded-lg bg-kowhai-400 px-5 py-2 text-sm font-bold text-ink hover:bg-kowhai-300 disabled:opacity-30">
          {phase < 3 ? `Next: ${PHASES[phase + 1].short} →` : "Next transaction →"}
        </button>
      </div>
    </div>
  );
}
