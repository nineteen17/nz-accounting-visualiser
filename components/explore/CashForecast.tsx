"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { BASIS, GROUPS, LINES, MONTH_ROWS, SUMMARY, isMaterial } from "@/data/books/cashForecast";
import { money, nzDate, pct } from "@/lib/money";
import { cx } from "@/lib/ui";
import { Callout, Card, UsNote } from "@/components/learn/bits";
import { Term } from "@/components/learn/Term";

const $0 = (x: number) => money(x, { dp: 0 });
const ACTUAL = "#2563eb";
const FORECAST = "#c2850c";
const GRID = "grid grid-cols-[minmax(0,1fr)_4.6rem_4.6rem_4.8rem] items-baseline gap-x-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_6.5rem]";

/** "+$1,200" in green when it left more cash than forecast, "−$900" in red when less */
function Diff({ amount }: { amount: number }) {
  if (Math.abs(amount) < 0.5) return <span className="text-stone-400">–</span>;
  const good = amount > 0;
  return <span className={cx("font-semibold", good ? "text-emerald-700" : "text-rose-700")}>{good ? "+" : "−"}{$0(Math.abs(amount))}</span>;
}
/** cash in shows as a plain amount, cash out in brackets, like a bank statement */
const cash = (x: number) => (Math.abs(x) < 0.5 ? "–" : x < 0 ? `(${$0(-x)})` : $0(x));

/* ───────────── the bank balance chart ───────────── */

/** phones get a narrower drawing, so its labels stay readable instead of shrinking */
const NARROW = "(max-width: 639px)";
function useNarrow() {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(NARROW); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

function BalanceChart({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const narrow = useNarrow();
  const W = narrow ? 360 : 640, H = narrow ? 220 : 240, L = narrow ? 40 : 56, R = narrow ? 58 : 72, T = 16, B = 30;
  const values = MONTH_ROWS.flatMap((r) => [r.forecastBank, r.actualBank]).concat(SUMMARY.opening);
  const lo = Math.floor(Math.min(...values) / 20_000) * 20_000;
  const hi = Math.ceil(Math.max(...values) / 20_000) * 20_000;
  const x = (i: number) => L + ((i + 1) / MONTH_ROWS.length) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const path = (k: "forecastBank" | "actualBank") =>
    `M${L},${y(SUMMARY.opening)} ` + MONTH_ROWS.map((r, i) => `L${x(i)},${y(r[k])}`).join(" ");
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += 20_000) ticks.push(v);
  const shown = hover ?? selected;
  const last = MONTH_ROWS.length - 1;
  const col = (W - L - R) / MONTH_ROWS.length;

  return (
    <figure>
      <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-hidden>
        <span className="flex items-center gap-2"><svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke={ACTUAL} strokeWidth="2" /></svg>Actual</span>
        <span className="flex items-center gap-2"><svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke={FORECAST} strokeWidth="2" strokeDasharray="5 3" /></svg>Forecast (March 2027)</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Bank balance at the end of each month of year 2. It starts at ${$0(SUMMARY.opening)} and ends at ${$0(SUMMARY.actualClosing)}, against ${$0(SUMMARY.forecastClosing)} forecast. The month-by-month figures are in the table below the chart.`} onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e7e5e4" strokeWidth="1" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="fill-stone-500 text-[11px]">${v / 1000}k</text>
          </g>
        ))}
        {MONTH_ROWS.map((r, i) => (
          (!narrow || i === shown || (i % 2 === 0 && (shown % 2 === 0 || Math.abs(i - shown) > 1))) && <text key={r.month} x={x(i)} y={H - 10} textAnchor="middle" className={cx("text-[11px]", i === shown ? "fill-ink font-semibold" : "fill-stone-500")}>{r.label.slice(0, 3)}</text>
        ))}
        <line x1={x(shown)} x2={x(shown)} y1={T} y2={H - B} stroke="#a8a29e" strokeWidth="1" />
        <path d={path("forecastBank")} fill="none" stroke={FORECAST} strokeWidth="2" strokeDasharray="5 3" />
        <path d={path("actualBank")} fill="none" stroke={ACTUAL} strokeWidth="2" />
        {(["forecastBank", "actualBank"] as const).map((k) => (
          <circle key={k} cx={x(shown)} cy={y(MONTH_ROWS[shown][k])} r="4.5" fill={k === "actualBank" ? ACTUAL : FORECAST} stroke="#fff" strokeWidth="2" />
        ))}
        {/* direct labels at the line ends */}
        <text x={x(last) + 8} y={y(MONTH_ROWS[last].forecastBank) + (MONTH_ROWS[last].forecastBank > MONTH_ROWS[last].actualBank ? -2 : 12)} className="fill-stone-600 text-[11px]">Forecast</text>
        <text x={x(last) + 8} y={y(MONTH_ROWS[last].actualBank) + (MONTH_ROWS[last].forecastBank > MONTH_ROWS[last].actualBank ? 12 : -2)} className="fill-stone-600 text-[11px]">Actual</text>
        {/* hover and click targets, one per month (the month buttons below do the same from the keyboard) */}
        {MONTH_ROWS.map((r, i) => (
          <rect key={r.month} x={x(i) - col / 2} y={T} width={col} height={H - T - B + 20} fill="transparent" className="cursor-pointer" aria-hidden onMouseEnter={() => setHover(i)} onClick={() => onSelect(i)} />
        ))}
      </svg>
      <figcaption className="mt-1 text-center text-sm text-stone-600" aria-live="polite">
        <strong>End of {MONTH_ROWS[shown].label} {MONTH_ROWS[shown].year}:</strong> forecast {$0(MONTH_ROWS[shown].forecastBank)}, actual {$0(MONTH_ROWS[shown].actualBank)}
      </figcaption>
    </figure>
  );
}

/* ───────────── the page ───────────── */

export function CashForecastTool() {
  const [month, setMonth] = useState(MONTH_ROWS.findIndex((r) => r.month === SUMMARY.outflowMonths.at(-1)?.month));
  const [basis, setBasis] = useState(false);
  const m = MONTH_ROWS[month];
  const big = LINES.filter((l) => isMaterial(l.diff)).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const closingDiff = SUMMARY.actualClosing - SUMMARY.forecastClosing;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="prose-learn text-[16px]">
          <p>The <Term k="budget">budget</Term> answers &ldquo;will we make a profit?&rdquo;. A <Term k="cash-flow-forecast">cash flow forecast</Term> answers a different question: &ldquo;will there be money in the bank each month to pay the bills?&rdquo;. Plenty of profitable businesses fail because the answer was no.</p>
          <p>In March 2027 Aroha and Ben turned their year 2 budget into a monthly forecast. They moved each figure to the month the money actually changes hands, and added what&apos;s cash but not profit: <strong>GST</strong> collected for IRD and paid every two months, <strong>loan principal</strong>, <strong>provisional tax</strong> instalments, and their own <strong>drawings</strong>. Then they took out what&apos;s profit but not cash, like depreciation.</p>
          <p>Below, the forecast sits beside what the bank really did. Pick a month to see where the money went.</p>
        </div>
        <Card>
          <h3 className="text-lg font-bold">Year 2 in the bank</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Tile label="1 April 2027" value={$0(SUMMARY.opening)} />
            <Tile label="31 March 2028 (forecast)" value={$0(SUMMARY.forecastClosing)} />
            <Tile label="31 March 2028 (actual)" value={$0(SUMMARY.actualClosing)} />
          </div>
          <p className="mt-3 text-sm">The year ended <strong>{$0(Math.abs(closingDiff))} {closingDiff < 0 ? "below" : "above"}</strong> the forecast. The biggest differences:</p>
          <ul className="mt-1 space-y-1.5 text-sm">
            {big.slice(0, 4).map((l) => (
              <li key={l.key} className="flex gap-2">
                <span className="num w-20 shrink-0 text-right"><Diff amount={l.diff} /></span>
                <span className="min-w-0">{l.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">Bank and till together. Green: more cash than forecast; red: less.</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-lg font-bold">Bank balance at the end of each month</h3>
        <BalanceChart selected={month} onSelect={setMonth} />
        <div className="mt-4">
          <div id="cf-month-label" className="mb-1.5 text-sm font-semibold text-stone-600">Choose a month</div>
          <div role="group" aria-labelledby="cf-month-label" className="flex flex-wrap gap-1">
            {MONTH_ROWS.map((r, i) => (
              <button key={r.month} type="button" onClick={() => setMonth(i)} aria-pressed={i === month} aria-label={`${r.label} ${r.year}${r.actualNet < 0 ? ": more went out than came in" : ""}`}
                className={cx("rounded-lg px-2.5 py-1 text-sm", i === month ? "bg-ink text-white" : "bg-stone-100 hover:bg-stone-200", r.actualNet < 0 && i !== month && "text-rose-700")}>
                {r.label.slice(0, 3)}{r.actualNet < 0 && <span aria-hidden> ▾</span>}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-stone-500">▾ more went out than came in that month</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="doc-paper rounded-sm px-3 py-5 sm:px-6">
          <h3 className="text-center text-lg font-bold">{m.label} {m.year}</h3>
          <div className={cx(GRID, "mt-3 border-b-2 border-stone-700 pb-1 text-right text-[11px] font-bold uppercase tracking-wider text-stone-500")}>
            <span />
            <span>Forecast</span>
            <span>Actual</span>
            <span>Difference</span>
          </div>
          {GROUPS.filter((g) => Math.abs(m.forecast[g.key]) > 0.5 || Math.abs(m.actual[g.key]) > 0.5).map((g) => (
            <MoneyRow key={g.key} label={g.label} forecast={m.forecast[g.key]} actual={m.actual[g.key]} />
          ))}
          <MoneyRow label="Net cash for the month" forecast={m.forecastNet} actual={m.actualNet} bold rule />
          <MoneyRow label="Bank at the end of the month" forecast={m.forecastBank} actual={m.actualBank} bold />
          <p className="mt-2 text-xs text-stone-500">Money in is shown plain, money out in (brackets).</p>
        </div>
        <div>
          <h3 className="text-base font-bold">What happened in {m.label}</h3>
          {m.events.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">{m.events.map((e) => <li key={e}>{e}</li>)}</ul>
          ) : (
            <p className="mt-2 text-[15px] text-stone-600">A routine month: sales banked, suppliers and staff paid, the rent, the loan repayment and drawings.</p>
          )}
          {m.actualNet < 0 && (
            <Callout kind="warn" title="More went out than came in">
              Cash fell because of lump-sum payments that aren&apos;t costs of running the café that month: {lumps(m).join(" and ")}.{m.events.some((e) => e.startsWith("Three paydays")) ? " A third payday added to it." : ""} None of these lumps appears in the month&apos;s profit, so only a cash forecast shows these months coming.
            </Callout>
          )}
          <p className="mt-3 text-sm text-stone-600">Small differences from month to month are mostly timing: the forecast spreads sales and supplier bills the way they fell last year, and a few days either side of a month end moves money between months.</p>
        </div>
      </div>

      <div className="doc-paper mx-auto max-w-3xl rounded-sm px-3 py-5 sm:px-8">
        <div className="mb-3 text-center">
          <h3 className="text-lg font-bold">Cash flow forecast vs actual: year ended 31 March 2028</h3>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={basis} onChange={(e) => setBasis(e.target.checked)} className="h-4 w-4 accent-kowhai-600" />
            Show how each forecast figure was set
          </label>
        </div>
        <div className={cx(GRID, "border-b-2 border-stone-700 pb-1 text-right text-[11px] font-bold uppercase tracking-wider text-stone-500")}>
          <span />
          <span>Forecast</span>
          <span>Actual</span>
          <span>Difference</span>
        </div>
        <MoneyRow label="Bank on 1 April 2027" forecast={SUMMARY.opening} actual={SUMMARY.opening} />
        {LINES.map((l) => (
          <MoneyRow key={l.key} label={l.label} forecast={l.forecast} actual={l.actual}
            note={(basis || (isMaterial(l.diff) && l.why)) && (
              <>
                {basis && <span className="block"><span className="font-semibold text-stone-600">Forecast: </span>{BASIS[l.key]}</span>}
                {isMaterial(l.diff) && l.why && <span className={cx("block", l.diff > 0 ? "text-emerald-800" : "text-rose-800")}><span className="font-semibold">Why: </span>{l.why}</span>}
              </>
            )} />
        ))}
        <MoneyRow label="Bank on 31 March 2028" forecast={SUMMARY.forecastClosing} actual={SUMMARY.actualClosing} bold rule />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout kind="tip" title="What it tells Aroha and Ben">
          <p><strong>Profit isn&apos;t cash.</strong> Year 2&apos;s profit after tax was {$0(SUMMARY.netProfit)}, but the bank grew by {$0(SUMMARY.cashChange)}. The {$0(SUMMARY.shareholderSalaries)} of shareholder salaries cut the profit but stayed in the company (they were credited to the shareholders&apos; current accounts); Aroha and Ben drew their cash as regular drawings instead. Depreciation ({$0(SUMMARY.depreciation)}) cut the profit with no cash at all. The dividend and the loan repayments were cash, not costs.</p>
          <p className="mt-2"><strong>The surprise was a decision.</strong> The forecast missed the {$0(SUMMARY.dividendPaid)} dividend, decided in February. Nothing went wrong, but it&apos;s the sort of payment a forecast should be updated for before it&apos;s made.</p>
          <p className="mt-2"><strong>Too much cash is a question too.</strong> The bank never fell below {$0(SUMMARY.neverNeeded)}, so most of that money sat idle all year in a cheque account. It could go on term deposit, or repay the {pct(SUMMARY.loan.rate)} bank loan ({$0(SUMMARY.loan.balance)} left) and save its interest.</p>
        </Callout>
        <div>
          <Callout kind="why" title="Coming up after the year ends">
            Year 1&apos;s terminal tax of {$0(SUMMARY.terminalTax.amount)} is due on {nzDate(SUMMARY.terminalTax.due)} (the extra time comes from having a tax agent), and year 2&apos;s third provisional tax instalment of {$0(SUMMARY.thirdInstalment.amount)} on {nzDate(SUMMARY.thirdInstalment.date)}. Tax arrives in lumps, long after the profit was made: next year&apos;s forecast has to start with them.
          </Callout>
          <UsNote>
            <p>US textbooks call this a <em>cash budget</em>, usually built from schedules of expected cash collections and disbursements. The NZ differences are the dates: GST every two months on the 28th (15 January and 7 May instead for two of the periods), provisional tax instalments in August, January and May, and terminal tax the following year. US businesses pay estimated income tax quarterly instead, and sales tax varies by state.</p>
          </UsNote>
        </div>
      </div>
    </div>
  );
}

/** the lump-sum payments behind a month where cash fell */
function lumps(m: (typeof MONTH_ROWS)[number]) {
  const out: string[] = [];
  if (m.actual.gst < 0) out.push("GST collected from customers over the last two months, now paid to IRD");
  if (m.actual.tax < 0) out.push("a provisional tax instalment");
  if (m.actual.dividends < 0) out.push("the dividend");
  if (m.actual.assets < 0) out.push("a new asset");
  return out;
}

function MoneyRow({ label, forecast, actual, bold, rule, note }: { label: string; forecast: number; actual: number; bold?: boolean; rule?: boolean; note?: ReactNode }) {
  return (
    <div className={cx("py-1", rule && "border-t border-stone-300", bold && "font-semibold")}>
      <div className={cx(GRID, "text-[13px] sm:text-sm")}>
        <span className="min-w-0">{label}</span>
        <span className="num text-right text-stone-500">{cash(forecast)}</span>
        <span className="num text-right">{cash(actual)}</span>
        <span className="num text-right"><Diff amount={actual - forecast} /></span>
      </div>
      {note && <div className="mt-0.5 pr-1 text-xs leading-snug text-stone-500">{note}</div>}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-kowhai-50 p-2">
      <div className="text-[11px] leading-tight text-stone-500">{label}</div>
      <div className="num mt-1 text-base font-bold sm:text-lg">{value}</div>
    </div>
  );
}
