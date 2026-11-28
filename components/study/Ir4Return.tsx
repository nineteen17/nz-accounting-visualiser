"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { IR4_EXERCISES } from "@/data/study/ir4";
import { IR4_SOURCE, ir4Boxes, type Ir4BoxKey } from "@/lib/engine/ir4";
import { money, nzDate, pct } from "@/lib/money";
import { COMPANY_TAX_RATE, PROVISIONAL_TAX } from "@/lib/nz/rates";
import { DIRS, answerKey, entryGroups, expected, isRight, loadProgress, ownPay, readAmount, saveProgress, taxableFrom, type Dir, type EntryKey, type Ir4Exercise, type Progress } from "@/lib/study/ir4";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";

const store = () => (typeof window === "undefined" ? undefined : window.localStorage);

export function Ir4Practice() {
  const [key, setKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved progress after hydration
    setProgress(loadProgress(store()));
  }, []);
  const ex = IR4_EXERCISES.find((e) => e.key === key);
  if (ex) return <Run key={ex.key} ex={ex} onBack={() => setKey(null)} onDone={(r) => setProgress(saveProgress(store(), ex.key, r))} />;
  return (
    <div className="space-y-6">
      <ToolGuide
        what={<>Once a year a company files an <strong>IR4</strong>: its income tax return. It starts from the profit in the accounts, but the tax rules don&apos;t always agree with the accounting rules, so the profit is adjusted to <strong>taxable income</strong>. The company pays {pct(COMPANY_TAX_RATE, 0)} of that, less the tax it&apos;s already paid. Here you do Kōwhai&apos;s real returns for both years.</>}
        steps={[
          <>Pick a <strong>return</strong> below. Start with year 1: year 2 has more adjustments and a dividend.</>,
          <><strong>Profit to taxable income</strong>: sort each item from the year: add it back, deduct it, or no adjustment. Then work out taxable income.</>,
          <><strong>Fill in the IR4</strong>: each box shows IRD&apos;s own wording and what goes in it in plain English. Use your own figures from step 1.</>,
          <><strong>Dates</strong>: when it&apos;s due, when the tax is paid, and what it means for next year. Then compare your return with Kōwhai&apos;s.</>,
        ]}
        read={<>Each box is marked against <em>your own</em> earlier boxes, so one slip doesn&apos;t make every later box wrong. <strong>Box 30L</strong> is the answer: <strong>terminal tax</strong> to pay, or a refund. In the imputation return, <strong>CR</strong> (credit) means the company has credits to pass on with dividends. A shareholder&apos;s current account in <strong>CR</strong> means the company owes them money; <strong>DR</strong> would mean they owe the company.</>}
        terms={[
          { k: "ir4", says: "the company's income tax return, filed once a year." },
          { k: "tax-adjustment", label: "Tax adjustment", says: "a difference between the accounting rules and the tax rules, added to or taken off profit." },
          { k: "taxable-income", says: "the income tax is worked out on: profit after the tax adjustments." },
          { k: "rwt", says: "tax the bank takes off interest before paying it. The company gets credit for it." },
          { k: "residual-income-tax", label: "RIT", says: "the year's tax less credits like RWT, before provisional tax. It sets next year's provisional tax." },
          { k: "provisional-tax", says: "income tax paid during the year, in instalments." },
          { k: "terminal-tax", says: "the rest of the year's tax, paid after the return." },
          { k: "shareholder-salary", says: "pay to an owner who works in the business, with no PAYE taken off. It's listed in Question 40." },
          { k: "shareholder-current-account", label: "Current account", says: "what the company owes each owner (or they owe it)." },
          { k: "annual-imputation-return", label: "Imputation return", says: "the year's movements in the company's imputation credit account, at the back of the IR4." },
        ]}
      />
      <div className="prose-learn max-w-3xl text-[16px]">
        <p>Kōwhai&apos;s accountant is a <Term k="tax-agent">tax agent</Term>, so it gets extra time to file: the return isn&apos;t due until the following March.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {IR4_EXERCISES.map((e) => {
          const p = progress[e.key];
          return (
            <button key={e.key} onClick={() => setKey(e.key)} className="rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 hover:ring-kowhai-500">
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                <span>{e.year} · 1 April {e.ret.year - 1} to 31 March {e.ret.year}</span>
                {e.level === "harder" && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Harder</span>}
              </div>
              <div className="mt-1 font-bold">{e.title}</div>
              <div className="text-sm text-stone-600">{e.blurb}</div>
              {p && <div className="mt-2 text-xs font-semibold text-kowhai-700">Best: {p.sorted}/{p.of} sorted, {p.boxes}/{p.ofBoxes} boxes, dates {p.dates}/3</div>}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-stone-500">
        Box numbers and wording are from IRD&apos;s <a href={IR4_SOURCE.form} className="underline">IR4 {IR4_SOURCE.formYear}</a> and its <a href={IR4_SOURCE.guide} className="underline">guide</a> (checked {IR4_SOURCE.checked}), with the years moved on. IRD publishes each year&apos;s form around March.
      </p>
      <UsNote>
        <p>A US corporation files <strong>Form 1120</strong> with the IRS. The book-to-tax differences you sort in step 1 go on its <strong>Schedule M-1</strong> (or M-3 for big companies): the same idea, a reconciliation from book income to taxable income.</p>
        <p>The federal corporate rate is a flat 21%, plus state tax. There&apos;s no imputation: a dividend is taxed again in the shareholder&apos;s hands, though usually at a lower &quot;qualified dividend&quot; rate. NZ&apos;s imputation credits pass the company&apos;s tax on to the owners, so profit isn&apos;t taxed twice.</p>
      </UsNote>
    </div>
  );
}

/* ───────── one return ───────── */

function Run({ ex, onBack, onDone }: { ex: Ir4Exercise; onBack: () => void; onDone: (r: Progress[string]) => void }) {
  const [sort, setSort] = useState<Record<string, Dir>>({});
  const [checked, setChecked] = useState(false);
  const [taxable, setTaxable] = useState("");
  const [taxableDone, setTaxableDone] = useState(false);
  const [typed, setTyped] = useState<Partial<Record<EntryKey, string>>>({});
  const [payOrRefund, setPayOrRefund] = useState<"pay" | "refund" | null>(null);
  const [marked, setMarked] = useState(false);
  const [dates, setDates] = useState<Record<string, number>>({});
  const saved = useRef(false);
  const step2 = useRef<HTMLDivElement>(null);

  const boxes = useMemo(() => ir4Boxes(ex.ret.year), [ex]);
  const groups = useMemo(() => entryGroups(ex), [ex]);
  const allKeys = groups.flatMap((g) => g.keys);
  const right = ex.items.filter((i) => sort[i.id] === i.dir).length;
  const allSorted = ex.items.every((i) => sort[i.id]);
  const fromSort = taxableFrom(ex, sort);
  const taxableRight = isRight(taxable, fromSort);
  const ownTaxable = readAmount(taxable) ?? fromSort;
  const want = expected(ex, ownTaxable, typed);
  const boxesRight = allKeys.filter((k) => isRight(typed[k], want[k])).length;
  const pay = ownPay(ex, ownTaxable, typed);
  const signRight = payOrRefund === (pay ? "pay" : "refund");
  const datesRight = ex.questions.filter((q) => dates[q.id] === q.answer).length;
  const allDates = ex.questions.every((q) => dates[q.id] !== undefined);

  useEffect(() => {
    if (marked && allDates && !saved.current) {
      saved.current = true;
      onDone({ sorted: right, of: ex.items.length, boxes: boxesRight + (signRight ? 1 : 0), ofBoxes: allKeys.length + 1, dates: datesRight, done: new Date().toISOString().slice(0, 10) });
    }
  }, [marked, allDates, right, boxesRight, signRight, datesRight, ex, allKeys.length, onDone]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{ex.year}: {ex.title}</h2>
        <button onClick={onBack} className="text-sm font-semibold text-kowhai-700 underline">← Both returns</button>
      </div>

      <Card>
        <h3 className="font-bold">1. Profit to taxable income</h3>
        <p className="mt-1 text-sm text-stone-600">
          Kōwhai&apos;s accounts show a profit before tax of <strong className="num">{money(ex.profitBeforeTax)}</strong> for the year to 31 March {ex.ret.year}. Tax is worked out on <Term k="taxable-income">taxable income</Term> instead.
          For each item, decide: does the tax treatment differ from the accounts? If tax allows <em>less</em> than the accounts deducted (or counts more income), <strong>add it back</strong>. If tax allows <em>more</em>, <strong>deduct</strong> it. If they agree, or it isn&apos;t in profit at all, <strong>no adjustment</strong>.
        </p>
        <ul className="mt-3 divide-y divide-stone-100">
          {ex.items.map((i) => {
            const mine = sort[i.id];
            const ok = mine === i.dir;
            return (
              <li key={i.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">{i.title}</span>
                  <span className="num text-sm">{money(i.amount)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`"${i.title}": add back, deduct, or no adjustment?`}>
                  {DIRS.map((d) => (
                    <button key={d.key} role="radio" aria-checked={mine === d.key} disabled={checked} onClick={() => setSort((s) => ({ ...s, [i.id]: d.key }))}
                      className={cx("rounded-lg px-2.5 py-1 text-xs ring-1", mine === d.key ? "bg-ink text-white ring-ink"
                        : checked && d.key === i.dir ? "bg-emerald-100 font-semibold text-emerald-900 ring-2 ring-emerald-600" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
                      {d.label}
                    </button>
                  ))}
                </div>
                {checked && (
                  <p className={cx("mt-2 rounded-lg p-2 text-sm", ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900")}>
                    {ok ? "✓ " : `✗ It's ${DIRS.find((d) => d.key === i.dir)!.answer}. `}{i.why}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {!checked ? (
          <button disabled={!allSorted} onClick={() => setChecked(true)} className="mt-3 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85 disabled:opacity-40">
            {allSorted ? "Check my sorting" : `Sort them all first (${Object.keys(sort).length}/${ex.items.length})`}
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="font-semibold">{right} of {ex.items.length} right.</p>
            <label className="block">
              <span className="text-sm">Now your <strong>taxable income</strong>: {money(ex.profitBeforeTax)} + everything <em>you</em> added back − everything <em>you</em> deducted.</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input inputMode="decimal" aria-label="Taxable income" value={taxable} disabled={taxableDone} onChange={(e) => setTaxable(e.target.value)}
                  className={cx("num w-44 rounded-lg px-3 py-1.5 ring-1", taxableDone ? (taxableRight ? "ring-emerald-600" : "ring-rose-600") : "ring-stone-300")} />
                {!taxableDone
                  ? <button disabled={readAmount(taxable) === null} onClick={() => { setTaxableDone(true); setTimeout(() => step2.current?.scrollIntoView({ behavior: "smooth" }), 50); }} className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Check, and go on to the IR4</button>
                  : <span className="text-sm">{taxableRight ? "✓" : `✗ From your sorting it's ${money(fromSort)}. The IR4 below carries on from your figure, so the rest can still be right.`}</span>}
              </div>
            </label>
            <Callout kind="warn" title="Common mistake">Copying the accounts&apos; profit straight onto the tax return. The accounts follow accounting standards; tax follows the Income Tax Act. Where they differ, the return uses taxable income.</Callout>
          </div>
        )}
      </Card>

      {taxableDone && (
        <div ref={step2}>
          <Card>
            <h3 className="font-bold">2. Fill in the IR4</h3>
            <p className="mt-1 text-sm text-stone-600">Your taxable income is <strong className="num">{money(ownTaxable)}</strong>. Cents in every box except the two whole-dollar ones (30A and 33B).</p>
            <AlreadyAnswered ex={ex} />
            <div className="mt-4 space-y-6">
              {groups.map((g) => (
                <section key={g.title}>
                  <h4 className="border-b border-stone-200 pb-1 text-sm font-bold uppercase tracking-wider text-stone-600">{g.title}</h4>
                  <div className="mt-3 space-y-4">
                    {g.keys.map((k) => <BoxInput key={k} k={k} ex={ex} boxes={boxes} typed={typed} setTyped={setTyped} marked={marked} want={want[k]} />)}
                    {g.keys.includes("30L") && (
                      <div>
                        <span className="text-sm font-semibold">Box 30L is…</span>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {(["pay", "refund"] as const).map((x) => (
                            <button key={x} disabled={marked} onClick={() => setPayOrRefund(x)} aria-pressed={payOrRefund === x}
                              className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ring-1", payOrRefund === x ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300")}>
                              {x === "pay" ? "Tax to pay" : "A refund"}
                            </button>
                          ))}
                          {marked && <span className="text-sm">{signRight ? "✓" : pay ? "✗ 30J is larger than 30K, so it's tax to pay" : "✗ 30K is larger than 30J, so it's a refund"}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  {g.keys.includes("20B") && <Callout kind="warn" title="Common mistake">Putting the interest in 20B as well as 13B. The accounts&apos; profit includes the interest, so take it out of 20B, or it&apos;s taxed twice.</Callout>}
                  {g.keys.includes("30K") && <Callout kind="warn" title="Common mistake">{ex.ret.year === 2028 ? "Leaving out the third instalment because it was paid after 31 March. It's provisional tax for this year, so it counts in 30K." : "Leaving out a voluntary payment. Any provisional tax paid for the year counts, voluntary or not."}</Callout>}
                  {g.keys.includes("44") && <Callout kind="warn" title="Common mistake">The imputation return is for the <em>tax year</em>, by the date tax was paid. {ex.ret.year === 2028 ? "Year 1's terminal tax is paid on 7 April 2028, after this tax year ends, so it goes in the 2029 return, not this one." : "The terminal tax for this year is paid in April 2028, so it belongs in a later imputation return."}</Callout>}
                </section>
              ))}
            </div>
            {!marked && <button onClick={() => setMarked(true)} className="mt-5 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Mark my IR4</button>}
            {marked && <p className="mt-4 font-semibold">{boxesRight + (signRight ? 1 : 0)} of {allKeys.length + 1} right.</p>}
          </Card>
        </div>
      )}

      {marked && (
        <Card>
          <h3 className="font-bold">3. Dates and what comes next</h3>
          <div className="mt-3 space-y-5">
            {ex.questions.map((q) => {
              const a = dates[q.id];
              return (
                <div key={q.id}>
                  <p className="font-semibold">{q.q}</p>
                  <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label={q.q}>
                    {q.options.map((o, n) => (
                      <button key={n} role="radio" aria-checked={a === n} disabled={a !== undefined} onClick={() => setDates((d) => ({ ...d, [q.id]: n }))}
                        className={cx("rounded-lg px-3 py-2 text-left text-sm ring-1", a === undefined ? "bg-white ring-stone-300 hover:ring-kowhai-500"
                          : n === q.answer ? "bg-emerald-50 font-semibold ring-2 ring-emerald-600" : a === n ? "bg-rose-50 ring-rose-600" : "bg-white opacity-60 ring-stone-200")}>
                        {o}
                      </button>
                    ))}
                  </div>
                  {a !== undefined && <p className={cx("mt-2 rounded-lg p-2 text-sm", a === q.answer ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900")}>{a === q.answer ? "✓ " : "✗ "}{q.why}</p>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {marked && allDates && <Compare ex={ex} typed={typed} right={{ sorted: right, boxes: boxesRight + (signRight ? 1 : 0), ofBoxes: allKeys.length + 1, dates: datesRight }} />}
    </div>
  );
}

function label(k: EntryKey, ex: Ir4Exercise, boxes: ReturnType<typeof ir4Boxes>) {
  if (k.startsWith("40B:") || k.startsWith("40E:")) {
    const s = ex.ret.shareholders[Number(k.slice(4))];
    const first = s.name.split(" ")[0];
    return k.startsWith("40B")
      ? { box: `Box 40B · ${first}`, form: "Remuneration with no PAYE deducted", plain: `${first}'s shareholder salary for the year, credited to the current account.` }
      : { box: `Box 40E · ${first}`, form: "Current account balance (Tick 1: CR or DR)", plain: `${first}'s current account at 31 March ${ex.ret.year}. It's in credit (CR): the company owes ${first} this.` };
  }
  const b = boxes[k as Ir4BoxKey];
  return { box: `Box ${k}`, form: b.form, plain: b.plain };
}

function BoxInput({ k, ex, boxes, typed, setTyped, marked, want }: {
  k: EntryKey; ex: Ir4Exercise; boxes: ReturnType<typeof ir4Boxes>; typed: Partial<Record<EntryKey, string>>;
  setTyped: (f: (t: Partial<Record<EntryKey, string>>) => Partial<Record<EntryKey, string>>) => void; marked: boolean; want: number;
}) {
  const l = label(k, ex, boxes);
  const ok = isRight(typed[k], want);
  const whole = k === "30A" || k === "33B";
  return (
    <label className="block">
      <span className="text-sm"><strong>{l.box}</strong> <span className="text-stone-600">&ldquo;{l.form}&rdquo;</span></span>
      <span className="block text-xs text-stone-500">{l.plain}</span>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-sm">$</span>
        <input inputMode="decimal" value={typed[k] ?? ""} disabled={marked} aria-label={l.box} onChange={(e) => setTyped((t) => ({ ...t, [k]: e.target.value }))}
          className={cx("num w-40 rounded-lg px-3 py-1.5 ring-1", marked ? (ok ? "ring-emerald-600" : "ring-rose-600") : "ring-stone-300")} />
        {whole && <span className="num text-sm text-stone-500">.00</span>}
        {marked && <span className="text-sm">{ok ? "✓" : `✗ ${money(want, { dp: whole ? 0 : 2 })}`}</span>}
      </div>
      {marked && !ok && <span className="mt-0.5 block text-xs text-stone-500">{working(k, ex)}</span>}
    </label>
  );
}

function working(k: EntryKey, ex: Ir4Exercise) {
  const y = ex.ret.year;
  if (k.startsWith("40B")) return "The salary the directors' resolution gave them at year end: no PAYE was taken off.";
  if (k.startsWith("40E")) return "The current account's balance in the balance sheet at 31 March.";
  switch (k as Ir4BoxKey) {
    case "13A": return ex.ret.boxes["13A"] ? "From the bank's RWT certificate: the RWT on the term deposit interest." : "Kōwhai earned no interest this year, so 0.";
    case "13B": return ex.ret.boxes["13B"] ? "The interest before RWT: the Interest income account (450)." : "Kōwhai earned no interest this year, so 0.";
    case "17A": return "Only 13A has anything in it, so 17A is the same as 13A.";
    case "20B": return "Your taxable income from step 1, less the interest in 13B.";
    case "29": return "13B + 20B: there are no donations, losses brought forward or group offsets.";
    case "30A": return "Box 29 with the cents dropped (not rounded).";
    case "30B": return `Your Box 30A × ${pct(COMPANY_TAX_RATE, 0)}, to the cent.`;
    case "30I": return "A copy of 17A.";
    case "30J": return "30B − 30I (30H is the same as 30B for Kōwhai).";
    case "30K": return y === 2028 ? "All three instalments for the 2028 year: 28 August, 15 January and 7 May." : "The voluntary payment made on 15 January 2027.";
    case "30L": return "30J − 30K, written without a minus sign.";
    case "33B": return "30J × 1.05, with the cents dropped.";
    case "41": return y === 2027 ? "A new company has no closing balance to bring forward: 0." : "Last year's closing balance (Box 44 of the 2027 return).";
    case "42A": return `The provisional tax paid between 1 April ${y - 1} and 31 March ${y}.`;
    case "42B": return ex.ret.boxes["42B"] ? "The RWT on the interest (the same as 13A)." : "No interest, so no RWT: 0.";
    case "43B": return ex.ret.boxes["43B"] ? "The imputation credits attached to the dividend paid in February 2028." : "No dividend was paid: 0.";
    default: return "41 + 42A + 42B − 43B.";
  }
}

function AlreadyAnswered({ ex }: { ex: Ir4Exercise }) {
  const y = ex.ret.year;
  const items = [
    "Q9 Non-resident? No",
    "Q10 Includes the annual imputation return? Yes",
    "Q12, 14 to 16, 18, 19, 21, 22: No (no schedular payments, dividends received, overseas or rental income, property sales or other income)",
    "Q24, 26, 28: No (no donations, losses or group companies)",
    ex.ret.startDate ? `Q32 First year deriving income? Yes, from ${nzDate(ex.ret.startDate)}. No initial provisional tax liability: RIT is under ${money(PROVISIONAL_TAX.initialLiabilityRit, { dp: 0 })}` : "Q32 First year deriving income? No",
    `Q33A Option for ${y + 1} provisional tax: S (standard)`,
    "Q34 to 38: No (no non-residents, share buy-backs, foreign dividends or overseas owners)",
    "Q39 Shareholders' total lowest economic interests: 100%",
  ];
  return (
    <details className="mt-3 rounded-lg bg-stone-50 p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Questions already answered for you ({items.length})</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-600">{items.map((i) => <li key={i}>{i}</li>)}</ul>
      <p className="mt-2 text-stone-600">Box 20B also needs the financial statements, or an IR10 summary of them. Kōwhai attaches its accounts, which the guide allows, so there&apos;s no IR10.</p>
    </details>
  );
}

function Compare({ ex, typed, right }: { ex: Ir4Exercise; typed: Partial<Record<EntryKey, string>>; right: { sorted: number; boxes: number; ofBoxes: number; dates: number } }) {
  const rows: Ir4BoxKey[] = ["13B", "20B", "29", "30A", "30B", "30J", "30K", "30L", "33B", "44"];
  const b = ex.ret.boxes;
  const key = answerKey(ex);
  const perfect = right.sorted === Object.keys(key).length && right.boxes === right.ofBoxes;
  return (
    <Card>
      <h3 className="font-bold">Your IR4 beside Kōwhai&apos;s</h3>
      <p className="mt-1 text-sm">{right.sorted}/{ex.items.length} sorted right · {right.boxes}/{right.ofBoxes} boxes right · dates {right.dates}/{ex.questions.length}. Your best result is saved on this device.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1 pr-2">Box</th><th className="px-2 text-right">Yours</th><th className="pl-2 text-right">Kōwhai&apos;s</th></tr></thead>
          <tbody>
            {rows.map((k) => {
              const mine = readAmount(typed[k]);
              const same = mine !== null && Math.abs(mine - b[k]) < 0.015;
              const whole = k === "30A" || k === "33B";
              return (
                <tr key={k} className={cx("border-b border-stone-100", !same && "bg-rose-50")}>
                  <td className="py-1.5 pr-2">Box {k}</td>
                  <td className="num px-2 text-right">{mine === null ? "–" : money(mine, { dp: whole ? 0 : 2 })}</td>
                  <td className="num pl-2 text-right">{money(b[k], { dp: whole ? 0 : 2 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Callout kind={perfect ? "tip" : "why"} title={`${money(b["30L"])} of terminal tax`}>
        Kōwhai&apos;s {ex.ret.year} tax was {money(b["30B"])}. {money(r2Sum(b["30I"], b["30K"]))} of it was already paid ({b["30I"] ? "RWT and provisional tax" : "provisional tax"}), so it pays the last {money(b["30L"])} by 7 April {ex.ret.year + 1}.
        Its residual income tax of {money(b["30J"])} sets the {ex.ret.year + 1} year&apos;s provisional tax: {money(b["33B"], { dp: 0 })} on the standard option.{" "}
        <Link href="/explore/provisional-tax" className="underline">Plan the provisional tax</Link> · <Link href="/nz/income-tax" className="underline">Company income tax</Link>.
      </Callout>
    </Card>
  );
}

const r2Sum = (a: number, b: number) => Math.round((a + b) * 100) / 100;
