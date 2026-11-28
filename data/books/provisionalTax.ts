/**
 * Provisional tax planner: Kōwhai's year 2 (the 2028 income year), its first year as a compulsory provisional taxpayer.
 * Every figure comes from the books; the maths is lib/nz/provisionalTax.ts. Plan: docs/PROVISIONAL-TAX.md.
 */
import { balances } from "@/lib/engine/ledger";
import { GST_PERIODS, gstPeriodsFor, gstReturn } from "@/lib/engine/gst";
import { r2 } from "@/lib/money";
import { aim, estimation, ratio, ratioEligibility, standard, type Plan } from "@/lib/nz/provisionalTax";
import { COMPANY_TAX_RATE } from "@/lib/nz/rates";
import { ALL as Y1_ALL } from "./index";
import * as Y2 from "./year2";
import { profitOf } from "./generator";

/** last year's (the 2027 year's) residual income tax: the basis for the standard method */
export const LAST_RIT = Y2.PROVISIONAL.y1Rit;
/** what the 2028 year's RIT turned out to be */
export const ACTUAL_RIT = Y2.TAX.residual;
/** what Kōwhai actually paid (standard method) */
export const BOOKS = Y2.PROVISIONAL;
export const DATES = Y2.PROVISIONAL.instalments.map((i) => i.date);
/** Kōwhai has a tax agent, so the 2028 year's terminal tax is due 7 April 2029 */
export const TERMINAL_DATE = "2029-04-07";

/* the GST periods of each year: AIM and the GST ratio pay on their due dates */
const y1Periods = GST_PERIODS.map((p) => ({ p, r: gstReturn(Y1_ALL, p) }));
const y2Periods = gstPeriodsFor(2027, "Y2").map((p) => ({ p, r: gstReturn(Y2.ALL, p) }));
/** taxable supplies excluding GST: Box 5 less the GST in it */
const supplies = (r: ReturnType<typeof gstReturn>) => r2(r.box5 - r.box8);

/**
 * AIM, approximated: the profit to each GST period's end (from the year's transactions), scaled so the full year comes to the real
 * taxable income. Real AIM software applies the tax adjustments as it goes; the shape (payments follow the profit) is the point.
 */
const yearProfit = profitOf(balances(Y2.DURING_YEAR));
export const AIM_PERIODS = y2Periods.map(({ p }) => {
  const toDate = profitOf(balances(Y2.DURING_YEAR.filter((t) => t.date <= p.to)));
  const taxable = r2(Y2.TAX.taxableIncome * (toDate / yearProfit));
  return { due: p.due, label: p.label, profitToDate: toDate, taxToDate: r2(Math.max(0, Math.floor(taxable)) * COMPANY_TAX_RATE) };
});

/** the GST ratio, as it would be worked out from year 1 (Kōwhai can't use it in year 2: see RATIO_OK) */
export const LAST_SUPPLIES = r2(y1Periods.reduce((s, x) => s + supplies(x.r), 0));
export const RATIO_PERIODS = y2Periods.map(({ p, r }) => ({ due: p.due, label: p.label, supplies: supplies(r) }));
export const RATIO_OK = ratioEligibility({ lastRit: LAST_RIT, registeredAllLastYear: true, beganOperatingLastYear: true, gstMonths: 2 });

export type Method = Plan["method"];
export const METHODS: { key: Method; label: string; blurb: string }[] = [
  { key: "standard", label: "Standard", blurb: "Last year's RIT + 5%, in three instalments. What Kōwhai used." },
  { key: "estimation", label: "Estimation", blurb: "Your own fair and reasonable estimate, in three instalments." },
  { key: "aim", label: "AIM", blurb: "Accounting software works out each payment from the profit so far, every GST period." },
  { key: "ratio", label: "GST ratio", blurb: "A share of each GST period's sales, set by last year's RIT. Not available to Kōwhai yet." },
];

export function plans(input: { actualRit: number; estimate: number; late?: { index: number; days: number } }) {
  const { actualRit, estimate, late } = input;
  // when the year turns out differently, AIM's payments follow the profit in the same proportion
  const scale = ACTUAL_RIT ? actualRit / ACTUAL_RIT : 0;
  return {
    standard: standard({ lastRit: LAST_RIT, actualRit, dates: DATES, terminalDate: TERMINAL_DATE, late }),
    estimation: estimation({ estimate, actualRit, dates: DATES, terminalDate: TERMINAL_DATE }),
    aim: aim({ periods: AIM_PERIODS.map((p) => ({ ...p, taxToDate: r2(p.taxToDate * scale) })), actualRit }),
    ratio: ratio({ lastRit: LAST_RIT, lastSupplies: LAST_SUPPLIES, periods: RATIO_PERIODS, actualRit }),
  };
}
