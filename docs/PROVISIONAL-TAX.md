# Plan: "Provisional tax planner"

Status: **built** 2026-11-28 (`/explore/provisional-tax`). Planned the same day.

## The question it answers

Kōwhai's second year is its first as a compulsory provisional taxpayer. How much should it pay during the year, and when? What does each method cost if the year turns out better or worse than expected? The planner takes Kōwhai's real year 2, lets the learner choose a method, and shows the payments, the terminal tax, and any interest or penalties.

The NZ topic page `/nz/provisional-tax` already explains the methods and has a standard-method calculator. This tool goes further: it compares the methods using the café's real figures and what actually happened.

## Kōwhai's real year 2 (from the books)

| | |
|---|---|
| Last year's residual income tax (RIT, the 2027 year) | $16,742.08 |
| Method used | Standard: $16,742.08 + 5% = $17,579.18, in three instalments of $5,859.73 / $5,859.73 / $5,859.72 (28 Aug 2027, 15 Jan 2028, 7 May 2028) |
| Actual RIT for the 2028 year | $20,898.08 |
| Terminal tax | $3,318.90, due 7 April 2029 (Kōwhai has a tax agent, Rata & Co) |
| Use-of-money interest | None: RIT is under $60,000 and Kōwhai used the standard method, so interest only starts at the terminal tax date (Tax Administration Act s 120KE) |

## What the learner controls

- **Method**: standard, estimation, or AIM. The GST ratio method is shown, but it's unavailable for Kōwhai's year 2, with the reason (see below).
- **Estimate** (estimation method only): a slider for the estimated RIT, paid in thirds.
- **"What if the year went differently?"**: a slider for the actual RIT, from about $5,000 to $90,000. It shows what happens when the result moves away from the plan, including crossing the **$60,000** line where the standard method loses its interest-free treatment.
- Optional: **pay an instalment late**, to show the late payment penalty (see "to confirm").

## What it shows

1. **The payment calendar**: each instalment's date and amount, then terminal tax, on a timeline.
2. **Interest**: use-of-money interest on each shortfall, worked out daily without compounding (8.97% charged on underpaid tax, 2.25% paid on overpaid, from 16 January 2026), from each instalment date to the terminal tax date.
   - **Standard method, RIT under $60,000:** no interest until the terminal tax date (s 120KE). That's Kōwhai.
   - **Standard method, RIT $60,000 or more:** if the first two instalments were paid on time, interest only runs from the last instalment date (s 120KBB).
   - **Estimation:** interest on the gap between each instalment paid and a third of the actual RIT, from each instalment date. Overpaying earns the lower rate.
   - **AIM:** no interest if each payment is made as the software calculates it.
3. **AIM**: six payments on the GST due dates (28 Jun, 28 Aug, 28 Oct, 15 Jan, 28 Feb, 7 May), each the tax on the profit so far less what's been paid. The tool works this out from the year 2 ledger at each GST period end. It's an approximation, labelled as such: real AIM software applies the tax adjustments. The point is that payments follow the profit, and a quiet period pays nothing.
4. **The GST ratio, and why Kōwhai can't use it**: last year's RIT must be over $5,000 and no more than $150,000, and the business must have been GST-registered all year, filing two-monthly or monthly. But the business must not have begun operations in that previous year (Income Tax Act s RC 16(2)(b)). Kōwhai opened in year 1, so it can't use the ratio until year 3. The tool shows what the ratio would be (RIT ÷ taxable supplies) so the learner can see how it works.
5. **Totals per method**: total paid during the year, terminal tax, interest, and the cash flow effect (money kept in the business longer under standard).

**The lesson it should make obvious:** for a small business with RIT under $60,000, the standard method is the safe choice. Kōwhai pays a predictable amount, owes no interest even when the year beats the last, and the rest is due with terminal tax. Estimation only helps if the year is clearly worse, and costs interest if the estimate is too low. AIM suits lumpy or seasonal profit.

## Sources checked (28 November 2026)

| Fact | Source |
|---|---|
| Who pays: RIT over $5,000 | Income Tax Act s RC 3 (already in `law.ts`) |
| The methods | s RC 5; standard s RC 6; estimation "fair and reasonable", revisable on or before an instalment date, s RC 7; AIM s RC 7B (AIM-capable software) |
| Instalments | ss RC 9, RC 10 |
| GST ratio: who may use it, and how it's worked out | ss RC 16 (RIT $5,000–$150,000; registered all year; not a business that began that year; 1- or 2-monthly GST), RC 11 (ratio × taxable supplies for the period) |
| No interest until terminal tax date: standard method, RIT under $60,000 | Tax Administration Act s 120KE |
| Interest only from the last instalment: most other standard-method taxpayers | s 120KBB |
| Late payment penalty: 1% the day after, plus 4% at the end of the sixth day after that; no monthly 1% on income tax from 2017–18 | s 139B(2), (2B)(c) |
| Interest rates 8.97% / 2.25% from 16 January 2026, daily, not compounding | IRD, Interest on overpayments and underpayments (updated 8 July 2026); already `PROVISIONAL_TAX` in `rates.ts` |
| AIM: six payments on the GST dates for two-monthly filers; for turnover under $5m; no interest if paid as calculated | IRD guide IR289 (April 2025) |

**Confirmed before building** (IRD's provisional tax guide IR289, read 28 November 2026)
1. A **late instalment** under the standard method with RIT under $60,000: no interest, but "late payment penalties will still be charged on late payments". IR289's example: $7,600 due 7 May gets 1% ($76) on 8 May, then 4% of $7,676 on 15 May. So the 4% applies once a payment is more than 7 days late.
2. The **AIM turnover limit** is $5 million (IR289).
3. **AIM pays on the GST due dates** for two-monthly filers: six payments for Kōwhai.

**How the tool approximates AIM**: the profit to each GST period's end, from the year's transactions, scaled so the full year comes to the real taxable income. Real AIM software applies the tax adjustments as it goes; the tool says so.

## US differences to flag

The US equivalent is **estimated tax** (Form 1120-W for corporations), paid in four quarterly instalments. The "safe harbor" is 100% of last year's tax, or 110% for larger taxpayers. A shortfall attracts an underpayment *penalty* worked out like interest. NZ has three instalments for most March balance dates, a 5% uplift instead, and use-of-money interest.

## Build

| Piece | File |
|---|---|
| Pure calculations: instalments for each method, UOMI by day, safe harbour and concession rules, late payment penalty, GST ratio | `lib/nz/provisionalTax.ts` |
| Kōwhai's year 2 inputs and the AIM profit-to-date series, from the ledger | `data/books/provisionalTax.ts` |
| The tool: method picker, sliders, timeline, totals, the ratio explanation | `components/explore/ProvisionalTax.tsx`, `/explore/provisional-tax` |
| The law | `TOOL_LAW["provisional-tax"]` in `lib/nz/law.ts`: RC 6, RC 7, RC 7B, RC 11, RC 16, and Tax Administration Act ss 120KE, 120KBB, 139B |
| Links from `/nz/provisional-tax`, the year 2 provisional tax entries, and the compliance calendar | existing files |
| Drill: "Provisional tax" (standard amount, instalment dates, interest on a shortfall, safe harbour yes/no, can this business use the ratio?) | `data/study/provisionalTax.ts` |
| Tests | `tests/provisionalTax.test.ts` |

**Tests:**
- The standard method reproduces the books: $17,579.18 in three instalments, and $3,318.90 terminal tax.
- RIT under $60,000 on the standard method means no interest.
- At $60,000 or more, interest runs only from the last instalment.
- Interest is daily and not compounded, and matches a hand calculation.
- The estimation method's interest is zero when the estimate equals the actual RIT.
- The AIM payments add up to the tax on the year's profit (before the year-end true-up).
- The ratio method is refused for year 2, with the RC 16 reason.

## Decisions needed

1. **Interactive "what if" slider for the actual RIT**: recommended yes. It's the only way to show the $60,000 line and the cost of a low estimate.
2. **AIM from the ledger** (approximate) or described in words only: recommended from the ledger, clearly labelled.
3. **Where it lives**: recommended an Explore tool, linked from the topic page. The alternative is to grow the topic page's existing calculator.

## Size

About the size of the pay yourself tool.
