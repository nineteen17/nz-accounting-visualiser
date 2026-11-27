# Kōwhai Café: learn NZ accounting

A learning tool that teaches accounting from zero to a full New Zealand small-business year, through one fictional café company (Kōwhai Café Ltd, 31 March balance date). Every screen is worked out in the browser from the café's journal, so the numbers agree everywhere.

Live site: https://nineteen17.github.io/nz-accounting-visualiser/

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npx vitest run     # tests
npm run build      # static site in out/, plus the offline service worker (out/sw.js)
npm run rates      # which tax year the course teaches, and what still needs checking
```

Every push to `master` is tested, built and published to GitHub Pages (`.github/workflows/pages.yml`).

**Offline:** after one visit the whole site is saved on the device, and it can be installed to a phone's home screen ("Add to Home Screen" on iPhone, "Install app" on Android). The footer says "Saved on this device" once it's ready. Each deploy replaces the saved copy on the next visit.

## Updating the rates (each April)

All NZ rates live in **`lib/nz/rates.ts`**. Nothing else needs editing: the lessons, calculators, drills and prose all read from it, and `tests/rates.test.ts` fails if a figure is typed in anywhere else.

The course teaches one income year at a time (`CURRENT_PAYROLL`, now **2026–27**). From **1 April 2027** it's out of date, and you'll know without having to remember:

- the site shows a yellow notice under the header, saying which year the figures are for;
- `npm run build` (locally and in the GitHub Actions log) prints a warning;
- `npm run rates` says "time to update".

**When that happens (on or after 1 April 2027):**

1. Run `npm run rates`. It lists the next year's figures, what's still marked **to confirm** (carried forward because they hadn't been announced), and the official page for each.
2. Check each figure on the official sites (IRD, ACC, Employment NZ) and correct `PAYROLL_2027_28` in `lib/nz/rates.ts`. Empty its `toConfirm` list once everything is checked.
3. Point the course at the new year: `export const CURRENT_PAYROLL = PAYROLL_2027_28;`
4. Update the other figures that change on their own dates: `MINIMUM_WAGE` (1 April), `PROVISIONAL_TAX` use-of-money interest, and `RATES_AS_AT`.
5. Add the following year's set (`PAYROLL_2028_29`) the same way: copy the year before, change what's known (e.g. KiwiSaver goes to 4% on 1 April 2028), and list the rest in `toConfirm`.
6. Run `npx vitest run` and `npm run build`, add a CHANGELOG entry, then push.

The notice and warning disappear by themselves once `CURRENT_PAYROLL` is moved on, and come back the following 1 April.

Don't change `PAYROLL_2026_27`: the café's first year of books uses it. Each café year keeps the rates for its own dates, so new rates never rewrite an earlier year.

## Checking NZ law (for AI assistants)

These are optional and the site doesn't use them. They let Claude Code (or another AI assistant) read NZ law while working on the project. Always confirm against legislation.govt.nz, and IRD's guidance for how a rule is applied.

**Installed (local to this project):**

- **jurisd**: AU/NZ legislation and case law, from AustLII/NZLII. No key needed. Added with `claude mcp add -s local jurisd -- npx -y github:russellbrenner/jurisd`. Not yet tested on NZ tax Acts. Source: [github.com/russellbrenner/jurisd](https://github.com/russellbrenner/jurisd) (Apache-2.0).
- **global-law**: NZ Acts from the [lexifina/new-zealand-law](https://github.com/lexifina/new-zealand-law) data (no tax Acts). Its saved address is missing a letter (`.../mc`), so it doesn't connect. Fix: `claude mcp remove global-law -s local`, then `claude mcp add --transport http -s local global-law https://global-law.lexifina.com/mcp`.

**Alternative: nz-legislation-mcp.** Reads the official legislation.govt.nz API, so it has every current Act, including the Income Tax Act 2007, the Goods and Services Tax Act 1985 and the Tax Administration Act 1994. It needs a free personal API key from the Parliamentary Counsel Office (email contact@pco.govt.nz; see [legislation.govt.nz/developer-api](https://www.legislation.govt.nz/developer-api/)). The key mustn't be shared or committed.

1. Save the key (in PowerShell or Windows Terminal; Git Bash can't hide the typing): `npx -y nz-legislation-mcp setup`
2. Add it: `claude mcp add --transport stdio --scope user nz-legislation -- npx -y nz-legislation-mcp`
3. Check it works: `npx -y nz-legislation-mcp doctor`

Source: [github.com/thatskiff33/nz-legislation-mcp](https://github.com/thatskiff33/nz-legislation-mcp) (Apache-2.0).

## Where things are

- `data/`: the café (business, chart of accounts, the year's transactions, glossary, study drills)
- `lib/engine/`: the accounting engine (ledger, trial balance, statements, closing)
- `lib/nz/`: GST, PAYE, KiwiSaver, ACC, depreciation, provisional tax, and `rates.ts`
- `app/`: the pages; `components/`: the visuals
- `CHANGELOG.md`: what changed and when, plus what's proposed; `docs/STUDY.md`: the study tool's plan and coverage
