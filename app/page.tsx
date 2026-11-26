import Link from "next/link";
import { BUSINESS, EMPLOYEES, SHAREHOLDERS } from "@/data/business";
import { ALL, NET_PROFIT } from "@/data/books";
import { CycleWheel } from "@/components/cycle/CycleWheel";
import { SystemFlow } from "@/components/job/SystemFlow";
import { money } from "@/lib/money";
import { RATES_AS_AT } from "@/lib/nz/rates";

const PATHS = [
  { href: "/foundations", n: "1", t: "Foundations", d: "Never done accounting? Start here. Eleven short lessons: the equation, debits & credits, T-accounts, cash vs accrual.", cta: "Start learning" },
  { href: "/cycle", n: "2", t: "The accounting cycle", d: "Step through Kōwhai Café's whole year: source document → journal → ledger → trial balance → adjustments → statements → closing.", cta: "Walk the cycle" },
  { href: "/nz", n: "3", t: "NZ tax & rules", d: "GST returns box by box, PAYE and payslips, KiwiSaver, holidays, provisional tax, depreciation and Investment Boost, imputation.", cta: "Dive into NZ" },
  { href: "/explore", n: "4", t: "Explore the books", d: "The full journal, every ledger, the trial balance on any date, ratios, loan schedule and break-even.", cta: "Open the books" },
];

export default function Home() {
  return (
    <div>
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-kowhai-300">Learn accounting by following one café for a year</div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">Every number, every entry, every NZ rule, <span className="text-kowhai-300">visualised</span>.</h1>
            <p className="mt-5 max-w-2xl text-lg text-stone-300">
              You&apos;ll follow <strong className="text-white">{BUSINESS.name}</strong>, a small Wellington café, from the day the owners open the bank account to the final tax return. All {ALL.length} journal entries are real double-entry, and every statement, ledger and GST return is calculated live from them. No abstraction and no prior knowledge needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/foundations/what-is-accounting" className="rounded-xl bg-kowhai-400 px-5 py-3 font-bold text-ink hover:bg-kowhai-300">I&apos;m a complete beginner →</Link>
              <Link href="/cycle" className="rounded-xl border border-white/30 px-5 py-3 font-semibold hover:bg-white/10">Jump into the cycle</Link>
            </div>
          </div>
          <div className="hidden justify-center lg:flex"><div className="rounded-3xl bg-paper p-4 text-ink"><CycleWheel size={420} /></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Choose a path</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PATHS.map((p) => (
            <Link key={p.href} href={p.href} className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-kowhai-500 hover:shadow-lg">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-kowhai-100 text-lg font-black text-kowhai-700">{p.n}</span>
              <span className="mt-3 text-xl font-bold">{p.t}</span>
              <span className="mt-2 flex-1 text-sm text-stone-600">{p.d}</span>
              <span className="mt-4 text-sm font-semibold text-kowhai-700 group-hover:underline">{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="text-2xl font-bold">The big picture</h2>
        <p className="mb-5 mt-1 max-w-3xl text-stone-600">All of accounting in one diagram. Each box is a page in this tool, so you can start anywhere and always see where you are.</p>
        <SystemFlow linked note="Click any box to jump to it." />
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold">Meet Kōwhai Café ☕</h2>
            <p className="mt-3 text-stone-700">{BUSINESS.story}</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-stone-50 p-3"><dt className="text-stone-500">Structure</dt><dd className="font-semibold">Limited company (two shareholders)</dd></div>
              <div className="rounded-xl bg-stone-50 p-3"><dt className="text-stone-500">Financial year</dt><dd className="font-semibold">{BUSINESS.incomeYear}</dd></div>
              <div className="rounded-xl bg-stone-50 p-3"><dt className="text-stone-500">GST</dt><dd className="font-semibold">{BUSINESS.gstBasis}, {BUSINESS.gstFrequency.toLowerCase()}</dd></div>
              <div className="rounded-xl bg-stone-50 p-3"><dt className="text-stone-500">First-year profit after tax</dt><dd className="num font-semibold">{money(NET_PROFIT, { dp: 0 })}</dd></div>
            </dl>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">The people</h3>
            {SHAREHOLDERS.map((s) => (
              <div key={s.id} className="rounded-xl border border-stone-200 p-4"><div className="font-bold">{s.name}</div><div className="text-sm text-stone-600">{s.role} · {s.pct * 100}% shareholder</div></div>
            ))}
            {EMPLOYEES.map((e) => (
              <div key={e.id} className="rounded-xl border border-stone-200 p-4"><div className="font-bold">{e.name}</div><div className="text-sm text-stone-600">{e.role} · employee</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-4 text-2xl font-bold">How to use this tool</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-kowhai-50 p-5"><div className="font-bold">Underlined terms</div><p className="mt-1 text-sm text-stone-700">Hover for a one-line definition. Click to open a full explanation in a side panel, with a café example and the common mistakes.</p></div>
          <div className="rounded-2xl bg-sky-50 p-5"><div className="font-bold">“Why?” buttons & deep dives</div><p className="mt-1 text-sm text-stone-700">Anything that needs more space opens in an overlay or links to its own page, so the main path stays clear.</p></div>
          <div className="rounded-2xl bg-emerald-50 p-5"><div className="font-bold">One set of books</div><p className="mt-1 text-sm text-stone-700">Every screen is calculated from the same journal. Click any figure&apos;s transaction to see the source document behind it.</p></div>
        </div>
        <p className="mt-8 text-xs text-stone-500">Kōwhai Café, its people and suppliers are fictional. NZ rates as at {RATES_AS_AT}. This is a learning tool, not tax advice.</p>
      </section>
    </div>
  );
}
