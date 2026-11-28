# Plan: the year-end checklist

Status: **built** 2026-11-28, at `/explore/year-end`. Decisions taken as recommended: an Explore tool, April as Kōwhai's filing month, the books left as they are (the missing ACC levies and Companies Office fee are flagged in the checklist), and ticks saved on the device. The US note was checked against irs.gov.

## The idea

A small NZ company's year doesn't end on 31 March. That's when a run of jobs starts: counting stock, closing the books, paying what's due, preparing the accounts, filing with the Companies Office and IRD, and paying the tax. The last of it is paid more than a year later. The app teaches each piece somewhere (the cycle, the year-end exercise, the GST return, the IR4, the provisional tax planner), but nowhere puts them in order.

The checklist does that, for Kōwhai's real year 1 (31 March 2027) and year 2 (31 March 2028). Each item shows:
- **what** to do, in plain English;
- **when**: Kōwhai's actual date;
- **Kōwhai's figure**, from the books (stock counted, GST to pay, terminal tax…);
- **why** it matters, with the law behind it;
- **a "do it" link** to the tool or exercise that practises it.

The learner can tick items off, saved on the device, so it works as a real checklist.

## The items (all dates and figures for year 1; year 2 changes where marked)

**A. Before 31 March: tidy up**

| Item | Kōwhai | Law / source |
|---|---|---|
| Write off debts you won't collect, **before** balance date: only a debt written off in the year is deductible | Pop-Up Events' invoice, written off at 31 March 2027 | ITA s DB 31 |
| Check the asset register: what was bought, and what was sold or scrapped | the espresso machine and fit-out in year 1; the old POS system sold in year 2 | the depreciation pages |

**B. On 31 March: count and cut off**

| Item | Kōwhai | Law / source |
|---|---|---|
| Stocktake: count and value the stock on hand | closing stock, from the books | trading stock rules (existing `TRADING_STOCK`) |
| Cut-off: costs and income that belong to this year but aren't invoiced yet (power, wages, catering) | the accruals in the year-end entries | accrual accounting |
| Count the till and reconcile the bank at 31 March | the bank reconciliation step | – |

**C. April and May: close the books and pay what's due**

| Item | Kōwhai | Law / source |
|---|---|---|
| Make the year-end adjustments | the 13 (year 2: 11) adjustments | link: the year-end exercise |
| Pay March's PAYE and deductions by 20 April | the 215 balance | TAA s 24B (in `LAW.paye`) |
| Pay accrued holiday pay within 63 days if it's to be deducted this year | Mia takes her leave later, so it's added back for tax | ITA s EA 4 |
| File the Companies Office annual return in the company's filing month, $49.74 + GST | first one due April 2027 (none needed in 2026, the year it was registered) | Companies Act s 214; Companies Office |
| File and pay the February–March GST return by 7 May | Box 15 of period 6 | link: the GST return exercise |
| **Year 2:** the third provisional tax instalment, 7 May 2028 | $5,859.72 | link: the provisional tax planner |

**D. The accounts and the company's paperwork**

| Item | Kōwhai | Law / source |
|---|---|---|
| Prepare financial statements meeting IRD's minimum requirements: a balance sheet and P&L on the accrual basis, accounting policies, saying whether figures include GST, **last year's comparatives**, interest gross of RWT, a **reconciliation to taxable income**, and a **tax fixed asset schedule** | year 1 has no comparatives (its first year); year 2 does | Tax Administration (Financial Statements) Order 2014, cl 8 and the Schedule; TAA s 21B |
| The directors approve the accounts, the shareholder salaries and any dividend (with the solvency test), by written resolution | Aroha and Ben sign one resolution | Companies Act ss 122, 4 |
| An annual meeting isn't needed if the board resolves there's nothing to do at one, but the first must otherwise be held within 18 months of registration | – | Companies Act s 120 |
| No annual report is needed: Kōwhai isn't large and has fewer than 10 shareholders | – | Companies Act s 208 |
| Check the imputation credit account is in credit at 31 March (a debit balance means further tax and a penalty) | $3,103.56 CR (year 2: $7,045.24 CR) | ITA OB 1; IR4 Questions 44 and 45 |
| Check the shareholders' current accounts: an overdrawn one can mean interest or FBT | both in credit | ITA s CX 10 (in `LAW.shareholders`) |

**E. Tax returns and payments**

| Item | Kōwhai | Law / source |
|---|---|---|
| File the IR4, with the annual imputation return, by 31 March 2028 (with a tax agent) | taxable income $60,163.26 | link: the IR4 exercise |
| Aroha's and Ben's own IR3s, including their shareholder salaries (no PAYE was taken off), by the same date | from the pay yourself engine | link: pay yourself |
| Pay terminal tax by 7 April 2028 | $13,742.08 (year 2: $3,318.90 by 7 April 2029) | link: the IR4 exercise |
| Next year's provisional tax: 28 August, 15 January, 7 May | $5,859.73, $5,859.73, $5,859.72 (from year 2) | link: the provisional tax planner |
| ACC: the employer levy invoice arrives around July (last year's final levy plus this year's estimate); the shareholder-employees' levies come after their IR3s, around September | – | ACC |

**F. Keep**

| Item | Kōwhai | Law / source |
|---|---|---|
| Keep every record for 7 years | year 1's records until 31 March 2034 | TAA s 22; GST Act s 75 |

The year 2 checklist is the same shape. Its differences: comparatives, the reversing entries on 1 April, the 7 May instalment, and the dividend, which needs its solvency test and an imputation debit.

## The page

An **Explore tool**, `/explore/year-end`, beside the provisional tax planner:
- **Year 1 / year 2** toggle.
- **Two views**: "By job" (the sections above) and "By date" (a timeline from 31 March to the following April's terminal tax, with today's date marked).
- Each item is a card with a tick box. It opens to show the why, the law and the "do it" link.
- Progress per year is saved on the device (`year-end-checklist-v1`), with a "clear my ticks" button.

**Corrections to existing pages, made in the same build:**
- **The post-closing step's "after balance date" list** (`components/cycle/steps/End.tsx`):
  - It gives the Companies Office annual return as 31 May 2027, "in the company's registration month". Kōwhai registered on 1 April 2026, and the Companies Office assigns a filing month at registration. So it becomes April 2027 (see decision 2).
  - It has ACC invoicing on 1 September. Employers' invoices come around July; shareholder-employees' around September.
  - The list will link to the checklist.
- **The compliance page's calendar** (`components/nz/Tax.tsx`):
  - It says "registration anniversary month". That becomes "the filing month the Companies Office assigns".
  - ACC "around Aug–Sept" gets the same July / September split.

## Beginner annotations (required for every tool)

- **A `ToolGuide`:**
  - **what it shows:** why the year doesn't end on 31 March;
  - **how to use it:** pick a year, work down the list, open an item, tick it off;
  - **reading the results:** what the dates and figures are, and what the links lead to;
  - **words you'll meet:** balance date, stocktake, cut-off, accrual, special-purpose financial statements, annual return, written resolution, solvency test, imputation credit account, terminal tax, tax agent.
- **Every item** has a one-line plain-English "why", not just the law.
- **A "common mistake"** in each section, for example:
  - writing off a bad debt in April;
  - confusing the Companies Office annual return with the tax return;
  - thinking a small company must have its accounts audited, or file them publicly.
- **A US note:**
  - A US C corporation files Form 1120 by the 15th day of the 4th month after year end, with a 6-month extension available.
  - Most states want an annual report.
  - W-2s and 1099s go out each January.
  - (To be checked against IRS sources before building.)

## Law

New references, read on legislation.govt.nz on 28 November 2026:
- **Tax Administration (Financial Statements) Order 2014 (LI 2014/69):**
  - cl 5: small companies (income and expenditure each $30,000 or less, not in a group) are exempt;
  - cl 8: the minimum requirements;
  - the Schedule: the reconciliation to taxable income and the tax fixed asset schedule.
- **Companies Act 1993:**
  - s 120: the annual meeting (6 months after balance date, 15 months after the last one; the first within 18 months of registration; not needed if the board resolves there's nothing to do);
  - s 122: a written resolution instead of a meeting;
  - s 208: an annual report only for large companies, companies with 10 or more shareholders, and those that opt in.
- **Income Tax Act s DB 31:** a bad debt is deductible only if written off as bad in the income year.

Already in `law.ts`, all checked:
- Companies Act s 214, TAA s 21B, TAA s 22, GST s 75, Companies Act s 194;
- ITA EA 4 and OB 1, and TAA s 37.

**Support for an Order in Council:** `law.ts` only handles Acts. It needs a `kind: "regulation"` in `ACTS` with the regulation's own address, and "cl 8" instead of "s 8". `scripts/law-check.mjs` needs to fetch regulations as well as Acts.

**Other sources:**
- **Companies Office:** [completing an annual return](https://companies-register.companiesoffice.govt.nz/help-centre/company-annual-returns/completing-an-annual-return/) (the first return is due in the calendar year after incorporation; the filing month is assigned at incorporation) and [fees](https://companies-register.companiesoffice.govt.nz/fees/) ($49.74 + GST, $57.20 in all, from 1 July 2022). The fee goes in `rates.ts`.
- **ACC:** invoice timing, to re-check on acc.co.nz before building.

## Build

| Piece | File |
|---|---|
| The checklist items for each year, with dates and figures from the books | `data/books/yearEndChecklist.ts` |
| Pure logic: items by section and by date, progress | `lib/yearEndChecklist.ts` |
| The tool | `components/explore/YearEnd.tsx`; registered in `app/explore/tools.ts`, the Explore page's `TOOLS` and `TOOL_LAW` |
| Regulation support in the law references | `lib/nz/law.ts`, `scripts/law-check.mjs`, `components/nz/LawBox.tsx` |
| Corrections | `components/cycle/steps/End.tsx`, `components/nz/Tax.tsx` |
| Tests | `tests/yearEndChecklist.test.ts` |

**Tests:**
- Every item's figure matches the books: closing stock, the GST return, PAYE, terminal tax, the instalments, the ICA balance.
- Dates are in order and inside the right window: from before 31 March to the next April's terminal tax.
- Every "do it" link goes to a real page.
- Every item has a plain-English "why".
- Ticks survive a reload.

## Decisions needed

1. **Where it lives.** Recommended: an Explore tool (`/explore/year-end`). The alternative is a page of its own under On the job.
2. **Kōwhai's Companies Office filing month.** Recommended: **April**. Kōwhai was registered on 1 April 2026; the Companies Office assigns the month at registration, and often uses the registration month. That makes the first annual return April 2027. This also fixes the post-closing list's "31 May".
3. **Gaps in the books.** Kōwhai's books have **no ACC levies** and **no Companies Office fee**. A real café pays both. Adding them would move every profit and tax figure in year 2 and every test that checks one. Recommended: leave the books alone in this build. The checklist says plainly that these aren't in Kōwhai's books, and why. Adding them becomes a separate proposed change, done carefully on its own.
4. **Ticks saved on the device.** Recommended: yes, like the exercises' progress.

## Size

A bit smaller than the IR4 exercise, plus the regulation support for the law box and the two corrections. Then the CHANGELOG.
