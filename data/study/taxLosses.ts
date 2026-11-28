/**
 * Tax losses: does a loss (and do the imputation credits) survive an ownership change, and how much of a loss balance
 * a year's net income uses. Rules from lib/nz/taxLosses.ts, thresholds from lib/nz/rates.ts.
 */
import { carryLosses, continuity, creditsSurvive, lossSurvives, type NewOwnerPlan } from "@/lib/nz/taxLosses";
import { COMPANY_TAX_RATE, LOSS_CONTINUITY } from "@/lib/nz/rates";
import { $, int, mc, num, pct, pick, type Drill, type Question, type Rng } from "./core";

const YES = "Yes", NO = "No";
const P49 = pct(LOSS_CONTINUITY.losses, 0), P66 = pct(LOSS_CONTINUITY.imputation, 0);

const PLANS: Record<NewOwnerPlan, string> = {
  same: "keeps running the same business",
  related: "keeps the business and adds related products",
  major: "closes the business and starts a different one",
};

function question(rng: Rng): Question {
  const r = rng();

  // does the loss survive?
  if (r < 0.4) {
    const a = pick(rng, [50, 55, 60, 70, 80]);
    const before = { a: a / 100, b: (100 - a) / 100 };
    const seller = pick(rng, ["a", "b"] as const);
    const sold = pick(rng, [0.5, 1]);
    const after = { ...before, [seller]: before[seller] * (1 - sold), n: before[seller] * sold };
    const plan = pick(rng, ["same", "related", "major"] as NewOwnerPlan[]);
    const kept = continuity(before, after);
    const v = lossSurvives(kept, plan);
    const who = seller === "a" ? `the ${a}% shareholder` : `the ${100 - a}% shareholder`;
    return mc(rng, v.survives ? YES : NO, [v.survives ? NO : YES],
      `A company with a tax loss has two shareholders, owning ${a}% and ${100 - a}%. ${sold === 1 ? "All" : "Half"} of ${who}'s shares are sold to a new owner, who then ${PLANS[plan]}. Does the loss carry forward?`,
      kept >= LOSS_CONTINUITY.losses
        ? `**Yes.** Counting each person at their lowest holding, ${pct(kept, 0)} has continued: at least ${P49}, so the shareholder continuity test is met (s IA 5). What the new owner does doesn't matter.`
        : `**${v.survives ? "Yes" : "No"}.** Only ${pct(kept, 0)} has continued, under ${P49}, so the business continuity test decides (ss IB 3, IB 4). The new owner ${PLANS[plan]}: ${v.survives ? "no major change, so the loss survives." : "a major change, so the loss is lost."}`);
  }

  // do the imputation credits survive?
  if (r < 0.65) {
    const kept = pick(rng, [0.4, 0.5, 0.6, 0.65, 0.66, 0.7, 0.8]);
    const ok = creditsSurvive(kept);
    return mc(rng, ok ? YES : NO, [ok ? NO : YES],
      `After some shares are sold, the same shareholders have kept ${pct(kept, 0)} of a company throughout. The new owner keeps the business exactly as it was. Do the credits in its imputation credit account survive?`,
      ok
        ? `**Yes.** ${pct(kept, 0)} is at least ${P66} (s OA 8).`
        : `**No.** Imputation credits need ${P66} continuity (s OA 8), and when it's lost they're debited away (s OB 41). The business continuity test only rescues tax losses, not credits.`);
  }

  // how much of the loss is used, and what's left?
  const lossAmt = int(rng, 10, 90) * 1000;
  const income = int(rng, 5, 80) * 1000;
  const [, y] = carryLosses([{ label: "1", netIncome: -lossAmt }, { label: "2", netIncome: income }], COMPANY_TAX_RATE);
  if (rng() < 0.5)
    return num(`A company has a loss balance of ${$(lossAmt)} brought forward. This year its net income is ${$(income)}. What's its taxable income?`,
      y.taxableIncome,
      `The loss comes off first, as far as it goes (s IA 4): ${$(income)} − ${$(y.used)} = **${$(y.taxableIncome)}**.${y.carriedForward > 0 ? ` ${$(y.carriedForward)} of the loss is left to carry forward.` : ""}`);
  return num(`A company has a loss balance of ${$(lossAmt)} brought forward. This year its net income is ${$(income)}. How much loss is carried forward to next year?`,
    y.carriedForward,
    `${$(y.used)} is used against this year's income (as much as it covers, s IA 4), leaving ${$(lossAmt)} − ${$(y.used)} = **${$(y.carriedForward)}** to carry forward.`);
}

export const TAX_LOSSES_DRILLS: Drill[] = [
  { key: "tax-losses", group: "nz", part: 3, title: "Tax losses: does it survive?", icon: "📉", blurb: "Does a loss carry forward after a share sale? Do the imputation credits? And how much of a loss a year uses.", learn: { href: "/explore/tax-losses", label: "Tax losses" }, make: question },
];
