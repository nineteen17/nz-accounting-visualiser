# Plan: tax losses, and what happens when the owners change

Status: **planned** 2026-11-29. Not built yet.

## Why

Kōwhai has made a profit in both its years, so the app never shows a company with a **tax loss**: what happens to it, how long it lasts, and what can wipe it out. That gap matters for small companies. Many make losses in their first years, and the continuity rules often catch them when an owner sells out.

Kōwhai's own shareholdings make the lesson. Aroha owns 60% and Ben 40%, and the two continuity rules give different answers:
- **Ben sells his 40%:** Aroha's 60% has stayed the same, which is more than the 49% the loss rule needs, so **the loss survives**. But 60% is less than the 66% the imputation credit rule needs, so **the imputation credits are lost**.
- **Aroha sells her 60%:** Ben's 40% is below 49%, so the shareholding test is breached. The loss survives only if the **business continuity test** is met: the café carries on, without a major change in what it does.

## What the law says (Income Tax Act 2007, read 29 November 2026 from the cached version as at 4 September 2026)

**How a loss arises and is used**
- **s BC 4:** if a company's deductions are more than its income, it has a **net loss**, not negative taxable income. It pays no income tax that year.
- **s IA 2:** the net loss is part of the company's **tax loss** for the year, together with any loss balance carried forward.
- **s IA 3(4):** a tax loss that's left after the uses in s IA 3 is **carried forward** to the next tax year as a loss balance. There's no time limit.
- **s IA 4(1):** a loss balance carried forward **must** first be subtracted from the next year's net income, as far as it goes. The company can't choose to save it for later. Anything left carries forward again.
- **s IA 3(2) and subpart IC:** a company can pass a tax loss to another company in the same group (66% common ownership). Kōwhai has no group, so this only gets a mention.
- **s IZ 8:** a loss carry-back was allowed only for the 2019–20 and 2020–21 years (a COVID measure). It's history, not a current option: losses only go forward.

**What can wipe a loss out**
- **s IA 5 (shareholder continuity):** a loss is carried forward only if a group of people holds at least **49%** of the voting interests (and market value interests, if a market value circumstance exists) for the whole **continuity period**, from the start of the year of the loss to the end of the year it's used. Each person counts at their **lowest** holding during the period.
- **ss IB 3 and IB 4 (business continuity):** since the 2020–21 income year, a loss from 2013–14 or later survives a continuity breach if the company:
  - doesn't stop its business activities; and
  - makes no **major change in the nature of the business activities** during the business continuity period.
  - The period runs from just before the breach until the loss is used, or for at most 5 years for most companies.
  - Whether the assets have stayed the same or similar must be taken into account (s IB 3(4)). Some changes are permitted (s IB 3(5)).
- **Part-year rules, ss IP 3 and IP 3B:** with a breach partway through a year, the profit from before the breach can still use the loss, if the company provides part-year financial statements.

**Imputation credits: a different test**
- **s OA 8(2):** a credit in the **imputation credit account** carries forward only while **66%** continuity of shareholding is kept.
- **s OB 41:** when continuity is lost, the company has an imputation debit for the unused credits. They're gone. Kōwhai's closing balance at 31 March 2028 is $7,045.24.

**US:**
- Net operating losses (NOLs) from 2018 on carry forward **indefinitely**, but can only cover **80%** of a year's taxable income. Carry-back is generally not allowed, apart from some farming losses.
- **§ 382** limits a loss after an "ownership change" (more than 50 percentage points over 3 years) to an annual amount, instead of the NZ all-or-nothing test.
- The US has no imputation credits, so there's no equivalent of the 66% rule.
- These need checking against IRS sources before building.

## The scenario

Kōwhai's real books stay profitable. The tool is a "what if" built on year 2's figures, the way Pay yourself and Which structure? work:

**Year 3 (2028–29): a bad year.** The council closes Kōwhai's street for roadworks for some months. Sales fall, costs mostly don't, and the company makes a **net loss**. The default is about $20,000, worked out from year 2's books with sales cut for the months affected. The learner can change it.
- No income tax for year 3. Its residual income tax is nil, so under the standard method **year 4 has no provisional tax**, and year 4's tax all falls due as terminal tax.
- The loss is carried forward.

**Year 4 (2029–30): recovery.** Profit returns. The loss balance is subtracted first (s IA 4), so taxable income is lower. If the profit doesn't use it all up, the rest carries on to year 5.

**The owners change (the learner chooses), sometime in year 4:**
1. **Nobody sells:** the loss is used in full.
2. **Ben sells his 40%:** Aroha's 60% has continued, which passes 49%, so the loss is used. 60% is under 66%, so the ICA credits are debited away (s OB 41).
3. **Aroha sells her 60%:** the shareholding test fails. The business continuity test then decides:
   - the new owner keeps the café running as a café: **the loss survives**;
   - the new owner turns it into a bar, sells the coffee equipment and refits it: a **major change**, so **the loss is lost**.
4. **Both sell:** the same as 3.

For each choice the page shows:
- whether the loss carries forward;
- the tax with and without it, and the tax the loss saves (the loss × 28%);
- what happens to the imputation credits;
- the law, in plain English.

## The page

Recommended: a new **Explore tool, `/explore/tax-losses`** ("Tax losses"), beside the deferred tax and provisional tax tools. It has:
1. **A bad year:** year 3's profit and loss with the roadworks, and how a net loss arises (s BC 4). There's a slider for how many months the street is closed.
2. **Carrying it forward:** a year-by-year table (years 3 to 5) of net income, the loss used and the loss balance. It shows that the loss must be used first and can't be saved (s IA 4), and the tax saved.
3. **What happens to provisional tax:** a nil RIT means no instalments for year 4 and a bigger terminal tax. This links to the provisional tax planner.
4. **Change the owners:** pick who sells and what the new owner does. Then two checks run side by side: the 49% loss test (with the business continuity test as a fallback) and the 66% imputation credit test, each passing or failing with the reason.
5. **A link to deferred tax:** under NZ IAS 12 a loss can be a deferred tax asset, if future profit is probable. Under Kōwhai's taxes payable method it isn't recorded at all (CA ANZ's framework says so), though it must be disclosed.
6. **A US note:** NOLs (indefinite, the 80% limit, no carry-back) and the § 382 ownership change, against NZ's all-or-nothing 49% test with the business continuity rescue.

**Beginner annotations:**
- A `ToolGuide`, and every figure explained.
- Common mistakes:
  - thinking a loss means a tax refund;
  - thinking you can choose when to use a loss;
  - thinking the 49% and 66% tests are the same test;
  - thinking any sale breaks continuity (it's the 49% that must stay the same);
  - thinking the business continuity test always saves the loss.
- New glossary terms, each with a Kōwhai example and a common mistake:
  - *net loss*;
  - *tax loss / loss balance*;
  - *shareholder continuity* (49% for losses, 66% for imputation credits);
  - *business continuity test*;
  - *net operating loss (US)*, as a US reference term.

**Practice:** a "Does the loss survive?" drill. It gives an ownership change (who held what, who sold) and what the business did afterwards, then asks whether the loss carries forward and whether the imputation credits survive. Also a number question: how much of a loss balance a year's net income uses, and what's left.

## Build

| Piece | File |
|---|---|
| Losses carried forward, the continuity tests, and the ICA test (pure) | `lib/nz/taxLosses.ts` |
| The year 3–5 scenario, from year 2's books | `data/books/taxLosses.ts` |
| The tool | `components/explore/TaxLosses.tsx`, registered in `app/explore/tools.ts` and `[tool]/page.tsx` |
| Law | `TOOL_LAW["tax-losses"]`: ITA BC 4, IA 2, IA 3, IA 4, IA 5, IB 3, IB 4, IP 3B, OA 8, OB 41 (all in the cached Act) |
| Thresholds | `LOSS_CONTINUITY = { losses: 0.49, imputation: 0.66 }` in `rates.ts`, with the sections |
| Glossary, drill, tests | `data/glossary.ts`, `data/study/taxLosses.ts`, `tests/taxLosses.test.ts` |
| Links | from the income tax page, the deferred tax tool and the provisional tax planner |

**Tests:**
- A loss is used before anything else, and only as far as net income goes.
- What's left carries forward, with no time limit.
- The tax saved is the loss used × 28%.
- Continuity is the lowest holding over the period: Ben selling leaves 60% (losses pass, ICA fails); Aroha selling leaves 40% (losses fail unless the business continues).
- 49% exactly passes; 48.9% fails.
- A nil RIT gives no standard-method instalments.
- The ICA debit equals the balance at the time of the breach.

## Decisions needed

1. **Where it lives.** Recommended: an Explore tool with a "what if" scenario, like Pay yourself and Which structure?. Kōwhai's real books stay profitable, so nothing already built changes. The alternative, a real year 3 in the books, is far bigger, and it's the "Year 3" idea, which is a separate decision.
2. **The cause of the loss.** Recommended: roadworks closing the street, with a slider for the months. It's a believable café loss that doesn't come from a mistake, and the learner can make it big enough that it isn't used up in one year.
3. **How deep the ownership rules go.** Recommended: voting interests only, with direct shareholders and a sale at a single date. Market value interests, the look-through rules for corporate shareholders, and part-year statements (s IP 3B) are named, not modelled.
4. **A drill.** Recommended: yes, "Does the loss survive?". The 49% / 66% split and the business continuity test are what accountants actually get asked about.

## Still to verify before building

- IRD's guidance on the business continuity test: what counts as a "major change", with its examples, so the bar scenario is a fair one.
- The US figures (the 80% limit, indefinite carry-forward, § 382), against IRS sources.
- That the CA ANZ framework says unused losses must be disclosed under the taxes payable method (it was in the framework text found for the deferred tax plan; confirm against the current version).

## Size

About the size of the deferred tax tool. The maths is small; most of the work is the ownership-change part and its explanations.
