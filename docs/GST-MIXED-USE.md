# Plan: GST on mixed-use goods (apportionment)

Status: **planned** 2026-11-29. Not built yet.

## Why

"I use it partly for the business and partly privately: how much GST can I claim?" is one of the most common GST questions a small business asks. The app barely covers it. The answer depends on **who** is asking and **how much the item cost**, and since April 2023 the rules for cheaper items are different. Getting it wrong means either missing GST that could be claimed, or claiming too much and paying it back with interest.

There's a twist for Kōwhai. Because it's a **company**, most "private use" never reaches the apportionment rules:
- When Aroha or Ben (shareholder-employees) use a company asset privately, that's a **fringe benefit**. The company claims all the GST, then pays **FBT, with GST on the fringe benefit** (GST Act s 21I).
- The non-deductible half of entertainment works the same way: the GST is claimed in full and paid back as an adjustment. Kōwhai's books already do this at each year end.
- Kōwhai's only exempt income is bank interest, which is far under the de minimis (s 20(3D)). So it never has to apportion for exempt supplies.

Apportionment proper is mainly a **sole trader** question: one person, one car, some of it private. That's why the worked example uses the "what if Aroha ran Kōwhai as a sole trader?" world from the Which structure? tool.

## What the law says (GST Act 1985, read 29 November 2026 from the cached version as at 30 June 2026)

**On purchase**
- **s 20(3C):** GST can be claimed "to the extent" goods or services are used, or intended to be used, for making taxable supplies. The claim is the GST × the **intended** taxable use %.
- **ss 20(3CB)–(3CD), from 1 April 2023:** if the item costs **$10,000 or less** (excluding GST), it's all or nothing:
  - all the GST is claimed if the **principal purpose** is making taxable supplies;
  - none is claimed otherwise;
  - and there's no apportioning, now or later.
- **s 20(3D):** a business making both taxable and exempt supplies needn't apportion if its exempt supplies will be no more than the **lesser of $90,000 and 5%** of its total supplies.

**Each year after: adjustments**
- **ss 21, 21A, 21C:** at the end of each **adjustment period** the actual taxable use is worked out and compared with the intended use (first period) or the last actual use an adjustment was made for (later periods). Actual use is **cumulative**, from the purchase to the end of the period (s 21G(1)(a)).
- **s 21D:** the adjustment is the **full GST** × the percentage difference:
  - more business use than claimed: an extra deduction;
  - less: it's paid back as output tax.
- **s 21(2), when no adjustment is made:**
  - the item cost $10,000 or less (excluding GST);
  - the difference is under **10 percentage points**, unless the adjustment would be more than **$1,000**.
- **s 21G(2):** the first adjustment period ends at the first balance date after purchase, or, if the person chooses, at the first balance date at least 12 months after purchase. Each later period is 12 months.
- **s 21G(4), (8):** the number of adjustment periods:

  | Cost (excluding GST) | Adjustment periods |
  |---|---|
  | over $10,000, up to $20,000 | 2 |
  | over $20,000, up to $500,000 | 5 |
  | over $500,000, or land | 10 |

  Alternatively, the person can choose the asset's estimated useful life from IRD's depreciation determinations.
- **s 21FB:** a **permanent** change in use is a one-off adjustment: full GST × the new intended use, less what's been claimed so far.

**On sale**
- **s 21F:** selling an asset that didn't get a full GST claim: GST is charged on the whole sale price, and a final adjustment gives back **tax fraction × sale price × (1 − previous use)**, capped so the total claimed never exceeds the full GST on purchase. The tax fraction is 3/23.

**Companies and fringe benefits**
- **s 21I(1):** providing a fringe benefit under the FBT rules counts as a supply, so GST is paid on it. The company claims the full GST on the asset, and the private use is taxed through FBT instead.
- **s 21I(4):** the non-deductible part of entertainment is treated as a supply too, so the GST on it is paid back.

**US:** there's no federal GST or VAT. State sales tax is charged to the final buyer, and businesses don't claim it back (they buy stock for resale tax-free with a resale certificate). So nothing like GST apportionment exists. The nearest idea is income tax: depreciation on "listed property", like cars, depends on business use %, and some deductions need over 50% business use. Check this against IRS sources before building.

## The page

Recommended: a new **Explore tool, `/explore/gst-mixed-use`** ("GST on mixed use"), beside the GST return exercise. It has:

1. **Which rule applies?** A short guided decision, with the law for each answer:
   - Is it a company, and the private use by an employee or shareholder-employee? → FBT, with GST on the fringe benefit (s 21I). Full GST claim on the asset.
   - Are the only non-taxable uses exempt supplies, under the lesser of $90,000 and 5%? → no apportionment (s 20(3D)).
   - Does it cost $10,000 or less (excluding GST)? → principal purpose: all or nothing (s 20(3CB)–(3CD)).
   - Otherwise → apportion, then adjust each year, then the sale adjustment.
2. **The worked example: Aroha as a sole trader.** She buys a car for $28,000 + GST ($4,200) and expects 60% business use. The learner sets the business use each year, and the page shows:
   - **On purchase:** $4,200 × 60% = $2,520 claimed.
   - **Each adjustment period (5, because it cost over $20,000):** the cumulative actual use, the difference, whether the 10-point / $1,000 rule means no adjustment, and the adjustment. For example, actual use of 50% in year 1 is a 10-point difference, so $420 is paid back.
   - **On sale:** sold for, say, $15,000 including GST. GST of $1,956.52 is charged on the sale, and the final adjustment gives back 3/23 × $15,000 × (1 − 50%) = $978.26.
   - **The running total:** GST claimed less paid back, against the full $4,200.
3. **A cheaper item: the laptop test.** Aroha buys a $2,400 + GST laptop. At 70% business use, all $360 is claimed. At 40%, nothing is. There are no adjustments either way. A slider shows the cliff at 50%.
4. **Back at Kōwhai (the company):**
   - a company van Ben takes home: full GST claimed, then FBT with GST on the benefit (links to the FBT section);
   - Kōwhai's interest income: exempt, but far under the de minimis;
   - the entertainment adjustment already in its books, as the same idea in action.
5. **A US note**, as above.

**Beginner annotations:**
- A `ToolGuide`, and every figure explained.
- Common mistakes:
  - claiming the GST on the whole of a mixed-use car;
  - apportioning a $3,000 item (since 2023 it's all or nothing);
  - forgetting the adjustment years, or comparing with the original estimate when a later adjustment has been made;
  - charging GST on only the business part of the sale price;
  - a company apportioning when the private use is really a fringe benefit.
- New glossary terms, each with an example and a common mistake:
  - *apportionment (GST)*;
  - *adjustment period*;
  - *percentage intended use / actual use*;
  - *principal purpose (GST)*.

**Practice:** a "Claim how much GST?" drill. Given an item, its cost, who bought it and its business use, how much GST is claimed? Plus adjustment questions: is an adjustment needed this year, and how much is it?

## Build

| Piece | File |
|---|---|
| The rules: claim on purchase, adjustments (with s 21(2)'s exclusions), number of periods, sale adjustment, which rule applies | `lib/nz/gstMixedUse.ts` (pure) |
| Thresholds: $10,000, 10 points, $1,000, the periods table, $90,000 / 5% | `GST_APPORTIONMENT` in `lib/nz/rates.ts`, with the sections |
| The examples (Aroha's car and laptop, Kōwhai's van and interest) | `data/books/gstMixedUse.ts`, with the interest and entertainment figures from the books |
| The tool | `components/explore/GstMixedUse.tsx`, registered in `app/explore/tools.ts` and `[tool]/page.tsx` |
| Law | `TOOL_LAW["gst-mixed-use"]`: GST Act ss 20(3C), 20(3CB)–(3CD), 20(3D), 21, 21D, 21F, 21FB, 21G, 21I |
| Glossary, drill, tests | `data/glossary.ts`, `data/study/gstMixedUse.ts`, `tests/gstMixedUse.test.ts` |
| Links | from the GST topic page, the GST return exercise, the FBT section and Which structure? |

**Tests:**
- The claim on purchase is GST × intended use. Items costing $10,000 or less claim all or nothing at 50%.
- The adjustment is full GST × the difference, with no adjustment under 10 points unless it's over $1,000, and none for items costing $10,000 or less.
- Later years compare with the last adjustment made, not always the original estimate.
- The periods are 2, 5 or 10 by cost.
- The sale adjustment is 3/23 × price × (1 − previous use), and total GST claimed never exceeds the full GST.
- The decision sends a company's employee private use to FBT, and exempt supplies under the de minimis to "no apportionment".
- Kōwhai's interest income is under the de minimis, worked out from the books.

## Decisions needed

1. **Where it lives.** Recommended: an Explore tool. The alternative is a section on the GST page; lighter, but there's no room for the year-by-year adjustments.
2. **The worked example.** Recommended: Aroha as a sole trader, the same "what if" Which structure? uses, so no new character, and it shows why the business structure changes the GST answer. The alternative is a company example, which would have to be an exempt-supply case (such as owning the building and renting the flat upstairs); that's realistic, but the property rules (land, 10 periods, zero-rating) bury the basic idea.
3. **FBT depth.** Recommended: explain the company route (full claim, then GST on the fringe benefit) without calculating FBT. FBT is its own subject, and could be its own tool later.
4. **A drill.** Recommended: yes, "Claim how much GST?". Short questions, and the $10,000 / 50% cliff and the 10-point rule are easy to get wrong.

## Still to verify before building

- IRD's GST guide (IR375) and its apportionment pages: that the worked figures match IRD's own examples, especially using cumulative actual use and the first adjustment period's length.
- The US listed property rules (IRS Publication 946).
- That the $10,000 threshold in ss 20(3CB) and 21(2)(b) hasn't changed since the 30 June 2026 version (re-check with `npm run law`).

## Size

A little bigger than the tax losses tool. The rules have more branches, and the year-by-year adjustment table needs care to stay readable on a phone.
