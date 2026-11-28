/**
 * Deferred tax: temporary or permanent, which way a difference goes, and its deferred tax at 28%.
 * Uses the lines of Kōwhai's own tax reconciliations (data/books/deferredTax.ts) plus a few common NZ items.
 */
import { DEFERRED_YEARS } from "@/data/books/deferredTax";
import { COMPANY_TAX_RATE } from "@/lib/nz/rates";
import { $, int, mc, num, pct, pick, r2, type Drill, type Question, type Rng } from "./core";

const TEMP = "Temporary" as const, PERM = "Permanent" as const;
const DTL = "Deferred tax liability", DTA = "Deferred tax asset";
const RATE = pct(COMPANY_TAX_RATE, 0);

/** items from both years' reconciliations, plus some that aren't in Kōwhai's books */
const ITEMS: { label: string; kind: typeof TEMP | typeof PERM; why: string }[] = [
  ...DEFERRED_YEARS.flatMap((y) => y.items.map((i) => ({
    label: i.label.replace(/^(Add back|Less|Add): /, ""),
    kind: i.kind === "permanent" ? PERM : TEMP,
    why: i.why,
  }))),
  { label: "a speeding fine", kind: PERM, why: "Fines are never deductible, in any year." },
  { label: "a bonus accrued at year end, paid 4 months later", kind: TEMP, why: "Paid after the 63 days in s EA 4, so it's deducted the next year, when it's paid. Same total, different timing." },
  { label: "income tax expense itself", kind: PERM, why: "Income tax is never a deduction against itself." },
  { label: "a doubtful debts allowance", kind: TEMP, why: "Tax deducts a bad debt only when it's written off. The allowance is deducted later, when the debts are written off, or reverses if they're paid." },
];
const unique = [...new Map(ITEMS.map((i) => [i.label, i])).values()];

function question(rng: Rng): Question {
  const r = rng();

  // temporary or permanent?
  if (r < 0.45) {
    const i = pick(rng, unique);
    return mc(rng, i.kind, [i.kind === TEMP ? PERM : TEMP],
      `In a tax reconciliation, is **${i.label}** a temporary or a permanent difference?`,
      `**${i.kind}**. ${i.why}${i.kind === PERM ? " No deferred tax: there's nothing to reverse." : ""}`);
  }

  // which way does it go?
  if (r < 0.75) {
    const c = pick(rng, [
      { what: "Equipment has a book value of $12,000 and a tax value of $9,600.", ans: DTL, why: "Tax has already deducted more of its cost than the accounts. Later the tax deductions are smaller than the accounts' depreciation, so more tax is payable later." },
      { what: "Holiday pay of $3,500 is accrued at year end and paid out next year.", ans: DTA, why: "The accounts have expensed it; tax deducts it next year when it's paid. That's a deduction still to come: less tax later." },
      { what: "An ACC levy of $600 is accrued at year end; ACC invoices it in July.", ans: DTA, why: "Deductible when it's invoiced (s EF 3), after the accounts expensed it: a deduction still to come." },
      { what: "A new asset gets Investment Boost, so its tax value is well below its book value.", ans: DTL, why: "Investment Boost brings the deduction forward. Later years' tax deductions are smaller, so more tax is payable later." },
      { what: "A doubtful debts allowance of $800 is in the accounts; none of the debts has been written off.", ans: DTA, why: "The accounts have expensed it; tax deducts the debts only when they're written off. A deduction still to come." },
    ]);
    return mc(rng, c.ans, [c.ans === DTL ? DTA : DTL],
      `${c.what} Under the deferred tax method, does this give a deferred tax asset or a deferred tax liability?`,
      `**${c.ans}**. ${c.why}`);
  }

  // how much?
  const diff = int(rng, 8, 120) * 50;
  const kind = pick(rng, ["taxable", "deductible"] as const);
  const dt = r2(diff * COMPANY_TAX_RATE);
  return num(`A company has a ${kind} temporary difference of ${$(diff)}. At the company tax rate of ${RATE}, what's the deferred tax?`,
    dt,
    `${$(diff)} × ${RATE} = **${$(dt)}**, a deferred tax ${kind === "taxable" ? "liability (more tax later)" : "asset (less tax later)"}.`);
}

export const DEFERRED_TAX_DRILLS: Drill[] = [
  { key: "deferred-tax", group: "nz", part: 3, title: "Deferred tax: temporary or permanent?", icon: "⚖️", blurb: "Sort tax reconciliation items, tell a deferred tax asset from a liability, and work out the deferred tax.", learn: { href: "/explore/deferred-tax", label: "Tax: accounts vs return" }, make: question },
];
