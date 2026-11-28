"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAY_RUN_EXERCISES, type PayRunExercise } from "@/data/study/payRun";
import type { PayResult } from "@/lib/nz/payroll";
import { money, nzDate, pct } from "@/lib/money";
import { isRight, loadProgress, readAmount, saveProgress, slipLines, type LineKey, type Progress } from "@/lib/study/payRun";
import { cx } from "@/lib/ui";
import { HOLIDAYS } from "@/lib/nz/rates";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";
import { EntryView } from "./DrillRun";

const store = () => (typeof window === "undefined" ? undefined : window.localStorage);

/** the glossary term behind each payslip line, so a beginner can tap it for the full explanation */
const TERM: Partial<Record<LineKey, string>> = {
  holiday: "pay-as-you-go", gross: "gross-pay", acc: "acc-earners-levy", ietc: "ietc", paye: "paye",
  studentLoan: "student-loan", ksEmployee: "kiwisaver", net: "net-pay", ksEmployer: "employer-kiwisaver", esct: "esct",
};

export function PayRunPractice() {
  const [key, setKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved progress after hydration
    setProgress(loadProgress(store()));
  }, []);
  const ex = PAY_RUN_EXERCISES.find((e) => e.key === key);
  if (ex) return <Run key={ex.key} ex={ex} onBack={() => setKey(null)} onDone={(r) => setProgress(saveProgress(store(), ex.key, r))} />;
  return (
    <div className="space-y-6">
      <ToolGuide
        what={<>A pay run from start to finish, using Kōwhai&apos;s real staff and figures: what each person earned, what&apos;s taken out of their pay for tax and KiwiSaver, what they take home, how it&apos;s recorded in the books, and what&apos;s reported and paid to IRD.</>}
        steps={[
          <>Pick a <strong>pay run</strong> below. Start with the first: the ones marked <em>Harder</em> include annual leave.</>,
          <><strong>The payslips</strong>: fill in each line from the top down. Hours × rate gives gross pay; each deduction is worked from it. PAYE has its own short worksheet; press <strong>Use the PAYE tables</strong> if you just want it done for you, as payroll software would.</>,
          <><strong>The journal entry</strong>: record the whole pay run. Tick <strong>Harder</strong> to work out the amounts yourself.</>,
          <><strong>Payday filing and paying IRD</strong>: answer when the pay is reported and when the deductions are paid.</>,
        ]}
        read={<>Each payslip line is checked to the cent against <em>your own</em> earlier figures, so one slip doesn&apos;t make every later line wrong. <strong>Who gets what</strong> shows where each dollar of the pay run goes: to the staff, to IRD, or to their KiwiSaver fund. IRD drops the cents at set steps (it truncates), so a figure a cent below simple rounding can still be right.</>}
        terms={[
          { k: "gross-pay", says: "pay before anything is taken out: hours × hourly rate, plus holiday pay." },
          { k: "paye", says: "income tax taken from each pay and passed to IRD. It includes the ACC earners' levy." },
          { k: "acc-earners-levy", label: "ACC earners' levy", says: "the employee's ACC cover for injuries outside work. It's collected through PAYE." },
          { k: "ietc", label: "IETC", says: "a small tax credit for people on middle incomes. It reduces their PAYE." },
          { k: "student-loan", label: "Student loan", says: "repayments taken from the part of each pay above a set threshold (the threshold depends on how often you're paid)." },
          { k: "kiwisaver", says: "retirement savings: the employee pays a share of their gross pay, and the employer adds at least the minimum on top." },
          { k: "esct", label: "ESCT", says: "tax on the employer's KiwiSaver contribution, taken before it reaches the fund." },
          { k: "holiday-pay", says: `a casual like Leo gets ${pct(HOLIDAYS.payAsYouGoRate, 0)} extra on each pay instead of taking paid annual leave.` },
          { k: "net-pay", label: "Take-home pay", says: "what's paid into the person's bank account after every deduction." },
          { k: "payday-filing", says: "reporting each pay run to IRD within 2 working days of payday." },
        ]}
      />
      <div className="prose-learn max-w-3xl text-[16px]">
        <p>Every second Wednesday Kōwhai pays its two staff: Mia, a full-time barista, and Leo, a casual kitchen hand. A <strong>pay run</strong> is more than sending them money. The café is also IRD&apos;s tax collector: it works out each person&apos;s <Term k="gross-pay">gross pay</Term>, takes off <Term k="paye">PAYE</Term> (income tax and the <Term k="acc-earners-levy">ACC earners&apos; levy</Term>), any <Term k="student-loan">student loan</Term> repayment and their <Term k="kiwisaver">KiwiSaver</Term>, pays them the rest (<Term k="net-pay">net pay</Term>), and passes the deductions on to IRD.</p>
        <p>You&apos;ll do one of Kōwhai&apos;s real pay runs in three steps:</p>
        <ol>
          <li><strong>The payslips</strong>: each line, from the timesheet down to take-home pay, with PAYE worked out the way IRD tells payroll software to.</li>
          <li><strong>The journal entry</strong>: recording the pay run in the books.</li>
          <li><strong>Payday filing and paying IRD</strong>: what&apos;s reported, and when the money goes.</li>
        </ol>
        <p>Every line is marked to the cent, against <em>your</em> earlier figures, so one slip doesn&apos;t make everything after it wrong.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAY_RUN_EXERCISES.map((e) => {
          const p = progress[e.key];
          return (
            <button key={e.key} onClick={() => setKey(e.key)} className="rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 hover:ring-kowhai-500">
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                <span>{e.year} · {nzDate(e.run.date)}</span>
                {e.level === "harder" && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Harder</span>}
              </div>
              <div className="mt-1 font-bold">{e.title}</div>
              <div className="text-sm text-stone-600">{e.blurb}</div>
              {p && <div className="mt-2 text-xs font-semibold text-kowhai-700">Best: {p.lines}/{p.of} payslip lines, entry {p.entry ? "✓" : "✗"}, filing {p.filing}/3</div>}
            </button>
          );
        })}
      </div>
      <UsNote>
        <p>In the US, employers withhold federal (and usually state) income tax based on the employee&apos;s <strong>W-4</strong>, plus <strong>FICA</strong>: Social Security (6.2%) and Medicare (1.45%), which the employer matches with its own 7.65%. Deposits follow a schedule and Form 941 is filed quarterly, with a W-2 at year end.</p>
        <p>NZ has no FICA and no employer payroll tax. The employer&apos;s extra cost is compulsory <strong>KiwiSaver</strong> (a US 401(k) match is optional), and every pay run is reported to IRD within 2 working days (payday filing).</p>
      </UsNote>
    </div>
  );
}

type Answers = Record<string, Partial<Record<LineKey, string>>>;

function Run({ ex, onBack, onDone }: { ex: PayRunExercise; onBack: () => void; onDone: (r: Progress[string]) => void }) {
  const [typed, setTyped] = useState<Answers>({});
  const [tables, setTables] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const [entry, setEntry] = useState<boolean | null>(null);
  const [hard, setHard] = useState(false);
  const [filing, setFiling] = useState<Record<number, number>>({});
  const top = useRef<HTMLDivElement>(null);

  const slips = useMemo(() => ex.run.results.map((r) => {
    const t = typed[r.employee.id] ?? {};
    const nums = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, readAmount(v)])) as Partial<Record<LineKey, number | null>>;
    const args = { employee: r.employee, hours: r.hours, rates: ex.rates, esctRate: ex.esct[r.employee.id], leave: ex.leaveId === r.employee.id };
    let lines = slipLines({ ...args, typed: nums });
    // "Use the PAYE tables": the PAYE steps are worked out live from the learner's own gross pay, like payroll software
    if (tables[r.employee.id]) {
      for (const l of lines) if (l.payeStep) delete nums[l.key];
      lines = slipLines({ ...args, typed: nums });
      for (const l of lines) if (l.payeStep) nums[l.key] = l.want;
    }
    return { r, lines, nums };
  }), [ex, typed, tables]);
  const allLines = slips.flatMap((s) => s.lines.map((l) => ({ id: s.r.employee.id, l, got: s.nums[l.key] })));
  const counted = allLines.filter((x) => !(x.l.payeStep && tables[x.id]));
  const linesRight = counted.filter((x) => isRight(x.got, x.l.want)).length;
  const allTyped = allLines.every((x) => (x.l.payeStep && tables[x.id]) || x.got !== null && x.got !== undefined);

  const setLine = (id: string, k: LineKey, v: string) => setTyped((a) => ({ ...a, [id]: { ...a[id], [k]: v } }));
  const fillFromTables = (id: string) => setTables((t) => ({ ...t, [id]: true }));

  const questions = filingQuestions(ex);
  const filingRight = questions.filter((q, i) => filing[i] === q.answer).length;
  const filingDone = Object.keys(filing).length === questions.length;
  useEffect(() => {
    if (filingDone && entry !== null) onDone({ lines: linesRight, of: counted.length, entry, filing: filingRight, done: new Date().toISOString().slice(0, 10) });
    // record once, when the last answer is in
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filingDone]);

  return (
    <div ref={top} className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{ex.year}: {ex.title}, payday {nzDate(ex.run.date)}</h2>
        <button onClick={onBack} className="text-sm font-semibold text-kowhai-700 underline">← All pay runs</button>
      </div>
      <p className="-mt-3 text-stone-600">{ex.blurb} The pay covers {nzDate(ex.run.periodFrom)} to {nzDate(ex.run.periodTo)}.</p>

      <h3 className="text-lg font-bold">1. The payslips</h3>
      <Callout kind="tip" title="How to fill in a payslip">
        Work down from the top. Each line says what it is; tap an underlined word for its full meaning. Type amounts in dollars and cents (e.g. 2080.00).
        PAYE has its own short worksheet: IRD&apos;s exact steps. If you only want the big picture, press <strong>Use the PAYE tables</strong> and it&apos;s filled in for you, as payroll software would.
      </Callout>
      {slips.map(({ r, lines, nums }) => (
        <Card key={r.employee.id}>
          <Timesheet r={r} ex={ex} />
          <div className="mt-4 space-y-3">
            {lines.map((l, i) => {
              const firstPaye = l.payeStep && !lines[i - 1]?.payeStep;
              const given = l.payeStep && tables[r.employee.id];
              const ok = isRight(nums[l.key], l.want);
              return (
                <div key={l.key}>
                  {firstPaye && (
                    <div className="mb-2 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2">
                      <span className="text-sm font-semibold">PAYE: IRD&apos;s steps, as payroll software works it out</span>
                      {!checked && !tables[r.employee.id] && <button onClick={() => fillFromTables(r.employee.id)} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold ring-1 ring-stone-300 hover:ring-kowhai-500">Use the PAYE tables</button>}
                    </div>
                  )}
                  <label className={cx("block", l.payeStep && "pl-3 border-l-2 border-stone-200")}>
                    <span className={cx("block text-sm", l.key === "gross" || l.key === "net" || l.key === "paye" ? "font-bold" : "font-semibold")}>
                      {TERM[l.key] ? <Term k={TERM[l.key]!}>{l.label}</Term> : l.label}
                    </span>
                    <span className="block text-xs text-stone-500">{l.what}</span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input inputMode="decimal" value={given ? l.want.toFixed(2) : typed[r.employee.id]?.[l.key] ?? ""} disabled={checked || given} aria-label={`${r.employee.name}: ${l.label}`}
                        onChange={(e) => setLine(r.employee.id, l.key, e.target.value)}
                        className={cx("num w-36 rounded-lg px-3 py-1.5 ring-1 disabled:bg-stone-50", checked && !given ? (ok ? "ring-emerald-600" : "ring-rose-600") : "ring-stone-300")} />
                      {given && <span className="text-xs text-stone-500">from the tables</span>}
                      {checked && !given && <span className="text-sm">{ok ? "✓" : `✗ ${money(l.want)}`}</span>}
                    </div>
                    {(checked || given) && <span className="mt-0.5 block text-xs text-stone-600">{l.how}</span>}
                  </label>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      {!checked ? (
        <button disabled={!allTyped} onClick={() => setChecked(true)} className="rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85 disabled:opacity-40">
          {allTyped ? "Check my payslips" : "Fill in every line first"}
        </button>
      ) : (
        <>
          <p className="font-semibold">{linesRight} of {counted.length} lines right{Object.values(tables).some(Boolean) ? " (lines from the PAYE tables aren't counted)" : ""}.</p>
          <WhoGetsWhat results={ex.run.results} />
        </>
      )}

      {checked && (
        <>
          <h3 className="text-lg font-bold">2. The journal entry</h3>
          <Card>
            <PayRunTotals results={ex.run.results} leave={!!ex.leaveId} />
            <Callout kind="warn" title="Common mistakes">
              <ul className="list-disc pl-5">
                <li>Recording only the <strong>net</strong> pay as wages. The expense is the <strong>gross</strong>: the deductions are still part of the wage, paid to IRD for the employee.</li>
                <li>Treating PAYE as the café&apos;s expense. It&apos;s the employee&apos;s tax, so until it&apos;s paid to IRD it&apos;s a <strong>liability</strong> (PAYE &amp; payroll deductions payable).</li>
                <li>Forgetting that employer KiwiSaver is an <strong>extra</strong> expense, on top of the wage.</li>
              </ul>
            </Callout>
            <EntryView q={ex.entry} hard={hard} onHard={setHard} onAnswer={(right) => setEntry(right)} />
          </Card>
        </>
      )}

      {entry !== null && (
        <>
          <h3 className="text-lg font-bold">3. Payday filing and paying IRD</h3>
          <Card className="space-y-5">
            <p className="text-sm text-stone-600"><Term k="payday-filing">Payday filing</Term> means telling IRD about every pay run soon after payday. The money itself goes to IRD once a month.</p>
            {questions.map((q, i) => (
              <div key={i}>
                <div className="font-semibold">{q.q}</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, j) => {
                    const picked = filing[i] === j, answered = filing[i] !== undefined;
                    return (
                      <button key={j} disabled={answered} onClick={() => setFiling((f) => ({ ...f, [i]: j }))}
                        className={cx("rounded-lg px-3 py-2 text-left text-sm ring-1",
                          answered && j === q.answer ? "bg-emerald-50 ring-2 ring-emerald-600" : picked ? "bg-rose-50 ring-rose-600" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
                        {o}
                      </button>
                    );
                  })}
                </div>
                {filing[i] !== undefined && <p className="mt-2 text-sm text-stone-700">{filing[i] === q.answer ? "✓ " : "✗ "}{q.why}</p>}
              </div>
            ))}
          </Card>
        </>
      )}

      {filingDone && entry !== null && (
        <Card>
          <h3 className="font-bold">Your pay run</h3>
          <p className="mt-1 text-sm">{linesRight}/{counted.length} payslip lines · entry {entry ? "right" : "not quite"} · filing {filingRight}/{questions.length}. Your best result is saved on this device.</p>
          <p className="mt-2 text-sm">See the real entry and payslip in the books: <Link href="/nz/paye" className="underline">PAYE and payday filing</Link>, <Link href="/nz/kiwisaver" className="underline">KiwiSaver and ESCT</Link>, <Link href="/nz/holidays" className="underline">Holidays Act</Link>.</p>
          <button onClick={() => { onBack(); top.current?.scrollIntoView(); }} className="mt-3 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Try another pay run</button>
        </Card>
      )}
    </div>
  );
}

function Timesheet({ r, ex }: { r: PayResult; ex: PayRunExercise }) {
  const e = r.employee, leave = ex.leaveId === e.id;
  const rows: [string, string][] = [
    ["Job", e.role],
    [leave ? "Annual leave" : "Hours worked", `${r.hours} hours`],
    ["Hourly rate", money(e.rate)],
    ["Tax code", `${e.code}${e.studentLoan ? " SL" : ""}`],
    ["KiwiSaver", e.kiwiSaver ? `${pct(e.kiwiSaver)} employee, ${pct(ex.rates.kiwiSaver.employerMinimum)} employer` : "not a member"],
    ["ESCT rate this year", pct(ex.esct[e.id])],
  ];
  return (
    <div>
      <h4 className="text-lg font-bold">{e.name}</h4>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-kowhai-50 p-3 text-sm ring-1 ring-kowhai-200">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-stone-600">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
      </dl>
      {e.casual && <p className="mt-1 text-xs text-stone-500">Casual: paid 8% holiday pay with every pay instead of building up annual leave.</p>}
    </div>
  );
}

const sum = (rs: PayResult[], k: keyof PayResult) => Math.round(rs.reduce((s, r) => s + (r[k] as number), 0) * 100) / 100;

/** where every dollar of the pay run goes: the employees, IRD and the KiwiSaver funds */
function WhoGetsWhat({ results }: { results: PayResult[] }) {
  const cost = sum(results, "employerCost");
  const parts = [
    ...results.map((r) => ({ label: `${r.employee.name.split(" ")[0]}'s take-home pay`, v: r.net, c: "bg-[#00b894]" })),
    { label: "IRD: PAYE and student loan", v: Math.round((sum(results, "paye") + sum(results, "studentLoan")) * 100) / 100, c: "bg-[#f47230]" },
    { label: "IRD: ESCT (tax on employer KiwiSaver)", v: sum(results, "esct"), c: "bg-[#f47230]/60" },
    { label: "KiwiSaver funds (employee + employer, via IRD)", v: Math.round((sum(results, "ksEmployee") + sum(results, "ksEmployerNet")) * 100) / 100, c: "bg-[#257de0]" },
  ];
  return (
    <Card>
      <h4 className="font-bold">Who gets what</h4>
      <p className="mt-1 text-sm text-stone-600">This pay run costs Kōwhai <strong>{money(cost)}</strong>: gross wages {money(sum(results, "gross"))} plus employer KiwiSaver {money(sum(results, "ksEmployerGross"))}. Here&apos;s where it all goes.</p>
      <div className="mt-3 flex h-6 overflow-hidden rounded" aria-hidden>
        {parts.map((p) => <div key={p.label} className={cx(p.c, "border-r-2 border-white last:border-r-0")} style={{ width: `${(p.v / cost) * 100}%` }} />)}
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-3">
            <span><i className={cx("mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle", p.c)} />{p.label}</span>
            <span className="num">{money(p.v)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-stone-500">Everything except the take-home pay goes to IRD (it passes the KiwiSaver on to each person&apos;s fund). Until it&apos;s paid, the café owes it: that&apos;s why it&apos;s a liability in the entry.</p>
    </Card>
  );
}

function PayRunTotals({ results, leave }: { results: PayResult[]; leave: boolean }) {
  const rows: [string, number][] = [
    ["Gross pay (all staff)", sum(results, "gross")],
    ["Employer KiwiSaver (gross)", sum(results, "ksEmployerGross")],
    ...results.map((r) => [`Net pay: ${r.employee.name.split(" ")[0]}`, r.net] as [string, number]),
    ["PAYE (incl. earners' levy)", sum(results, "paye")],
    ["Student loan", sum(results, "studentLoan")],
    ["KiwiSaver: employees'", sum(results, "ksEmployee")],
    ["KiwiSaver: employer's, after ESCT", sum(results, "ksEmployerNet")],
    ["ESCT", sum(results, "esct")],
  ];
  return (
    <div className="mb-4">
      <p className="text-sm text-stone-600">The real payslips&apos; totals, to record. Everything taken off the pay, and the employer KiwiSaver, is owed to IRD until the 20th of next month. In the entry each account gets <strong>one line</strong>, so add up the amounts that go to the same account (all the deductions go to <em>PAYE &amp; payroll deductions payable</em>; both net pays come out of the bank).{leave && " This pay includes annual leave: read the story below for which accounts it uses."}</p>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-sm">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt>{k}</dt><dd className="num text-right">{money(v)}</dd></div>)}
      </dl>
    </div>
  );
}

function filingQuestions(ex: PayRunExercise) {
  const deductions = Math.round(ex.txn.lines.filter((l) => l.account === "215").reduce((s, l) => s + (l.credit ?? 0), 0) * 100) / 100;
  const paye = sum(ex.run.results, "paye");
  const sameAsRun = Math.abs(ex.payment.amount - deductions) < 0.005;
  const month = new Date(`${ex.payment.month}-01T00:00:00Z`).toLocaleDateString("en-NZ", { month: "long", year: "numeric", timeZone: "UTC" });
  const amountOptions = sameAsRun
    ? [money(ex.payment.amount), money(paye), money(sum(ex.run.results, "net")), money(sum(ex.run.results, "gross"))]
    : [money(ex.payment.amount), money(deductions), money(paye), money(sum(ex.run.results, "net"))];
  return [
    {
      q: `Payday is Wednesday ${nzDate(ex.run.date)}. By when must Kōwhai file this pay run's employment information with IRD?`,
      options: [nzDate(ex.eiDue), nzDate(ex.payment.date), `The end of ${month}`, "With the next GST return"],
      answer: 0,
      why: `Within 2 working days of payday: ${nzDate(ex.eiDue)}. Employers who file online (through payroll software or myIR) must deliver it "within 2 working days after payday" (Tax Administration Act s 23E(2)). Paper filers get 10 working days (s 23F).`,
    },
    {
      q: "Which of these is NOT reported in the employment information?",
      options: ["Each person's take-home (net) pay", "Each person's gross pay", "PAYE and student loan deducted", "KiwiSaver deducted, and employer KiwiSaver and ESCT"],
      answer: 0,
      why: "For each person IRD gets the tax code, the gross pay, and every deduction and contribution: PAYE, student loan, KiwiSaver, the employer's KiwiSaver after ESCT, and the ESCT. Take-home pay isn't one of the fields (IRD's payroll specification lists them).",
    },
    {
      q: `How much does Kōwhai pay IRD on ${nzDate(ex.payment.date)}?`,
      options: amountOptions,
      answer: 0,
      why: sameAsRun
        ? `${money(ex.payment.amount)}: everything owed to IRD from ${month}'s pay runs (just this one, in ${month}), in one payment by the 20th of the next month. That's PAYE, student loan, both sides of KiwiSaver and ESCT, never the net pay.`
        : `${money(ex.payment.amount)}: everything owed to IRD from all of ${month}'s pay runs, not just this one (${money(deductions)}), in one payment by the 20th of the next month. That's PAYE, student loan, both sides of KiwiSaver and ESCT.`,
    },
  ];
}
