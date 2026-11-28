/**
 * GST on mixed use: how much GST is claimed on purchase, whether a year's adjustment is needed and how much,
 * the sale adjustment, and which rule applies. Rules from lib/nz/gstMixedUse.ts.
 */
import { adjustments, claimOnPurchase, saleAdjustment, whichRule, type Rule, type Situation } from "@/lib/nz/gstMixedUse";
import { GST, GST_APPORTIONMENT as A } from "@/lib/nz/rates";
import { $, $$, int, mc, num, pct, pick, type Drill, type Question, type Rng } from "./core";

const RULE_LABEL: Record<Rule, string> = {
  full: "Claim all the GST",
  fbt: "Claim all the GST, then FBT on the private use",
  "de-minimis": "Claim all the GST (exempt supplies under the de minimis)",
  "principal-purpose": "All or nothing, on the principal purpose",
  apportion: "Apportion, then adjust each year",
};

function question(rng: Rng): Question {
  const r = rng();

  // claim on purchase
  if (r < 0.3) {
    const cost = pick(rng, [1_800, 3_500, 8_000, 9_900, 12_000, 25_000, 40_000]);
    const use = pick(rng, [0.3, 0.4, 0.6, 0.7, 0.8]);
    const c = claimOnPurchase(cost, use);
    return num(`A GST-registered sole trader buys an item for ${$$(cost)} + GST, expecting to use it ${pct(use, 0)} for the business. How much GST do they claim when they buy it?`,
      c.claim,
      c.rule === "principal-purpose"
        ? `It costs ${$$(A.smallItem)} or less, so it's all or nothing on its principal purpose (s 20(3CB)–(3CD)): ${use > 0.5 ? `mainly business, so all **${$(c.claim)}**` : "not mainly business, so **$0.00**"}.`
        : `It costs over ${$$(A.smallItem)}, so it's apportioned (s 20(3C)): ${$(c.fullGst)} × ${pct(use, 0)} = **${$(c.claim)}**.`);
  }

  // is an adjustment needed this year, and how much
  if (r < 0.6) {
    const cost = pick(rng, [24_000, 30_000, 45_000, 60_000]);
    const intended = pick(rng, [0.5, 0.6, 0.7, 0.8]);
    const actual = Math.min(1, Math.max(0, intended + pick(rng, [-0.2, -0.15, -0.05, 0.05, 0.1, 0.2])));
    const [p] = adjustments(cost, intended, [{ months: 12, use: actual }]);
    const full = cost * GST.rate;
    return num(`A sole trader claimed GST on a ${$$(cost)} + GST vehicle at ${pct(intended, 0)} business use. In the first 12-month adjustment period, it was used ${pct(actual, 0)} for business. What's the adjustment? (Enter a GST payback as a negative number, and 0 if there's none.)`,
      p.amount,
      p.adjusted
        ? `Full GST ${$(full)} × (${pct(actual, 0)} − ${pct(intended, 0)}) = **${p.amount < 0 ? "−" : ""}${$(Math.abs(p.amount))}**${p.amount < 0 ? ", paid back as output tax" : ", an extra claim"} (s 21D).`
        : `**$0.00**: the use moved ${(Math.abs(actual - intended) * 100).toFixed(0)} points, under ${A.minPoints * 100}, and ${$(Math.abs(full * (actual - intended)))} isn't over ${$$(A.minAdjustment)} (s 21(2)).`);
  }

  // the sale
  if (r < 0.8) {
    const price = int(rng, 8, 30) * 1000;
    const prev = pick(rng, [0.5, 0.6, 0.7]);
    const s = saleAdjustment(price, prev);
    return num(`A sole trader sells a car for ${$$(price)} including GST. They'd claimed GST on it at ${pct(prev, 0)} business use. GST is charged on the whole price. What's the final adjustment (the GST they get back)?`,
      s.finalAdjustment,
      `3/23 × ${$$(price)} × (1 − ${pct(prev, 0)}) = **${$(s.finalAdjustment)}** (s 21F). They pay ${$(s.gstOnSale)} GST on the sale, so ${$(s.net)} net.`);
  }

  // which rule
  const cases: { text: string; s: Situation }[] = [
    { text: "A company's car, which a shareholder-employee also uses at weekends", s: { buyer: "company", otherUse: "staff-private", costExcl: 30_000 } },
    { text: "A sole trader's $30,000 + GST car, used partly privately", s: { buyer: "sole-trader", otherUse: "owner-private", costExcl: 30_000 } },
    { text: "A sole trader's $2,000 + GST phone, used partly privately", s: { buyer: "sole-trader", otherUse: "owner-private", costExcl: 2_000 } },
    { text: "A café company whose only exempt income is $400 of bank interest, buying a $15,000 + GST oven", s: { buyer: "company", otherUse: "exempt", exempt: { exemptSupplies: 400, totalSupplies: 450_000 }, costExcl: 15_000 } },
  ];
  const c = pick(rng, cases);
  const rule = whichRule(c.s);
  const others = (Object.keys(RULE_LABEL) as Rule[]).filter((k) => k !== rule && k !== "full").slice(0, 3).map((k) => RULE_LABEL[k]);
  return mc(rng, RULE_LABEL[rule], others,
    `${c.text}. Which GST rule applies?`,
    `**${RULE_LABEL[rule]}.** ${rule === "fbt" ? "For a company, an employee's private use is a fringe benefit: GST is paid on the benefit instead (s 21I)." : rule === "principal-purpose" ? `It costs ${$$(A.smallItem)} or less (s 20(3CB)).` : rule === "de-minimis" ? `Exempt supplies are under the lesser of ${$$(A.exemptDeMinimis.amount)} and ${pct(A.exemptDeMinimis.share, 0)} (s 20(3D)).` : `It costs over ${$$(A.smallItem)} and the private use is the owner's own (s 20(3C), ss 21–21G).`}`);
}

export const GST_MIXED_USE_DRILLS: Drill[] = [
  { key: "gst-mixed-use", group: "nz", part: 3, title: "GST on mixed use: claim how much?", icon: "🚗", blurb: "The claim on purchase, the all-or-nothing rule under $10,000, yearly adjustments, the sale, and which rule applies.", learn: { href: "/explore/gst-mixed-use", label: "GST on mixed use" }, make: question },
];
