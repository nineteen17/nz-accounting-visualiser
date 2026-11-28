# Plan: "Pay yourself", salary or dividend?

Status: **built** 2026-11-28 (`/explore/pay-yourself`). Written 2026-11-28. Follows the law plan (`docs/LAW-LOOKUP.md`), whose Step 2 checked every limit this tool describes against the Acts.

## The question it answers

Aroha and Ben own Kōwhai and largely set their own pay. How should the profit reach them: as **shareholder salary**, as a **dividend**, or **kept in the company**? Each route is taxed differently, and the law limits all three. The tool lets the learner choose the mix and see the tax, what each owner keeps, and whether the company can afford it.

## Kōwhai's real year 2 (the starting point)

From `data/books/year2.ts`, the 2028 income year:

| | |
|---|---|
| Taxable income **before** shareholder salaries | $174,636 (taxable income $74,636 + salaries $100,000) |
| Shareholder salaries chosen | Aroha $65,000, Ben $35,000 |
| Company tax (28%) | $21,111 |
| Dividend paid (fully imputed) | $20,000 cash + $7,778 imputation credits, RWT $1,389 |
| Imputation credit account before the dividend | $14,823 |
| Solvency checks | Use the year-end balance sheet (31 March 2028), adjusted for the choice |

The tool opens on these choices, so the learner sees the café's actual decision first, then changes it.

## What the learner controls

- Aroha's salary and Ben's salary (sliders, $0 up to all the profit).
- The cash dividend. It's always split 60/40 by shareholding: a company can't simply pay one owner more per share (Companies Act s 53).
- Whatever isn't paid out stays in the company as retained earnings.
- Presets: **the café's actual choice**, **all salary**, **minimum salary + dividend**, **keep it in the company**, and **lowest total tax** (searched by the tool).

## What it shows

**1. The company**
- Taxable income after salaries; company tax at 28%.
- The largest fully imputed dividend the imputation credit account allows: credits × 72/28 (maximum ratio, Income Tax Act s OA 18).
- Retained earnings left.

**2. Each owner (their IR3)**
- Salary + gross dividend (cash + imputation credits) = taxable income.
- Tax at the personal rates, less the IETC if eligible, less imputation credits and dividend RWT.
- The ACC earners' levy on salary. Shareholder-employees with no PAYE are invoiced by ACC each July or August, using the IR4/IR3 figures (checked on acc.co.nz).
- Result: tax to pay or refund, personal provisional tax if their residual income tax is over $5,000 (s RC 3), and **what they keep**.

**3. All together**
- Total tax (company + both owners), and what reaches the owners' pockets. A stacked bar per preset makes the comparison visible.
- The lesson it should make obvious: imputation means profit paid out is taxed **once, at the owner's own rate**, whichever route it takes. Salary helps an owner whose rate is under 28%. For an owner on 33% or 39% (Ben, with his IT salary), a dividend gets topped up to that rate anyway. Profit **kept** in the company is taxed only at 28% for now; the top-up comes when it's paid out.

**4. Can the company afford it? (the law's limits)**
- **Solvency test** (Companies Act ss 4, 52): after the payout, assets still exceed liabilities, and the bank covers current liabilities plus the next GST, provisional tax and loan payments (taken from the cash forecast). Shown as pass or fail, with the signed certificate's wording.
- **Directors' duties** (ss 135–136): a warning when the payout leaves too little cash for those next payments.
- **Imputation credits**: a warning when the dividend can't be fully imputed.
- **Ben's salary** (Income Tax Act s GB 25): he works weekends and keeps the books, so he isn't covered by the full-time exemption. The tool compares his salary with what that work would cost to employ someone for (his hours × a market rate) and warns when it's well above. That's a teaching guide, not an IRD threshold: there isn't a number in the Act.
- **Timing** (s EA 4(3)): salary counts for the year if paid by the extended return due date.

## US differences to flag

A US **C-corporation**'s profit is taxed twice (corporate tax, then the shareholder's dividend tax), so owners lean towards salary. An **S-corporation** owner must take "reasonable compensation" as salary before distributions, which is roughly the opposite of NZ's s GB 25 (in NZ the worry is salary that's *too high*). NZ's imputation removes the double tax, so the choice is about rates and timing, not avoiding a second layer.

## Build

| Piece | File |
|---|---|
| Pure calculations: company tax, personal tax with imputation, IETC, ACC levy, RWT credits, max imputed dividend, solvency | `lib/nz/payYourself.ts` |
| Kōwhai's year 2 inputs (derived from the books, not typed) | `data/books/payYourself.ts` |
| The tool: sliders, presets, the three panels, the comparison bar, the limits | `components/explore/PayYourself.tsx` |
| Registration as an Explore tool (`/explore/pay-yourself`) | `app/explore/tools.ts`, `[tool]/page.tsx`, `Tools.tsx` |
| Links from the Shareholders page, the year 2 salary and dividend entries, and PractiseLinks | existing files |
| Drill: "salary or dividend?" questions made from random owners' rates (who should take salary, how much the top-up is, does this dividend pass the solvency test) | `data/study/payYourself.ts` |
| Tests | `tests/payYourself.test.ts` |

**Tests:** the actual choice reproduces the books exactly (company tax $21,111; dividend credits $7,778; RWT $1,389; Ben's refund as in the year 2 notes); total tax is the same for an owner on 28% whichever route; a dividend never carries more than 28/72 in credits; the "lowest tax" preset is no worse than any other preset; every warning fires at its threshold.

**Checks:** rates from `lib/nz/rates.ts` only (the guard test still applies). Year 2 is the 2028 income year, whose brackets and IETC are still marked **to confirm**, so the tool shows that note until April 2027. The ACC earners' levy for shareholder-employees is to be confirmed against ACC before building.

## Decisions (were open questions)

1. **Ben's benchmark** (decided: 14h café + 6h bookkeeping a week, at Leo's wage and an assumed $35/h). His hours aren't recorded anywhere yet. Suggested: add them to `data/business.ts` (e.g. two weekend shifts plus bookkeeping, about 20 hours a week) and price the work at the café's own wage rates plus a bookkeeping rate. Alternatively, leave the warning as a note without a number.
2. **Year** (decided: year 2). Year 2 (recommended: it has a dividend, so every route is real), or year 1 (simpler, but no dividend was paid).

## Size

About the size of the budget tool: one calculation module, one tool page, one drill, tests. Then CHANGELOG, `docs/STUDY.md` (the new drill), and the README if the tool list is there.
