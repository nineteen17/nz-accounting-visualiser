/**
 * Provisional tax: the methods, use-of-money interest (UOMI) and late payment penalties.
 * Pure calculations; Kōwhai's figures are in data/books/provisionalTax.ts. Plan: docs/PROVISIONAL-TAX.md.
 *
 * - Standard (Income Tax Act s RC 6): last year's RIT + 5%, in equal instalments.
 *   RIT under $60,000: no interest until the terminal tax date, even if paid late (Tax Administration Act s 120KE; IR289).
 *   RIT $60,000 or more, earlier instalments on time: interest only from the last instalment date (s 120KBB).
 * - Estimation (s RC 7): the taxpayer's estimate, in equal instalments; interest runs from each instalment date
 *   on the gap between what was paid and an equal share of the actual RIT.
 * - AIM (s RC 7B): software works out each payment from the profit so far; no interest if paid as calculated.
 * - GST ratio (ss RC 11, RC 16): last year's RIT ÷ taxable supplies, × each GST period's taxable supplies.
 * Interest is daily and not compounded (IR289); none when the gap is $100 or less.
 */
import { money, r2 } from "@/lib/money";

const $0 = (x: number) => money(x, { dp: 0 });
import { LATE_PAYMENT_PENALTY, PROVISIONAL_TAX } from "./rates";

export type Rates = { underpaid: number; overpaid: number };
export const DEFAULT_RATES: Rates = { underpaid: PROVISIONAL_TAX.uomiUnderpaid, overpaid: PROVISIONAL_TAX.uomiOverpaid };

const day = 86_400_000;
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / day);
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * day).toISOString().slice(0, 10);

/** splits a total into n instalments of a third (etc.), the last taking the rounding, as the books do */
export function equalInstalments(total: number, n: number) {
  const each = r2(total / n);
  return Array.from({ length: n }, (_, i) => (i < n - 1 ? each : r2(total - each * (n - 1))));
}

/**
 * Interest on a running balance: `events` say what became due and what was paid on each date.
 * Positive balance (underpaid) is charged; negative (overpaid) earns the lower rate. Runs until `until`.
 */
export function interest(events: { date: string; due: number; paid: number }[], until: string, rates: Rates = DEFAULT_RATES) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  let balance = 0, charged = 0, credited = 0;
  const steps: { from: string; to: string; balance: number; days: number; interest: number }[] = [];
  sorted.forEach((e, i) => {
    balance = r2(balance + e.due - e.paid);
    const to = i + 1 < sorted.length ? sorted[i + 1].date : until;
    const days = Math.max(0, daysBetween(e.date, to));
    if (!days || Math.abs(balance) <= PROVISIONAL_TAX.uomiDeMinimis) return;
    const x = (Math.abs(balance) * (balance > 0 ? rates.underpaid : rates.overpaid) * days) / 365;
    if (balance > 0) charged += x; else credited += x;
    steps.push({ from: e.date, to, balance, days, interest: r2(balance > 0 ? x : -x) });
  });
  return { charged: r2(charged), credited: r2(credited), steps };
}

/** the late payment penalty on an amount paid `daysLate` days after it was due: 1%, then 4% of the new amount 7 days later */
export function latePenalty(amount: number, daysLate: number) {
  if (daysLate <= 0 || amount <= 0) return 0;
  const first = amount * LATE_PAYMENT_PENALTY.initial;
  // IR289's example: due 7 May, 1% on 8 May, 4% on 15 May. Paid within 7 days of the due date, there's no 4%
  const second = daysLate > LATE_PAYMENT_PENALTY.secondAfterDays ? (amount + first) * LATE_PAYMENT_PENALTY.second : 0;
  return r2(first + second);
}

export type Instalment = { date: string; amount: number; label: string; paidOn?: string };
export type Plan = {
  method: "standard" | "estimation" | "aim" | "ratio";
  instalments: Instalment[];
  paid: number;
  /** what's left (or refunded, if negative) at the terminal tax date */
  terminal: number;
  interestCharged: number;
  interestCredited: number;
  penalties: number;
  /** a note on how interest was worked out */
  rule: string;
  steps: ReturnType<typeof interest>["steps"];
};

const total = (xs: Instalment[]) => r2(xs.reduce((s, x) => s + x.amount, 0));
const penaltiesOn = (xs: Instalment[]) => r2(xs.reduce((s, x) => s + (x.paidOn ? latePenalty(x.amount, daysBetween(x.date, x.paidOn)) : 0), 0));

/** the standard method: last year's RIT plus the uplift, in equal instalments */
export function standard(input: { lastRit: number; actualRit: number; dates: string[]; terminalDate: string; late?: { index: number; days: number }; rates?: Rates }): Plan {
  const { lastRit, actualRit, dates, terminalDate, late } = input;
  const amounts = equalInstalments(r2(lastRit * (1 + PROVISIONAL_TAX.standardUplift)), dates.length);
  const instalments: Instalment[] = amounts.map((amount, i) => ({
    date: dates[i], amount, label: `Instalment ${i + 1}`,
    paidOn: late && late.index === i && late.days > 0 ? addDays(dates[i], late.days) : undefined,
  }));
  const paid = total(instalments);
  const base = { method: "standard" as const, instalments, paid, terminal: r2(actualRit - paid), penalties: penaltiesOn(instalments) };
  if (actualRit < PROVISIONAL_TAX.safeHarbourRit) {
    return { ...base, interestCharged: 0, interestCredited: 0, steps: [],
      rule: `RIT under ${$0(PROVISIONAL_TAX.safeHarbourRit)}: no interest until the terminal tax date, even on a late instalment (s 120KE). Late payment penalties still apply.` };
  }
  // $60,000 or more: interest from the last instalment date on the whole gap, plus on any earlier instalment for the days it was late (s 120KBB)
  const last = dates[dates.length - 1];
  // an early late instalment: interest for the days it was late
  const lateEvents = instalments.slice(0, -1).filter((x) => x.paidOn).flatMap((x) => [{ date: x.date, due: x.amount, paid: 0 }, { date: x.paidOn!, due: -x.amount, paid: 0 }]);
  const main = interest([{ date: last, due: actualRit, paid }], terminalDate, input.rates);
  const extra = lateEvents.length ? interest(lateEvents, last, input.rates) : { charged: 0, credited: 0, steps: [] };
  return { ...base, interestCharged: r2(main.charged + extra.charged), interestCredited: main.credited, steps: [...extra.steps, ...main.steps],
    rule: `RIT ${$0(PROVISIONAL_TAX.safeHarbourRit)} or more: interest from the last instalment date on the difference (s 120KBB), and on any earlier instalment for the days it was late.` };
}

/** the estimation method: the estimate in equal instalments; interest on each shortfall against an equal share of the actual RIT */
export function estimation(input: { estimate: number; actualRit: number; dates: string[]; terminalDate: string; rates?: Rates }): Plan {
  const { estimate, actualRit, dates, terminalDate } = input;
  const amounts = equalInstalments(Math.max(0, estimate), dates.length);
  const shares = equalInstalments(Math.max(0, actualRit), dates.length);
  const instalments: Instalment[] = amounts.map((amount, i) => ({ date: dates[i], amount, label: `Instalment ${i + 1}` }));
  const paid = total(instalments);
  const i = interest(dates.map((d, k) => ({ date: d, due: shares[k], paid: amounts[k] })), terminalDate, input.rates);
  return { method: "estimation", instalments, paid, terminal: r2(actualRit - paid), interestCharged: i.charged, interestCredited: i.credited, penalties: 0, steps: i.steps,
    rule: "Interest from each instalment date on the gap between what was paid and a third of the actual RIT, until terminal tax (ss 120KB, 120L)." };
}

/** AIM: each payment is the tax on the profit so far, less what's been paid; nothing in a period that adds no profit */
export function aim(input: { periods: { due: string; label: string; taxToDate: number }[]; actualRit: number }): Plan {
  let paidSoFar = 0;
  const instalments: Instalment[] = input.periods.map((p) => {
    const amount = r2(Math.max(0, p.taxToDate - paidSoFar));
    paidSoFar = r2(paidSoFar + amount);
    return { date: p.due, amount, label: p.label };
  });
  const paid = total(instalments);
  return { method: "aim", instalments, paid, terminal: r2(input.actualRit - paid), interestCharged: 0, interestCredited: 0, penalties: 0, steps: [],
    rule: "No interest when each payment is made as the AIM software calculates it (s 120KE)." };
}

/** can this taxpayer use the GST ratio method this year? (s RC 16) */
export function ratioEligibility(input: { lastRit: number; registeredAllLastYear: boolean; beganOperatingLastYear: boolean; gstMonths: number }) {
  const reasons: string[] = [];
  if (input.lastRit <= PROVISIONAL_TAX.ritThreshold || input.lastRit > PROVISIONAL_TAX.ratioMaxRit) reasons.push(`last year's RIT must be over ${$0(PROVISIONAL_TAX.ritThreshold)} and no more than ${$0(PROVISIONAL_TAX.ratioMaxRit)}`);
  if (!input.registeredAllLastYear) reasons.push("it must have been GST-registered for the whole of last year");
  if (input.beganOperatingLastYear) reasons.push("its business must not have begun operating last year (s RC 16(2)(b))");
  if (input.gstMonths > 2) reasons.push("it must file GST monthly or two-monthly this year");
  return { ok: reasons.length === 0, reasons };
}

/** the GST ratio: last year's RIT as a share of last year's taxable supplies, applied to each period's supplies (s RC 11) */
export function ratio(input: { lastRit: number; lastSupplies: number; periods: { due: string; label: string; supplies: number }[]; actualRit: number }): Plan & { ratio: number } {
  const ratioPct = Math.round((input.lastRit / input.lastSupplies) * 1000) / 1000;
  const instalments: Instalment[] = input.periods.map((p) => ({ date: p.due, amount: r2(p.supplies * ratioPct), label: p.label }));
  const paid = total(instalments);
  return { method: "ratio", ratio: ratioPct, instalments, paid, terminal: r2(input.actualRit - paid), interestCharged: 0, interestCredited: 0, penalties: 0, steps: [],
    rule: "Used for the whole year: no interest until the terminal tax date (s 120KE(3))." };
}
