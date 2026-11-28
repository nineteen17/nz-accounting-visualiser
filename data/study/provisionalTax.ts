/**
 * Provisional tax: the standard amount, who's interest-free, interest on a shortfall, late payment penalties,
 * and who can use the GST ratio. Rules from lib/nz/provisionalTax.ts and rates from lib/nz/rates.ts.
 */
import { equalInstalments, latePenalty, ratioEligibility } from "@/lib/nz/provisionalTax";
import { LATE_PAYMENT_PENALTY, PROVISIONAL_TAX } from "@/lib/nz/rates";
import { $, $$, int, mc, num, pct, pick, r2, type Drill, type Question, type Rng } from "./core";

const YES = "Yes", NO = "No";

function provQuestion(rng: Rng): Question {
  const r = rng();

  // the standard method
  if (r < 0.2) {
    const last = int(rng, 60, 400) * 100 + int(rng, 0, 99) / 100;
    const total = r2(last * (1 + PROVISIONAL_TAX.standardUplift));
    const first = equalInstalments(total, 3)[0];
    return num(`Last year's residual income tax was ${$(last)}. Under the standard method, how much is each of the three provisional tax instalments?`,
      first,
      `Last year's RIT plus ${pct(PROVISIONAL_TAX.standardUplift, 0)}: ${$(last)} × 1.05 = ${$(total)}, split into three: **${$(first)}** each (the last takes any rounding).`);
  }

  // interest-free?
  if (r < 0.4) {
    const rit = pick(rng, [12_000, 35_000, 58_000, 61_000, 90_000]);
    const method = pick(rng, ["standard", "estimation"] as const);
    const free = method === "standard" && rit < PROVISIONAL_TAX.safeHarbourRit;
    return mc(rng, free ? YES : NO, [free ? NO : YES],
      `A company uses the **${method}** method, pays every instalment on time, and its RIT for the year turns out to be ${$$(rit)}, more than it paid. Is it free of use-of-money interest until the terminal tax date?`,
      free
        ? `Yes. On the standard method with RIT under ${$$(PROVISIONAL_TAX.safeHarbourRit)}, interest only starts at the terminal tax date (Tax Administration Act s 120KE).`
        : method === "standard"
          ? `No. With RIT of ${$$(PROVISIONAL_TAX.safeHarbourRit)} or more, interest runs from the last instalment date on the shortfall (s 120KBB).`
          : "No. Under the estimation method, interest runs from each instalment date on the gap between what was paid and an equal share of the actual RIT.");
  }

  // interest on a shortfall
  if (r < 0.6) {
    const gap = int(rng, 10, 80) * 100;
    const days = pick(rng, [30, 61, 92, 140, 335]);
    const x = r2((gap * PROVISIONAL_TAX.uomiUnderpaid * days) / 365);
    return num(`A provisional taxpayer underpaid by ${$$(gap)} for ${days} days. Use-of-money interest is ${pct(PROVISIONAL_TAX.uomiUnderpaid, 2)} a year. How much interest?`,
      x,
      `Interest is worked out daily and not compounded: ${$$(gap)} × ${pct(PROVISIONAL_TAX.uomiUnderpaid, 2)} × ${days}/365 = **${$(x)}**.`);
  }

  // late payment penalty
  if (r < 0.8) {
    const amount = int(rng, 20, 90) * 100;
    const late = pick(rng, [1, 3, 7, 8, 20]);
    const p = latePenalty(amount, late);
    const second = late > LATE_PAYMENT_PENALTY.secondAfterDays;
    return num(`A ${$$(amount)} provisional tax instalment is paid ${late} day${late > 1 ? "s" : ""} late. What's the late payment penalty?`,
      p,
      `${pct(LATE_PAYMENT_PENALTY.initial, 0)} the day after the due date: ${$(amount * LATE_PAYMENT_PENALTY.initial)}.${second ? ` Still unpaid a week later, so ${pct(LATE_PAYMENT_PENALTY.second, 0)} of the new amount (${$(amount * (1 + LATE_PAYMENT_PENALTY.initial))}): ${$(p - amount * LATE_PAYMENT_PENALTY.initial)}.` : " Paid within the week, so no 4%."} Total **${$(p)}** (Tax Administration Act s 139B).`);
  }

  // the GST ratio
  const cases = [
    { text: "Last year's RIT was $40,000; GST-registered for years; files GST two-monthly", in: { lastRit: 40_000, registeredAllLastYear: true, beganOperatingLastYear: false, gstMonths: 2 } },
    { text: "Last year's RIT was $40,000; the business opened last year; files GST two-monthly", in: { lastRit: 40_000, registeredAllLastYear: true, beganOperatingLastYear: true, gstMonths: 2 } },
    { text: "Last year's RIT was $180,000; GST-registered for years; files GST monthly", in: { lastRit: 180_000, registeredAllLastYear: true, beganOperatingLastYear: false, gstMonths: 1 } },
    { text: "Last year's RIT was $25,000; GST-registered for years; files GST six-monthly", in: { lastRit: 25_000, registeredAllLastYear: true, beganOperatingLastYear: false, gstMonths: 6 } },
  ];
  const c = pick(rng, cases);
  const e = ratioEligibility(c.in);
  return mc(rng, e.ok ? YES : NO, [e.ok ? NO : YES],
    `${c.text}. Can it use the **GST ratio** method this year?`,
    e.ok ? "Yes: RIT between $5,000 and $150,000, registered all last year for an established business, and monthly or two-monthly GST (Income Tax Act s RC 16)." : `No: ${e.reasons.join("; ")}.`);
}

export const PROVISIONAL_TAX_DRILLS: Drill[] = [
  { key: "provisional-tax", group: "nz", part: 3, title: "Provisional tax: methods & interest", icon: "🗓️", blurb: "The standard amount, who's interest-free, interest on a shortfall, late payment penalties, and the GST ratio.", learn: { href: "/explore/provisional-tax", label: "Provisional tax planner" }, make: provQuestion },
];
