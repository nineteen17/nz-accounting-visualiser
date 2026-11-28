"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GST_EXERCISES } from "@/data/study/gstReturn";
import { GST101A_BOXES } from "@/lib/engine/gst";
import { money, nzDate, pct } from "@/lib/money";
import { GST } from "@/lib/nz/rates";
import { ENTER, PLACES, answerKey, boxesFor, loadProgress, markBox, saveProgress, type Boxes, type Exercise, type Place, type Progress } from "@/lib/study/gstReturn";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";
import { ToolGuide } from "@/components/learn/ToolGuide";

const store = () => (typeof window === "undefined" ? undefined : window.localStorage);
const num = (k: keyof Boxes) => Number(k.slice(3));

export function GstReturnPractice() {
  const [key, setKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved progress after hydration
    setProgress(loadProgress(store()));
  }, []);
  const ex = GST_EXERCISES.find((e) => e.key === key);
  if (ex) return <Run key={ex.key} ex={ex} onBack={() => setKey(null)} onDone={(r) => setProgress(saveProgress(store(), ex.key, r))} />;
  return (
    <div className="space-y-6">
      <ToolGuide
        what={<>Every two months Kōwhai fills in a GST return (IRD&apos;s GST101A form): the GST it charged on its sales, less the GST it paid on its purchases. The difference is paid to IRD, or refunded. Here you fill in Kōwhai&apos;s real returns yourself, from the period&apos;s transactions.</>}
        steps={[
          <>Pick a <strong>period</strong> below. Start with the first: the ones marked <em>Harder</em> have a refund or adjustments.</>,
          <><strong>Sort</strong> each transaction: a sale, a purchase, an adjustment, or not in the return at all. Then check: every answer says why.</>,
          <>Fill in the <strong>boxes</strong> from your own sorting. Each one is a sum, or × 3 ÷ 23 to find the GST in an amount.</>,
          <><strong>Compare</strong> your return with the one Kōwhai filed.</>,
        ]}
        read={<><strong>Box 15</strong> is the answer: GST to pay, or a refund. In the comparison, a pink row is a box that differs from Kōwhai&apos;s: look back at your sorting to find the transaction that caused it.</>}
        terms={[
          { k: "gst", says: `${pct(GST.rate, 0)} on most sales in NZ. A registered business collects it for IRD.` },
          { k: "output-tax", label: "Output tax", says: "the GST in the café's sales: owed to IRD (Box 10)." },
          { k: "input-tax", label: "Input tax", says: "the GST in its purchases: claimed back (Box 14)." },
          { k: "gst-inclusive", label: "GST-inclusive", says: `an amount with GST in it. The GST is 3/23 of it: ${money(100 * (1 + GST.rate), { dp: 0 })} includes ${money(100 * GST.rate, { dp: 0 })}.` },
          { k: "gst-adjustment", label: "Adjustment", says: "a correction entered as the GST itself: extra GST to pay (Box 9) or GST to claim back (Box 13)." },
          { k: "invoice-basis", label: "Invoice basis", says: "GST counts in the period of the invoice, not when it's paid. Kōwhai uses it." },
          { k: "exempt-supply", label: "Exempt", says: "no GST at all, e.g. interest and bank fees: they stay out of the return." },
          { k: "zero-rated", label: "Zero-rated", says: "GST at 0%, e.g. exports. Kōwhai has none, so Box 6 is 0." },
        ]}
      />
      <div className="prose-learn max-w-3xl text-[16px]">
        <p>Pick a GST period. You&apos;ll get every transaction Kōwhai recorded in it that has GST, mixed with some that don&apos;t. Sort them into the return, fill in the GST101A&apos;s boxes from your own sorting, and then compare your return with the one Kōwhai filed.</p>
        <p>Kōwhai files two-monthly on the <strong>invoice basis</strong>: GST goes in the period of the invoice, not when it&apos;s paid.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GST_EXERCISES.map((e) => {
          const p = progress[e.key];
          return (
            <button key={e.key} onClick={() => setKey(e.key)} className="rounded-2xl bg-white p-4 text-left ring-1 ring-stone-200 hover:ring-kowhai-500">
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                <span>{e.year}</span>
                {e.level === "harder" && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Harder: {e.tags.join(" & ")}</span>}
              </div>
              <div className="mt-1 font-bold">{e.period.label}</div>
              <div className="text-sm text-stone-600">{e.items.length} transactions · due {nzDate(e.period.due)}</div>
              {p && <div className="mt-2 text-xs font-semibold text-kowhai-700">Best: {p.sorted}/{p.of} sorted, {p.boxes}/{ENTER.length} boxes</div>}
            </button>
          );
        })}
      </div>
      <UsNote>
        <p>The US has no federal GST or VAT. <strong>State sales tax</strong> is charged only on the final sale to a consumer, and businesses don&apos;t claim back tax on their purchases (they use resale certificates to avoid paying it instead). So nothing matches Boxes 11–14.</p>
        <p>In NZ, GST on purchases isn&apos;t a cost to a registered business: it&apos;s claimed back in the return.</p>
      </UsNote>
    </div>
  );
}

function Run({ ex, onBack, onDone }: { ex: Exercise; onBack: () => void; onDone: (r: Progress[string]) => void }) {
  const [sort, setSort] = useState<Record<string, Place>>({});
  const [checked, setChecked] = useState(false);
  const [typed, setTyped] = useState<Partial<Record<keyof Boxes, string>>>({});
  const [payOrRefund, setPayOrRefund] = useState<"pay" | "refund" | null>(null);
  const [marked, setMarked] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const key = useMemo(() => answerKey(ex), [ex]);
  const own = useMemo(() => boxesFor(ex.items, sort), [ex, sort]);
  const right = ex.items.filter((i) => sort[i.id] === i.place).length;
  const allSorted = ex.items.every((i) => sort[i.id]);
  const boxRight = (k: keyof Boxes) => markBox(k, typed[k] === undefined || typed[k] === "" ? null : Number(typed[k]), own);
  const boxesRight = ENTER.filter(boxRight).length;
  const signRight = payOrRefund === (own.box15 < 0 ? "refund" : "pay");

  const finish = () => {
    setMarked(true);
    onDone({ sorted: right, of: ex.items.length, boxes: boxesRight, done: new Date().toISOString().slice(0, 10) });
    top.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={top} className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{ex.year}: {ex.period.label}</h2>
        <button onClick={onBack} className="text-sm font-semibold text-kowhai-700 underline">← All periods</button>
      </div>

      <Card>
        <h3 className="font-bold">1. Sort the transactions</h3>
        <p className="mt-1 text-sm text-stone-600">Sales and purchases show the amount <strong><Term k="gst-inclusive">including GST</Term></strong>. An <Term k="gst-adjustment">adjustment</Term> shows the GST itself. Anything else shows its total. Not sure? Ask: did Kōwhai sell or buy something with GST on it, in this period, by invoice date?</p>
        <ul className="mt-3 divide-y divide-stone-100">
          {ex.items.map((i) => {
            const mine = sort[i.id];
            const ok = mine === i.place;
            return (
              <li key={i.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">{i.title}</span>
                  <span className="num text-sm">{money(i.amount)}</span>
                </div>
                <div className="text-xs text-stone-500">{nzDate(i.date)}{i.story && <> · <span className="line-clamp-2 inline">{i.story}</span></>}</div>
                <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Where does "${i.title}" go?`}>
                  {PLACES.map((p) => (
                    <button key={p.key} role="radio" aria-checked={mine === p.key} disabled={checked} onClick={() => setSort((s) => ({ ...s, [i.id]: p.key }))}
                      className={cx("rounded-lg px-2.5 py-1 text-xs ring-1", mine === p.key ? "bg-ink text-white ring-ink"
                        : checked && p.key === i.place ? "bg-emerald-100 font-semibold text-emerald-900 ring-2 ring-emerald-600" : "bg-white ring-stone-300 hover:ring-kowhai-500")}>
                      {p.label}{p.box && <span className="opacity-70"> · {p.box}</span>}
                    </button>
                  ))}
                </div>
                {checked && (
                  <p className={cx("mt-2 rounded-lg p-2 text-sm", ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900")}>
                    {ok ? "✓ " : `✗ It's ${PLACES.find((p) => p.key === i.place)!.answer}. `}{i.why}
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
          <p className="mt-3 font-semibold">{right} of {ex.items.length} right. {right < ex.items.length && "Fill in the boxes from your own sorting anyway: they're marked against it."}</p>
        )}
      </Card>

      {checked && (
        <Card>
          <h3 className="font-bold">2. Fill in the GST101A</h3>
          <p className="mt-1 text-sm text-stone-600">Use <em>your</em> sorting. Round each box to the cent.</p>
          <div className="mt-3 space-y-3">
            {ENTER.map((k) => (
              <label key={k} className="block">
                <span className="text-sm"><strong>Box {num(k)}</strong> <span className="text-stone-600">{GST101A_BOXES[num(k)]}</span></span>
                <div className="mt-1 flex items-center gap-2">
                  <input inputMode="decimal" value={typed[k] ?? ""} disabled={marked} onChange={(e) => setTyped((t) => ({ ...t, [k]: e.target.value.replace(/[$,\s]/g, "") }))}
                    className={cx("num w-40 rounded-lg px-3 py-1.5 ring-1", marked ? (boxRight(k) ? "ring-emerald-600" : "ring-rose-600") : "ring-stone-300")} />
                  {marked && <span className="text-sm">{boxRight(k) ? "✓" : `✗ ${money(k === "box15" ? Math.abs(own[k]) : own[k])}`}</span>}
                </div>
                {marked && !boxRight(k) && <span className="mt-0.5 block text-xs text-stone-500">{hint(k, own)}</span>}
              </label>
            ))}
            <div>
              <span className="text-sm font-semibold">Box 15 is…</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {(["pay", "refund"] as const).map((x) => (
                  <button key={x} disabled={marked} onClick={() => setPayOrRefund(x)} aria-pressed={payOrRefund === x}
                    className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ring-1", payOrRefund === x ? "bg-ink text-white ring-ink" : "bg-white ring-stone-300")}>
                    {x === "pay" ? "GST to pay" : "A refund"}
                  </button>
                ))}
                {marked && <span className="text-sm">{signRight ? "✓" : `✗ ${own.box15 < 0 ? "Box 14 is larger than Box 10, so it's a refund" : "Box 14 isn't larger than Box 10, so it's GST to pay"}`}</span>}
              </div>
            </div>
          </div>
          {!marked && <button onClick={finish} className="mt-4 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-ink/85">Mark my return</button>}
        </Card>
      )}

      {marked && <Compare ex={ex} own={own} sorted={right} boxesRight={boxesRight} perfect={right === ex.items.length} keyed={boxesFor(ex.items, key)} />}
    </div>
  );
}

function hint(k: keyof Boxes, b: Boxes) {
  switch (k) {
    case "box5": return "Add up everything you sorted as a sale.";
    case "box6": return "Kōwhai has no zero-rated supplies (such as exports), so 0.";
    case "box8": return `Box 7 (${money(b.box7)}) × 3 ÷ 23.`;
    case "box9": return "Add up the GST you sorted as extra GST to pay (0 if none).";
    case "box11": return "Add up everything you sorted as a purchase.";
    case "box12": return `Box 11 (${money(b.box11)}) × 3 ÷ 23.`;
    case "box13": return "Add up the GST you sorted as GST to claim back (0 if none).";
    default: return `Box 10 (${money(b.box10)}) − Box 14 (${money(b.box14)}), written without a minus sign.`;
  }
}

function Compare({ ex, own, sorted, boxesRight, perfect, keyed }: { ex: Exercise; own: Boxes; sorted: number; boxesRight: number; perfect: boolean; keyed: Boxes }) {
  const rows: (keyof Boxes)[] = ["box5", "box8", "box9", "box10", "box11", "box12", "box13", "box14", "box15"];
  const pay = ex.real.box15 >= 0;
  return (
    <Card>
      <h3 className="font-bold">3. Your return beside Kōwhai&apos;s</h3>
      <p className="mt-1 text-sm">{sorted}/{ex.items.length} sorted right · {boxesRight}/{ENTER.length} boxes right. Your best result is saved on this device.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="py-1 pr-2">Box</th><th className="px-2 text-right">Yours</th><th className="pl-2 text-right">Kōwhai&apos;s</th></tr></thead>
          <tbody>
            {rows.map((k) => {
              const same = Math.abs(own[k] - keyed[k]) < 0.015;
              return (
                <tr key={k} className={cx("border-b border-stone-100", !same && "bg-rose-50")}>
                  <td className="py-1.5 pr-2">Box {num(k)}</td>
                  <td className="num px-2 text-right">{money(own[k])}</td>
                  <td className="num pl-2 text-right">{money(keyed[k])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Callout kind={perfect ? "tip" : "why"} title={pay ? `${money(ex.real.box15)} to pay` : `A refund of ${money(-ex.real.box15)}`}>
        {pay
          ? <>Kōwhai files this return and pays by <strong>{nzDate(ex.period.due)}</strong>. Two-monthly GST is due on the 28th of the month after the period ends, except the November period (15 January) and the March period (7 May).</>
          : <>IRD pays the refund once the return is processed: it can check the return first. Kōwhai bought more than it sold this period, so the GST it paid exceeds the GST it collected.</>}
        {" "}<Link href="/nz/gst-return" className="underline">See the return box by box</Link>.
      </Callout>
    </Card>
  );
}
