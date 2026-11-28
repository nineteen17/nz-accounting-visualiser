"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ACTUAL, BASE, PRESETS, RATES, payYourself, type Choice, type Result } from "@/data/books/payYourself";
import { accRate, MAX_IC_RATIO } from "@/lib/nz/payYourself";
import { money, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";
import { BOOKKEEPING_RATE, SHAREHOLDERS } from "@/data/business";

const $0 = (x: number) => money(x, { dp: 0 });
/** validated together (dataviz palette, slots 1–3); every bar also has its number beside it */
const COLOURS = { keep: "#257de0", tax: "#f47230", kept: "#00b894" };
const sameChoice = (a: Choice, b: Choice) => a.aroha === b.aroha && a.ben === b.ben && a.dividend === b.dividend;

function Slider({ label, hint, value, max, onChange }: { label: string; hint: string; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="num text-lg font-bold">{$0(value)}</span>
      </div>
      <input type="range" min={0} max={max} step={500} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-kowhai-500" />
      <div className="text-xs text-stone-500">{hint}</div>
    </label>
  );
}

function Row({ label, value, strong, sub, note }: { label: ReactNode; value: number | string; strong?: boolean; sub?: boolean; note?: ReactNode }) {
  return (
    <div className={cx("flex justify-between gap-3 py-0.5", strong && "border-t border-stone-200 pt-1 font-semibold", sub && "text-stone-500")}>
      <dt>{label}{note && <span className="block text-xs font-normal text-stone-500">{note}</span>}</dt>
      <dd className="num shrink-0">{typeof value === "number" ? money(value) : value}</dd>
    </div>
  );
}

type Status = "ok" | "caution" | "fail";
const STATUS: Record<Status, { icon: string; label: string; cls: string }> = {
  ok: { icon: "✓", label: "OK", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  caution: { icon: "!", label: "Check", cls: "bg-amber-50 text-amber-900 ring-amber-200" },
  fail: { icon: "✗", label: "Problem", cls: "bg-rose-50 text-rose-800 ring-rose-200" },
};

function checks(r: Result): { status: Status; title: string; body: ReactNode }[] {
  const y = r.yearEnd;
  const ben = r.benRatio;
  const out: { status: Status; title: string; body: ReactNode }[] = [
    {
      status: y.solvent ? "ok" : "fail",
      title: "Assets more than liabilities (Companies Act s 4(1)(b))",
      body: <>At year end: assets {$0(y.assets)}, liabilities {$0(y.liabilities)} (the owners&apos; current accounts included).{!y.solvent && " The company fails the solvency test: the directors can't sign the certificate, so this dividend can't be paid."}</>,
    },
    {
      status: y.liquid ? "ok" : "fail",
      title: "Can pay its debts as they fall due (s 4(1)(a))",
      body: <>Bank {$0(y.bank)} against {$0(y.current)} due within a year, counting what the company owes Aroha and Ben on their current accounts (they can ask for it at any time).</>,
    },
    {
      status: y.enoughCash ? "ok" : y.liquid ? "caution" : "fail",
      title: "Enough left to keep trading (directors' duties, ss 135–136)",
      body: <>After everything due, {$0(y.cashLeft)} would be left. Three months of the café&apos;s usual spending (suppliers, staff and the loan) is about {$0(BASE.buffer)}.{!y.enoughCash && " Taking this much out risks running the café short of cash."}</>,
    },
    {
      status: r.choice.dividend === 0 || r.company.fullyImputed ? "ok" : "caution",
      title: "Imputation credits",
      body: r.choice.dividend === 0
        ? <>No dividend, so no credits are used. The account had {$0(BASE.ica)} of credits available.</>
        : r.company.fullyImputed
          ? <>Fully imputed: {money(r.company.credits)} of credits attached ({$0(BASE.ica)} available, enough for a dividend of up to {$0(BASE.maxFullyImputed)}).</>
          : <>Only {money(r.company.credits)} of credits are available, so a dividend over {$0(BASE.maxFullyImputed)} is only partly imputed: the owners pay more tax on it, through extra RWT.</>,
    },
    {
      status: ben <= 1.25 ? "ok" : ben <= 1.5 ? "caution" : "fail",
      title: "Ben's salary for the work he does (Income Tax Act s GB 25)",
      body: <>
        Ben works weekends and keeps the books, so he isn&apos;t covered by the full-time exemption. His work would cost about {$0(BASE.benWorth)} a year to employ someone for
        ({SHAREHOLDERS_HOURS} at Leo&apos;s {money(BASE.leoRate)} an hour, plus bookkeeping at an assumed {money(BOOKKEEPING_RATE, { dp: 0 })} an hour). His salary is {ben ? `${ben.toFixed(2)}×` : "none of"} that.
        {ben > 1.5 ? " IRD could treat the excess as a dividend." : ben > 1.25 ? " Be ready to justify it." : ""}
        <span className="block text-xs text-stone-500">A teaching guide, not an IRD threshold: the Act has no number.</span>
      </>,
    },
  ];
  if (r.company.loss) out.push({ status: "caution", title: "A tax loss", body: <>Salaries are more than the taxable income, so the company has a loss of {$0(r.company.loss)} to carry forward. It pays no tax this year, but the owners are taxed on all of their salaries.</> });
  const unused = r.owners.filter((o) => o.icUnused > 0.5);
  if (unused.length) out.push({ status: "caution", title: "Imputation credits not used", body: <>{unused.map((o) => `${o.name.split(" ")[0]} has ${money(o.icUnused)} more credits than tax`).join("; ")}. Unused credits aren&apos;t refunded: they become a loss to carry forward (s LE 2). Company tax paid at 28% for someone whose rate is lower.</> });
  const prov = r.owners.filter((o) => o.provisional);
  if (prov.length) out.push({ status: "ok", title: "Personal provisional tax next year", body: <>{prov.map((o) => o.name.split(" ")[0]).join(" and ")} {prov.length > 1 ? "owe" : "owes"} more than $5,000 at year end, so they pay provisional tax through next year too (s RC 3).</> });
  return out;
}
const BEN = SHAREHOLDERS.find((s) => s.id === "ben")!;
const SHAREHOLDERS_HOURS = `${BEN.hours.cafe} hours of café shifts and ${BEN.hours.books} of bookkeeping a week`;

function OwnerCard({ o }: { o: Result["owners"][number] }) {
  const first = o.name.split(" ")[0];
  return (
    <Card>
      <h3 className="font-bold">{first}&apos;s IR3</h3>
      <p className="text-xs text-stone-500">{o.role}{o.otherIncome ? `; also earns ${$0(o.otherIncome)} in an IT job (assumed), taxed through PAYE` : ""}</p>
      <dl className="mt-3 space-y-0.5 text-sm">
        <Row label={<Term k="shareholder-salary">Shareholder salary</Term>} value={o.salary} />
        <Row label="Dividend (cash)" value={o.dividend.cash} />
        <Row label={<>+ <Term k="imputation-credit">imputation credits</Term></>} value={o.dividend.ic} sub note="added on: tax the company already paid" />
        <Row label="= Income from Kōwhai" value={o.salary + o.dividend.gross} strong />
        <Row label={`Tax on it (top rate ${pct(o.topRate)})`} value={o.tax} note={o.otherIncome ? "the extra tax on top of the IT salary's" : undefined} />
        <Row label="− imputation credits used" value={-o.icUsed} sub note="the company's tax counts towards the owner's" />
        <Row label={<>− dividend <Term k="rwt">RWT</Term> already deducted</>} value={-o.dividend.rwt} sub />
        <Row label={o.toPay >= 0 ? "= To pay IRD" : "= Refund"} value={Math.abs(o.toPay)} strong />
      </dl>
      <div className="mt-3 rounded-lg bg-stone-50 p-3 text-sm">
        <div className="flex justify-between font-bold"><span>{first} keeps</span><span className="num">{money(o.keeps)}</span></div>
        <div className="text-xs text-stone-500">Salary plus the dividend paid, less what&apos;s owed to IRD.</div>
      </div>
      {o.salary > 0 && <p className="mt-2 text-xs text-stone-500">ACC also invoices the company {money(o.acc)} once the IR4 declaring {first}&apos;s salary is filed: the earners&apos;, work and working safer levies ({pct(accRate(RATES), 2)}). Shareholder salaries have no PAYE, so ACC bills them instead. The work and working safer levies are the company&apos;s cost; the earners&apos; levy is {first}&apos;s own, charged to their current account.</p>}
    </Card>
  );
}

function Compare({ current }: { current: Result }) {
  const rows = [
    ...PRESETS.map((p) => ({ key: p.key, label: p.label, r: payYourself(p.choice) })),
    ...(PRESETS.some((p) => sameChoice(p.choice, current.choice)) ? [] : [{ key: "yours", label: "Your choice", r: current }]),
  ];
  const max = {
    keep: Math.max(...rows.map((x) => x.r.totals.ownersKeep), 1),
    tax: Math.max(...rows.map((x) => x.r.totals.tax), 1),
    kept: Math.max(...rows.map((x) => Math.max(0, x.r.company.kept)), 1),
  };
  const Bar = ({ v, of, colour }: { v: number; of: number; colour: string }) => (
    <span className="mt-1 block h-1.5 rounded-full bg-stone-100">
      <span className="block h-1.5 rounded-full" style={{ width: `${(Math.max(0, v) / of) * 100}%`, background: colour }} />
    </span>
  );
  return (
    <Card>
      <h3 className="text-lg font-bold">All the choices side by side</h3>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-600">
        <span><i className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: COLOURS.keep }} />Owners keep</span>
        <span><i className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: COLOURS.tax }} />Tax and ACC levies, this year</span>
        <span><i className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: COLOURS.kept }} />Profit kept in the company</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500">
              <th className="py-1 pr-1 sm:pr-2">Choice</th><th className="px-1 sm:px-2">Owners keep</th><th className="px-1 sm:px-2">Tax &amp; levies</th><th className="pl-1 sm:pl-2">Kept in company</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, label, r }) => (
              <tr key={key} className={cx("border-b border-stone-100 align-top", sameChoice(r.choice, current.choice) && "bg-kowhai-50 font-semibold")}>
                <td className="py-2 pr-1 sm:pr-2">{label}</td>
                <td className="px-1 py-2 sm:px-2"><span className="num">{$0(r.totals.ownersKeep)}</span><Bar v={r.totals.ownersKeep} of={max.keep} colour={COLOURS.keep} /></td>
                <td className="px-1 py-2 sm:px-2"><span className="num">{$0(r.totals.tax)}</span><Bar v={r.totals.tax} of={max.tax} colour={COLOURS.tax} /></td>
                <td className="py-2 pl-1 sm:pl-2"><span className="num">{$0(r.company.kept)}</span><Bar v={r.company.kept} of={max.kept} colour={COLOURS.kept} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-500">Tax counts the company&apos;s tax, each owner&apos;s extra tax after their imputation credits, and the ACC levy on salaries. Profit kept in the company has only paid 28% so far: when it&apos;s paid out later, each owner pays the difference between 28% and their own rate.</p>
    </Card>
  );
}

export function PayYourselfTool() {
  const [c, setC] = useState<Choice>(ACTUAL);
  const r = useMemo(() => payYourself(c), [c]);
  const set = (k: keyof Choice) => (n: number) => setC((x) => ({ ...x, [k]: n }));
  const ceiling = Math.ceil(BASE.taxableBeforeSalaries / 1_000) * 1_000;

  return (
    <div className="space-y-8">
      <ToolGuide
        what={<>A company&apos;s profit belongs to the company, not its owners. To get it, Aroha and Ben choose how: a salary, a dividend, or leave it in for now. Each is taxed differently. This shows the tax, the money each owner keeps and whether the company can afford it, using Kōwhai&apos;s real year 2.</>}
        steps={[
          <>Start with the <strong>preset buttons</strong>: what the café really did, all salary, dividend only, and so on.</>,
          <>Move the <strong>sliders</strong> to make your own mix.</>,
          <>Read <strong>The company</strong> (its tax) and each owner&apos;s <strong>IR3</strong> (their own tax return).</>,
          <>Compare every choice in <strong>All the choices side by side</strong>, then check <strong>Can the company afford it?</strong></>,
        ]}
        read={<><strong>Owners keep</strong>: their salary and dividend, less their own tax. <strong>Tax &amp; levies</strong>: everything paid to IRD and ACC this year. <strong>Kept in the company</strong>: profit not paid out yet, with more tax to come when it is. In the checks, ✓ is fine, ! needs care, and ✗ means the law says no.</>}
        terms={[
          { k: "shareholder-salary", says: "pay to an owner who works in the business. The company deducts it; the owner pays tax on it in their IR3." },
          { k: "dividend", says: "a share of profit paid to the owners (60/40 here, by shareholding). Not an expense." },
          { k: "imputation-credit", label: "Imputation credits", says: "the company tax already paid, passed to the owners with a dividend so it isn't taxed twice." },
          { k: "imputation-credit-account", label: "ICA", says: "the company's running total of credits it can attach to dividends." },
          { k: "rwt", label: "Dividend RWT", says: "extra tax the company deducts from a dividend when the credits don't cover the owner's rate." },
          { k: "ir3", says: "an individual's income tax return." },
          { k: "solvency-test", says: "before a dividend, the company must be able to pay its debts and have more assets than liabilities." },
          { k: "acc-earners-levy", label: "ACC levies", says: "ACC charges levies on salaries, but not on dividends." },
        ]}
      />
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>
          Aroha and Ben own Kōwhai, so they decide how its profit reaches them: as <Term k="shareholder-salary">shareholder salary</Term>, as a <Term k="dividend">dividend</Term>, or not yet, by keeping it in the company.
          Each is taxed differently, and the law limits all three. This uses year 2 (the 2028 income year): {$0(BASE.taxableBeforeSalaries)} of taxable income before any salaries.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.key} onClick={() => setC(p.choice)} title={p.blurb}
            className={cx("rounded-xl px-4 py-2 text-sm font-semibold ring-1", sameChoice(p.choice, c) ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
            {p.label}
          </button>
        ))}
      </div>
      <p className="-mt-5 text-sm text-stone-600">{PRESETS.find((p) => sameChoice(p.choice, c))?.blurb ?? "Your own mix."}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="space-y-5">
          <Slider label="Aroha's salary" hint="She runs the café full-time." value={c.aroha} max={ceiling} onChange={set("aroha")} />
          <Slider label="Ben's salary" hint="Weekend shifts and the books." value={c.ben} max={ceiling} onChange={set("ben")} />
          <Slider label="Dividend (cash)" hint="Always split 60/40 by shareholding (Companies Act s 53)." value={c.dividend} max={200_000} onChange={set("dividend")} />
        </Card>
        <Card>
          <h3 className="font-bold">The company</h3>
          <dl className="mt-3 space-y-0.5 text-sm">
            <Row label="Taxable income before salaries" value={BASE.taxableBeforeSalaries} />
            <Row label="− shareholder salaries" value={-r.salaries} sub note="deductible to the company" />
            <Row label="= Taxable income" value={r.company.taxable} strong />
            <Row label={`Company tax at ${pct(0.28)}`} value={r.company.tax} />
            <Row label="Profit after tax (in the accounts)" value={r.company.profitAfterTax} strong />
            <Row label="− dividend" value={-r.choice.dividend} sub note="not an expense: paid out of profit" />
            <Row label="= Kept in the company this year" value={r.company.kept} strong />
          </dl>
          <p className="mt-3 text-xs text-stone-500">Credits attached to the dividend: {money(r.company.credits)} (at most {(MAX_IC_RATIO * 100).toFixed(2)}% of the cash, i.e. 28/72).</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {r.owners.map((o) => <OwnerCard key={o.id} o={o} />)}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { l: "Owners keep", v: r.totals.ownersKeep, c: COLOURS.keep },
          { l: "Tax & ACC levies this year", v: r.totals.tax, c: COLOURS.tax },
          { l: "Kept in the company", v: r.company.kept, c: COLOURS.kept },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500"><i className="inline-block h-2 w-3 rounded-sm" style={{ background: x.c }} />{x.l}</div>
            <div className="num mt-1 text-2xl font-bold">{$0(x.v)}</div>
          </div>
        ))}
      </div>

      <Compare current={r} />

      <div>
        <h2 className="mb-3 text-2xl font-bold">Can the company afford it?</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {checks(r).map((x) => (
            <div key={x.title} className={cx("rounded-xl p-4 ring-1", STATUS[x.status].cls)}>
              <div className="font-semibold"><span aria-hidden className="mr-1">{STATUS[x.status].icon}</span><span className="sr-only">{STATUS[x.status].label}: </span>{x.title}</div>
              <div className="mt-1 text-sm">{x.body}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">Tested at year end (31 March 2028) with everything owed, which is stricter than the test on the day the dividend is paid. Salary still counts for the year if it&apos;s paid by the latest date the year&apos;s return could be filed (s EA 4(3)).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Callout kind="why" title="What the numbers show">
          Imputation means profit paid out is taxed <strong>once, at the owner&apos;s own rate</strong>, whichever way it&apos;s paid. With his IT salary, Ben is on 33% either way, so salary or dividend makes no difference to him.
          Aroha&apos;s first {$0(RATES.brackets[1].upTo)} is taxed at 17.5% or less, below the company&apos;s 28%, so salary up to there saves tax; above {$0(RATES.brackets[2].upTo)} she pays 33% either way.
          Keeping profit in the company only <em>delays</em> the top-up from 28% to their own rate.
        </Callout>
        <UsNote>
          <p>A US <strong>C-corporation</strong>&apos;s profit is taxed twice: corporate tax, then the owner&apos;s dividend tax. So owners lean towards salary. An <strong>S-corporation</strong> owner must take &quot;reasonable compensation&quot; as salary before distributions, the opposite worry to NZ&apos;s s GB 25, which is about salary that&apos;s too <em>high</em>.</p>
          <p>NZ&apos;s imputation removes the second layer of tax, so the choice is about rates and timing.</p>
          <p>Could they have avoided the company altogether? See <Link href="/explore/structures" className="underline">Which structure?</Link></p>
        </UsNote>
      </div>

      {RATES.toConfirm.length > 0 && (
        <p className="text-xs text-stone-500">The 2028 income year&apos;s {RATES.toConfirm.filter((x) => x !== "student loan threshold" && x !== "ESCT bands").join(" and ")} are carried forward from 2026–27 until IRD confirms them.</p>
      )}
    </div>
  );
}
