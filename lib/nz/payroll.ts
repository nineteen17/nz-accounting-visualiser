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

/** PAYE for one pay (includes the ACC earners' levy, like IRD's PAYE tables) */

export function payeForPay(gross: number, code: TaxCode, paysPerYear = PAYS_PER_YEAR, rates: PayrollRates = CURRENT_PAYROLL) {
  const annual = gross * paysPerYear;
  const accAnnual = Math.min(annual, rates.acc.maxLiableEarnings) * rates.acc.rate;
  const flat = TAX_CODES[code].flat;
  const taxAnnual = flat !== undefined ? annual * flat : progressiveTax(annual, rates.brackets).total;
  const ietcAnnual = code === "ME" ? ietcFor(annual, rates.ietc) : 0;
  const incomeTax = r2((taxAnnual - ietcAnnual) / paysPerYear);
  const accLevy = r2(accAnnual / paysPerYear);
  return {
    annualised: annual,
    taxAnnual,
    ietcAnnual,
    accAnnual,
    incomeTax,
    accLevy,
    paye: r2(incomeTax + accLevy),
  };
}

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

/** One employee's fortnightly pay, calculated the way payroll software does it */
/** `rates`: the payroll rates for the income year the pay falls in */
export function calcPay(employee: Employee, hours: number, rates: PayrollRates = CURRENT_PAYROLL): PayResult {
  const ordinary = r2(hours * employee.rate);
  const holidayPay = employee.casual ? r2(ordinary * HOLIDAYS.payAsYouGoRate) : 0;
  const gross = r2(ordinary + holidayPay);
  const p = payeForPay(gross, employee.code, PAYS_PER_YEAR, rates);
  const studentLoan = employee.studentLoan
    ? r2(Math.max(0, gross - rates.studentLoan.fortnightlyThreshold) * rates.studentLoan.rate)
    : 0;
  const ksEmployee = employee.kiwiSaver ? r2(gross * employee.kiwiSaver) : 0;
  const net = r2(gross - p.paye - studentLoan - ksEmployee);
  const ksEmployerGross = employee.kiwiSaver !== null ? r2(gross * rates.kiwiSaver.employerMinimum) : 0;
  const esctRate = esctRateFor(gross * PAYS_PER_YEAR + ksEmployerGross * PAYS_PER_YEAR, rates.esct);
  const esct = r2(ksEmployerGross * esctRate);
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
    esctRate,
    esct,
    ksEmployerNet,
    toIrd,
    employerCost: r2(gross + ksEmployerGross),
  };
}
