# Plan: "Do the company tax return yourself" (IR4)

Status: **built** 2026-11-28 (`/study/ir4`). Planned the same day.

## The idea

Once a year Kōwhai files an **IR4**, the company's income tax return. It's where the year's accounting comes together for IRD:
- the accounting profit becomes **taxable income**;
- the tax is worked out at 28%;
- the tax already paid is subtracted;
- the year's imputation credits are reported.

The app already works all of this out. `taxComputation` / `taxFromItems` (`lib/nz/incomeTax.ts`) give the tax reconciliation, and the year-end entries record the tax. But nobody has filled in the form itself.

This exercise lets the learner do it for both years, in three steps:
1. turn profit into taxable income;
2. fill in the IR4's boxes;
3. know when it's due.

It's marked against the return Kōwhai filed. It sits beside "Do the year-end yourself", "Do the GST return yourself" and "Do a pay run yourself", and it follows on from the year-end: the year-end gives the profit, and the IR4 taxes it.

## The form

**Source:** IRD's [IR4 2026 return](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir1---ir99/ir4/ir4-2026.pdf) (for 1 April 2025 to 31 March 2026) and its [guide, IR4G 2026](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir1---ir99/ir4gu/ir4gu-2026.pdf). Both were read on 28 November 2026.

The **2027 form**, for Kōwhai's year 1, isn't published yet. IRD usually releases it around March. Until then the exercise uses the 2026 form's box numbers and exact wording, with the years moved on one. The page says so, and the CHANGELOG's proposed list gets "re-check against the IR4 2027 when it's out".

The boxes Kōwhai uses (from the 2026 form):

| Box | Wording (shortened) | How it's worked out |
|---|---|---|
| 13A / 13B | NZ interest: total RWT / total gross interest | from the bank's RWT certificate (accounts 450 and 140) |
| 17A | Total tax credits (12A + 13A + 14A + 15A + 16A) | here, just the RWT |
| **20B** | Net profit from business: "after the deduction of all allowable business expenditure, including shareholders' salaries paid or credited" | **taxable** profit from the café, **not** accounting profit, and **without** the interest already in 13B |
| 23 / 25 / 27 / 29 | Total income → after donations → after losses → **taxable income** | no donations, losses or group offsets, so all four are the same |
| 30A | Taxable income (whole dollars: the cents boxes are printed "00") | the cents are dropped |
| 30B | Tax at 28 cents in the dollar | 30A × 28% |
| 30C–30H | Overseas tax, foreign investor credit, imputation credits received | all nil for Kōwhai, so 30H = 30B |
| 30I | Copy of 17A | RWT |
| **30J** | **Residual income tax** (30H − 30I − 30IA) | **RIT**: drives next year's provisional tax |
| 30K | Provisional tax paid for the year | year 1: the voluntary payment; year 2: all three instalments, including the one paid on 7 May after balance date |
| 30L | Refund, or tax to pay | **terminal tax** |
| 32 | First year deriving income? Start date | year 1 only. No initial provisional tax liability: RIT is under $60,000 |
| 33A / 33B | Next year's provisional tax: S, E or R, and the amount (whole dollars) | S, and RIT + 5% |
| 39 | Shareholders' lowest economic interests | 100% |
| 40B / 40E | Per shareholder: remuneration with no PAYE deducted; current account balance (CR/DR) | Aroha's and Ben's salaries (credited to their current accounts, no PAYE), and their year-end current account balances |
| 41–44 | **Annual imputation return**: opening balance, credits (42A tax paid, 42B RWT), debits (43B credits attached to dividends paid), closing balance | always for the tax year 1 April–31 March: the same as Kōwhai's year |

The questions about non-residents, share buy-backs, overseas income and so on are all **No** for Kōwhai. They're shown already answered, so the learner fills in the boxes that matter.

**The IR10 (financial statements summary).** Box 20B needs either an IR10 or the financial accounts attached. Kōwhai attaches its accounts, as the guide allows, so the exercise has no IR10. The guide explains this in a line.

## Kōwhai's two returns (all figures from the books)

| | Year 1: 2027 return | Year 2: 2028 return |
|---|---|---|
| Profit before tax | $64,114.79 | $73,037.90 |
| Tax adjustments | 5: entertainment, holiday pay accrued, depreciation swap (accounting out, tax in), Investment Boost | 8: adds the reversal of last year's holiday pay, the accounting gain on the old POS system out, depreciation recovery in |
| 13A / 13B | $103.56 / $369.86 | nil (no interest income in year 2) |
| 20B | $59,793.40 (taxable income less the interest) | $75,396.39 |
| 29 taxable income | $60,163.26 | $75,396.39 |
| 30A / 30B | $60,163 / $16,845.64 | $75,396 / $21,110.88 |
| 30J RIT | $16,742.08 | $21,110.88 |
| 30K provisional paid | $3,000.00 (voluntary) | $17,579.18 |
| 30L | **$13,742.08 to pay** | **$3,531.70 to pay** |
| 32 | Yes, with the start date | No |
| 33A / 33B | S, $17,579 | S, $22,166 |
| 40 | salaries $90,000 in all; current accounts CR $18,000 / $6,000 | Aroha $65,000, Ben $35,000; current accounts CR $37,400 / $14,600 |
| Imputation return | 0 → +$3,000 tax paid, +$103.56 RWT → **$3,103.56 CR** | $3,103.56 → +$11,719.46 instalments, −$7,777.78 attached to the dividend → **$7,045.24 CR** |

Every figure is generated from the books, not typed in. A test checks that the box answers reproduce the tax entries (690 and 230), the provisional tax planner and the ICA.

Two traps the exercise teaches on purpose:
- **Box 20B isn't the profit in the accounts.** It's taxable profit, and the interest goes in 13B instead, or it would be counted twice.
- **Year 1's terminal tax (7 April 2028) isn't in year 2's imputation return.** The return covers payments from 1 April 2027 to 31 March 2028, so year 1's terminal tax goes in the 2029 one. Year 2's third instalment (7 May 2028) is in **30K**, though: it's provisional tax *for* the 2028 year.

## The exercise, in three steps

**1. Profit to taxable income.** The learner gets the profit before tax and a list of items from the year. They sort each one:
- **add back**;
- **deduct**;
- **no adjustment**: the tax treatment is the same as the accounts.

Some items are real adjustments. Others are deliberate distractors from Kōwhai's own year, which need no adjustment:
- shareholder salaries (deductible, because they were credited within the time allowed);
- the bad debt written off (deductible);
- the dividend (not in profit at all);
- the loan principal repaid (not in profit at all);
- income tax expense (profit is already before tax).

Then they type the amount of each adjustment and the taxable income. Each answer explains why, and links to the law: s DD 1, s EA 4, depreciation, Investment Boost.

**2. Fill in the IR4.** The boxes are grouped as on the form: income, then tax calculation, then provisional tax, then shareholders, then the imputation return. Each box shows:
- IRD's own wording;
- a one-line plain-English "what goes here".

Every box is marked against the learner's own earlier boxes, as in the GST return exercise, so one slip doesn't make everything after it wrong. Whole-dollar boxes (30A, 33B) accept the figure with the cents dropped.

**3. Dates and what happens next.** Three questions:
- When is the return due? With a tax agent, 31 March of the following year; without one, 7 July.
- When is the terminal tax due? 7 April, with an agent.
- What do the RIT and Box 33 mean for next year's provisional tax?

This links to the provisional tax planner.

Then the learner's return sits beside Kōwhai's, with any differences highlighted. The best result for each year is saved on the device (`ir4-v1`).

## Beginner annotations (required for every tool: see the user's standing rule)

- **A `ToolGuide` at the top:**
  - **what it shows:** what the IR4 is, and why taxable income isn't accounting profit;
  - **how to use it:** the three steps;
  - **reading the results:** what RIT, terminal tax and a CR/DR tick mean;
  - **words you'll meet:** IR4, taxable income, tax adjustment, RWT, RIT, provisional tax, terminal tax, imputation credit account, shareholder salary, current account.
- **A "what goes here" line on every box**, and its working after marking, e.g. "$60,163 × 28% = $16,845.64".
- **A "common mistake" callout** in each step:
  - putting accounting profit in 20B;
  - counting the interest twice;
  - forgetting the May instalment in 30K;
  - putting year 1's terminal tax in year 2's imputation return.
- **New glossary terms** if missing: "tax adjustment" (permanent vs timing), and "annual imputation return".
- **A US note:**
  - The US company return is Form 1120.
  - Book-to-tax differences are reconciled on Schedule M-1 or M-3, the same idea as step 1.
  - The federal corporate rate is a flat 21%, plus state tax.
  - There's no imputation: dividends are taxed again in the shareholder's hands, except at a lower "qualified dividend" rate.

## Law

The exercise page shows `LAW["income-tax"]`, which already has these, all checked:
- BC 5: taxable income;
- DA 1, DA 2: deductibility;
- DD 1: entertainment;
- EA 4: holiday pay paid within 63 days;
- DB 1: tax isn't deductible;
- TAA s 37: due dates;
- LE 1, OB 1: imputation.

To add, checked against legislation.govt.nz before building:
- TAA s 33 (annual returns);
- ITA s RC 9 (the standard method's 105%), unless the provisional tax references already cover it.

## Build

| Piece | File |
|---|---|
| The IR4 box map: number, IRD's wording, plain English, and how it's worked out | `lib/engine/ir4.ts` (like `GST101A_BOXES`) |
| Pure exercise logic: building the two returns from the books, the sort-the-adjustments items, marking against the learner's own boxes, progress | `lib/study/ir4.ts`, `data/study/ir4.ts` |
| The page | `app/study/ir4/page.tsx`, `components/study/Ir4Return.tsx` |
| Links: the income tax page's "Make it stick", the drills tab, the year-end exercise's results ("now file the tax return") | `PractiseLinks.tsx`, `Study.tsx`, `YearEnd.tsx` |
| Tests | `tests/ir4Exercise.test.ts` |

**Tests:**
- Both returns' boxes add up as the form says.
- 30B equals the books' tax expense (690), and 30L equals what's left in 230 for the year.
- 33B equals the provisional tax planner's standard amount, cents dropped.
- The imputation return matches `ICA` for the tax year.
- Every distractor in step 1 really does need no adjustment: profit plus the real items gives taxable income exactly.
- A wrong 20B is marked wrong while later boxes worked from it are still marked right.

## Decisions needed

1. **The form version.** Recommended: use IR4 2026's boxes and wording now, and re-check against IR4 2027 when IRD publishes it, around March 2027.
2. **Which years.** Recommended: both. Year 1 is the simpler one (marked simpler) and year 2 the harder one.
3. **The IR10.** Recommended: leave it out, because Kōwhai attaches its accounts, and explain why in a line.
4. **Step 1, sorting the adjustments.** Recommended: include it. It's the part of the IR4 that's real accounting, not form-filling.

## Size

About the size of the GST return exercise. Then the CHANGELOG and `docs/STUDY.md`, where it's a new exercise, Y4.
