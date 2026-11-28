"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHECKLISTS, type CheckItem } from "@/data/books/yearEndChecklist";
import { byMonth, bySection, clearTicks, done, loadTicks, toggleTick, type Ticks } from "@/lib/yearEndChecklist";
import { nzDate } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, UsNote } from "@/components/learn/bits";
import { ToolGuide } from "@/components/learn/ToolGuide";

const store = () => (typeof window === "undefined" ? undefined : window.localStorage);

function Item({ item, ticked, onTick }: { item: CheckItem; ticked: boolean; onTick: () => void }) {
  return (
    <li className={cx("rounded-xl border bg-white", ticked ? "border-emerald-200 bg-emerald-50/40" : "border-stone-200")}>
      <div className="flex items-start gap-3 p-3">
        <input type="checkbox" checked={ticked} onChange={onTick} aria-label={`Done: ${item.title}`}
          className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" />
        <details className="group min-w-0 flex-1">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={cx("font-semibold", ticked && "text-stone-500 line-through decoration-stone-300")}>{item.title}</div>
                <div className="text-sm text-stone-500">{item.when}</div>
                {item.figure && <div className="mt-1 text-[15px] text-stone-700">☕ {item.figure}</div>}
              </div>
              <span aria-hidden className="shrink-0 text-stone-400 transition-transform group-open:rotate-180">▾</span>
            </div>
          </summary>
          <div className="mt-2 space-y-2 border-t border-stone-100 pt-2 text-[15px] leading-relaxed">
            <p><strong>Why:</strong> {item.why}</p>
            {item.law && <p className="text-sm text-stone-600">⚖️ {item.law}</p>}
            {item.gap && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">📝 Not in Kōwhai&apos;s books: {item.gap}</p>}
            {item.link && (
              <Link href={item.link.href} className="inline-block rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white hover:bg-stone-700">
                {item.link.label} →
              </Link>
            )}
          </div>
        </details>
      </div>
    </li>
  );
}

export function YearEndTool() {
  const [key, setKey] = useState<"y1" | "y2">("y1");
  const [view, setView] = useState<"job" | "date">("job");
  const [ticks, setTicks] = useState<Ticks>({});
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved ticks (and read today's date) after hydration
    setTicks(loadTicks(store()));
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const list = CHECKLISTS.find((c) => c.key === key)!;
  const n = done(list, ticks);
  const isTicked = (id: string) => !!ticks[key]?.includes(id);
  const tick = (id: string) => setTicks(toggleTick(store(), key, id));
  const months = byMonth(list);
  const todayAt = today ? months.findIndex((m) => m.items[0].date > today) : -1;

  return (
    <div className="space-y-6">
      <ToolGuide
        what={<>A company&apos;s year ends on its <strong>balance date</strong> (Kōwhai&apos;s is 31 March), but the work doesn&apos;t. That&apos;s when a run of jobs starts: counting the stock, closing the books, paying what&apos;s due, preparing the accounts, filing with the Companies Office and IRD, and paying the tax. The last payment falls more than a year later. This is that list for Kōwhai&apos;s two real year ends, with its own dates and figures.</>}
        steps={[
          <>Pick a <strong>year</strong>. Year 2 adds last year&apos;s comparatives, the third provisional tax instalment and the dividend.</>,
          <>Choose <strong>By job</strong> to see the work in stages, or <strong>By date</strong> for a timeline of when each thing is due.</>,
          <>Tap an item to see <strong>why</strong> it matters, the law behind it, and a link to the tool or exercise where you can do it yourself.</>,
          <>Tick items off as you work through them. Ticks are saved on this device only.</>,
        ]}
        read={<>Each item shows <strong>when</strong> it&apos;s due and, after ☕, <strong>Kōwhai&apos;s own figure</strong> for that year, worked out from its books. ⚖️ is the law. 📝 marks something a real café would have that Kōwhai&apos;s books leave out.</>}
        terms={[
          { k: "balance-date", says: "the last day of the company's financial year. Kōwhai's is 31 March, like most NZ businesses." },
          { k: "stocktake", says: "counting and valuing the stock on hand at balance date." },
          { k: "accrued-expense", says: "a cost that belongs to this year but hasn't been billed yet, like March's power. Catching these is called cut-off." },
          { k: "reversing-entry", says: "an entry on 1 April that turns a year-end accrual around, so the real bill can be entered as normal." },
          { k: "comparatives", says: "last year's figures, shown beside this year's in the accounts." },
          { k: "annual-return", says: "the yearly confirmation of the company's details to the Companies Office. Not a tax return." },
          { k: "solvency-test", says: "the check the directors must pass before paying a dividend: the company can still pay its debts, and its assets exceed its liabilities." },
          { k: "imputation-credit-account", says: "the company's record of tax paid, which it can pass on to shareholders with dividends." },
          { k: "terminal-tax", says: "the rest of the year's income tax, after RWT and provisional tax." },
          { k: "tax-agent", says: "an accountant registered with IRD. Their clients get more time to file and pay." },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        {CHECKLISTS.map((c) => (
          <button key={c.key} onClick={() => setKey(c.key)}
            className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", c.key === key ? "bg-ink text-white" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>
            {c.label}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-stone-300 sm:block" />
        {(["job", "date"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", v === view ? "bg-kowhai-500 text-ink" : "bg-white ring-1 ring-stone-200 hover:bg-stone-100")}>
            {v === "job" ? "By job" : "By date"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{n} of {list.items.length} done</div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(100 * n) / list.items.length}%` }} />
          </div>
        </div>
        {n > 0 && (
          <button onClick={() => setTicks(clearTicks(store(), key))} className="text-sm text-stone-500 underline hover:text-ink">Clear my ticks</button>
        )}
      </div>

      {view === "job" ? (
        <div className="space-y-8">
          {bySection(list).map((s) => (
            <section key={s.key}>
              <h2 className="text-lg font-bold">{s.title}</h2>
              {s.blurb && <p className="text-[15px] text-stone-600">{s.blurb}</p>}
              <ul className="mt-3 space-y-2">
                {s.items.map((i) => <Item key={i.id} item={i} ticked={isTicked(i.id)} onTick={() => tick(i.id)} />)}
              </ul>
              <p className="mt-2 text-sm text-rose-800">⚠️ <strong>Common mistake:</strong> {s.mistake}</p>
            </section>
          ))}
        </div>
      ) : (
        <ol className="space-y-6 border-l-2 border-stone-200 pl-4">
          {months.map((m, idx) => (
            <li key={m.month}>
              {idx === todayAt && <TodayMark today={today!} />}
              <h2 className="-ml-[23px] flex items-center gap-2 text-lg font-bold">
                <span className="h-3 w-3 rounded-full border-2 border-stone-300 bg-white" />{m.month}
              </h2>
              <ul className="mt-2 space-y-2">
                {m.items.map((i) => <Item key={i.id} item={i} ticked={isTicked(i.id)} onTick={() => tick(i.id)} />)}
              </ul>
            </li>
          ))}
          {today && todayAt === -1 && <li><TodayMark today={today} /></li>}
        </ol>
      )}

      <Callout kind="nz" title="What a small company doesn't need">
        Kōwhai doesn&apos;t need an <strong>audit</strong>, doesn&apos;t file its accounts publicly, and doesn&apos;t need an annual report (Companies Act s 208): it isn&apos;t large and has fewer than 10 shareholders. Its accounts are for IRD and its owners, and IRD sets the minimum they must show.
      </Callout>
      <UsNote>
        A US C corporation files <strong>Form 1120</strong> by the 15th day of the 4th month after its year ends (for a 31 March year end, 15 July), and can get an automatic 6-month extension with Form 7004. The extension is for filing only: the tax is still due on the original date. Employers send <strong>Forms W-2</strong> (and 1099-NECs for contractors) by 31 January each year. Most states also want an annual report, the closest thing to NZ&apos;s Companies Office annual return. NZ has no W-2: payday filing sends IRD each pay&apos;s details as it happens.
      </UsNote>
    </div>
  );
}

function TodayMark({ today }: { today: string }) {
  return (
    <div className="-ml-[23px] mb-4 flex items-center gap-2 text-sm font-semibold text-sky-700">
      <span className="h-3 w-3 rounded-full bg-sky-500" />Today, {nzDate(today)}
    </div>
  );
}
