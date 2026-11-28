# Plan: deferred tax, and why Kōwhai doesn't record it

Status: **built** 2026-11-29, with the recommended decisions. Checked while building: Financial Reporting Act 2013 s 45 (version as at 2 November 2026) has the $66 million assets / $33 million revenue tests, and Companies Act ss 200–201 are what make a large company prepare GAAP statements. The Financial Statements Order's Schedule asks for a reconciliation to taxable income and doesn't mention deferred tax. Year 2: a net deferred tax liability of $387.70, down $601.70, so the year 2 expense under the deferred tax method is $20,296.38 (28.1%) against the books' $20,898.08 (29.0%). The US tax-basis point is from secondary sources (the AICPA's FRF for SMEs allows the taxes payable method).

## Why

Kōwhai's tax expense is simply the tax it owes for the year: the **taxes payable method**. That's what most small NZ companies do, and it's correct for them. A learner coming from US GAAP, though, expects **deferred tax**, and will see that Kōwhai's tax expense isn't 28% of its profit:
- in year 1, $16,845.64 on a profit of $63,331.33, or 26.6%.

The gap isn't an error. It comes from three timing differences between the accounts and the tax return, all already in Kōwhai's books:
- **depreciation and Investment Boost**: tax deducts the cost faster;
- **holiday pay** (s EA 4): the accounts deduct it now, tax when it's paid;
- **ACC levies** (s EF 3): the accounts deduct them now, tax when they're invoiced.

There's also one permanent difference: the non-deductible half of entertainment.

This explainer shows what those differences are, what deferred tax would do with them, and why Kōwhai doesn't have to.

## What the rules say (to check against the sources before building)

- **Kōwhai isn't required to follow NZ GAAP.** Under the Financial Reporting Act 2013, s 45, a for-profit company has to prepare general purpose financial statements only if it's "large". That means over about $33 million of revenue or $66 million of assets in each of the two previous years, with the thresholds measured under XRB A2. Kōwhai's accounts are **special-purpose**, for IRD, meeting the Tax Administration (Financial Statements) Order 2014 (already in the law references).
- **Most small NZ companies use the taxes payable method.** CA ANZ's *Special Purpose Financial Reporting Framework for use by For-Profit Entities* uses it by default: tax expense equals tax payable. Its sample notes allow the deferred tax method under NZ IAS 12 as an option.
- **NZ IAS 12** is required for general purpose statements (NZ IFRS and NZ IFRS RDR). It uses the balance sheet approach:
  - a temporary difference = an asset's or liability's carrying amount less its tax base;
  - taxable differences give a deferred tax liability;
  - deductible differences give a deferred tax asset, if future taxable profit is probable.
- **US:** US GAAP (ASC 740) always requires deferred tax, with the same balance sheet approach. A private company can choose a tax basis of accounting instead, and then there's no deferred tax. To be checked against primary sources (AICPA / FASB) before building.

## Kōwhai's figures (from the books today)

**31 March 2027**

| | Carrying amount | Tax base | Temporary difference | Deferred tax at 28% |
|---|---|---|---|---|
| Fixed assets | $42,920.00 | $34,336.00 | $8,584.00 taxable | $2,403.52 liability |
| Holiday pay accrued | ($4,266.97) | nil | $4,266.97 deductible | $1,194.75 asset |
| ACC levies accrued | ($783.46) | nil | $783.46 deductible | $219.37 asset |
| **Net** | | | | **$989.40 liability** |

**The tax expense under each method (year 1)**

| | Taxes payable (Kōwhai's) | Deferred tax method |
|---|---|---|
| Current tax | $16,845.64 | $16,845.64 |
| Deferred tax | – | $989.40 |
| **Tax expense** | **$16,845.64** | **$17,835.04** |
| As a share of profit before tax | 26.6% | 28.2% |

The deferred tax method lands at 28% of profit plus the entertainment add-back ($17,835.11). It's 7 cents out because IRD taxes whole dollars. That's the lesson: deferred tax makes the expense match the profit, and only the permanent differences remain.

**Year 2** is worked out in the build from the asset register. It also shows the **movement**:
- the year 1 holiday pay and staff ACC differences reverse;
- new year 2 differences appear;
- the asset difference changes with the sale of the old POS system.

## The page

Recommended: a new **Explore tool, `/explore/deferred-tax`** ("Tax: accounts vs return"), beside the provisional tax planner. It has:
1. **The gap:** for each year, profit before tax × 28% next to the actual tax expense, and the question "why isn't it 28%?".
2. **Sort the differences:** each item from the tax reconciliation is tagged **temporary** (it reverses later) or **permanent** (it never does), with Kōwhai's figures and the law behind each one.
3. **The balance sheet view:** the carrying amount, tax base and difference table above, with what each difference does in future years.
4. **Two methods, side by side:** a toggle shows the tax expense, the effective rate and the balance sheet under the taxes payable method (Kōwhai's real books) and the deferred tax method (what NZ IAS 12 would add), for both years, with the journal entry deferred tax would need (Dr tax expense, Cr deferred tax liability).
5. **Why Kōwhai doesn't:** s 45 "large", special-purpose accounts, IRD's Order, and the CA ANZ framework, in plain English.
6. **A US note**, prominent: ASC 740 requires deferred tax under GAAP; the tax-basis alternative.

The books don't change: Kōwhai keeps the taxes payable method. The deferred tax figures are worked out beside them, as a "what if", in pure functions.

**Beginner annotations:**
- A `ToolGuide`.
- Every figure explained.
- A "common mistake" for each part:
  - calling the gap an error;
  - treating entertainment as a timing difference;
  - thinking a deferred tax liability is tax owed now.
- New glossary terms, each with a Kōwhai example and a common mistake:
  - *deferred tax*;
  - *temporary difference*;
  - *permanent difference*;
  - *tax base*;
  - *taxes payable method*;
  - *effective tax rate*.

**Practice** (optional, decision 3): a "temporary or permanent?" drill, using the items from both years' tax reconciliations.

## Build

| Piece | File |
|---|---|
| Temporary differences, deferred tax and both methods, for each year, from the books | `lib/nz/deferredTax.ts` (pure) and `data/books/deferredTax.ts` |
| The year 2 asset register's closing book and tax values | export from `data/books/year2.ts` |
| The tool | `components/explore/DeferredTax.tsx`, registered in `app/explore/tools.ts` and `[tool]/page.tsx` |
| Standards references | `TOOL_LAW["deferred-tax"]`: Financial Reporting Act 2013 s 45 (a new Act in `ACTS`), and the Order 2014 cl 8 |
| Glossary, drill, tests | `data/glossary.ts`, `data/study/drills.ts` (if decision 3), `tests/deferredTax.test.ts` |

NZ IAS 12 and the CA ANZ framework aren't legislation, so they're cited as linked sources in the page, not in the law box.

**Tests:**
- Year 1's net deferred tax is $989.40.
- Under the deferred tax method, tax expense equals 28% × (profit + permanent differences), to within IRD's whole-dollar rounding.
- The temporary differences, added up, reconcile to the tax reconciliation's timing items.
- Year 2's movement equals closing less opening.
- Every reconciliation item is classified.

## Decisions needed

1. **Where it lives.** Recommended: an Explore tool. The alternative is a section on the income tax page; that's lighter, but there's no room there for the side-by-side and the sorting.
2. **The books.** Recommended: Kōwhai stays on the taxes payable method, and deferred tax is shown as a "what if" beside it. That's what a real café its size does. Recording deferred tax would change every year's statements for a lesson most NZ small businesses never need.
3. **A drill.** Recommended: yes, "temporary or permanent?". It's short, and it's the one skill that carries over to both NZ and US work.
4. **Year 2 detail.** Recommended: show both years, with year 2's movement. That's where reversal makes sense: last year's holiday pay difference disappears as Mia takes her leave.

## Size

About the size of the provisional tax planner. Most of it is the page and its explanations; the maths is small.
