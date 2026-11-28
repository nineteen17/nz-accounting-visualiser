# Study tool: design, coverage and tracker

The single place to track the **Study** section (`/study`): what it's for, how it's built, what it covers, and what's still to do.
**Update this file whenever study work is done**: tick the checklist, update the coverage map, and add a line to the log at the bottom. The CHANGELOG records each change too; this file holds the current state.

_Last updated: 2026-11-27_

---

## 1. Purpose

The course (Parts 1–4) explains things. The study tool makes them **stick**, and checks the learner can **do** them, not just recognise them.

A learner who finishes the course and keeps up with Study should be able to:
1. **Know the words**: define every essential term, and recognise the working-knowledge ones.
2. **Classify**: say which element, side, statement, section or tax treatment something is.
3. **Record**: write the journal entry for any of Kōwhai's transactions or year-end adjustments.
4. **Calculate**: GST, depreciation, payroll, accruals, cost of goods sold, taxable income, provisional tax, imputation and ratios.
5. **Know the NZ calendar**: when each return and payment is due.

### Principles (every new study feature must follow these)
- **Active recall.** The learner produces an answer *before* seeing it. Prefer typed answers and built entries over multiple choice, where it's practical.
- **Spaced repetition.** Things answered well come back less often; things missed come back soon.
- **Generated from the café's books.** Questions are built from the same data the course uses (`data/books`, `data/chartOfAccounts.ts`, `lib/nz/*`, the glossary), so the numbers always agree with the lessons and there's an endless supply. No hand-typed figures that can drift.
- **Explain every answer.** Say why the right answer is right, name the usual trap, and link to the lesson.
- **NZ-correct.** Rates and dates come from `lib/nz/rates.ts`, which is checked against IRD, ACC, MBIE and Employment NZ. Flag US-vs-NZ differences where they matter.
- **Tested.** Every generator has a test that creates hundreds of questions and checks they're well-formed and correct.

---

## 2. Architecture

### Files

| File | Role |
|---|---|
| `app/study/page.tsx` | The route. Static page; renders `<Study />`. |
| `components/study/Study.tsx` | The dashboard and tabs (client component): Today's review, `CardSession` (term and memory-aid flashcards), the drills list grouped by kind, `Progress` (weakest topics, missed questions, known by Part). |
| `components/study/DrillRun.tsx` | A run of questions from a list of `{ drill, seed }` items (one drill, Today's review, or missed questions): `ChoiceView`, `NumberView`, `EntryView`, `OrderView`, the end-of-run review. Also `makeSet`. |
| `components/study/PractiseLinks.tsx` | The "Make it stick" box at the end of each lesson: the drills whose revise link is that lesson, and the Part's flashcards. |
| `lib/study/srs.ts` | Pure logic: the Leitner scheduler (`schedule`, `nextBox`, `intervalLabel`), the saved-data shape (`StudyData`), `loadStudy`, `markStudied`, `streak`, missed questions (`recordAnswer`, `dueMissed`), and export/import (`exportStudy`, `parseImport`). No React. |
| `data/study/core.ts` | Shared types (`Question` = `ChoiceQ` / `NumberQ` / `EntryQ` / `OrderQ`, `Drill`, `DRILL_GROUPS`) and helpers: `seeded` (repeatable random numbers), `newSeed`, `mc`, `num`, `parseAnswer`, `isRight`, money formatting. |
| `data/study/drills.ts` | The registry (`DRILLS`, `DRILL_MAP`) and the basic drills: debit or credit, element, current, statement, GST maths, due dates, match the term. Also `plain` and `maskTerm`. |
| `data/study/entries.ts` | Build-the-entry drills (E1–E4): question pools from Kōwhai's real transactions and adjustments (one of each kind), closing entries from the real year-end balances, the year 2 pool, mix-up accounts, `netLines`, `entryQuestion`. |
| `data/study/classify.ts` | "Sort it" drills (C1–C12): cash-flow sections, effect on the equation, TB errors (CROPOC), bank rec items, temporary/permanent, capital or revenue, GST type, deductibility, source documents, is it a transaction, owners & structures, US → NZ. Built from real transactions and the chart of accounts where possible; rule-based scenarios otherwise. |
| `data/study/gaps.ts` | Drills for lessons that had none: the worksheet (adjusted TB), after closing (post-closing TB), employment basics, ACC levies, RWT / FBT / withholding tax. Balances from the real books; rates from `lib/nz/rates.ts`. |
| `data/study/order.ts` | "Put it in order" (O1): the cycle steps from `data/cycle.ts`, and the course's processes (a transaction's journey, closing, a pay run, a GST period, the tax year). |
| `data/docKinds.ts` | Names of the source-document types, shared by the document component and the drills. |
| `data/study/calc.ts` | Typed-answer drills (N1–N12): apportioning, depreciation, COGS, payroll, holiday pay, taxable income, provisional tax, ratios, T-account balances, cash vs accrual, GST for a period, imputation and dividend RWT. Uses `lib/nz/*` and the real statements. |
| `data/glossary.ts` | The flashcard source. Each term has `level` (essential / working / reference) and `part` (1–4). |
| `data/memoryAids.ts` | Memory aids: shown on flashcards for matching terms, and cards of their own (`aidPart` gives each one a Part). |
| `tests/study.test.ts` | Scheduler, streak and drill-generator tests. |
| `tests/glossary.test.ts` | Glossary completeness: levels, parts, links, examples, mistakes. |

### How it fits together

```
 glossary.ts ──(level, part)──┐
 memoryAids.ts ───────────────┤
                              ├──► Study.tsx ──► CardSession ──► srs.schedule() ──────┐
 books / chart of accounts ───┤                 DrillRun ─────► drill stats ─────────┤
 lib/nz/rates.ts ─────────────┘                    │                                 │
                                                   └──► srs.recordAnswer() ──────────┤
                                     (a missed question is saved as drill + seed,    │
                                      and make(seeded(seed)) rebuilds it exactly)    ▼
                                                              localStorage "study-v1"
                                                              localStorage "study-settings-v1"
```

### Flashcards
- **Card id**: `f:<term-key>` (term → meaning), `r:<term-key>` (meaning → term, with the term masked) or `a:<aid-key>` (a memory aid: the hook on the front, what it stands for and why on the back).
- **Scope**: the learner picks Parts and levels (default: all Parts, Essential only) and whether to include memory aids (default yes). New cards are introduced by Part, then level, then glossary order; a Part's memory aids come after its essential terms.
- **Session**: due cards (shuffled), then up to N new ones (5/10/20/50). "Again" puts the card back at the end of the session.
- **Scheduler**: Leitner boxes. Days until the next review: box 0 = again now, then 1, 3, 7, 14, 30, 60.
  - Again → box 0
  - Hard → stays in its box (at least box 1)
  - Good → up one box
  - Easy → up two boxes
- **Known**: box ≥ 3 (recalled well with a week or more between reviews). Flashcards only.
- **Mastered** (drills): the last full set scored 80% or more and none of that drill's missed questions are still open (`isMastered`). Shown on the drill cards, the Drills tab and Progress. Kept separate from Known on purpose: Known is about recalling a term over time, mastered is about doing a task.
- **Type it** (setting): meaning → term cards ask you to type the term. `lib/study/recall.ts` accepts the full term, the part before the brackets, what's in them ("PAYE" or "Pay As You Earn"), either half of "A / B", ignores capitals, punctuation, macrons and "&"/"and", and lets one small typo per six letters through as "close" (abbreviations must be exact). You still grade yourself; the suggested grade is outlined.

### Drills
- **A drill** is `{ key, title, icon, blurb, part, group, learn, length?, make(rng) }`.
  - `group` decides where it appears on the Drills tab: **Record it**, **Work it out**, **Sort it**, or **NZ dates & words**.
- **A question** is one of four kinds. All have `prompt` and `explain`, which support `**bold**` and `[[glossary]]` links. A link inside bold isn't rendered, so the tests forbid `**[[`.
  - `choice`: `options[]` and the `answer` index. Keys 1–4.
  - `number`: `answer`, `unit` ($ / % / none), `tolerance` (default 1 cent, or 0.1 for %) and `hint`. Accepts `$1,234.50`, `1234.5`, `70.3%`, `−150`.
  - `entry`: `story`, `doc`, account `options` (the right accounts plus likely mix-ups, in chart order) and the correct `lines` (netted per account).
    - Marked row by row: each account must have the right side and amount, or be left blank.
    - Live debit and credit totals show whether the entry balances.
    - When some amounts are only worked out by adding up the document (`amountsGiven: false`), the amounts are shown up front; otherwise they're behind a hint.
    - **Harder mode** (checkbox under the entry, saved as `study-entry-hard-v1`): amounts are never shown up front, and a note says when some must be worked out (split off GST, add up payslips, net two figures). The hint button stays, because a few amounts (e.g. reversing last year's accrued wages, netted leave lines) can't be fully worked out from what's shown; using it is noted on the result.
  - `order`: `items` in the right order. Shown shuffled (never already in order), moved with ↑/↓ buttons, marked position by position.
- **Every question has a seed.** `make(seeded(seed))` always gives the same question, so a run is a list of `{ drill, seed }` and a missed question can be saved and regenerated exactly. A test checks this for every drill.
- **A run** is 10 unique questions, or 5 for the entry and ordering drills. The end screen shows the score and the missed questions with their explanations.
- **Missed questions** (`recordAnswer`): a wrong answer saves the question, due tomorrow. Right on a saved question moves it up a box (3 days); right again and it's dropped. Wrong again sends it back to tomorrow. At most 200 are kept, oldest dropped first.
- **Today's review**: up to 10 due missed questions, then 5 new questions from different drills (the Parts in the flashcard settings; lowest last score first, with some randomness), then the due flashcards.
- **Stats saved per drill**: tries, best score, last score, date.
- **Entry pools**: one transaction of each kind, so the monthly ones aren't repeated. That's 79 everyday transactions and 17 adjustments from years 1 and 2; 56 and 12 of them have every amount written in the story or document.

### Saved data (`localStorage`)
```ts
"study-v1": {
  version: 1,
  cards:  { [cardId]: { box, due: "yyyy-mm-dd", reps, lapses } },
  drills: { [drillKey]: { attempts, best, last, total, when } },
  missed: { "<drill>:<seed>": { drill, seed, state: { box, due, reps, lapses } } },
  days:   ["yyyy-mm-dd", ...]      // days studied, for the streak (last 400 kept)
}
"study-settings-v1": { parts, levels, dir, newCount, aids, typed }
"gst-return-v1": { [periodKey]: { sorted, of, boxes, done } }   // best result per GST period
"pay-run-v1": { [runKey]: { lines, of, entry, filing, done } }   // best result per pay run
```
Bad data loads as empty. **Export / import** (Progress tab): `exportStudy` writes `{ app: "kowhai-cafe-study", exported, study, settings }` as a JSON file; `parseImport` refuses anything that isn't that (or is a different version), drops broken entries, and the settings are checked field by field before anything is replaced. `missed`, `aids` and `typed` were added without a version bump: they're new optional fields, and `loadStudy` / the settings loader fill them with defaults, so older saved progress still loads. **Any change to the shape needs a version bump plus a migration in `loadStudy`**, so learners don't lose progress.

### URL options
- `/study?part=2` studies a single Part.
- `/study?tab=drills` and `/study?tab=progress` open those tabs.
- `/study?drill=<key>` starts that drill (the lessons' "Make it stick" links).

### Possible next changes
See the open questions in section 5.

---

## 3. Coverage map

✅ practised well · 🟡 partly (terms only, or one narrow drill) · ❌ not practised · ⬜ planned item in brackets

### Part 1 · Foundations
| Lesson | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| What is accounting | ✅ | – | |
| Five elements | ✅ | ✅ Which element? | |
| Accounting equation | ✅ | ✅ Effect on the equation (real transactions) | |
| Double entry | ✅ | ✅ Build the journal entry | |
| Debits & credits | ✅ | ✅ Debit or credit? | |
| T-accounts | ✅ | ✅ Balance a T-account | |
| Chart of accounts | ✅ | ✅ Which element? / statement | |
| Source documents | ✅ | ✅ Which source document? | |
| Cash vs accrual | ✅ | ✅ Cash vs accrual profit | |
| US vs NZ | ✅ (reference) | ✅ US → NZ terms | |
| Business structures | ✅ | ✅ Owners & business structures, Which structure? (who's taxed, returns, losses, liability, LTC owners, ACC, tax on a share) | |

### Part 2 · Accounting cycle
| Step | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| Identify / analyse | ✅ | ✅ Is it a transaction?, Build the journal entry | |
| Journalise | ✅ | ✅ Build the journal entry (79 real transactions) | |
| Post | ✅ | ✅ Balance a T-account, Put it in order | |
| The year | – | ✅ via Build the journal entry | |
| Unadjusted TB | ✅ | ✅ Trial balance errors (CROPOC, will it balance?) | |
| Bank reconciliation | ✅ | ✅ Bank reconciliation items | |
| Adjustments | ✅ | ✅ Year-end adjustments (17 real entries), Accruals & prepayments | |
| Adjusted TB | ✅ | ✅ The worksheet (columns and adjusted balances, real) | |
| Statements | ✅ | ✅ current / which statement, Ratios, Cost of goods sold, Operating/investing/financing | |
| Closing | ✅ | ✅ Closing entries (real balances), Temporary or permanent?, closing order | |
| Post-closing | ✅ | ✅ After closing (real retained earnings and totals), closing order | |
| Cycle order | ✅ memory aid card | ✅ Put it in order | |

### Part 3 · NZ tax & rules
| Topic | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| GST | ✅ | ✅ GST maths, Standard / zero-rated / exempt | |
| GST return | ✅ | ✅ GST for a period, GST period order, due dates, GST entries in E1, Do the GST return yourself (`/study/gst-return`, all twelve real periods) | |
| PAYE | ✅ | ✅ Payroll, pay-run entries in E1, Do a pay run yourself (`/study/pay-run`, six real pay runs) | |
| KiwiSaver | ✅ | ✅ Payroll (employee and employer KS, ESCT) | |
| Holidays | ✅ | ✅ Holiday pay | |
| Employment | ✅ | ✅ Employment basics | |
| ACC | ✅ | ✅ ACC levies, earners' levy inside PAYE in Payroll | |
| Income tax | ✅ | ✅ Taxable income & tax, Deductible for tax?, tax entries in E2 | |
| Provisional tax | ✅ | ✅ Provisional tax, due dates, Provisional tax: methods & interest (standard amount, interest-free or not, interest on a shortfall, late payment penalty, GST ratio) | |
| Shareholders | ✅ | ✅ Dividends & imputation, Owners & business structures, entries in E1/E2/E4 | |
| Depreciation | ✅ | ✅ Depreciation, Capital or revenue?, depreciation entry in E2 | |
| Inventory | ✅ FIFO, weighted average, NRV | ✅ Cost of goods sold, stocktake entries in E2, Valuing stock (FIFO, weighted average, which gives more profit, lower of cost and NRV, low value stock rule) | |
| Other taxes | ✅ | ✅ RWT, FBT or withholding tax? | |
| Compliance | ✅ | ✅ When is it due? (full calendar), records 7 years | |

### Part 4 · A year on the job
| Topic | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| Year 1 tasks (236) | via terms | ✅ Build the journal entry / Year-end adjustments use year 1 | |
| Year 2 tasks (226) | via terms | ✅ Year 2 entries (reversals, POS sale, dividend and RWT, annual leave, provisional tax), Dividends & imputation | |
| Year 2 statements | ✅ | ✅ Ratios use both years | |
| Budget vs actual (Explore) | ✅ budget, variance, flexible budget | ✅ Budget vs actual (F/U, size, flexing, fixed or variable, why) | |
| Cash flow forecast (Explore) | ✅ cash flow forecast | ✅ Cash flow forecast (profit or cash, month-end bank, GST due dates, paydays, why) | |
| Pay yourself (Explore) | via terms | ✅ Salary or dividend? (credits, dividend RWT, the most the credits cover, company tax after salaries, who should take salary, solvency, s GB 25) | |
| Year-end, all together | – | ✅ Do the year-end yourself (`/study/year-end`): both years' real adjustments in order, on your own trial balance | |

### Memory aids (18)
Shown on matching flashcards, and practised as cards of their own (`a:` cards, on by default).

---

## 4. Checklist

### ✅ Done
- [x] **G1** Glossary audit: 48 terms added (179 total).
- [x] **G2** Every term has a level and Part; essential and working terms have a café example; essential terms have a common mistake; every term links to its lesson.
- [x] **G3** Glossary level filter and badges.
- [x] **S1** `/study` page, menu link, home page card, 404 link.
- [x] **S2** Flashcards: Part/level/direction scope, recall → reveal → grade, Leitner scheduler, keyboard shortcuts.
- [x] **S3** Flashcard back shows the definition, café example, common mistake, memory aid and full explanation.
- [x] **S4** Drills (multiple choice): debit or credit, which element, current or non-current, which statement, GST maths, due dates, match the term.
- [x] **S5** Progress: due/new/known, streak, known by Part and level, drill scores, reset.
- [x] **S6** Tests: scheduler, streak, 300 generated questions per drill, GST arithmetic, due-date exceptions, masking.
- [x] **Q1** `Question` union: `choice` / `number` / `entry`, each with its own view; typed answers accept `$1,234.50`, `1234.5`, `70.3%`. (`order` moved to O1.)
- [x] **E1** Build the journal entry: 79 kinds of real transaction (years 1 and 2), mix-up accounts, marked row by row, live totals, amounts hint.
- [x] **E2** Year-end adjustments: 17 real adjusting entries (accruals, prepayments, depreciation, holiday pay, stock, bad debt, shareholder salaries, tax).
- [x] **N1** Accruals & prepayments: prepaid amount, this year's expense, accrued wages, accrued income, income in advance.
- [x] **N2** Depreciation: DV part year, SL, DV year 2, book value, gain or loss on sale.
- [x] **N3** Cost of goods sold, gross profit and margin.
- [x] **N4** Payroll: gross, employee and employer KiwiSaver, ESCT, student loan, net pay, employer cost (from `calcPay`).
- [x] **N5** Holiday pay: 8% pay-as-you-go, public holiday time and a half, annual leave pay (greater of OWP and AWE).
- [x] **N6** Taxable income and tax at 28%.
- [x] **N7** Provisional tax: RIT, the standard method, instalments, terminal tax, the $5,000 threshold.
- [x] **N8** Ratios from Kōwhai's real statements: current, quick, working capital, gross and net margin, debt to equity.
- [x] **T1** Tests: the working shown includes the answer; entries balance and include the right accounts; known figures (espresso depreciation $3,360 and $7,840 book value, current ratio 2.68, gross margin 70.3% / 69.6%); net pay = gross − deductions; answer parsing; no links inside bold.

### Phase 1: record and calculate ✅ done (see above)

### Phase 2: classify ✅ done
- [x] **C1** Operating, investing or financing? (Kōwhai's real cash movements, classified the way the cash flow statement does)
- [x] **C2** Capital or revenue? (including the low-value asset rule from `DEPRECIATION.lowValueAssetThreshold`)
- [x] **C3** Effect on the accounting equation (real transactions; each account's movement explained)
- [x] **C4** Trial balance errors: will it balance? Which CROPOC type? (built on real entries)
- [x] **C5** Bank reconciliation items: timing difference, cashbook entry, or the bank's mistake
- [x] **C6** Temporary or permanent account? (from the chart of accounts)
- [x] **C7** Standard-rated, zero-rated, exempt, or not a supply? (Kōwhai's accounts plus scenarios)
- [x] **C8** Deductible: fully, 50%, not, or later/over time?
- [x] **C9** Which source document? (real documents; internal workings left out)
- [x] **C10** US term → NZ term (from the glossary)
- [x] **C11** Owner payments (drawings / salary / dividend / wages) and business structures
- [x] **C12** Is it a transaction?
- [x] **D1** Full NZ calendar: two- and six-monthly GST, PAYE, payday filing, KiwiSaver, provisional and terminal tax (with and without an agent), IR4, annual return, record keeping
- [x] **T2** Tests: cash-flow sections for known transactions, the equation balances for every transaction, temporary/permanent matches the account type, TB-error answers agree with their explanations, no internal documents, terminal tax and IR4 dates with and without an agent.

### Phase 3: make it stick ✅ done
- [x] **R1** Seeded, repeatable questions; missed drill questions are saved and come back through the scheduler (tomorrow, then 3 days; dropped once right twice).
- [x] **R2** Today's review: due missed questions, 5 new questions across drills (weakest first), then the due flashcards.
- [x] **M1** Memory aids as flashcards: the hook on the front, the breakdown, why and the café example on the back.
- [x] **O1** `order` question type and "Put it in order": the cycle steps, a transaction's journey, closing, a pay run, a GST period, the tax year.
- [x] **E3** Closing entries from Kōwhai's real year-end balances (years 1 and 2), plus closing the income summary.
- [x] **E4** Year 2 entries: reversing last year's accruals, the POS sale and its depreciation, the dividend and its RWT, annual leave, provisional tax.
- [x] **N9** Balance a T-account.
- [x] **N10** Cash-basis vs accrual-basis profit for a month.
- [x] **Y4** Do the company tax return yourself (`/study/ir4`, form in `lib/engine/ir4.ts`, logic in `lib/study/ir4.ts`, returns in `data/study/ir4.ts`): sort the year's items into tax adjustments, work out taxable income, fill in the IR4 and the annual imputation return (each box marked against your own earlier boxes), and the due dates. Both years. Best result per return saved (`ir4-v1`). Plan: `docs/IR4.md`.
- [x] **Y3** Do a pay run yourself (`/study/pay-run`, logic in `lib/study/payRun.ts`, runs in `data/study/payRun.ts`): the payslips line by line (PAYE as IRD's steps), the entry, payday filing. Best result per pay run saved as `pay-run-v1`. The payroll engine now follows IRD's payroll specification.
- [x] **B8** Tax losses: does it survive? drill, with the Tax losses tool (`data/study/taxLosses.ts`, rules from `lib/nz/taxLosses.ts`): does a loss survive a share sale (49% or the business continuity test), do the imputation credits (66%), and how much of a loss a year uses. 49 drills.
- [x] **B7** Deferred tax: temporary or permanent? drill, with the Tax: accounts vs return tool (`data/study/deferredTax.ts`, items from both years' tax reconciliations in `data/books/deferredTax.ts`): temporary or permanent, deferred tax asset or liability, and the deferred tax at 28%. 48 drills.
- [x] **B6** Provisional tax: methods & interest drill, with the provisional tax planner (`data/study/provisionalTax.ts`, rules from `lib/nz/provisionalTax.ts`). 47 drills.
- [x] **Y2** Do the GST return yourself (`/study/gst-return`, logic in `lib/study/gstReturn.ts`, periods in `data/study/gstReturn.ts`): sort a real period's transactions, fill in the GST101A from your own sorting, and compare with Kōwhai's return. Best result per period saved as `gst-return-v1`.
- [x] **B5** Which structure? drill, with the Which structure? tool (`data/study/structures.ts`, figures from `lib/nz/structures.ts`). 46 drills.
- [x] **B4** Salary or dividend? drill, with the pay yourself tool (`data/study/payYourself.ts`, figures from `data/books/payYourself.ts`). 45 drills.
- [x] **N11** GST payable for a period (output − input, leaving out exempt fees and wages).
- [x] **N12** Imputation credits (28/72), the gross dividend, dividend RWT and the cash paid.
- [x] **P1** A "Make it stick" box at the end of every lesson (Foundations, cycle steps and overview, NZ topics, A year on the job, and the ratios tool) with its drills and the Part's flashcards; `/study?drill=` starts a drill.
- [x] **P2** Weakest topics on Progress: drills with the lowest last score or open missed questions (each with Practise), cards forgotten most, and "Retry them now" for saved questions.
- [x] **G4** Drills for the last uncovered lessons: The worksheet, After closing, Employment basics, ACC levies, RWT/FBT/withholding tax. Every lesson now has a drill. Tests check the worksheet columns balance with the real profit, retained earnings after closing, and the adjusted balances asked for.
- [x] **V1** IR4 due date checked against IRD (company tax return guide 2026 and the 2026–27 tax calendar): 7 July without an agent, 31 March the following year with one.
- [x] **X2** Harder entry mode: hide the amounts, with the hint still available (from the open questions).
- [x] **X3** Drills mastered: last set 80%+ and no open missed questions; shown on drill cards, the Drills tab and Progress. Known stays flashcards-only.
- [x] **B2** Cash flow forecast drill, from `data/books/cashForecast.ts`.
- [x] **B3** Valuing stock drill (generated purchases, `lib/nz/stock.ts`).
- [x] **Y1** Do the year-end yourself: the unadjusted trial balance, every real adjustment in order, your trial balance and profit as you go, and your profit beside the real one. 44 drills.
- [x] **B1** Budget vs actual drill, from `data/books/budget.ts` (year 2 budget built from year 1 plus known changes). 42 drills.
- [x] **X4** "Type it" for meaning → term cards, with a forgiving checker (`lib/study/recall.ts`) and a suggested grade.
- [x] **K1** Keyboard pass: a visible focus outline everywhere; focus moves to each new question, to Next once answered, and follows a flashcard as it flips; number-key shortcuts ignore Ctrl/Alt/Cmd and typing; order-drill arrows keep focus and announce the new position; Dr/Cr buttons say whether they're pressed and jump to the amount; the explainer overlay takes focus, keeps Tab inside, and hands focus back on Escape.
- [x] **X1** Export and import progress as a JSON file (Progress tab), so it can be backed up or moved to another browser or device. Import asks before replacing and refuses files that aren't a study export.
- [x] **T3** Tests: every drill regenerates the same question from the same seed; every drill links to a page that exists; closing entries close income with a debit and expenses with a credit and close the real profit; the year 2 pool covers the Part 4 topics; T-account, imputation, RWT and GST-period answers re-worked independently; missed-question scheduling, the 200 cap, and old saved data still loading.

### Definition of done (each drill)
- [ ] Generated from app data, with no hand-typed figures that could drift.
- [ ] Every answer has an explanation and a lesson link.
- [ ] Test: 300+ generated questions are well-formed, and the answers are checked independently where possible.
- [ ] Works at 390px with no sideways scrolling, and with the keyboard.
- [ ] Coverage map and checklist above updated; CHANGELOG entry added.

---

## 5. Open questions
- None open. Decided 2026-11-28: drills don't count towards Known; they have their own "mastered" (X3). Typed recall added as the "Type it" option for meaning → term cards (X4).

## 6. Log
- **2026-11-29**: Tax losses tool in Explore and its drill (B8); five glossary terms (net loss, tax loss, shareholder continuity, business continuity test, NOL (US)). 49 drills, 308 tests.
- **2026-11-29**: Tax: accounts vs return (deferred tax) tool in Explore, its drill (B7), and six glossary terms (deferred tax, temporary and permanent difference, tax base, taxes payable method, effective tax rate). 48 drills, 294 tests.
- **2026-11-29**: ACC levies and the Companies Office fee are now in the books. The year-end exercise gains an ACC accrual in each year (13 and 11 adjustments); the IR4 exercise gains the s EF 3 add-back (year 1) and the add-back and deduction pair (year 2). 282 tests.
- **2026-11-28**: Do the company tax return yourself (Y4), from IRD's IR4 2026 form and guide. 47 drills, 267 tests.
- **2026-11-28**: Beginner guides (`ToolGuide`) added to all three "do it yourself" exercises: the GST return, the pay run and the year-end.
- **2026-11-28**: Do a pay run yourself (Y3), and the payroll engine corrected to IRD's payroll specification. 47 drills, 254 tests.
- **2026-11-28**: Provisional tax planner (Explore) and its drill (B6); Do the GST return yourself (Y2). 47 drills, 232 tests.
- **2026-11-28**: Which structure? tool (Explore) and its drill (B5). 46 drills, 191 tests.
- **2026-11-28**: Pay yourself tool (Explore) and its Salary or dividend? drill (B4). 45 drills, 175 tests.
- **2026-11-28**: Cash flow forecast tool and drill (B2); inventory page made interactive, with a Valuing stock drill (B3) and IRD's stock rules corrected; Do the year-end yourself (Y1). 44 drills, 154 tests.
- **2026-11-28**: Budget vs actual tool (Explore) and its drill (B1); three glossary terms. Site-wide accessibility pass. 42 drills, 135 tests.
- **2026-11-28**: Keyboard pass (K1), drills mastered (X3) and "Type it" recall (X4); both open questions settled. Payroll rates are now one set per income year (see CHANGELOG). 128 tests.
- **2026-11-27**: IR4 dates verified against IRD (V1). Five drills for the last uncovered lessons (G4): every lesson now has practice. 41 drills; 111 tests.
- **2026-11-27**: Harder entry mode (X2), from the open questions.
- **2026-11-27**: Progress export and import (X1), from the open questions. 105 tests.
- **2026-11-27**: Phase 3 done. Missed questions come back (seeded questions), Today's review, memory-aid cards, "Put it in order", closing entries, year 2 entries, and four new calculations (T-accounts, cash vs accrual, GST for a period, imputation). "Make it stick" links on every lesson and a weakest-topics view. 36 drills in all; 103 tests.
- **2026-11-27**: Phase 2 done. 12 "Sort it" drills (C1–C11; US → NZ is under NZ dates & words) and the full NZ calendar in "When is it due?". 29 drills in all; 90 tests.
- **2026-11-27**: Phase 1 done. Three question types (choice, typed number, journal entry). Ten new drills: Build the journal entry, Year-end adjustments, Accruals & prepayments, Depreciation, Cost of goods sold, Payroll, Holiday pay, Taxable income & tax, Provisional tax, Ratios. GST maths is now typed. The drills tab is grouped into Record it / Work it out / Sort it / NZ dates & words. 17 drills in all; 75 tests.
- **2026-11-27**: Glossary expanded to 179 terms with levels and Parts. Study tool v1: flashcards, 7 multiple-choice drills, progress. Coverage review found the gaps in recording, calculating and Part 4 practice; this tracker was created, and Phase 1 is next.
