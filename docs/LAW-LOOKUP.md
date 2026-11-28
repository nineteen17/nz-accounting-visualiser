# Plan: using jurisd to check NZ law

Status: **Step 0 failed** (2026-11-28): jurisd can't reach NZ legislation from here, so Steps 1–3 wait for another source. See the Step 0 result below.

## Purpose

IRD, ACC and Employment NZ stay the source for **figures and how rules are applied**. jurisd adds **the law behind them**: the Act and section each rule comes from, in the Act's own wording. That lets the site say "here's the law" and helps catch mistakes like the trading stock rule (corrected 2026-11-28, see CHANGELOG).

## Step 0: Prove it works

Look up three sections where the answer is already known:

- Goods and Services Tax Act 1985, s 8: GST at 15%.
- Goods and Services Tax Act 1985, s 51: the $60,000 registration threshold.
- Income Tax Act 2007, around s EB 3: the low value trading stock rule.

**Pass:** each section is found, matches the site, and is current (its date checked against legislation.govt.nz, since NZLII copies can lag).
**Fail:** fall back to nz-legislation-mcp (needs a free PCO API key; README "Checking NZ law").
Either way, record the result in the README.

### Result (2026-11-28): fail

Tried through the jurisd command line (its MCP connection timed out at startup; the first launch downloads and builds it from GitHub).

- **Search:** blocked. AustLII sits behind a Cloudflare challenge; jurisd needs an `EXA_API_KEY` (Exa, a paid search service) to work around it.
- **Direct fetch:** NZLII addresses (nzlii.org) aren't on jurisd's allowed list, and the AustLII copies are blocked by the same challenge.
- **Offline data modules:** none for NZ. The only published module is Australian Commonwealth legislation.

So jurisd can't read the GST Act or the Income Tax Act without paying for Exa. Options, in order:

1. **nz-legislation-mcp**, with a free PCO API key: the official text of every Act, including the tax Acts. Recommended.
2. **global-law**, once its address is fixed (README): has the Companies Act, Holidays Act and other non-tax Acts now, but no tax Acts.
3. jurisd with an Exa key: not worth paying for here.

jurisd was removed from the project's Claude Code settings the same day.

## Step 1: "The law" on the NZ topic pages

Each NZ topic page gets a short **The law** box listing the Acts and sections behind it: a one-line plain-English summary and a link to the official legislation.govt.nz page (not NZLII). They're kept in one file, `lib/nz/law.ts`, the way rates live in `rates.ts`. Each entry records the Act, section, summary, official link, and the date it was checked.

| Topic | Acts |
|---|---|
| GST | Goods and Services Tax Act 1985 |
| Income tax, provisional tax, imputation | Income Tax Act 2007 (parts B, OB, RC), Tax Administration Act 1994 |
| Depreciation, inventory | Income Tax Act 2007 (parts EE, EB) |
| PAYE, KiwiSaver, ESCT | Income Tax Act 2007 (part RD), KiwiSaver Act 2006 |
| Holidays, employment | Holidays Act 2003, Employment Relations Act 2000, Minimum Wage Act 1983 |
| Records, reporting | Tax Administration Act 1994 (record keeping), Companies Act 1993 (annual return) |

About 25–35 sections across the 15 NZ topics.

## Step 2: Check the site's rules against the law

Go through every rule the site states and check it against its section. Examples: registration thresholds, due dates, the 50% entertainment rule, the low-value asset limit, imputation, shareholder salaries and current accounts, the solvency test for dividends. Fix anything wrong, as with the stock rule, and log each fix in CHANGELOG.

Add a test that every NZ topic has at least one law reference.

To check (raised 2026-11-28, from memory, not yet verified): what limits a shareholder-employee's salary. Candidates are the excessive remuneration to relatives rule (Income Tax Act 2007 s GB 25), the personal services attribution rule (ss GC 14B–14E), and directors' duties not to trade recklessly (Companies Act 1993 ss 135–136). Also the dividend solvency test (Companies Act 1993 ss 4 and 52). The Shareholders topic page should say which apply to Kōwhai.

## Step 3: The April routine

When `npm run rates` flags the new year, use jurisd to see which sections were amended, alongside IRD's announcements. Add this to README "Updating the rates".

## Ground rules

- Figures come from IRD, ACC and Employment NZ. Acts are for wording and references.
- Links always go to legislation.govt.nz, not NZLII.
- Case law is out of scope: a learning site for a café doesn't need it.
- Each check is dated, and anything not confirmed is marked as unconfirmed, never guessed.

## Size

Step 0 is small. Steps 1 and 2 are about the size of the budget tool. Step 3 is a few lines in the README.

## Follow-on: a "pay yourself" tool (proposed, after Step 2)

Raised 2026-11-28: owners of a company like Kōwhai largely set their own salary, so where should the profit go? A tool where Aroha and Ben choose the mix of **shareholder salary** and **dividend**, and see:

- the tax on each route: salary at their personal rates; a dividend with imputation credits for the company's 28%, topped up to their personal rate;
- the total tax, and what each of them keeps;
- the cash left in the company after the tax bill, GST and the loan, and whether it still passes the solvency test.

It waits for Step 2, so the limits it describes (relatives' salaries, personal services attribution, directors' duties, the solvency test) are checked against the Acts first. Figures come from `lib/nz/rates.ts` and the year 2 books.
