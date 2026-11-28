# Plan: "Do a pay run yourself"

Status: **built** 2026-11-28 (`/study/pay-run`), with the engine fix. Planned the same day.

## The idea

Payroll is the job a small business does most often: Kōwhai pays Mia and Leo every fortnight, 51 times over the two years. The app already works out every pay run (`calcPay` in `lib/nz/payroll.ts`, the pay runs in `data/books/generator.ts`) and the PAYE page has a calculator, but the only practice is the Payroll drill's single sums.

This exercise lets the learner do a whole real pay run, the way Kōwhai does it:
1. work out each payslip;
2. write the journal entry;
3. do the payday filing and know when the money goes to IRD.

It's marked against Kōwhai's real pay run. It sits beside "Do the year-end yourself" and "Do the GST return yourself".

## Kōwhai's staff (from `data/business.ts`)

| | Mia Thompson | Leo Tuilagi |
|---|---|---|
| Job | Full-time barista, permanent | Casual kitchen hand, university student |
| Pay | $26/hr, then $27 from April 2027; 80 hrs a fortnight | $24.50/hr, then $25.50; 24–44 hrs a fortnight (busier in summer) |
| Tax code | ME SL (main job, gets the IETC, has a student loan) | M |
| Holiday pay | Builds up annual leave | 8% added to every pay ("pay-as-you-go", because he's casual) |
| KiwiSaver | 3.5% employee + 3.5% employer | 3.5% + 3.5% |

## The pay runs (recommended: six, simpler first)

| Pay run | What's new in it |
|---|---|
| Year 1, 22 April 2026: the first pay run | Everything, once: gross, PAYE, the earners' levy, the IETC, student loan, KiwiSaver, ESCT, 8% holiday pay |
| Year 1, December 2026 | Leo's busy summer hours (44 instead of 30), so his pay and deductions change while Mia's stay the same |
| Year 2, 7 April 2027: the first of the new year | New tax year rates: the earners' levy rises to 1.83%. Part of this pay was worked last year (accrued, then reversed) |
| Year 2, 21 April 2027: pay rises | New hourly rates for both |
| Year 2, 28 July 2027: Mia's annual leave (**harder**) | Leave pay comes out of the holiday pay accrual (account 220), not wages |
| Year 2, 23 February 2028: the rest of her leave (**harder**) | The accrual runs out partway: the extra is this year's holiday pay expense (602) |

## The exercise, in three steps

**1. The payslips.** The learner gets each person's timesheet and details (hours, rate, tax code, KiwiSaver rate, student loan), and fills in a payslip:

| Line | How |
|---|---|
| Ordinary pay | hours × rate |
| Holiday pay (Leo) | 8% of ordinary pay |
| **Gross pay** | ordinary + holiday pay |
| PAYE (incl. ACC earners' levy) | IRD's steps, shown as a guided calculation (below) |
| Student loan (Mia) | 12% of gross over $928 a fortnight, with gross cut to whole dollars |
| KiwiSaver, employee | 3.5% of gross |
| **Net pay** | gross − PAYE − student loan − KiwiSaver |
| Employer KiwiSaver | 3.5% of gross, on top of the wage |
| ESCT | the employer contribution × the employee's ESCT rate |
| Employer KiwiSaver to the fund | employer contribution − ESCT |

**PAYE is guided.** It's the one figure nobody works out in their head. The learner gets IRD's own steps as a mini-worksheet:
1. Annualise the gross pay (× 26), dropping the cents.
2. Work out the tax on that.
3. Add the earners' levy.
4. Subtract the IETC (ME code only).
5. Divide by 52 and cut to whole cents.
6. × 52 ÷ 26 and cut to whole cents again.

Each step is marked as they go, and a "Use the PAYE tables" button fills it in for anyone who only wants the structure. Small employers really use software or IRD's tables (IR340).

**2. The journal entry.** Using the existing entry editor (`EntryView`, as in the year-end exercise), the learner writes:
- Dr Wages 600 for the gross pay (or Dr Holiday pay accrual 220 and Holiday pay expense 602 in the leave runs);
- Dr Employer KiwiSaver 601;
- Cr Bank 100 for each person's net pay;
- Cr PAYE & deductions payable 215 for each deduction.

It's marked against Kōwhai's real entry. Their own entry is checked for balance first, with a hint if it doesn't.

**3. Payday filing and paying IRD.** A short set of questions on the real dates:
- When is the employment information due? (2 working days after payday.)
- Which figures go in it? (Per person: gross, PAYE, student loan, KiwiSaver both sides, ESCT.)
- When does the money go to IRD, and how much? (By the 20th of next month: every 215 credit from that month's pay runs, all in one payment.)

Then the learner's payslips sit beside the real ones, with differences highlighted. The best result per pay run is saved on the device (`pay-run-v1`). "Make it stick" on the PAYE page links here.

## Beginner annotations (required for every tool: see the user's standing rule)

- **An intro in plain English** before step 1: what a pay run is, why the café takes money *out* of someone's pay (it collects tax for IRD), and why some of it is a **liability**, not an expense.
- **Every term is a `<Term>`** with its glossary entry. All of these already exist in `data/glossary.ts`: gross pay, net pay, PAYE, tax code, IETC, ACC earners' levy, student loan, KiwiSaver, employer KiwiSaver, ESCT, pay-as-you-go, holiday pay, annual leave, payday filing.
- **Every payslip line has a one-line "what is this?"** beside it, and its working after marking (e.g. "80 hrs × $26.00 = $2,080.00").
- **Every line of the entry explains why** it's a debit or a credit, using the real entry's `why` notes.
- **A "Who gets what" picture** after step 1: the first pay run's $2,974.38 cost to the café ($2,873.80 wages + $100.58 employer KiwiSaver) split into Mia, Leo, IRD (tax, levy, student loan) and the KiwiSaver funds. It shows where every dollar goes.
- **A "common mistake" callout** in each step:
  - forgetting that employer KiwiSaver is *on top of* the wage;
  - treating PAYE as an expense;
  - putting Leo's 8% on his net pay instead of his gross.
- **A US note:**
  - The US withholds federal (and often state) income tax using the W-4.
  - It also deducts **FICA**: Social Security 6.2% and Medicare 1.45%, which the employer matches.
  - It files Form 941 quarterly.
  - Retirement contributions (401(k)) are voluntary for the employer. NZ's KiwiSaver employer contribution is compulsory.
  - There's no equivalent of the ACC earners' levy.

## Sources

The rates and existing law references are already checked:
- **Rates:** `PAYROLL_2026_27` and `PAYROLL_2027_28` in `lib/nz/rates.ts`.
- **`LAW.paye`:** Income Tax Act RD 3, RD 5, RD 10, RD 4; Tax Administration Act 24B, 23E.
- **`LAW.kiwisaver`:** KiwiSaver Act ss 64, 66, 101B–101D; Income Tax Act RD 67.
- **`LAW.holidays`.**

The exercise page shows those law boxes.

**Checked 28 November 2026:** IRD's [Payroll Calculations & Business Rules Specification, 1 April 2026 to 31 March 2027](https://www.ird.govt.nz/-/media/project/ir/home/documents/digital-service-providers/software-providers/payroll-calculations-business-rules-specifications/payroll-calculations-and-business-rules-specification.pdf) (v1.0, 24 March 2026). It's what payroll software must follow:
- **PAYE (M and ME)** (sections 5.2–5.3):
  - annual income = pay × 26, with the cents dropped;
  - annual tax + earners' levy − IETC, not rounded;
  - ÷ 52, truncated to cents;
  - × 52 ÷ 26, truncated to cents.
- **Student loan** (5.4): the pay period's gross, truncated to whole dollars, less the threshold, × 12%.
- **ESCT rate** (5.20–5.21): set from the employee's **previous tax year's** earnings plus employer contributions. For someone employed less than a year, it's an estimate for the year. It does **not** change from pay to pay.

## Correction needed first: the payroll engine (`lib/nz/payroll.ts`)

The engine was compared with IRD's steps on all 102 of Kōwhai's payslips (51 pay runs × 2):
1. **PAYE is 1–3 cents out on 95 of 102 payslips.** The engine divides by 26 and rounds, where IRD truncates twice (Mia's first pay: $341.19 in the books, $341.18 by IRD's method). Student loan already matches on every payslip.
2. **Leo's ESCT rate changes from pay to pay.** The engine annualises each pay, so his quiet 24-hour fortnights fall in the 10.5% band and his busy ones in 17.5%. IRD sets the rate once for the year: year 1 from an estimate of the year's pay, year 2 from year 1's actual pay.

**The fix:** follow IRD's steps in `payeForPay`, and give each employee an ESCT rate for the year (year 1 estimated from their expected pay, year 2 from year 1's actual pay).

**Effect on the books:** profit and tax are **unchanged**, because gross wages and employer KiwiSaver don't change. Only the split between net pay (bank) and deductions (215) moves, by cents. Year-end balances in 100 and 215 shift by a few dollars at most, and any test that pins those figures will be updated.

The PAYE page's calculator uses the same function, so it becomes IRD-exact too. This goes in the CHANGELOG as a correction.

**Confirmed before building** (the same specification)
1. **ESCT** (section 5.21.3): the employer contribution is worked out in dollars and cents, ESCT is that amount with the cents dropped × the rate, cut to cents, and the fund gets the contribution less the ESCT. IRD's example: $122.50 → $122 × 17.5% = $21.35, so $101.15 goes to the fund.
2. **KiwiSaver deductions**: the specification doesn't give a rounding rule, and its examples come out exact. The app rounds to the cent.
3. **The ESCT rate for Kōwhai's staff**: neither worked a full previous tax year with Kōwhai (they started in April 2026), so the rate is set from the year's *expected* pay (the rostered hours), as in IRD's examples for new and casual employees. Both come out at 17.5% in both years.

## Build

| Piece | File |
|---|---|
| The engine fix: IRD's PAYE steps, a yearly ESCT rate | `lib/nz/payroll.ts`, `data/books/year.ts`, `data/books/year2.ts` |
| PAYE as a list of named steps, so the exercise and the PAYE page can show the working | `payeSteps()` in `lib/nz/payroll.ts` |
| Pure exercise logic: the six pay runs, payslip lines with their working, marking a payslip and an entry | `lib/study/payRun.ts`, `data/study/payRun.ts` |
| The page | `app/study/pay-run/page.tsx`, `components/study/PayRun.tsx` |
| Links: the PAYE page's "Make it stick", the Drills tab, the KiwiSaver and Holidays pages | `PractiseLinks.tsx`, `Study.tsx` |
| Tests | `tests/payRunExercise.test.ts`, plus IRD's own worked examples from the specification added to `tests/payroll.test.ts` |

**Tests:**
- PAYE matches IRD's worked examples in the specification.
- For every one of the six pay runs, the right payslips and entry reproduce the books exactly.
- A learner's entry with one wrong line is marked wrong on that line only.
- Leave runs use 220/602, not 600, for the leave pay.
- Profit for both years is unchanged by the engine fix.
- Saved progress survives a reload.

## Decisions needed

1. **Which pay runs**: recommended the six above, simpler first, with the two leave runs marked harder.
2. **PAYE**: recommended IRD's steps as a guided worksheet, with a "use the PAYE tables" button for anyone who only wants the structure.
3. **The engine fix**: recommended doing it first (IRD-exact PAYE and a yearly ESCT rate). It changes no profit or tax, only cents between net pay and deductions.

## Size

About the size of the GST return exercise, plus the engine fix and its knock-on test updates. Then CHANGELOG (including the correction) and `docs/STUDY.md` (a new exercise, Y3).
