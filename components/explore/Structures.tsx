"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { compare, OWNERS, PRESETS, PROFIT, RANGE, RATES, STRUCTURES, type Key } from "@/data/books/structures";
import { ACTUAL } from "@/data/books/payYourself";
import { accRate } from "@/lib/nz/payYourself";
import type { StructureResult } from "@/lib/nz/structures";
import { ACC_CAFE_LEVIES, COMPANY_TAX_RATE } from "@/lib/nz/rates";
import { money, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";

const $0 = (x: number) => (Math.abs(x) < 0.5 ? "–" : x < 0 ? `(${money(-x, { dp: 0 })})` : money(x, { dp: 0 }));
/** validated together (dataviz palette, slots 1–3), the same as the pay yourself tool; every bar's numbers are in the table */
const COLOURS = { keep: "#257de0", tax: "#f47230", kept: "#00b894" };

type Row = { label: ReactNode; note?: string; value: (r: StructureResult) => number; strong?: boolean };
const ROWS: Row[] = [
  { label: "Income tax now", note: "company and owners, after imputation credits; brackets = a refund", value: (r) => r.taxNow },
  { label: "ACC levies", note: "on the owners' earnings", value: (r) => r.acc },
  { label: "Owners keep", note: "after their tax and levies", value: (r) => r.ownersKeep, strong: true },
  { label: "Kept in the business", note: "a company's profit after tax, not yet paid out", value: (r) => r.kept },
  { label: "Tax still to come", note: "when that kept profit is paid out", value: (r) => r.taxLater },
  { label: "Loss carried forward", value: (r) => r.lossCarried },
  { label: "Tax that loss saves later", value: (r) => r.lossValue },
];

/** the same profit, split three ways: what the owners keep, tax and levies, and what stays in the company */
function Split({ r, profit }: { r: StructureResult; profit: number }) {
  if (profit <= 0) return null;
  const parts = [
    { v: r.ownersKeep, c: COLOURS.keep },
    { v: r.taxNow + r.acc, c: COLOURS.tax },
    { v: Math.max(0, r.kept), c: COLOURS.kept },
  ].filter((p) => p.v > 0.5);
  const total = parts.reduce((s, p) => s + p.v, 0);
  return (
    <span className="mt-1 flex h-2 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
      {parts.map((p, i) => <span key={i} style={{ width: `${(p.v / total) * 100}%`, background: p.c }} className="h-2" />)}
    </span>
  );
}

const FACTS: Record<Key, { tax: string; returns: string; pay: string; loss: string; acc: string; liable: string; limits: string }> = {
  partnership: {
    tax: "Each partner, on their share, at their own rates. The partnership itself pays no income tax.",
    returns: "IR7 for the partnership; each partner's IR3.",
    pay: "A share of the profit, 60/40. A working partner's salary is deductible only under a written contract all the partners sign (s DC 4).",
    loss: "Each partner sets their share against their other income this year.",
    acc: "Partners are self-employed: ACC levies on each one's share of the profit, invoiced from their IR3.",
    liable: "Aroha and Ben are jointly liable for all the firm's debts (Partnership Law Act s 22): their houses and savings are at risk.",
    limits: "None on numbers. A written partnership agreement is advised.",
  },
  company: {
    tax: "The company pays 28%. The owners pay tax on their salaries and dividends, less the imputation credits.",
    returns: "IR4 for the company; each owner's IR3. Plus a Companies Office annual return.",
    pay: "Shareholder salaries and dividends, or leave the profit in the company.",
    loss: "Stays in the company, carried forward to set against its future profit. The owners can't use it.",
    acc: "Only on shareholder salaries, invoiced to the company. None on dividends.",
    liable: "Limited to their shares (Companies Act s 97). But Kōwhai's directors personally guaranteed the bank loan, so they're liable for that.",
    limits: "Directors' duties, the solvency test before a dividend.",
  },
  ltc: {
    tax: "Each owner, on their share, as if it were a partnership (s HB 1). The company pays no income tax.",
    returns: "IR7 and IR7L (how the income is shared out); each owner's IR3. Plus the annual return, as a company.",
    pay: "A share of the profit. A working owner can be paid a salary through PAYE under a written employment contract (s DC 3B).",
    loss: "Each owner sets their share against their other income, as in a partnership.",
    acc: "Owners who work in it are self-employed for ACC on their share. A working owner's PAYE salary has the earners' levy deducted.",
    liable: "Limited, as for a company: it's still a company in law (s 15). The same personal guarantees apply.",
    limits: "5 or fewer counted owners, with relatives counted as one. Every owner must agree to the election (s HB 13).",
  },
  sole: {
    tax: "Aroha, on all the profit, at her own rates.",
    returns: "Aroha's IR3 only.",
    pay: "Drawings. A sole trader can't pay herself a salary: the profit is hers.",
    loss: "Set against Aroha's other income. She has none here, so it's carried forward.",
    acc: "Self-employed: ACC levies on all the profit, up to the maximum.",
    liable: "Unlimited: everything Aroha owns is at risk.",
    limits: "One owner. Ben couldn't be part of it.",
  },
};
const FACT_ROWS: { k: keyof (typeof FACTS)["company"]; label: string }[] = [
  { k: "tax", label: "Who pays income tax" },
  { k: "returns", label: "Tax returns" },
  { k: "pay", label: "Paying the owners" },
  { k: "loss", label: "A loss" },
  { k: "acc", label: "ACC" },
  { k: "liable", label: "If the café fails" },
  { k: "limits", label: "Limits" },
];

export function StructuresTool() {
  const [profit, setProfit] = useState(PROFIT);
  const [sole, setSole] = useState(false);
  const all = useMemo(() => compare(profit), [profit]);
  const shown = STRUCTURES.filter((s) => sole || s.key !== "sole");
  const p = all.partnership, c = all.company;
  const companyTotal = c.taxNow + c.taxLater + c.acc, partnerTotal = p.taxNow + p.acc;

  return (
    <div className="space-y-8">
      <ToolGuide
        what={<>The legal form of a business decides who pays tax on its profit, at what rate, and who loses their own money if it fails. This runs the same café profit through each NZ structure, side by side, so you can see what changes and what doesn&apos;t.</>}
        steps={[
          <>Move the <strong>profit</strong> slider, or use the buttons for a good year, a quiet year and a loss. Try a loss: that&apos;s where the structures differ most.</>,
          <>Tick <strong>sole trader</strong> to add the one-owner option.</>,
          <>Read the table one row at a time across the columns.</>,
          <>Then read <strong>More than tax</strong>: liability, losses and paperwork matter as much as the tax.</>,
        ]}
        read={<>Each column is one structure. The shaded one is Kōwhai&apos;s real choice, a company. A figure in brackets is a refund, and – means nothing. The coloured bar under each name splits the profit: blue is what the owners keep, orange is tax and ACC now, green is kept in the company. <strong>Tax still to come</strong> matters: a company&apos;s lower tax now is mostly tax <em>delayed</em>.</>}
        terms={[
          { k: "sole-trader", says: "one person in business on their own. The profit is simply their income." },
          { k: "partnership", says: "two or more people in business together. Each is taxed on their share, and each is liable for all the debts." },
          { k: "company", says: `a separate legal person. It pays ${pct(COMPANY_TAX_RATE, 0)} tax itself, and its owners' liability is limited.` },
          { k: "look-through-company", label: "LTC", says: "a company whose profit (or loss) is taxed in the owners' hands, like a partnership." },
          { k: "limited-liability", says: "the owners can lose what they put in, but not their own house or savings, unless they guaranteed a debt." },
          { k: "imputation-credit", label: "Imputation credits", says: "company tax passed on with dividends, so profit isn't taxed twice." },
          { k: "acc-earners-levy", label: "ACC levies", says: "charged on owners' earnings from the business: salaries, or a share of profit if they're self-employed." },
        ]}
      />
      <div className="prose-learn max-w-4xl text-[16px]">
        <p>
          Aroha and Ben chose a <Term k="company">company</Term>. They could have run Kōwhai as a <Term k="partnership">partnership</Term>, or elected for the company to be a <Term k="look-through-company">look-through company</Term> (LTC).
          And if Aroha had opened it alone, she could have been a <Term k="sole-trader">sole trader</Term>. Here is the same profit run through each.
        </p>
      </div>

      <Card className="space-y-4">
        <label className="block">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">Profit before paying the owners</span>
            <span className={cx("num text-lg font-bold", profit < 0 && "text-rose-700")}>{profit < 0 ? `−${money(-profit, { dp: 0 })}` : money(profit, { dp: 0 })}</span>
          </div>
          <input type="range" min={RANGE.min} max={RANGE.max} step={RANGE.step} value={profit} onChange={(e) => setProfit(Number(e.target.value))} className="mt-1 w-full accent-kowhai-500" />
          <div className="text-xs text-stone-500">Year 2&apos;s taxable income before shareholder salaries was {money(PROFIT, { dp: 0 })}. Slide left of zero for a loss.</div>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((x) => (
            <button key={x.label} onClick={() => setProfit(x.profit)}
              className={cx("rounded-xl px-4 py-2 text-sm font-semibold ring-1", Math.abs(x.profit - profit) < 0.5 ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
              {x.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sole} onChange={(e) => setSole(e.target.checked)} className="h-4 w-4 accent-kowhai-500" />
          Also show a sole trader (if Aroha owned Kōwhai alone)
        </label>
      </Card>

      <Card>
        <h3 className="text-lg font-bold">The same profit, {shown.length} ways</h3>
        {profit > 0 && (
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-600">
            <span><i className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: COLOURS.keep }} />Owners keep</span>
            <span><i className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: COLOURS.tax }} />Tax and ACC now</span>
            <span><i className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: COLOURS.kept }} />Kept in the company</span>
          </div>
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b align-bottom text-left text-xs uppercase tracking-wider text-stone-500">
                <th className="py-1 pr-1 sm:pr-2" />
                {shown.map((s) => (
                  <th key={s.key} className={cx("px-1 py-1 text-right sm:px-2", s.key === "company" && "bg-kowhai-50")}>
                    <span className="sm:hidden">{s.short}</span><span className="hidden sm:inline">{s.label}</span>
                    <Split r={all[s.key]} profit={profit} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.filter((row) => shown.some((s) => Math.abs(row.value(all[s.key])) >= 0.5)).map((row, i) => (
                <tr key={i} className={cx("border-b border-stone-100 align-top", row.strong && "font-semibold")}>
                  <td className="py-2 pr-1 sm:pr-2">{row.label}{row.note && <span className="block text-[11px] font-normal text-stone-500">{row.note}</span>}</td>
                  {shown.map((s) => <td key={s.key} className={cx("num px-1 py-2 text-right sm:px-2", s.key === "company" && "bg-kowhai-50")}>{$0(row.value(all[s.key]))}</td>)}
                </tr>
              ))}
              <tr>
                <td className="pt-3 pr-1 text-xs font-semibold uppercase tracking-wider text-stone-500 sm:pr-2" colSpan={shown.length + 1}>Each owner keeps</td>
              </tr>
              {["aroha", "ben"].map((id) => (
                <tr key={id} className="border-b border-stone-100 align-top">
                  <td className="py-2 pr-1 sm:pr-2">{id === "aroha" ? "Aroha" : "Ben"}</td>
                  {shown.map((s) => {
                    const o = all[s.key].owners.find((x) => x.id === id);
                    return <td key={s.key} className={cx("num px-1 py-2 text-right sm:px-2", s.key === "company" && "bg-kowhai-50")}>{o ? $0(o.keeps) : "–"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          The company pays what the café really chose: salaries of {money(ACTUAL.aroha, { dp: 0 })} and {money(ACTUAL.ben, { dp: 0 })} and a {money(ACTUAL.dividend, { dp: 0 })} dividend, cut back when the profit is smaller.
          Ben&apos;s {money(OWNERS.find((o) => o.id === "ben")!.otherIncome, { dp: 0 })} IT salary (assumed) is taxed as well, so only the extra tax Kōwhai causes is counted.
          ACC: the earners&apos;, work and working safer levies, {pct(accRate(RATES), 2)} of earnings up to {money(RATES.acc.maxLiableEarnings, { dp: 0 })}. Levies aren&apos;t deducted in working out the tax.
        </p>
      </Card>

      <Callout kind="why" title="What the numbers show">
        {profit > 0 ? (
          <>
            In a partnership or LTC every dollar of profit is taxed now, at the owners&apos; own rates, whether they draw it or not: {$0(p.taxNow)} this year.
            The company pays {$0(c.taxNow)} now{c.kept > 0.5 ? <> and holds {$0(c.kept)} in the company at 28%; paying that out later costs about {$0(c.taxLater)} more</> : ""}.
            {" "}Counting that later tax and ACC, the company comes to {$0(companyTotal)} against {$0(partnerTotal)}: its advantage is mostly <strong>timing</strong> and <strong>ACC</strong> (dividends carry no levy), not lower tax.
          </>
        ) : (
          <>
            In a loss year it flips. In a partnership or LTC, Ben sets his share of the loss against his IT salary and gets {$0(-(p.owners.find((o) => o.id === "ben")?.tax ?? 0))} of PAYE back now.
            The company can only carry its loss forward, worth {$0(c.lossValue)} at 28% once it makes a profit again. That&apos;s why new businesses that expect early losses often choose an LTC.
          </>
        )}
      </Callout>

      <div>
        <h2 className="mb-3 text-2xl font-bold">More than tax</h2>
        <div className={cx("grid gap-4", sole ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
          {shown.map((s) => (
            <Card key={s.key} className={cx(s.key === "company" && "ring-2 ring-kowhai-300")}>
              <h3 className="font-bold">{s.label}</h3>
              <dl className="mt-2 space-y-2 text-sm">
                {FACT_ROWS.map((f) => (
                  <div key={f.k}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">{f.label}</dt>
                    <dd>{FACTS[s.key][f.k]}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Callout kind="warn" title="Limited liability, with a catch">
          The company&apos;s real advantage is that Aroha and Ben aren&apos;t liable for its debts. But banks usually ask small-company directors for personal guarantees, and Kōwhai&apos;s $50,000 loan has them. So for that loan they&apos;re as exposed as partners would be.
        </Callout>
        <UsNote>
          <p>A US <strong>sole proprietorship</strong> files Schedule C and a <strong>partnership</strong> files Form 1065. Their owners also pay <strong>self-employment tax</strong> (Social Security and Medicare, about 15.3%) on the profit. NZ has no such tax: the nearest thing is the ACC levy on self-employed earnings, much smaller.</p>
          <p>NZ has <strong>no LLC</strong>. An LTC is the closest match to an LLC or <strong>S corporation</strong>: taxed in the owners&apos; hands, with limited liability. There&apos;s no &quot;reasonable compensation&quot; rule; instead, a working owner&apos;s salary needs a written contract.</p>
        </UsNote>
      </div>

      <p className="text-xs text-stone-500">
        Year 2 is the 2028 income year. Its tax brackets and IETC are carried forward from 2026–27 until IRD confirms them; the café work levy ({ACC_CAFE_LEVIES.classificationUnit}) is the {ACC_CAFE_LEVIES.levyYear} rate until ACC publishes 2027/28.
        See also <Link href="/explore/pay-yourself" className="underline">Pay yourself</Link> for the company&apos;s choices, <Link href="/explore/gst-mixed-use" className="underline">GST on mixed use</Link> for a sole trader&apos;s car, and <Link href="/foundations/business-structures" className="underline">Business structures</Link>.
      </p>
    </div>
  );
}
