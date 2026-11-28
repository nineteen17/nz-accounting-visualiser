# Changelog

A record of what's in the Kōwhai Café accounting learning tool and what has changed. Newest first.
Dates are when the change was made. Rates and rules are for the 2026–27 NZ income year unless stated.

---

## Proposed / not yet done

- **Tax losses**: planned in `docs/TAX-LOSSES.md`. An Explore tool with a "what if" year 3 (roadworks close the street, so Kōwhai makes a net loss): carrying the loss forward (it must be used first, with no time limit), what it does to provisional tax, and what an owner selling out does. Ben selling his 40% keeps the loss (Aroha's 60% passes the 49% test) but loses the imputation credits (under 66%). Aroha selling her 60% breaks the 49% test, so the business continuity test decides. With a US note (NOLs, § 382).

- **IR4 2027 form (around March 2027)**: when IRD publishes it, re-check `ir4Boxes()` in `lib/engine/ir4.ts` against it (box numbers and wording), and update `IR4_SOURCE` to the new form and guide.

- **2027–28 rates (on or after 1 April 2027)**. Follow README "Updating the rates" (`npm run rates` lists what to check). In short: when IRD, ACC and MBIE announce them, fill in `PAYROLL_2027_28` in `lib/nz/rates.ts` and clear its `toConfirm` list (tax brackets, IETC, student loan threshold and ESCT bands are carried forward for now); update `MINIMUM_WAGE`; then on 1 April 2027 point `CURRENT_PAYROLL` at 2027–28. Year 1's books keep the 2026–27 rates. Also update `ACC_CAFE_LEVIES` (the café work levy and working safer levy) from ACC's 2027/28 Levy Guidebook and clear its `toConfirm`.

---

## 2026-11-29

### Tax: accounts vs return (deferred tax)

A new Explore tool, `/explore/deferred-tax`, answers "why isn't Kōwhai's tax 28% of its profit?". Plan: `docs/DEFERRED-TAX.md`.
- **The gap:** year 1's tax expense is $16,845.64, 26.6% of profit; year 2's is $20,898.08, 29.0%.
- **Sort the differences:** each line of both years' tax reconciliations, tagged temporary (depreciation, Investment Boost, holiday pay, ACC levies, the gain on sale and depreciation recovery) or permanent (half of entertainment), with why.
- **The balance sheet view:** each asset and accrual in the accounts against its tax base. Year 1: a net deferred tax liability of $989.40 ($2,403.52 on the assets, less $1,194.75 on holiday pay and $219.37 on ACC levies). Year 2: $387.70.
- **Two methods side by side:** Kōwhai's taxes payable method against NZ IAS 12's deferred tax method ($17,835.04, 28.2%, in year 1), with the entry deferred tax would add. Kōwhai's books don't change.
- **Why Kōwhai doesn't:** only "large" companies (Financial Reporting Act 2013 s 45: over $66 million of assets or $33 million of revenue) must follow NZ GAAP (Companies Act ss 200–201); the rest prepare accounts for IRD, and CA ANZ's framework defaults to the taxes payable method. US note: ASC 740 requires deferred tax under US GAAP.
- A "Deferred tax: temporary or permanent?" drill; six glossary terms; the Financial Reporting Act added to the law references (120 sections checked); `LARGE_COMPANY` in `rates.ts`. Year 2's closing asset values are exported from the books.
- Tests: 11 new (294 in all).

### ACC levies and the Companies Office fee in the books

Kōwhai's books now have the ACC levies and the Companies Office fee a real café pays, done the way ACC actually invoices a new company. Plan: `docs/ACC-LEVIES-IN-THE-BOOKS.md`.
- **Year 1:** no invoice (a new business is first invoiced after its first year), so a new year-end adjustment (`ADJ-ACC`) accrues the 2026/27 work and working safer levies: $351.46 on the staff's earnings and $432.00 on the shareholder salaries, $783.46 in all, to a new account **606 ACC levies**. Under Income Tax Act s EF 3 a levy is deductible when it's due and payable, so the whole accrual is added back: year 1's taxable income, tax and terminal tax ($13,742.08) don't change, nor do year 2's provisional instalments. Profit before tax is now $63,331.33.
- **Year 2:** the first annual return on 14 April 2027 ($57.20, GST claimed). ACC's first invoice on 16 July 2027 (final 2026/27 levy $351.46, clearing the accrual, plus a provisional 2027/28 levy of $358.78, plus GST), paid 20 August. At year end (`Y2-ADJ-ACC`) the staff wash-up and the shareholders' 2027/28 levy are accrued ($518.13). The tax reconciliation gains an add-back and a deduction, like holiday pay. Year 2's taxable income is now $74,636.41, tax $20,898.08 and terminal tax $3,318.90.
- **Aroha's and Ben's own earners' levy** is never a company expense (Accident Compensation Act s 219): it'll be charged to their current accounts when ACC invoices it, after the IR4.
- **Rates:** the 2027/28 café work levy, $0.41 per $100, from the Accident Compensation (Work Account Levies) Regulations 2025, schedule 3. Pay yourself and Which structure? now use the levy rates for the year they model.
- **Pages:** the ACC page's work levy section is rewritten (it wrongly said a first invoice is usually provisional) with Kōwhai's own timeline and the s EF 3 rule. The year-end checklist's "not in Kōwhai's books" notes are replaced by the real figures. The budget has an ACC line; the licences variance mentions the annual return. Glossary: *ACC work levy* expanded; new *provisional and final levies* and *liable earnings*. Law: ACC Act s 15 and Income Tax Act s EF 3.
- **Exercises:** the year-end exercise has one more adjustment in each year; the IR4 exercise has the new tax items, with neutral titles.
- Tests: 7 new (282 in all). Figures quoted in the docs updated.

## 2026-11-28

### Year-end checklist

- **New Explore tool, `/explore/year-end`**: every job from just before 31 March to the next April's terminal tax, for both of Kōwhai's year ends (23 items in year 1, 24 in year 2). Each item has its due date, Kōwhai's own figure from the books (closing stock, March PAYE, the GST return, terminal tax, next year's instalments, the ICA balance…), a plain-English why, the law, and a link to the tool or exercise that practises it. View it by job or as a timeline (with today marked). Ticks are saved on this device (`year-end-checklist-v1`). It has a ToolGuide, a common mistake for each stage, a note on what a small company doesn't need (no audit, no public accounts, no annual report), and a US note checked against irs.gov (Form 1120 and Form 7004; W-2s and 1099-NECs by 31 January).
- **Law**: the law box and `npm run law` now handle secondary legislation. The Tax Administration (Financial Statements) Order 2014 is added (cl 5, cl 8 and the Schedule), with Companies Act ss 120, 122 and 208 and Income Tax Act s DB 31. All 115 sections checked unchanged.
- **Rates**: the Companies Office annual return fee ($49.74 + GST) is in `rates.ts`, with its source.
- **Corrections**: the post-closing step had Kōwhai's first annual return on 31 May 2027. It's now April 2027, the filing month the Companies Office assigns (Kōwhai registered 1 April 2026). It also had ACC invoicing on 1 September; employers' invoices come around July and shareholder-employees' around September. The compliance calendar is fixed to match, and the post-closing list links to the checklist.
- Tests: 8 new (275 in all): the figures match the books, dates fall in the right window, every link is a real page, every item explains itself, and ticks survive a reload.

### Do the company tax return yourself (IR4)
- New exercise at `/study/ir4`: Kōwhai's real IR4 for both years. It's built from IRD's IR4 2026 form and its guide, with the years moved on, because the 2027 form isn't out yet.
  1. **Profit to taxable income.** Sort the year's items: add back, deduct, or no adjustment. The real adjustments are things like entertainment, holiday pay and the depreciation swap. The distractors are items from the same year that need none, such as shareholder salaries, the bad debt, loan principal, the dividend and the income tax expense. Then work out taxable income.
  2. **Fill in the IR4.** Every box Kōwhai uses, with IRD's wording and a plain-English line: the interest and RWT (13A and 13B), net business profit (20B), taxable income, the tax calculation down to terminal tax (30A to 30L), next year's provisional tax (33B), the shareholders' salaries and current accounts (40B and 40E), and the annual imputation return (41 to 44). The questions that don't apply to Kōwhai are shown already answered. Each box is marked against your own earlier boxes.
  3. **Dates.** When the return is due (with a tax agent), when terminal tax is due, and what the residual income tax means for provisional tax. Then your return beside Kōwhai's.
- It opens with the "New here?" guide, and has "common mistake" callouts (accounting profit in 20B, the interest counted twice, the May instalment in 30K, which tax year the imputation return covers) and a US note on Form 1120.
- Linked from the drills tab, the income tax, provisional tax and shareholders pages, and the end of the year-end exercise ("Next: file the tax return on this profit").
- New glossary terms: **tax adjustment**, **annual imputation return** and **tax agent**.
- **Corrected** the glossary's "IR4" entry. It said the return includes the IR10; in fact the IR10 *or* the financial statements go with it. Its example had Kōwhai filing in July 2027; with a tax agent its 2027 return is due by 31 March 2028.
- Law: Tax Administration Act s 33 (returns of income), and Income Tax Act ss OB 4, OB 8 and OB 30 (what goes in and out of the imputation credit account). All checked on legislation.govt.nz.
- The glossary test now counts the study exercises as real pages.

### Beginner guides on the pay run and year-end exercises
- "Do a pay run yourself" and the year-end exercise now open with the "New here? How to use this" guide, like every Explore tool and the GST return exercise.
  - The pay run guide covers what a pay run is, the three steps, why each line is marked against your own figures, and why IRD's dropped cents can leave a figure a cent below rounding. Its words include PAYE, the ACC earners' levy, the IETC, the student loan, KiwiSaver, ESCT, holiday pay, take-home pay and payday filing.
  - The year-end guide covers why adjustments are needed, how the exercise flows, and how to read your own trial balance and the profit effect of each entry. Its words include accruals, prepayments, depreciation, the stocktake, bad debts and the holiday pay accrual.

### Beginner guides on every Explore tool
- The nine older Explore tools (journal, ledger, trial balance, statements, ratios, loan, cash flow forecast, budget vs actual, break-even) now open with the same "New here? How to use this" guide. Each explains what the tool shows, how to use its controls, and how to read its table: for example, a minus sign in the ledger means a credit balance, and a matching trial balance doesn't prove every entry is right. Each guide also lists the words you'll meet, linked to the glossary.
- The guides live in `components/explore/guides.tsx`, and the Explore page shows them above the tool. Tools that carry their own guide are left alone.

### Beginner guides on the new tools
- New "New here? How to use this" guide (`components/learn/ToolGuide.tsx`) at the top of the pay yourself, which structure and provisional tax tools and the GST return exercise. It has four parts: what the tool shows, how to use it step by step, how to read the results, and the words you'll meet. Each word opens its glossary entry. It's open by default and folds away.
- More terms are linked where they first appear: imputation credits, dividend RWT, use-of-money interest, terminal tax, the late payment penalty, GST-inclusive, adjustments. Some rows now carry a one-line note, such as "added on: tax the company already paid".
- Four new glossary terms: **AIM**, **GST ratio method**, **late payment penalty** and **GST adjustment (Boxes 9 and 13)**.
- **Corrected** the glossary's "Safe harbour": under $60,000 of RIT on the standard method there's no interest until the terminal tax date even if an instalment is paid late (Tax Administration Act s 120KE). It used to say instalments had to be paid on time. A late instalment still gets the late payment penalty.

### Do a pay run yourself
- New exercise `/study/pay-run`: six of Kōwhai's real pay runs, simpler first.
  - The first pay run.
  - Leo's busy summer (44 hours).
  - The first pay of year 2 (new ACC rate).
  - The pay rises.
  - Mia's two annual leave runs, marked harder.
- **1. The payslips.** Each person's timesheet, then every payslip line: ordinary pay, holiday pay, gross, PAYE, student loan, KiwiSaver, net pay, employer KiwiSaver, ESCT, and what reaches the fund.
  - Each line says what it is in plain English and links to its glossary entry. Once marked, it shows its working.
  - PAYE is a short worksheet of IRD's own steps. "Use the PAYE tables" fills it in from your own gross pay.
  - Lines are marked against your own earlier figures.
  - A "Who gets what" breakdown shows where every dollar of the pay run goes.
- **2. The journal entry**, with the payslip totals, the common mistakes, and Kōwhai's real entry as the answer. The leave runs use the holiday pay accrual.
- **3. Payday filing and paying IRD**: when the employment information is due, what's in it, and how much goes to IRD on the 20th.
- The best result for each pay run is saved on the device. Linked from the PAYE, KiwiSaver and Holidays pages' "Make it stick" boxes and the Drills tab.
- **Corrected the payroll engine to IRD's Payroll Calculations & Business Rules Specification 2026–27:**
  - PAYE now drops the cents from annual income and truncates twice, weekly and then per pay. It was 1–3 cents out on 95 of Kōwhai's 102 payslips (Mia's first pay: $341.18, not $341.19).
  - ESCT is worked on the employer contribution with its cents dropped.
  - Each employee's ESCT rate is set once a year from the year's expected pay. Leo's used to switch between 10.5% and 17.5% from one pay to the next.
  - Student loan uses gross pay with the cents dropped.
  - Profit and tax are unchanged in both years. Only cents move between net pay and the amounts owed to IRD.
- The PAYE page's calculator now uses the same engine, and its "how PAYE is worked out" steps are IRD's.
- New tests check IRD's worked examples. Tests: 254 pass.

### Plan for "Do a pay run yourself"
- `docs/PAY-RUN.md`, checked against IRD's Payroll Calculations & Business Rules Specification for 2026–27 (v1.0, 24 March 2026), the rules payroll software must follow.
- It found two problems in the app's payroll engine:
  - PAYE should be truncated twice (weekly, then per pay) from annual income with the cents dropped. The engine rounds instead, so 95 of Kōwhai's 102 payslips are 1–3 cents out.
  - The ESCT rate should be set once a year, not worked out from each pay. Leo's rate switches between 10.5% and 17.5% from one pay to the next.
- Fixing these changes no profit or tax. Not started.
- New standing rule: every tool and exercise must be annotated for a beginner (terms explained, figures labelled, workings shown).

### Do the GST return yourself
- New exercise `/study/gst-return`, built on all twelve of Kōwhai's real two-monthly GST periods (years 1 and 2). The simpler periods come first, starting with June–July 2026. The refund period (April–May 2026) and the two periods with adjustments (February–March of each year) are marked harder.
- **1. Sort.** Each period's transactions with GST are mixed with up to eight without GST, one of each kind: a pay run, PAYE to IRD, drawings, a supplier payment, card settlements (the same amount as the month's sales), a GST payment or refund, the loan repayment, bank fees, a journal, a dividend. The learner sorts each into a sale (Box 5), a purchase (Box 11), extra GST to pay (Box 9), GST to claim back (Box 13) or not in the return. Every answer gives its reason.
- **2. Fill in the boxes.** Boxes 5, 6, 8, 9, 11, 12, 13 and 15, and pay or refund. Each box is marked against the learner's *own* sorting, so one mis-sorted item doesn't make every box wrong.
- **3. Compare.** The learner's return beside the one Kōwhai filed, with the differences highlighted, then the due date. The best result for each period is saved on the device.
- Linked from the GST return page's "Make it stick" box, the Drills tab and the compliance calendar.
- **Corrected** the GST101A box wording on `/nz/gst-return` to match IRD's current form. Box 11 is now "Total purchases and expenses (including GST) – excluding any imported goods". It used to read "for which tax invoicing requirements have been met". GST on imports is claimed in Box 13 instead (IRD's GST guide IR375).
- "The law" box on the GST return page adds GST Act s 6 (wages aren't a taxable activity).

### Provisional tax planner
- New Explore tool `/explore/provisional-tax`, for Kōwhai's year 2 (its first as a provisional taxpayer). It compares four methods: standard (what Kōwhai used), estimation, AIM, and the GST ratio. For each it shows the instalments, the terminal tax on 7 April 2029, use-of-money interest and penalties, and how the interest is worked out, day by day.
- Change how the year turned out (the actual RIT). Under $60,000, the standard method charges no interest. At $60,000 or more, interest runs from the last instalment. An estimate that falls short is charged interest from each instalment date.
- You can pay the 15 January instalment late. Under $60,000 that costs no interest, but the late payment penalty still applies: 1% the next day, then 4% after a week (IRD's guide IR289).
- AIM is approximated from the ledger: payments follow the profit to each GST period. The tool labels it as an approximation. The GST ratio is shown but refused, because the business began operating in year 1 (Income Tax Act s RC 16(2)(b)).
- `lib/nz/rates.ts`: the $100 interest threshold, the GST ratio's $150,000 limit, AIM's $5 million turnover limit, and the late payment penalty (1% and 4%).
- "The law" box: Income Tax Act ss RC 6, RC 7, RC 7B, RC 11 and RC 16, and Tax Administration Act ss 120KE, 120KBB and 139B.
- New drill **Provisional tax: methods & interest** (47 drills). Linked from the Provisional tax page, the year 2 instalment entries and the compliance calendar.
- Tests: 232 pass.

### Plans for the provisional tax planner and "Do the GST return yourself"
- `docs/PROVISIONAL-TAX.md`, checked against:
  - Income Tax Act ss RC 6, RC 7, RC 7B, RC 11 and RC 16;
  - Tax Administration Act ss 120KE, 120KBB and 139B;
  - IRD's interest rates page (8.97% and 2.25%, unchanged since 16 January 2026).
  It found that Kōwhai can't use the GST ratio method in year 2, because the business began operating in year 1 (s RC 16(2)(b)).
- `docs/GST-RETURN.md`: an exercise built on the twelve real GST returns, checked against GST Act s 6(3)(b) (wages aren't a taxable activity).
- Neither is started.

### Which structure? sole trader, partnership, company or LTC
- New Explore tool `/explore/structures`. Kōwhai's year 2 profit is run through a partnership, the company it really is, a look-through company and (optionally) a sole trader, if Aroha owned it alone. For each it shows the tax now, the ACC levies, what each owner keeps, profit kept in the company and the tax still to come on it, and any loss carried forward.
- A profit slider runs from a $60,000 loss to $260,000, with presets for year 2, a quieter year and a loss year. In a loss year, Ben's share of a partnership or LTC loss gets PAYE back on his IT salary, while the company can only carry its loss forward.
- "More than tax" cards compare returns, paying the owners, losses, ACC, liability and limits. There's also a note on Kōwhai's personal guarantees, and a US note (self-employment tax, LLCs and S corporations).
- "The law" box now appears on Explore tools too. It has 11 sections for this tool, including the **Partnership Law Act 2019** (ss 22 and 25), now checked by `npm run law`.
- New drill **Which structure?** (46 drills). The Business structures lesson and the pay yourself tool link to it.
- `lib/nz/rates.ts`: the café's ACC **work levy** ($0.40 per $100) and **working safer levy** ($0.08 per $100), from ACC's Levy Guidebook 2026/27, with the 2027/28 rates marked to confirm.
- **Corrected** the pay yourself tool: ACC on shareholder salaries now includes the work and working safer levies, not just the earners' levy. ACC invoices all three. Year 2's ACC on the real salaries is $2,310, not $1,830.
- Tests: 191 pass.

### Plan for the "Which structure?" tool
- `docs/STRUCTURES.md`. Checked against:
  - the Income Tax Act (ss DC 3B, DC 4, HB 1, HB 11, and the LTC definition in YA 1);
  - the Partnership Law Act 2019 (ss 22 and 25);
  - IRD's look-through company and partnership pages;
  - ACC's Levy Guidebook 2026/27.
- Not started.

### Pay yourself: salary, dividend or keep it in the company
- New Explore tool `/explore/pay-yourself`. Using Kōwhai's real year 2, choose Aroha's and Ben's salaries and a dividend (always split 60/40) and see:
  - the company's tax;
  - each owner's IR3: tax, imputation credits used, RWT, what's left to pay or refunded, and what they keep;
  - the ACC levy that ACC invoices on shareholder salaries;
  - five presets side by side: what the café did, all salary, dividend only, keep it in the company, and the lowest tax this year;
  - the legal checks: the solvency test (Companies Act s 4), enough cash to keep trading (ss 135–136), imputation credits available, and whether Ben's salary is reasonable for his work (Income Tax Act s GB 25).
- The café's actual choice reproduces the books to the cent: company tax $21,110.88, credits $7,777.78, RWT $1,388.89.
- New drill **Salary or dividend?** (45 drills), and links from the Shareholders page and the year 2 salary and dividend entries.
- `data/business.ts`: the owners now have hours and other income. Ben's IT salary ($90,000) is an assumed figure. His work at Kōwhai is 14 hours of café shifts and 6 of bookkeeping a week (about 20), priced at Leo’s wage and an assumed $35 an hour for bookkeeping: about $29,500 a year, so his $35,000 is 1.19× that (within the tool’s 1.25× guide).
- **Corrected** the year 2 dividend notes:
  - Ben's IT salary puts him on 33%, so the credits exactly cover the tax on his dividend. The old note said he was on 17.5% and got a refund.
  - Aroha's credits cover the tax on her dividend, but the extra income costs her the IETC, so she pays $126.78 more. This figure is now worked out, not stated.
- Tests: 175 pass.

### Plan for the pay yourself tool
- `docs/PAY-YOURSELF.md`: salary, dividend or keep it in the company, using Kōwhai's real year 2 figures, with the tax on each route and the legal limits (solvency test, imputation, excessive salary). Not started.

### `npm run law`: the April check for NZ law (law plan Step 3)
- New `scripts/law-check.mjs`: downloads each Act from legislation.govt.nz and reports any section in `lib/nz/law.ts` that has been amended (or has an amendment waiting), renumbered, retitled or repealed since `LAW_CHECKED`, and any Act with a newer version. Retries incomplete downloads. `LAW_SINCE="<date>"` checks from another date.
- README "Updating the rates" gains the step; all 84 sections unchanged today. Fixed one shortened heading (KiwiSaver s 101B) it caught.
- The law plan (`docs/LAW-LOOKUP.md`) is complete.

### Every NZ rule checked against the Acts (law plan Step 2)
- All 14 NZ topic pages checked against their sections and the Income Tax Act's rate schedules. Most matched (rates, thresholds, due dates, leave, records); full list in `docs/LAW-LOOKUP.md`.
- **Corrected:** GST six-monthly filing is for turnover of **$500,000 or less**, on application (not "under"); schedular payments are taxed at the rate for each kind of work (**20% cleaning, 33% directors' fees**, not "usually 10%–20%"); companies with 10+ shareholders must prepare general purpose reports **unless they opt out** (not "who opt in"); an overdrawn current account doesn't legally *require* interest, but charging less than the prescribed rate is taxed as a fringe benefit or dividend; KiwiSaver opt-out is the **13th to 55th day** after starting.
- **Added** to the Shareholders page: what limits what the owners take (excessive salary rule s GB 25, applied to Aroha and Ben; dividend solvency test and certificate; directors' duties; why the contractor rule doesn't apply), and why a shareholder salary has no PAYE and when it must be paid (ss RD 3B, EA 4(3)).
- `lib/nz/law.ts` now lists 85 sections (new: time of supply, KiwiSaver enrolment and opt-out, sick and bereavement leave details, the 63-day rule, shareholder PAYE, employee loans, pooling, FBT minimums).

### "The law" on every NZ topic page
- Each of the 14 NZ topic pages ends with a collapsed **⚖️ The law** box: the sections of NZ law behind the page (71 in all, from 9 Acts), each with its heading, a plain-English summary and a link straight to the section on legislation.govt.nz. Every summary was written from the section's text, read on 28 November 2026; the box shows each Act's "version as at" date.
- New `lib/nz/law.ts` (the KiwiSaver rate comes from `rates.ts`, so April updates still need only that file), `components/nz/LawBox.tsx` and `tests/law.test.ts` (every topic has a reference; links well formed; no duplicates).
- **Corrected:** the "low-turnover trader" definition is in Income Tax Act s **EB 13(2)**, not s EB 2 as the previous entry said (inventory page and `rates.ts`).
- **Corrected in the plan:** personal services attribution is ss GB 27–GB 29, not "GC 14B–14E" (`docs/LAW-LOOKUP.md`).
- README: removed a stray "/r" from the first line.

### NZ law read straight from legislation.govt.nz, and the stock thresholds corrected to match the Act
- Step 0 of `docs/LAW-LOOKUP.md` now **passes** without any law server or key: legislation.govt.nz serves each Act to a plain download (the web-fetch tool gets "403", NZLII blocks automated access). GST Act ss 8 and 51 match the site (15%, $60,000).
- **Corrected against the Act**: low value trading stock applies with turnover of **$1,300,000 or less** (Income Tax Act 2007 s EB 23), not "under $1.3m"; a low-turnover trader has turnover of **no more than $3,000,000**, counting associated persons (s EB 13(2); first written here as s EB 2, corrected in the next entry). The earlier wording followed IRD's summary. Fixed in `rates.ts`, the inventory page (now citing the sections), the glossary, US vs NZ, and the Valuing stock drill (which now includes the $1,300,000 exactly case). New boundary test.
- README "Checking NZ law" rewritten: read the Acts directly; jurisd, global-law and nz-legislation-mcp listed as tried or optional.

### Law lookup: jurisd tested, doesn't work for NZ law
- Step 0 of `docs/LAW-LOOKUP.md`: jurisd couldn't fetch the GST Act. AustLII is behind a Cloudflare challenge (getting round it needs a paid Exa key), NZLII isn't on its allowed list, and it has no NZ offline data. README now recommends **nz-legislation-mcp** (free PCO key) instead. jurisd has been removed.

### Plan: checking NZ law with jurisd
- `docs/LAW-LOOKUP.md`: how jurisd will be used (prove it works, "The law" references on each NZ topic, check the site's rules against the Acts, the April routine), and a proposed follow-on **pay yourself** tool (salary vs dividend). Nothing run yet.

### README: NZ law lookup
- **jurisd** law server installed for this project (no key needed; not used yet). README "Checking NZ law" lists it, the existing **global-law** server (its saved address is missing a letter, so it doesn't connect; the fix is there), and **nz-legislation-mcp** as an alternative that needs a PCO API key.

### Cash flow forecast, do the year-end yourself, valuing stock
- **New Explore tool: Cash flow forecast** (`/explore/cash-forecast`). The year 2 cash forecast Aroha and Ben could have made in March 2027, beside what the bank really did, month by month.
  - Built from the budget: sales and supplier bills spread the way they fell in year 1, wages split across the 26 paydays (three in June and December), GST worked out per two-month period and paid on its due date, and the loan, provisional tax and drawings at their real amounts and dates.
  - A bank-balance chart (forecast vs actual), a month picker with that month's money in and out, and a year table with the reason for every big difference: the unplanned $20,000 dividend, the POS swap, sales above budget, and the holiday pay accrual the forecast wrongly treated as cash.
  - Lessons drawn from the figures: profit isn't cash (shareholder salaries, depreciation, drawings, dividend), the months where more went out than came in, idle cash (the bank never fell below about $216k), and the terminal tax and provisional tax due after year end.
  - New drill, **Cash flow forecast**, and a glossary term. Tests check the actual side matches the bank and till to the cent each month, and that known amounts (loan, tax, drawings) are exact.
- **Do the year-end yourself** (`/study/year-end`). Start from Kōwhai's real unadjusted trial balance for year 1 or year 2 and post every adjustment the accountant made, in order. Your trial balance updates with what *you* enter (it goes out if an entry doesn't balance), and at the end your profit sits beside the real one, with each adjustment's effect. Linked from Study and the adjustments lesson. Tests check that posting every right answer reproduces the real adjusted balances exactly.
- **Inventory page**: the FIFO vs weighted average example is now interactive (how much was used; prices rising or falling) and explains the effect on profit. New drill, **Valuing stock** (44 drills). New glossary terms: FIFO, weighted average cost, net realisable value.
- **Corrected IRD's trading stock rule.** The site said the "low-turnover concession" applied with turnover of $1.3m or less. Checked against IRD's *Valuing trading stock* page: the $1.3m and $10,000 test is the **low value trading stock** rule (sales under $1.3m and closing stock reasonably estimated under $10,000: closing stock can stay at its opening value, with no count). **Low-turnover traders** are a separate group, with sales under $3 million. Fixed on the inventory page, in the glossary and on US vs NZ; the figures now live in `lib/nz/rates.ts`.

### Works offline, installs to a phone, and knows when its rates are out of date
- **Offline and installable.** After one visit, every page, drill and tool is saved on the device (a service worker, `out/sw.js`, generated after each build by `scripts/build-sw.mjs`). The site can be added to a phone's home screen with its own café icon. The footer says "Saved on this device" once it's ready. Each deploy gets a fresh saved copy on the next visit. Tested by loading the site once, stopping the server, then opening pages, following links and answering a drill.
- **Rates check, ready for April 2027** (no server needed). The course knows which tax year it teaches; from 1 April after that year:
  - the site shows a notice under the header saying which year its figures are for;
  - `npm run build` prints a warning;
  - `npm run rates` lists each year's figures, what's still to confirm, and the official page for each.
  - README "Updating the rates" has the steps. The notice goes away once `CURRENT_PAYROLL` is moved on.
- README rewritten for this project (it was the Next.js starter text).

### Budget vs actual, and the rest of the site made keyboard and screen-reader friendly
- **New Explore tool: Budget vs actual** (`/explore/budget`). Year 2's budget sits beside what really happened, line by line, with each variance marked favourable (F) or unfavourable (U).
  - The budget is built the way Aroha and Ben would have in March 2027, from year 1's actual figures plus what they knew: 5% sales growth, the pay rises, the fixed lease, interest from the loan schedule, and depreciation on the assets they owned. Every figure is worked out from the books (`data/books/budget.ts`).
  - Every big variance has a reason taken from the year 2 books. Examples: the wedding catering; Mia's leave paid from last year's holiday pay accrual; the first full accountant's bill; the higher shareholder salaries; the POS sale and new POS.
  - **Flex the budget**: resizes cost of sales and card fees to the actual sales. That exposes a real budgeting trap: year 1's cost of sales was flattered by the café stocking up for the first time ($3,800 of stock built up from nothing), so a budget copied from it was too low. Purchases were 31% of sales in both years.
  - New drill, **Budget vs actual** (42 drills): favourable or unfavourable, the size of a variance, flexing, fixed or variable, and why. New glossary terms: budget, variance, flexible budget. Tests check the actual column is year 2's real P&L to the cent and that every big variance is explained.
- **Accessibility pass across the site** (an automated check of all 58 pages, then fixes, tested with real key presses):
  - A **Skip to content** link, and the sticky header no longer hides what has keyboard focus.
  - Every dropdown, search box and slider now has a name a screen reader can read (journal, ledger, trial balance, statements, glossary, the T-accounts lesson, the cycle walkthrough).
  - Ledger rows open from the keyboard (a real button in each row). A year on the job has a **Jump to a task** list, and the timeline's description says which task you're on.
  - The cycle wheel's arrows are hidden from screen readers; each step link is named and marks the current one.
  - The menu closes on Escape and marks the current section. Tab buttons and quiz answers say which is selected, and quiz results are announced.
  - Glossary term tooltips show on keyboard focus, not just hover. Monthly chart bars read as "April 2026: sales $…".
  - Decorative bars (equation bar, pay breakdown) are hidden from screen readers; their figures are already in text.
  - Animations and smooth scrolling now follow the device's **reduce motion** setting.
  - The footer's year comes from the rates file.

### Keyboard, drills mastered, typed recall, and rates you can change in one place
- **Keyboard pass**. Every page now shows a clear outline on whatever has keyboard focus. In the study tool:
  - focus moves to each new question, then to **Next** once you've answered;
  - flashcards: focus follows the card as you show the answer;
  - the 1–4 shortcuts no longer fire with Ctrl/Alt/Cmd (Ctrl+1 switches browser tab) or while typing;
  - in "Put it in order", the arrows keep focus on the step you're moving, and a screen reader announces its new position;
  - Dr/Cr buttons say whether they're pressed, and picking one jumps to its amount box (which now shows focus).
  - Explainer overlays take focus when they open, keep Tab inside, and give focus back to the term on Escape.
  - The ←/→ keys on the cycle walkthrough and A year on the job no longer fire inside the explainer or with Alt (Alt+← is the browser's Back).
- **Drills mastered**: a drill is mastered when your last set scored 80% or more and none of its missed questions are left. Shown as "✓ Mastered" on the drill cards and on Progress. Flashcard *Known* is unchanged.
- **Type it** (flashcard setting): meaning → term cards ask you to type the term. It's checked for you: capitals, punctuation and a small typo don't count against you, and either the abbreviation or the full name is accepted ("PAYE" or "Pay As You Earn"). You still grade yourself, with a suggested grade outlined.
- **Rates in one place**. Payroll rates are now one set per income year in `lib/nz/rates.ts` (`PAYROLL_2026_27`, `PAYROLL_2027_28`), and `CURRENT_PAYROLL` says which year the lessons teach. Each of the café's years uses its own set, so new rates never rewrite an earlier year's books. About 25 figures that were typed into lesson text, the glossary, payslips and the US vs NZ page (minimum wage, KiwiSaver %, ACC levy, student loan threshold, IETC, UOMI, secondary tax code bands) now read from the rates file. A test fails if any of them is typed in again. No figures changed.

## 2026-11-27

### Study: drills for the last uncovered lessons, and the IR4 date checked
- **IR4 due date verified** against IRD's company tax return guide 2026 and 2026–27 tax calendar: 7 July without a tax agent (for a 31 March balance date), 31 March the following year with one. The "When is it due?" drill already had both right.
- **5 new drills (41 in all)**, so every lesson now has practice:
  - **The worksheet** (Step 8): which column each real adjusted balance goes in, and working out adjusted balances from Kōwhai's unadjusted balances and adjusting entries.
  - **After closing** (Step 11): what stays on the post-closing trial balance, retained earnings after the profit goes in (both years), and what closing does to the totals.
  - **Employment basics**: the minimum wage, deductions below it, how long records are kept (6 vs 7 years), employee or contractor, IR330 and KS1.
  - **ACC levies**: the earners' levy through PAYE, including the maximum liable earnings cap, and the work levy invoice and its entry.
  - **RWT, FBT or withholding tax?**: interest, dividends, the work van, gym memberships, an overdrawn current account, contract cleaners, directors' fees, plus RWT on interest at 28%.
- Each one is linked from its lesson's "Make it stick" box.
- Tests (now 111): the worksheet's columns balance with the real profit in both years, retained earnings after closing = before + profit, and the adjusted balances asked for match the books.
- `docs/STUDY.md`: coverage map has no gaps left; G4 and V1 added.

### Study: a harder mode for journal entries
- The entry drills (Build the journal entry, Year-end adjustments, Closing entries, Year 2 entries) have a **Harder** checkbox: the amounts are never shown up front, so you work them out from the story and the source document (split off the GST, add up the payslips, net two figures).
- It's off by default and remembered in this browser. When a question has amounts that aren't written anywhere, a note says so.
- The "show the amounts" hint is still there, since a few amounts can't be fully worked out from what's shown (e.g. reversing last year's accrued wages); using it is noted on the result.
- `docs/STUDY.md`: X2 added; the open question removed.

### Study: export and import your progress
- **Progress → Keep your progress**: **Export progress** downloads a JSON file with your flashcards, drill scores, missed questions, streak days and flashcard settings. **Import progress…** loads one back, in this browser or another one.
- Import checks the file first: anything that isn't a Kōwhai Café study export is refused with a message, broken entries are dropped, and it asks before replacing what's in the browser.
- Reset progress moved into the same panel.
- Tests (now 105): a full export → import round trip, and refusing or cleaning bad files.
- `docs/STUDY.md`: X1 added and ticked; the open question removed.

### Study Phase 3: make it stick
- **Missed questions come back.** Every drill question is now built from a seed, so a missed one can be saved and rebuilt exactly. It returns the next day, then 3 days later, and drops off once you've got it right twice.
- **Today's review** (top of the Study page): the missed questions that are due, 5 new questions from different drills (weakest first), then the flashcards that are due. Each question shows which drill it's from.
- **Memory aids as flashcards**: the hook on the front (e.g. DEAD CLIC), what it stands for and why on the back. On by default; switch off in the flashcard settings.
- **7 new drills (36 in all)**:
  - **Put it in order**: a new question type. The accounting cycle, a transaction's journey, closing the year, a pay run, a GST period and Kōwhai's tax year.
  - **Closing entries**: close Kōwhai's real income and expense balances at 31 March 2027 and 2028, then move the profit to retained earnings.
  - **Year 2 entries**: reversing last year's accruals, selling the old POS system, the dividend and its RWT, annual leave and provisional tax.
  - **Balance a T-account**, **Cash vs accrual profit**, **GST for a period** (output − input, ignoring exempt fees and wages), **Dividends & imputation** (28/72 credits, gross dividend, dividend RWT, cash paid).
- **"Make it stick" links**: the end of every lesson (Foundations, the cycle steps and overview, NZ topics, A year on the job, and the ratios tool) links to its drills and to that Part's flashcards. `/study?drill=<key>` starts a drill directly.
- **Progress → Your weakest topics**: the drills with the lowest last score or open missed questions (with a Practise button), the cards you forget most, and "Retry them now" for every saved missed question.
- Saved progress from before this change still loads; it just has no missed questions yet.
- The home page's Study card lists Today's review, memory-aid cards, missed questions and weakest topics.
- **Tests (now 103)**:
  - Every drill rebuilds the same question from the same seed, and every drill links to a page that exists.
  - Closing entries close income with a debit and expenses with a credit, and close the real profit.
  - The T-account, imputation, RWT and GST-period answers are re-worked independently.
  - Missed-question scheduling and the 200-question cap are tested.
- `docs/STUDY.md`: Phase 3 ticked off; architecture, saved data, coverage map and log updated.

### Study Phase 2: sort it, and the full NZ calendar
- **12 new drills** (`data/study/classify.ts`), built from Kōwhai's books and chart of accounts where possible:
  - **Operating, investing or financing?**: Kōwhai's real cash movements, classified the same way as its cash flow statement.
  - **Effect on the equation**: what each real transaction does to assets, liabilities and equity, with every account's movement explained.
  - **Trial balance errors**: will it still balance, and which CROPOC error is it? Built on real entries.
  - **Which source document?**: real transactions matched to the documents behind them.
  - **Temporary or permanent?**: every account in the chart.
  - **Standard, zero-rated or exempt?**: Kōwhai's accounts plus everyday situations (exports, residential rent, wages).
  - **US → NZ terms**: from the glossary.
  - **Bank reconciliation items, Capital or revenue?, Deductible for tax?, Is it a transaction?, Owners & business structures**: short scenarios built on the NZ rules the course teaches.
- **When is it due?** now covers the full NZ calendar: six-monthly GST, KiwiSaver, terminal tax and the IR4 (with and without a tax agent), the Companies Office annual return, and keeping records for 7 years.
- 29 drills in all. The Study page intro and the home page card describe the new drills.
- Shared `data/docKinds.ts` holds the source-document type names (previously inside the document component).
- **Tests (now 90)**:
  - Known transactions land in the right cash-flow section, and every transaction keeps the equation balanced.
  - Temporary/permanent matches the account type, and TB-error answers agree with their explanations.
  - Internal workings never appear as a source-document answer.
  - Terminal tax and IR4 dates are right with and without an agent.
- `docs/STUDY.md`: Phase 2 ticked off, coverage map and log updated.

### Study Phase 1: record it and work it out
- **Three kinds of question** (`data/study/core.ts`): multiple choice, **typed amounts** (accepts `$1,234.50`, `1234.5`, `70.3%`), and **build the journal entry**.
- **Build the journal entry** (`data/study/entries.ts`), from real transactions in Kōwhai's books:
  - 79 everyday transactions and 17 year-end adjustments from years 1 and 2, one of each kind.
  - Read what happened and the source document, then choose debit or credit and the amount for each account. The wrong choices are accounts beginners mix up with the right ones.
  - Live debit and credit totals show whether the entry balances. It's marked row by row and then shows the real entry with the reason for each line.
  - When some amounts only come from adding up the document (a month's sales, a pay run), they're shown up front; otherwise they're behind a hint.
- **Eight "work it out" drills** (`data/study/calc.ts`), using the same NZ calculators and statements as the course:
  - **Accruals & prepayments**: prepaid amount, this year's expense, accrued wages, accrued income, income in advance.
  - **Depreciation**: DV for part of a year, SL, DV year 2, book value, gain or loss on sale.
  - **Cost of goods sold**: COGS, gross profit and margin.
  - **Payroll**: gross pay, employee and employer KiwiSaver, ESCT, student loan, net pay and employer cost.
  - **Holiday pay**: 8% pay-as-you-go, time and a half on a public holiday, annual leave pay.
  - **Taxable income & tax**: the add-backs, then 28%.
  - **Provisional tax**: RIT, the standard method, instalments, terminal tax, the $5,000 threshold.
  - **Ratios**: from Kōwhai's real year 1 and year 2 statements.
  - Each shows the full working afterwards.
- **GST maths** now asks for a typed answer.
- **Drills tab grouped** into Record it / Work it out / Sort it / NZ dates & words (17 drills). The drill screen moved to `components/study/DrillRun.tsx`.
- **Tests (now 75)**:
  - Every generated question is well-formed, and its working includes the answer.
  - Entries balance and include the right accounts.
  - Answers match the known figures: espresso depreciation $3,360 and $7,840 book value, current ratio 2.71, gross margin 70.3% and 69.6%.
  - Net pay is gross less deductions; typed answers parse correctly; no glossary link sits inside bold (it wouldn't render).
- `docs/STUDY.md` updated: architecture, coverage map, Phase 1 ticked off, log.

### Study tracker
- New `docs/STUDY.md`: the study tool's purpose and principles; its architecture (files, data flow, saved-data shape, scheduler rules, planned question types); a coverage map of every lesson against flashcards and drills; a phased checklist with IDs (Phase 1 record and calculate, Phase 2 classify, Phase 3 make it stick); the definition of done for a drill; open questions; and a log.

### Study: flashcards and drills (active recall)
- **New "Study" section** (`/study`, in the menu and on the home page) for practising what's been learned, instead of re-reading it.
- **Flashcards with spaced repetition**:
  - One card per glossary term. Choose which Parts (1–4) and levels (Essential / Working knowledge / Reference) to study; Essential is the default.
  - Cards go term → meaning, meaning → term (the term is hidden in its definition), or both.
  - You try to recall the answer first, then see the meaning, the café example, the common mistake and the matching memory aid, then mark it Again / Hard / Good / Easy.
  - A simple box system schedules each card (`lib/study/srs.ts`): reviews come back after 1, 3, 7, 14, 30 and 60 days, and a forgotten card starts again. A term counts as **known** once it's recalled well with a week or more between reviews.
  - Every button shows when the card will come back. Keyboard: Space to show, 1–4 to mark.
- **Seven drills** (`data/study/drills.ts`): 10 auto-marked questions at a time, generated fresh each time from the café's own data, so the answers always agree with the rest of the app.
  - **Debit or credit?**: real lines from Kōwhai's journals (years 1 and 2).
  - **Which element?**, **Current or non-current?** and **Which statement?**: from the chart of accounts.
  - **GST maths**: find the GST, add it, or take it off.
  - **When is it due?**: GST (including the 7 May and 15 January exceptions), PAYE, payday filing and provisional tax.
  - **Match the term**: from the glossary.
  - Each answer explains why it's right and names the usual trap. The end screen lists the missed questions with their explanations and links to the lesson to revise.
- **Progress**: due, new and known counts, a day streak, known terms by Part and level, and the best and last score for each drill. It's saved in the browser (`localStorage`), with a reset button. `/study?part=2` studies a single Part.
- **Tests (now 61)**: the scheduler and streak; 300 generated questions per drill are all well-formed; debit/credit answers agree with the reasoning shown; GST answers are arithmetically right; the GST due-date exceptions; term masking.

### Glossary audit and expansion (groundwork for a study tool)
- **Audit**: the glossary had 131 terms. Many concepts the app teaches had no entry (e.g. current vs non-current, mentioned ~35 times; "shareholder", 134 times). 99 entries had no café example, 126 no common mistake, and 57 no link to the page that teaches them.
- **48 new terms**:
  - Statements: current & non-current assets, current & non-current liabilities, net assets, statement of changes in equity, operating/investing/financing activities, direct vs indirect method, gross margin, current ratio, quick ratio, liquidity, break-even point, adjusted and post-closing trial balances, temporary vs permanent accounts, the NZ reporting framework.
  - Principles: matching principle, historical cost.
  - Recording: cashbook, narration.
  - Assets & stock: accumulated depreciation, diminishing value, straight line, gain or loss on sale, opening and closing stock, doubtful debts, wastage.
  - Tax: taxable income, residual income tax, non-deductible expenses, safe harbour, provisional tax methods, income year.
  - Payroll: Holidays Act 2003, annual leave, public holidays, sick leave, 8% pay-as-you-go, minimum wage, employer KiwiSaver contribution.
  - GST: registration threshold, GST-inclusive vs exclusive, taxable period, standard-rated supply.
  - Business: shareholder, director, limited liability, Companies Office annual return.
- **Fuller entries**: café examples for every essential and working-knowledge term (160 of 179 have one; only reference terms may go without), a common-mistake note on every essential term (80 in total), and a link to the teaching page on every term. All café figures come from the books.
- **Levels**: every term is marked **essential** (73: know it cold), **working knowledge** (81: understand it, know where to look) or **reference** (25: look it up), plus the **Part** that teaches it (1–4). The glossary has a "How well to know it" filter and a level badge on each card. These drive the planned active-recall tool.
- **Holidays Act note corrected**: the NZ topic said the replacement law was only proposed. Parliament passed the Employment Leave Bill in August 2026; the new hours-based rules are expected to take effect in 2028, and until then the Holidays Act applies ([employment.govt.nz](https://employment.govt.nz/news-and-updates/employment-leave-bill-2026)). Kōwhai's two years both fall under the Holidays Act. The official legislation and Parliament pages couldn't be read to confirm the exact Royal assent and start dates.
- **Tests (now 48)**: unique keys and terms; every `[[link]]`, page link and US → NZ pointer is real; every term links to a page; essential and working terms have an example; essential terms have a common mistake; the key concepts from the audit exist.

### Memory aids
- **18 memory aids**, each with what it stands for, **why it works** (so it builds understanding rather than replacing it) and a Kōwhai Café example. All in `data/memoryAids.ts`:
  - **Debits, credits & the equation**: "What you own = what you owe + what's yours"; **DEAD CLIC**; "cRedit has an R for Right".
  - **The statements**: "The P&L is a movie, the balance sheet is a photo"; trip meter vs odometer (what closing resets); "Profit is an opinion, cash is a fact"; "Current means within 12 months".
  - **The process**: "**D**id **J**ack **L**eave **T**he **A**ccounts **S**itting **C**losed?" (the cycle in order); "Accrued: used it, not billed yet. Prepaid: paid it, not used yet."; "Adjustments never touch the bank"; **CROPOC** (the six errors a trial balance can't catch); why bank statements look backwards; diminishing value vs straight line.
  - **NZ numbers & dates**: GST inside a price × 3/23 (add × 1.15, remove ÷ 1.15); GST due the 28th except 7 May and 15 January; payday filing within 2 working days, PAYE paid by the 20th; provisional tax 28 Aug / 15 Jan / 7 May (all GST due dates too); imputation 28/72. GST and PAYE dates checked against IRD ([GST](https://www.ird.govt.nz/gst/filing-and-paying-gst-and-refunds), [PAYE](https://www.ird.govt.nz/employing-staff/payday-filing/paying-deductions-to-inland-revenue)).
- **Where they appear**:
  - A new **🧠 "Remember it" card** where each idea is taught: the equation, debits & credits and cash vs accrual lessons; the cycle overview; the trial balance, bank rec, adjustments, statements and closing steps; and the GST, GST return, PAYE, provisional tax, shareholders and depreciation topics. The old one-off DEAD CLIC callout now uses the card.
  - A **cheat sheet** at `/glossary/memory-aids`, with a "Terms A–Z / Memory aids" tab switch on the Glossary.
  - In the **glossary panel** for related terms (e.g. opening "GST" shows the 3/23 aid), folded so it's short.
  - On **tasks in A year on the job**, the first time each one is useful in a year (e.g. the first GST return shows × 3/23 and the due dates). "Why it works" is folded away there.
- Checked: "adjustments never touch the bank" holds for every adjustment in both years. The tax-credit adjustments use two balance sheet accounts, so the card says "almost every one" pairs a P&L account with a balance sheet account.
- **Tests (now 44)**: aid keys are unique; their glossary terms, `[[links]]` and "learn it in full" pages exist; tasks only point to real aids; the café figures match the books (dividend imputation, the three instalments and their dates, the 3/23 example); and no adjustment touches the bank or the till.

### Hosting: a fully static site (GitHub Pages or Vercel)
- **The site now builds to plain files** (`output: "export"` → `out/`), so any static host can serve it for free. A new workflow, `.github/workflows/pages.yml`, runs the tests, builds the site under `/<repo-name>` (`PAGES_BASE_PATH`) and publishes it to GitHub Pages on every push to `master`. Vercel's free plan also works with no changes: import the repo and keep the defaults.
- **404s now use Next.js's built-in handling** instead of `proxy.ts`, which is removed along with its test. Each dynamic route (`/foundations/[topic]`, `/nz/[topic]`, `/cycle/[step]`, `/explore/[tool]`) sets `dynamicParams = false`, so only the listed slugs exist and anything else gets the new `app/not-found.tsx`. That page is written for beginners and links to every section. Static hosts serve it as `404.html`.
- `cacheComponents` and `partialPrefetching` are off. They don't allow `dynamicParams` and add nothing to a site where every page is pre-built.
- Addresses now end in a slash (`trailingSlash: true`), so `/cycle/` is served from `/cycle/index.html`; the version without the slash still works. Static export is only switched on for builds, so `npm run dev` still returns 404s for unknown slugs instead of an error.
- **Removed**: the `/cycle/year` → `/on-the-job` redirect. Static hosts can't do server redirects.
- Verified:
  - The build under `/nz-accounting-visualiser/`, served locally: every link and asset carries the prefix, `/on-the-job/?year=2&step=B17` opens the right task, and a missing page returns 404.
  - In dev, real pages return 200 and unknown or extra segments return 404.
  - tsc, eslint and vitest (40 tests) pass.

### Home page: what each section is for
- "Choose a path" is replaced by **"What's in this tool"**, which explains all six menu sections for a complete beginner. Each card gives:
  - the exact name it has in the menu
  - what the section is, in plain words
  - what you do there
  - what's inside
  - when to go there
  - how big it is (lessons, steps, topics, tasks, tools or terms, counted live from the data)
- The sections are split into **the course** (Parts 1–4, in order, with a suggested-order strip) and **tools to use any time** (Explore the books, Glossary).
- A callout explains the difference between Part 2 (one step at a time) and Part 4 (everything in date order, as real work happens).
- The hero's second button is now "I know the basics: start the job" (Part 4).

### Navigation: "A year on the job" is its own section
- **"4 · A year on the job"** is now a top-level nav item and section at `/on-the-job` (was `/cycle/year`, nested in the accounting cycle). Both years and the year 2 statements page (`/on-the-job/year-2-statements`) live there.
- The old address redirects permanently (308) with the year and step kept, e.g. `/cycle/year?year=2&step=B17` → `/on-the-job?year=2&step=B17`.
- The cycle overview no longer has the big "Work the whole year" banner or the year 2 card: it's just the steps, with one line at the end pointing to Part 4.
- Home: "Choose a path" card 4 is now "A year on the job"; Explore the books moves to a line under the cards.
- **US vs NZ** is no longer in the nav. The page stays at `/us-vs-nz`, linked from the glossary, the foundations lesson and every US-note callout.
- The header switches to the ☰ Menu button below 1280px (was 1024px), so the six links never wrap onto two lines.

### The café's second year (1 April 2027 – 31 March 2028)
- **A full second year of books**: 199 journal entries built on year 1's closing balances. Every routine entry is included, as in year 1: 26 pay runs, PAYE, monthly sales, banking, purchases, power, rent, the loan, drawings, supplier payments and six GST returns.
- **New in year 2**:
  - Reversing entries on 1 April for year 1's accrued catering income, accrued power, prepaid insurance and accrued wages. Then the real March power bill arrives (the estimate's $18 error lands this year), the school is invoiced, and the wedding deposit becomes income.
  - Year 1's loose ends: the final GST return (Feb–Mar 2027) is paid 7 May 2027, and year 1's terminal tax ($13,742, due 7 April 2028) stays in income tax payable.
  - Provisional tax: year 1's RIT was over $5,000, so the standard option applies: $16,742 × 105% = $17,579, paid 28 Aug, 15 Jan and 7 May. Explains the safe harbour (no use-of-money interest when RIT is under $60,000). Year 1's IR4 is filed early (July 2027).
  - Annual leave: Mia takes 4 weeks. The leave pay comes out of year 1's holiday pay accrual, and the part above the accrual (she's now on a higher rate) is expensed. For tax, last year's add-back is deducted once it's paid.
  - Selling an asset: the old POS system is depreciated to the date of sale and sold for $900 + GST: a $150 accounting gain, $100 of depreciation recovery for tax (no tax depreciation in the year of sale, IR260) and GST on the sale. A new POS system is bought, with Investment Boost.
  - A $20,000 fully imputed dividend: directors' solvency certificate (Companies Act s 4 and s 52), imputation credits of $7,778 checked against the imputation credit account, 33% dividend RWT ($1,389, paid 20 March), and what each shareholder's IR3 looks like. Includes a US vs NZ note on imputation vs double taxation.
  - Pay rises (Mia $27, Leo $25.50), the ACC earners' levy at 1.83% (2027–28), sales up about 6%, a dearer insurance renewal, and higher shareholder salaries.
  - Year end: entertainment GST adjustment, accrued power and wages (11 days), prepaid insurance, holiday pay, depreciation on opening book values, the first stocktake with **opening stock**, shareholder salaries, income tax and closing.
- **"A year on the job" has a Year 1 / Year 2 switch** (`/on-the-job?year=2`): 226 year-2 tasks, starting with "the books carry forward" and the opening trial balance. Routine tasks link back to their full explanation in year 1, so **⏩ Skip routine** jumps between the new jobs. The final step of year 1 has an "On to year 2 →" button. After year end: last year's terminal tax, the final GST return, the third instalment, the annual return and the 2028 IR4.
- **New page `/on-the-job/year-2-statements`**: the year-2 statements with **comparatives** (2028 beside 2027) for the profit & loss, balance sheet and cash flows; changes in equity from last year's closing balance, with the dividend; the year-2 tax reconciliation; the imputation credit account; and selling an asset, accounts vs tax. Linked from the year 2 tasks.
- **Glossary**: added comparatives, imputation credit account, solvency test and depreciation recovery; reversing entry now has a café example.
- **Under the hood**:
  - Year 1's routine entries now come from a shared generator (`data/books/generator.ts`) that both years use. A snapshot comparison confirmed all 211 year-1 entries and 236 steps are unchanged.
  - New accounts: 216 Dividend RWT payable, 460 Gain on sale of assets, 518 Opening stock.
  - The statements engine handles opening stock, the loan's current portion in any year, gains on sale in the indirect cash flow, and dividends in the cash flow.
  - Bank reconciliations now include fees found in an earlier month's reconciliation.
- **Rates for 2027–28**:
  - Verified: ACC earners' levy $1.83 per $100 with maximum liable earnings of $160,244 ([IRD](https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates)); the provisional tax standard option and dates ([IRD](https://www.ird.govt.nz/income-tax/provisional-tax/provisional-tax-options/standard-option)); dividend RWT ([IR284](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir200---ir299/ir284/ir284.pdf)); depreciation on disposal ([IR260](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir200---ir299/ir260/ir260.pdf)).
  - Assumed: the minimum wage from 1 April 2027 (not yet announced; both staff are paid above $23.95); individual tax brackets and the student loan threshold ($24,128) unchanged; the student loan rate stays at 12% (a cut to 10% has been proposed, but isn't law).
- **Tests (now 42)**:
  - Opening balances equal year 1's closing balances, and only permanent accounts carry forward.
  - Every entry balances, ids are unique across both years, and every entry is dated inside the year.
  - The trial balance, the equation and the balance sheet all balance.
  - Closing zeroes every temporary account, and the reversals clear last year's accruals.
  - GST owed at year end equals the final return.
  - Income tax payable = last year's terminal tax + this year's tax − the instalments paid.
  - The dividend is fully imputed and within the imputation credit account, with 33% RWT.
  - The bank reconciles every month, and the direct and indirect cash flows agree.
  - "A year on the job", for both years: every entry is posted once, the year ends with the full books, and step ids, repeats, glossary links and date order are all valid.

---

## 2026-11-26

### The big picture diagram
- The "How it all fits together" flow diagram is now a shared component (`components/job/SystemFlow.tsx`) with two modes: **live** in "A year on the job" (boxes light up for the current task, as before) and **linked**, where every box links to the step or topic that explains it and shows its cycle step number (e.g. Journal = Step 3, Bank reconciliation = Step 6, GST return = NZ topic).
- Added to the **cycle overview** (between the "Work the whole year" banner and the step list) and the **home page** (a "The big picture" section under "Choose a path").
- **Year timeline**: the year-end region is about 45% wider (dots about 13px apart instead of 9px), so the adjustment and closing dots no longer run together. The months take slightly less width.
- Verified: tsc, eslint, vitest (22), screenshots (desktop and phone), no sideways scrolling at 390px on /, /cycle and /cycle/year.

### Instant navigation (Next.js)
- Fixed the dev-tools insight "Next.js encountered URL data outside of Suspense" on the four dynamic routes (`/explore/[tool]`, `/foundations/[topic]`, `/nz/[topic]`, `/cycle/[step]`). Following the Next.js 16 docs (instant navigation / optimizing prefetching), the part of each page that reads `params` is now an async `Content` component inside `<Suspense>`, with a light `PageSkeleton` fallback. All pages are still pre-generated, so the fallback is rarely seen.
- **Real 404s kept** with a new `proxy.ts` (Next 16's replacement for middleware). With the slug read inside `<Suspense>`, a page streams with status 200 before it can call `notFound()`, and the docs' alternative (checking before the boundary) brings the warning back. The proxy checks the slug against the lesson / topic / step / tool lists *before* rendering and returns a real 404 for unknown or extra path segments. It only runs on `/foundations/*`, `/nz/*`, `/cycle/*` and `/explore/*`, and it reads the same data lists, so new pages are covered automatically.
- Tests (now 22): every real lesson/topic/step/tool passes the proxy; unknown slugs get 404.
- Verified: tsc, eslint, vitest, production build (59 pages + proxy), all real pages 200 and mistyped ones 404 on the dev server, no console errors on the dynamic pages.

### Mobile layout
- **Every page now fits a phone screen.** Checked all 52 pages at 390px (phone) and 768px (tablet) with phone emulation in headless Chrome: no page scrolls sideways. Before the fix, 10 pages were wider than the screen.
- **Menu button**: below laptop width (1024px), the six header links are replaced by a "☰ Menu" button that opens the full list (with Home). The café name now shows on phones too.
- **Columns shrink to the screen**: a global rule in `globals.css` (`.grid > * { min-width: 0 }`) stops wide tables and documents stretching a whole column past the screen.
- **Cycle wheel** scales down to fit narrow screens and keeps its layout.
- **Section selector** (Foundations, cycle, NZ): on phones the overview button and arrows sit on the first row, with every lesson/step/topic wrapping across the full width below. Previously they were squeezed into one tall column.
- **Source documents**: the header stacks on phones, padding is smaller, long values can wrap, and item tables scroll inside the document if needed.
- **GST return form**: narrower number boxes and wrapping header on phones.
- **Explore**: journal list hides the entry-ID column on phones; dropdowns can't exceed the screen.
- "Work the whole year" banner on the cycle overview: the text no longer gets squeezed on phones.
- Desktop layout is unchanged (checked by screenshot).

### Fixes
- Cycle wheel: coordinates are rounded so the server and browser render identical HTML. This removes a hydration-mismatch console error on the home page and /cycle.

### A year on the job (`/cycle/year`)
- **New walkthrough** of the café's whole year as **236 tasks** in the order the bookkeeper (Ben) and accountant (Rata & Co) actually do them. It's separate from the existing cycle pages, which are unchanged, and launched from the "▶ Work the whole year" banner on the cycle overview.
- Each step shows: date and weekday, who does the job, a category tag, "The job & why", the source document, the journal entry, the T-accounts it posts to (year to date), the live accounting equation (with the change), a "coming up" deadlines box (PAYE 20th, GST returns, terminal tax), bank balance and profit so far, plus the trial balance to date with touched accounts highlighted.
- **Jobs that aren't entries** are steps too: a monthly bank reconciliation (12, with the March one finding the bank fee, a deposit in transit and an unpresented payment), preparing and filing each GST return (box by box, before each payment), payday filing (noted on every pay run), the balance-date checklist, unadjusted / adjusted / post-closing trial balances, the tax computation, financial statements, the final GST return (due 7 May), the Companies Office annual return and the IR4/IR3 with terminal tax.
- Recurring work (pay runs, Z-reports, banking, supplier payments, PAYE, direct debits, rent, loan, power, drawings, bank fees) is explained in full the first time, then briefly on repeats with "This time:" specifics and a link back to the first explanation.
- Controls: Back / Next task, ← → keys, ⏩ Skip routine (jumps past repeated routine steps: 93 of 236 steps remain), autoplay at three speeds, month timeline (Apr–Mar, Year end, After), progress saved in localStorage, `?step=<number or id>` deep links.
- **"How it all fits together" map** (`components/job/YearMap.tsx`) at the top of the walkthrough, collapsible:
  - *Where this task sits in the system*: source documents → journal → ledger → trial balance → adjustments → statements → close, with the checks and filings that read the books (bank rec, payday filing & PAYE, GST return, IR4). The boxes the current task touches light up.
  - *The whole year*: every task as a dot on a timeline (Apr–Mar, year end, after), one row per kind of work (sales & banking, bills, payroll, IRD, checks, one-offs, year end). New kinds of job are larger dots, done tasks are filled, a dashed line marks where you are, and clicking a dot jumps to that task.
- Files: `data/job/steps.ts` (builds `JOB_STEPS` from the journal), `components/job/JobYear.tsx`, `app/cycle/year/page.tsx`; a small `fade-up` CSS animation in `globals.css`.
- Tests (now 20): every journal entry is posted exactly once; the final books equal the full journal; step ids are unique and all glossary links exist; entries during the year are in date order.
- Verified: tsc, eslint, vitest, production build, headless Chrome (no console errors; screenshots of setup, first pay run, GST return, March bank rec, statements).

### Navigation
- **Shared section bar** (`components/learn/SectionNav.tsx`) at the top of every page in Foundations, the Accounting cycle and NZ tax & rules:
  - a "☰" button back to that part's overview page
  - ← and → arrows
  - every lesson, step or topic as a numbered button: passed = yellow, current = dark, ahead = white
- Removed the separate progress bar; the coloured buttons show progress instead.
- Cycle step buttons now use the same colours as the other parts (previously blue for during-the-year steps and yellow for balance-date steps).
- NZ topic pages: the bottom buttons are now Previous / Next, like the other parts (previously "All NZ topics" / Next). The last topic leads on to Explore.
- Added short labels (`short`) to `FOUNDATIONS` and `NZ_TOPICS` in `data/topics.ts`.

### US GAAP vs NZ (for learners coming from American material)
- **Reference page `/us-vs-nz`**, also lesson 10 in Foundations (`components/usnz/UsVsNz.tsx`). It has a table of contents and 15 sections, each rated high / medium / low impact for a small café:
  - who sets the rules
  - terminology (16 terms)
  - financial statements
  - owners and equity
  - revenue and bad debts
  - worked examples
  - sales tax vs GST
  - payroll and employment
  - income tax
  - dividends and imputation
  - fixed assets, depreciation and leases
  - inventory
  - banking
  - business structures
  - language and dates

  Ends with a 4-question quiz.
- **Four worked examples**, each the same event journalised the US way and the NZ way: buying and selling with sales tax vs GST; an owner taking money (sole trader vs company); payroll on $1,000 gross; closing the books.
- **"🇺🇸 US vs NZ" link** added to the top navigation.
- **Collapsed "Coming from a US textbook?" notes** (`UsNote` in `components/learn/bits.tsx`) on 8 pages: GST, PAYE, Shareholders, Depreciation, Inventory, Income tax, Business structures and Cycle → Statements. Each is one closed line until clicked. Mechanics pages deliberately have none.
- **Glossary**: new "🇺🇸 US → NZ terms" category with 16 entries (Withdrawals, Income statement, Stockholders, Sales tax, FICA, W-4/W-2, IRS, Fiscal year, LLC/S corp, Notes payable, etc.). Each has a "🇳🇿 NZ term →" button that opens the NZ equivalent. There's also a banner on the US filter linking to `/us-vs-nz`.
- Test added: every US glossary term must point to an NZ entry that exists.
- Five elements lesson: added explanations of drawings (not a sixth element) and income vs revenue.

### Accuracy checks against legislation
- Checked employment and company-law statements against the Holidays Act 2003, the Employment Relations Act 2000 and the Companies Act 1993 (text from the lexifina `new-zealand-law` repo, sourced from legislation.govt.nz, current to 29 Oct 2026).
- **Corrected**: the Holidays Act warning now says the Act is still in force (last amended 20 Dec 2023) and that replacement has only been proposed. Previously it said the Act "is being replaced".
- **Corrected**: sick leave carry-over is up to 10 days, to a maximum of 20 days' entitlement (s 66). Previously it said "carry over up to 20".
- Added section references: Holidays Act ss 16, 21, 28, 50, 56, 65, 66, 70, 81; ERA s 130; Companies Act ss 4, 52, 214. Also added the s 28 condition that 8% pay-as-you-go must show separately on the payslip.
- Not covered by that source: GST Act, Income Tax Act, Tax Administration Act, KiwiSaver Act and Minimum Wage Act. Those rates come from IRD, ACC and employment.govt.nz.

### Build and config
- Removed `dynamicParams = false` from the dynamic routes. It isn't compatible with `cacheComponents`; unknown slugs still 404 via `notFound()`.
- `next.config.ts`: set `turbopack.root` to stop the workspace-root warning.
- Lint fixes: the T-account side renderer is no longer a component created during render; the inventory FIFO calculation no longer reassigns a variable; internal links use `<Link>`.

---

## Initial build

Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind v4, `motion`, `vitest`.

### The café and its books
- **Kōwhai Café Ltd**, Wellington (fictional): a company owned by Aroha (60%) and Ben (40%), with employees Mia (full time) and Leo (casual). Year 1 Apr 2026 – 31 Mar 2027. GST on the invoice basis, filed two-monthly. Periodic inventory.
- **211 journal entries** in one journal (`data/books/`): 29 featured April transactions with full stories, source documents and quizzes; routine monthly entries, payroll (25 fortnightly pays), GST and PAYE payments, later events, 12 year-end adjustments and 3 closing entries.
- **Accounting engine** (`lib/engine/`): ledger, balances, trial balance, statements (P&L, balance sheet, changes in equity, cash flow by the direct and indirect methods), GST returns, bank reconciliation. Everything is derived from the one journal.
- **NZ calculations** (`lib/nz/`): PAYE including IETC and the ACC levy, ESCT, depreciation (DV/SL, Investment Boost), loan amortisation, the income tax computation. All rates are in `lib/nz/rates.ts`, sourced from IRD, ACC and employment.govt.nz.
- **Tests** (`tests/engine.test.ts`): every entry balances; the equation holds after every transaction; the trial balance and balance sheet balance; closing zeroes temporary accounts; direct cash flow = indirect; the GST control account = the GST return; bank rec items; payroll identities; glossary links.

### Pages
- **Home**: introduction, the cycle wheel, the café and its people, learning paths.
- **Part 1 Foundations**: 11 lessons, including an accounting-equation sandbox, debit/credit practice and T-account explorer.
- **Part 2 Accounting cycle**: overview wheel plus 12 steps. Includes the April transaction walkthrough (document → analyse → journalise → post), "the year" month view, an interactive bank rec, the adjustments stepper, the 10-column worksheet, statements, staged closing and the post-closing trial balance.
- **Part 3 NZ tax & rules**: 14 topics with calculators (GST, GST returns box by box, PAYE payslip, KiwiSaver/ESCT, holidays, employment, ACC, income tax, provisional tax, shareholders and imputation, depreciation, inventory, other taxes, compliance).
- **Explore the books**: journal, ledgers (including subsidiary ledgers), trial balance and statements at any date, ratios, loan schedule, break-even.
- **Glossary**: about 115 terms; underlined terms show a definition on hover and open a full explanation on click.
