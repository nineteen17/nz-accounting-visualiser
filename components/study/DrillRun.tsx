"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ACCOUNTS } from "@/data/chartOfAccounts";
import { DRILL_MAP } from "@/data/study/drills";
import { $, formatAnswer, isRight, newSeed, parseAnswer, seeded, shuffle, type ChoiceQ, type EntryQ, type NumberQ, type OrderQ, type Question } from "@/data/study/core";
import { RichText } from "@/components/learn/RichText";
import { SourceDoc } from "@/components/documents/SourceDoc";
import { cx } from "@/lib/ui";

const ACC = Object.fromEntries(ACCOUNTS.map((a) => [a.code, a]));
const sig = (q: Question) => q.prompt + (q.kind === "choice" ? q.options[q.answer] : q.kind === "number" ? q.answer : q.kind === "order" ? q.items.join("|") : "");

/** one question: which drill, and the seed that regenerates it exactly */
export interface RunItem { drill: string; seed: number }

export const makeQuestion = (it: RunItem) => DRILL_MAP[it.drill].make(seeded(it.seed));

/** a fresh set for one drill, with no repeats */
export function makeSet(k: string, n = DRILL_MAP[k].length ?? 10): RunItem[] {
  const seen = new Set<string>();
  const out: RunItem[] = [];
  for (let tries = 0; out.length < n && tries < 300; tries++) {
    const it = { drill: k, seed: newSeed() };
    const q = makeQuestion(it);
    if (seen.has(sig(q))) continue;
    seen.add(sig(q));
    out.push(it);
  }
  return out;
}

/** the right answer in words, for the end-of-run review */
export function answerText(q: Question) {
  if (q.kind === "choice") return q.options[q.answer];
  if (q.kind === "number") return formatAnswer(q);
  if (q.kind === "order") return q.items.map((x, n) => `${n + 1}. ${x}`).join(" · ");
  return q.lines.map((l) => `${l.side === "debit" ? "Dr" : "Cr"} ${ACC[l.account].name} ${$(l.amount)}`).join(" · ");
}

interface RunProps {
  title: string;
  icon: string;
  items: RunItem[];
  /** questions from several drills: label each one with its drill */
  mixed?: boolean;
  learn?: { href: string; label: string };
  onAnswer: (it: RunItem, right: boolean) => void;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
  /** the main button on the score screen */
  again?: { label: string; run: () => RunItem[] | void };
}

export function DrillRun({ title, icon, items: start, mixed, learn, onAnswer, onFinish, onExit, again }: RunProps) {
  const [items, setItems] = useState(start);
  const qs = useMemo(() => items.map(makeQuestion), [items]);
  const [i, setI] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const q = qs[i];
  const it = items[i];

  const answer = useCallback((right: boolean) => {
    setResult(right);
    setResults((r) => [...r, right]);
    onAnswer(it, right);
  }, [it, onAnswer]);
  const next = useCallback(() => {
    if (result === null) return;
    if (i + 1 >= qs.length) onFinish(results.filter(Boolean).length, qs.length);
    setResult(null);
    setI((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [result, i, qs.length, results, onFinish]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter" && result !== null) { ev.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, result]);

  if (!q) {
    const score = results.filter(Boolean).length;
    const missed = qs.map((m, n) => ({ m, it: items[n] })).filter((_, n) => !results[n]);
    const restart = () => {
      const fresh = again?.run();
      if (!fresh) return;
      setItems(fresh); setI(0); setResults([]); setResult(null);
    };
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <div className="text-4xl">{score === qs.length ? "🏆" : score >= qs.length * 0.7 ? "👏" : "💪"}</div>
          <h2 className="mt-2 text-2xl font-bold">{title}: {score} / {qs.length}</h2>
          <p className="mt-1 text-stone-600">{score === qs.length ? "Perfect." : score >= qs.length * 0.7 ? "Nearly there. Look over the ones you missed below." : "Worth another go after a look at the explanations below."}</p>
          {missed.length > 0 && <p className="mt-1 text-sm text-stone-500">The {missed.length === 1 ? "one" : missed.length} you missed {missed.length === 1 ? "is" : "are"} saved and will come back in <strong>Today&apos;s review</strong> tomorrow.</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {again && <button onClick={restart} className="rounded-xl bg-kowhai-400 px-5 py-2.5 font-bold text-ink hover:bg-kowhai-300">{again.label}</button>}
            <button onClick={onExit} className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold hover:bg-stone-100">Back to study</button>
            {learn && <Link href={learn.href} className="rounded-xl border border-stone-300 px-5 py-2.5 font-semibold hover:bg-stone-100">Revise: {learn.label}</Link>}
          </div>
        </div>
        {missed.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-bold">The ones you missed</h3>
            {missed.map(({ m, it: mi }, n) => (
              <div key={n} className="rounded-xl border border-stone-200 bg-white p-4 text-[15px]">
                {mixed && <div className="mb-1 text-xs font-semibold text-stone-500">{DRILL_MAP[mi.drill].icon} {DRILL_MAP[mi.drill].title}</div>}
                <RichText text={m.prompt} />
                <div className="mt-2 font-semibold text-emerald-700">Answer: {answerText(m)}</div>
                <div className="mt-1 text-stone-700"><RichText text={m.explain} /></div>
                {mixed && <Link href={DRILL_MAP[mi.drill].learn.href} className="mt-1 inline-block text-sm font-semibold text-kowhai-700 underline">Revise: {DRILL_MAP[mi.drill].learn.label}</Link>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const d = DRILL_MAP[it.drill];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-stone-500">
        <button onClick={onExit} className="shrink-0 underline">← Back to study</button>
        <span className="text-right">{icon} {title} · {i + 1} / {qs.length} · {results.filter(Boolean).length} right</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-kowhai-400 transition-all" style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        {mixed && <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">{d.icon} {d.title}</div>}
        <div className="text-lg leading-relaxed"><RichText text={q.prompt} /></div>
        {q.kind === "choice" && <ChoiceView key={i} q={q} onAnswer={answer} />}
        {q.kind === "number" && <NumberView key={i} q={q} onAnswer={answer} />}
        {q.kind === "entry" && <EntryView key={i} q={q} onAnswer={answer} />}
        {q.kind === "order" && <OrderView key={i} q={q} seed={it.seed} onAnswer={answer} />}
        {result !== null && (
          <div className={cx("mt-5 rounded-xl px-4 py-3 text-[15px] leading-relaxed", result ? "bg-emerald-50" : "bg-rose-50")}>
            <div className={cx("font-bold", result ? "text-emerald-800" : "text-rose-800")}>{result ? "✓ Right" : q.kind === "entry" || q.kind === "order" ? "✗ Not quite: the right answer is shown above" : `✗ Not quite: it's ${answerText(q)}`}</div>
            <div className="mt-1 text-stone-700"><RichText text={q.explain} /></div>
            <button onClick={next} className="mt-3 rounded-xl bg-ink px-5 py-2 font-bold text-white hover:bg-ink/85">{i + 1 >= qs.length ? "See your score →" : "Next →"} <span className="font-normal text-stone-400">(Enter)</span></button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── put in order ───────────── */

function OrderView({ q, seed, onAnswer }: { q: OrderQ; seed: number; onAnswer: (right: boolean) => void }) {
  // start shuffled (never already in order), the same way each time for this question
  const [order, setOrder] = useState(() => {
    const rng = seeded(seed + 1);
    let o = q.items.map((_, n) => n);
    for (let t = 0; t < 10 && o.every((x, n) => x === n); t++) o = shuffle(rng, o);
    return o;
  });
  const [done, setDone] = useState(false);
  const move = (from: number, to: number) => {
    if (done || to < 0 || to >= order.length) return;
    setOrder((o) => { const a = [...o]; [a[from], a[to]] = [a[to], a[from]]; return a; });
  };
  const check = () => {
    if (done) return;
    setDone(true);
    onAnswer(order.every((x, n) => x === n));
  };
  return (
    <div className="mt-5">
      <div className="mb-2 text-sm text-stone-500">Use the arrows to move each step up or down, first at the top.</div>
      <ol className="space-y-2">
        {order.map((x, n) => (
          <li key={x} className={cx("flex items-center gap-2 rounded-xl px-3 py-2 ring-1", !done ? "bg-white ring-stone-300" : x === n ? "bg-emerald-50 ring-emerald-400" : "bg-rose-50 ring-rose-300")}>
            <span className="num w-5 shrink-0 text-sm font-bold text-stone-400">{n + 1}</span>
            <span className="min-w-0 flex-1 text-[15px]">{q.items[x]}</span>
            {done ? (
              <span className={cx("shrink-0 text-sm font-semibold", x === n ? "text-emerald-700" : "text-rose-700")}>{x === n ? "✓" : `✗ goes ${x + 1}${["st", "nd", "rd"][x] ?? "th"}`}</span>
            ) : (
              <span className="flex shrink-0 gap-1">
                <button onClick={() => move(n, n - 1)} disabled={n === 0} aria-label={`Move "${q.items[x]}" up`} className="rounded-lg px-2.5 py-1 ring-1 ring-stone-300 hover:bg-stone-100 disabled:opacity-30">↑</button>
                <button onClick={() => move(n, n + 1)} disabled={n === order.length - 1} aria-label={`Move "${q.items[x]}" down`} className="rounded-lg px-2.5 py-1 ring-1 ring-stone-300 hover:bg-stone-100 disabled:opacity-30">↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!done && <button onClick={check} className="mt-4 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Check the order</button>}
      {done && !order.every((x, n) => x === n) && (
        <div className="mt-4 rounded-xl border border-stone-200 p-3 text-[15px]">
          <div className="text-sm font-semibold text-stone-600">The right order</div>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">{q.items.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      )}
    </div>
  );
}

/* ───────────── multiple choice ───────────── */

function ChoiceView({ q, onAnswer }: { q: ChoiceQ; onAnswer: (right: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const choose = useCallback((n: number) => {
    if (picked !== null || n >= q.options.length) return;
    setPicked(n);
    onAnswer(n === q.answer);
  }, [picked, q, onAnswer]);
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { const n = Number(ev.key); if (n >= 1 && n <= 4) choose(n - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);
  return (
    <div className={cx("mt-5 grid gap-2", q.options.length > 2 ? "sm:grid-cols-2" : "grid-cols-2")}>
      {q.options.map((o, n) => (
        <button
          key={o}
          onClick={() => choose(n)}
          disabled={picked !== null}
          className={cx(
            "rounded-xl px-4 py-3 text-left font-medium ring-1 transition",
            picked === null && "bg-white ring-stone-300 hover:bg-kowhai-50 hover:ring-kowhai-400",
            picked !== null && n === q.answer && "bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500",
            picked !== null && n === picked && n !== q.answer && "bg-rose-50 text-rose-900 ring-2 ring-rose-400",
            picked !== null && n !== q.answer && n !== picked && "bg-white opacity-60 ring-stone-200",
          )}
        >
          <span className="mr-2 text-sm text-stone-400">{n + 1}</span>{o}
        </button>
      ))}
    </div>
  );
}

/* ───────────── typed amount ───────────── */

function NumberView({ q, onAnswer }: { q: NumberQ; onAnswer: (right: boolean) => void }) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const valid = parseAnswer(typed) !== null;
  const check = () => {
    if (done || !valid) return;
    setDone(true);
    onAnswer(isRight(q, typed));
  };
  const right = done && isRight(q, typed);
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className={cx("flex items-center rounded-xl bg-white px-3 ring-2 focus-within:ring-kowhai-500", done ? (right ? "ring-emerald-500" : "ring-rose-400") : "ring-stone-300")}>
          {q.unit === "$" && <span className="text-lg text-stone-400">$</span>}
          <input
            autoFocus
            inputMode="decimal"
            value={typed}
            disabled={done}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !done) { e.preventDefault(); e.stopPropagation(); check(); } }}
            className="num w-40 bg-transparent px-1.5 py-2.5 text-lg outline-none"
            aria-label="Your answer"
          />
          {q.unit === "%" && <span className="text-lg text-stone-400">%</span>}
        </label>
        {!done && <button onClick={check} disabled={!valid} className="rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85 disabled:opacity-40">Check <span className="font-normal text-stone-400">(Enter)</span></button>}
        {done && !right && <span className="font-semibold text-emerald-700">Answer: {formatAnswer(q)}</span>}
      </div>
      {q.hint && <div className="mt-1.5 text-sm text-stone-500">{q.hint}</div>}
    </div>
  );
}

/* ───────────── build a journal entry ───────────── */

type Row = { side: "" | "debit" | "credit"; amount: string };

function EntryView({ q, onAnswer }: { q: EntryQ; onAnswer: (right: boolean) => void }) {
  const [rows, setRows] = useState<Record<string, Row>>(() => Object.fromEntries(q.options.map((c) => [c, { side: "", amount: "" }])));
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(!q.amountsGiven);
  const expected = useMemo(() => Object.fromEntries(q.lines.map((l) => [l.account, l])), [q]);
  const set = (c: string, r: Partial<Row>) => setRows((all) => ({ ...all, [c]: { ...all[c], ...r } }));
  const total = (side: "debit" | "credit") => Object.values(rows).reduce((s, r) => s + (r.side === side ? parseAnswer(r.amount) ?? 0 : 0), 0);
  const dr = total("debit"), cr = total("credit");
  const rowRight = (c: string) => {
    const r = rows[c], e = expected[c];
    if (!e) return r.side === "";
    const v = parseAnswer(r.amount);
    return r.side === e.side && v !== null && Math.abs(v - e.amount) < 0.011;
  };
  const used = Object.values(rows).filter((r) => r.side).length;
  const check = () => {
    if (done || !used) return;
    setDone(true);
    onAnswer(q.options.every(rowRight));
  };
  const amounts = [...new Set(q.lines.map((l) => l.amount))].sort((a, b) => a - b);

  return (
    <div className="mt-4">
      <div className="text-[15px] leading-relaxed text-stone-700"><RichText text={q.story} /></div>
      {q.doc && (
        <details className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3" open>
          <summary className="cursor-pointer text-sm font-semibold text-stone-600">Source document</summary>
          <div className="mt-3 overflow-x-auto"><SourceDoc doc={q.doc} /></div>
        </details>
      )}

      <div className="mt-5 font-semibold">Write the entry: choose debit or credit for each account that&apos;s used, and its amount. Leave the others blank.</div>
      <div className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200">
        {q.options.map((c) => {
          const r = rows[c], e = expected[c], ok = done && rowRight(c);
          return (
            <div key={c} className={cx("flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5", done && (ok ? "bg-emerald-50/60" : "bg-rose-50/70"))}>
              <div className="min-w-0 flex-1 basis-56 text-[15px]">
                <span className="num mr-2 text-xs text-stone-400">{c}</span>{ACC[c].name}
              </div>
              <div className="flex overflow-hidden rounded-lg ring-1 ring-stone-300">
                {(["debit", "credit"] as const).map((s) => (
                  <button key={s} disabled={done} onClick={() => set(c, { side: r.side === s ? "" : s })}
                    className={cx("px-3 py-1.5 text-sm font-semibold", r.side === s ? (s === "debit" ? "bg-sky-600 text-white" : "bg-violet-600 text-white") : "bg-white text-stone-600 hover:bg-stone-100")}>
                    {s === "debit" ? "Dr" : "Cr"}
                  </button>
                ))}
              </div>
              <label className={cx("flex items-center rounded-lg px-2 ring-1", r.side ? "bg-white ring-stone-300" : "bg-stone-50 ring-stone-200")}>
                <span className="text-stone-400">$</span>
                <input inputMode="decimal" disabled={done || !r.side} value={r.amount} onChange={(ev) => set(c, { amount: ev.target.value })}
                  onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); ev.stopPropagation(); check(); } }}
                  className="num w-28 bg-transparent px-1 py-1.5 outline-none" aria-label={`Amount for ${ACC[c].name}`} />
              </label>
              {done && (
                <span className={cx("w-full text-sm font-semibold sm:w-32 sm:text-right", ok ? "text-emerald-700" : "text-rose-700")}>
                  {ok ? "✓" : "✗"} {e ? `${e.side === "debit" ? "Dr" : "Cr"} ${$(e.amount)}` : "not used"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="num">Debits <strong>{$(dr)}</strong></span>
        <span className="num">Credits <strong>{$(cr)}</strong></span>
        {dr > 0 && <span className={cx("font-semibold", Math.abs(dr - cr) < 0.005 ? "text-emerald-700" : "text-amber-700")}>{Math.abs(dr - cr) < 0.005 ? "Balanced ✓" : `Out by ${$(Math.abs(dr - cr))}`}</span>}
        {!done && !hint && <button onClick={() => setHint(true)} className="ml-auto text-sm font-semibold text-kowhai-700 underline">Hint: show the amounts</button>}
      </div>
      {hint && !done && <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span className="text-stone-500">{q.amountsGiven ? "The amounts in this entry:" : "Some amounts here have to be added up from the document, so here they all are:"}</span>{amounts.map((a) => <span key={a} className="num rounded-full bg-kowhai-100 px-2.5 py-0.5 font-semibold text-kowhai-700">{$(a)}</span>)}</div>}

      {!done && <button onClick={check} disabled={!used} className="mt-4 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85 disabled:opacity-40">Check my entry</button>}

      {done && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full min-w-[30rem] text-sm">
            <thead><tr className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500"><th className="px-3 py-2">The entry</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th></tr></thead>
            <tbody>
              {[...q.lines].sort((a, b) => (a.side === b.side ? 0 : a.side === "debit" ? -1 : 1)).map((l) => (
                <tr key={l.account} className="border-t border-stone-100 align-top">
                  <td className={cx("px-3 py-2", l.side === "credit" && "pl-8")}>
                    <div className="font-medium">{ACC[l.account].name}</div>
                    {l.why && <div className="text-xs text-stone-500"><RichText text={l.why} inlineOnly /></div>}
                  </td>
                  <td className="num px-3 py-2 text-right">{l.side === "debit" ? $(l.amount) : ""}</td>
                  <td className="num px-3 py-2 text-right">{l.side === "credit" ? $(l.amount) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
