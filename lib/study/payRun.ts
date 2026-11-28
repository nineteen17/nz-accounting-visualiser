/**
 * "Do a pay run yourself": the lines of a payslip, in order, each with a plain-English note and its working,
 * marked against the learner's own earlier lines (so one slip doesn't make every line after it wrong).
 * The calculations are IRD's (lib/nz/payroll.ts). Plan: docs/PAY-RUN.md.
 */
import { esctOn, ietcFor, progressiveTax, studentLoanFor, truncCents, type Employee } from "@/lib/nz/payroll";
import { HOLIDAYS, PAYS_PER_YEAR, type PayrollRates } from "@/lib/nz/rates";
import { money } from "@/lib/money";

export type LineKey =
  | "ordinary" | "holiday" | "gross"
  | "annual" | "tax" | "acc" | "ietc" | "weekly" | "paye"
  | "studentLoan" | "ksEmployee" | "net"
  | "ksEmployer" | "esct" | "ksEmployerNet";

export type SlipLine = {
  key: LineKey;
  label: string;
  /** a one-line "what is this?" for a beginner */
  what: string;
  /** part of IRD's PAYE worksheet (filled in by "Use the PAYE tables") */
  payeStep?: boolean;
  /** the right value, worked from the learner's own earlier lines */
  want: number;
  /** how to get it, with the numbers */
  how: string;
};

const pctText = (x: number, dp = 1) => `${(x * 100).toFixed(dp).replace(/\.0+$/, "")}%`;
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The payslip lines for one person, in the order they're filled in. Each `want` uses the learner's own figure for any
 * earlier line they've typed (`typed`), or the right one if they haven't.
 */
export function slipLines(input: {
  employee: Employee; hours: number; rates: PayrollRates; esctRate: number; leave?: boolean;
  typed?: Partial<Record<LineKey, number | null>>;
}): SlipLine[] {
  const { employee: e, hours, rates, esctRate, leave } = input;
  const typed = input.typed ?? {};
  const lines: SlipLine[] = [];
  const v: Partial<Record<LineKey, number>> = {};
  // the learner's figure for a line if they gave one, otherwise the right one
  const got = (k: LineKey) => (typeof typed[k] === "number" && !Number.isNaN(typed[k]) ? (typed[k] as number) : v[k]!);
  const add = (l: Omit<SlipLine, "want"> & { want: number }) => { v[l.key] = l.want; lines.push(l); };
  const n = PAYS_PER_YEAR;
  const first = e.name.split(" ")[0];

  add({ key: "ordinary", label: leave ? "Annual leave pay" : "Ordinary pay", want: r2(hours * e.rate),
    what: leave ? `${first} is on annual leave: paid for the hours normally worked, at the normal rate.` : "The hours worked times the hourly rate.",
    how: `${hours} hrs × ${money(e.rate)} = ${money(r2(hours * e.rate))}` });
  if (e.casual) {
    const h = r2(got("ordinary") * HOLIDAYS.payAsYouGoRate);
    add({ key: "holiday", label: `Holiday pay ${pctText(HOLIDAYS.payAsYouGoRate)}`, want: h,
      what: `${first} is casual, so instead of building up annual leave, ${pctText(HOLIDAYS.payAsYouGoRate)} is added to every pay ("pay-as-you-go").`,
      how: `${money(got("ordinary"))} × ${pctText(HOLIDAYS.payAsYouGoRate)} = ${money(h)}` });
  }
  const gross = r2(got("ordinary") + (e.casual ? got("holiday") : 0));
  add({ key: "gross", label: "Gross pay", want: gross,
    what: "Everything earned this fortnight, before anything is taken off. This is the café's wages expense.",
    how: e.casual ? `${money(got("ordinary"))} + ${money(got("holiday"))} = ${money(gross)}` : `the same as the ordinary pay: ${money(gross)}` });

  // PAYE: IRD's steps (payroll specification 2026–27, sections 5.2–5.3)
  const annual = Math.floor(got("gross") * n + 1e-6);
  add({ key: "annual", label: "PAYE step 1: annual income", payeStep: true, want: annual,
    what: "PAYE is worked out as if every pay this year were like this one. Drop the cents.",
    how: `${money(got("gross"))} × ${n} = ${money(got("gross") * n)}, cents dropped: ${money(annual)}` });
  const tax = progressiveTax(got("annual"), rates.brackets).total;
  add({ key: "tax", label: "PAYE step 2: income tax for the year", payeStep: true, want: tax,
    what: "The tax brackets applied to the annual income: each slice of income is taxed at its own rate.",
    how: progressiveTax(got("annual"), rates.brackets).steps.map((s) => `${money(s.taxable)} × ${pctText(s.rate)}`).join(" + ") + ` = ${money(tax)}` });
  const acc = got("annual") >= rates.acc.maxLiableEarnings ? rates.acc.maxLiableEarnings * rates.acc.rate : got("annual") * rates.acc.rate;
  add({ key: "acc", label: "PAYE step 3: ACC earners' levy for the year", payeStep: true, want: acc,
    what: "Pays for ACC cover of injuries outside work. It's collected with PAYE.",
    how: `${money(got("annual"))} × ${pctText(rates.acc.rate, 2)} = ${money(acc)}` });
  if (e.code === "ME") {
    const ietc = ietcFor(got("annual"), rates.ietc);
    add({ key: "ietc", label: "PAYE step 4: less the IETC", payeStep: true, want: ietc,
      what: `${first}'s tax code is ME, so the independent earner tax credit (IETC) applies: a tax discount for incomes of ${money(rates.ietc.from, { dp: 0 })}–${money(rates.ietc.to, { dp: 0 })}.`,
      how: `the IETC on an annual income of ${money(got("annual"), { dp: 0 })} is ${money(ietc)} for the year` });
  }
  const yearTotal = got("tax") + got("acc") - (e.code === "ME" ? got("ietc") : 0);
  const weekly = truncCents(yearTotal / 52);
  add({ key: "weekly", label: "PAYE step 5: per week", payeStep: true, want: weekly,
    what: "Divide the year's total by 52, then cut it to whole cents. Cut, don't round: $75.678 becomes $75.67.",
    how: `(${money(got("tax"))} + ${money(got("acc"))}${e.code === "ME" ? ` − ${money(got("ietc"))}` : ""}) ÷ 52 = ${(yearTotal / 52).toFixed(4)}, cut: ${money(weekly)}` });
  const paye = truncCents((got("weekly") * 52) / n);
  add({ key: "paye", label: "PAYE (incl. ACC earners' levy)", payeStep: true, want: paye,
    what: "The week's figure turned into a fortnight's, cut to cents again. This is taken off the pay and sent to IRD.",
    how: `${money(got("weekly"))} × 52 ÷ ${n} = ${money(paye)}` });

  if (e.studentLoan) {
    const sl = studentLoanFor(got("gross"), rates);
    add({ key: "studentLoan", label: "Student loan", want: sl,
      what: `${first} has a student loan (code ${e.code} SL): ${pctText(rates.studentLoan.rate)} of gross pay over ${money(rates.studentLoan.fortnightlyThreshold, { dp: 0 })} a fortnight goes to repay it.`,
      how: Math.floor(got("gross") + 1e-6) <= rates.studentLoan.fortnightlyThreshold
        ? `${money(got("gross"))} is under the ${money(rates.studentLoan.fortnightlyThreshold, { dp: 0 })} threshold, so nothing`
        : `(${money(Math.floor(got("gross") + 1e-6), { dp: 0 })} − ${money(rates.studentLoan.fortnightlyThreshold, { dp: 0 })}) × ${pctText(rates.studentLoan.rate)} = ${money(sl)} (gross with the cents dropped)` });
  }
  const ksRate = e.kiwiSaver ?? 0;
  if (e.kiwiSaver) {
    const ks = r2(got("gross") * ksRate);
    add({ key: "ksEmployee", label: `KiwiSaver, ${first}'s ${pctText(ksRate)}`, want: ks,
      what: `${first}'s own retirement savings, taken from the gross pay.`,
      how: `${money(got("gross"))} × ${pctText(ksRate)} = ${money(ks)}` });
  }
  const net = r2(got("gross") - got("paye") - (e.studentLoan ? got("studentLoan") : 0) - (e.kiwiSaver ? got("ksEmployee") : 0));
  add({ key: "net", label: "Net pay (take-home)", want: net,
    what: "What lands in the employee's bank account.",
    how: `${money(got("gross"))} − PAYE ${money(got("paye"))}${e.studentLoan ? ` − student loan ${money(got("studentLoan"))}` : ""}${e.kiwiSaver ? ` − KiwiSaver ${money(got("ksEmployee"))}` : ""} = ${money(net)}` });

  if (e.kiwiSaver !== null) {
    const er = r2(got("gross") * rates.kiwiSaver.employerMinimum);
    add({ key: "ksEmployer", label: `Employer KiwiSaver ${pctText(rates.kiwiSaver.employerMinimum)}`, want: er,
      what: "The café's own contribution, paid ON TOP of the wage. It doesn't come out of the employee's pay.",
      how: `${money(got("gross"))} × ${pctText(rates.kiwiSaver.employerMinimum)} = ${money(er)}` });
    const esct = esctOn(got("ksEmployer"), esctRate);
    add({ key: "esct", label: `ESCT at ${pctText(esctRate)}`, want: esct,
      what: `Tax on the employer's contribution. ${first}'s rate (${pctText(esctRate)}) is set once a year from the year's pay.`,
      how: `${money(got("ksEmployer"))} with the cents dropped: ${money(Math.floor(got("ksEmployer") + 1e-6), { dp: 0 })} × ${pctText(esctRate)} = ${money(esct)}, cut to cents` });
    const erNet = r2(got("ksEmployer") - got("esct"));
    add({ key: "ksEmployerNet", label: "Employer KiwiSaver to the fund", want: erNet,
      what: "What actually reaches the employee's KiwiSaver account from the café.",
      how: `${money(got("ksEmployer"))} − ${money(got("esct"))} = ${money(erNet)}` });
  }
  return lines;
}

/** a typed figure is right to the cent (tax for the year can have half-cents, so allow just under a cent) */
export const isRight = (typed: number | null | undefined, want: number) => typeof typed === "number" && !Number.isNaN(typed) && Math.abs(typed - want) < 0.009;

/** reads a typed money amount: "$1,527.78" → 1527.78; blank → null */
export function readAmount(s: string | undefined): number | null {
  if (s === undefined) return null;
  const t = s.replace(/[$,\s]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

/* progress on this device: the best result per pay run */
export const PROGRESS_KEY = "pay-run-v1";
export type Progress = Record<string, { lines: number; of: number; entry: boolean; filing: number; done: string }>;
type Store = Pick<Storage, "getItem" | "setItem">;
export function loadProgress(store: Store | undefined): Progress {
  try { return JSON.parse(store?.getItem(PROGRESS_KEY) ?? "{}") as Progress; } catch { return {}; }
}
export function saveProgress(store: Store | undefined, key: string, result: Progress[string]) {
  const all = loadProgress(store);
  const prev = all[key];
  const score = (r: Progress[string]) => r.lines + (r.entry ? 5 : 0) + r.filing;
  if (!prev || score(result) >= score(prev)) all[key] = result;
  store?.setItem(PROGRESS_KEY, JSON.stringify(all));
  return all;
}
