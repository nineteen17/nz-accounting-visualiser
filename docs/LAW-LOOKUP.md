# Plan: checking the site against NZ law

Status: **Steps 0 and 1 done** (2026-11-28). The Acts are read directly from legislation.govt.nz; jurisd failed and was removed. Next: Step 2.

**How to read an Act (no key, no server):** fetch any section's page on legislation.govt.nz with a plain `curl -sL`. It redirects to the whole Act (the Income Tax Act 2007 is about 30 MB), with its "Version as at" date. Strip the HTML and search for the section heading, e.g. `EB 23 Valuing closing stock under $10,000`. The web-fetch tool gets "403 Forbidden" from the same site, and NZLII blocks automated access, so use curl.

## Purpose

IRD, ACC and Employment NZ stay the source for **figures and how rules are applied**. The Acts add **the law behind them**: the Act and section each rule comes from, in the Act's own wording. That lets the site say "here's the law" and helps catch mistakes like the trading stock rule (corrected 2026-11-28, see CHANGELOG).

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

### Result (2026-11-28): done

- `lib/nz/law.ts`: 71 sections from 9 Acts, each with its heading, anchor, and a plain-English summary written from the section's text (not from memory). Rates that change each year (the KiwiSaver rate) come from `rates.ts`.
- `components/nz/LawBox.tsx`: a collapsed **⚖️ The law** box on all 14 NZ topic pages, grouped by Act, linking straight to each section, with each Act's "version as at" date.
- `tests/law.test.ts`: every topic has a reference, no unknown topics, links are well formed, no duplicates.
- Found while reading:
  - The "low-turnover trader" definition is in **s EB 13(2)**, not s EB 2 as first recorded. Corrected on the inventory page and in `rates.ts`.
  - Personal services attribution is **ss GB 27–GB 29**. The "GC 14B–14E" in Step 2's to-check list doesn't exist. Its threshold is now $78,100 of net income, and it can't catch a café selling to many customers.
  - The Companies Act's full financial statements (s 196) apply only to large companies, those with 10 or more shareholders, or when shareholders with 5% of the votes ask. Kōwhai only needs IRD's minimum (Tax Administration Act s 21B).

How the sections were found: download each Act once (`curl -sL https://www.legislation.govt.nz/act/public/<year>/<number>/en/latest/`), list the section menu (number, heading, anchor), then read each section's text from its anchor.

## Step 2: Check the site's rules against the law

Go through every rule the site states and check it against its section. Examples: registration thresholds, due dates, the 50% entertainment rule, the low-value asset limit, imputation, shareholder salaries and current accounts, the solvency test for dividends. Fix anything wrong, as with the stock rule, and log each fix in CHANGELOG.

Add a test that every NZ topic has at least one law reference.

To check: what limits a shareholder-employee's salary. The sections are now read and listed on the Shareholders page (GB 25, GB 27, Companies Act ss 4, 52, 135, 136), so Step 2 is to check the page's own wording against them and say which apply to Kōwhai.

## Step 3: The April routine

When `npm run rates` flags the new year, download the Acts again and compare each section in `lib/nz/law.ts` (and each Act's "version as at" date) with what's recorded, alongside IRD's announcements. Add this to README "Updating the rates".

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

## Step 0, second attempt (2026-11-28): pass, by reading legislation.govt.nz directly

| Check | Found in the Act | Matches the site? |
|---|---|---|
| GST Act 1985 s 8 (version as at 30 June 2026) | GST charged "at the rate of 15 %" | Yes |
| GST Act 1985 s 51 | liable to register when supplies over 12 months have "exceeded $60,000" | Yes |
| Income Tax Act 2007 s EB 23 (version as at 4 September 2026) | "a turnover of $1,300,000 or less" and closing stock reasonably estimated at "less than $10,000": closing stock may be valued at its opening value | **No: the site said "under $1.3m". Fixed to "$1,300,000 or less".** |
| Income Tax Act 2007 s EB 13(2), "low-turnover trader" (first recorded as s EB 2 by mistake) | turnover, with associated persons, of "no more than" $3,000,000 | **No: the site said "under $3 million". Fixed.** |

Both fixes came from IRD's page summarising the rule as "less than"; the Act is the authority. Next: Step 1.
