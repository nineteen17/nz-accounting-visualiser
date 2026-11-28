# Plan: ACC levies and the Companies Office fee in the books

Status: **built** 2026-11-29. Decisions taken as recommended, with two changes: the expense account is **606** (next to the other employment costs), and the 2027/28 work levy was found in the regulations ($0.41 per $100, SL 2025/17 schedule 3). Settled while building: the July invoice is due at least 30 days after it's issued (Accident Compensation Act s 168), and IRD's guides confirm the shareholders' earners' levy is invoiced to the company but is theirs, so it goes to their current accounts.

## Why

Kōwhai's books have no ACC levies and no Companies Office annual return fee. A real café pays both, and the year-end checklist currently says so with a "Not in Kōwhai's books" note. This change puts them in, done the way a real NZ company would.

The amounts are small, about $800 a year plus GST. But they teach three things the app doesn't yet:
- an expense that's **invoiced a year late**;
- a **tax timing rule** that differs from the accounts (ITA s EF 3);
- a levy the company pays that **isn't the company's own expense** (the shareholders' earners' levy).

## What the law and ACC say (checked 28 November 2026)

**Who owes which levy**
- **The work levy is the employer's.** Accident Compensation Act s 168. That includes the work levy on Aroha's and Ben's shareholder salaries: s 15 counts a shareholder-employee's salary as their earnings.
- **The earners' levy is the earner's own.** s 219. For Mia and Leo it's already taken off their pay through PAYE. Aroha and Ben have no PAYE taken off their salaries, so ACC invoices it instead. IRD's employer guide (IR335) says it's invoiced to the close company, based on the shareholder salaries declared in its IR4.
- **The working safer levy** is collected by ACC for WorkSafe, on the same earnings.

**Rates.** These come from the ACC Levy Guidebook 2026/27, classification unit 57300 "Cafes and restaurants". They're already in `rates.ts` as `ACC_CAFE_LEVIES` and `ACC_EARNERS_LEVY`.

| Levy | Rate per $100 of liable earnings |
|---|---|
| Work levy | $0.40 + GST |
| Working safer levy | $0.08 + GST |
| Earners' levy | $1.52 + GST (1.75% in PAYE) |

**When the invoices come**
- **Employers:** once a year, around July. Each invoice has two parts:
  - a **final levy** for the year just ended, on the actual payroll IRD passed to ACC, less any provisional levy already charged;
  - a **provisional levy** for the current year, estimated from last year's payroll plus an inflation adjustment.
- **A new business** gets its first invoice only after its first returns are in, usually in its second year.
- **Non-PAYE shareholder-employees:** the levies are invoiced once the company's tax return (with the shareholder salaries) has been filed and IRD has passed the figures to ACC. So for Kōwhai, whose accountant files the 2027 IR4 by 31 March 2028, that invoice falls after year 2 ends.

**Tax: ITA s EF 3.** An ACC levy is deductible in the income year it **becomes due and payable**, not when it's accrued in the accounts. So a levy accrued at 31 March but invoiced in July is added back that year and deducted the next, in the same pattern as holiday pay under s EA 4.

**The earners' levy on shareholder salaries isn't a company expense.** It's Aroha's and Ben's own levy (s 219). When the company pays the invoice, the earners' levy part is charged to their current accounts. Accounting firms agree it isn't deductible to the company (BDS, Giles & Liew). That's secondary sources, so it's to be confirmed against IRD before building.

**The Companies Office fee.** $49.74 + GST ($57.20) a year, from Kōwhai's first annual return in April 2027 (year 2). It's deductible, and its GST can be claimed. Kōwhai's $400 incorporation cost in April 2026 is already in its books.

## What goes in the books

**Year 1 (2026–27)**
- **No ACC invoice arrives**: Kōwhai is new.
- **A new year-end adjustment: accrued ACC levies.** This is the company's own estimate of the 2026/27 work and working safer levies:

  | On | Estimate |
  |---|---|
  | Mia's and Leo's earnings | about $381 |
  | Aroha's and Ben's salaries | about $432 |
  | **Total** | **about $813** (no GST until there's an invoice) |

  It goes to a new expense account, **627 ACC levies**, and to a new liability, **207 ACC levies accrued**, or into 205 Accrued expenses (decision 4).
- **Tax:** the whole accrual is added back (not yet due and payable, s EF 3). So **taxable income, tax, RIT and year 2's provisional tax don't change.** Only year 1's profit and retained earnings fall, by about $813.
- **The earners' levy on Aroha's and Ben's salaries** (about $1,575) isn't accrued, because it's theirs, not the company's. The year 1 statements carry a note about it.

**Year 2 (2027–28)**
- **The Companies Office annual return, April 2027:** $57.20, coded to 620 Licences & council fees, with $7.46 GST claimed.
- **ACC's employer invoice, around July 2027.** It's paid in August, and shows up in GST period 2 or 3. It has two parts:
  - **the final 2026/27 levy** on Mia's and Leo's actual liable earnings, which clears that part of the accrual;
  - **the provisional 2027/28 levy**, at the 2027/28 rates (decision 3).
- **At 31 March 2028, three accruals:**
  - a final wash-up for 2027/28 (the actual levy less the provisional);
  - the shareholder work levy for 2027/28 (about $480);
  - year 1's shareholder work levy, still not invoiced (about $432).
- **Tax:** the deduction is what fell due in year 2, which is the July invoice. The accounts' expense is added back and the invoiced amount is deducted. That's two new lines in the tax reconciliation and the IR4 exercise, in the same shape as the holiday pay pair.
- **The flow-on:** year 2's taxable income, tax, terminal tax and ICA move by a few hundred dollars. Year 3's provisional tax moves with them.

**Year 3 (shown on the year-end checklist only)**
- The shareholder-employee invoice, after the 2027 IR4 is filed.
  - Its work and working safer levies clear the accrual.
  - Its earners' levy is charged to Aroha's and Ben's current accounts.

## What changes

Everything is computed from the books, so most of it follows on its own. The things that need hands:

| Piece | Change |
|---|---|
| `data/chartOfAccounts.ts` | 627 ACC levies; 207 ACC levies accrued (if decision 4 says so) |
| `data/books/year.ts` (year 1) | the accrual adjustment; the tax item that adds it back |
| `data/books/year2.ts` | the annual return fee, the July invoice, the year-end accruals, and the tax items |
| `lib/nz/rates.ts` | the 2027/28 levy rates once confirmed; take them off `toConfirm` |
| The year-end exercise | one more adjustment in each year (13 and 11) |
| The IR4 exercise | the new add-back and deduction items; checks still marked against the learner's own chain |
| The year-end checklist | the "Not in Kōwhai's books" notes become real figures. The ACC item gets the invoice amount and date. A year 3 item is added for the shareholder invoice. |
| `components/usnz/UsVsNz.tsx`, `data/glossary.ts`, `data/memoryAids.ts` | hand-typed figures (tax $16,845.64, terminal tax $13,742, the $5,859.73 instalments) are worked out from the books instead, or rechecked |
| The budget and cash forecast (year 2) | the levy and fee in the forecast, so they don't show as surprise variances |
| Pay yourself | it already charges Aroha's and Ben's ACC personally (`accLevy`); check it now agrees with the books |
| Tests | the pinned figures (`ir4Exercise`, `provisionalTax`) are updated, plus new tests: s EF 3 (year 1 taxable income unchanged, year 2 deduction equals the invoice), the earners' levy to the current accounts, every book still balancing |
| The glossary | new: *ACC work levy*, *provisional levy / final levy*, *liable earnings*. Each with an example and a common mistake. |
| `law.ts` | ITA s EF 3; ACC Act ss 15, 168, 219 |
| Docs | the CHANGELOG, and the IR4, provisional tax and year-end checklist plans where they quote figures |

**Year 1's tax return figures don't change.** That keeps the change contained: the IR4 exercise's year 1, year 2's provisional tax instalments and the provisional tax planner all stay as they are.

## Decisions needed

1. **Put the levies in the way ACC actually invoices them** (recommended). That means accrued at year end, a July invoice with final and provisional parts, and the shareholder invoice after the IR4. The simpler alternative treats every levy as paid in the year it relates to. That's easier to follow, but wrong for a new business and it skips s EF 3, which is the best lesson here.
2. **The shareholders' earners' levy** is charged to their current accounts when the company pays it, never a company expense (recommended). To be confirmed against IRD guidance before building.
3. **The 2027/28 levy rates.** ACC's 2027/28 guidebook isn't out yet. Recommended: check the levy regulations on legislation.govt.nz for the 2027/28 rates before building. If they aren't set, use the 2026/27 rates and keep them in `toConfirm`, the way the 2027–28 tax rates are carried forward now. The provisional levy's inflation adjustment gets the same treatment: ACC's published figure if we can find it, otherwise none, and it's flagged.
4. **Accounts.** Recommended: a new 627 ACC levies expense, and the accrual in the existing **205 Accrued expenses** rather than a new liability account. It's one fewer account, and it's what most small-company accounts do.

## Still to verify before building

- That the company can't deduct the shareholder earners' levy. That's two firms' guidance so far; check IRD.
- The payment terms on an ACC invoice (when the July invoice falls due).
- Whether ITA s EF 3(3) (balance dates between 1 October and 6 April) changes the timing for a levy invoiced in July. It applies only to levies due on provisional or terminal tax dates, so it shouldn't, but check.
- That the GST on the shareholder invoice's earners' levy part isn't claimable by the company.

## Sources

- **Accident Compensation Act 2001:** ss 15, 168, 219 (legislation.govt.nz, read 28 November 2026).
- **Income Tax Act 2007:** s EF 3 (legislation.govt.nz, read 28 November 2026).
- [ACC Levy Guidebook 2026/27](https://www.acc.co.nz/assets/business/Levy-Guidebook-2026-2027.pdf), CU 57300.
- ACC's [understanding your levy invoice](https://www.acc.co.nz/for-business/received-an-invoice/understanding-your-levy-invoice) and [cover for shareholder-employees](https://www.acc.co.nz/for-business/understanding-your-cover-options/shareholder-employee-cover).
- [IRD employer's guide IR335](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir300---ir399/ir335/ir335.pdf): close companies are invoiced the earners' levy on non-PAYE shareholder salaries.
- [business.govt.nz on ACC levies](https://www.business.govt.nz/tax-and-money/guide-to-business-tax/acc-levies): a new business's first invoice.
- Accounting firms (secondary): [BDS](https://www.bdsaccountants.co.nz/resources/guide-acc-levies) and [Giles & Liew](https://gilesandliew.co.nz/tools-resources/tax-facts/acc/).
- [Companies Office fees](https://companies-register.companiesoffice.govt.nz/fees/).

## Size

Bigger than the year-end checklist. It touches both years' books, two exercises and the tax reconciliation, but most pages follow on their own. Most of the work is the year 2 entries, the tests, and rechecking the figures that are typed by hand.
