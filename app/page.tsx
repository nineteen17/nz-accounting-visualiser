import Link from "next/link";
import { BUSINESS, EMPLOYEES, SHAREHOLDERS } from "@/data/business";
import { ALL, NET_PROFIT } from "@/data/books";
import { CycleWheel } from "@/components/cycle/CycleWheel";
import { SystemFlow } from "@/components/job/SystemFlow";
import { money } from "@/lib/money";
import { RATES_AS_AT } from "@/lib/nz/rates";
import { FOUNDATIONS, NZ_TOPICS } from "@/data/topics";
import { CYCLE_STEPS } from "@/data/cycle";
import { EXPLORE_TOOLS } from "@/app/explore/tools";
import { GLOSSARY } from "@/data/glossary";
import { DRILLS } from "@/data/study/drills";
import { JOB_YEARS } from "@/data/job/years";

type Section = {
  href: string;
  badge: string;
  nav: string;
  what: string;
  doing: string;
  inside: string[];
  when: string;
  size: string;
  cta: string;
};

const LEARN: Section[] = [
  {
    href: "/foundations", badge: "1", nav: "1 · Foundations",
    what: "Short lessons on the basic ideas of accounting, with no café year to follow yet. Each lesson explains one idea in plain English, with small examples you can click and change.",
    doing: "Read a lesson and play with its interactive diagram: change the numbers and watch what happens. Then move on to the next lesson.",
    inside: ["What accounting is for", "The five elements", "Assets = Liabilities + Equity", "Debits & credits", "T-accounts", "Chart of accounts", "Cash vs accrual", "Business structures"],
    when: "You've never done accounting, or debits and credits still feel confusing. Start here.",
    size: `${FOUNDATIONS.length} lessons`, cta: "Start the first lesson",
  },
  {
    href: "/cycle", badge: "2", nav: "2 · Accounting cycle",
    what: "The steps every business follows to turn receipts and invoices into a set of accounts, taught one step at a time. Each step has its own page, using Kōwhai Café's real numbers as the example.",
    doing: "Open a step, read what it is and why it's done, and step through the café's examples of it (for example, every entry that gets posted to the ledger).",
    inside: ["Source documents", "Journal entries", "Posting to the ledger", "Trial balance", "Bank reconciliation", "Year-end adjustments", "Financial statements", "Closing the year"],
    when: "You know the basics and want to learn each step of the process properly, in order.",
    size: `${CYCLE_STEPS.filter((c) => !c.n.includes("½")).length} steps`, cta: "See the steps",
  },
  {
    href: "/nz", badge: "3", nav: "3 · NZ tax & rules",
    what: "The New Zealand rules that change the numbers: tax, payroll and the law. Each topic explains the rule, links to the official IRD or government source, and shows how it applies to the café, often with a calculator.",
    doing: "Read a topic when you need it, or work through them in order. Try the calculators with your own numbers.",
    inside: ["GST & the GST return", "PAYE & payslips", "KiwiSaver", "Holiday pay", "ACC levies", "Company income tax", "Provisional tax", "Depreciation", "Dividends & imputation"],
    when: "You want to understand the NZ-specific parts, or you hit a tax term in the cycle and want the full story.",
    size: `${NZ_TOPICS.length} topics`, cta: "Browse NZ topics",
  },
  {
    href: "/on-the-job", badge: "4", nav: "4 · A year on the job",
    what: "Everything from Parts 1–3 put together. You do the café's books for two full years, task by task, in the real order and on the real dates a bookkeeper and accountant would do them.",
    doing: "Click Next task. Each task shows the job, why it's done, the journal entry, and the books (ledger, trial balance, GST, statements) updating live. Your place is saved.",
    inside: ["Daily sales & banking", "Paying suppliers", "Pay runs & PAYE", "GST returns", "Year-end adjustments", "Statements & tax", "Year 2: reversals, a dividend, selling an asset"],
    when: "You've learnt the steps and want to see how they fit together in a real working year.",
    size: `${JOB_YEARS[1].steps.length + JOB_YEARS[2].steps.length} tasks over 2 years`, cta: "Start year 1",
  },
];

const TOOLS: Section[] = [
  {
    href: "/explore", badge: "🔍", nav: "Explore the books",
    what: "The café's complete books, open for you to look through freely. Nothing to read in order: just tools.",
    doing: "Search the journal, open any account's history, pick a date and see the trial balance or statements on that day.",
    inside: EXPLORE_TOOLS.map((t) => t.title),
    when: "You want to check a number, look something up, or poke around on your own.",
    size: `${EXPLORE_TOOLS.length} tools`, cta: "Open the books",
  },
  {
    href: "/study", badge: "🎯", nav: "Study",
    what: "Practice that makes it stick. Flashcards test you on the glossary terms and bring each one back just before you'd forget it. Drills are quick questions made from the café's books, marked straight away with the reason for each answer.",
    doing: "Choose the Parts you've done and how deep to go (start with Essential), then spend ten minutes a day: recall each term before you look, and mark how well you remembered it.",
    inside: ["Flashcards with spaced repetition", "Debit or credit?", "Which element?", "Current or non-current?", "Which statement?", "GST maths", "Due dates", "Your progress by Part"],
    when: "After each Part, and a few minutes most days. Your progress is saved in your browser.",
    size: `${GLOSSARY.filter((e) => e.level === "essential").length} essential terms · ${DRILLS.length} drills`, cta: "Start studying",
  },
  {
    href: "/glossary", badge: "📖", nav: "Glossary",
    what: "Every accounting and tax word used in this tool, A to Z, each with a plain-English meaning and a café example.",
    doing: "Search for a word. Underlined words on every page also open their glossary entry when you click them.",
    inside: ["A–Z definitions", "Café examples", "Links to the full lesson", "US vs NZ differences"],
    when: "You meet a word you don't know. If you learned from a US textbook, the US vs NZ page is linked from here.",
    size: `${GLOSSARY.length} terms`, cta: "Open the glossary",
  },
];

function SectionCard({ s, tool }: { s: Section; tool?: boolean }) {
  return (
    <Link href={s.href} className="group grid gap-5 rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-kowhai-500 hover:shadow-lg sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div>
        <div className="flex items-center gap-3">
          <span className={tool ? "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-lg" : "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-kowhai-100 text-lg font-black text-kowhai-700"}>{s.badge}</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">In the menu: “{s.nav}”</div>
            <div className="text-xl font-bold group-hover:underline">{s.nav.replace(/^\d · /, "")}</div>
          </div>
        </div>
        <p className="mt-3 text-stone-700">{s.what}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">{s.size}</span>
          <span className="font-semibold text-kowhai-700">{s.cta} →</span>
        </div>
      </div>
      <dl className="grid gap-3 text-sm">
        <div><dt className="font-semibold text-stone-500">What you do there</dt><dd className="mt-0.5 text-stone-700">{s.doing}</dd></div>
        <div>
          <dt className="font-semibold text-stone-500">What&apos;s inside</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">{s.inside.map((x) => <span key={x} className="rounded-md bg-stone-50 px-2 py-0.5 text-stone-700 ring-1 ring-stone-200">{x}</span>)}</dd>
        </div>
        <div><dt className="font-semibold text-stone-500">Go here when</dt><dd className="mt-0.5 text-stone-700">{s.when}</dd></div>
      </dl>
    </Link>
  );
}

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
              <Link href="/on-the-job" className="rounded-xl border border-white/30 px-5 py-3 font-semibold hover:bg-white/10">I know the basics: start the job</Link>
            </div>
          </div>
          <div className="hidden justify-center lg:flex"><div className="rounded-3xl bg-paper p-4 text-ink"><CycleWheel size={420} /></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold">What&apos;s in this tool</h2>
        <p className="mt-1 max-w-3xl text-stone-600">
          The menu at the top has seven sections. The four numbered ones are the course, meant to be done in order. The other three are tools you can use at any time.
        </p>

        <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold" aria-label="Suggested order">
          {LEARN.map((s, i) => (
            <li key={s.href} className="flex items-center gap-2">
              <Link href={s.href} className="rounded-full bg-kowhai-100 px-3 py-1 text-kowhai-700 hover:bg-kowhai-200">{s.nav}</Link>
              {i < LEARN.length - 1 && <span className="text-stone-400">→</span>}
            </li>
          ))}
        </ol>

        <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-stone-500">The course: do these in order</h3>
        <div className="grid gap-4">
          {LEARN.map((s) => <SectionCard key={s.href} s={s} />)}
        </div>

        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-stone-700">
          <div className="font-bold text-ink">What&apos;s the difference between Part 2 and Part 4?</div>
          <p className="mt-1">
            They use the same café books. <strong>Part 2 · Accounting cycle</strong> teaches <em>one step at a time</em>: all the journal entries together, then all the posting, then the trial balance, and so on, so you can learn each step on its own.
            {" "}<strong>Part 4 · A year on the job</strong> does <em>everything in date order</em>, the way real work happens: in a single week you might bank the sales, run the payroll, pay a supplier and file a GST return. Learn the steps in Part 2, then see them in action in Part 4.
          </p>
        </div>

        <h3 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-stone-500">Tools: use these any time</h3>
        <div className="grid gap-4">
          {TOOLS.map((s) => <SectionCard key={s.href} s={s} tool />)}
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
