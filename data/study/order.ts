/**
 * "Put it in order" drill (O1). The learner sorts steps into the right order.
 * The accounting cycle comes straight from data/cycle.ts; the other sequences are the
 * processes the course teaches (pay runs, GST periods, closing, the tax year).
 */
import { CYCLE_STEPS } from "@/data/cycle";
import { PROVISIONAL_TAX } from "@/lib/nz/rates";
import { int, pick, type Drill, type OrderQ, type Rng } from "./core";

const CYCLE = CYCLE_STEPS.filter((s) => s.slug !== "the-year");

const SEQUENCES: { title: string; items: string[]; explain: string }[] = [
  {
    title: "From source document to the statements",
    items: ["A source document arrives (e.g. a supplier's tax invoice)", "Analyse it: which accounts, debit or credit", "Record it in the journal", "Post it to the ledger", "It shows in the trial balance", "It flows into the financial statements"],
    explain: "Every transaction travels the same path: **document → analyse → journal → ledger → trial balance → statements**.",
  },
  {
    title: "Closing the year",
    items: ["Prepare the financial statements from the adjusted trial balance", "Close every income and expense account to the income summary", "Close the income summary (the profit) to retained earnings", "Check the post-closing trial balance: only balance sheet accounts are left"],
    explain: "The statements are prepared first, from the adjusted balances. Then income and expenses are emptied into the **income summary**, which holds the profit; that goes to **retained earnings**. The post-closing trial balance proves only balance sheet accounts remain.",
  },
  {
    title: "A pay run",
    items: ["Collect the hours worked", "Work out gross pay", "Deduct PAYE, student loan and KiwiSaver", "Pay each employee their net pay", "File the employment information with IRD (within 2 working days)", "Pay the deductions and employer KiwiSaver to IRD (by the 20th of the next month)"],
    explain: "**Hours → gross → deductions → net pay**, then the two IRD deadlines: payday filing within **2 working days**, payment by the **20th of the next month**.",
  },
  {
    title: "A two-monthly GST period",
    items: ["Tax invoices are issued and received during the two months", "The period ends", "Work out output tax minus input tax", "File the GST return and pay IRD (usually by the 28th of the next month)", "Record the payment: debit GST, credit bank"],
    explain: "GST builds up in the GST account during the period; after it ends, the return nets **output tax − input tax**, and paying it clears the account.",
  },
  {
    title: "Kōwhai's tax year (31 March balance date, with a tax agent)",
    items: [`First provisional tax instalment (${PROVISIONAL_TAX.instalments[0]})`, `Second provisional tax instalment (${PROVISIONAL_TAX.instalments[1]})`, "Balance date (31 March)", `Third provisional tax instalment (${PROVISIONAL_TAX.instalments[2]})`, "File the IR4 income tax return (by 31 March the following year)", "Pay the terminal tax (7 April the following year)"],
    explain: "Two instalments fall **before** balance date and the third **after** it (7 May). With a tax agent, the IR4 is due 31 March the next year and terminal tax 7 April.",
  },
];

function orderQ(rng: Rng): OrderQ {
  if (rng() < 0.4) {
    const n = int(rng, 5, 6), start = int(rng, 0, CYCLE.length - n);
    const steps = CYCLE.slice(start, start + n);
    return {
      kind: "order",
      prompt: "Put these steps of the **accounting cycle** in order.",
      items: steps.map((s) => s.title),
      explain: `The cycle runs ${steps.map((s) => `**${s.n}. ${s.short}**`).join(" → ")}. Steps 1–4 happen all year; steps 5–11 at year end. Memory aid: the cycle-order card in Memory aids.`,
    };
  }
  const s = pick(rng, SEQUENCES);
  return { kind: "order", prompt: `Put these in order: **${s.title}**.`, items: s.items, explain: s.explain };
}

export const ORDER_DRILLS: Drill[] = [
  { key: "order", group: "classify", part: 2, title: "Put it in order", icon: "🔢", length: 5, blurb: "The accounting cycle, a transaction's journey, closing, a pay run, a GST period and the tax year.", learn: { href: "/cycle", label: "The accounting cycle" }, make: orderQ },
];
