"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORY_STYLE, bucketOf, type JobPanel } from "@/data/job/steps";
import { JOB_YEARS, type JobYearData, type YearNo } from "@/data/job/years";
import { balances, equation, trialBalance } from "@/lib/engine/ledger";
import { bankReconciliation } from "@/lib/engine/bankrec";
import { gstReturn } from "@/lib/engine/gst";
import { money, num, nzDate } from "@/lib/money";
import { cx, pageKey } from "@/lib/ui";
import { EquationBar } from "@/components/visual/EquationBar";
import { JournalEntry } from "@/components/visual/JournalEntry";
import { TAccount } from "@/components/visual/TAccount";
import { BalanceSheetView, ProfitAndLossView, TrialBalanceTable } from "@/components/visual/Statements";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { RichText } from "@/components/learn/RichText";
import { Tabs } from "@/components/learn/bits";
import { TaxRecView } from "@/components/cycle/steps/End";
import { YearMap } from "@/components/job/YearMap";
import { MemoryAid } from "@/components/learn/MemoryAid";
import { aidsForStep } from "@/data/memoryAids";

const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-NZ", { weekday: "long", timeZone: "UTC" });

function nextNonSkippable(D: JobYearData, from: number) {
  for (let k = from + 1; k < D.steps.length; k++) if (!D.steps[k].skippable) return k;
  return D.steps.length - 1;
}

/* ───────────── Panels for steps that are work but not entries ───────────── */

function BankRecPanel({ p, D }: { p: Extract<JobPanel, { kind: "bankrec" }>; D: JobYearData }) {
  const r = bankReconciliation(D.bankTxns, p.from, p.to);
  const row = (label: string, v: number, strong?: boolean) => (
    <div className={cx("flex justify-between py-0.5", strong && "border-t border-stone-300 pt-1 font-semibold")}><span>{label}</span><span className="num">{money(v)}</span></div>
  );
  const items = [
    ...r.bankOnly.map((i) => ({ t: "On the statement, not in the books → record it", i })),
    ...r.depositsInTransit.map((i) => ({ t: "Deposit in transit (bank is a day behind)", i })),
    ...r.unpresented.map((i) => ({ t: "Unpresented payment (bank is a day behind)", i })),
  ];
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
      <div className="mb-2 font-bold">Bank reconciliation: {p.month}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">Café&apos;s cashbook (account 100)</div>
          {row("Opening balance", r.cashbookOpening)}
          {row(`${r.cashbookMonth.length} transactions this month`, r.cashbookClosing - r.cashbookOpening)}
          {row("Closing balance", r.cashbookClosing, true)}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-500">Bank statement</div>
          {row("Opening balance", r.statementOpening)}
          {row(`${r.statementMonth.length} items processed`, r.statementClosing - r.statementOpening)}
          {row("Closing balance", r.statementClosing, true)}
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">✓ Every line matches. The cashbook and the statement agree.</div>
      ) : (
        <div className="mt-3 space-y-1">
          {items.map(({ t, i }) => (
            <div key={i.txn.id} className="flex justify-between gap-2 rounded bg-kowhai-50 px-2 py-1"><span><strong>{t}:</strong> {i.txn.title}</span><span className="num">{money(i.amount)}</span></div>
          ))}
          <div className={cx("mt-2 rounded-lg px-3 py-2", r.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
            Adjusted cashbook {money(r.adjustedCashbook)} = statement after timing items {money(r.reconciled)} {r.ok ? "✓ reconciled" : "✗"}
          </div>
        </div>
      )}
    </div>
  );
}

function GstPanel({ pid, D }: { pid: string; D: JobYearData }) {
  const p = D.periods.find((x) => x.id === pid)!;
  const r = gstReturn(D.gstTxns, p);
  const b = (n: number, label: string, v: number, strong?: boolean) => (
    <div className={cx("grid grid-cols-[2rem_1fr_7rem] items-center gap-2 py-0.5", strong && "font-semibold")}>
      <span className="grid h-5 w-7 place-items-center rounded bg-ink text-[10px] font-bold text-white">{n}</span><span>{label}</span><span className="num text-right">{num(v) === "–" ? "0.00" : num(v)}</span>
    </div>
  );
  return (
    <div className="doc-paper rounded-sm px-5 py-4 text-sm">
      <div className="mb-2 flex justify-between border-b-2 border-ink pb-1"><span className="font-black">GST return (GST101A)</span><span className="text-xs">{p.label} · due {nzDate(p.due)}</span></div>
      {b(5, "Total sales incl GST", r.box5)}
      {b(8, "GST on sales (× 3/23)", r.box8)}
      {b(9, "Debit adjustments", r.box9)}
      {b(10, "Total GST collected", r.box10, true)}
      {b(11, "Purchases incl GST", r.box11)}
      {b(12, "GST on purchases (× 3/23)", r.box12)}
      {b(13, "Credit adjustments", r.box13)}
      {b(14, "Total GST credit", r.box14, true)}
      <div className={cx("mt-2 rounded px-3 py-1.5 text-center font-bold", r.box15 >= 0 ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>
        Box 15: {r.box15 >= 0 ? `${money(r.box15)} to pay IRD` : `${money(-r.box15)} refund from IRD`}
      </div>
    </div>
  );
}

function StatementsPanel({ b, D }: { b: ReturnType<typeof balances>; D: JobYearData }) {
  const [tab, setTab] = useState<"pl" | "bs">("pl");
  return (
    <div className="space-y-3">
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "pl", label: "Profit & loss" }, { id: "bs", label: "Balance sheet" }]} />
      {tab === "pl" ? <ProfitAndLossView b={b} period={D.plPeriod} /> : <BalanceSheetView b={b} date={D.yearEndLabel} loanMonthIndex={D.loanMonthIndex} />}
      {D.year === 2 && <Link href="/on-the-job/year-2-statements" className="inline-block text-sm font-semibold text-kowhai-700 underline">See both years side by side (with comparatives) →</Link>}
    </div>
  );
}

function Panel({ panel, b, D }: { panel: JobPanel; b: ReturnType<typeof balances>; D: JobYearData }) {
  switch (panel.kind) {
    case "bankrec": return <BankRecPanel p={panel} D={D} />;
    case "gst": return <GstPanel pid={panel.period} D={D} />;
    case "tb": {
      const tb = trialBalance(b);
      return (
        <div>
          <div className="mb-2 text-sm font-semibold">{panel.stage === "opening" ? `Opening trial balance at ${D.openingLabel}` : `${panel.stage === "unadjusted" ? "Unadjusted" : panel.stage === "adjusted" ? "Adjusted" : "Post-closing"} trial balance at ${D.yearEndLabel}`}</div>
          <TrialBalanceTable {...tb} />
        </div>
      );
    }
    case "statements": return <StatementsPanel b={b} D={D} />;
    case "tax": return <TaxRecView year={D.year} />;
    case "checklist":
      return (
        <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 text-sm">
          {panel.items.map((x) => <li key={x} className="flex gap-2"><span className="text-emerald-600">☐</span>{x}</li>)}
        </ul>
      );
  }
}

/* ───────────── Main ───────────── */

export function JobYear({ year = 1 }: { year?: YearNo }) {
  const D = JOB_YEARS[year];
  const N = D.steps.length;
  const KEY = year === 1 ? "job-idx" : `job-idx-y${year}`;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2500);

  useEffect(() => {
    // ?step=<number> (1-based) or ?step=<step id> opens a specific task; otherwise resume saved progress
    const q = new URLSearchParams(window.location.search).get("step");
    const fromQuery = q ? (/^\d+$/.test(q) ? Number(q) - 1 : D.steps.findIndex((s) => s.id === q)) : -1;
    const saved = fromQuery >= 0 && fromQuery < N ? fromQuery : Number(localStorage.getItem(KEY));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore progress after hydration
    if (saved > 0 && saved < N) setIdx(saved);
  }, [D, N, KEY]);
  useEffect(() => { localStorage.setItem(KEY, String(idx)); }, [idx, KEY]);

  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(N - 1, i))), [N]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pageKey(e)) return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, go]);

  useEffect(() => {
    if (!playing) return;
    if (idx >= N - 1) { setPlaying(false); return; } // eslint-disable-line react-hooks/set-state-in-effect -- stop at the end
    const t = setTimeout(() => setIdx((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [playing, idx, speed, N]);

  const step = D.steps[idx];
  // memory aids: each one shows on the first task of the year that uses it
  const aidsAt = useMemo(() => {
    const seen = new Set<string>();
    return D.steps.map((st) => aidsForStep(st.id, st.title).filter((k) => !seen.has(k) && !!seen.add(k)));
  }, [D]);
  const posted = useMemo(() => [...D.base, ...D.posted.slice(0, D.cum[idx])], [D, idx]);
  const before = useMemo(() => [...D.base, ...D.posted.slice(0, idx ? D.cum[idx - 1] : 0)], [D, idx]);
  const b = useMemo(() => balances(posted), [posted]);
  const eq = equation(b);
  const prevEq = step.txns.length ? equation(balances(before)) : undefined;
  const touched = useMemo(() => Array.from(new Set(step.txns.flatMap((t) => t.lines.map((l) => l.account)))), [step]);
  const tb = trialBalance(b);
  const bucket = bucketOf(step);
  const deadlines = D.deadlines(step.date);
  const cat = CATEGORY_STYLE[step.category];
  const docTxn = step.txns.find((t) => t.doc);
  const firstStep = step.repeatOf !== undefined ? D.steps[step.repeatOf] : undefined;

  return (
    <div className="pb-28">
      {/* timeline */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-2">
        <div className="flex flex-wrap gap-1">
          {D.buckets.map((bk) => {
            const active = bk.key === bucket;
            const done = bk.first < idx && !active;
            return (
              <button
                key={bk.key}
                onClick={() => { setPlaying(false); go(bk.first); }}
                className={cx("rounded-lg border px-2.5 py-1 text-xs font-semibold transition", active ? "border-ink bg-ink text-white" : done ? "border-kowhai-300 bg-kowhai-50 text-kowhai-800 hover:border-kowhai-500" : "border-stone-200 bg-white text-stone-700 hover:border-kowhai-500")}
              >
                {bk.label}
              </button>
            );
          })}
          <span className="ml-auto self-center px-2 text-xs text-stone-500"><span className="num">{idx + 1}</span> / {N} tasks · {D.cum[idx]} of {D.totalEntries} entries posted</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100"><div className="h-full bg-kowhai-400 transition-all" style={{ width: `${((idx + 1) / N) * 100}%` }} /></div>
      </div>

      <YearMap D={D} idx={idx} onJump={(i) => { setPlaying(false); go(i); }} />

      <div key={step.id} className="fade-up">
          {/* header */}
          <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <div className="text-sm font-semibold text-stone-500">{weekday(step.date)}</div>
              <div className="num text-2xl font-black">{nzDate(step.date)}</div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">👤 {step.who}</span>
              <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", cat.cls)}>{cat.label}</span>
              {step.txns.length === 0 && <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">No journal entry: a job, not a transaction</span>}
              {firstStep && <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">↺ Repeat. First done {nzDate(firstStep.date)}</span>}
            </div>
          </div>
          <h2 className="mb-1 text-2xl font-bold sm:text-3xl">{step.title}</h2>
          {step.doneLabel && <div className="mb-3 text-sm text-stone-500">{step.doneLabel}</div>}

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            {/* left: the task */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-kowhai-200 bg-kowhai-50/60 p-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-kowhai-700">The job & why</div>
                <div className="prose-learn text-[15px]"><RichText text={step.intro} /></div>
                {step.txns.length > 0 && step.intro !== step.txns[0].story && step.txns[0].story && (
                  <div className="mt-3 border-t border-kowhai-200 pt-3 text-sm text-stone-700"><strong>This time: </strong><RichText text={step.txns[0].story} inlineOnly /></div>
                )}
                {firstStep && (
                  <button onClick={() => go(step.repeatOf!)} className="mt-3 text-xs font-semibold text-kowhai-700 underline">See the full explanation from the first time →</button>
                )}
              </div>
              {step.also && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-500">Also part of this job</div>
                  {step.also.map((a) => <div key={a} className="flex gap-2"><span className="text-emerald-600">✓</span>{a}</div>)}
                </div>
              )}
              {docTxn?.doc && (
                <details open={!step.skippable} className="rounded-xl border border-stone-200 bg-white">
                  <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-stone-600">📄 Source document</summary>
                  <div className="p-3"><SourceDoc doc={docTxn.doc} /></div>
                </details>
              )}
              {aidsAt[idx].map((k) => <MemoryAid key={k} k={k} compact className="my-0" />)}
              {step.deep && <Link href={step.deep.href} className="inline-block text-sm font-semibold text-kowhai-700 underline">Go deeper: {step.deep.label} →</Link>}
            </div>

            {/* right: what happens in the books */}
            <div className="space-y-4">
              {step.txns.length > 0 ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">The entry</div>
                  {step.txns.map((t) => <JournalEntry key={t.id} txn={t} animate={!playing} showWhy />)}
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Posted to the ledger: the year so far in each account</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {touched.slice(0, 6).map((c) => <TAccount key={c + step.id} code={c} txns={posted} highlight={step.txns[0].id} maxRows={6} />)}
                  </div>
                  {touched.length > 6 && <p className="text-xs text-stone-500">+ {touched.length - 6} more accounts. See the trial balance below.</p>}
                  {step.panel && <Panel panel={step.panel} b={b} D={D} />}
                </>
              ) : step.panel ? (
                <Panel panel={step.panel} b={b} D={D} />
              ) : (
                <div className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">This job doesn&apos;t change the books.</div>
              )}
            </div>
          </div>
      </div>

      {/* live books */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">The accounting equation, live</div>
          <EquationBar eq={eq} prev={prevEq} />
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">Coming up</div>
          {deadlines.map((d) => (
            <div key={d.date + d.label} className="flex justify-between gap-3 border-b border-stone-100 py-1 last:border-0"><span>{d.label}</span><span className="num shrink-0 text-stone-500">{nzDate(d.date)}</span></div>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-sky-50 p-2"><div className="text-[11px] text-stone-500">Bank</div><div className="num font-semibold">{money(b["100"] ?? 0, { dp: 0 })}</div></div>
            <div className="rounded-lg bg-emerald-50 p-2"><div className="text-[11px] text-stone-500">Profit so far</div><div className="num font-semibold">{money(eq.profit, { dp: 0 })}</div></div>
          </div>
        </div>
      </div>
      <details className="mt-4 rounded-xl border border-stone-200 bg-white">
        <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-stone-600">⚖️ Trial balance so far ({nzDate(step.date)}). Accounts touched by this step are highlighted.</summary>
        <div className="p-3"><TrialBalanceTable {...tb} highlight={new Set(touched)} /></div>
      </details>

      {/* controls */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <button onClick={() => { setPlaying(false); go(idx - 1); }} disabled={idx === 0} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">← Back</button>
          {year === 1 && idx === N - 1 ? (
            <Link href="/on-the-job?year=2" scroll className="rounded-xl bg-kowhai-400 px-5 py-2 text-sm font-bold hover:bg-kowhai-300">On to year 2 →</Link>
          ) : (
            <button onClick={() => { setPlaying(false); go(idx + 1); }} disabled={idx === N - 1} className="rounded-xl bg-kowhai-400 px-5 py-2 text-sm font-bold hover:bg-kowhai-300 disabled:opacity-40">Next task →</button>
          )}
          <button onClick={() => { setPlaying(false); go(nextNonSkippable(D, idx)); }} title="Jump past repeated routine tasks to the next new kind of job" className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-white">⏩ Skip routine</button>
          <button onClick={() => setPlaying(!playing)} className={cx("rounded-xl px-4 py-2 text-sm font-semibold", playing ? "bg-ink text-white" : "border border-stone-300 hover:bg-white")}>{playing ? "⏸ Pause" : "▶ Autoplay"}</button>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm" aria-label="Autoplay speed">
            <option value={5000}>Slow</option><option value={2500}>Normal</option><option value={1000}>Fast</option>
          </select>
          <span className="ml-auto text-xs text-stone-500">Tip: ← → arrow keys · progress is saved</span>
          <button onClick={() => { setPlaying(false); go(0); }} className="text-xs text-stone-500 underline">Start over</button>
        </div>
      </div>
    </div>
  );
}
