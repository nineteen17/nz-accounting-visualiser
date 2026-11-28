# Plan: "Do the GST return yourself"

Status: **planned, not started** (written 2026-11-28).

## The idea

The app already shows Kōwhai's twelve real GST returns (two years, six two-monthly periods each), box by box, built from the ledger (`/nz/gst-return`). This exercise turns that around: the learner gets a period's documents and fills in the GST101A themselves. It's the GST version of "Do the year-end yourself" (`/study/year-end`), and it's marked against the real return.

## Kōwhai's periods (from the books)

Each period has about 10–14 transactions with GST and 16–31 without. Three periods are special:

| Period | Why it's interesting |
|---|---|
| Year 1, April–May 2026 | A **refund** ($3,031.80): the fit-out and equipment cost more GST than the first sales collected |
| Year 1, February–March 2027 | Two **adjustments**, including the bad debt written off (GST back on the unpaid invoice) |
| Year 2, February–March 2028 | One adjustment, plus year-end entries and a dividend that must stay **out** of the return |

Kōwhai is on the **invoice basis** (`data/business.ts`), so GST goes in the period of the invoice, not the payment.

## The exercise, in three steps

**1. Sort the period's transactions.** Each one shows its source document and amount including GST. The learner puts it in one of four places:
- a **sale** (Box 5);
- a **purchase** with claimable GST (Box 11);
- an **adjustment** (Box 9 for extra GST to pay, Box 13 for GST to claim back);
- **not in the return**.

Every GST transaction in the period is included. Distractors are taken from that period's own non-GST transactions, one of each kind: wages, PAYE to IRD, drawings, a loan repayment, interest received (exempt), bank fees, a depreciation or accrual journal. Every answer comes with its reason, for example:
- Wages aren't a supply.
- Interest is an exempt financial service.
- Loan principal isn't a purchase.
- A dividend isn't a supply.
- Depreciation isn't a transaction with anyone.
- Under the invoice basis, a supplier payment is already counted in the period of its invoice.

**2. Fill in the boxes.** Using their own sorting, the learner types:
- Box 5 (total sales incl GST);
- Box 6 (zero-rated: Kōwhai has none, but it's asked);
- Box 8 (× 3/23);
- Box 9 (debit adjustments);
- Box 11 (purchases incl GST);
- Box 12 (× 3/23);
- Box 13 (credit adjustments);
- Box 15 (to pay or refund).

Each box is marked to the cent, with a hint showing the working. If their sorting was wrong, their boxes are marked against *their* sort as well as the real one. That way a learner who mis-sorts one item isn't marked wrong on every box after it.

**3. Compare with the real return.** The learner's return sits beside Kōwhai's, with differences highlighted and a link to the box-by-box page for that period. Then come the due date and the payment: the 28th of the month after, except 15 January and 7 May.

Progress per period is saved on the device, like the year-end exercise, and "Make it stick" on the GST return page links to it.

## Sources

The box rules and wording are already on `/nz/gst-return`, and the GST rules are checked in `lib/nz/law.ts`: GST Act s 8 (15%), s 14 (exempt supplies, including financial services), s 11 (zero-rating), s 20 (calculating tax payable), s 26 (bad debts). For "not a supply", wages are covered by the definition of taxable activity: it excludes "any engagement, occupation, or employment under any contract of service" (s 6(3)(b), read 28 November 2026; add it to `law.ts`).

**To confirm before building**
1. The current **GST101A box wording**, especially Box 11's "tax invoicing requirements", which may have changed to "taxable supply information" in the 2023 rules. Check against IRD's current GST101A form, and correct `/nz/gst-return` too if it differs.

## US differences to flag

The US has no federal GST or VAT. **State sales tax** is charged only on the final sale to the consumer, and a business gets no credit for tax on its purchases (resale certificates avoid it instead). So there's no equivalent of Boxes 11–14. A US learner's instinct that "tax on purchases is just a cost" is wrong in NZ: input tax is claimed back.

## Build

| Piece | File |
|---|---|
| Pure logic: classify each transaction from its ledger lines (output, input, adjustment, none), pick distractors, mark a sort and a set of boxes | `lib/study/gstReturn.ts` (uses `lib/engine/gst.ts`) |
| The exercise page | `app/study/gst-return/page.tsx`, `components/study/GstReturn.tsx` |
| "Not in the return" reasons, by kind of transaction | in `lib/study/gstReturn.ts`, keyed by account or transaction type |
| Links: the GST return page's "Make it stick" box, the study dashboard, the year-end exercise's neighbour | `components/study/PractiseLinks.tsx`, `components/study/Study.tsx` |
| Tests | `tests/gstReturnExercise.test.ts` |

**Tests:**
- For every one of the twelve periods, the correct sort gives exactly `gstReturn()`'s boxes.
- Every distractor has no GST line.
- Every GST transaction appears exactly once.
- Box 15's sign is right in the refund period.
- Marking against the learner's own sort works.
- Saved progress survives a reload.

## Decisions needed

1. **Which periods**: recommended all twelve, starting with the simplest (year 1 June–July), with the refund and adjustment periods marked "harder".
2. **How many distractors**: recommended about 6–8 per period, one of each kind, rather than all 16–31.
3. **Where it lives**: recommended `/study/gst-return`, beside the year-end exercise.

## Size

Smaller than the year-end exercise: one logic module, one page, tests. Then CHANGELOG and `docs/STUDY.md` (a new exercise, like Y1).
