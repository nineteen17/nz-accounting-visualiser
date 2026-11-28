import { money, r2 } from "@/lib/money";
import { CURRENT_PAYROLL, HOLIDAYS, PAYS_PER_YEAR, type PayrollRates } from "./rates";

/** Progressive tax on an annual income, plus a bracket-by-bracket breakdown for teaching */
export function progressiveTax(income: number, brackets = CURRENT_PAYROLL.brackets) {
  let prev = 0;
  let total = 0;
  const steps: { from: number; to: number; rate: number; taxable: number; tax: number }[] = [];
  for (const b of brackets) {
    if (income <= prev) break;
    const top = Math.min(income, b.upTo);
    const taxable = top - prev;
    const tax = taxable * b.rate;
    steps.push({ from: prev, to: top, rate: b.rate, taxable, tax });
    total += tax;
    prev = b.upTo;
  }
  return { total, steps };
}

export function ietcFor(annual: number, ietc = CURRENT_PAYROLL.ietc) {
  if (annual < ietc.from || annual > ietc.to) return 0;
  if (annual <= ietc.abateFrom) return ietc.annual;
  return Math.max(0, ietc.annual - (annual - ietc.abateFrom) * ietc.abatementRate);
}

export type TaxCode = "M" | "ME" | "SB" | "S" | "SH" | "ST" | "SA" | "CAE";

/** secondary codes tax every dollar at one bracket's rate: SB is the first bracket, SA the top one */
const B = CURRENT_PAYROLL.brackets, I = CURRENT_PAYROLL.ietc;
const band = (n: number) => (n === 0 ? `under ${money(B[0].upTo, { dp: 0 })}` : B[n].upTo === Infinity ? `over ${money(B[n - 1].upTo, { dp: 0 })}` : `${money(B[n - 1].upTo + 1, { dp: 0 })}–${money(B[n].upTo, { dp: 0 })}`);

export const TAX_CODES: Record<TaxCode, { label: string; flat?: number; explain: string }> = {
  M: { label: "M", explain: "Main job, no independent earner tax credit. Most common code." },
  ME: { label: "ME", explain: `Main job, earning ${money(I.from, { dp: 0 })}–${money(I.to, { dp: 0 })} a year and eligible for the ${money(I.annual, { dp: 0 })}/yr independent earner tax credit (IETC).` },
  SB: { label: "SB", flat: B[0].rate, explain: `Secondary job, total annual income ${band(0)}.` },
  S: { label: "S", flat: B[1].rate, explain: `Secondary job, total annual income ${band(1)}.` },
  SH: { label: "SH", flat: B[2].rate, explain: `Secondary job, total annual income ${band(2)}.` },
  ST: { label: "ST", flat: B[3].rate, explain: `Secondary job, total annual income ${band(3)}.` },
  SA: { label: "SA", flat: B[4].rate, explain: `Secondary job, total annual income ${band(4)}.` },
  CAE: { label: "CAE", flat: B[0].rate, explain: "Casual agricultural employee (short-term harvest workers etc.)." },
};

/** cut to whole cents without rounding, as IRD's payroll rules require ($75.678 → $75.67). The tiny nudge stops 0.29 × 100 = 28.999… losing a cent */
export const truncCents = (x: number) => Math.floor(x * 100 + 1e-6) / 100;

/**
 * PAYE for one pay, including the ACC earners' levy, following IRD's Payroll Calculations & Business Rules
 * Specification 2026–27 (sections 5.2 and 5.3), which payroll software must follow:
 * 1. annual income = pay × pays a year, cents dropped; 2. tax on that (or a flat rate for secondary codes);
 * 3. + the earners' levy; 4. − the IETC (code ME); 5. ÷ 52, cut to cents; 6. × 52 ÷ pays a year, cut to cents.
 * `steps` lists each step with its working, for the PAYE page and the pay run exercise.
 */
export function payeForPay(gross: number, code: TaxCode, paysPerYear = PAYS_PER_YEAR, rates: PayrollRates = CURRENT_PAYROLL) {
  const annual = Math.floor(gross * paysPerYear + 1e-6);
  const flat = TAX_CODES[code].flat;
  const taxAnnual = flat !== undefined ? annual * flat : progressiveTax(annual, rates.brackets).total;
  const accAnnual = annual >= rates.acc.maxLiableEarnings ? rates.acc.maxLiableEarnings * rates.acc.rate : annual * rates.acc.rate;
  const ietcAnnual = code === "ME" ? ietcFor(annual, rates.ietc) : 0;
  const weekly = truncCents((taxAnnual + accAnnual - ietcAnnual) / 52);
  const paye = truncCents((weekly * 52) / paysPerYear);
  // the payslip shows the levy on its own line; it's worked out the same way, and the rest is income tax
  const accLevy = truncCents((truncCents(accAnnual / 52) * 52) / paysPerYear);
  const steps = [
    { label: "Annual income", how: `${money(gross)} × ${paysPerYear}, cents dropped`, value: annual },
    { label: "Tax on the annual income", how: flat !== undefined ? `${money(annual)} × ${(flat * 100).toFixed(1)}% (flat rate for code ${code})` : "the tax brackets", value: taxAnnual },
    { label: "ACC earners' levy for the year", how: `${money(Math.min(annual, rates.acc.maxLiableEarnings))} × ${(rates.acc.rate * 100).toFixed(2)}%`, value: accAnnual },
    ...(code === "ME" ? [{ label: "less the IETC", how: "independent earner tax credit for the year", value: -ietcAnnual }] : []),
    { label: "Per week", how: "÷ 52, cut to whole cents", value: weekly },
    { label: paysPerYear === 26 ? "Per fortnight" : "Per pay", how: `× 52 ÷ ${paysPerYear}, cut to whole cents`, value: paye },
  ];
  return { annualised: annual, taxAnnual, ietcAnnual, accAnnual, incomeTax: r2(paye - accLevy), accLevy, paye, steps };
}

/** student loan for one pay (spec 5.4): gross cut to whole dollars, less the pay period's threshold, × 12%, cut to cents */
export function studentLoanFor(gross: number, rates: PayrollRates = CURRENT_PAYROLL, paysPerYear = PAYS_PER_YEAR) {
  const threshold = paysPerYear === 26 ? rates.studentLoan.fortnightlyThreshold : paysPerYear === 52 ? rates.studentLoan.weeklyThreshold : rates.studentLoan.annualThreshold / paysPerYear;
  return truncCents(Math.max(0, Math.floor(gross + 1e-6) - threshold) * rates.studentLoan.rate);
}

/**
 * ESCT on an employer KiwiSaver contribution (spec 5.21.3): the contribution with its cents dropped × the ESCT rate,
 * cut to cents. IRD's example: $122.50 → $122 × 17.5% = $21.35, so $101.15 goes to the fund.
 */
export function esctOn(employerGross: number, rate: number) {
  return truncCents(Math.floor(employerGross + 1e-6) * rate);
}

/** the ESCT rate band for a year's salary or wages plus the employer's gross contributions (set once for the whole year) */
export function esctRateFor(annualSalaryPlusEmployerContrib: number, bands = CURRENT_PAYROLL.esct) {
  return bands.find((b) => annualSalaryPlusEmployerContrib <= b.upTo)!.rate;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  rate: number;
  code: TaxCode;
  studentLoan: boolean;
  kiwiSaver: number | null; // employee rate, or null if opted out
  casual: boolean; // casual → 8% holiday pay paid with every pay
  irdNumber: string;
}

export interface PayResult {
  employee: Employee;
  hours: number;
  ordinary: number;
  holidayPay: number;
  gross: number;
  incomeTax: number;
  accLevy: number;
  paye: number;
  ietcPerPay: number;
  studentLoan: number;
  ksEmployee: number;
  net: number;
  ksEmployerGross: number;
  esctRate: number;
  esct: number;
  ksEmployerNet: number;
  /** total of all deductions + employer KS (gross) the café must pay IRD */
  toIrd: number;
  employerCost: number;
}

/**
 * One employee's fortnightly pay, calculated the way payroll software must (IRD's payroll specification 2026–27).
 * `rates`: the payroll rates for the income year the pay falls in.
 * `esctRate`: the employee's ESCT rate for the year. IRD sets it once a year, from last year's pay (or, for someone
 * who hasn't worked a full year, the year's expected pay), so the pay runs pass it in. Without it, it's estimated
 * from this pay as if every pay were the same.
 */
export function calcPay(employee: Employee, hours: number, rates: PayrollRates = CURRENT_PAYROLL, esctRate?: number): PayResult {
  const ordinary = r2(hours * employee.rate);
  const holidayPay = employee.casual ? r2(ordinary * HOLIDAYS.payAsYouGoRate) : 0;
  const gross = r2(ordinary + holidayPay);
  const p = payeForPay(gross, employee.code, PAYS_PER_YEAR, rates);
  const studentLoan = employee.studentLoan ? studentLoanFor(gross, rates) : 0;
  const ksEmployee = employee.kiwiSaver ? r2(gross * employee.kiwiSaver) : 0;
  const net = r2(gross - p.paye - studentLoan - ksEmployee);
  const ksEmployerGross = employee.kiwiSaver !== null ? r2(gross * rates.kiwiSaver.employerMinimum) : 0;
  const rate = esctRate ?? esctRateFor((gross + ksEmployerGross) * PAYS_PER_YEAR, rates.esct);
  const esct = ksEmployerGross ? esctOn(ksEmployerGross, rate) : 0;
  const ksEmployerNet = r2(ksEmployerGross - esct);
  const toIrd = r2(p.paye + studentLoan + ksEmployee + ksEmployerGross);
  return {
    employee,
    hours,
    ordinary,
    holidayPay,
    gross,
    incomeTax: p.incomeTax,
    accLevy: p.accLevy,
    paye: p.paye,
    ietcPerPay: r2(p.ietcAnnual / PAYS_PER_YEAR),
    studentLoan,
    ksEmployee,
    net,
    ksEmployerGross,
    esctRate: rate,
    esct,
    ksEmployerNet,
    toIrd,
    employerCost: r2(gross + ksEmployerGross),
  };
}
