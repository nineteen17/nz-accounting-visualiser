"use client";

import Link from "next/link";
import { useState } from "react";
import { CAR, KOWHAI, LAPTOP, VAN } from "@/data/books/gstMixedUse";
import { adjustmentPeriods, adjustments, claimOnPurchase, saleAdjustment, whichRule, type Rule, type Situation } from "@/lib/nz/gstMixedUse";
import { GST, GST_APPORTIONMENT as A } from "@/lib/nz/rates";
import { money, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";

const $ = (x: number) => money(x);
const $0 = (x: number) => money(x, { dp: 0 });
const SMALL = $0(A.smallItem);

function Mistake({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm text-rose-800">⚠️ <strong>Common mistake:</strong> {children}</p>;
}

function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.key} type="button" aria-pressed={o.key === value} onClick={() => onChange(o.key)}
            className={cx("rounded-lg px-3 py-1.5 text-left text-sm font-semibold", o.key === value ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const RULES: Record<Rule, { title: string; body: React.ReactNode }> = {
  full: { title: "Claim all the GST", body: <>It&apos;s used only for the business, so there&apos;s nothing to apportion (s 20(3C)).</> },
  fbt: { title: "Claim all the GST, then FBT", body: <>A company&apos;s asset used privately by an employee (shareholder-employees included) is a <Term k="fbt">fringe benefit</Term>. The company claims all the GST on the asset, then pays FBT, and GST on the fringe benefit (s 21I). No apportioning.</> },
  "de-minimis": { title: "Claim all the GST: under the de minimis", body: <>Exempt supplies are no more than the lesser of {$0(A.exemptDeMinimis.amount)} and {pct(A.exemptDeMinimis.share, 0)} of all supplies, so there&apos;s no need to apportion (s 20(3D)).</> },
  "principal-purpose": { title: `All or nothing: it costs ${SMALL} or less`, body: <>Since April 2023, an item costing {SMALL} or less (excluding GST) can&apos;t be apportioned. If its <Term k="principal-purpose-gst">principal purpose</Term> is the business, all the GST is claimed; if not, none (s 20(3CB)–(3CD)). No adjustments later.</> },
  apportion: { title: "Apportion, then adjust each year", body: <>Claim the GST × the intended business use (s 20(3C)). Then check the actual use at the end of each <Term k="adjustment-period">adjustment period</Term> (ss 21–21G), and make a final adjustment when it&apos;s sold (s 21F). Worked through below.</> },
};

export function GstMixedUseTool() {
  const [sit, setSit] = useState<Situation>({ buyer: "sole-trader", otherUse: "owner-private", costExcl: CAR.costExcl });
  const [uses, setUses] = useState<number[]>(CAR.defaultUses);
  const [laptopUse, setLaptopUse] = useState(LAPTOP.defaultUse);

  const rule = whichRule(sit);
  const buy = claimOnPurchase(CAR.costExcl, CAR.intendedUse);
  const periods = adjustments(CAR.costExcl, CAR.intendedUse, uses.map((use) => ({ months: 12, use })));
  const lastUse = [...periods].reverse().find((p) => p.adjusted)?.actual ?? CAR.intendedUse;
  const sale = saleAdjustment(CAR.salePriceIncl, lastUse);
  const adjTotal = periods.reduce((s, p) => s + p.amount, 0);
  const claimedNet = buy.claim + adjTotal + sale.finalAdjustment - sale.gstOnSale;
  const laptop = claimOnPurchase(LAPTOP.costExcl, laptopUse);
  const otherUses = sit.buyer === "company"
    ? [{ key: "none" as const, label: "Business only" }, { key: "staff-private" as const, label: "An employee or shareholder uses it privately" }, { key: "exempt" as const, label: "Exempt supplies (e.g. renting a flat)" }]
    : [{ key: "none" as const, label: "Business only" }, { key: "owner-private" as const, label: "The owner uses it privately" }, { key: "exempt" as const, label: "Exempt supplies (e.g. renting a flat)" }];

  return (
    <div className="space-y-8">
      <ToolGuide
        what={<>When something is used partly for the business and partly not, how much of its GST can be claimed? It depends on who bought it and what it cost. This page sorts out which rule applies, then works through the main one, <Term k="gst-apportionment">apportionment</Term>, with a car bought for {$0(CAR.costExcl)} + GST.</>}
        steps={[
          <>Use <strong>which rule applies?</strong> to see how the answer changes with the buyer, the other use and the cost.</>,
          <>Then follow <strong>the car</strong>: the claim when it&apos;s bought, a check every year, and the GST when it&apos;s sold. Change the yearly business use and watch the adjustments.</>,
          <>Try <strong>the laptop</strong> to see the all-or-nothing rule for cheaper items.</>,
        ]}
        read={<>The car and laptop belong to Aroha in a &ldquo;what if&rdquo;: Aroha running the café as a GST-registered sole trader, as in <Link href="/explore/structures" className="underline">Which structure?</Link>. Kōwhai&apos;s own figures (interest and entertainment) come from its books. Business use means use for making taxable supplies.</>}
        terms={[
          { k: "input-tax", says: "GST on what the business buys, claimed back on its GST return." },
          { k: "gst-apportionment", says: "claiming only the business share of the GST." },
          { k: "percentage-use", says: "the share of use that's for the business: intended (a forecast) or actual (what happened)." },
          { k: "adjustment-period", says: "each year-end check of actual use, and the GST put right." },
          { k: "principal-purpose-gst", says: "the main purpose: for items of $10,000 or less, it decides all or nothing." },
        ]}
      />

      {/* 1. which rule */}
      <section>
        <h2 className="text-xl font-bold">1. Which rule applies?</h2>
        <div className="mt-3 space-y-3">
          <Choice label="Who buys it?" value={sit.buyer} onChange={(buyer) => setSit({ ...sit, buyer, otherUse: sit.otherUse === "none" || sit.otherUse === "exempt" ? sit.otherUse : buyer === "company" ? "staff-private" : "owner-private" })}
            options={[{ key: "sole-trader", label: "A sole trader (Aroha)" }, { key: "company", label: "A company (Kōwhai)" }]} />
          <Choice label="What's the non-business use?" value={sit.otherUse} onChange={(otherUse) => setSit({ ...sit, otherUse, exempt: otherUse === "exempt" ? sit.exempt ?? { exemptSupplies: 20_800, totalSupplies: 490_000 } : undefined })} options={otherUses} />
          {sit.otherUse === "exempt" && (
            <Choice label="The year's exempt supplies" value={String(sit.exempt?.exemptSupplies ?? 20_800)} onChange={(v) => setSit({ ...sit, exempt: { exemptSupplies: Number(v), totalSupplies: 490_000 } })}
              options={[{ key: "20800", label: "$20,800 of rent (4.2%)" }, { key: "52000", label: "$52,000 of rent (10.6%)" }]} />
          )}
          <Choice label="What does it cost (excluding GST)?" value={String(sit.costExcl)} onChange={(v) => setSit({ ...sit, costExcl: Number(v) })}
            options={[{ key: String(LAPTOP.costExcl), label: `${$0(LAPTOP.costExcl)} (a laptop)` }, { key: String(CAR.costExcl), label: `${$0(CAR.costExcl)} (a car)` }]} />
        </div>
        <div className="mt-4 rounded-xl bg-sky-50 p-4 ring-1 ring-sky-200">
          <div className="font-bold text-sky-900">{RULES[rule].title}</div>
          <p className="mt-1 text-sm leading-relaxed">{RULES[rule].body}</p>
          {sit.otherUse === "exempt" && sit.exempt && <p className="mt-2 text-sm text-stone-600">Total supplies of {$0(sit.exempt.totalSupplies)} for the year: the de minimis is the lesser of {$0(A.exemptDeMinimis.amount)} and {$0(A.exemptDeMinimis.share * sit.exempt.totalSupplies)}.</p>}
        </div>
        <Mistake>A company apportioning GST because a director uses the car at weekends. For a company that&apos;s a fringe benefit: full GST claim, then FBT.</Mistake>
      </section>

      {/* 2. the car */}
      <section>
        <h2 className="text-xl font-bold">2. The car: apportion, adjust, sell</h2>
        <p className="mt-1 text-[15px] text-stone-600">Aroha (as a sole trader) buys a car for {$0(CAR.costExcl)} + GST of {$(buy.fullGst)}. She expects to use it {pct(CAR.intendedUse, 0)} for the business.</p>

        <h3 className="mt-4 font-bold">On purchase</h3>
        <p className="text-[15px]">{$(buy.fullGst)} × {pct(CAR.intendedUse, 0)} = <strong>{$(buy.claim)}</strong> claimed on her GST return. It costs over {SMALL}, so it&apos;s apportioned, and checked for {adjustmentPeriods(CAR.costExcl)} adjustment periods (more than {$0(A.periods[0].upTo)}, up to {$0(A.periods[1].upTo)}).</p>

        <h3 className="mt-4 font-bold">Each year: set the business use</h3>
        <ul className="mt-2 space-y-2">
          {periods.map((p, i) => (
            <li key={p.n} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
              <label className="block">
                <span className="flex justify-between text-sm font-semibold"><span>Year {p.n}: business use this year</span><span className="num">{pct(p.use, 0)}</span></span>
                <input type="range" min={0} max={1} step={0.05} value={p.use} onChange={(e) => setUses(uses.map((u, j) => (j === i ? Number(e.target.value) : u)))} className="mt-1 w-full accent-kowhai-500" />
              </label>
              <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-stone-500">Actual use since bought</dt><dd className="num">{pct(p.actual, 1)}</dd></div>
                <div><dt className="text-xs text-stone-500">Compared with</dt><dd className="num">{pct(p.compareWith, 1)}</dd></div>
                <div><dt className="text-xs text-stone-500">Difference</dt><dd className="num">{p.difference >= 0 ? "+" : "−"}{(Math.abs(p.difference) * 100).toFixed(1)} pts</dd></div>
                <div><dt className="text-xs text-stone-500">Adjustment</dt><dd className={cx("num font-semibold", p.amount > 0 ? "text-emerald-700" : p.amount < 0 ? "text-rose-700" : "")}>{p.amount === 0 ? "none" : `${p.amount > 0 ? "+" : "−"}${$(Math.abs(p.amount))}`}</dd></div>
              </dl>
              <p className="mt-1 text-xs text-stone-600">{p.reason}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-stone-600">Actual use is the average since the car was bought, not just this year&apos;s. It&apos;s compared with the intended {pct(CAR.intendedUse, 0)} until an adjustment is made, then with the use at that adjustment (s 21C). Each adjustment is the full GST ({$(buy.fullGst)}) × the difference (s 21D).</p>

        <h3 className="mt-4 font-bold">On sale, after year {periods.length}</h3>
        <p className="text-[15px] leading-relaxed">She sells it for {$0(CAR.salePriceIncl)} including GST. GST is charged on the <strong>whole</strong> price: {$(CAR.salePriceIncl)} × 3/23 = {$(sale.gstOnSale)}. Then a final adjustment gives back the part for the use she never claimed (s 21F): 3/23 × {$0(CAR.salePriceIncl)} × (1 − {pct(lastUse, 1)}) = <strong>{$(sale.finalAdjustment)}</strong>.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card><div className="text-sm text-stone-500">Claimed on purchase</div><div className="num text-xl font-bold">{$(buy.claim)}</div></Card>
          <Card><div className="text-sm text-stone-500">Yearly adjustments</div><div className="num text-xl font-bold">{adjTotal < 0 ? "−" : adjTotal > 0 ? "+" : ""}{$(Math.abs(adjTotal))}</div></Card>
          <Card><div className="text-sm text-stone-500">GST on sale, less final adjustment</div><div className="num text-xl font-bold">−{$(sale.net)}</div></Card>
        </div>
        <p className="mt-2 text-[15px]">Net GST claimed over the car&apos;s life: <strong>{$(claimedNet)}</strong>.</p>
        <Mistake>Comparing every year with the original estimate. Once an adjustment is made, later years are compared with that adjusted use.</Mistake>
        <Mistake>Charging GST on only the business share of the sale price. GST is on the whole price; the final adjustment gives the rest back.</Mistake>
      </section>

      {/* 3. laptop */}
      <section>
        <h2 className="text-xl font-bold">3. The laptop: all or nothing</h2>
        <label className="mt-3 block max-w-md">
          <span className="text-sm font-semibold">Business use of a {$0(LAPTOP.costExcl)} + GST laptop: {pct(laptopUse, 0)}</span>
          <input type="range" min={0} max={1} step={0.05} value={laptopUse} onChange={(e) => setLaptopUse(Number(e.target.value))} className="mt-1 w-full accent-kowhai-500" />
        </label>
        <p className="mt-2 text-[15px]">GST claimed: <strong>{$(laptop.claim)}</strong> of {$(laptop.fullGst)}. {laptopUse > 0.5 ? "Its principal purpose is the business, so all of it." : "Its principal purpose isn't the business, so none of it."} It costs {SMALL} or less, so there are no adjustments later either.</p>
        <Mistake>Apportioning an item costing {SMALL} or less. Since April 2023 that&apos;s all or nothing.</Mistake>
      </section>

      {/* 4. back at Kōwhai */}
      <section>
        <h2 className="text-xl font-bold">4. Back at Kōwhai, the company</h2>
        <Callout kind="nz" title="Why Kōwhai hardly ever apportions">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>A van Ben takes home:</strong> if Kōwhai bought a {$0(VAN.costExcl)} + GST van, it would claim all {$(VAN.costExcl * GST.rate)} of GST. Ben&apos;s private use is a fringe benefit, so the company pays FBT, and GST on the benefit, each quarter or year (s 21I). See <Link href="/nz/other-taxes" className="underline">FBT</Link>.</li>
            <li><strong>Its bank interest</strong> is an exempt supply: {$(KOWHAI.interestY1)} in year 1, against {$0(KOWHAI.suppliesY1)} of supplies. Far under the de minimis, so it claims all the GST on its costs (s 20(3D)).</li>
            <li><strong>Entertainment</strong> works like a fringe benefit: GST is claimed in full, and the GST on the non-deductible half is paid back at year end ({$(KOWHAI.entertainmentGstY2)} in year 2; s 21I(4)). It&apos;s already in Kōwhai&apos;s books.</li>
          </ul>
        </Callout>
      </section>

      <UsNote>
        The US has no federal GST or VAT. Sales tax is charged by states to the final buyer, and a business can&apos;t claim it back (it buys stock for resale tax-free with a resale certificate instead). So there&apos;s nothing like GST apportionment. The nearest idea is in US income tax: a car or other &ldquo;listed property&rdquo; is depreciated on its business-use share, and must be used more than 50% for business to get § 179 expensing or bonus depreciation (IRS Publication 946).
      </UsNote>

      <p className="text-[15px]">
        See also: <Link href="/nz/gst" className="font-semibold underline">GST</Link> · <Link href="/study/gst-return" className="font-semibold underline">Do the GST return yourself</Link>
      </p>
    </div>
  );
}
