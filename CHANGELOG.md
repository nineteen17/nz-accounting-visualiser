# Changelog

A record of what's in the Kōwhai Café accounting learning tool and what has changed. Newest first.
Dates are when the change was made. Rates and rules are for the 2026–27 NZ income year unless stated.

---

## Proposed / not yet done

- **global-law MCP**. The `claude mcp add` entry was saved with a trailing "." in the URL and fails to connect. Fix: `claude mcp remove global-law`, then re-add with `https://global-law.lexifina.com/mcp`. Note: the NZ law data it uses has no tax Acts (see 2026-11-26).

---

## 2026-11-26

### The big picture diagram
- The "How it all fits together" flow diagram is now a shared component (`components/job/SystemFlow.tsx`) with two modes: **live** in "A year on the job" (boxes light up for the current task, as before) and **linked**, where every box links to the step or topic that explains it and shows its cycle step number (e.g. Journal = Step 3, Bank reconciliation = Step 6, GST return = NZ topic).
- Added to the **cycle overview** (between the "Work the whole year" banner and the step list) and the **home page** (a "The big picture" section under "Choose a path").
- **Year timeline**: the year-end region is about 45% wider (dots about 13px apart instead of 9px), so the adjustment and closing dots no longer run together. The months take slightly less width.
- Verified: tsc, eslint, vitest (22), screenshots (desktop and phone), no sideways scrolling at 390px on /, /cycle and /cycle/year.

### Instant navigation (Next.js)
- Fixed the dev-tools insight "Next.js encountered URL data outside of Suspense" on the four dynamic routes (`/explore/[tool]`, `/foundations/[topic]`, `/nz/[topic]`, `/cycle/[step]`). Following the Next.js 16 docs (instant navigation / optimizing prefetching), the part of each page that reads `params` is now an async `Content` component inside `<Suspense>`, with a light `PageSkeleton` fallback. All pages are still pre-generated, so the fallback is rarely seen.
- **Real 404s kept** with a new `proxy.ts` (Next 16's replacement for middleware). With the slug read inside `<Suspense>`, a page streams with status 200 before it can call `notFound()`, and the docs' alternative (checking before the boundary) brings the warning back. The proxy checks the slug against the lesson / topic / step / tool lists *before* rendering and returns a real 404 for unknown or extra path segments. It only runs on `/foundations/*`, `/nz/*`, `/cycle/*` and `/explore/*`, and it reads the same data lists, so new pages are covered automatically.
- Tests (now 22): every real lesson/topic/step/tool passes the proxy; unknown slugs get 404.
- Verified: tsc, eslint, vitest, production build (59 pages + proxy), all real pages 200 and mistyped ones 404 on the dev server, no console errors on the dynamic pages.

### Mobile layout
- **Every page now fits a phone screen.** Checked all 52 pages at 390px (phone) and 768px (tablet) with phone emulation in headless Chrome: no page scrolls sideways. Before the fix, 10 pages were wider than the screen.
- **Menu button**: below laptop width (1024px), the six header links are replaced by a "☰ Menu" button that opens the full list (with Home). The café name now shows on phones too.
- **Columns shrink to the screen**: a global rule in `globals.css` (`.grid > * { min-width: 0 }`) stops wide tables and documents stretching a whole column past the screen.
- **Cycle wheel** scales down to fit narrow screens and keeps its layout.
- **Section selector** (Foundations, cycle, NZ): on phones the overview button and arrows sit on the first row, with every lesson/step/topic wrapping across the full width below. Previously they were squeezed into one tall column.
- **Source documents**: the header stacks on phones, padding is smaller, long values can wrap, and item tables scroll inside the document if needed.
- **GST return form**: narrower number boxes and wrapping header on phones.
- **Explore**: journal list hides the entry-ID column on phones; dropdowns can't exceed the screen.
- "Work the whole year" banner on the cycle overview: the text no longer gets squeezed on phones.
- Desktop layout is unchanged (checked by screenshot).

### Fixes
- Cycle wheel: coordinates are rounded so the server and browser render identical HTML. This removes a hydration-mismatch console error on the home page and /cycle.

### A year on the job (`/cycle/year`)
- **New walkthrough** of the café's whole year as **236 tasks** in the order the bookkeeper (Ben) and accountant (Rata & Co) actually do them. It's separate from the existing cycle pages, which are unchanged, and launched from the "▶ Work the whole year" banner on the cycle overview.
- Each step shows: date and weekday, who does the job, a category tag, "The job & why", the source document, the journal entry, the T-accounts it posts to (year to date), the live accounting equation (with the change), a "coming up" deadlines box (PAYE 20th, GST returns, terminal tax), bank balance and profit so far, plus the trial balance to date with touched accounts highlighted.
- **Jobs that aren't entries** are steps too: a monthly bank reconciliation (12, with the March one finding the bank fee, a deposit in transit and an unpresented payment), preparing and filing each GST return (box by box, before each payment), payday filing (noted on every pay run), the balance-date checklist, unadjusted / adjusted / post-closing trial balances, the tax computation, financial statements, the final GST return (due 7 May), the Companies Office annual return and the IR4/IR3 with terminal tax.
- Recurring work (pay runs, Z-reports, banking, supplier payments, PAYE, direct debits, rent, loan, power, drawings, bank fees) is explained in full the first time, then briefly on repeats with "This time:" specifics and a link back to the first explanation.
- Controls: Back / Next task, ← → keys, ⏩ Skip routine (jumps past repeated routine steps: 93 of 236 steps remain), autoplay at three speeds, month timeline (Apr–Mar, Year end, After), progress saved in localStorage, `?step=<number or id>` deep links.
- **"How it all fits together" map** (`components/job/YearMap.tsx`) at the top of the walkthrough, collapsible:
  - *Where this task sits in the system*: source documents → journal → ledger → trial balance → adjustments → statements → close, with the checks and filings that read the books (bank rec, payday filing & PAYE, GST return, IR4). The boxes the current task touches light up.
  - *The whole year*: every task as a dot on a timeline (Apr–Mar, year end, after), one row per kind of work (sales & banking, bills, payroll, IRD, checks, one-offs, year end). New kinds of job are larger dots, done tasks are filled, a dashed line marks where you are, and clicking a dot jumps to that task.
- Files: `data/job/steps.ts` (builds `JOB_STEPS` from the journal), `components/job/JobYear.tsx`, `app/cycle/year/page.tsx`; a small `fade-up` CSS animation in `globals.css`.
- Tests (now 20): every journal entry is posted exactly once; the final books equal the full journal; step ids are unique and all glossary links exist; entries during the year are in date order.
- Verified: tsc, eslint, vitest, production build, headless Chrome (no console errors; screenshots of setup, first pay run, GST return, March bank rec, statements).

### Navigation
- **Shared section bar** (`components/learn/SectionNav.tsx`) at the top of every page in Foundations, the Accounting cycle and NZ tax & rules:
  - a "☰" button back to that part's overview page
  - ← and → arrows
  - every lesson, step or topic as a numbered button: passed = yellow, current = dark, ahead = white
- Removed the separate progress bar; the coloured buttons show progress instead.
- Cycle step buttons now use the same colours as the other parts (previously blue for during-the-year steps and yellow for balance-date steps).
- NZ topic pages: the bottom buttons are now Previous / Next, like the other parts (previously "All NZ topics" / Next). The last topic leads on to Explore.
- Added short labels (`short`) to `FOUNDATIONS` and `NZ_TOPICS` in `data/topics.ts`.

### US GAAP vs NZ (for learners coming from American material)
- **Reference page `/us-vs-nz`**, also lesson 10 in Foundations (`components/usnz/UsVsNz.tsx`). It has a table of contents and 15 sections, each rated high / medium / low impact for a small café:
  - who sets the rules
  - terminology (16 terms)
  - financial statements
  - owners and equity
  - revenue and bad debts
  - worked examples
  - sales tax vs GST
  - payroll and employment
  - income tax
  - dividends and imputation
  - fixed assets, depreciation and leases
  - inventory
  - banking
  - business structures
  - language and dates

  Ends with a 4-question quiz.
- **Four worked examples**, each the same event journalised the US way and the NZ way: buying and selling with sales tax vs GST; an owner taking money (sole trader vs company); payroll on $1,000 gross; closing the books.
- **"🇺🇸 US vs NZ" link** added to the top navigation.
- **Collapsed "Coming from a US textbook?" notes** (`UsNote` in `components/learn/bits.tsx`) on 8 pages: GST, PAYE, Shareholders, Depreciation, Inventory, Income tax, Business structures and Cycle → Statements. Each is one closed line until clicked. Mechanics pages deliberately have none.
- **Glossary**: new "🇺🇸 US → NZ terms" category with 16 entries (Withdrawals, Income statement, Stockholders, Sales tax, FICA, W-4/W-2, IRS, Fiscal year, LLC/S corp, Notes payable, etc.). Each has a "🇳🇿 NZ term →" button that opens the NZ equivalent. There's also a banner on the US filter linking to `/us-vs-nz`.
- Test added: every US glossary term must point to an NZ entry that exists.
- Five elements lesson: added explanations of drawings (not a sixth element) and income vs revenue.

### Accuracy checks against legislation
- Checked employment and company-law statements against the Holidays Act 2003, the Employment Relations Act 2000 and the Companies Act 1993 (text from the lexifina `new-zealand-law` repo, sourced from legislation.govt.nz, current to 29 Oct 2026).
- **Corrected**: the Holidays Act warning now says the Act is still in force (last amended 20 Dec 2023) and that replacement has only been proposed. Previously it said the Act "is being replaced".
- **Corrected**: sick leave carry-over is up to 10 days, to a maximum of 20 days' entitlement (s 66). Previously it said "carry over up to 20".
- Added section references: Holidays Act ss 16, 21, 28, 50, 56, 65, 66, 70, 81; ERA s 130; Companies Act ss 4, 52, 214. Also added the s 28 condition that 8% pay-as-you-go must show separately on the payslip.
- Not covered by that source: GST Act, Income Tax Act, Tax Administration Act, KiwiSaver Act and Minimum Wage Act. Those rates come from IRD, ACC and employment.govt.nz.

### Build and config
- Removed `dynamicParams = false` from the dynamic routes. It isn't compatible with `cacheComponents`; unknown slugs still 404 via `notFound()`.
- `next.config.ts`: set `turbopack.root` to stop the workspace-root warning.
- Lint fixes: the T-account side renderer is no longer a component created during render; the inventory FIFO calculation no longer reassigns a variable; internal links use `<Link>`.

---

## Initial build

Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind v4, `motion`, `vitest`.

### The café and its books
- **Kōwhai Café Ltd**, Wellington (fictional): a company owned by Aroha (60%) and Ben (40%), with employees Mia (full time) and Leo (casual). Year 1 Apr 2026 – 31 Mar 2027. GST on the invoice basis, filed two-monthly. Periodic inventory.
- **211 journal entries** in one journal (`data/books/`): 29 featured April transactions with full stories, source documents and quizzes; routine monthly entries, payroll (25 fortnightly pays), GST and PAYE payments, later events, 12 year-end adjustments and 3 closing entries.
- **Accounting engine** (`lib/engine/`): ledger, balances, trial balance, statements (P&L, balance sheet, changes in equity, cash flow by the direct and indirect methods), GST returns, bank reconciliation. Everything is derived from the one journal.
- **NZ calculations** (`lib/nz/`): PAYE including IETC and the ACC levy, ESCT, depreciation (DV/SL, Investment Boost), loan amortisation, the income tax computation. All rates are in `lib/nz/rates.ts`, sourced from IRD, ACC and employment.govt.nz.
- **Tests** (`tests/engine.test.ts`): every entry balances; the equation holds after every transaction; the trial balance and balance sheet balance; closing zeroes temporary accounts; direct cash flow = indirect; the GST control account = the GST return; bank rec items; payroll identities; glossary links.

### Pages
- **Home**: introduction, the cycle wheel, the café and its people, learning paths.
- **Part 1 Foundations**: 11 lessons, including an accounting-equation sandbox, debit/credit practice and T-account explorer.
- **Part 2 Accounting cycle**: overview wheel plus 12 steps. Includes the April transaction walkthrough (document → analyse → journalise → post), "the year" month view, an interactive bank rec, the adjustments stepper, the 10-column worksheet, statements, staged closing and the post-closing trial balance.
- **Part 3 NZ tax & rules**: 14 topics with calculators (GST, GST returns box by box, PAYE payslip, KiwiSaver/ESCT, holidays, employment, ACC, income tax, provisional tax, shareholders and imputation, depreciation, inventory, other taxes, compliance).
- **Explore the books**: journal, ledgers (including subsidiary ledgers), trial balance and statements at any date, ratios, loan schedule, break-even.
- **Glossary**: about 115 terms; underlined terms show a definition on hover and open a full explanation on click.
