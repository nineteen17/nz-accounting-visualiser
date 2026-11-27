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
| `components/study/Study.tsx` | The dashboard and tabs (client component): `CardSession` (flashcards), the drills list grouped by kind, `Progress`. |
| `components/study/DrillRun.tsx` | A drill run: `ChoiceView` (multiple choice), `NumberView` (typed amount), `EntryView` (build a journal entry), the end-of-run review. |
| `lib/study/srs.ts` | Pure logic: the Leitner scheduler (`schedule`, `nextBox`, `intervalLabel`), the saved-data shape (`StudyData`), `loadStudy`, `markStudied`, `streak`. No React. |
| `data/study/core.ts` | Shared types (`Question` = `ChoiceQ` / `NumberQ` / `EntryQ`, `Drill`, `DRILL_GROUPS`) and helpers: `mc`, `num`, `parseAnswer`, `isRight`, money formatting. |
| `data/study/drills.ts` | The registry (`DRILLS`, `DRILL_MAP`) and the basic drills: debit or credit, element, current, statement, GST maths, due dates, match the term. Also `plain` and `maskTerm`. |
| `data/study/entries.ts` | Build-the-entry drills (E1, E2): question pools from Kōwhai's real transactions and adjustments (one of each kind), mix-up accounts, `netLines`, `entryQuestion`. |
| `data/study/classify.ts` | "Sort it" drills (C1–C12): cash-flow sections, effect on the equation, TB errors (CROPOC), bank rec items, temporary/permanent, capital or revenue, GST type, deductibility, source documents, is it a transaction, owners & structures, US → NZ. Built from real transactions and the chart of accounts where possible; rule-based scenarios otherwise. |
| `data/docKinds.ts` | Names of the source-document types, shared by the document component and the drills. |
| `data/study/calc.ts` | Typed-answer drills (N1–N8): apportioning, depreciation, COGS, payroll, holiday pay, taxable income, provisional tax, ratios. Uses `lib/nz/*` and the real statements. |
| `data/glossary.ts` | The flashcard source. Each term has `level` (essential / working / reference) and `part` (1–4). |
| `data/memoryAids.ts` | Memory aids, shown on flashcards for matching terms. |
| `tests/study.test.ts` | Scheduler, streak and drill-generator tests. |
| `tests/glossary.test.ts` | Glossary completeness: levels, parts, links, examples, mistakes. |

### How it fits together

```
 glossary.ts ──(level, part)──┐
 memoryAids.ts ───────────────┤
                              ├──► Study.tsx ──► CardSession ──► srs.schedule() ──┐
 books / chart of accounts ───┤                 DrillRun ─────► drill stats ─────┤
 lib/nz/rates.ts ─────────────┘                                                  ▼
                                                              localStorage "study-v1"
                                                              localStorage "study-settings-v1"
```

### Flashcards
- **Card id**: `f:<term-key>` (term → meaning) or `r:<term-key>` (meaning → term, with the term masked).
- **Scope**: the learner picks Parts and levels (default: all Parts, Essential only). New cards are introduced by Part, then level, then glossary order.
- **Session**: due cards (shuffled), then up to N new ones (5/10/20/50). "Again" puts the card back at the end of the session.
- **Scheduler**: Leitner boxes. Days until the next review: box 0 = again now, then 1, 3, 7, 14, 30, 60.
  - Again → box 0
  - Hard → stays in its box (at least box 1)
  - Good → up one box
  - Easy → up two boxes
- **Known**: box ≥ 3 (recalled well with a week or more between reviews).

### Drills
- **A drill** is `{ key, title, icon, blurb, part, group, learn, length?, make(rng) }`.
  - `group` decides where it appears on the Drills tab: **Record it**, **Work it out**, **Sort it**, or **NZ dates & words**.
- **A question** is one of three kinds. All have `prompt` and `explain`, which support `**bold**` and `[[glossary]]` links. A link inside bold isn't rendered, so the tests forbid `**[[`.
  - `choice`: `options[]` and the `answer` index. Keys 1–4.
  - `number`: `answer`, `unit` ($ / % / none), `tolerance` (default 1 cent, or 0.1 for %) and `hint`. Accepts `$1,234.50`, `1234.5`, `70.3%`, `−150`.
  - `entry`: `story`, `doc`, account `options` (the right accounts plus likely mix-ups, in chart order) and the correct `lines` (netted per account).
    - Marked row by row: each account must have the right side and amount, or be left blank.
    - Live debit and credit totals show whether the entry balances.
    - When some amounts are only worked out by adding up the document (`amountsGiven: false`), the amounts are shown up front; otherwise they're behind a hint.
- **A run** is 10 unique questions, or 5 for the entry drills. The end screen shows the score and the missed questions with their explanations.
- **Stats saved per drill**: tries, best score, last score, date.
- **Entry pools**: one transaction of each kind, so the monthly ones aren't repeated. That's 79 everyday transactions and 17 adjustments from years 1 and 2; 56 and 12 of them have every amount written in the story or document.

### Saved data (`localStorage`)
```ts
"study-v1": {
  version: 1,
  cards:  { [cardId]: { box, due: "yyyy-mm-dd", reps, lapses } },
  drills: { [drillKey]: { attempts, best, last, total, when } },
  days:   ["yyyy-mm-dd", ...]      // days studied, for the streak (last 400 kept)
}
"study-settings-v1": { parts, levels, dir, newCount }
```
Bad or old data loads as empty. **Any change to the shape needs a version bump plus a migration in `loadStudy`**, so learners don't lose progress.

### URL options
- `/study?part=2` studies a single Part.
- `/study?tab=drills` and `/study?tab=progress` open those tabs.

### Planned architecture changes (see checklist)
- **`order` question type**: put steps in order, e.g. the cycle (O1). The `choice`, `number` and `entry` types are done.
- **Repeatable questions.** Each question is generated from a seed: `make(seededRng(seed))`. A missed question can then be saved as `q:<drill>:<seed>` and come back through the same scheduler as a flashcard, regenerated exactly.
- **A "Today" mixed review**: due flashcards, missed drill questions and a few new questions together, so topics are mixed (interleaving).

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
| T-accounts | ✅ | ❌ | Balance a T-account (N9) |
| Chart of accounts | ✅ | ✅ Which element? / statement | |
| Source documents | ✅ | ✅ Which source document? | |
| Cash vs accrual | ✅ | ❌ | Cash vs accrual profit (N10) |
| US vs NZ | ✅ (reference) | ✅ US → NZ terms | |
| Business structures | ✅ | ✅ Owners & business structures | |

### Part 2 · Accounting cycle
| Step | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| Identify / analyse | ✅ | ✅ Is it a transaction?, Build the journal entry | |
| Journalise | ✅ | ✅ Build the journal entry (79 real transactions) | |
| Post | ✅ | ❌ | T-account balance (N9) |
| The year | – | ✅ via Build the journal entry | |
| Unadjusted TB | ✅ | ✅ Trial balance errors (CROPOC, will it balance?) | |
| Bank reconciliation | ✅ | ✅ Bank reconciliation items | |
| Adjustments | ✅ | ✅ Year-end adjustments (17 real entries), Accruals & prepayments | |
| Adjusted TB | ✅ | ❌ | |
| Statements | ✅ | ✅ current / which statement, Ratios, Cost of goods sold, Operating/investing/financing | |
| Closing | ✅ | 🟡 Temporary or permanent? | Closing entries (E3) |
| Post-closing | ✅ | ❌ | |
| Cycle order | memory aid only | ❌ | Put the steps in order (O1) |

### Part 3 · NZ tax & rules
| Topic | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| GST | ✅ | ✅ GST maths, Standard / zero-rated / exempt | |
| GST return | ✅ | 🟡 due dates, GST entries in E1 | GST payable for a period (N11) |
| PAYE | ✅ | ✅ Payroll, pay-run entries in E1 | |
| KiwiSaver | ✅ | ✅ Payroll (employee and employer KS, ESCT) | |
| Holidays | ✅ | ✅ Holiday pay | |
| Employment | ✅ | ❌ | |
| ACC | ✅ | 🟡 earners' levy is inside PAYE in Payroll | |
| Income tax | ✅ | ✅ Taxable income & tax, Deductible for tax?, tax entries in E2 | |
| Provisional tax | ✅ | ✅ Provisional tax, due dates | |
| Shareholders | ✅ | ✅ Owners & business structures, entries in E1/E2 | Imputation maths (N12) |
| Depreciation | ✅ | ✅ Depreciation, Capital or revenue?, depreciation entry in E2 | |
| Inventory | ✅ | ✅ Cost of goods sold, stocktake entries in E2 | |
| Other taxes | ✅ | ❌ | |
| Compliance | ✅ | ✅ When is it due? (full calendar), records 7 years | |

### Part 4 · A year on the job
| Topic | Flashcards | Drills | Gap / planned |
|---|---|---|---|
| Year 1 tasks (236) | via terms | ✅ Build the journal entry / Year-end adjustments use year 1 | |
| Year 2 tasks (226) | via terms | 🟡 E1/E2 include year 2's reversals, POS sale and dividend | A dedicated Part 4 drill (E4), imputation maths (N12) |
| Year 2 statements | ✅ | ✅ Ratios use both years | |

### Memory aids (18)
Shown on flashcards; **not yet practised on their own** (M1).

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
- [x] **T1** Tests: the working shown includes the answer; entries balance and include the right accounts; known figures (espresso depreciation $3,360 and $7,840 book value, current ratio 2.71, gross margin 70.3% / 69.6%); net pay = gross − deductions; answer parsing; no links inside bold.

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

### Phase 3: make it stick
- [ ] **R1** Seeded, repeatable questions; missed drill questions are saved and come back through the scheduler.
- [ ] **R2** "Today" mixed review: due cards + missed questions + a few new questions across topics.
- [ ] **M1** Memory aids as flashcards (the hook → what it stands for / why).
- [ ] **O1** `order` question type and ordering drills: the cycle steps, closing-entry order.
- [ ] **E3** Closing entries.
- [ ] **E4** Part 4 entries: reversing entries, asset disposal (gain and depreciation recovery), dividend with imputation and RWT.
- [ ] **N9** Balance a T-account.
- [ ] **N10** Cash-basis vs accrual-basis profit for a month.
- [ ] **N11** GST payable for a period (output − input).
- [ ] **N12** Imputation credits (28/72) and dividend RWT.
- [ ] **P1** "Study this Part" links at the end of each Part and lesson, and "Practise this" links from lessons to the matching drill.
- [ ] **P2** Weakest-topics view: drills and terms with the most misses.

### Definition of done (each drill)
- [ ] Generated from app data, with no hand-typed figures that could drift.
- [ ] Every answer has an explanation and a lesson link.
- [ ] Test: 300+ generated questions are well-formed, and the answers are checked independently where possible.
- [ ] Works at 390px with no sideways scrolling, and with the keyboard.
- [ ] Coverage map and checklist above updated; CHANGELOG entry added.

---

## 5. Open questions
- Entry questions whose amounts must be added up from the document show the amounts up front. Should a harder mode hide them?
- Should drills count towards "known", or only flashcards? (Currently only flashcards.)
- Typed recall for flashcards (type the term) as well as self-grading?
- Progress export/import (JSON), since progress lives in one browser.

## 6. Log
- **2026-11-27**: Phase 2 done. 12 "Sort it" drills (C1–C11; US → NZ is under NZ dates & words) and the full NZ calendar in "When is it due?". 29 drills in all; 90 tests.
- **2026-11-27**: Phase 1 done. Three question types (choice, typed number, journal entry). Ten new drills: Build the journal entry, Year-end adjustments, Accruals & prepayments, Depreciation, Cost of goods sold, Payroll, Holiday pay, Taxable income & tax, Provisional tax, Ratios. GST maths is now typed. The drills tab is grouped into Record it / Work it out / Sort it / NZ dates & words. 17 drills in all; 75 tests.
- **2026-11-27**: Glossary expanded to 179 terms with levels and Parts. Study tool v1: flashcards, 7 multiple-choice drills, progress. Coverage review found the gaps in recording, calculating and Part 4 practice; this tracker was created, and Phase 1 is next.
