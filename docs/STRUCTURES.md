# Plan: "Which structure?", sole trader, partnership, company or LTC

Status: **planned, not started** (written 2026-11-28). Follows the pay yourself tool (`docs/PAY-YOURSELF.md`), whose company calculations it reuses.

## The question it answers

Aroha and Ben chose a company. What if they'd run Kōwhai as a **partnership**, or elected for the company to be a **look-through company (LTC)**? And what would a **sole trader** look like if Aroha owned it alone? The tool runs the same café profit through each structure. It shows who pays the tax and on which return, the ACC levies, what the owners keep, what happens in a loss year, and who's liable if the café fails.

The Foundations lesson "Business structures" already has a summary table. This tool puts Kōwhai's own numbers behind it.

## Starting point

Kōwhai's year 2 (the 2028 income year), from the books:

| | |
|---|---|
| Taxable income before any pay to the owners | $175,396 |
| Shares | Aroha 60%, Ben 40% |
| Other income | Ben's IT salary, $90,000 (an assumed figure, already in `data/business.ts`) |
| The company's actual choice | Salaries $65,000 and $35,000; a $20,000 dividend; the rest kept in the company |

Both real years made a profit (year 1 taxable income before salaries was about $150,000). So the tool also has a **"what if the profit were…" slider** that goes down to a loss. That shows the biggest difference between the structures: who can use a loss.

## The structures, as the tool models them

| | Partnership | Company (Kōwhai) | Look-through company | Sole trader (Aroha alone) |
|---|---|---|---|---|
| Who pays income tax | Each partner, on their share (60/40) | The company at 28%; owners on salaries and dividends | Each owner, on their share, as if a partnership | Aroha, on all the profit |
| Returns | IR7 for the partnership, IR3 for each partner | IR4, plus each owner's IR3 | IR7 and IR7L, plus each owner's IR3 | IR3 |
| Paying the owners | Profit share. A working partner's salary is deductible only with a written contract signed by all partners (Income Tax Act s DC 4) | Shareholder salary and dividends (the pay yourself tool) | Profit share. A working owner's salary is deductible with a written employment contract (s DC 3B), and goes through PAYE | Drawings only; no salary to yourself |
| Profit kept in the business | Taxed now at the partners' rates, drawn or not | Taxed at 28% now, and topped up when paid out | Taxed now at the owners' rates, drawn or not | Taxed now at Aroha's rates |
| A loss | Each partner sets their share against other income | Stays in the company, carried forward | Each owner sets their share against other income (the old loss limit, s HB 11, now only applies to an LTC that's a partner with another LTC) | Set against Aroha's other income |
| ACC on the owners | Self-employed: levies on each partner's share of the profit (CoverPlus), invoiced by ACC from the IR3 | Only on shareholder salaries; none on dividends | Active owners are self-employed for ACC on their LTC income; salary through PAYE has the earners' levy deducted | Self-employed, on the whole profit |
| If the café fails | Partners are jointly liable for all the firm's debts (Partnership Law Act s 22), and jointly and severally for wrongs (s 25) | Limited to their shares, **but** Kōwhai's directors personally guaranteed the bank loan (`data/books/april.ts`) | Limited, as for a company | Unlimited: everything Aroha owns |
| Limits | None on numbers | None relevant | 5 or fewer counted owners, with relatives counted as one (s YA 1 definition) | One owner |

**What the numbers should make obvious**

- With Ben on 33% from his IT job, a partnership or LTC taxes his share at 33% straight away. The company can hold profit at 28% until it's paid out. The company's advantage is **deferral, not less tax**.
- In a **loss** year it flips. A partnership or LTC lets Ben set his share of the loss against his IT salary and get PAYE back. The company carries the loss forward until it makes a profit.
- **ACC**: in a partnership or LTC, each active owner's whole share of profit is liable earnings, up to the maximum. A company owner pays ACC only on salary. So moving profit into dividends reduces ACC, but not the tax.
- **Liability**: limited liability is the company's real advantage, and personal guarantees to the bank weaken it.

## Sources checked (28 November 2026)

| Fact | Source |
|---|---|
| Working owners' salaries (LTC) | Income Tax Act s DC 3B, read from legislation.govt.nz |
| Working partners' salaries | s DC 4 (written contract, entered into by all partners) |
| LTC taxed as transparent, except for PAYE, FBT, RWT and similar rules | s HB 1 |
| LTC loss limit only where the LTC is a partner with another LTC | s HB 11(1)(b) |
| At most 5 counted owners, with relatives counted as one | s YA 1, definition of "look-through company" para (d) |
| Partners' liability | Partnership Law Act 2019 ss 22 and 25 (version as at 2 November 2026) |
| LTC: "a separate legal entity but for income tax purposes it's treated like a partnership"; owners can offset its losses | IRD, Look-through companies page |
| LTC owners' ACC: active owners self-employed; working owners' salary has the earners' levy deducted through PAYE | IRD, ACC levies for a look-through company |
| Partnerships: IR7, each partner's IR3, profit shared equally unless the agreement says otherwise | IRD, Income tax for partnerships |
| Levies 2026/27 (excl GST): earners' $1.52 per $100; cafés (CU 57300) work levy $0.40 per $100, the same for employers and self-employed; working safer $0.08 per $100 | ACC Levy Guidebook 2026/27 |

**To confirm before building**
1. ACC's **minimum** liable earnings for full-time self-employed people. It's not in the guidebook, and ACC's own pages only render in a browser. It doesn't change Kōwhai's figures (each owner's share is well above any minimum), so the tool can note it without a number.
2. Whether PAYE applies to a partnership's working-partner salary. The tool doesn't need it: it pays partners a profit share. The page will mention s DC 4 salaries without modelling them.
3. The café work levy for 2027–28, the levy year that matches year 2. The guidebook found is 2026/27. Add it to `rates.ts` with its source; until confirmed, carry 2026/27 forward and mark it to confirm, the same way the 2027–28 tax brackets are handled.

## US differences to flag

- A US **sole proprietorship** files Schedule C, and a **partnership** files Form 1065. Owners also pay **self-employment tax** (Social Security and Medicare, about 15.3%) on their profit. NZ has no such tax: the nearest thing is the **ACC levy** on self-employed earnings, which is much smaller.
- NZ has **no LLC**. The nearest matches are an LTC (pass-through, limited liability) or an ordinary company.
- An LTC is close to an **S corporation**, but with no "reasonable compensation" rule. Instead, salary has to be under a written contract.

## Build

| Piece | File |
|---|---|
| Pure calculations: each structure's tax, ACC and what the owners keep; loss offset against other income | `lib/nz/structures.ts` (reuses `lib/nz/payYourself.ts` for the company and personal tax) |
| Kōwhai's inputs, from the books | `data/books/structures.ts` |
| ACC work levy and working safer levy rates, with sources | `lib/nz/rates.ts` |
| The tool: profit slider (down to a loss), the four structures side by side, liability and paperwork panel, sole-trader toggle | `components/explore/Structures.tsx`, `/explore/structures` |
| The law | `lib/nz/law.ts`: add the Partnership Law Act to `ACTS` and ss DC 3B, DC 4, HB 1 and HB 11, so `npm run law` checks them each April |
| Links from the Foundations "Business structures" lesson, the glossary entries (sole trader, partnership, LTC, US LLC) and the pay yourself tool | existing files |
| Drill: "Which structure?" (who pays the tax, which return, who can use a loss, who's liable, the LTC owner limit, ACC on profit or salary) | `data/study/structures.ts` |
| Tests | `tests/structures.test.ts` |

**Tests:** the company column equals the pay yourself result for the same choice. The partners' shares add up to the profit. A partnership and an LTC with no salaries pay the same income tax. In a loss year, Ben's share of the loss reduces the tax on his IT salary. ACC stops at the maximum liable earnings. The sole trader's tax equals Aroha's personal tax on the whole profit.

## Decisions needed

1. **Sole trader.** Recommended: show it as "if Aroha owned it alone" (a toggle), because a sole trader can't have two owners. The alternative is to leave it out and describe it in words only.
2. **Loss slider.** Recommended: yes, down to about a $60,000 loss. Without it, the main reason people choose an LTC doesn't show.
3. **Year.** Recommended: year 2 only, the same as pay yourself.

## Size

A little bigger than the pay yourself tool: one calculation module, one tool page, one drill, a few `law.ts` and `rates.ts` entries, and tests. Then CHANGELOG and `docs/STUDY.md`.
